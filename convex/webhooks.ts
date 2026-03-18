import { v } from "convex/values";
import { action } from "./_generated/server";

// Send a webhook notification (Discord/Slack compatible)
export const sendWebhook = action({
  args: {
    webhookUrl: v.string(),
    event: v.string(),
    data: v.object({
      username: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      cost: v.optional(v.number()),
      tokens: v.optional(v.number()),
      providers: v.optional(v.array(v.string())),
      streak: v.optional(v.number()),
      url: v.optional(v.string()),
    }),
  },
  handler: async (_ctx, { webhookUrl, event, data }) => {
    // SSRF prevention: only allow HTTPS URLs to known webhook services
    if (!/^https:\/\//i.test(webhookUrl)) {
      console.error("Webhook rejected: non-HTTPS URL");
      return;
    }
    // Block internal/private IPs, metadata endpoints, and cloud provider metadata
    const blocked = /^https?:\/\/(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[::1\]|metadata\.google|100\.100\.100\.200)/i;
    if (blocked.test(webhookUrl)) {
      console.error("Webhook rejected: internal URL");
      return;
    }
    // Allowlist: only send to known webhook platforms
    const allowedHosts = [
      "discord.com",
      "discordapp.com",
      "hooks.slack.com",
      "hooks.zapier.com",
      "maker.ifttt.com",
    ];
    try {
      const parsed = new URL(webhookUrl);
      if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
        console.error("Webhook rejected: host not in allowlist");
        return;
      }
    } catch {
      console.error("Webhook rejected: invalid URL");
      return;
    }

    // Build Discord/Slack compatible embed
    const isDiscord = webhookUrl.includes("discord.com/api/webhooks");
    const isSlack = webhookUrl.includes("hooks.slack.com");

    const eventLabels: Record<string, string> = {
      session_sync: "Session Synced",
      achievement_unlocked: "Achievement Unlocked",
      streak_milestone: "Streak Milestone",
      kudos_received: "Kudos Received",
    };

    const eventLabel = eventLabels[event] ?? event;

    let body: any;

    if (isDiscord) {
      body = {
        embeds: [
          {
            title: `${eventLabel} — @${data.username}`,
            description: data.description ?? data.title ?? "",
            color: 0xe87a35, // AWARTS orange
            fields: [
              ...(data.cost != null
                ? [{ name: "Cost", value: `$${data.cost.toFixed(2)}`, inline: true }]
                : []),
              ...(data.tokens != null
                ? [{ name: "Tokens", value: data.tokens.toLocaleString(), inline: true }]
                : []),
              ...(data.streak != null
                ? [{ name: "Streak", value: `${data.streak} days`, inline: true }]
                : []),
              ...(data.providers?.length
                ? [{ name: "Providers", value: data.providers.join(", "), inline: true }]
                : []),
            ],
            footer: { text: "AWARTS — Strava for AI Coding" },
            url: data.url,
          },
        ],
      };
    } else if (isSlack) {
      const fields = [];
      if (data.cost != null) fields.push(`*Cost:* $${data.cost.toFixed(2)}`);
      if (data.tokens != null) fields.push(`*Tokens:* ${data.tokens.toLocaleString()}`);
      if (data.streak != null) fields.push(`*Streak:* ${data.streak} days`);
      if (data.providers?.length) fields.push(`*Providers:* ${data.providers.join(", ")}`);

      body = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${eventLabel}* — @${data.username}\n${data.description ?? data.title ?? ""}\n${fields.join(" | ")}`,
            },
          },
          {
            type: "context",
            elements: [{ type: "mrkdwn", text: "_AWARTS — Strava for AI Coding_" }],
          },
        ],
      };
    } else {
      // Generic webhook (JSON payload)
      body = {
        event,
        ...data,
        timestamp: new Date().toISOString(),
        source: "awarts",
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      // Webhook delivery failures are non-critical — mask URL in logs
      const masked = webhookUrl.replace(/(https:\/\/[^/]+\/)[^\s]*/i, "$1***");
      console.error("Webhook delivery failed for", masked);
    }
  },
});
