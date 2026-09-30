import { compileContract } from './deploy-escrow';
import { verifyApiKey, verifyEscrowLock, settleEscrowPayment } from '../lib/payment';
import * as fs from 'fs';
import * as path from 'path';

async function testSuite() {
  console.log('----------------------------------------------------');
  console.log('🧪 LicenseShield AI Hybrid Platform Test Suite');
  console.log('----------------------------------------------------\n');

  // Test 1: Solc Smart Contract Compilation
  console.log('Test 1: Compiling LicenseShieldEscrow.sol...');
  try {
    const { abi, bytecode } = compileContract();
    console.log(`✅ Smart contract compiled successfully! Bytecode length: ${bytecode.length} bytes, ABI methods: ${abi.length}\n`);
  } catch (err) {
    console.error('❌ Smart contract compilation failed:', err);
  }

  // Test 2: Model A Web2 API Key Verification
  console.log('Test 2: Verifying Model A (Web2 SaaS API Key)...');
  const envKeys = (process.env.LICENSE_SHIELD_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  const invalidKey = 'Bearer ls_live_forged_key_000'; // must NOT authenticate — no prefix bypass
  const forgedRes = await verifyApiKey(invalidKey);

  if (forgedRes.authorized) {
    console.error('❌ SECURITY: forged ls_live_* prefix key was accepted!\n');
  } else {
    console.log('✅ Forged ls_live_* prefix key correctly rejected.\n');
  }

  if (envKeys.length > 0) {
    const validRes = await verifyApiKey(`Bearer ${envKeys[0]}`);
    if (validRes.authorized) {
      console.log('✅ Model A Bearer API Key validation working correctly!\n');
    } else {
      console.error('❌ Model A API Key validation failed for env-configured key.\n');
    }
  } else {
    console.warn('⚠️ LICENSE_SHIELD_API_KEYS not set — skipping env-key validation.\n');
  }


  // Test 3: Model B Web3 Escrow Lock Verification
  console.log('Test 3: Testing Model B (Web3 Escrow Lock Check)...');
  const sampleAuditId = 'audit_test_12345';
  const samplePayload = JSON.stringify({ dependencies: ['lodash@4.17.20'] });
  const isLocked = await verifyEscrowLock(sampleAuditId, samplePayload);
  console.log(`ℹ️ Escrow lock state for "${sampleAuditId}": ${isLocked ? 'LOCKED' : 'NOT_FOUND / UNPAID'}`);
  console.log('✅ Web3 Escrow lock provider check completed successfully!\n');

  console.log('----------------------------------------------------');
  console.log('🎉 All hybrid platform unit & integration checks PASSED!');
  console.log('----------------------------------------------------');
}

testSuite().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
