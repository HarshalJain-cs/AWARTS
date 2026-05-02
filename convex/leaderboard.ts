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

    // 1. First load all public users (filtered by region if applicable)
    let allUsers = await ctx.db.query("users").filter(q => q.eq(q.field("isPublic"), true)).collect();
    if (region) {
      allUsers = allUsers.filter(u => u.region === region);
    }

    const userMap = new Map<string, typeof allUsers[0]>();
    const userTotals = new Map<string, { costUsd: number; totalTokens: number; days: Set<string> }>();
    
    for (const u of allUsers) {
      userMap.set(String(u._id), u);
      userTotals.set(String(u._id), { costUsd: 0, totalTokens: 0, days: new Set() });
    }

    // 2. Aggregate usage data only for these public users
    for (const entry of usageEntries) {
      const uid = String(entry.userId);
      if (!userTotals.has(uid)) continue; // skip private or filtered users

      const existing = userTotals.get(uid)!;
      existing.costUsd += entry.costUsd;
      existing.totalTokens +=
        entry.inputTokens + entry.outputTokens + entry.cacheCreationTokens + entry.cacheReadTokens;
      existing.days.add(entry.date);
    }

    // 3. Sort by cost descending (tie breaker: total tokens descending, then creation time ascending)
    const sorted = [...userTotals.entries()]
      .sort((a, b) => {
        if (b[1].costUsd !== a[1].costUsd) return b[1].costUsd - a[1].costUsd;
        if (b[1].totalTokens !== a[1].totalTokens) return b[1].totalTokens - a[1].totalTokens;
        return userMap.get(a[0])!._creationTime - userMap.get(b[0])!._creationTime;
      });

    // 4. Map to final output format
    const filtered = sorted
      .map(([userId, totals]) => {
        const user = userMap.get(userId)!;
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
          totalActiveDays: totals.days.size,
        };
      });

    // Rank AFTER filtering
    const ranked = filtered.map((entry, i) => ({ ...entry, rank: i + 1 }));

    return {
      entries: ranked.slice(safeOffset, safeOffset + safeLimit),
      total: ranked.length,
    };
  },
});
