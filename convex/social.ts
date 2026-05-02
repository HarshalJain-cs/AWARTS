import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { inlineRateLimit } from "./rateLimit";

// ─── FOLLOW / UNFOLLOW ──────────────────────────────────────────────

export const follow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, { followingId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");
    if (me._id === followingId) throw new Error("Cannot follow yourself");

    if (!(await inlineRateLimit(ctx, `follow:${me._id}`, 30, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", me._id).eq("followingId", followingId)
      )
      .unique();
    if (existing) return { success: true };

    await ctx.db.insert("follows", {
      followerId: me._id,
      followingId,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      recipientId: followingId,
      senderId: me._id,
      type: "follow",
      isRead: false,
    });

    return { success: true };
  },
});

export const unfollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, { followingId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `follow:${me._id}`, 30, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", me._id).eq("followingId", followingId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true };
  },
});

// ─── KUDOS ──────────────────────────────────────────────────────────

export const giveKudos = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `kudos:${me._id}`, 60, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    const existing = await ctx.db
      .query("kudos")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", me._id).eq("postId", postId)
      )
      .unique();
    if (existing) return { success: true };

    // Verify post exists and is accessible
    const post = await ctx.db.get(postId);
    if (!post || !post.isPublished) throw new Error("Post not found");

    await ctx.db.insert("kudos", { userId: me._id, postId });

    // Notify post author
    if (post.userId !== me._id) {
      await ctx.db.insert("notifications", {
        recipientId: post.userId,
        senderId: me._id,
        type: "kudos",
        postId,
        isRead: false,
      });
    }
    return { success: true };
  },
});

export const removeKudos = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `kudos:${me._id}`, 60, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    const existing = await ctx.db
      .query("kudos")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", me._id).eq("postId", postId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true };
  },
});

// ─── COMMENTS ───────────────────────────────────────────────────────

export const getComments = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("asc")
      .collect();

    // Batch load all comment authors
    const authorIds = [...new Set(comments.map((c) => String(c.userId)))];
    const authors = await Promise.all(authorIds.map((id) => ctx.db.get(id as any)));
    const authorMap = new Map<string, any>();
    for (const a of authors) {
      if (a) authorMap.set(String(a._id), a);
    }

    return comments.map((c) => {
      const author = authorMap.get(String(c.userId));
      return {
        ...c,
        author: author
          ? { _id: author._id, username: author.username, displayName: author.displayName, avatarUrl: author.avatarUrl }
          : null,
      };
    });
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, { postId, content }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `comment:${me._id}`, 20, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    if (content.length < 1 || content.length > 1000) {
      throw new Error("Comment must be 1-1000 characters");
    }

    // Verify the post exists and is published
    const post = await ctx.db.get(postId);
    if (!post || !post.isPublished) {
      throw new Error("Post not found");
    }

    // Verify the post author's profile is public (or commenter is the author)
    if (post.userId !== me._id) {
      const author = await ctx.db.get(post.userId);
      if (!author || !author.isPublic) {
        throw new Error("Post not found");
      }
    }

    const commentId = await ctx.db.insert("comments", {
      postId,
      userId: me._id,
      content,
    });

    // Notify post author (post already fetched above)
    if (post.userId !== me._id) {
      await ctx.db.insert("notifications", {
        recipientId: post.userId,
        senderId: me._id,
        type: "comment",
        postId,
        commentId,
        isRead: false,
      });
    }

    return commentId;
  },
});

export const editComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, { commentId, content }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `comment:${me._id}`, 20, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    if (content.length < 1 || content.length > 1000) {
      throw new Error("Comment must be 1-1000 characters");
    }

    const comment = await ctx.db.get(commentId);
    if (!comment || comment.userId !== me._id) {
      throw new Error("Comment not found or not yours");
    }
    await ctx.db.patch(commentId, { content });
    return { success: true };
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `comment:${me._id}`, 30, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    const comment = await ctx.db.get(commentId);
    if (!comment || comment.userId !== me._id) {
      throw new Error("Comment not found or not yours");
    }
    await ctx.db.delete(commentId);
    return { success: true };
  },
});

// ─── NOTIFICATIONS ──────────────────────────────────────────────────

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];

    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", me._id))
      .order("desc")
      .take(50);

    // Batch load all senders
    const senderIds = [...new Set(notifs.filter((n) => n.senderId).map((n) => String(n.senderId)))];
    const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id as any)));
    const senderMap = new Map<string, any>();
    for (const s of senders) {
      if (s) senderMap.set(String(s._id), s);
    }

    return notifs.map((n) => {
      const sender = n.senderId ? senderMap.get(String(n.senderId)) : null;
      return {
        ...n,
        sender: sender
          ? { username: sender.username, displayName: sender.displayName, avatarUrl: sender.avatarUrl }
          : null,
      };
    });
  },
});

export const markNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (!(await inlineRateLimit(ctx, `notif_read:${me._id}`, 30, 60_000))) {
      throw new Error("Too many requests. Please slow down.");
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", me._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
    return { marked: unread.length };
  },
});
