import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { hashApiKey, verifyApiKey, saveAuditLog } from '../lib/payment';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

async function runLocalHybridTests() {
  console.log('----------------------------------------------------');
  console.log('🧪 Running LicenseShield AI Local Hybrid Integration Tests');
  console.log('----------------------------------------------------\n');

  // Test 1: Seed Local Test User and API Key in Prisma
  console.log('Test 1: Seeding Local Test User & API Key in Prisma...');
  const testUserId = `test_user_${Date.now()}`;
  const rawSecret = crypto.randomBytes(16).toString('hex');
  const rawApiKey = `ls_live_${rawSecret}`;
  const keyHash = hashApiKey(rawApiKey);
  const keyPrefix = rawApiKey.slice(0, 12);

  const profile = await prisma.profile.create({
    data: {
      id: testUserId,
      email: `test_${Date.now()}@licenseshield.ai`,
      planTier: PlanTier.FREE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      userId: profile.id,
      keyHash,
      keyPrefix,
      name: 'Local Test Integration Key',
      monthlyLimit: 100,
      usageCount: 0,
      isActive: true,
    },
  });

  console.log(`  User Created: ${profile.id}`);
  console.log(`  API Key Created: ${keyPrefix}... (Initial Usage: ${apiKeyRecord.usageCount})`);
  console.log('✅ Local test database seeding completed!\n');

  // Test 2: Verify Model A API Key Auth & Usage Increment in Prisma
  console.log('Test 2: Verifying Model A API Key Auth & Quota Increment...');
  const authRes = await verifyApiKey(`Bearer ${rawApiKey}`);
  console.log(`  Auth Verification Result: Authorized = ${authRes.authorized}, UserId = ${authRes.userId}`);

  if (!authRes.authorized) {
    throw new Error(`Model A API Key verification failed: ${authRes.reason}`);
  }

  // Fetch updated record from Prisma to assert atomic usageCount increment
  const updatedKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyRecord.id },
  });

  console.log(`  Updated Usage Count in Prisma: ${updatedKey?.usageCount}`);
  if (updatedKey?.usageCount !== 1) {
    throw new Error(`Expected usageCount to be 1, got ${updatedKey?.usageCount}`);
  }
  console.log('✅ Model A Bearer Key verification & atomic increment PASSED!\n');

  // Test 3: Verify Audit Log Persistence (Model A & Model B Channels)
  console.log('Test 3: Testing Audit Log Persistence via Prisma...');
  const auditIdSaaS = `audit_saas_${Date.now()}`;
  const auditIdWeb3 = `audit_web3_${Date.now()}`;

  const saasSaved = await saveAuditLog({
    auditId: auditIdSaaS,
    userId: profile.id,
    billedVia: 'STRIPE_SUBSCRIPTION',
    targetLicense: 'MIT',
    packagesScanned: [{ name: 'express', version: '4.18.2', license: 'MIT', vulnerabilities: [] }],
    reportOutput: { status: 'APPROVED', reason: 'All dependencies compatible with MIT policy.' },
  });

  const web3Saved = await saveAuditLog({
    auditId: auditIdWeb3,
    userId: null,
    billedVia: 'BASE_SEPOLIA_USDC',
    targetLicense: 'Apache-2.0',
    packagesScanned: [{ name: 'lodash', version: '4.17.21', license: 'MIT', vulnerabilities: [] }],
    reportOutput: { status: 'APPROVED', reason: 'Base Sepolia $0.01 USDC escrow verified.' },
  });

  console.log(`  SaaS Audit Log Saved: ${saasSaved}`);
  console.log(`  Web3 Audit Log Saved: ${web3Saved}`);

  const saasRecord = await prisma.auditLog.findUnique({ where: { auditId: auditIdSaaS } });
  const web3Record = await prisma.auditLog.findUnique({ where: { auditId: auditIdWeb3 } });

  if (!saasRecord || saasRecord.billedVia !== 'STRIPE_SUBSCRIPTION') {
    throw new Error('SaaS audit log verification failed in Prisma.');
  }

  if (!web3Record || web3Record.billedVia !== 'BASE_SEPOLIA_USDC') {
    throw new Error('Web3 audit log verification failed in Prisma.');
  }

  console.log('✅ Model A & Model B Audit Log persistence verified in Prisma!\n');

  // Cleanup test user and associated records
  console.log('Cleaning up test records from Prisma database...');
  await prisma.auditLog.deleteMany({ where: { auditId: { in: [auditIdSaaS, auditIdWeb3] } } });
  await prisma.apiKey.deleteMany({ where: { userId: profile.id } });
  await prisma.profile.delete({ where: { id: profile.id } });
  console.log('✅ Cleanup completed cleanly!\n');

  console.log('----------------------------------------------------');
  console.log('🎉 ALL HYBRID LOCAL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
}

runLocalHybridTests().catch((err) => {
  console.error('Local hybrid integration test failed:', err);
  process.exit(1);
});
