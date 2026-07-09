/**
 * LicenseShield AI — CROO CAP SDK Agent Daemon
 * src/agentDaemon.ts
 *
 * A standalone, persistent background process that:
 *   1. Binds to the CROO WebSocket via agentClient.connectWebSocket()
 *   2. Listens for order_negotiation_created envelopes
 *   3. Parses the dependency payload from the buyer's requirements field
 *   4. Runs the full NPM + OSV + Gemini audit pipeline
 *   5. Invokes agentClient.deliverOrder() once on-chain escrow payment is confirmed
 *
 * No custom Solidity contracts — all on-chain mechanics use CROO SDK's
 * built-in Account Abstraction wallet on Base Sepolia Testnet.
 *
 * Usage:
 *   npx ts-node lib/agentDaemon.ts
 *   (or via: npm run agent)
 */

import * as path from 'path';
import * as fs from 'fs';

// ── Inline .env loader (no dotenv dependency) ─────────────────────────────────
function loadEnv(): void {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

import {
  AgentClient,
  EventType,
  DeliverableType,
  APIError,
} from '@croo-network/sdk';
import type { EventStream, Event, Order } from '@croo-network/sdk';

import { fetchNpmLicenseAndVersion } from './npm-fetcher';
import { queryOSVBatch } from './osv-client';
import { checkLicenseCompatibility } from './license-engine';
import { runAIAudit } from './gemini';
import { parseLicenseText, analyzeVulnerabilities } from './geminiScanner';
import type { PackageInput, RiskItem } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** JSON shape expected inside Negotiation.requirements from buyer agents */
interface BuyerDependencyPayload {
  projectLicense: string;
  packages: PackageInput[];
}

/** Deliverable schema sent back to the buyer via deliverOrder */
interface AuditReport {
  status: 'APPROVED' | 'FLAGGED';
  risks: RiskItem[];
  suggestions: string[];
  aiAnalysis?: string;
  perPackageInsights: PerPackageInsight[];
  scannedAt: string;
  orderId: string;
  agentVersion: string;
}

interface PerPackageInsight {
  package: string;
  version?: string;
  resolvedLicense: string;
  geminiLicenseVerdict?: { status: string; reason: string; suggestedAlternatives: string[] };
  geminiVulnVerdict?: { status: string; reason: string; suggestedAlternatives: string[] };
}

// ─── Timestamp Logger ─────────────────────────────────────────────────────────

const log = {
  info:  (msg: string) => console.log( `[${new Date().toISOString()}] INFO  ${msg}`),
  warn:  (msg: string) => console.warn( `[${new Date().toISOString()}] WARN  ${msg}`),
  error: (msg: string) => console.error(`[${new Date().toISOString()}] ERROR ${msg}`),
  debug: (msg: string) => console.debug(`[${new Date().toISOString()}] DEBUG ${msg}`),
};

// ─── Audit Pipeline ────────────────────────────────────────────────────────────

async function executeAuditPipeline(
  payload: BuyerDependencyPayload,
  orderId: string
): Promise<AuditReport> {
  const { packages, projectLicense } = payload;
  log.info(`[audit:${orderId}] Pipeline START — ${packages.length} packages, policy: ${projectLicense}`);

  // ── Step 1: Resolve licenses from NPM Registry ─────────────────────────────
  log.info(`[audit:${orderId}] Step 1/4 — Resolving licenses from NPM Registry...`);
  const resolvedPackages = await Promise.all(
    packages.map(async (pkg) => {
      if (pkg.ecosystem === 'npm') {
        const { license, version } = await fetchNpmLicenseAndVersion(pkg.name, pkg.version);
        return { ...pkg, license, version };
      }
      return { ...pkg, license: 'UNKNOWN', version: pkg.version };
    })
  );

  // ── Step 2: Batch OSV vulnerability scan ──────────────────────────────────
  log.info(`[audit:${orderId}] Step 2/4 — Querying OSV.dev for CVE data...`);
  const osvResults = await queryOSVBatch(resolvedPackages);

  // ── Step 3: Per-package Gemini deep analysis ──────────────────────────────
  log.info(`[audit:${orderId}] Step 3/4 — Running Gemini 2.5 Flash per-package analysis...`);
  const perPackageInsights: PerPackageInsight[] = [];

  for (const pkg of resolvedPackages) {
    const insight: PerPackageInsight = {
      package: pkg.name,
      version: pkg.version,
      resolvedLicense: pkg.license,
    };

    // Gemini license parsing for UNKNOWN or non-standard licenses
    if (pkg.license === 'UNKNOWN' || pkg.license.includes(' OR ') || pkg.license.includes(' AND ')) {
      try {
        insight.geminiLicenseVerdict = await parseLicenseText(
          pkg.license,
          projectLicense,
          pkg.name
        );
        log.debug(`[audit:${orderId}]   → ${pkg.name} license verdict: ${insight.geminiLicenseVerdict.status}`);
      } catch (e) {
        log.warn(`[audit:${orderId}]   → Gemini license parse failed for ${pkg.name}: ${e}`);
      }
    }

    // Gemini vulnerability contextualization for packages with CVEs
    const vulns = osvResults.get(pkg.name) || [];
    if (vulns.length > 0) {
      try {
        insight.geminiVulnVerdict = await analyzeVulnerabilities(
          pkg.name,
          pkg.version ?? 'unknown',
          vulns,
          `${projectLicense}-licensed dependency`
        );
        log.debug(`[audit:${orderId}]   → ${pkg.name} vuln verdict: ${insight.geminiVulnVerdict.status} (${vulns.length} CVEs)`);
      } catch (e) {
        log.warn(`[audit:${orderId}]   → Gemini vuln analysis failed for ${pkg.name}: ${e}`);
      }
    }

    perPackageInsights.push(insight);
  }

  // ── Step 4: Holistic AI audit via runAIAudit ──────────────────────────────
  log.info(`[audit:${orderId}] Step 4/4 — Running holistic Gemini AI audit...`);
  const packagesForAi = resolvedPackages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    vulnerabilities: osvResults.get(pkg.name) || [],
  }));

  const aiVerdict = await runAIAudit(projectLicense, packagesForAi);

  if (aiVerdict) {
    log.info(
      `[audit:${orderId}] Pipeline COMPLETE — AI verdict: ${aiVerdict.status}, ` +
      `${aiVerdict.risks.length} risks`
    );
    return {
      status: aiVerdict.status,
      risks: aiVerdict.risks,
      suggestions: aiVerdict.suggestions,
      aiAnalysis: aiVerdict.aiAnalysis,
      perPackageInsights,
      scannedAt: new Date().toISOString(),
      orderId,
      agentVersion: '1.0.0',
    };
  }

  // ── Fallback: deterministic rule-based engine ──────────────────────────────
  log.warn(`[audit:${orderId}] Gemini holistic audit unavailable — using rule-based fallback.`);
  const risks: RiskItem[] = [];
  const suggestions: string[] = [];

  for (const pkg of resolvedPackages) {
    // Rule-based license check
    const conflict = checkLicenseCompatibility(pkg.name, pkg.license, projectLicense);
    if (conflict) {
      risks.push(conflict);
      suggestions.push(
        conflict.severity === 'HIGH'
          ? `Replace ${pkg.name} with a ${projectLicense}-compatible alternative (current: ${pkg.license}).`
          : `Review license terms for ${pkg.name} (${pkg.license}).`
      );
    }

    // Rule-based CVE check — escalate any Gemini insights we have
    const insight = perPackageInsights.find((i) => i.package === pkg.name);
    const vulns = osvResults.get(pkg.name) || [];

    if (insight?.geminiVulnVerdict?.status === 'FLAGGED') {
      risks.push({
        package: pkg.name,
        type: 'VULNERABILITY',
        severity: 'HIGH',
        detail: insight.geminiVulnVerdict.reason,
      });
      if (insight.geminiVulnVerdict.suggestedAlternatives.length > 0) {
        suggestions.push(
          `Replace ${pkg.name} with: ${insight.geminiVulnVerdict.suggestedAlternatives.join(', ')}`
        );
      }
    } else if (vulns.length > 0) {
      risks.push({
        package: pkg.name,
        type: 'VULNERABILITY',
        severity: 'HIGH',
        detail: `${vulns.length} known CVEs (e.g. ${vulns[0].id})`,
      });
      suggestions.push(`Upgrade or replace ${pkg.name} to address ${vulns.length} known CVEs.`);
    }
  }

  const status = risks.some((r) => r.severity === 'HIGH') ? 'FLAGGED' : 'APPROVED';
  return {
    status,
    risks,
    suggestions: [...new Set(suggestions)],
    perPackageInsights,
    scannedAt: new Date().toISOString(),
    orderId,
    agentVersion: '1.0.0',
  };
}

