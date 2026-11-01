import { ethers } from 'ethers';
import crypto from 'crypto';
import { prisma } from './prisma';
import { PaymentChannel } from '@prisma/client';

// ── Environment Configuration ──────────────────────────────────────────────────
const RPC_URL = process.env.RPC || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const MIN_AUDIT_FEE_USDC = BigInt(10000); // $0.01 USDC (6 decimals)

// Minimal ABI for LicenseShieldEscrow contract read/write methods (Escrow + Deposit Vault + EIP-712)
const ESCROW_ABI = [
  'function audits(bytes32 auditId) external view returns (address buyer, uint256 amount, bytes32 payloadHash, uint8 state, uint256 timestamp)',
  'function vaultBalances(address agent) external view returns (uint256)',
  'function auditFee() external view returns (uint256)',
  'function settleAudit(bytes32 auditId) external',
  'function refundAudit(bytes32 auditId) external',
  'function settleWithSignature(address buyer, bytes32 auditId, bytes32 payloadHash, uint256 fee, uint256 deadline, bytes calldata signature) external',
];

export const EIP712_VOUCHER_TYPES = {
  AuditVoucher: [
    { name: 'buyer', type: 'address' },
    { name: 'auditId', type: 'bytes32' },
    { name: 'payloadHash', type: 'bytes32' },
    { name: 'fee', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

export interface Eip712AuditVoucher {
  buyer: string;
  auditId: string;
  payloadHash: string;
  fee: string | number;
  deadline: number;
}

export function getEip712Domain(verifyingContract?: string) {
  const contractAddress =
    verifyingContract ||
    process.env.ESCROW_CONTRACT_ADDRESS ||
    ESCROW_CONTRACT_ADDRESS ||
    '0x0000000000000000000000000000000000000000';
  return {
    name: 'LicenseShieldEscrow',
    version: '1',
    chainId: BASE_SEPOLIA_CHAIN_ID,
    verifyingContract: contractAddress,
  };
}

// Replay guard for off-chain EIP-712 vouchers within server process lifetime
const usedVoucherAuditIds = new Set<string>();

export enum AuditState {
  Pending = 0,
  Completed = 1,
  Refunded = 2,
}

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Hash raw API key using SHA-256 for secure database lookup
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export interface VerifiedAuthResult {
  authorized: boolean;
  userId?: string;
  keyId?: string;
  reason?: string;
}

// ── Model A: Web2 API Key Verification (Prisma ORM + Env Fallback) ────────────

/**
 * verifyApiKey
 * Hashes incoming raw Bearer API key, queries Prisma `ApiKey` joined with `Profile`,
 * verifies active status & monthly usage limit, and atomically increments usage count.
 */
export async function verifyApiKey(key: string): Promise<VerifiedAuthResult> {
  if (!key) return { authorized: false, reason: 'Missing API key' };
  const cleanKey = key.replace(/^Bearer\s+/i, '').trim();
  const keyHash = hashApiKey(cleanKey);

  try {
    // 1. Query Prisma database for active API key
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (apiKeyRecord) {
      if (!apiKeyRecord.isActive) {
        return { authorized: false, reason: 'API key is deactivated' };
      }

      if (apiKeyRecord.user && apiKeyRecord.user.subscriptionStatus !== 'ACTIVE') {
        return { authorized: false, reason: 'User subscription is not active' };
      }

      if (apiKeyRecord.usageCount >= apiKeyRecord.monthlyLimit) {
        return { authorized: false, reason: 'Monthly usage limit exceeded' };
      }

      // Increment usage count atomically via Prisma
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { usageCount: { increment: 1 } },
      });

      return {
        authorized: true,
        userId: apiKeyRecord.userId,
        keyId: apiKeyRecord.id,
      };
    }
  } catch (dbErr) {
    console.warn('[Payment] Prisma API key query warning, checking fallback env:', dbErr);
  }

  // 2. Fallback: exact-match against environment-configured keys only.
  // No prefix matching — a forged `ls_live_*` string must never authenticate.
  const validKeysEnv = process.env.LICENSE_SHIELD_API_KEYS || process.env.VALID_API_KEYS || '';
  const validKeys = validKeysEnv.split(',').map((k) => k.trim()).filter(Boolean);

  if (validKeys.includes(cleanKey)) {
    return { authorized: true, userId: undefined };
  }

  return { authorized: false, reason: 'Invalid API key' };
}

// ── Model B: Web3 Smart Contract Escrow & EIP-712 Deposit Vault ───────────────

/**
 * hashPayload
 * Canonical payload-hash scheme binding an escrow lock or EIP-712 voucher to one exact request body.
 */
export function hashPayload(rawPayload: string): string {
  return ethers.id(rawPayload);
}

/**
 * toBytes32AuditId
 * Canonicalizes any string or 0x-prefixed hex auditId into a 32-byte hex string.
 */
export function toBytes32AuditId(auditId: string): string {
  return auditId.startsWith('0x') && auditId.length === 66 ? auditId : ethers.id(auditId);
}

/**
 * verifyEip712Voucher
 * Verifies an off-chain cryptographic EIP-712 signature (`AuditVoucher`) in <1ms.
 * Binds the voucher to the exact HTTP request payload (`keccak256(rawBody)`),
 * enforces expiration deadline, checks replay protection, and recovers signer address.
 */
export function verifyEip712Voucher(
  signature: string,
  voucherRaw: string | Eip712AuditVoucher,
  expectedPayload: string
): { valid: boolean; voucher?: Eip712AuditVoucher; reason?: string } {
  try {
    if (!signature || !voucherRaw) {
      return { valid: false, reason: 'Missing signature or voucher' };
    }

    const voucher: Eip712AuditVoucher =
      typeof voucherRaw === 'string' ? JSON.parse(voucherRaw) : voucherRaw;

    if (!voucher.buyer || !voucher.auditId || !voucher.payloadHash || !voucher.deadline) {
      return { valid: false, reason: 'Malformed EIP-712 voucher fields' };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (Number(voucher.deadline) < nowSec) {
      return { valid: false, reason: 'EIP-712 voucher has expired' };
    }

    const feeBig = BigInt(voucher.fee || 0);
    if (feeBig < MIN_AUDIT_FEE_USDC) {
      return { valid: false, reason: `Voucher fee ${feeBig} below minimum ${MIN_AUDIT_FEE_USDC}` };
    }

    const expectedHash = hashPayload(expectedPayload);
    if (voucher.payloadHash.toLowerCase() !== expectedHash.toLowerCase()) {
      return { valid: false, reason: 'EIP-712 voucher payloadHash does not match request body' };
    }

    const bytes32AuditId = toBytes32AuditId(voucher.auditId);
    if (usedVoucherAuditIds.has(bytes32AuditId.toLowerCase())) {
      return { valid: false, reason: 'EIP-712 voucher auditId already consumed (replay blocked)' };
    }

    const domain = getEip712Domain();
    const normalizedVoucher = {
      buyer: ethers.getAddress(voucher.buyer),
      auditId: bytes32AuditId,
      payloadHash: voucher.payloadHash,
      fee: feeBig,
      deadline: BigInt(voucher.deadline),
    };

    const recovered = ethers.verifyTypedData(
      domain,
      EIP712_VOUCHER_TYPES,
      normalizedVoucher,
      signature
    );

    if (recovered.toLowerCase() !== voucher.buyer.toLowerCase()) {
      return { valid: false, reason: 'EIP-712 signature recovery mismatch' };
    }

    usedVoucherAuditIds.add(bytes32AuditId.toLowerCase());
    return {
      valid: true,
      voucher: {
        ...voucher,
        buyer: normalizedVoucher.buyer,
        auditId: bytes32AuditId,
      },
    };
  } catch (err: any) {
    return { valid: false, reason: err?.message || 'Invalid EIP-712 signature' };
  }
}

/**
 * settleEip712Voucher
 * Calls `settleWithSignature` on the Base Sepolia Deposit Vault contract asynchronously.
 */
export async function settleEip712Voucher(
  voucher: Eip712AuditVoucher,
  signature: string
): Promise<string | null> {
  try {
    if (!PRIVATE_KEY) return null;
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || ESCROW_CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const provider = getProvider();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, wallet);

    const bytes32AuditId = toBytes32AuditId(voucher.auditId);
    const tx = await contract.settleWithSignature(
      voucher.buyer,
      bytes32AuditId,
      voucher.payloadHash,
      BigInt(voucher.fee),
      BigInt(voucher.deadline),
      signature
    );
    const receipt = await tx.wait();
    console.log(`[Payment] EIP-712 Voucher settled in block ${receipt.blockNumber}: ${tx.hash}`);
    return tx.hash;
  } catch (err: any) {
    console.warn(`[Payment] Async EIP-712 on-chain voucher settlement warning:`, err?.message || err);
    return null;
  }
}

/**
 * verifyEscrowLock
 * Queries the LicenseShieldEscrow smart contract on Base Sepolia to verify that
 * $0.01 USDC has been locked into escrow for the given auditId in 'Pending' state,
 * AND that the on-chain payloadHash matches keccak256 of the incoming request body.
 */
export async function verifyEscrowLock(auditId: string, expectedPayload: string): Promise<boolean> {
  try {
    if (!auditId) return false;

    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || ESCROW_CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('[Payment] ESCROW_CONTRACT_ADDRESS not configured properly.');
      return false;
    }

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, provider);

    const bytes32AuditId = toBytes32AuditId(auditId);

    const auditData = await contract.audits(bytes32AuditId);
    const auditFee = await contract.auditFee();

    const buyer: string = auditData[0];
    const amount: bigint = auditData[1];
    const payloadHash: string = auditData[2];
    const state: number = Number(auditData[3]);

    if (buyer === ethers.ZeroAddress || state !== AuditState.Pending || amount < auditFee) {
      console.warn(`[Payment] Escrow check failed for auditId ${auditId}: State=${state}, Amount=${amount.toString()}`);
      return false;
    }

    if (payloadHash === ethers.ZeroHash) {
      console.warn(`[Payment] Escrow lock for ${auditId} carries a zero payloadHash — unbound locks are rejected.`);
      return false;
    }

    if (payloadHash !== hashPayload(expectedPayload)) {
      console.warn(`[Payment] payloadHash mismatch for auditId ${auditId} — lock was made for a different request body.`);
      return false;
    }

    console.log(`[Payment] Escrow verified for auditId ${auditId}: Buyer=${buyer}, Amount=${amount.toString()}, State=Pending, payloadHash bound.`);
    return true;
  } catch (error) {
    console.error(`[Payment] Error verifying escrow lock for auditId ${auditId}:`, error);
    return false;
  }
}

