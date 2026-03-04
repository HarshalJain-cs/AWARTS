import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import { getCurrentUser } from "./users";

// Batch-load users by IDs, returning a Map for O(1) lookups
async function batchLoadUsers(
  ctx: any,
  userIds: Id<"users">[]
): Promise<Map<string, Doc<"users">>> {
  const unique = [...new Set(userIds.map(String))];
  const users = await Promise.all(unique.map((id) => ctx.db.get(id as Id<"users">)));
  const map = new Map<string, Doc<"users">>();
  for (const u of users) {
    if (u) map.set(String(u._id), u);
  }
  return map;
}

// GET /feed — paginated feed with filtering
export const getFeed = query({
  args: {
    type: v.optional(v.string()), // "global" | "following"
    provider: v.optional(v.string()),
    cursor: v.optional(v.string()), // _creationTime as string for pagination
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { type = "global", provider, cursor, limit = 20 }) => {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const me = await getCurrentUser(ctx);

    // Build following set upfront if needed
    let followingIds: Set<string> | null = null;
    if (type === "following" && me) {
      const followRows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", me._id))
        .collect();
      followingIds = new Set(followRows.map((f) => String(f.followingId)));
    }

    // Stream through posts with cursor-based pagination
    let query = ctx.db.query("posts").order("desc");

    // Apply cursor filter
    const posts: Doc<"posts">[] = [];
    const cursorTime = cursor ? Number(cursor) : Infinity;

    // Take enough to fill page after filtering
    const candidates = await query.take(safeLimit * 5);

    // Batch-load all candidate authors
    const candidateUserIds = [...new Set(candidates.map((p) => p.userId))];
    const userMap = await batchLoadUsers(ctx, candidateUserIds);

    for (const p of candidates) {
      if (posts.length >= safeLimit + 1) break;
      if (cursor && p._creationTime >= cursorTime) continue;
      if (!p.isPublished) continue;

      // Check privacy
      const author = userMap.get(String(p.userId));
      if (!author) continue;
      if (!author.isPublic && !(me && p.userId === me._id)) continue;

      // Following filter
      if (followingIds && !followingIds.has(String(p.userId))) continue;

      // Provider filter
      if (provider && !p.providers.includes(provider)) continue;

      posts.push(p);
    }

    const hasMore = posts.length > safeLimit;
    const page = posts.slice(0, safeLimit);

    // Hydrate with kudos, comments, usage — batch where possible
    const hydrated = await Promise.all(
      page.map(async (post) => {
        const author = userMap.get(String(post.userId));

        const [kudosRows, commentRows, links] = await Promise.all([
          ctx.db.query("kudos").withIndex("by_post", (q) => q.eq("postId", post._id)).collect(),
          ctx.db.query("comments").withIndex("by_post", (q) => q.eq("postId", post._id)).collect(),
          ctx.db.query("post_daily_usage").withIndex("by_post", (q) => q.eq("postId", post._id)).collect(),
        ]);

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
    const safeLimit = Math.min(Math.max(1, limit), 50);
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
      .take(safeLimit * 3);

    // Filter published and apply cursor
    const cursorTime = cursor ? Number(cursor) : Infinity;
    let filtered = posts.filter((p) => p.isPublished && (!cursor || p._creationTime < cursorTime));

    const sliced = filtered.slice(0, safeLimit + 1);
    const hasMore = sliced.length > safeLimit;
    const page = sliced.slice(0, safeLimit);

    const hydrated = await Promise.all(
      page.map(async (post) => {
        const [kudosRows, commentRows, links] = await Promise.all([
          ctx.db.query("kudos").withIndex("by_post", (q) => q.eq("postId", post._id)).collect(),
          ctx.db.query("comments").withIndex("by_post", (q) => q.eq("postId", post._id)).collect(),
          ctx.db.query("post_daily_usage").withIndex("by_post", (q) => q.eq("postId", post._id)).collect(),
        ]);

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
