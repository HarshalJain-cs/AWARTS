import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";

/**
 * Inline rate limiter for use inside mutation handlers.
 * Returns true if allowed, false if rate limited.
 */
export async function inlineRateLimit(
  ctx: MutationCtx,
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = await ctx.db
    .query("rate_limits")
    .withIndex("by_key", (q) => q.eq("key", key).gte("timestamp", windowStart))
    .collect();
  if (recent.length >= maxRequests) return false;
  await ctx.db.insert("rate_limits", { key, timestamp: now });
  return true;
}

/**
 * Check and record a rate-limited request.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export const checkRateLimit = internalMutation({
  args: {
    key: v.string(),
    maxRequests: v.number(),
    windowMs: v.number(),
  },
  handler: async (ctx, { key, maxRequests, windowMs }) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Count recent requests within the window
    const recent = await ctx.db
      .query("rate_limits")
      .withIndex("by_key", (q) => q.eq("key", key).gte("timestamp", windowStart))
      .collect();

    if (recent.length >= maxRequests) {
      // Find the oldest entry in the window to calculate retry-after
      const oldest = recent.reduce((min, r) => (r.timestamp < min ? r.timestamp : min), now);
      const retryAfterMs = oldest + windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
    }

    // Record this request
    await ctx.db.insert("rate_limits", { key, timestamp: now });

    return { allowed: true, retryAfterMs: 0 };
  },
});

/**
 * Clean up expired rate limit entries (called by hourly cron).
 */
export const cleanupOldEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 5 * 60 * 1000; // Keep 5 minutes of history
    const old = await ctx.db
      .query("rate_limits")
      .withIndex("by_key")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .take(500);

    for (const entry of old) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: old.length };
  },
});
