// Simple in-memory rate limiter (resets on server restart)
// For production use Upstash Redis: npm install @upstash/ratelimit @upstash/redis

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs:    number = 60 * 60 * 1000, // 1 hour default
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt < now) {
    // First attempt or window expired — reset
    const resetAt = now + windowMs;
    attempts.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return {
    allowed:   true,
    remaining: maxAttempts - record.count,
    resetAt:   record.resetAt,
  };
}