/**
 * settleEscrowPayment
 * Calls `settleAudit(bytes32 auditId)` on-chain via backend wallet post-audit.
 */
export async function settleEscrowPayment(auditId: string): Promise<string | null> {
  try {
    if (!PRIVATE_KEY) return null;
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || ESCROW_CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') return null;

    const provider = getProvider();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, wallet);

    const bytes32AuditId = toBytes32AuditId(auditId);

    console.log(`[Payment] Executing on-chain settleAudit(${bytes32AuditId})...`);
    const tx = await contract.settleAudit(bytes32AuditId);
    const receipt = await tx.wait();
    console.log(`[Payment] Settle transaction confirmed in block ${receipt.blockNumber}`);
    return tx.hash;
  } catch (error) {
    console.error(`[Payment] On-chain settlement failed for auditId ${auditId}:`, error);
    return null;
  }
}

/**
 * refundEscrowPayment
 * Calls `refundAudit(bytes32 auditId)` function on-chain if analysis fails.
 */
export async function refundEscrowPayment(auditId: string): Promise<string | null> {
  try {
    if (!PRIVATE_KEY) return null;
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS || ESCROW_CONTRACT_ADDRESS;
    if (!contractAddress) return null;

    const provider = getProvider();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, ESCROW_ABI, wallet);

    const bytes32AuditId = toBytes32AuditId(auditId);

    const tx = await contract.refundAudit(bytes32AuditId);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error(`[Payment] On-chain refund failed for auditId ${auditId}:`, error);
    return null;
  }
}

