export const CAPTION_PROMPT = `You are a social media writer for developers who use AI coding agents.
Given usage stats and optional screenshots, write a short, engaging post caption.

Rules:
- Title: max 80 chars, punchy, no generic phrases like "Exciting news!"
- Description: max 200 chars, conversational, highlight what was built or achieved
- Don't mention specific token counts in the description (they're shown as stats)
- Can include emojis but don't overuse them
- Respond ONLY with JSON: { "title": "...", "description": "..." }`;

export function parseJSONResponse(
  text: string
): { title: string; description: string } | null {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.title === 'string' &&
      typeof parsed.description === 'string'
    ) {
      return {
        title: parsed.title.slice(0, 280),
        description: parsed.description.slice(0, 2000),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function buildProviderChain(preferred: string): string[] {
  const all = ['claude', 'gemini', 'openai'];
  return [preferred, ...all.filter((p) => p !== preferred)];
}
