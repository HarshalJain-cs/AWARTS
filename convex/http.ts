import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Shared CORS + JSON headers
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

// ─── CLI Auth: Init ─────────────────────────────────────────────────
http.route({
  path: "/api/auth/cli/init",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      const result = await ctx.runMutation(api.cliAuth.initCLIAuth);
      return jsonResponse(result);
    } catch (err: any) {
      return errorResponse(err.message ?? "Init failed", 500);
    }
  }),
});

// ─── CLI Auth: Poll ─────────────────────────────────────────────────
http.route({
  path: "/api/auth/cli/poll",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    const deviceToken = body.device_token;
    if (!deviceToken || typeof deviceToken !== "string" || deviceToken.length > 100) {
      return errorResponse("Invalid device_token");
    }

    try {
      const result = await ctx.runQuery(api.cliAuth.pollCLIAuth, { deviceToken });
      return jsonResponse(result);
    } catch (err: any) {
      return errorResponse(err.message ?? "Poll failed", 500);
    }
  }),
});

// ─── Usage Submit (requires CLI auth token) ─────────────────────────
http.route({
  path: "/api/usage/submit",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid Authorization header", 401);
    }
    const token = authHeader.slice(7);
    if (!token || token.length < 10) {
      return errorResponse("Invalid token", 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body");
    }

    // Validate entries array exists and is reasonable size
    if (!Array.isArray(body.entries)) {
      return errorResponse("entries must be an array");
    }
    if (body.entries.length > 500) {
      return errorResponse("Too many entries (max 500)");
    }

    try {
      const result = await ctx.runMutation(api.usage.submitUsage, {
        entries: body.entries,
        source: body.source ?? "cli",
        hash: body.hash,
        authToken: token,
      });
      return jsonResponse(result);
    } catch (err: any) {
      const status = err.message?.includes("Not authenticated") ? 401 : 400;
      return errorResponse(err.message ?? "Submit failed", status);
    }
  }),
});

export default http;
