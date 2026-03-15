import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./users";

// GET /export/my-data — GDPR data export
export const getMyData = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    // Collect all user data
    const usage = await ctx.db
      .query("daily_usage")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    const achievements = await ctx.db
      .query("user_achievements")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();

    const followersRows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", me._id))
      .collect();

    const followingRows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", me._id))
      .collect();

    // Resolve follower/following usernames
    const resolveUsers = async (ids: Id<"users">[]) => {
      const results: string[] = [];
      for (const id of ids) {
        const u = await ctx.db.get(id);
        if (u) results.push(u.username);
      }
      return results;
    };

    const followerUsernames = await resolveUsers(followersRows.map((f) => f.followerId));
    const followingUsernames = await resolveUsers(followingRows.map((f) => f.followingId));

    return {
      profile: {
        username: me.username,
        displayName: me.displayName,
        bio: me.bio,
        email: me.email,
        country: me.country,
        region: me.region,
        timezone: me.timezone,
        githubUsername: me.githubUsername,
        externalLink: me.externalLink,
        walletAddress: me.walletAddress,
        isPublic: me.isPublic,
        defaultAiProvider: me.defaultAiProvider,
        createdAt: new Date(me._creationTime).toISOString(),
      },
      usage: usage.map((u) => ({
        date: u.date,
        provider: u.provider,
        costUsd: u.costUsd,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        models: u.models,
        source: u.source,
      })),
      posts: posts.map((p) => ({
        usageDate: p.usageDate,
        title: p.title,
        description: p.description,
        providers: p.providers,
        isPublished: p.isPublished,
        createdAt: new Date(p._creationTime).toISOString(),
      })),
      achievements: achievements.map((a) => ({
        slug: a.slug,
        awardedAt: new Date(a._creationTime).toISOString(),
      })),
      social: {
        followers: followerUsernames,
        following: followingUsernames,
      },
      exportedAt: new Date().toISOString(),
    };
  },
});
