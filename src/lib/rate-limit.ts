/**
 * Simple in-memory fixed-window rate limiter.
 * Used for: admin login, review submission, uploads (later phases).
 * NOTE: per-instance memory only — adequate for single-region deployments;
 * swap for Upstash/Redis if horizontally scaling.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// periodic cleanup so the map never grows unbounded
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, retryAfterSec: 0 };
}

/** Client IP from proxy headers */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (k: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(k) ?? undefined;
    const v = headers[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return (
    get("x-forwarded-for")?.split(",")[0]?.trim() ||
    get("x-real-ip") ||
    "unknown"
  );
}
