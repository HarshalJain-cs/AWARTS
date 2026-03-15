import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

// GET /analytics/:username — time-series data for charts
export const getChartData = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return null;

    // Privacy check
    const me = await getCurrentUser(ctx);
    if (!user.isPublic && (!me || me._id !== user._id)) return null;

    const entries = await ctx.db
      .query("daily_usage")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (entries.length === 0) return { daily: [], providers: [], cumulative: [] };

    // Sort by date
    entries.sort((a, b) => a.date.localeCompare(b.date));

    // 1. Daily spend by provider (for area chart)
    const dailyMap = new Map<string, Record<string, number>>();
    for (const e of entries) {
      const day = dailyMap.get(e.date) ?? {};
      day[e.provider] = (day[e.provider] ?? 0) + e.costUsd;
      dailyMap.set(e.date, day);
    }

    const daily = Array.from(dailyMap.entries()).map(([date, providers]) => ({
      date,
      ...providers,
      total: Object.values(providers).reduce((s, v) => s + v, 0),
    }));

    // 2. Provider breakdown (for pie chart)
    const providerTotals: Record<string, { cost: number; input: number; output: number; days: number }> = {};
    const providerDays: Record<string, Set<string>> = {};
    for (const e of entries) {
      if (!providerTotals[e.provider]) {
        providerTotals[e.provider] = { cost: 0, input: 0, output: 0, days: 0 };
        providerDays[e.provider] = new Set();
      }
      providerTotals[e.provider].cost += e.costUsd;
      providerTotals[e.provider].input += e.inputTokens;
      providerTotals[e.provider].output += e.outputTokens;
      providerDays[e.provider].add(e.date);
    }
    const providers = Object.entries(providerTotals).map(([provider, stats]) => ({
      provider,
      cost: stats.cost,
      inputTokens: stats.input,
      outputTokens: stats.output,
      days: providerDays[provider].size,
    }));

    // 3. Cumulative spend (for line chart)
    let runningTotal = 0;
    const cumulative = daily.map((d) => {
      runningTotal += d.total;
      return { date: d.date, cumulative: runningTotal };
    });

    // 4. Token data by date (for bar chart)
    const tokenMap = new Map<string, { input: number; output: number }>();
    for (const e of entries) {
      const existing = tokenMap.get(e.date) ?? { input: 0, output: 0 };
      existing.input += e.inputTokens;
      existing.output += e.outputTokens;
      tokenMap.set(e.date, existing);
    }
    const tokens = Array.from(tokenMap.entries()).map(([date, t]) => ({
      date,
      input: t.input,
      output: t.output,
    }));

    return { daily, providers, cumulative, tokens };
  },
});
