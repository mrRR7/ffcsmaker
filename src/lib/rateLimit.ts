// Minimal in-memory rate limiter.
//
// This is intentionally simple: a per-instance sliding window keyed by a
// caller-supplied key (usually an IP address). It resets whenever a
// serverless function instance cold-starts and doesn't share state across
// concurrent instances, so it is NOT a hard guarantee — but it meaningfully
// raises the cost of naive scripted abuse (password brute force, bulk writes)
// against low-traffic endpoints, which is what this project needs today.
//
// If traffic grows enough that this stops being sufficient, swap it for a
// shared store (Upstash Redis via @upstash/ratelimit, Vercel Firewall, etc.)
// behind the same `rateLimit()` signature.

interface WindowEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, WindowEntry>();

// Periodically forget stale entries so this map can't grow without bound
// under sustained traffic from many distinct IPs.
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  options: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1, retryAfterMs: 0 };
  }

  if (entry.count >= options.max) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    retryAfterMs: 0
  };
}

/**
 * Best-effort client IP extraction for rate-limiting purposes only.
 * Not suitable for anything security-critical beyond "make abuse cost more" —
 * these headers can be spoofed by a direct client, though not through
 * Vercel's own edge network for the first hop.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}
