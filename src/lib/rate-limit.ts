type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function loginBlocked(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const bucket = buckets.get(key);
  const now = Date.now();
  if (!bucket || bucket.resetAt <= now) return { blocked: false, retryAfter: 0 };
  if (bucket.count < limit) return { blocked: false, retryAfter: 0 };
  return { blocked: true, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
}

export function recordLoginFailure(key: string, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

export function clearLoginFailures(key: string) {
  buckets.delete(key);
}
