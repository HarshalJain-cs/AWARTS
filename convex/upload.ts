import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Generate an upload URL for Convex file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// After upload, save the storage ID and get a serving URL
export const saveFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to get file URL");
    return { url, storageId };
  },
});

// Upload avatar: generates URL, expects client to upload, then saves to profile
export const saveAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to get file URL");
    await ctx.db.patch(user._id, { avatarUrl: url });
    return { url };
  },
});
