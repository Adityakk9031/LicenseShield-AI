/**
 * Timeout guards for external calls (Gemini, NPM registry, OSV.dev).
 *
 * Without these, one stalled upstream call hangs the entire audit HTTP
 * response — and with it, the coding agent's loop. Every external call in
 * the pipeline is wrapped so a stall degrades gracefully to the rule-based
 * engine instead of blocking forever.
 */

export const EXTERNAL_FETCH_TIMEOUT_MS = 10_000; // NPM registry / OSV.dev
export const GEMINI_TIMEOUT_MS = 30_000; // LLM reasoning budget per audit

/**
 * Race a promise against a wall-clock timeout. On timeout the rejection is
 * caught by the caller's existing try/catch → fallback path.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`[LicenseShield] ${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
