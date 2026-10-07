/**
 * Minimal in-memory sliding-window rate limiter for the sandbox verify endpoint.
 *
 * This is intentionally dependency-free and per-instance: it protects the
 * Gemini pipeline from casual abuse on a single serverless region. For
 * multi-region production, swap the Map for Redis/Upstash — the interface
 * (`checkSandboxRateLimit(ip)`) is designed to stay identical.
 */

const SANDBOX_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SANDBOX_MAX_REQUESTS = 20; // free audits per IP per window

interface Bucket {
  count: number;
  resetAt: number;
}

// Bounded map so a spoofed-IP flood cannot grow memory unboundedly.
const MAX_TRACKED_IPS = 10_000;
const buckets = new Map<string, Bucket>();

function pruneExpired(now: number): void {
  if (buckets.size < MAX_TRACKED_IPS) return;
  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(ip);
    if (buckets.size < MAX_TRACKED_IPS * 0.9) break;
  }
}

export function clientIpFromRequest(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkSandboxRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + SANDBOX_WINDOW_MS });
    return { allowed: true, remaining: SANDBOX_MAX_REQUESTS - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= SANDBOX_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: SANDBOX_MAX_REQUESTS - existing.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Refund a sandbox slot when the request never reached the paid pipeline
 * (e.g. malformed payload rejected before any AI/scan work happened).
 */
export function clearSandboxRateLimit(req: Request): void {
  const ip = clientIpFromRequest(req);
  const bucket = buckets.get(ip);
  if (bucket && bucket.count > 0) {
    bucket.count -= 1;
  }
}
