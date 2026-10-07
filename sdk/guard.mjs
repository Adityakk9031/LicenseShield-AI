#!/usr/bin/env node
/**
 * LicenseShield Guard — Live Interception for AI Coding Agents
 * ============================================================
 * Wraps a package-manager command (npm/pnpm/yarn install|add|un) and enforces
 * the LicenseShield verdict BEFORE the real command touches your project:
 *
 *   PASS   → runs the real command transparently (exit code preserved)
 *   WARN   → prints the warning, runs anyway
 *   FAIL   → BLOCKS: prints Gemini's alternatives, never executes (exit 1)
 *
 * Usage:
 *   node sdk/guard.mjs -- npm install axios@1.6.0 left-pad
 *   node sdk/guard.mjs -- pnpm add some-gpl-package
 *
 * Wire it into an AI coding agent (see sdk/LICENSE_SHIELD_SDK.md):
 *   • Claude Code: PreToolUse hook on Bash(npm install*)
 *   • Cursor / Gemini CLI: pre-command hook running the same wrapper
 *
 * Config (env):
 *   LICENSE_SHIELD_URL   backend base URL (default http://localhost:3001)
 *   LICENSE_SHIELD_KEY   ls_live_* API key (Model A — recommended)
 *   AGENT_WALLET_PRIVATE_KEY  funded wallet key (Model B — escrow, via SDK)
 */

import { spawn } from 'node:child_process';

const BASE_URL = (process.env.LICENSE_SHIELD_URL || 'http://localhost:3001').replace(/\/+$/, '');
const API_KEY = process.env.LICENSE_SHIELD_KEY || '';

const PM_PATTERNS = /^(npm|pnpm|yarn|bun)\s+(install|i|add|un|uninstall|remove)\b/;

const CYAN = (s) => `\x1b[36m${s}\x1b[0m`;
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const BOLD = (s) => `\x1b[1m${s}\x1b[0m`;

function extractPackages(args) {
  const pkgs = [];
  for (const arg of args) {
    if (!arg || arg.startsWith('-')) continue;
    // Skip the package-manager subcommand tokens
    if (/^(install|i|add|un|uninstall|remove|npm|pnpm|yarn|bun)$/.test(arg)) continue;
    // Strip npm alias syntax (foo@npm:bar@1.0) and semver range chars are fine as-is
    pkgs.push(arg);
  }
  return pkgs;
}

async function main() {
  const argv = process.argv.slice(2);
  const dashdash = argv.indexOf('--');
  const commandArgs = (dashdash >= 0 ? argv.slice(dashdash + 1) : argv).filter(Boolean);

  if (commandArgs.length === 0) {
    console.error(`${RED('LicenseShield Guard')} — usage: node sdk/guard.mjs -- npm install <packages…>`);
    process.exit(2);
  }

  const command = commandArgs.join(' ');

  // Not a package operation → pass straight through, zero overhead.
  if (!PM_PATTERNS.test(command)) {
    runRealCommand(commandArgs);
    return;
  }

  const packages = extractPackages(commandArgs);

  console.error(CYAN(`\n🛡  LicenseShield Guard — intercepting: ${BOLD(command)}`));
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
    // Fail-open or fail-closed is a policy decision; default fail-open with a
    // loud warning so a backend outage never bricks a developer's workflow.
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
    console.error(RED(`\n🛑  LICENSESHIELD BLOCKED — score ${score} | policy ${verdict.targetPolicy || 'MIT'}`));
    console.error(RED('─'.repeat(72)));
    for (const d of verdict.details || []) {
      if (d.status !== 'FLAGGED') continue;
      const reason =
        d.riskType === 'COPYLEFT_VIOLATION'
          ? `license ${d.license} conflicts with policy`
          : d.riskType === 'CRITICAL_CVE'
            ? `${d.vulnerabilitiesCount} known CVEs (e.g. ${d.vulnerabilities?.[0]?.id || 'OSV'})`
            : 'unknown license';
      console.error(RED(`   ✖ ${d.package}@${d.version} — ${reason}`));
      for (const v of d.vulnerabilities || []) {
        console.error(`       • ${v.id}: ${v.summary}`);
      }
    }
    console.error(RED('─'.repeat(72)));
    if (verdict.recommendation) {
      console.error(YELLOW(`\n💡 Gemini recommendation: ${verdict.recommendation}`));
    }
    console.error(YELLOW('   Fix the dependencies above, then re-run the command.\n'));
    process.exit(1);
  }

  if (verdict.status === 'WARN') {
    console.error(YELLOW(`\n⚠  LICENSESHIELD WARNING — score ${score}`));
    if (verdict.explanation) console.error(YELLOW(`   ${verdict.explanation}`));
    console.error('');
  } else {
    console.error(GREEN(`\n✅ LICENSESHIELD APPROVED — score ${score} | proof ${String(verdict.executionProof || '').slice(0, 18)}…`));
    console.error('');
  }

  runRealCommand(commandArgs);
}

/** Execute the real package-manager command with inherited stdio; exit with its code. */
function runRealCommand(args) {
  const child = spawn(args[0], args.slice(1), { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('close', (code) => process.exit(code ?? 1));
  child.on('error', (err) => {
    console.error(RED(`Failed to run command: ${err.message}`));
    process.exit(1);
  });
}

main();
