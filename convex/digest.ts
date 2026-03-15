import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// Get users who should receive weekly digests
export const getDigestRecipients = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers
      .filter((u) => u.emailNotificationsEnabled && u.email)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        webhookUrl: u.webhookUrl,
      }));
  },
});

// Get weekly stats for a user
export const getWeeklyStats = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const usage = await ctx.db
      .query("daily_usage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const weekUsage = usage.filter((u) => u.date >= weekAgoStr);
    if (weekUsage.length === 0) return null;

    const totalCost = weekUsage.reduce((s, u) => s + u.costUsd, 0);
    const totalTokens = weekUsage.reduce((s, u) => s + u.inputTokens + u.outputTokens, 0);
    const sessions = new Set(weekUsage.map((u) => u.date)).size;

    const providerCosts: Record<string, number> = {};
    for (const u of weekUsage) {
      providerCosts[u.provider] = (providerCosts[u.provider] ?? 0) + u.costUsd;
    }
    const topProvider = Object.entries(providerCosts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

    // Calculate streak
    const allDates = new Set(usage.map((u) => u.date));
    const sortedDates = [...allDates].sort().reverse();
    let streak = 0;
    const today = now.toISOString().split("T")[0];
    let checkDate = today;
    for (const date of sortedDates) {
      if (date === checkDate || date === getPreviousDate(checkDate)) {
        streak++;
        checkDate = date;
      } else break;
    }

    return { totalCost, totalTokens, sessions, streak, topProvider };
  },
});

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// Mark digest as sent (for tracking — can be wired up after `npx convex dev`)
export const markDigestSent = internalMutation({
  args: { userId: v.id("users") },
  handler: async (_ctx, { userId: _userId }) => {
    // Placeholder for tracking digest delivery
    // In production: update a last_digest_sent_at field
  },
});
