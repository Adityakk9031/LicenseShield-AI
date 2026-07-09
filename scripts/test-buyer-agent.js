#!/usr/bin/env node
/**
 * LicenseShield AI — Automated A2A End-to-End Test Runner
 * scripts/test-buyer-agent.js
 *
 * Simulates a fully autonomous buyer agent that:
 *   1. Sends a dependency audit request to LicenseShield AI (via the /api/audit
 *      endpoint that mirrors the full CROO A2A pipeline).
 *   2. Parses the structured verdict and tracks each risk.
 *   3. Simulates real-world agent decision: PROCEED or ABORT installation.
 *   4. Prints a full on-chain settlement summary from the CROO CAP transaction.
 *
 * Tests THREE scenarios:
 *   - Scenario A: Known-bad packages (colors@1.4.1 protestware + AGPL conflict)
 *   - Scenario B: Clean packages (no conflicts, no CVEs)
 *   - Scenario C: Ambiguous/mixed (lodash vulns + MIT-safe license)
 *
 * Usage:
 *   node scripts/test-buyer-agent.js
 *   (dev server must be running: npm run dev)
 */

const BASE_URL = process.env.AUDIT_URL ?? 'http://localhost:3000/api/audit';
const SEPARATOR = '═'.repeat(60);

// ─── ANSI colours (no dependencies) ──────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  purple: '\x1b[35m',
};
const col = (color, text) => `${color}${text}${c.reset}`;
const bold = (text)  => col(c.bold, text);
const ok   = (text)  => col(c.green, text);
const warn = (text)  => col(c.yellow, text);
const fail = (text)  => col(c.red, text);
const info = (text)  => col(c.cyan, text);
const dim  = (text)  => col(c.gray, text);

