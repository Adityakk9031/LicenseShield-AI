/**
 * Admin: settle or refund escrow locks that remain in Pending state.
 *
 * Use cases:
 *  - The audit route now settles fire-and-forget; if the serverless function
 *    died before the async settle completed, the lock stays Pending. This
 *    script sweeps those.
 *  - Refund a buyer when an audit genuinely failed.
 *
 * Usage:
 *   npx tsx scripts/settle-pending-escrows.ts            # list pending locks
 *   npx tsx scripts/settle-pending-escrows.ts settle 0x<auditId32>
 *   npx tsx scripts/settle-pending-escrows.ts refund 0x<auditId32>
 */
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC || 'https://sepolia.base.org';
const CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS;

const ESCROW_ABI = [
  'function audits(bytes32 auditId) external view returns (address buyer, uint256 amount, bytes32 payloadHash, uint8 state, uint256 timestamp)',
  'function settleAudit(bytes32 auditId) external',
  'function refundAudit(bytes32 auditId) external',
];

const STATE_NAMES = ['Pending', 'Completed', 'Refunded'];

async function main() {
  if (!CONTRACT_ADDRESS) throw new Error('ESCROW_CONTRACT_ADDRESS not set');
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY not set (owner wallet required)');

  const [, , command, auditIdArg] = process.argv;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ESCROW_ABI, wallet);

  const bytes32 = (id: string) => (id.startsWith('0x') && id.length === 66 ? id : ethers.id(id));

  if (!command || command === 'list') {
    console.log('This escrow has no on-chain registry of auditIds; list known pending');
    console.log('auditIds from your backend logs, then check each one explicitly:');
    console.log('');
    console.log('  npx tsx scripts/settle-pending-escrows.ts check 0x<auditId>');
    return;
  }

  if (command === 'check' || command === 'settle' || command === 'refund') {
    if (!auditIdArg) throw new Error(`Usage: settle-pending-escrows.ts ${command} 0x<auditId>`);
    const id = bytes32(auditIdArg);
    const audit = await contract.audits(id);
    const state = Number(audit[3]);

    console.log(`auditId:   ${id}`);
    console.log(`buyer:     ${audit[0]}`);
    console.log(`amount:    ${ethers.formatUnits(audit[1], 6)} USDC`);
    console.log(`payloadHash: ${audit[2]}`);
    console.log(`state:     ${STATE_NAMES[state] ?? state}`);
    console.log(`timestamp: ${new Date(Number(audit[4]) * 1000).toISOString()}`);

    if (command === 'check') return;

    if (state !== 0) {
      throw new Error(`Cannot ${command}: lock is not Pending (state=${STATE_NAMES[state]})`);
    }

    const tx =
      command === 'settle'
        ? await contract.settleAudit(id)
        : await contract.refundAudit(id);
    const receipt = await tx.wait();
    console.log(`✅ ${command} confirmed in block ${receipt.blockNumber}: ${tx.hash}`);
    return;
  }

  throw new Error(`Unknown command: ${command}. Use list | check | settle | refund.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
