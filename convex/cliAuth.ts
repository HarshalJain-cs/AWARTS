import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Rejection sampling: eliminates modulo bias in random character selection
function randomChars(chars: string, length: number): string {
  const maxValid = 256 - (256 % chars.length);
  let result = "";
  while (result.length < length) {
    const array = new Uint8Array(length * 2);
    crypto.getRandomValues(array);
    for (let i = 0; i < array.length && result.length < length; i++) {
      if (array[i] < maxValid) {
        result += chars[array[i] % chars.length];
      }
    }
  }
  return result;
}

function generateCode(length: number): string {
  return randomChars("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", length);
}

function generateToken(length: number): string {
  return randomChars("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", length);
}

// POST /auth/cli/init — create a device auth code
export const initCLIAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const code = generateCode(8);
    const deviceToken = generateToken(48); // Increased from 32 to 48 for better entropy
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
    // Input validation
    if (!deviceToken || deviceToken.length < 10 || deviceToken.length > 100) {
      return { status: "invalid" };
    }

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

    // Validate code format
    if (!code || code.length !== 8 || !/^[A-Z0-9]+$/.test(code)) {
      throw new Error("Invalid code format");
    }

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

    // Generate a strong CLI auth token (expires in 90 days)
    const TOKEN_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(row._id, {
      status: "verified",
      userId: me._id,
      jwtToken: `convex_cli_${generateToken(64)}`,
      tokenExpiresAt: Date.now() + TOKEN_LIFETIME_MS,
      lastUsedAt: Date.now(),
    });

    return { success: true };
  },
});
