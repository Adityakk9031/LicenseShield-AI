/**
 * LicenseShield AI — Agent-to-Agent (A2A) SDK (@licenseshield/sdk)
 * ================================================================
 *
 * High-performance TypeScript client that lets an AI coding agent (Cursor,
 * Claude Code, Gemini CLI, Copilot, or custom autonomous pipeline) run
 * real-time license, hallucination, typosquatting, and CVE checks.
 *
 * Three payment/auth modes, one unified API:
 *   • Model A (SaaS)             — Bearer `ls_live_*` API key (Stripe subscription).
 *   • Model B1 (EIP-712 Vault)   — Pre-funded Base Sepolia USDC Deposit Vault +
 *                                  zero-latency off-chain EIP-712 cryptographic signature (<1ms).
 *   • Model B2 (On-Chain Escrow) — Per-scan $0.01 USDC on-chain lock bound to
 *                                  keccak256(rawBody).
 */

import { ethers } from 'ethers';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PackageInput {
  name: string;
  version?: string;
}

export type PackageSpec = string | PackageInput;

export interface AuditRequest {
  packages: PackageSpec[];
  targetLicense?: string;
  command?: string;
  agentId?: string;
  repository?: string;
}

export interface RiskItem {
  package: string;
  type: 'LICENSE' | 'VULNERABILITY' | 'HALLUCINATION' | 'TYPOSQUATTING' | 'DEPRECATED' | string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  detail: string;
  suggestedReplacement?: string;
}

export interface AutoCorrectionPlan {
  canAutoFix: boolean;
  blockedPackages: string[];
  replacements: Record<string, string>;
  remediationCommand: string | null;
  agentInstruction: string;
}

export interface AuditReport {
  auditId: string;
  status: 'APPROVED' | 'FLAGGED';
  reason: string;
  suggestedAlternatives: string[];
  risks: RiskItem[];
  autoCorrection?: AutoCorrectionPlan;
  authModel: 'ModelA_SaaS' | 'ModelB_Web3' | 'ModelB_EIP712_Vault' | null;
  settlementTxHash: string | null;
  scannedAt: string;
}

export interface VerifyRequest {
  packages?: PackageSpec[];
  command?: string;
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
    existsOnRegistry?: boolean;
    deprecated?: string | null;
    suggestedReplacement?: string | null;
    status: 'APPROVED' | 'FLAGGED';
    riskType:
      | 'NONE'
      | 'TYPOSQUATTING_RISK'
      | 'HALLUCINATED_PACKAGE'
      | 'COPYLEFT_VIOLATION'
      | 'CRITICAL_CVE'
      | 'DEPRECATED_PACKAGE'
      | 'UNKNOWN_LICENSE'
      | string;
    vulnerabilitiesCount: number;
    vulnerabilities: Array<{ id: string; summary: string }>;
    conflictDetail: string | null;
  }>;
  autoCorrection?: AutoCorrectionPlan;
  explanation: string;
  recommendation: string;
  verifiedAt: string;
}

export interface Eip712VoucherPayload {
  buyer: string;
  auditId: string;
  payloadHash: string;
  fee: string;
  deadline: number;
}

