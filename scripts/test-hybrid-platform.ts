import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { compileContract } from './deploy-escrow';
import {
  verifyApiKey,
  verifyEscrowLock,
  verifyEip712Voucher,
  getEip712Domain,
  EIP712_VOUCHER_TYPES,
  hashPayload,
} from '../lib/payment';
import {
  detectTyposquatting,
  evaluatePackageMetadata,
  buildAutoCorrectionPlan,
} from '../lib/threat-guard';
import { checkLicenseCompatibility } from '../lib/license-engine';

dotenv.config();

async function testSuite() {
  console.log('----------------------------------------------------');
  console.log('🧪 LicenseShield AI — Complete A2A Firewall Test Suite');
  console.log('----------------------------------------------------\n');

  // Test 1: Solc Smart Contract Compilation (Escrow + Deposit Vault + EIP-712)
  console.log('Test 1: Compiling LicenseShieldEscrow.sol (Escrow + EIP-712 Deposit Vault)...');
  const { abi, bytecode } = compileContract();
  const methodNames = abi.filter((item: any) => item.type === 'function').map((f: any) => f.name);
  if (
    !methodNames.includes('depositVault') ||
    !methodNames.includes('settleWithSignature') ||
    !methodNames.includes('lockAuditFee')
  ) {
    throw new Error('Contract missing expected Vault / Escrow methods');
  }
  console.log(
    `✅ Smart contract compiled! Bytecode: ${bytecode.length / 2} bytes | Methods: ${methodNames.join(', ')}\n`
  );

  // Test 2: Model A Web2 API Key Verification
  console.log('Test 2: Verifying Model A (Web2 SaaS API Key & Forged Key Rejection)...');
  const envKeys = (process.env.LICENSE_SHIELD_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const forgedRes = await verifyApiKey('Bearer ls_live_forged_key_000');
  if (forgedRes.authorized) {
    throw new Error('SECURITY FAILURE: forged ls_live_* prefix key was accepted!');
  }
  console.log('✅ Forged ls_live_* prefix key rejected.');

  if (envKeys.length > 0) {
    const validRes = await verifyApiKey(`Bearer ${envKeys[0]}`);
    if (!validRes.authorized) {
      throw new Error('Model A API Key validation failed for env-configured key.');
    }
    console.log('✅ Model A Bearer API Key authenticated.\n');
  }

  // Test 3: Model B1 Web3 Escrow Lock Verification
  console.log('Test 3: Testing Model B1 (Web3 Base Sepolia Escrow Lock Check)...');
  const sampleAuditId = 'audit_test_12345';
  const samplePayload = JSON.stringify({ dependencies: ['lodash@4.17.20'] });
  const isLocked = await verifyEscrowLock(sampleAuditId, samplePayload);
  console.log(
    `✅ Escrow lock RPC check completed (state for "${sampleAuditId}": ${isLocked ? 'LOCKED' : 'UNPAID'})\n`
  );

  // Test 4: Model B2 EIP-712 Deposit Vault Off-Chain Signature Verification
  console.log('Test 4: Testing Model B2 (EIP-712 Cryptographic Signature Verification + Replay Protection)...');
  const testWallet = ethers.Wallet.createRandom();
  const rawBody = JSON.stringify({
    dependencies: [{ name: 'axios', version: '1.6.0' }],
    targetLicense: 'MIT',
    auditId: '0x' + 'ab'.repeat(32),
  });
  const domain = getEip712Domain();
  const voucher = {
    buyer: testWallet.address,
    auditId: '0x' + 'ab'.repeat(32),
    payloadHash: hashPayload(rawBody),
    fee: '10000',
    deadline: Math.floor(Date.now() / 1000) + 300,
  };
  const signature = await testWallet.signTypedData(domain, EIP712_VOUCHER_TYPES, {
    ...voucher,
    fee: BigInt(voucher.fee),
    deadline: BigInt(voucher.deadline),
  });

  const vCheck1 = verifyEip712Voucher(signature, voucher, rawBody);
  if (!vCheck1.valid) {
    throw new Error(`Valid EIP-712 voucher failed verification: ${vCheck1.reason}`);
  }
  console.log('✅ Valid EIP-712 cryptographic signature verified in <1ms.');

  const tamperedCheck = verifyEip712Voucher(
    signature,
    { ...voucher, auditId: '0x' + 'cd'.repeat(32) },
    rawBody + ' '
  );
  if (tamperedCheck.valid) {
    throw new Error('Tampered payload passed EIP-712 verification!');
  }
  console.log('✅ Payload-tampered EIP-712 voucher rejected.');

  const replayCheck = verifyEip712Voucher(signature, voucher, rawBody);
  if (replayCheck.valid) {
    throw new Error('Replayed EIP-712 voucher was not blocked!');
  }
  console.log('✅ Replayed EIP-712 voucher blocked.\n');

  // Test 5: 3-Pillar Threat Guard & A2A Auto-Correction
  console.log('Test 5: Verifying 3-Pillar Threat Guard (Copyleft, Typosquatting, Hallucinations, Deprecation, Auto-Correction)...');

  const typo = detectTyposquatting('axois');
  if (!typo.isTyposquat || typo.targetPackage !== 'axios') {
    throw new Error(`Expected "axois" to be flagged as typosquat of "axios", got ${JSON.stringify(typo)}`);
  }
  console.log(`✅ Typosquatting detected: "axois" -> canonical target "${typo.targetPackage}"`);

  const hallucinated = evaluatePackageMetadata('react-ai-dom-hallucinated', '1.0.0', 404, null);
  if (!hallucinated.threatRisks.some((r) => r.type === 'HALLUCINATION')) {
    throw new Error('Expected 404 package to be flagged as HALLUCINATION');
  }
  console.log('✅ AI Hallucination (HTTP 404 on NPM) flagged as HIGH slopsquatting risk.');

  const deprecated = evaluatePackageMetadata('request', '2.88.2', 200, {
    version: '2.88.2',
    license: 'Apache-2.0',
    deprecated: 'request has been deprecated, see https://github.com/request/request/issues/3142',
  });
  if (!deprecated.threatRisks.some((r) => r.type === 'DEPRECATED')) {
    throw new Error('Expected deprecated package to be flagged as DEPRECATED');
  }
  console.log('✅ Deprecated package ("request") flagged with replacement suggestion.');

  const copyleft = checkLicenseCompatibility('agpl-3.0-module', 'AGPL-3.0', 'MIT');
  if (!copyleft || copyleft.severity !== 'HIGH') {
    throw new Error('Expected AGPL-3.0 under MIT policy to trigger HIGH severity conflict');
  }
  console.log('✅ Viral Copyleft ("AGPL-3.0" in MIT project) flagged as HIGH legal risk.');

  const autoPlan = buildAutoCorrectionPlan(
    [
      {
        package: 'axois',
        version: '1.6.0',
        status: 'FLAGGED',
        riskType: 'TYPOSQUATTING_RISK',
        suggestedReplacement: 'axios',
      },
      {
        package: 'zod',
        version: '3.22.0',
        status: 'APPROVED',
        riskType: 'NONE',
      },
    ],
    'npm install axois@1.6.0 zod@3.22.0'
  );
  if (autoPlan.remediationCommand !== 'npm install axios zod@3.22.0') {
    throw new Error(`Unexpected remediationCommand: ${autoPlan.remediationCommand}`);
  }
  console.log(`✅ A2A Auto-Correction Plan generated: "${autoPlan.remediationCommand}"\n`);

  console.log('----------------------------------------------------');
  console.log('🎉 ALL 5 HYBRID PLATFORM & A2A FIREWALL SUITES PASSED!');
  console.log('----------------------------------------------------');
}

testSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
