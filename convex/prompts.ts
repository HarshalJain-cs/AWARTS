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

// Get community prompts (paginated by offset to support vote-based sorting)
export const getPrompts = query({
  args: {
    cursor: v.optional(v.string()), // kept for API compat, ignored
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20, offset = 0 }) => {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safeOffset = Math.max(0, offset);
    const me = await getCurrentUser(ctx);

    // Load all prompts (community prompts are a small dataset)
    const prompts = await ctx.db.query("prompts").order("desc").take(500);

    // Batch-load all vote counts and user's votes
    const allVotes = await Promise.all(
      prompts.map((p) =>
        ctx.db
          .query("prompt_votes")
          .withIndex("by_prompt", (q) => q.eq("promptId", p._id))
          .collect()
      )
    );

    let myVotedSet = new Set<string>();
    if (me) {
      const myVotes = await ctx.db
        .query("prompt_votes")
        .filter((q) => q.eq(q.field("userId"), me._id))
        .collect();
      myVotedSet = new Set(myVotes.map((v) => String(v.promptId)));
    }

    // Hydrate with author info and vote counts
    const hydrated = await Promise.all(
      prompts.map(async (prompt, i) => {
        const author = prompt.isAnonymous
          ? null
          : await ctx.db.get(prompt.userId);

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
          voteCount: allVotes[i].length,
          hasVoted: myVotedSet.has(String(prompt._id)),
          isOwn: me ? prompt.userId === me._id : false,
        };
      })
    );

    // Sort by vote count descending, then by creation time descending
    hydrated.sort((a, b) => b.voteCount - a.voteCount || b._creationTime - a._creationTime);

    // Paginate the sorted results (offset-based, consistent with sort order)
    const page = hydrated.slice(safeOffset, safeOffset + safeLimit);
    const hasMore = safeOffset + safeLimit < hydrated.length;

    return {
      prompts: page,
      nextCursor: hasMore ? String(safeOffset + safeLimit) : null,
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
