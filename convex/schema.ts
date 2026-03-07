import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    timezone: v.string(),
    isPublic: v.boolean(),
    email: v.optional(v.string()),
    defaultAiProvider: v.string(),
    emailNotificationsEnabled: v.boolean(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  daily_usage: defineTable({
    userId: v.id("users"),
    date: v.string(),
    provider: v.string(),
    costUsd: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cacheCreationTokens: v.number(),
    cacheReadTokens: v.number(),
    models: v.array(v.string()),
    source: v.string(),
    dataHash: v.optional(v.string()),
    rawData: v.optional(v.string()),
    costSource: v.optional(v.string()),
  })
    .index("by_user_date_provider", ["userId", "date", "provider"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  posts: defineTable({
    userId: v.id("users"),
    usageDate: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.array(v.string()),
    providers: v.array(v.string()),
    isPublished: v.boolean(),
    captionGeneratedBy: v.optional(v.string()),
  })
    .index("by_user_date", ["userId", "usageDate"])
    .index("by_user", ["userId"]),

  post_daily_usage: defineTable({
    postId: v.id("posts"),
    dailyUsageId: v.id("daily_usage"),
  })
    .index("by_post", ["postId"])
    .index("by_usage", ["dailyUsageId"]),

  comments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    content: v.string(),
  }).index("by_post", ["postId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_pair", ["followerId", "followingId"]),

  kudos: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  notifications: defineTable({
    recipientId: v.id("users"),
    senderId: v.optional(v.id("users")),
    type: v.string(),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    isRead: v.boolean(),
  }).index("by_recipient", ["recipientId"]),

  cli_auth_codes: defineTable({
    code: v.string(),
    deviceToken: v.string(),
    userId: v.optional(v.id("users")),
    status: v.string(),
    jwtToken: v.optional(v.string()),
    expiresAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    tokenExpiresAt: v.optional(v.number()),
  })
    .index("by_code", ["code"])
    .index("by_device_token", ["deviceToken"])
    .index("by_jwt", ["jwtToken"]),

  user_achievements: defineTable({
    userId: v.id("users"),
    slug: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_slug", ["userId", "slug"]),

  countries_to_regions: defineTable({
    countryCode: v.string(),
    countryName: v.string(),
    region: v.string(),
  }).index("by_country_code", ["countryCode"]),

  prompts: defineTable({
    userId: v.id("users"),
    content: v.string(),
    isAnonymous: v.boolean(),
    status: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  prompt_votes: defineTable({
    userId: v.id("users"),
    promptId: v.id("prompts"),
  })
    .index("by_prompt", ["promptId"])
    .index("by_user_prompt", ["userId", "promptId"]),
});
