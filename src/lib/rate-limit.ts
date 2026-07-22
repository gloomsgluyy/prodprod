// Simple in-memory rate limiter for API routes
// For multi-instance (PM2 cluster), upgrade to Redis-backed rate limiting

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Default: 60 requests per minute
const DEFAULTS: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

// Auth endpoint: 10 attempts per 15 minutes
const AUTH_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
};

// Cron endpoint: 2 requests per minute
const CRON_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 2,
};

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULTS
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count };
}

// Periodic cleanup to prevent memory leak (every 10 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 10 * 60 * 1000);
}

export { AUTH_LIMIT, CRON_LIMIT, DEFAULTS };
export type { RateLimitConfig };
