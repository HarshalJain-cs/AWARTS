import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateCaption = action({
  args: {
    stats: v.object({
      totalCost: v.number(),
      totalTokens: v.number(),
      providers: v.array(v.string()),
      models: v.optional(v.array(v.string())),
      date: v.string(),
    }),
    preferredProvider: v.optional(v.string()),
  },
  handler: async (_ctx, { stats }) => {
    const apiKey = process.env.OPENAI_API_KEY;

    // If no API key, generate a template-based caption
    if (!apiKey) {
      return generateTemplateCation(stats);
    }

    const prompt = `Generate a short, fun social-media post caption for an AI developer's daily coding session. Stats:
- Date: ${stats.date}
- AI Providers used: ${stats.providers.join(", ")}
- Total cost: $${stats.totalCost.toFixed(2)}
- Total tokens: ${stats.totalTokens.toLocaleString()}
${stats.models?.length ? `- Models: ${stats.models.join(", ")}` : ""}

Return JSON: {"title": "short catchy title (max 60 chars)", "description": "2-3 sentence description"}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 200,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return generateTemplateCation(stats);
      }

      const data = await res.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      return {
        title: parsed.title as string,
        description: parsed.description as string,
        generated_by: "gpt-4o-mini",
      };
    } catch {
      return generateTemplateCation(stats);
    }
  },
});

function generateTemplateCation(stats: {
  totalCost: number;
  totalTokens: number;
  providers: string[];
  date: string;
}) {
  const cost = stats.totalCost;
  const tokens = stats.totalTokens;
  const providers = stats.providers;

  const titles = [
    cost > 5 ? "Heavy AI Day" : cost > 1 ? "Productive Session" : "Light Coding Day",
    providers.length > 1 ? `Multi-Model Mashup` : `${providers[0] ?? "AI"} Session`,
    tokens > 100000 ? "Token Marathon" : "Quick Sprint",
  ];

  const title = titles[Math.floor(Math.random() * titles.length)];

  const desc = `Spent $${cost.toFixed(2)} across ${tokens.toLocaleString()} tokens using ${providers.join(" & ")} on ${stats.date}.`;

  return {
    title,
    description: desc,
    generated_by: "template",
  };
}
