/**
 * End-to-end A2A example: how a coding agent uses the LicenseShield SDK.
 *
 *   npx tsx scripts/sdk-example.ts
 *
 * Path A (SaaS key):  set LICENSE_SHIELD_KEY=ls_live_... in .env
 * Path B (escrow):    set AGENT_WALLET_PRIVATE_KEY=0x... (funded with USDC + gas)
 * Set LICENSE_SHIELD_URL if not running against http://localhost:3001
 */
import * as dotenv from 'dotenv';
import { LicenseShieldClient } from '../sdk';

dotenv.config();

async function main() {
  const baseUrl = process.env.LICENSE_SHIELD_URL || 'http://localhost:3001';

  const shield = new LicenseShieldClient(
    process.env.LICENSE_SHIELD_KEY
      ? { baseUrl, apiKey: process.env.LICENSE_SHIELD_KEY }
      : {
          baseUrl,
          signerKey: process.env.AGENT_WALLET_PRIVATE_KEY || '',
        }
  );

  // ── 1. Cheap pre-flight (sandbox) ───────────────────────────────────────────
  const preflight = await shield.verify({
    packages: ['axios@1.6.0', 'lodash@4.17.20'],
    agentId: 'example-coding-agent',
  });
  console.log('Preflight:', preflight.status, `score=${preflight.score}/100`);
  console.log('  ', preflight.explanation);

  // ── 2. Full paid audit (Model A or Model B depending on config) ────────────
  const report = await shield.audit({
    packages: ['axios@1.6.0', 'some-gpl-package@2.0.0'],
    targetLicense: 'MIT',
    agentId: 'example-coding-agent',
  });
  console.log('\nAudit:', report.status, `via ${report.authModel}`);
  console.log('  Reason:', report.reason);
  if (report.suggestedAlternatives.length) {
    console.log('  Alternatives:', report.suggestedAlternatives.join('; '));
  }

  // ── 3. Agent decision gate ─────────────────────────────────────────────────
  if (report.status === 'FLAGGED') {
    console.log('\n🛑 BLOCKED: do not install these packages. Suggest alternatives to the user.');
    process.exitCode = 1;
  } else {
    console.log('\n✅ APPROVED: safe to proceed with npm install.');
  }
}

main().catch((err) => {
  console.error('SDK example failed:', err.message || err);
  process.exit(1);
});
