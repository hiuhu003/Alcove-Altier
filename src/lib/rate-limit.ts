import "server-only";

/**
 * Small in-process rate limiter for the public/auth endpoints.
 *
 * Scope: this counts per serverless instance, not globally — on Vercel a
 * determined attacker spread across many cold starts gets a higher effective
 * ceiling. It is still the right first line of defence (it stops the common
 * case: one client hammering one endpoint) and costs nothing to run. If the
 * store ever needs to be shared, swap `hits` for Upstash Redis — the call sites
 * only use `rateLimit()`.
 */

type Bucket = { count: number; resetAt: number };

const hits = new Map<string, Bucket>();
const MAX_KEYS = 5_000;

function sweep(now: number) {
  for (const [key, bucket] of hits) {
    if (bucket.resetAt <= now) hits.delete(key);
  }
  // Hard cap so a flood of unique IPs can't grow the map without bound.
  if (hits.size > MAX_KEYS) {
    const excess = hits.size - MAX_KEYS;
    let i = 0;
    for (const key of hits.keys()) {
      hits.delete(key);
      if (++i >= excess) break;
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets — send as Retry-After. */
  retryAfter: number;
};

/**
 * Allow `limit` requests per `windowMs` for a key (usually `route:ip`).
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (hits.size > 64) sweep(now);

  const bucket = hits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter,
  };
}

/** Clear a key early — e.g. a successful login shouldn't count against it. */
export function resetRateLimit(key: string): void {
  hits.delete(key);
}

/**
 * Best-effort client IP. On Vercel `x-forwarded-for` is set by the platform and
 * cannot be spoofed by the client; elsewhere it's a hint, so this is only used
 * for rate-limit bucketing, never for authorisation.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** 429 response with the standard headers. */
export function tooManyRequests(result: RateLimitResult, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfter),
      "Cache-Control": "no-store",
    },
  });
}