export interface LicenseShieldConfig {
  baseUrl: string;
  apiKey?: string; // Model A
  signerKey?: string; // Model B (EIP-712 Vault or On-Chain Escrow)
  paymentMode?: 'eip712-voucher' | 'onchain-lock'; // default: 'eip712-voucher'
  escrowAddress?: string;
  usdcAddress?: string;
  rpcUrl?: string;
  timeoutMs?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
export const BASE_SEPOLIA_CHAIN_ID = 84532;
const DEFAULT_TIMEOUT_MS = 120_000;

export const EIP712_VOUCHER_TYPES = {
  AuditVoucher: [
    { name: 'buyer', type: 'address' },
    { name: 'auditId', type: 'bytes32' },
    { name: 'payloadHash', type: 'bytes32' },
    { name: 'fee', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const ESCROW_ABI = [
  'function auditFee() view returns (uint256)',
  'function vaultBalances(address agent) view returns (uint256)',
  'function depositVault(uint256 amount)',
  'function withdrawVault(uint256 amount)',
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
  const trimmed = spec.trim();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx > 0) {
    return { name: trimmed.slice(0, atIdx), version: trimmed.slice(atIdx + 1) };
  }
  return { name: trimmed };
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
  private readonly paymentMode: 'eip712-voucher' | 'onchain-lock';
  private readonly rpcUrl: string;
  private readonly timeoutMs: number;
  private escrowAddress?: string;
  private usdcAddress: string;
  private cachedFee?: bigint;

  constructor(config: LicenseShieldConfig) {
    if (!config?.baseUrl) throw new LicenseShieldError('baseUrl is required');
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.signerKey = config.signerKey;
    this.paymentMode = config.paymentMode || 'eip712-voucher';
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
   * Full paid audit.
   * - Uses Model A (Bearer API key) if `apiKey` is provided.
   * - Uses Model B1 (EIP-712 cryptographic signature in <1ms) by default when `signerKey` is provided.
   * - Uses Model B2 (On-chain escrow lock) when `paymentMode: 'onchain-lock'`.
   */
  async audit(req: AuditRequest): Promise<AuditReport> {
    const targetLicense = req.targetLicense || 'MIT';

    // Serialize once so the payload hash and the sent body match byte-for-byte.
    const body = JSON.stringify({
      dependencies: req.packages.map(parsePackageSpec),
      targetLicense,
      command: req.command,
      agentId: req.agentId,
      repository: req.repository,
      auditId: randomAuditId(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let authModel: 'ModelA_SaaS' | 'ModelB_Web3' | 'ModelB_EIP712_Vault';

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      authModel = 'ModelA_SaaS';
    } else if (this.paymentMode === 'eip712-voucher') {
      const { signature, voucher } = await this.signAuditVoucher(body);
      headers['X-Payment-Signature'] = signature;
      headers['X-Payment-Voucher'] = JSON.stringify(voucher);
      headers['X-Audit-ID'] = voucher.auditId;
      authModel = 'ModelB_EIP712_Vault';
    } else {
      await this.lockEscrow(body);
      headers['X-Audit-ID'] = this.extractAuditId(body);
      authModel = 'ModelB_Web3';
    }

    const report = (await this.http('POST', '/api/v1/audit', body, headers)) as AuditReport;
    return { ...report, authModel: report.authModel || authModel };
  }

  /**
   * Sandbox / pre-flight check. Free (rate-limited per IP) or authenticated via API key / EIP-712.
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
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (this.signerKey && this.paymentMode === 'eip712-voucher') {
      const { signature, voucher } = await this.signAuditVoucher(body);
      headers['X-Payment-Signature'] = signature;
      headers['X-Payment-Voucher'] = JSON.stringify(voucher);
    }

    return (await this.http('POST', '/api/v1/verify', body, headers)) as VerifyResponse;
  }

  /**
   * Signs an off-chain EIP-712 AuditVoucher bound to `keccak256(utf8Bytes(rawBody))`.
   * Executes locally in <1ms with zero RPC latency once the contract address is known.
   */
  async signAuditVoucher(
    rawBody: string,
    ttlSeconds = 300
  ): Promise<{ signature: string; voucher: Eip712VoucherPayload }> {
    if (!this.signerKey) {
      throw new LicenseShieldError('signerKey is required to sign EIP-712 AuditVouchers');
    }

    const { escrow, feeRaw } = await this.resolveEscrow();
    const wallet = new ethers.Wallet(this.signerKey);

    let extractedId: string;
    try {
      extractedId = this.extractAuditId(rawBody) || randomAuditId();
    } catch {
      extractedId = randomAuditId();
    }

    const bytes32AuditId =
      extractedId.startsWith('0x') && extractedId.length === 66
        ? extractedId
        : ethers.id(extractedId);
    const payloadHash = ethers.id(rawBody);
    const deadline = Math.floor(Date.now() / 1000) + ttlSeconds;

    const domain = {
      name: 'LicenseShieldEscrow',
      version: '1',
      chainId: BASE_SEPOLIA_CHAIN_ID,
      verifyingContract: escrow,
    };

    const message = {
      buyer: wallet.address,
      auditId: bytes32AuditId,
      payloadHash,
      fee: feeRaw,
      deadline: BigInt(deadline),
    };

    const signature = await wallet.signTypedData(domain, EIP712_VOUCHER_TYPES, message);

    return {
      signature,
      voucher: {
        buyer: wallet.address,
        auditId: bytes32AuditId,
        payloadHash,
        fee: feeRaw.toString(),
        deadline,
      },
    };
  }

  /**
   * Pre-funds the agent's Base Sepolia USDC Deposit Vault once so subsequent scans
   * settle via zero-friction EIP-712 cryptographic signatures.
   */
  async depositToVault(amountUsdc: number): Promise<{ txHash: string; newBalanceUsdc: number }> {
    if (!this.signerKey) {
      throw new LicenseShieldError('signerKey is required for depositToVault');
    }
    const { escrow } = await this.resolveEscrow();
    const amountRaw = ethers.parseUnits(amountUsdc.toFixed(6), 6);

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const wallet = new ethers.Wallet(this.signerKey, provider);
    const usdc = new ethers.Contract(this.usdcAddress, ERC20_ABI, wallet);
    const vault = new ethers.Contract(escrow, ESCROW_ABI, wallet);

    const allowance = (await usdc.allowance(wallet.address, escrow)) as bigint;
    if (allowance < amountRaw) {
      const approveTx = await usdc.approve(escrow, amountRaw);
      await approveTx.wait(1);
    }

    const tx = await vault.depositVault(amountRaw);
    await tx.wait(1);

    const bal = (await vault.vaultBalances(wallet.address)) as bigint;
    return {
      txHash: tx.hash,
      newBalanceUsdc: Number(ethers.formatUnits(bal, 6)),
    };
  }

  /** Queries the agent's pre-funded USDC balance in the Base Sepolia Deposit Vault. */
  async getVaultBalance(agentAddress?: string): Promise<{ balanceUsdc: number; raw: bigint }> {
    const { escrow } = await this.resolveEscrow();
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const addr =
      agentAddress || (this.signerKey ? new ethers.Wallet(this.signerKey).address : undefined);
    if (!addr) throw new LicenseShieldError('Provide agentAddress or configure signerKey');

    const vault = new ethers.Contract(escrow, ESCROW_ABI, provider);
    const raw = (await vault.vaultBalances(addr)) as bigint;
    return { balanceUsdc: Number(ethers.formatUnits(raw, 6)), raw };
  }

  /** Reads `auditFee()` from escrow and converts the 6-decimal USDC fee to USD. */
  async estimateCost(): Promise<{ feeUsd: number; token: string; network: string }> {
    const { feeRaw } = await this.resolveEscrow();
    return { feeUsd: Number(ethers.formatUnits(feeRaw, 6)), token: 'USDC', network: 'base-sepolia' };
  }

  // ── Model B Internals ───────────────────────────────────────────────────────

  private async lockEscrow(body: string): Promise<void> {
    const { escrow, feeRaw } = await this.resolveEscrow();

    const payloadHash = ethers.id(body);
    const auditId = this.extractAuditId(body);
    const bytes32AuditId = ethers.id(auditId);

    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    const wallet = new ethers.Wallet(this.signerKey!, provider);
    const usdc = new ethers.Contract(this.usdcAddress, ERC20_ABI, wallet);
    const escrowC = new ethers.Contract(escrow, ESCROW_ABI, wallet);

    const allowance = (await usdc.allowance(wallet.address, escrow)) as bigint;
    if (allowance < feeRaw) {
      const approveTx = await usdc.approve(escrow, feeRaw);
      await approveTx.wait(1);
    }

    const lockTx = await escrowC.lockAuditFee(bytes32AuditId, payloadHash);
    await lockTx.wait(1);
  }

  private async resolveEscrow(): Promise<{ escrow: string; feeRaw: bigint }> {
    if (this.escrowAddress && this.cachedFee) {
      return { escrow: this.escrowAddress, feeRaw: this.cachedFee };
    }

    if (this.escrowAddress && !this.cachedFee) {
      try {
        const provider = new ethers.JsonRpcProvider(this.rpcUrl);
        const c = new ethers.Contract(
          this.escrowAddress,
          ['function auditFee() view returns (uint256)'],
          provider
        );
        this.cachedFee = (await c.auditFee()) as bigint;
      } catch {
        this.cachedFee = BigInt(10000); // fallback $0.01 USDC
      }
      return { escrow: this.escrowAddress, feeRaw: this.cachedFee };
    }

    // Learn escrow config from the backend's 402 challenge.
    try {
      await this.http('POST', '/api/v1/audit', '{}', { 'Content-Type': 'application/json' });
    } catch (err) {
      const challenge = err as LicenseShieldError;
      const instructions = (
        challenge.body as { paymentInstructions?: { contractAddress?: string } }
      )?.paymentInstructions;
      const addr = instructions?.contractAddress;

      if (!addr || addr === '0x0000000000000000000000000000000000000000') {
        throw new LicenseShieldError(
          'Backend 402 response did not include a usable escrow contract address. Configure `escrowAddress` explicitly.',
          challenge.httpStatus,
          challenge.body
        );
      }

      this.escrowAddress = addr;
      try {
        const provider = new ethers.JsonRpcProvider(this.rpcUrl);
        const c = new ethers.Contract(
          addr,
          ['function auditFee() view returns (uint256)'],
          provider
        );
        this.cachedFee = (await c.auditFee()) as bigint;
      } catch {
        this.cachedFee = BigInt(10000);
      }
      return { escrow: addr, feeRaw: this.cachedFee };
    }

    throw new LicenseShieldError(
      'Expected HTTP 402 challenge from backend but got an authorized response.'
    );
  }

  private extractAuditId(body: string): string {
    const parsed = JSON.parse(body) as { auditId: string };
    return parsed.auditId;
  }

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
