import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// ─── Get all token-rich companies (public) ──────────────────────────
export const getCompanies = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("token_rich_companies").collect();
    // Sort by order field, then by name
    return companies.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  },
});

// ─── Admin: Add a company ───────────────────────────────────────────
export const addCompany = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    quote: v.string(),
    sourceLabel: v.string(),
    sourceUrl: v.string(),
    logoEmoji: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    // Admin check
    const adminIds = (process.env.ADMIN_CLERK_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!adminIds.includes(me.clerkId)) {
      throw new Error("Forbidden: admin access required");
    }

    return await ctx.db.insert("token_rich_companies", {
      name: args.name,
      url: args.url,
      quote: args.quote,
      sourceLabel: args.sourceLabel,
      sourceUrl: args.sourceUrl,
      logoEmoji: args.logoEmoji ?? "🏢",
      order: args.order ?? 999,
      addedBy: me._id,
    });
  },
});

// ─── Admin: Update a company ────────────────────────────────────────
export const updateCompany = mutation({
  args: {
    companyId: v.id("token_rich_companies"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    quote: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    logoEmoji: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, ...updates }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const adminIds = (process.env.ADMIN_CLERK_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!adminIds.includes(me.clerkId)) {
      throw new Error("Forbidden: admin access required");
    }

    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.url !== undefined) patch.url = updates.url;
    if (updates.quote !== undefined) patch.quote = updates.quote;
    if (updates.sourceLabel !== undefined) patch.sourceLabel = updates.sourceLabel;
    if (updates.sourceUrl !== undefined) patch.sourceUrl = updates.sourceUrl;
    if (updates.logoEmoji !== undefined) patch.logoEmoji = updates.logoEmoji;
    if (updates.order !== undefined) patch.order = updates.order;

    await ctx.db.patch(companyId, patch);
  },
});

// ─── Admin: Delete a company ────────────────────────────────────────
export const deleteCompany = mutation({
  args: { companyId: v.id("token_rich_companies") },
  handler: async (ctx, { companyId }) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");

    const adminIds = (process.env.ADMIN_CLERK_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!adminIds.includes(me.clerkId)) {
      throw new Error("Forbidden: admin access required");
    }

    await ctx.db.delete(companyId);
  },
});

// ─── Seed initial companies (run from dashboard — no auth needed) ────
export const seedCompanies = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded — prevents duplicate runs
    const existing = await ctx.db.query("token_rich_companies").take(1);
    if (existing.length > 0) {
      return { seeded: 0, message: "Already seeded" };
    }

    const companies = [
      { name: "NVIDIA", url: "https://www.nvidia.com/", quote: "If our $500,000 engineer did not consume at least $250,000 worth of tokens, I am going to be deeply alarmed.", sourceLabel: "Business Insider", sourceUrl: "https://www.businessinsider.com/jensen-huang-500k-engineers-250k-ai-tokens-nvidia-compute-2026-3", logoEmoji: "🟢", order: 1 },
      { name: "Anthropic", url: "https://www.anthropic.com", quote: "Give engineers unlimited tokens... Some engineers at Anthropic spend hundreds of thousands of dollars a month on tokens.", sourceLabel: "Lenny's Podcast", sourceUrl: "https://www.youtube.com/watch?v=We7BZVKbCVw", logoEmoji: "🟠", order: 2 },
      { name: "OpenAI", url: "https://openai.com", quote: "Employees compete on internal leaderboards for max token use.", sourceLabel: "NYT", sourceUrl: "https://www.nytimes.com/2026/03/20/technology/tokenmaxxing-ai-agents.html", logoEmoji: "⬛", order: 3 },
      { name: "Meta", url: "https://about.meta.com", quote: "We literally have a leaderboard of who has cost the most in compute… there are folks north of $80k in spend.", sourceLabel: "Reddit", sourceUrl: "https://www.reddit.com/r/ClaudeAI/comments/1rnugkx/meta_w_unlimited_claude_tokens_and_youre/", logoEmoji: "🔵", order: 4 },
      { name: "Shopify", url: "https://www.shopify.com", quote: "Reflexive AI usage is a baseline expectation at Shopify.", sourceLabel: "First Round Review", sourceUrl: "https://www.firstround.com/ai/shopify", logoEmoji: "🟩", order: 5 },
      { name: "Vercel", url: "https://vercel.com", quote: "Rauch, the Vercel CEO, says his highest token spenders are also his top performers. He estimates $10,000 spend for a day's work saved millions.", sourceLabel: "WSJ", sourceUrl: "https://www.wsj.com/tech/ai/ai-tokens-productivity-d35c6bd8", logoEmoji: "▲", order: 6 },
      { name: "Notion", url: "https://www.notion.so", quote: "We encourage our engineers to burn as many tokens as possible.", sourceLabel: "LinkedIn (Reid Hoffman)", sourceUrl: "https://www.linkedin.com/posts/reidhoffman_notions-founder-ivan-zhao-says-you-shouldn-activity-7435367349748215808-68IS/", logoEmoji: "📝", order: 7 },
      { name: "Ramp", url: "https://ramp.com", quote: "Unlimited AI token usage.", sourceLabel: "Ramp Careers", sourceUrl: "https://ramp.com/careers", logoEmoji: "💳", order: 8 },
      { name: "Webflow", url: "https://webflow.com", quote: "At Webflow everyone gets unlimited tokens.", sourceLabel: "X @leinwand", sourceUrl: "https://x.com/leinwand/status/2033934967089336505", logoEmoji: "🌐", order: 9 },
      { name: "Resend", url: "https://resend.com", quote: "Every employee at Resend gets access to multiple AI tools. No credit caps, no approval process. Use as much as you want.", sourceLabel: "X @resend", sourceUrl: "https://x.com/resend/status/2027791164901101904", logoEmoji: "✉️", order: 10 },
      { name: "Browserbase", url: "https://www.browserbase.com", quote: "Every engineer gets any API key they want with no limits.", sourceLabel: "X @pk_iv", sourceUrl: "https://x.com/pk_iv/status/2009721729560789086", logoEmoji: "🌍", order: 11 },
      { name: "n8n", url: "https://n8n.io", quote: "Everyone gets an unlimited AI budget.", sourceLabel: "n8n Careers", sourceUrl: "https://n8n.io/careers/", logoEmoji: "⚡", order: 12 },
    ];

    let seeded = 0;
    for (const c of companies) {
      await ctx.db.insert("token_rich_companies", c);
      seeded++;
    }

    return { seeded };
  },
});
