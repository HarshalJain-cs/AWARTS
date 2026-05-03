import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Allowed origins for CORS — production only
const ALLOWED_ORIGINS = [
  "https://awarts.com",
  "https://www.awarts.com",
  "https://awarts.club",
  "chrome-extension://ocfdlilejljfjcnpjkadccegnaloeolk",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("Origin") ?? "";
  const isExtension = origin.startsWith("chrome-extension://");
  const allowedOrigin = (ALLOWED_ORIGINS.includes(origin) || isExtension) ? origin : ALLOWED_ORIGINS[0];
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

// CSRF protection: reject browser requests from unknown origins
function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // CLI requests don't send Origin
  // Allow all Chrome Extensions (auth is handled via API Key/Token)
  if (origin.startsWith("chrome-extension://")) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function jsonResponse(data: unknown, request?: Request, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: getCorsHeaders(request) });
}

function errorResponse(message: string, request?: Request, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: getCorsHeaders(request) });
}

// ─── CLI Auth: Init (rate-limited) ──────────────────────────────────
http.route({
  path: "/api/auth/cli/init",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateOrigin(request)) {
      return errorResponse("Forbidden", request, 403);
    }

    // Rate limit: 10 requests per minute per IP
    const ip = getClientIp(request);
    const rateCheck = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      key: `cli_init:${ip}`,
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      const headers = {
        ...getCorsHeaders(request),
        "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
      };
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

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
    if (!validateOrigin(request)) {
      return errorResponse("Forbidden", request, 403);
    }

    // Rate limit: 30 requests per minute per IP
    const pollIp = getClientIp(request);
    const pollRateCheck = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      key: `cli_poll:${pollIp}`,
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!pollRateCheck.allowed) {
      const headers = {
        ...getCorsHeaders(request),
        "Retry-After": String(Math.ceil(pollRateCheck.retryAfterMs / 1000)),
      };
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

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
    if (!validateOrigin(request)) {
      return errorResponse("Forbidden", request, 403);
    }

    // Rate limit: 30 requests per minute per IP
    const ip = getClientIp(request);
    const rateCheck = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      key: `usage_submit:${ip}`,
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      const headers = {
        ...getCorsHeaders(request),
        "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
      };
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

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
        note: typeof body.note === "string" ? body.note.slice(0, 2000) : undefined,
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

// ─── Usage Cleanup (delete old/wrong entries) ────────────────────────
http.route({
  path: "/api/usage/cleanup",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!validateOrigin(request)) {
      return errorResponse("Forbidden", request, 403);
    }

    // Rate limit: 10 requests per minute per IP
    const cleanupIp = getClientIp(request);
    const cleanupRateCheck = await ctx.runMutation(internal.rateLimit.checkRateLimit, {
      key: `usage_cleanup:${cleanupIp}`,
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!cleanupRateCheck.allowed) {
      const headers = {
        ...getCorsHeaders(request),
        "Retry-After": String(Math.ceil(cleanupRateCheck.retryAfterMs / 1000)),
      };
      return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers });
    }

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

    try {
      const result = await ctx.runMutation(api.usage.cleanupUsage, {
        beforeDate: body.before_date,
        dates: body.dates,
        authToken: token,
      });
      return jsonResponse(result, request);
    } catch (err: any) {
      const isAuthError = err.message?.includes("Not authenticated") || err.message?.includes("Token expired");
      return errorResponse(
        isAuthError ? "Authentication failed" : "Cleanup failed",
        request,
        isAuthError ? 401 : 400,
      );
    }
  }),
});

// ─── Embeddable SVG Scorecard ────────────────────────────────────────
http.route({
  path: "/api/embed",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");
    const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
    const compact = url.searchParams.get("compact") === "1";

    if (!username) {
      return new Response("Missing username param", { status: 400 });
    }

    // Fetch user stats
    const stats = await ctx.runQuery(api.users.getByUsername, { username });

    const bg = theme === "dark" ? "#0d1117" : "#ffffff";
    const fg = theme === "dark" ? "#e6edf3" : "#1f2328";
    const muted = theme === "dark" ? "#7d8590" : "#656d76";
    const accent = "#E87A35";
    const border = theme === "dark" ? "#30363d" : "#d0d7de";

    const totalCost = stats?.stats?.total_cost_usd ?? 0;
    const streak = stats?.stats?.current_streak ?? 0;
    const totalDays = stats?.stats?.total_days ?? 0;
    const displayName = stats?.displayName || stats?.username || username;

    // Streak level
    let level = 1;
    if (totalDays >= 365) level = 8;
    else if (totalDays >= 200) level = 7;
    else if (totalDays >= 100) level = 6;
    else if (totalDays >= 60) level = 5;
    else if (totalDays >= 30) level = 4;
    else if (totalDays >= 14) level = 3;
    else if (totalDays >= 7) level = 2;

    const costStr = totalCost >= 1000 ? `$${(totalCost / 1000).toFixed(1)}k` : `$${totalCost.toFixed(2)}`;

    let svg: string;
    if (compact) {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="28" viewBox="0 0 340 28">
  <rect width="340" height="28" rx="4" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="8" y="18" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${accent}" font-weight="600">AWARTS</text>
  <text x="60" y="18" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${fg}">@${username}</text>
  <text x="150" y="18" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${muted}">L${level} · ${costStr} · ${streak}d streak · ${totalDays}d active</text>
</svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
  <rect width="400" height="120" rx="8" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="16" y="28" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="13" fill="${accent}" font-weight="700">▰ AWARTS</text>
  <text x="16" y="50" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="16" fill="${fg}" font-weight="600">@${username}</text>
  <rect x="${16 + (username.length + 1) * 9 + 8}" y="38" width="28" height="18" rx="4" fill="${accent}"/>
  <text x="${16 + (username.length + 1) * 9 + 22}" y="51" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="#fff" font-weight="700" text-anchor="middle">L${level}</text>
  <text x="16" y="80" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="20" fill="${fg}" font-weight="700">${costStr}</text>
  <text x="16" y="96" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${muted}">total spend</text>
  <text x="140" y="80" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="20" fill="${fg}" font-weight="700">${streak}d</text>
  <text x="140" y="96" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${muted}">streak</text>
  <text x="250" y="80" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="20" fill="${fg}" font-weight="700">${totalDays}</text>
  <text x="250" y="96" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${muted}">active days</text>
  <text x="340" y="80" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="20" fill="${fg}" font-weight="700">${displayName !== username ? displayName.charAt(0) : ''}L${level}</text>
  <text x="340" y="96" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="${muted}">level</text>
</svg>`;
    }

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// ─── CORS Preflight ──────────────────────────────────────────────────
http.route({ path: "/api/auth/cli/init", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/auth/cli/poll", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/usage/submit", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/usage/cleanup", method: "OPTIONS", handler: preflightHandler });
http.route({ path: "/api/embed", method: "OPTIONS", handler: preflightHandler });

export default http;
