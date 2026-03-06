import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getLeaderboard = query({
  args: {
    period: v.optional(v.string()), // daily, weekly, monthly, all_time
    provider: v.optional(v.string()),
    region: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { period = "all_time", provider, region, limit = 50, offset = 0 }) => {
    // Cap limits to prevent abuse
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);

    // Calculate date range based on period
    const now = new Date();
    let startDate: string | null = null;

    if (period === "daily") {
      startDate = now.toISOString().split("T")[0];
    } else if (period === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString().split("T")[0];
    } else if (period === "monthly") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = monthAgo.toISOString().split("T")[0];
    }

    // Use by_date index for date-bounded queries, fall back to limited scan for all_time
    let usageEntries;
    if (startDate) {
      // Use index to filter by date range efficiently
      usageEntries = await ctx.db
        .query("daily_usage")
        .withIndex("by_date", (q) => q.gte("date", startDate!))
        .collect();
    } else {
      // All time: take a reasonable limit to avoid loading entire table
      usageEntries = await ctx.db
        .query("daily_usage")
        .take(10000);
    }

    if (provider) {
      usageEntries = usageEntries.filter((e) => e.provider === provider);
    }

    // Aggregate by user
    const userTotals = new Map<string, { costUsd: number; totalTokens: number; days: Set<string> }>();
    for (const entry of usageEntries) {
      const uid = String(entry.userId);
      const existing = userTotals.get(uid) ?? { costUsd: 0, totalTokens: 0, days: new Set() };
      existing.costUsd += entry.costUsd;
      existing.totalTokens +=
        entry.inputTokens + entry.outputTokens + entry.cacheCreationTokens + entry.cacheReadTokens;
      existing.days.add(entry.date);
      userTotals.set(uid, existing);
    }

    // Sort by cost descending
    const sorted = [...userTotals.entries()]
      .sort((a, b) => b[1].costUsd - a[1].costUsd);

    // Cap hydration to prevent memory DoS — max 1000 users even for region filter
    const maxHydrate = 1000;
    const sliceEnd = Math.min(
      region ? sorted.length : safeOffset + safeLimit,
      maxHydrate
    );
    const toHydrate = sorted.slice(0, sliceEnd);

    // Batch-load users
    const userIds = toHydrate.map(([id]) => id as Id<"users">);
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map<string, typeof users[0]>();
    for (const u of users) {
      if (u) userMap.set(String(u._id), u);
    }

    // Filter FIRST, then rank — fixes rank miscalculation
    const filtered = toHydrate
      .map(([userId, totals]) => {
        const user = userMap.get(userId);
        if (!user) return null;
        // Exclude private users from leaderboard
        if (!user.isPublic) return null;
        // Apply region filter
        if (region && user.region !== region) return null;

        return {
          user: {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            country: user.country,
            region: user.region,
          },
          costUsd: totals.costUsd,
          totalTokens: totals.totalTokens,
          activeDays: totals.days.size,
        };
      })
      .filter(Boolean);

    // Rank AFTER filtering (correct rank assignment)
    const ranked = filtered.map((entry, i) => ({ ...entry!, rank: i + 1 }));

    return {
      entries: ranked.slice(safeOffset, safeOffset + safeLimit),
      total: ranked.length,
    };
  },
});
