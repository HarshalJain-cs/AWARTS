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

// GET /analytics/counter — claude-counter-inspired usage metrics for current user
export const getCounterData = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return null;

    const entries = await ctx.db
      .query("daily_usage")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    if (entries.length === 0) return null;

    entries.sort((a, b) => a.date.localeCompare(b.date));

    const now = Date.now();
    const todayStr = new Date(now).toISOString().split("T")[0];
    const weekAgoStr = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Today's usage
    const todayEntries = entries.filter((e) => e.date === todayStr);
    const todayTokens = todayEntries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);
    const todayCost = todayEntries.reduce((s, e) => s + e.costUsd, 0);
    const todayInput = todayEntries.reduce((s, e) => s + e.inputTokens, 0);
    const todayOutput = todayEntries.reduce((s, e) => s + e.outputTokens, 0);
    const todayCacheCreation = todayEntries.reduce((s, e) => s + (e.cacheCreationTokens ?? 0), 0);
    const todayCacheRead = todayEntries.reduce((s, e) => s + (e.cacheReadTokens ?? 0), 0);

    // Weekly usage (last 7 days)
    const weekEntries = entries.filter((e) => e.date >= weekAgoStr);
    const weekTokens = weekEntries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);
    const weekCost = weekEntries.reduce((s, e) => s + e.costUsd, 0);
    const weekInput = weekEntries.reduce((s, e) => s + e.inputTokens, 0);
    const weekOutput = weekEntries.reduce((s, e) => s + e.outputTokens, 0);
    const weekCacheCreation = weekEntries.reduce((s, e) => s + (e.cacheCreationTokens ?? 0), 0);
    const weekCacheRead = weekEntries.reduce((s, e) => s + (e.cacheReadTokens ?? 0), 0);
    const weekActiveDays = new Set(weekEntries.map((e) => e.date)).size;

    // All-time totals
    const totalTokens = entries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0);
    const totalCost = entries.reduce((s, e) => s + e.costUsd, 0);
    const totalCacheCreation = entries.reduce((s, e) => s + (e.cacheCreationTokens ?? 0), 0);
    const totalCacheRead = entries.reduce((s, e) => s + (e.cacheReadTokens ?? 0), 0);

    // Provider breakdown for the week
    const providerWeek: Record<string, { tokens: number; cost: number; input: number; output: number; cacheRead: number; cacheCreation: number }> = {};
    for (const e of weekEntries) {
      if (!providerWeek[e.provider]) {
        providerWeek[e.provider] = { tokens: 0, cost: 0, input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      }
      providerWeek[e.provider].tokens += e.inputTokens + e.outputTokens;
      providerWeek[e.provider].cost += e.costUsd;
      providerWeek[e.provider].input += e.inputTokens;
      providerWeek[e.provider].output += e.outputTokens;
      providerWeek[e.provider].cacheRead += e.cacheReadTokens ?? 0;
      providerWeek[e.provider].cacheCreation += e.cacheCreationTokens ?? 0;
    }

    const providerBreakdown = Object.entries(providerWeek)
      .map(([provider, stats]) => ({ provider, ...stats }))
      .sort((a, b) => b.tokens - a.tokens);

    // Daily token trend for the past 7 days (for sparkline)
    const dailyTrend: { date: string; tokens: number; cost: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const dayEntries = entries.filter((e) => e.date === d);
      dailyTrend.push({
        date: d,
        tokens: dayEntries.reduce((s, e) => s + e.inputTokens + e.outputTokens, 0),
        cost: dayEntries.reduce((s, e) => s + e.costUsd, 0),
      });
    }

    // Models used today
    const todayModels = [...new Set(todayEntries.flatMap((e) => e.models ?? []))];

    // Peak usage day this week
    const dailyTokenMap = new Map<string, number>();
    for (const e of weekEntries) {
      dailyTokenMap.set(e.date, (dailyTokenMap.get(e.date) ?? 0) + e.inputTokens + e.outputTokens);
    }
    let peakDay = todayStr;
    let peakTokens = 0;
    for (const [date, tokens] of dailyTokenMap) {
      if (tokens > peakTokens) {
        peakTokens = tokens;
        peakDay = date;
      }
    }

    return {
      today: {
        tokens: todayTokens,
        cost: todayCost,
        input: todayInput,
        output: todayOutput,
        cacheCreation: todayCacheCreation,
        cacheRead: todayCacheRead,
        models: todayModels,
      },
      week: {
        tokens: weekTokens,
        cost: weekCost,
        input: weekInput,
        output: weekOutput,
        cacheCreation: weekCacheCreation,
        cacheRead: weekCacheRead,
        activeDays: weekActiveDays,
        peakDay,
        peakTokens,
      },
      allTime: {
        tokens: totalTokens,
        cost: totalCost,
        cacheCreation: totalCacheCreation,
        cacheRead: totalCacheRead,
        totalDays: new Set(entries.map((e) => e.date)).size,
      },
      providerBreakdown,
      dailyTrend,
    };
  },
});

// GET /analytics/velocity — pace metrics vs community
export const getVelocityMetrics = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return null;

    // User's usage
    const userEntries = await ctx.db
      .query("daily_usage")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    if (userEntries.length === 0) return null;

    const userDays = new Set(userEntries.map((e) => e.date));
    const userActiveDays = userDays.size;
    const userTotalTokens = userEntries.reduce(
      (s, e) => s + e.inputTokens + e.outputTokens, 0
    );
    const userAvgTokensPerDay = userActiveDays > 0 ? userTotalTokens / userActiveDays : 0;

    // Global stats (sample up to 50k entries)
    const allEntries = await ctx.db.query("daily_usage").take(50000);
    const globalUserDays: Record<string, Set<string>> = {};
    const globalUserTokens: Record<string, number> = {};

    for (const e of allEntries) {
      const uid = String(e.userId);
      if (!globalUserDays[uid]) globalUserDays[uid] = new Set();
      globalUserDays[uid].add(e.date);
      globalUserTokens[uid] = (globalUserTokens[uid] ?? 0) + e.inputTokens + e.outputTokens;
    }

    // Calculate per-user avg tokens/day
    const paces: number[] = [];
    for (const [uid, days] of Object.entries(globalUserDays)) {
      if (days.size > 0) {
        paces.push((globalUserTokens[uid] ?? 0) / days.size);
      }
    }

    paces.sort((a, b) => a - b);
    const globalAvgPace = paces.length > 0
      ? paces.reduce((s, p) => s + p, 0) / paces.length
      : 0;

    // Calculate percentile
    const rank = paces.filter((p) => p < userAvgTokensPerDay).length;
    const percentile = paces.length > 0 ? Math.round((rank / paces.length) * 100) : 50;

    // Pace multiplier
    const paceMultiplier = globalAvgPace > 0
      ? Math.round((userAvgTokensPerDay / globalAvgPace) * 10) / 10
      : 1;

    let paceLabel: string;
    if (paceMultiplier >= 2) paceLabel = `${paceMultiplier}x faster than average`;
    else if (paceMultiplier >= 1.2) paceLabel = `${paceMultiplier}x above average`;
    else if (paceMultiplier >= 0.8) paceLabel = "On pace with community";
    else paceLabel = "Below community average";

    return {
      userPace: Math.round(userAvgTokensPerDay),
      globalAvgPace: Math.round(globalAvgPace),
      percentile,
      paceMultiplier,
      paceLabel,
      userActiveDays,
    };
  },
});