// ─── Daemon Main Loop ─────────────────────────────────────────────────────────

async function startDaemon(): Promise<void> {
  // ── Env validation ─────────────────────────────────────────────────────────
  const sdkKey = process.env.CROO_SDK_KEY;
  if (!sdkKey) {
    log.error('CROO_SDK_KEY is not set. Get one from https://croo.network and add it to .env');
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    log.warn('GEMINI_API_KEY not set — Gemini analysis will be skipped (rule-based fallback only).');
  }

  const baseURL = process.env.CROO_API_URL ?? 'https://api.croo.network';
  const wsURL   = process.env.CROO_WS_URL  ?? 'wss://api.croo.network/ws';
  const rpcURL  = process.env.RPC           ?? 'https://sepolia.base.org';

  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info('  LicenseShield AI — CROO Agent Daemon v1.0.0');
  log.info(`  API:     ${baseURL}`);
  log.info(`  WS:      ${wsURL}`);
  log.info(`  RPC:     ${rpcURL}`);
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── Build AgentClient ──────────────────────────────────────────────────────
  const agentClient = new AgentClient({ baseURL, wsURL, rpcURL, logger: log }, sdkKey);

  // ── Step A: agentClient.connectWebSocket() ─────────────────────────────────
  log.info('[daemon] Connecting WebSocket to CROO network...');
  const stream: EventStream = await agentClient.connectWebSocket();
  log.info('[daemon] ✅ WebSocket connected — waiting for buyer negotiations.');

  // In-flight tracker: negotiationId → orderId
  const pendingOrders = new Map<string, string>();
  const MAX_CONCURRENT = 5;

  // ── Event: order_negotiation_created ──────────────────────────────────────
  // Step B: Parse incoming order_negotiation_created envelopes
  stream.on(EventType.NegotiationCreated, async (e: Event) => {
    const negotiationId = e.negotiation_id!;
    log.info(`[daemon] 📨 NegotiationCreated received: ${negotiationId}`);

    if (pendingOrders.size >= MAX_CONCURRENT) {
      log.warn(`[daemon] At capacity (${MAX_CONCURRENT} in-flight). Rejecting ${negotiationId}.`);
      try {
        await agentClient.rejectNegotiation(negotiationId, 'Provider at capacity. Please retry.');
      } catch (err) {
        log.error(`[daemon] Failed to reject negotiation ${negotiationId}: ${err}`);
      }
      return;
    }

    try {
      // Fetch full negotiation to extract the requirements payload
      const neg = await agentClient.getNegotiation(negotiationId);

      // Parse and validate the buyer's dependency payload
      let payload: BuyerDependencyPayload;
      try {
        payload = JSON.parse(neg.requirements) as BuyerDependencyPayload;
        if (!payload.projectLicense || !Array.isArray(payload.packages) || payload.packages.length === 0) {
          throw new Error('Missing projectLicense or non-empty packages array');
        }
      } catch (parseErr) {
        log.warn(`[daemon] Invalid payload in negotiation ${negotiationId}. Rejecting. Error: ${parseErr}`);
        await agentClient.rejectNegotiation(
          negotiationId,
          'Invalid requirements JSON. Expected: { projectLicense: string, packages: [{ name, version?, ecosystem }] }'
        );
        return;
      }

      log.info(
        `[daemon] ✅ Payload valid. Packages: ${payload.packages.map((p) => p.name).join(', ')}. ` +
        `Policy: ${payload.projectLicense}`
      );

      // Accept negotiation — CROO SDK submits createOrder on-chain automatically
      const acceptResult = await agentClient.acceptNegotiation(negotiationId);
      const orderId = acceptResult.order.orderId;
      pendingOrders.set(negotiationId, orderId);

      log.info(
        `[daemon] ✅ Negotiation accepted → orderId: ${orderId}. ` +
        `Chain order: ${acceptResult.order.chainOrderId}. ` +
        `Waiting for buyer escrow payment...`
      );
    } catch (err) {
      if (err instanceof APIError) {
        log.error(`[daemon] APIError on NegotiationCreated [${err.code}]: ${err.message}`);
      } else {
        log.error(`[daemon] Unexpected error on NegotiationCreated: ${err}`);
      }
    }
  });

  // ── Event: OrderPaid ──────────────────────────────────────────────────────
  // Step C & D: On-chain escrow confirmed → run audit → deliverOrder
  stream.on(EventType.OrderPaid, async (e: Event) => {
    const orderId = e.order_id!;
    log.info(`[daemon] 💰 OrderPaid confirmed on-chain: ${orderId}`);

    try {
      // Retrieve order and its source negotiation to get buyer payload
      const order: Order = await agentClient.getOrder(orderId);
      const neg = await agentClient.getNegotiation(order.negotiationId);
      const payload: BuyerDependencyPayload = JSON.parse(neg.requirements);

      // Run the full audit pipeline
      const report = await executeAuditPipeline(payload, orderId);

      // Step D: agentClient.deliverOrder with full JSON schema deliverable
      const deliverResult = await agentClient.deliverOrder(orderId, {
        deliverableType: DeliverableType.Schema,
        deliverableText: JSON.stringify(report, null, 2),
      });

      log.info(
        `[daemon] ✅ Delivered order ${orderId}. ` +
        `Status: ${report.status}. ` +
        `Risks: ${report.risks.length}. ` +
        `Tx: ${deliverResult.txHash}`
      );

      pendingOrders.delete(order.negotiationId);
    } catch (err) {
      if (err instanceof APIError) {
        log.error(`[daemon] APIError on OrderPaid [${err.code}]: ${err.message}`);
      } else {
        log.error(`[daemon] Unexpected error on OrderPaid: ${err}`);
      }
    }
  });

  // ── Event: OrderCompleted ─────────────────────────────────────────────────
  stream.on(EventType.OrderCompleted, (e: Event) => {
    log.info(`[daemon] 🎉 OrderCompleted: ${e.order_id} — payment settled on Base Sepolia.`);
  });

  // ── Event: OrderExpired ───────────────────────────────────────────────────
  stream.on(EventType.OrderExpired, (e: Event) => {
    log.warn(`[daemon] ⏰ OrderExpired: ${e.order_id} — SLA window breached.`);
  });

  // ── Event: OrderRejected ──────────────────────────────────────────────────
  stream.on(EventType.OrderRejected, (e: Event) => {
    log.warn(`[daemon] ❌ OrderRejected: ${e.order_id} — reason: ${e.reason ?? 'none'}`);
  });

  // ── Catch-all ─────────────────────────────────────────────────────────────
  stream.onAny((e: Event) => {
    log.debug(
      `[daemon:event] type=${e.type} ` +
      `neg=${e.negotiation_id ?? '-'} ` +
      `order=${e.order_id ?? '-'} ` +
      `status=${e.status ?? '-'}`
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = (sig: string) => {
    log.info(`[daemon] Received ${sig}. Shutting down gracefully...`);
    stream.close();
    log.info('[daemon] WebSocket closed. Goodbye.');
    process.exit(0);
  };
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Keep process alive — EventStream handles reconnect internally
  log.info('[daemon] 🟢 Agent Daemon is live. Ctrl+C to stop.');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
startDaemon().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
