import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

const usageEntryValidator = v.object({
  date: v.string(),
  provider: v.string(),
  cost_usd: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  cache_creation_tokens: v.optional(v.number()),
  cache_read_tokens: v.optional(v.number()),
  models: v.array(v.string()),
  raw_data: v.optional(v.any()),
});

// POST /usage/submit — core endpoint (supports both Clerk auth and CLI token auth)
export const submitUsage = mutation({
  args: {
    entries: v.array(usageEntryValidator),
    source: v.string(),
    hash: v.optional(v.string()),
    authToken: v.optional(v.string()),
  },
  handler: async (ctx, { entries, source, hash, authToken }) => {
    // Try Clerk auth first (browser), then fall back to CLI token auth
    let me = await getCurrentUser(ctx);

    if (!me && authToken) {
      // CLI token auth: look up the token in cli_auth_codes
      const authRow = await ctx.db
        .query("cli_auth_codes")
        .filter((q) =>
          q.and(
            q.eq(q.field("jwtToken"), authToken),
            q.eq(q.field("status"), "verified")
          )
        )
        .first();

      if (authRow && authRow.userId) {
        me = await ctx.db.get(authRow.userId);
      }
    }

    if (!me) throw new Error("Not authenticated");

    const errors: Array<{ date: string; provider: string; error: string }> = [];
    let processed = 0;
    const affectedDates = new Set<string>();

    for (const entry of entries) {
      const validProviders = ["claude", "codex", "gemini", "antigravity"];
      if (!validProviders.includes(entry.provider)) {
        errors.push({ date: entry.date, provider: entry.provider, error: "Invalid provider" });
        continue;
      }

      // Check for existing entry (upsert logic)
      const existing = await ctx.db
        .query("daily_usage")
        .withIndex("by_user_date_provider", (q) =>
          q.eq("userId", me._id).eq("date", entry.date).eq("provider", entry.provider)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          costUsd: entry.cost_usd,
          inputTokens: entry.input_tokens,
          outputTokens: entry.output_tokens,
          cacheCreationTokens: entry.cache_creation_tokens ?? 0,
          cacheReadTokens: entry.cache_read_tokens ?? 0,
          models: entry.models,
          source,
          dataHash: hash ?? undefined,
          rawData: entry.raw_data ?? undefined,
        });
      } else {
        await ctx.db.insert("daily_usage", {
          userId: me._id,
          date: entry.date,
          provider: entry.provider,
          costUsd: entry.cost_usd,
          inputTokens: entry.input_tokens,
          outputTokens: entry.output_tokens,
          cacheCreationTokens: entry.cache_creation_tokens ?? 0,
          cacheReadTokens: entry.cache_read_tokens ?? 0,
          models: entry.models,
          source,
          dataHash: hash ?? undefined,
          rawData: entry.raw_data ?? undefined,
        });
      }

      processed++;
      affectedDates.add(entry.date);
    }

    // Create or update posts for each affected date
    let postsCreated = 0;
    for (const date of affectedDates) {
      const existingPost = await ctx.db
        .query("posts")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", me._id).eq("usageDate", date)
        )
        .unique();

      const usageEntries = await ctx.db
        .query("daily_usage")
        .withIndex("by_user_date_provider", (q) =>
          q.eq("userId", me._id).eq("date", date)
        )
        .collect();

      const providers = [...new Set(usageEntries.map((e) => e.provider))];

      if (existingPost) {
        await ctx.db.patch(existingPost._id, { providers });
        // Re-link
        const oldLinks = await ctx.db
          .query("post_daily_usage")
          .withIndex("by_post", (q) => q.eq("postId", existingPost._id))
          .collect();
        for (const link of oldLinks) await ctx.db.delete(link._id);
        for (const ue of usageEntries) {
          await ctx.db.insert("post_daily_usage", {
            postId: existingPost._id,
            dailyUsageId: ue._id,
          });
        }
      } else {
        const postId = await ctx.db.insert("posts", {
          userId: me._id,
          usageDate: date,
          images: [],
          providers,
          isPublished: true,
        });
        for (const ue of usageEntries) {
          await ctx.db.insert("post_daily_usage", {
            postId,
            dailyUsageId: ue._id,
          });
        }
        postsCreated++;
      }
    }

    // Check achievements
    await checkAchievements(ctx, me._id);

    return {
      success: errors.length === 0,
      processed,
      posts_created: postsCreated,
      ...(errors.length > 0 && { errors }),
    };
  },
});

async function checkAchievements(
  ctx: any,
  userId: Id<"users">
) {
  const stats = await ctx.db
    .query("daily_usage")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  if (!stats || stats.length === 0) return;

  const totalCost = stats.reduce((sum: number, r: any) => sum + r.costUsd, 0);
  const uniqueDates = new Set(stats.map((r: any) => r.date));
  const uniqueProviders = new Set(stats.map((r: any) => r.provider));
  const dayCount = uniqueDates.size;

  const checks = [
    { slug: "first-submit", condition: dayCount >= 1 },
    { slug: "week-warrior", condition: dayCount >= 7 },
    { slug: "month-master", condition: dayCount >= 30 },
    { slug: "hundred-days", condition: dayCount >= 100 },
    { slug: "big-spender-10", condition: totalCost >= 10 },
    { slug: "big-spender-100", condition: totalCost >= 100 },
    { slug: "big-spender-1000", condition: totalCost >= 1000 },
    { slug: "multi-provider", condition: uniqueProviders.size >= 2 },
    { slug: "all-providers", condition: uniqueProviders.size >= 4 },
  ];

  for (const { slug, condition } of checks) {
    if (!condition) continue;
    const existing = await ctx.db
      .query("user_achievements")
      .withIndex("by_user_slug", (q: any) =>
        q.eq("userId", userId).eq("slug", slug)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("user_achievements", { userId, slug });
    }
  }
}
