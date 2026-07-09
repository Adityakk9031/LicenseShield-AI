/**
 * LicenseShield AI — CROO Provider Agent Loop
 *
 * Architecture:
 *   CROO WebSocket → NegotiationCreated → acceptNegotiation()
 *                  → OrderPaid          → [NPM fetch + OSV scan + Gemini analysis]
 *                                       → deliverOrder()
 *
 * No custom Solidity contracts. All on-chain work is handled by the
 * CROO SDK's built-in AA wallet infrastructure on Base Sepolia.
 */

import { AgentClient, EventType, DeliverableType, APIError } from '@croo-network/sdk';
import type { EventStream, Event, Order } from '@croo-network/sdk';
import { fetchNpmLicenseAndVersion } from './npm-fetcher';
import { queryOSVBatch } from './osv-client';
import { checkLicenseCompatibility } from './license-engine';
import { runAIAudit } from './gemini';
import type { PackageInput, RiskItem } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the JSON payload a buyer sends as `requirements` in negotiateOrder */
export interface BuyerRequest {
  projectLicense: string;
  packages: PackageInput[];
}

/** Full audit result returned to the buyer via deliverOrder */
export interface AuditDeliverable {
  status: 'APPROVED' | 'FLAGGED';
  risks: RiskItem[];
  suggestions: string[];
  aiAnalysis?: string;
  scannedAt: string;
  orderId: string;
}

// ─── AgentLoopOptions ─────────────────────────────────────────────────────────

export interface AgentLoopOptions {
  /** Minimum ms to wait before retrying a failed audit delivery (default 2000) */
  retryDelayMs?: number;
  /** Maximum negotiation processing concurrency (default 5) */
  maxConcurrency?: number;
  /** Optional structured logger — defaults to console */
  logger?: Pick<typeof console, 'info' | 'warn' | 'error' | 'debug'>;
}

// ─── Core Audit Engine ────────────────────────────────────────────────────────

/**
 * runLicenseAudit
 * Executes the full deterministic pipeline:
 *   NPM Registry → OSV.dev → license-engine (rule-based) → Gemini 2.5 Flash (AI)
 */
async function runLicenseAudit(
  req: BuyerRequest,
  orderId: string,
  log: AgentLoopOptions['logger']
): Promise<AuditDeliverable> {
  const { packages, projectLicense } = req;
  log!.info(`[audit:${orderId}] Resolving licenses for ${packages.length} packages...`);

  // Step 1 — Resolve licenses from NPM Registry
  const resolvedPackages = await Promise.all(
    packages.map(async (pkg) => {
      if (pkg.ecosystem === 'npm') {
        const { license, version } = await fetchNpmLicenseAndVersion(pkg.name, pkg.version);
        return { ...pkg, license, version };
      }
      return { ...pkg, license: 'UNKNOWN', version: pkg.version };
    })
  );

  // Step 2 — Batch-query OSV.dev for CVEs
  log!.info(`[audit:${orderId}] Querying OSV.dev for vulnerability data...`);
  const osvResults = await queryOSVBatch(resolvedPackages);

  // Step 3 — Build enriched package list for AI
  const packagesForAi = resolvedPackages.map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    vulnerabilities: osvResults.get(pkg.name) || [],
  }));

  // Step 4 — Run Gemini 2.5 Flash AI audit (primary path)
  log!.info(`[audit:${orderId}] Invoking Gemini 2.5 Flash AI analysis...`);
  const aiVerdict = await runAIAudit(projectLicense, packagesForAi);

  if (aiVerdict) {
    log!.info(
      `[audit:${orderId}] AI audit complete — status: ${aiVerdict.status}, ` +
      `risks: ${aiVerdict.risks.length}`
    );
    return {
      status: aiVerdict.status,
      risks: aiVerdict.risks,
      suggestions: aiVerdict.suggestions,
      aiAnalysis: aiVerdict.aiAnalysis,
      scannedAt: new Date().toISOString(),
      orderId,
    };
  }

  // Step 5 — Fallback: deterministic rule-based engine
  log!.warn(`[audit:${orderId}] Gemini unavailable — using rule-based fallback.`);
  const risks: RiskItem[] = [];
  const suggestions: string[] = [];

  resolvedPackages.forEach((pkg) => {
    // License compatibility check
    const conflict = checkLicenseCompatibility(pkg.name, pkg.license, projectLicense);
    if (conflict) {
      risks.push(conflict);
      suggestions.push(
        conflict.severity === 'HIGH'
          ? `Replace ${pkg.name} with a ${projectLicense}-compatible alternative (current: ${pkg.license}).`
          : `Review license terms for ${pkg.name} (${pkg.license}).`
      );
    }

    // Known CVE check
    const vulns = osvResults.get(pkg.name) || [];
    if (vulns.length > 0) {
      risks.push({
        package: pkg.name,
        type: 'VULNERABILITY',
        severity: 'HIGH',
        detail: `${vulns.length} known vulnerabilities (e.g. ${vulns[0].id})`,
      });
      suggestions.push(`Upgrade or replace ${pkg.name} to address ${vulns.length} known CVEs.`);
    }
  });

  const status = risks.some((r) => r.severity === 'HIGH') ? 'FLAGGED' : 'APPROVED';
  return {
    status,
    risks,
    suggestions: [...new Set(suggestions)],
    scannedAt: new Date().toISOString(),
    orderId,
  };
}

