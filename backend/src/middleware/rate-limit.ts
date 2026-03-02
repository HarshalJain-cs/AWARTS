import type { Context } from 'hono';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitStore>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (value.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'usage/submit': { maxRequests: 20, windowMs: 60_000 },
  'social/kudos': { maxRequests: 60, windowMs: 60_000 },
  'social/comments': { maxRequests: 20, windowMs: 60_000 },
  'social/follow': { maxRequests: 30, windowMs: 60_000 },
  'ai/caption': { maxRequests: 10, windowMs: 60_000 },
  'upload': { maxRequests: 10, windowMs: 60_000 },
  'auth/cli/poll': { maxRequests: 300, windowMs: 60_000 },
  'feed': { maxRequests: 120, windowMs: 60_000 },
  'leaderboard': { maxRequests: 60, windowMs: 60_000 },
  'search': { maxRequests: 30, windowMs: 60_000 },
  'users/profile': { maxRequests: 60, windowMs: 60_000 },
  'notifications': { maxRequests: 30, windowMs: 60_000 },
};

/**
 * Check rate limit for a given endpoint. Returns a Response if rate limited, null if allowed.
 */
export function checkRateLimit(c: Context, endpoint: string): Response | null {
  const config = RATE_LIMITS[endpoint];
  if (!config) return null;

  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  if (existing.count >= config.maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return c.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(existing.resetAt),
        },
      }
    ) as unknown as Response;
  }

  existing.count++;
  return null;
}
