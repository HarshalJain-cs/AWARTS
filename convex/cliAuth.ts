import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

function generateCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateToken(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// POST /auth/cli/init — create a device auth code
export const initCLIAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const code = generateCode(8);
    const deviceToken = generateToken(32);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await ctx.db.insert("cli_auth_codes", {
      code,
      deviceToken,
      status: "pending",
      expiresAt,
    });

    return {
      code,
      device_token: deviceToken,
      expires_in: 600,
    };
  },
});

// POST /auth/cli/poll — check if auth has completed
export const pollCLIAuth = query({
  args: { deviceToken: v.string() },
  handler: async (ctx, { deviceToken }) => {
    const row = await ctx.db
      .query("cli_auth_codes")
      .withIndex("by_device_token", (q) => q.eq("deviceToken", deviceToken))
      .unique();

    if (!row) return { status: "invalid" };
    if (row.expiresAt < Date.now()) return { status: "expired" };
    if (row.status === "pending") return { status: "pending" };

    if (row.status === "verified" && row.jwtToken) {
      return {
        status: "verified",
        token: row.jwtToken,
        user_id: row.userId,
      };
    }

    return { status: row.status };
  },
});

// POST /auth/cli/verify — browser user verifies CLI code
export const verifyCLIAuth = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const row = await ctx.db
      .query("cli_auth_codes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!row || row.status !== "pending") {
      throw new Error("Invalid or expired code");
    }
    if (row.expiresAt < Date.now()) {
      throw new Error("Code has expired");
    }

    // For CLI auth, we store the user ID — the CLI will use Convex auth directly
    await ctx.db.patch(row._id, {
      status: "verified",
      userId: me._id,
      jwtToken: `convex_cli_${generateToken(48)}`,
    });

    return { success: true };
  },
});
