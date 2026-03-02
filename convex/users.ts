import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper: get internal user from Clerk identity
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  return user;
}

// Helper: require authenticated user (throws if not found)
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

// Called on first login — creates a user profile from Clerk identity
export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) return existing._id;

    const username =
      identity.nickname ??
      identity.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase() ??
      `user_${Date.now()}`;

    // Check for username collision
    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    const finalUsername = taken ? `${username}_${Date.now().toString(36)}` : username;

    // Clerk sets nickname to the GitHub username when signing in via GitHub OAuth
    const githubUsername = identity.nickname ?? undefined;

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      username: finalUsername,
      displayName: identity.name ?? undefined,
      avatarUrl: identity.pictureUrl ?? undefined,
      email: identity.email ?? undefined,
      githubUsername,
      timezone: "UTC",
      isPublic: true,
      defaultAiProvider: "claude",
      emailNotificationsEnabled: true,
    });
    return userId;
  },
});

// GET /users/me
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// PATCH /users/me
export const updateMe = mutation({
  args: {
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    defaultAiProvider: v.optional(v.string()),
    emailNotificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // If changing username, check availability
    if (args.username && args.username !== user.username) {
      const taken = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username!))
        .unique();
      if (taken) throw new Error("Username is already taken");
    }

    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

// GET /users/check-username
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    return { available: !taken };
  },
});

// GET /users/:username — public profile with stats
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return null;

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const achievements = await ctx.db
      .query("user_achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Check if current user follows this profile
    let isFollowing = false;
    const me = await getCurrentUser(ctx);
    if (me) {
      const followRow = await ctx.db
        .query("follows")
        .withIndex("by_pair", (q) =>
          q.eq("followerId", me._id).eq("followingId", user._id)
        )
        .unique();
      isFollowing = !!followRow;
    }

    return {
      ...user,
      stats: {
        followers: followers.length,
        following: following.length,
        posts: posts.length,
      },
      achievements: achievements.map((a) => a.slug),
      isFollowing,
    };
  },
});

// GET /users/:username/followers
export const getFollowers = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return [];

    const followRows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    const followers = await Promise.all(
      followRows.map(async (f) => {
        const u = await ctx.db.get(f.followerId);
        return u
          ? { _id: u._id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }
          : null;
      })
    );
    return followers.filter(Boolean);
  },
});

// GET /users/:username/following
export const getFollowing = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return [];

    const followRows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    const following = await Promise.all(
      followRows.map(async (f) => {
        const u = await ctx.db.get(f.followingId);
        return u
          ? { _id: u._id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }
          : null;
      })
    );
    return following.filter(Boolean);
  },
});
