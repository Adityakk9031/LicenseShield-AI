/**
 * LicenseShield AI — Agent-to-Agent (A2A) SDK
 * ============================================
 *
 * Zero-config TypeScript client that lets a coding agent (Claude, Cursor,
 * Copilot, a CI job, or any autonomous script) run paid license + CVE audits
 * against a LicenseShield deployment without handling any of the payment
 * plumbing itself.
 *
 * Two auth paths, one call:
 *   • Model A (SaaS)     — Bearer `ls_live_*` API key. Quota on server.
 *   • Model B (Web3)     — $0.01 USDC escrow lock on Base Sepolia, bound to
 *                          the exact request body via keccak256 payload hash.
 *
 * Usage:
 *   const shield = new LicenseShieldClient({ baseUrl, apiKey });
 *   const report = await shield.audit({ packages: ['axios@1.6.0'] });
 *   if (report.status === 'FLAGGED') { /* block install *\/ }
 */

// ── Minimal ethers import (peer-free: re-exports what the SDK needs) ──────────
import { ethers } from 'ethers';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PackageInput {
  name: string;
  version?: string;
}

export type PackageSpec = string | PackageInput; // 'axios@1.6.0' or { name, version }

export interface AuditRequest {
  packages: PackageSpec[];
  targetLicense?: string; // default 'MIT'
  agentId?: string;
  repository?: string;
}

export interface RiskItem {
  package: string;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  detail: string;
}

export interface AuditReport {
  auditId: string;
  status: 'APPROVED' | 'FLAGGED';
  reason: string;
  suggestedAlternatives: string[];
  risks: RiskItem[];
  authModel: 'ModelA_SaaS' | 'ModelB_Web3' | null;
  settlementTxHash: string | null;
  scannedAt: string;
}

export interface VerifyRequest {
  packages?: PackageSpec[];
  command?: string; // e.g. 'npm install express cors'
  agentId?: string;
  repository?: string;
  targetPolicy?: string;
}

export interface VerifyResponse {
  auditId: string;
  agentId: string;
  repository: string;
  targetPolicy: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number;
  executionProof: string;
  latencyMs: number;
  authModel: string;
  details: Array<{
    package: string;
    version: string;
    license: string;
    status: 'APPROVED' | 'FLAGGED';
    riskType: string;
    vulnerabilitiesCount: number;
    vulnerabilities: Array<{ id: string; summary: string }>;
    conflictDetail: string | null;
  }>;
  explanation: string;
  recommendation: string;
  verifiedAt: string;
}

export interface EscrowInfo {
  escrowAddress: string;
  usdcAddress: string;
  feeRaw: bigint; // 10000n = $0.01 USDC (6 decimals)
  network: 'eip155:84532';
}

export interface LicenseShieldConfig {
  baseUrl: string;
  apiKey?: string; // Model A
  signerKey?: string; // Model B
  escrowAddress?: string;
  usdcAddress?: string;
  rpcUrl?: string;
  timeoutMs?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const DEFAULT_TIMEOUT_MS = 120_000;

const ERC20_ABI = ['function approve(address spender, uint256 amount) returns (bool)', 'function allowance(address owner, address spender) view returns (uint256)'];

const ESCROW_ABI = [
  'function auditFee() view returns (uint256)',
  'function lockAuditFee(bytes32 auditId, bytes32 payloadHash)',
];

// ── Errors ────────────────────────────────────────────────────────────────────

export class LicenseShieldError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'LicenseShieldError';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalize 'axios@1.6.0' → { name: 'axios', version: '1.6.0' }, respecting scoped packages. */
export function parsePackageSpec(spec: PackageSpec): PackageInput {
  if (typeof spec !== 'string') return { name: spec.name, version: spec.version };
  const atIdx = spec.lastIndexOf('@');
  if (atIdx > 0) {
    return { name: spec.slice(0, atIdx), version: spec.slice(atIdx + 1) };
  }
  return { name: spec };
}

function randomAuditId(): string {
  const bytes = ethers.randomBytes(16);
  return ethers.hexlify(bytes);
}

// ── Main client ───────────────────────────────────────────────────────────────

export class LicenseShieldClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly signerKey?: string;
  private readonly rpcUrl: string;
  private readonly timeoutMs: number;
  private escrowAddress?: string;
  private usdcAddress: string;
  private cachedFee?: bigint;
  private cachedChainInfo?: EscrowInfo;

