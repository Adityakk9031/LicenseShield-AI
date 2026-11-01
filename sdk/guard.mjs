#!/usr/bin/env node
/**
 * LicenseShield Guard — Live A2A Firewall & Auto-Correction for AI Coding Agents
 * ==============================================================================
 * Wraps a package-manager command (npm/pnpm/yarn/bun install|add|un) and enforces
 * the LicenseShield 3-Pillar Threat Scan BEFORE execution:
 *
 *   1. License Compliance (blocks viral AGPL/GPL/SSPL copyleft traps)
 *   2. Security & Malware Guard (blocks AI-hallucinated 404 packages & typosquatting)
 *   3. Vulnerability & Deprecation Check (blocks active OSV CVEs & deprecated bloat)
 *
 * Verdicts:
 *   PASS   → runs the real command transparently (exit code preserved)
 *   WARN   → prints the warning, runs anyway
 *   FAIL   → BLOCKS installation and outputs A2A Auto-Correction instructions
 *            (or auto-pivots to the safe command if LICENSE_SHIELD_AUTO_FIX=1)
 *
 * Usage:
 *   node sdk/guard.mjs -- npm install axios@1.6.0 left-pad
 *   node sdk/guard.mjs --auto-fix -- npm install axois@1.6.0
 */

import { spawn } from 'node:child_process';

const BASE_URL = (process.env.LICENSE_SHIELD_URL || 'http://localhost:8080').replace(/\/+$/, '');
const API_KEY = process.env.LICENSE_SHIELD_KEY || '';

const PM_PATTERNS = /^(npm|pnpm|yarn|bun)\s+(install|i|add|un|uninstall|remove)\b/;

const CYAN = (s) => `\x1b[36m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const MAGENTA = (s) => `\x1b[35m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;

function extractPackages(args) {
  const pkgs = [];
  for (const arg of args) {
    if (!arg || arg.startsWith('-')) continue;
    if (/^(install|i|add|un|uninstall|remove|npm|pnpm|yarn|bun)$/.test(arg)) continue;
    pkgs.push(arg);
  }
  return pkgs;
}

function describeRisk(d) {
  switch (d.riskType) {
    case 'TYPOSQUATTING_RISK':
      return `TYPOSQUATTING ATTACK (${d.conflictDetail || 'impersonates popular package'}${d.suggestedReplacement ? ` → did you mean "${d.suggestedReplacement}"?` : ''})`;
    case 'HALLUCINATED_PACKAGE':
      return `AI HALLUCINATION / 404 NOT FOUND ON NPM (slopsquatting malware vector)`;
    case 'COPYLEFT_VIOLATION':
      return `COPYLEFT LEGAL TRAP (license ${d.license} violates target policy)`;
    case 'CRITICAL_CVE':
      return `${d.vulnerabilitiesCount} KNOWN OSV CVE(S) (e.g. ${d.vulnerabilities?.[0]?.id || 'CVE'})`;
    case 'DEPRECATED_PACKAGE':
      return `DEPRECATED / UNMAINTAINED (${d.deprecated || 'deprecated library'})`;
    default:
      return d.conflictDetail || 'unverified or unknown license';
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const autoFixFlag = argv.includes('--auto-fix') || process.env.LICENSE_SHIELD_AUTO_FIX === '1';
  const filteredArgv = argv.filter((a) => a !== '--auto-fix');
  const dashdash = filteredArgv.indexOf('--');
  const commandArgs = (dashdash >= 0 ? filteredArgv.slice(dashdash + 1) : filteredArgv).filter(
    Boolean
  );

  if (commandArgs.length === 0) {
    console.error(
      `${RED('LicenseShield Guard')} — usage: node sdk/guard.mjs [--auto-fix] -- npm install <packages…>`
    );
    process.exit(2);
  }

  const command = commandArgs.join(' ');

  // Not a package operation → pass straight through, zero overhead.
  if (!PM_PATTERNS.test(command)) {
    runRealCommand(commandArgs);
    return;
  }

  const packages = extractPackages(commandArgs);

  console.error(CYAN(`\n🛡  LicenseShield A2A Firewall — intercepting: ${BOLD(command)}`));
  if (packages.length === 0) {
    console.error(CYAN('   No explicit packages detected — passing through.\n'));
    runRealCommand(commandArgs);
    return;
  }

  // ── Call the LicenseShield verify API ──────────────────────────────────────
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/api/v1/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        command,
        packages,
        agentId: process.env.LICENSE_SHIELD_AGENT_ID || 'guard-wrapper',
        targetPolicy: process.env.LICENSE_SHIELD_POLICY || 'MIT',
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    console.error(YELLOW(`\n⚠  LicenseShield unreachable (${err.message}) — command allowed.`));
    console.error(YELLOW('   Set LICENSE_SHIELD_FAIL_CLOSED=1 to block instead.\n'));
    if (process.env.LICENSE_SHIELD_FAIL_CLOSED === '1') process.exit(1);
    runRealCommand(commandArgs);
    return;
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    console.error(RED(`\n🛑 LicenseShield API error (HTTP ${res.status}).`));
    console.error(RED(`   ${bodyText.slice(0, 400)}`));
    process.exit(1);
  }

  const verdict = await res.json();
  const score = typeof verdict.score === 'number' ? `${verdict.score}/100` : '?';

  if (verdict.status === 'FAIL') {
    console.error(
      RED(
        `\n🛑  LICENSESHIELD FIREWALL BLOCKED — score ${score} | policy ${verdict.targetPolicy || 'MIT'}`
      )
    );
    console.error(RED('─'.repeat(76)));
    for (const d of verdict.details || []) {
      if (d.status !== 'FLAGGED') continue;
      console.error(RED(`   ✖ ${d.package}@${d.version} — ${describeRisk(d)}`));
      for (const v of d.vulnerabilities || []) {
        console.error(`       • ${v.id}: ${v.summary}`);
      }
    }
    console.error(RED('─'.repeat(76)));

    if (verdict.recommendation) {
      console.error(YELLOW(`\n💡 Gemini Remediation: ${verdict.recommendation}`));
    }

    const autoPlan = verdict.autoCorrection;
    if (autoPlan?.remediationCommand) {
      console.error(
        MAGENTA(
          `\n🤖 A2A AUTO-CORRECTION COMMAND: ${BOLD(autoPlan.remediationCommand)}`
        )
      );

      if (autoFixFlag && autoPlan.canAutoFix) {
        console.error(
          GREEN(
            `\n⚡ [A2A AUTO-PIVOT ENABLED] Automatically pivoting to safe command: ${BOLD(autoPlan.remediationCommand)}\n`
          )
        );
        runRealCommand(autoPlan.remediationCommand.split(/\s+/));
        return;
      }
    }

    console.error(YELLOW('   Apply the A2A remediation above, then re-run the command.\n'));
    process.exit(1);
  }

  if (verdict.status === 'WARN') {
    console.error(YELLOW(`\n⚠  LICENSESHIELD WARNING — score ${score}`));
    if (verdict.explanation) console.error(YELLOW(`   ${verdict.explanation}`));
    console.error('');
  } else {
    console.error(
      GREEN(
        `\n✅ LICENSESHIELD APPROVED — score ${score} | proof ${String(verdict.executionProof || '').slice(0, 18)}…`
      )
    );
    console.error('');
  }

  runRealCommand(commandArgs);
}

function runRealCommand(args) {
  const child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('close', (code) => process.exit(code ?? 1));
  child.on('error', (err) => {
    console.error(RED(`Failed to run command: ${err.message}`));
    process.exit(1);
  });
}

main();
