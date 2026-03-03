import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./users";

// GET /feed — paginated feed with filtering
export const getFeed = query({
  args: {
    type: v.optional(v.string()), // "global" | "following"
    provider: v.optional(v.string()),
    cursor: v.optional(v.string()), // _creationTime as string for pagination
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type = "global", provider, cursor, limit = 20 }) => {
    const me = await getCurrentUser(ctx);

    let posts = await ctx.db
      .query("posts")
      .order("desc")
      .collect();

    // Filter: only published posts
    posts = posts.filter((p) => p.isPublished);

    // Filter out posts from private profiles (except own posts)
    const privateUserCache = new Map<string, boolean>();
    const getIsPrivate = async (userId: any) => {
      const key = String(userId);
      if (!privateUserCache.has(key)) {
        const u = await ctx.db.get(userId);
        privateUserCache.set(key, u ? !u.isPublic : true);
      }
      return privateUserCache.get(key)!;
    };
    const visiblePosts = [];
    for (const p of posts) {
      const isPrivate = await getIsPrivate(p.userId);
      if (!isPrivate || (me && p.userId === me._id)) {
        visiblePosts.push(p);
      }
    }
    posts = visiblePosts;

    // Filter: following only
    if (type === "following" && me) {
      const followRows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", me._id))
        .collect();
      const followingIds = new Set(followRows.map((f) => f.followingId));
      posts = posts.filter((p) => followingIds.has(p.userId));
    }

    // Filter: by provider
    if (provider) {
      posts = posts.filter((p) => p.providers.includes(provider));
    }

    // Cursor-based pagination
    if (cursor) {
      const cursorTime = Number(cursor);
      posts = posts.filter((p) => p._creationTime < cursorTime);
    }

    // Limit + 1 to detect hasMore
    const sliced = posts.slice(0, limit + 1);
    const hasMore = sliced.length > limit;
    const page = sliced.slice(0, limit);

    // Hydrate with author info, kudos count, comment count
    const hydrated = await Promise.all(
      page.map(async (post) => {
        const author = await ctx.db.get(post.userId);

        const kudosRows = await ctx.db
          .query("kudos")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        const commentRows = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        // Get usage entries for the post
        const links = await ctx.db
          .query("post_daily_usage")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();
        const usageEntries = await Promise.all(
          links.map((l) => ctx.db.get(l.dailyUsageId))
        );

        let hasGivenKudos = false;
        if (me) {
          const myKudo = await ctx.db
            .query("kudos")
            .withIndex("by_user_post", (q) =>
              q.eq("userId", me._id).eq("postId", post._id)
            )
            .unique();
          hasGivenKudos = !!myKudo;
        }

        return {
          ...post,
          author: author
            ? { _id: author._id, username: author.username, displayName: author.displayName, avatarUrl: author.avatarUrl }
            : null,
          kudosCount: kudosRows.length,
          commentCount: commentRows.length,
          hasGivenKudos,
          usage: usageEntries.filter(Boolean),
        };
      })
    );

    return {
      posts: hydrated,
      nextCursor: hasMore
        ? String(page[page.length - 1]._creationTime)
        : null,
    };
  },
});

// GET /feed?username=... — user-specific posts
export const getUserPosts = query({
  args: {
    username: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { username, cursor, limit = 20 }) => {
    const me = await getCurrentUser(ctx);

    // Find user by username
    const target = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!target) return { posts: [], nextCursor: null };

    let posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", target._id))
      .order("desc")
      .collect();

    posts = posts.filter((p) => p.isPublished);

    if (cursor) {
      const cursorTime = Number(cursor);
      posts = posts.filter((p) => p._creationTime < cursorTime);
    }

    const sliced = posts.slice(0, limit + 1);
    const hasMore = sliced.length > limit;
    const page = sliced.slice(0, limit);

    const hydrated = await Promise.all(
      page.map(async (post) => {
        const kudosRows = await ctx.db
          .query("kudos")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        const commentRows = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        const links = await ctx.db
          .query("post_daily_usage")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();
        const usageEntries = await Promise.all(
          links.map((l) => ctx.db.get(l.dailyUsageId))
        );

        let hasGivenKudos = false;
        if (me) {
          const myKudo = await ctx.db
            .query("kudos")
            .withIndex("by_user_post", (q) =>
              q.eq("userId", me._id).eq("postId", post._id)
            )
            .unique();
          hasGivenKudos = !!myKudo;
        }

        return {
          ...post,
          author: {
            _id: target._id,
            username: target.username,
            displayName: target.displayName,
            avatarUrl: target.avatarUrl,
          },
          kudosCount: kudosRows.length,
          commentCount: commentRows.length,
          hasGivenKudos,
          usage: usageEntries.filter(Boolean),
        };
      })
    );

    return {
      posts: hydrated,
      nextCursor: hasMore ? String(page[page.length - 1]._creationTime) : null,
    };
  },
});
