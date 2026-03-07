import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Allowed origins for CORS — production only
const ALLOWED_ORIGINS = [
  "https://awarts.com",
  "https://www.awarts.com",
  "https://awarts.vercel.app",
];

function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  };
}

// Preflight OPTIONS handler for CORS
const preflightHandler = httpAction(async (_ctx, request) => {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
});

function jsonResponse(data: unknown, request?: Request, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: getCorsHeaders(request) });
}

function errorResponse(message: string, request?: Request, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: getCorsHeaders(request) });
}

// ─── CLI Auth: Init ─────────────────────────────────────────────────
http.route({
  path: "/api/auth/cli/init",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const result = await ctx.runMutation(api.cliAuth.initCLIAuth);
      return jsonResponse(result, request);
    } catch {
      return errorResponse("Auth initialization failed", request, 500);
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
      return errorResponse("Invalid JSON body", request);
    }

    const deviceToken = body.device_token;
    if (!deviceToken || typeof deviceToken !== "string" || deviceToken.length > 100) {
      return errorResponse("Invalid device_token", request);
    }

    try {
      const result = await ctx.runQuery(api.cliAuth.pollCLIAuth, { deviceToken });
      return jsonResponse(result, request);
    } catch {
      return errorResponse("Auth polling failed", request, 500);
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
      return errorResponse("Missing or invalid Authorization header", request, 401);
    }
    const token = authHeader.slice(7);
    if (!token || token.length < 10) {
      return errorResponse("Invalid token", request, 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", request);
    }

    // Validate entries array exists and is reasonable size
    if (!Array.isArray(body.entries)) {
      return errorResponse("entries must be an array", request);
    }
    if (body.entries.length > 500) {
      return errorResponse("Too many entries (max 500)", request);
    }

    try {
      // Validate source parameter
      const validSources = ["cli", "web", "api"];
      const source = validSources.includes(body.source) ? body.source : "cli";

      const result = await ctx.runMutation(api.usage.submitUsage, {
        entries: body.entries,
        source,
        hash: body.hash,
        authToken: token,
      });
      return jsonResponse(result, request);
    } catch (err: any) {
      const isAuthError = err.message?.includes("Not authenticated") || err.message?.includes("Token expired");
      const status = isAuthError ? 401 : 400;
      const message = isAuthError ? "Authentication failed" : "Usage submission failed";
      return errorResponse(message, request, status);
    }
  }),
});

// ─── CORS Preflight ──────────────────────────────────────────────────
http.route({ path: "/api/auth/cli/init", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/auth/cli/poll", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/usage/submit", method: "OPTIONS", handler: preflightHandler });

export default http;
