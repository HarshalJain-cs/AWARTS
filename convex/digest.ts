import { v } from "convex/values";
import { query, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser } from "./users";

// Get users who should receive weekly digests (skip if sent within last 6 days)
export const getDigestRecipients = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
    const allUsers = await ctx.db.query("users").collect();
    return allUsers
      .filter(
        (u) =>
          u.emailNotificationsEnabled &&
          u.email &&
          (!u.lastDigestSentAt || u.lastDigestSentAt < sixDaysAgo),
      )
      .map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email!,
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
    const activeDays = new Set(weekUsage.map((u) => u.date)).size;

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

    return { totalCost, totalTokens, activeDays, streak, topProvider };
  },
});

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// Public query: get weekly stats for the current authenticated user
export const getMyWeeklyStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;

      const me = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!me) return null;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];

      const usage = await ctx.db
        .query("daily_usage")
        .withIndex("by_user", (q) => q.eq("userId", me._id))
        .take(1000);

      const weekUsage = usage.filter((u) => u.date >= weekAgoStr);
      if (weekUsage.length === 0) return null;

      const totalCost = weekUsage.reduce((s, u) => s + (u.costUsd ?? 0), 0);
      const totalTokens = weekUsage.reduce((s, u) => s + (u.inputTokens ?? 0) + (u.outputTokens ?? 0), 0);
      const activeDays = new Set(weekUsage.map((u) => u.date)).size;

      const providerCosts: Record<string, number> = {};
      for (const u of weekUsage) {
        providerCosts[u.provider] = (providerCosts[u.provider] ?? 0) + (u.costUsd ?? 0);
      }
      const topProvider = Object.entries(providerCosts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";

      // Streak
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

      return { totalCost, totalTokens, activeDays, streak, topProvider };
    } catch (_e) {
      console.error("getMyWeeklyStats failed:", _e);
      return null;
    }
  },
});

// Mark digest as sent
export const markDigestSent = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { lastDigestSentAt: Date.now() });
  },
});

function formatUsd(amount: number): string {
  return amount >= 1
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${amount.toFixed(2)}`;
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

const PROVIDER_NAMES: Record<string, string> = {
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
  antigravity: "Antigravity",
};

// Send weekly digest emails
export const sendWeeklyDigests = internalAction({
  args: {},
  handler: async (ctx) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.log("RESEND_API_KEY not set — skipping weekly digests");
      return;
    }

    const recipients = await ctx.runQuery(internal.digest.getDigestRecipients);
    console.log(`Weekly digest: ${recipients.length} eligible recipient(s)`);

    let sent = 0;
    for (const user of recipients) {
      const stats = await ctx.runQuery(internal.digest.getWeeklyStats, { userId: user._id });
      if (!stats) continue;

      const providerName = PROVIDER_NAMES[stats.topProvider] ?? stats.topProvider;

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin-bottom: 4px;">Your AWARTS Weekly Recap</h2>
          <p style="color: #666; font-size: 14px; margin-top: 0;">Hey @${user.username}, here's your AI coding stats for the past week.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Total cost</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; font-family: monospace;">${formatUsd(stats.totalCost)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Total tokens</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; font-family: monospace;">${formatTokenCount(stats.totalTokens)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Active days</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${stats.activeDays}/7</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px 0; color: #666;">Current streak</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${stats.streak} day${stats.streak !== 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Top provider</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">${providerName}</td>
            </tr>
          </table>

          <a href="https://awarts.vercel.app/recap" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Full Recap</a>

          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            You're receiving this because you have email notifications enabled on AWARTS.
            <a href="https://awarts.vercel.app/settings" style="color: #999;">Unsubscribe</a>
          </p>
        </div>
      `;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "AWARTS <digest@awarts.com>",
            to: [user.email],
            subject: `Your week: ${formatUsd(stats.totalCost)} spent, ${stats.activeDays} active days`,
            html,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text();
          console.error(`Failed to send digest to ${user.email}: ${res.status} ${text}`);
          continue;
        }

        await ctx.runMutation(internal.digest.markDigestSent, { userId: user._id });
        sent++;
      } catch (err) {
        console.error(`Error sending digest to ${user.email}:`, err);
      }
    }

    console.log(`Weekly digest: ${sent} email(s) sent`);
  },
});