// ── Audit Logging Helper ────────────────────────────────────────────────────────

export interface SaveAuditLogParams {
  auditId: string;
  userId?: string | null;
  billedVia: 'STRIPE_SUBSCRIPTION' | 'BASE_SEPOLIA_USDC';
  targetLicense: string;
  packagesScanned: any[];
  reportOutput: any;
}

/**
 * saveAuditLog
 * Persists full audit scan metadata, scanned packages, and Gemini compliance report into Prisma `AuditLog` table.
 */
export async function saveAuditLog(params: SaveAuditLogParams): Promise<boolean> {
  try {
    const channelEnum =
      params.billedVia === 'BASE_SEPOLIA_USDC'
        ? PaymentChannel.BASE_SEPOLIA_USDC
        : PaymentChannel.STRIPE_SUBSCRIPTION;

    await prisma.auditLog.create({
      data: {
        auditId: params.auditId,
        userId: params.userId || null,
        billedVia: channelEnum,
        targetLicense: params.targetLicense,
        packagesScanned: params.packagesScanned,
        reportOutput: params.reportOutput,
      },
    });

    console.log(`[Payment] Audit log saved successfully via Prisma (auditId: ${params.auditId})`);
    return true;
  } catch (err: any) {
    console.warn('[Payment] Could not save audit log via Prisma:', err.message || err);
    return false;
  }
}
