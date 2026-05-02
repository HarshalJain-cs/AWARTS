import { query } from "./_generated/server";

// Public aggregate stats — no auth required
export const getOpenStats = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all usage entries (capped at 50k for safety)
    const allUsage = await ctx.db.query("daily_usage").take(50000);

    if (allUsage.length === 0) {
      return {
        totalSpend: 0,
        totalTokens: 0,
        totalUsers: 0,
        avgStreak: 0,
        totalSessions: 0,
        popularModels: [],
        dailyTrend: [],
      };
    }

    // Aggregate totals
    let totalSpend = 0;
    let totalTokens = 0;
    const userIds = new Set<string>();
    const modelCosts: Record<string, number> = {};
    const dailyCosts: Record<string, { cost: number; tokens: number; users: Set<string> }> = {};
    const userDays: Record<string, Set<string>> = {};

    for (const entry of allUsage) {
      totalSpend += entry.costUsd;
      totalTokens += entry.inputTokens + entry.outputTokens;
      const uid = String(entry.userId);
      userIds.add(uid);

      // Track user active days for streak calculation
      if (!userDays[uid]) userDays[uid] = new Set();
      userDays[uid].add(entry.date);

      // Model breakdown
      for (const model of entry.models) {
        modelCosts[model] = (modelCosts[model] ?? 0) + entry.costUsd;
      }

      // Daily trend
      if (!dailyCosts[entry.date]) {
        dailyCosts[entry.date] = { cost: 0, tokens: 0, users: new Set() };
      }
      dailyCosts[entry.date].cost += entry.costUsd;
      dailyCosts[entry.date].tokens += entry.inputTokens + entry.outputTokens;
      dailyCosts[entry.date].users.add(uid);
    }

    // Average streak (avg active days per user)
    const streaks = Object.values(userDays).map((days) => days.size);
    const avgStreak = streaks.length > 0
      ? Math.round(streaks.reduce((s, d) => s + d, 0) / streaks.length)
      : 0;

    // Most popular models sorted by % of total spend
    const popularModels = Object.entries(modelCosts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([model, cost]) => ({
        model,
        cost,
        percent: totalSpend > 0 ? Math.round((cost / totalSpend) * 100) : 0,
      }));

    // Daily trend — last 30 days
    const now = Date.now();
    const dailyTrend: { date: string; cost: number; tokens: number; users: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const day = dailyCosts[d];
      dailyTrend.push({
        date: d,
        cost: day?.cost ?? 0,
        tokens: day?.tokens ?? 0,
        users: day?.users.size ?? 0,
      });
    }

    return {
      totalSpend,
      totalTokens,
      totalUsers: userIds.size,
      avgStreak,
      totalSessions: allUsage.length,
      popularModels,
      dailyTrend,
    };
  },
});
