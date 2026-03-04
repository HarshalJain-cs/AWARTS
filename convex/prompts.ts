import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Submit a new community prompt
export const submitPrompt = mutation({
  args: {
    content: v.string(),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, { content, isAnonymous }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const trimmed = content.trim();
    if (trimmed.length === 0) throw new Error("Content cannot be empty");
    if (trimmed.length > 2000) throw new Error("Content must be 2000 characters or less");

    const promptId = await ctx.db.insert("prompts", {
      userId: me._id,
      content: trimmed,
      isAnonymous,
      status: "pending",
    });

    return promptId;
  },
});

// Get community prompts (paginated)
export const getPrompts = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { cursor, limit = 20 }) => {
    const me = await getCurrentUser(ctx);

    let prompts = await ctx.db.query("prompts").order("desc").collect();

    // Cursor-based pagination
    if (cursor) {
      const cursorTime = Number(cursor);
      prompts = prompts.filter((p) => p._creationTime < cursorTime);
    }

    const sliced = prompts.slice(0, limit + 1);
    const hasMore = sliced.length > limit;
    const page = sliced.slice(0, limit);

    // Hydrate with author info and vote counts
    const hydrated = await Promise.all(
      page.map(async (prompt) => {
        const author = prompt.isAnonymous
          ? null
          : await ctx.db.get(prompt.userId);

        const votes = await ctx.db
          .query("prompt_votes")
          .withIndex("by_prompt", (q) => q.eq("promptId", prompt._id))
          .collect();

        let hasVoted = false;
        if (me) {
          const myVote = await ctx.db
            .query("prompt_votes")
            .withIndex("by_user_prompt", (q) =>
              q.eq("userId", me._id).eq("promptId", prompt._id)
            )
            .unique();
          hasVoted = !!myVote;
        }

        return {
          _id: prompt._id,
          content: prompt.content,
          isAnonymous: prompt.isAnonymous,
          status: prompt.status,
          _creationTime: prompt._creationTime,
          author: author
            ? {
                _id: author._id,
                username: author.username,
                displayName: author.displayName,
                avatarUrl: author.avatarUrl,
              }
            : null,
          voteCount: votes.length,
          hasVoted,
          isOwn: me ? prompt.userId === me._id : false,
        };
      })
    );

    // Sort by vote count descending, then by creation time descending
    hydrated.sort((a, b) => b.voteCount - a.voteCount || b._creationTime - a._creationTime);

    return {
      prompts: hydrated,
      nextCursor: hasMore
        ? String(page[page.length - 1]._creationTime)
        : null,
    };
  },
});

// Toggle vote on a prompt
export const toggleVote = mutation({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, { promptId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const prompt = await ctx.db.get(promptId);
    if (!prompt) throw new Error("Prompt not found");

    const existing = await ctx.db
      .query("prompt_votes")
      .withIndex("by_user_prompt", (q) =>
        q.eq("userId", me._id).eq("promptId", promptId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { voted: false };
    } else {
      await ctx.db.insert("prompt_votes", {
        userId: me._id,
        promptId,
      });
      return { voted: true };
    }
  },
});
