import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchUsers = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { q, limit = 20 }) => {
    if (!q || q.length < 1) return [];

    // Cap limit to prevent abuse
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const term = q.toLowerCase().slice(0, 100); // Cap search term length

    // Get users and filter in-memory (Convex doesn't have ILIKE)
    // Only search by username and displayName - NOT email (privacy)
    // Cap scan to prevent full table load abuse
    const allUsers = await ctx.db.query("users").take(500);

    const matched = allUsers
      .filter(
        (u) =>
          u.isPublic && (
            u.username.toLowerCase().includes(term) ||
            u.displayName?.toLowerCase().includes(term)
          )
      )
      .slice(0, safeLimit)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
      }));

    return matched;
  },
});
