import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchUsers = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { q, limit = 20 }) => {
    if (!q || q.length < 1) return [];

    const term = q.toLowerCase();

    // Get all users and filter (Convex doesn't have ILIKE, so we filter in-memory)
    const allUsers = await ctx.db.query("users").collect();

    const matched = allUsers
      .filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          u.displayName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
      )
      .slice(0, limit)
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