  constructor(config: LicenseShieldConfig) {
    if (!config?.baseUrl) throw new LicenseShieldError('baseUrl is required');
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.signerKey = config.signerKey;
    this.rpcUrl = config.rpcUrl || BASE_SEPOLIA_RPC;
    this.timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.escrowAddress = config.escrowAddress;
    this.usdcAddress = config.usdcAddress || BASE_SEPOLIA_USDC;

    if (!this.apiKey && !this.signerKey) {
      throw new LicenseShieldError('Provide either `apiKey` (Model A) or `signerKey` (Model B)');
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Full paid audit. Uses Model A (API key) if configured, otherwise Model B
   * (on-chain escrow lock + call). Throws LicenseShieldError on payment or
   * transport failure.
   */
  async audit(req: AuditRequest): Promise<AuditReport> {
    const targetLicense = req.targetLicense || 'MIT';

    // Serialize once so the escrow payload hash and the sent body match byte-for-byte.
    const body = JSON.stringify({
      dependencies: req.packages.map(parsePackageSpec),
      targetLicense,
      agentId: req.agentId,
      repository: req.repository,
      auditId: randomAuditId(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let authModel: 'ModelA_SaaS' | 'ModelB_Web3';

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      authModel = 'ModelA_SaaS';
    } else {
      // Model B — on-chain lock bound to the exact body bytes.
      await this.lockEscrow(body);
      headers['X-Audit-ID'] = this.extractAuditId(body);
      authModel = 'ModelB_Web3';
    }

    const report = (await this.http('POST', '/api/v1/audit', body, headers)) as AuditReport;

    // Trust the backend's own labeling, but keep ours as a fallback.
    return { ...report, authModel: report.authModel || authModel };
  }

  /**
   * Sandbox / pre-flight check. Free but rate-limited per IP on the backend.
   * Pass an apiKey to run it against your quota instead of sandbox limits.
   */
  async verify(req: VerifyRequest): Promise<VerifyResponse> {
    const body = JSON.stringify({
      packages: req.packages?.map(parsePackageSpec),
      command: req.command,
      agentId: req.agentId || 'license-shield-sdk',
      repository: req.repository,
      targetPolicy: req.targetPolicy,
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    return (await this.http('POST', '/api/v1/verify', body, headers)) as VerifyResponse;
  }

  /** Reads `auditFee()` from escrow and converts the 6-decimal USDC fee to USD. */
  async estimateCost(): Promise<{ feeUsd: number; token: string; network: string }> {
    const escrow = this.escrowAddress || this.cachedChainInfo?.escrowAddress;
    if (!escrow) throw new LicenseShieldError('escrowAddress unknown — configure it or make one Web3 call first');
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const contract = new ethers.Contract(escrow, ['function auditFee() view returns (uint256)'], provider);
    const fee = await contract.auditFee();
    return { feeUsd: Number(ethers.formatUnits(fee, 6)), token: 'USDC', network: 'base-sepolia' };
  }

  // ── Model B internals ───────────────────────────────────────────────────────

  /**
   * Locks the audit fee on-chain, bound to keccak256 of the exact body bytes
   * that will be sent to the API. This is what makes the $0.01 lock
   * non-replayable: the backend recomputes the hash over the received body.
   */
  private async lockEscrow(body: string): Promise<void> {
    const { escrow, feeRaw } = await this.resolveEscrow();

    const payloadHash = ethers.id(body); // keccak256(utf8Bytes(body))
    const auditId = this.extractAuditId(body);
    const bytes32AuditId = ethers.id(auditId); // same canonicalization the backend uses

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const wallet = new ethers.Wallet(this.signerKey!, provider);
    const usdc = new ethers.Contract(this.usdcAddress, ERC20_ABI, wallet);
    const escrowC = new ethers.Contract(escrow, ESCROW_ABI, wallet);

    // Approve exactly the fee if current allowance is insufficient.
    const allowance = (await usdc.allowance(wallet.address, escrow)) as bigint;
    if (allowance < feeRaw) {
      const approveTx = await usdc.approve(escrow, feeRaw);
      await approveTx.wait(1);
    }

    const lockTx = await escrowC.lockAuditFee(bytes32AuditId, payloadHash);
    await lockTx.wait(1);
  }

  /** Resolve escrow address + fee — from config, cache, or the backend 402. */
  private async resolveEscrow(): Promise<{ escrow: string; feeRaw: bigint }> {
    if (this.escrowAddress && this.cachedFee) {
      return { escrow: this.escrowAddress, feeRaw: this.cachedFee };
    }

    if (this.escrowAddress && !this.cachedFee) {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl);
      const c = new ethers.Contract(this.escrowAddress, ['function auditFee() view returns (uint256)'], provider);
      this.cachedFee = (await c.auditFee()) as bigint;
      return { escrow: this.escrowAddress, feeRaw: this.cachedFee };
    }

    // Learn escrow config from the backend's 402 challenge.
    try {
      await this.http('POST', '/api/v1/audit', '{}', { 'Content-Type': 'application/json' });
    } catch (err) {
      const challenge = err as LicenseShieldError;
      const instructions = (challenge.body as { paymentInstructions?: { contractAddress?: string } })
        ?.paymentInstructions;
      const addr = instructions?.contractAddress;

      if (!addr || addr === '0x0000000000000000000000000000000000000000') {
        throw new LicenseShieldError(
          'Backend 402 response did not include a usable escrow contract address. Configure `escrowAddress` explicitly.',
          challenge.httpStatus,
          challenge.body
        );
      }

      this.escrowAddress = addr;
      const provider = new ethers.JsonRpcProvider(this.rpcUrl);
      const c = new ethers.Contract(addr, ['function auditFee() view returns (uint256)'], provider);
      this.cachedFee = (await c.auditFee()) as bigint;
      return { escrow: addr, feeRaw: this.cachedFee };
    }

    // Unreachable in practice: an unauthenticated call must 402.
    throw new LicenseShieldError('Expected HTTP 402 challenge from backend but got an authorized response.');
  }

  private extractAuditId(body: string): string {
    const parsed = JSON.parse(body) as { auditId: string };
    return parsed.auditId;
  }

  // ── HTTP ────────────────────────────────────────────────────────────────────

  private async http(
    method: 'POST',
    path: string,
    body: string,
    headers: Record<string, string>
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: method === 'POST' ? body : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      if (!res.ok) {
        throw new LicenseShieldError(
          `LicenseShield ${path} failed: HTTP ${res.status}`,
          res.status,
          json
        );
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default LicenseShieldClient;