// ─── Main Agent Loop ──────────────────────────────────────────────────────────

/**
 * startAgentLoop
 *
 * Connects LicenseShield AI to the CROO WebSocket and runs the full
 * provider lifecycle:
 *
 *   1. NegotiationCreated → parse buyer payload → acceptNegotiation()
 *   2. OrderPaid          → run full audit engine → deliverOrder()
 *
 * Returns the EventStream so callers can shut it down gracefully.
 */
export async function startAgentLoop(opts: AgentLoopOptions = {}): Promise<EventStream> {
  const {
    retryDelayMs = 2_000,
    maxConcurrency = 5,
    logger = console,
  } = opts;

  // ── Validate environment ──────────────────────────────────────────────────
  const sdkKey = process.env.CROO_SDK_KEY;
  if (!sdkKey) {
    throw new Error(
      'CROO_SDK_KEY is not set. Obtain one from the CROO Dashboard and add it to .env'
    );
  }

  const baseURL  = process.env.CROO_API_URL || 'https://api.croo.network';
  const wsURL    = process.env.CROO_WS_URL  || 'wss://api.croo.network/ws';
  const rpcURL   = process.env.RPC          || 'https://sepolia.base.org';

  logger.info(`[agent] Connecting to CROO network (${baseURL})...`);

  // ── Build AgentClient ─────────────────────────────────────────────────────
  const client = new AgentClient(
    { baseURL, wsURL, rpcURL, logger },
    sdkKey
  );

  // ── Connect WebSocket ─────────────────────────────────────────────────────
  const stream: EventStream = await client.connectWebSocket();
  logger.info('[agent] ✅ WebSocket connected — listening for buyer requests.');

  // Track in-flight orders to enforce concurrency cap
  const inFlight = new Set<string>();

  // ── Event: NegotiationCreated ─────────────────────────────────────────────
  // A buyer has sent a negotiation — validate the payload and accept it.
  stream.on(EventType.NegotiationCreated, async (e: Event) => {
    const negotiationId = e.negotiation_id!;
    logger.info(`[agent] 📨 NegotiationCreated: ${negotiationId}`);

    if (inFlight.size >= maxConcurrency) {
      logger.warn(
        `[agent] Concurrency cap reached (${maxConcurrency}). ` +
        `Rejecting negotiation ${negotiationId}.`
      );
      try {
        await client.rejectNegotiation(negotiationId, 'Agent at capacity. Please retry shortly.');
      } catch (err) {
        logger.error(`[agent] Failed to reject negotiation ${negotiationId}:`, err);
      }
      return;
    }

    try {
      // Fetch negotiation to validate the buyer's requirements payload
      const neg = await client.getNegotiation(negotiationId);
      let buyerRequest: BuyerRequest;

      try {
        buyerRequest = JSON.parse(neg.requirements) as BuyerRequest;
        if (!buyerRequest.projectLicense || !Array.isArray(buyerRequest.packages)) {
          throw new Error('Missing projectLicense or packages array');
        }
      } catch (parseErr) {
        logger.warn(
          `[agent] Invalid requirements payload in negotiation ${negotiationId}. ` +
          `Rejecting. Raw: ${neg.requirements}`
        );
        await client.rejectNegotiation(
          negotiationId,
          'Invalid payload: requirements must be JSON with { projectLicense: string, packages: PackageInput[] }'
        );
        return;
      }

      // Accept the negotiation — CROO SDK automatically submits createOrder on-chain
      const result = await client.acceptNegotiation(negotiationId);
      const orderId = result.order.orderId;
      inFlight.add(orderId);

      logger.info(
        `[agent] ✅ Accepted negotiation ${negotiationId} → orderId: ${orderId}. ` +
        `Waiting for buyer payment...`
      );
    } catch (err) {
      if (err instanceof APIError) {
        logger.error(`[agent] APIError accepting negotiation ${negotiationId}: [${err.code}] ${err.message}`);
      } else {
        logger.error(`[agent] Unexpected error accepting negotiation ${negotiationId}:`, err);
      }
    }
  });

  // ── Event: OrderPaid ──────────────────────────────────────────────────────
  // Buyer has paid on-chain — now run the full audit and deliver the result.
  stream.on(EventType.OrderPaid, async (e: Event) => {
    const orderId = e.order_id!;
    logger.info(`[agent] 💰 OrderPaid: ${orderId} — starting audit pipeline.`);

    try {
      // Fetch full order to retrieve negotiation metadata (buyer's payload)
      const order: Order = await client.getOrder(orderId);
      const neg = await client.getNegotiation(order.negotiationId);
      const buyerRequest: BuyerRequest = JSON.parse(neg.requirements);

      // Run the full license + vulnerability + Gemini audit
      const deliverable = await runLicenseAudit(buyerRequest, orderId, logger);
      logger.info(
        `[agent] 🔍 Audit complete for ${orderId}: ` +
        `${deliverable.status} — ${deliverable.risks.length} risks found.`
      );

      // Deliver the result on-chain via CROO SDK (Base Sepolia, no custom contracts)
      const deliverResult = await client.deliverOrder(orderId, {
        deliverableType: DeliverableType.Schema,
        deliverableText: JSON.stringify(deliverable),
      });

      logger.info(
        `[agent] ✅ Delivered order ${orderId}. ` +
        `Deliver tx: ${deliverResult.txHash}`
      );
    } catch (err) {
      if (err instanceof APIError) {
        logger.error(`[agent] APIError during deliver for order ${orderId}: [${err.code}] ${err.message}`);
      } else {
        logger.error(`[agent] Unexpected error during audit/deliver for order ${orderId}:`, err);
      }

      // Optionally: client.rejectOrder(orderId, reason) if audit is impossible
    } finally {
      inFlight.delete(orderId);
    }
  });

  // ── Event: OrderCompleted ─────────────────────────────────────────────────
  stream.on(EventType.OrderCompleted, (e: Event) => {
    logger.info(`[agent] 🎉 OrderCompleted: ${e.order_id} — settlement confirmed on Base Sepolia.`);
  });

  // ── Event: OrderExpired ───────────────────────────────────────────────────
  stream.on(EventType.OrderExpired, (e: Event) => {
    logger.warn(`[agent] ⚠️  OrderExpired: ${e.order_id} — SLA window exceeded.`);
    inFlight.delete(e.order_id!);
  });

  // ── Event: OrderRejected ──────────────────────────────────────────────────
  stream.on(EventType.OrderRejected, (e: Event) => {
    logger.warn(`[agent] ❌ OrderRejected: ${e.order_id}. Reason: ${e.reason}`);
    inFlight.delete(e.order_id!);
  });

  // ── Catch-all debug listener ──────────────────────────────────────────────
  stream.onAny((e: Event) => {
    logger.debug(`[agent:event] type=${e.type} negotiation=${e.negotiation_id ?? '-'} order=${e.order_id ?? '-'}`);
  });

  return stream;
}
