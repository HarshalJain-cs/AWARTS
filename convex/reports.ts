import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const submitReport = mutation({
  args: {
    targetType: v.string(),
    targetPostId: v.optional(v.id("posts")),
    targetUserId: v.optional(v.id("users")),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { targetType, targetPostId, targetUserId, reason, details }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    if (targetType !== "post" && targetType !== "user") {
      throw new Error("Invalid target type");
    }
    if (targetType === "post" && !targetPostId) {
      throw new Error("Post ID required");
    }
    if (targetType === "user" && !targetUserId) {
      throw new Error("User ID required");
    }

    // Prevent self-reports
    if (targetType === "user" && targetUserId === me._id) {
      throw new Error("Cannot report yourself");
    }

    // Check for duplicate reports
    const existing = await ctx.db.query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", me._id))
      .collect();

    const duplicate = existing.find((r) =>
      r.targetType === targetType &&
      r.status === "pending" &&
      ((targetType === "post" && r.targetPostId === targetPostId) ||
       (targetType === "user" && r.targetUserId === targetUserId))
    );

    if (duplicate) {
      throw new Error("You already reported this");
    }

    const validReasons = ["spam", "harassment", "fake_data", "inappropriate", "other"];
    if (!validReasons.includes(reason)) {
      throw new Error("Invalid reason");
    }

    await ctx.db.insert("reports", {
      reporterId: me._id,
      targetType,
      targetPostId,
      targetUserId,
      reason,
      details: details?.slice(0, 500),
      status: "pending",
    });

    return { success: true };
  },
});