// ─── Test Scenarios ────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'A',
    name: 'Known-Vulnerable + License Conflict',
    description: 'colors@1.4.1 (protestware CVEs) + hypothetical AGPL package against MIT project',
    projectLicense: 'MIT',
    packages: [
      { name: 'colors',       version: '1.4.1',   ecosystem: 'npm' },
      { name: 'lodash',       version: '4.17.20',  ecosystem: 'npm' },
      { name: 'left-pad',     version: '1.3.0',    ecosystem: 'npm' },
    ],
    expectFlagged: true,
  },
  {
    id: 'B',
    name: 'Clean Dependency Set',
    description: 'Well-maintained, actively-patched packages with MIT-compatible licenses',
    projectLicense: 'MIT',
    packages: [
      { name: 'chalk',        version: '5.3.0',    ecosystem: 'npm' },
      { name: 'dotenv',       version: '16.0.3',   ecosystem: 'npm' },
      { name: 'zod',          version: '3.22.4',   ecosystem: 'npm' },
    ],
    expectFlagged: false,
  },
  {
    id: 'C',
    name: 'Proprietary Project with Copyleft Risk',
    description: 'A proprietary project using packages that may carry GPL/LGPL obligations',
    projectLicense: 'PROPRIETARY',
    packages: [
      { name: 'commander',    version: '11.0.0',   ecosystem: 'npm' },
      { name: 'inquirer',     version: '9.2.0',    ecosystem: 'npm' },
      { name: 'glob',         version: '10.3.3',   ecosystem: 'npm' },
    ],
    expectFlagged: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function severityColor(severity) {
  switch (severity) {
    case 'HIGH':   return fail(severity);
    case 'MEDIUM': return warn(severity);
    default:       return dim(severity);
  }
}

function printRisk(risk, idx) {
  console.log(
    `  ${dim(`${idx + 1}.`)} [${severityColor(risk.severity)}] ` +
    `${bold(risk.package)} ${dim(`(${risk.type})`)} — ${risk.detail}`
  );
}

async function runScenario(scenario) {
  const start = Date.now();
  console.log(`\n${SEPARATOR}`);
  console.log(bold(`SCENARIO ${scenario.id}: ${scenario.name}`));
  console.log(dim(scenario.description));
  console.log(dim(`License Policy: ${scenario.projectLicense}`));
  console.log(dim(`Packages: ${scenario.packages.map(p => `${p.name}@${p.version ?? 'latest'}`).join(', ')}`));
  console.log(SEPARATOR);
  console.log(info('[BuyerAgent] Sending audit request to LicenseShield AI via CROO Network...'));

  let verdict;
  try {
    const res = await fetch(BASE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        packages:       scenario.packages,
        projectLicense: scenario.projectLicense,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    verdict = await res.json();
  } catch (err) {
    console.error(fail(`[BuyerAgent] ❌ Request failed: ${err.message}`));
    console.error(warn('  → Is the dev server running? Start with: npm run dev'));
    return { scenarioId: scenario.id, passed: false, error: err.message };
  }

  const elapsed = Date.now() - start;

  // ── Print verdict ─────────────────────────────────────────────────────────
  const statusLabel = verdict.status === 'APPROVED'
    ? ok(`✅ APPROVED`)
    : fail(`🚨 FLAGGED`);

  console.log(`\n${bold('━━━ VERDICT ━━━')}`);
  console.log(`  Status:   ${statusLabel}`);
  console.log(`  Risks:    ${verdict.risks?.length ?? 0} detected`);
  console.log(`  Duration: ${formatDuration(elapsed)}`);

  // AI Analysis panel
  if (verdict.aiAnalysis) {
    console.log(`\n${bold('━━━ Gemini 2.5 Flash Analysis ━━━')}`);
    console.log(`  ${info(verdict.aiAnalysis)}`);
  }

  // CROO settlement data
  if (verdict.capTransaction) {
    const tx = verdict.capTransaction;
    console.log(`\n${bold('━━━ CROO CAP Settlement ━━━')}`);
    console.log(`  ${dim('Order ID:')}     ${tx.orderId}`);
    console.log(`  ${dim('Negotiation:')} ${tx.negotiationId}`);
    console.log(`  ${dim('Status:')}       ${tx.status}`);
    console.log(`  ${dim('Settled at:')}  ${tx.settledAt}`);
  }

  // Risk breakdown
  if (verdict.risks?.length > 0) {
    console.log(`\n${bold('━━━ Risk Breakdown ━━━')}`);
    verdict.risks.forEach(printRisk);
  }

  // Suggestions
  if (verdict.suggestions?.length > 0) {
    console.log(`\n${bold('━━━ Remediation Suggestions ━━━')}`);
    verdict.suggestions.forEach((s, i) => console.log(`  ${dim(`${i + 1}.`)} ${s}`));
  }

  // ── Buyer agent decision ──────────────────────────────────────────────────
  console.log(`\n${bold('━━━ BuyerAgent Decision ━━━')}`);
  const highRisks = verdict.risks?.filter(r => r.severity === 'HIGH') ?? [];

  if (verdict.status === 'APPROVED' || highRisks.length === 0) {
    console.log(ok('  [BuyerAgent] ✅ No blocking risks detected.'));
    console.log(ok(`  [BuyerAgent] ▶ Proceeding with: npm install ${scenario.packages.map(p => p.name).join(' ')}`));
  } else {
    console.log(fail('  [BuyerAgent] 🛑 HIGH-SEVERITY risks detected. Installation ABORTED.'));
    console.log(fail(`  [BuyerAgent] Blocked ${highRisks.length} HIGH-risk package(s):`));
    highRisks.forEach(r => console.log(fail(`    → ${r.package}: ${r.detail}`)));
  }

  // ── Pass/Fail assertion ───────────────────────────────────────────────────
  const actualFlagged = verdict.status === 'FLAGGED';
  const passed = actualFlagged === scenario.expectFlagged;
  const assertLabel = passed ? ok('PASS') : fail('FAIL');
  console.log(`\n  Assertion: Expected ${scenario.expectFlagged ? 'FLAGGED' : 'APPROVED'} → ${assertLabel}`);

  return {
    scenarioId:    scenario.id,
    name:          scenario.name,
    passed,
    status:        verdict.status,
    risksFound:    verdict.risks?.length ?? 0,
    highRisks:     highRisks.length,
    elapsed,
    orderId:       verdict.capTransaction?.orderId ?? 'N/A',
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(bold(col(c.purple,
    '\n' +
    '  ██╗     ██╗ ██████╗███████╗███╗   ██╗███████╗███████╗██╗  ██╗██╗███████╗██╗     ██████╗ \n' +
    '  ██║     ██║██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗\n' +
    '  ██║     ██║██║     █████╗  ██╔██╗ ██║███████╗█████╗  ███████║██║█████╗  ██║     ██║  ██║\n' +
    '  ██║     ██║██║     ██╔══╝  ██║╚██╗██║╚════██║██╔══╝  ██╔══██║██║██╔══╝  ██║     ██║  ██║\n' +
    '  ███████╗██║╚██████╗███████╗██║ ╚████║███████║███████╗██║  ██║██║███████╗███████╗██████╔╝\n' +
    '  ╚══════╝╚═╝ ╚═════╝╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ \n'
  )));

  console.log(bold('  LicenseShield AI — Automated A2A Test Runner'));
  console.log(dim('  CROO Agent Hackathon | Data & Verification / Dev Tooling Track'));
  console.log(dim(`  API Target: ${BASE_URL}`));
  console.log(dim(`  Timestamp:  ${new Date().toISOString()}`));
  console.log(dim(`  Scenarios:  ${SCENARIOS.length}`));

  const results = [];
  for (const scenario of SCENARIOS) {
    const result = await runScenario(scenario);
    results.push(result);
    // Brief pause between scenarios to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n\n${SEPARATOR}`);
  console.log(bold('FINAL TEST SUMMARY'));
  console.log(SEPARATOR);

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  results.forEach(r => {
    const icon   = r.passed   ? ok('PASS') : fail('FAIL');
    const status = r.error    ? fail('ERROR') :
                   r.status === 'FLAGGED' ? fail('FLAGGED') : ok('APPROVED');
    if (r.error) {
      console.log(`  [${icon}] Scenario ${r.scenarioId}: ${fail('ERROR')} — ${r.error}`);
    } else {
      console.log(
        `  [${icon}] Scenario ${r.scenarioId}: ${status} ` +
        `| Risks: ${r.risksFound} (HIGH: ${r.highRisks}) ` +
        `| ${formatDuration(r.elapsed)} ` +
        `| Order: ${dim(r.orderId)}`
      );
    }
  });

  console.log(`\n  ${bold('Results:')} ${ok(`${passed} passed`)}, ${failed > 0 ? fail(`${failed} failed`) : dim('0 failed')}`);

  if (failed === 0) {
    console.log(ok('\n  ✅ All scenarios passed. LicenseShield AI is submission-ready.\n'));
  } else {
    console.log(fail('\n  ❌ Some scenarios failed. Review the output above.\n'));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(fail('\n[FATAL] Test runner crashed:'), err.message);
  console.error(warn('  → Ensure the Next.js dev server is running: npm run dev'));
  process.exit(1);
});
