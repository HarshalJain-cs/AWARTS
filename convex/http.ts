import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ─── CLI Auth: Init ─────────────────────────────────────────────────
http.route({
  path: "/api/auth/cli/init",
  method: "POST",
  handler: httpAction(async (ctx) => {
    const result = await ctx.runMutation(api.cliAuth.initCLIAuth);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── CLI Auth: Poll ─────────────────────────────────────────────────
http.route({
  path: "/api/auth/cli/poll",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const result = await ctx.runQuery(api.cliAuth.pollCLIAuth, {
      deviceToken: body.device_token,
    });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Usage Submit ───────────────────────────────────────────────────
http.route({
  path: "/api/usage/submit",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    try {
      const result = await ctx.runMutation(api.usage.submitUsage, {
        entries: body.entries,
        source: body.source ?? "cli",
        hash: body.hash,
      });
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message ?? "Submit failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
