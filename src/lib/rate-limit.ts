// Lightweight rate limiter. Uses an in-memory map by default so the app
// works with zero extra infrastructure; if REDIS_URL is set, swap the
// `store` implementation below for an ioredis-backed one (increment key,
// set TTL on first hit) to make limits durable across server instances.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

/** Convenience wrapper for auth endpoints: 10 attempts per 10 minutes per IP+email. */
export function checkAuthRateLimit(ip: string, identifier: string) {
  return rateLimit(`auth:${ip}:${identifier}`, 10, 10 * 60 * 1000);
}

/** Convenience wrapper for upload endpoints: 60 uploads per hour per user. */
export function checkUploadRateLimit(userId: string) {
  return rateLimit(`upload:${userId}`, 60, 60 * 60 * 1000);
}
