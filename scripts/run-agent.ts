#!/usr/bin/env ts-node
/**
 * LicenseShield AI — Agent Runner
 *
 * Starts the CROO provider agent loop as a persistent process.
 * Run this alongside the Next.js dev server to handle live buyer requests.
 *
 * Usage:
 *   npx ts-node scripts/run-agent.ts
 *   (or via npm script: npm run agent)
 *
 * Required env vars (.env):
 *   CROO_SDK_KEY       — Your CROO provider SDK key (croo_sk_...)
 *   GEMINI_API_KEY     — Google AI API key for Gemini 2.5 Flash
 *   CROO_API_URL       — (optional) defaults to https://api.croo.network
 *   CROO_WS_URL        — (optional) defaults to wss://api.croo.network/ws
 *   RPC                — (optional) defaults to https://sepolia.base.org
 */

// Load .env before anything else
import * as path from 'path';
import * as fs from 'fs';

// Minimal .env loader (no dotenv dependency)
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadEnv();

import { startAgentLoop } from '../lib/agent-loop';

// ── Structured logger with timestamps ────────────────────────────────────────
const logger = {
  info:  (msg: string, ...args: any[]) => console.log( `[${new Date().toISOString()}] INFO  ${msg}`, ...args),
  warn:  (msg: string, ...args: any[]) => console.warn( `[${new Date().toISOString()}] WARN  ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[${new Date().toISOString()}] ERROR ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => console.debug(`[${new Date().toISOString()}] DEBUG ${msg}`, ...args),
};

// ── Boot ──────────────────────────────────────────────────────────────────────
async function main() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  LicenseShield AI — CROO Provider Agent');
  logger.info('  Network: Base Sepolia Testnet');
  logger.info('  AI:      Gemini 2.5 Flash');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validate env vars upfront for clear error messages
  const missingVars: string[] = [];
  if (!process.env.CROO_SDK_KEY)   missingVars.push('CROO_SDK_KEY');
  if (!process.env.GEMINI_API_KEY) missingVars.push('GEMINI_API_KEY');

  if (missingVars.length > 0) {
    logger.error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `  → Set them in your .env file and restart the agent.`
    );
    process.exit(1);
  }

  logger.info(`[boot] CROO_SDK_KEY:   ${process.env.CROO_SDK_KEY!.slice(0, 12)}...`);
  logger.info(`[boot] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY!.slice(0, 12)}...`);
  logger.info(`[boot] RPC endpoint:   ${process.env.RPC || 'https://sepolia.base.org'}`);

  let stream: Awaited<ReturnType<typeof startAgentLoop>>;

  try {
    stream = await startAgentLoop({
      retryDelayMs: 3_000,
      maxConcurrency: 5,
      logger,
    });
  } catch (err: any) {
    logger.error(`[boot] Failed to start agent loop: ${err.message}`);
    process.exit(1);
  }

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = (sig: string) => {
    logger.info(`[agent] Received ${sig}. Closing WebSocket...`);
    stream.close();
    logger.info('[agent] Goodbye.');
    process.exit(0);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep the process alive (stream handles reconnect internally)
  logger.info('[agent] 🟢 Agent is live. Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
