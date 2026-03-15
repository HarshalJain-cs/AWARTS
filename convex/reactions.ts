import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

const VALID_REACTIONS = ["fire", "mind_blown", "rocket", "heart", "clap"] as const;

export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    type: v.string(),
  },
  handler: async (ctx, { postId, type }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!VALID_REACTIONS.includes(type as any)) {
      throw new Error("Invalid reaction type");
    }

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    // Check for existing reaction of this type
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_user_post", (q) => q.eq("userId", me._id).eq("postId", postId))
      .collect();

    const sameType = existing.find((r) => r.type === type);

    if (sameType) {
      // Remove reaction
      await ctx.db.delete(sameType._id);
      return { action: "removed" };
    } else {
      // Remove any other reaction from this user on this post (one reaction per user)
      for (const r of existing) {
        await ctx.db.delete(r._id);
      }
      // Add new reaction
      await ctx.db.insert("reactions", {
        userId: me._id,
        postId,
        type,
      });
      return { action: "added" };
    }
  },
});

export const getReactions = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const empty = { counts: {} as Record<string, number>, myReaction: null as string | null, total: 0 };

    // Verify the post exists on this deployment
    const post = await ctx.db.get(postId);
    if (!post) return empty;

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    const me = await getCurrentUser(ctx);

    const counts: Record<string, number> = {};
    let myReaction: string | null = null;

    for (const r of reactions) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
      if (me && r.userId === me._id) {
        myReaction = r.type;
      }
    }

    return { counts, myReaction, total: reactions.length };
  },
});
