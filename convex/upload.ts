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

    // Verify the file exists and check metadata
    const metadata = await ctx.storage.getMetadata(storageId);
    if (!metadata) throw new Error("File not found");

    // Validate file size (max 5MB)
    if (metadata.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Maximum size is 5MB.");
    }

    // Validate content type (images only)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (metadata.contentType && !allowedTypes.includes(metadata.contentType)) {
      throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
    }

    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to get file URL");
    return { url, storageId };
  },
});

// Upload avatar: saves to profile
export const saveAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Verify the file exists and check metadata
    const metadata = await ctx.storage.getMetadata(storageId);
    if (!metadata) throw new Error("File not found");

    // Validate file size (max 2MB for avatars)
    if (metadata.size > 2 * 1024 * 1024) {
      throw new Error("Avatar too large. Maximum size is 2MB.");
    }

    // Validate content type (images only)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (metadata.contentType && !allowedTypes.includes(metadata.contentType)) {
      throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed for avatars.");
    }

    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to get file URL");
    await ctx.db.patch(user._id, { avatarUrl: url });
    return { url };
  },
});
