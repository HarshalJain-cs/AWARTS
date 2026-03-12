import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import type { Id } from "./_generated/dataModel";

// Get all conversations for the current user
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];

    // Get all conversations — filter in memory for participant match
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessage")
      .order("desc")
      .take(500);

    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(me._id)
    );

    const results = await Promise.all(
      myConversations.map(async (conv) => {
        const otherId = conv.participantIds.find((id) => id !== me._id);
        const other = otherId ? await ctx.db.get(otherId) : null;

        // Count unread messages
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_unread", (q) =>
            q.eq("conversationId", conv._id).eq("isRead", false)
          )
          .collect();
        const unreadCount = unreadMessages.filter(
          (m) => m.senderId !== me._id
        ).length;

        return {
          _id: conv._id,
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          unreadCount,
          otherUser: other
            ? {
                _id: other._id,
                username: other.username,
                displayName: other.displayName,
                avatarUrl: other.avatarUrl,
              }
            : null,
        };
      })
    );

    return results.filter((r) => r.otherUser);
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];

    const conv = await ctx.db.get(conversationId);
    if (!conv || !conv.participantIds.includes(me._id)) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("asc")
      .take(200);

    return messages;
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, content }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");
    if (content.length < 1 || content.length > 2000) {
      throw new Error("Message must be 1-2000 characters");
    }

    const conv = await ctx.db.get(conversationId);
    if (!conv || !conv.participantIds.includes(me._id)) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId,
      senderId: me._id,
      content,
      isRead: false,
      createdAt: now,
    });

    // Update conversation
    await ctx.db.patch(conversationId, {
      lastMessageAt: now,
      lastMessagePreview: content.slice(0, 100),
    });

    // Notify the other participant
    const recipientId = conv.participantIds.find((id) => id !== me._id);
    if (recipientId) {
      await ctx.db.insert("notifications", {
        recipientId,
        senderId: me._id,
        type: "message",
        isRead: false,
      });
    }

    return { success: true };
  },
});

// Start or find an existing conversation
export const startConversation = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");
    if (me._id === userId) throw new Error("Cannot message yourself");

    // Check if conversation already exists
    const allConversations = await ctx.db
      .query("conversations")
      .take(1000);

    const existing = allConversations.find(
      (c) =>
        c.participantIds.length === 2 &&
        c.participantIds.includes(me._id) &&
        c.participantIds.includes(userId)
    );

    if (existing) return existing._id;

    // Create new conversation
    const convId = await ctx.db.insert("conversations", {
      participantIds: [me._id, userId],
      lastMessageAt: Date.now(),
    });

    return convId;
  },
});

// Mark all messages in a conversation as read
export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const conv = await ctx.db.get(conversationId);
    if (!conv || !conv.participantIds.includes(me._id)) return;

    const unread = await ctx.db
      .query("messages")
      .withIndex("by_unread", (q) =>
        q.eq("conversationId", conversationId).eq("isRead", false)
      )
      .collect();

    for (const msg of unread) {
      if (msg.senderId !== me._id) {
        await ctx.db.patch(msg._id, { isRead: true });
      }
    }
  },
});

// Get total unread message count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) return 0;

    const allConversations = await ctx.db
      .query("conversations")
      .take(500);

    const myConversations = allConversations.filter((c) =>
      c.participantIds.includes(me._id)
    );

    let total = 0;
    for (const conv of myConversations) {
      const unread = await ctx.db
        .query("messages")
        .withIndex("by_unread", (q) =>
          q.eq("conversationId", conv._id).eq("isRead", false)
        )
        .collect();
      total += unread.filter((m) => m.senderId !== me._id).length;
    }

    return total;
  },
});
