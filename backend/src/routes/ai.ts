import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { CaptionRequestSchema } from '../lib/validation/schemas.js';
import { generateWithClaude } from '../lib/ai/claude.js';
import { generateWithGemini } from '../lib/ai/gemini.js';
import { generateWithOpenAI } from '../lib/ai/openai.js';

const ai = new Hono();

type GeneratorFn = (
  context: Record<string, unknown>,
  imageUrls: string[]
) => Promise<{ title: string; description: string } | null>;

// Provider chain: try each AI provider in order until one succeeds
const PROVIDER_CHAIN: Array<{ name: string; generate: GeneratorFn }> = [
  { name: 'claude', generate: generateWithClaude },
  { name: 'gemini', generate: generateWithGemini },
  { name: 'openai', generate: generateWithOpenAI },
];

// ─── POST /generate-caption ────────────────────────────────────────────
ai.post('/generate-caption', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'ai/caption');
  if (rateLimited) return rateLimited;

  const body = await c.req.json().catch(() => null);
  const parsed = CaptionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { stats, imageUrls, preferredProvider } = parsed.data;

  // Build the context object that gets sent to the AI
  const context: Record<string, unknown> = {
    ...stats,
  };

  const images = imageUrls ?? [];

  // Reorder chain if preferred provider is specified
  let chain = [...PROVIDER_CHAIN];
  if (preferredProvider) {
    const preferred = chain.find((p) => p.name === preferredProvider);
    if (preferred) {
      chain = [preferred, ...chain.filter((p) => p.name !== preferredProvider)];
    }
  }

  // Try each provider in chain
  for (const { name, generate } of chain) {
    try {
      const result = await generate(context, images);
      if (result) {
        return c.json({
          title: result.title,
          description: result.description,
          generated_by: name,
        });
      }
    } catch (err) {
      console.error(`[ai] ${name} caption generation failed:`, err);
      continue;
    }
  }

  return c.json({ error: 'All AI providers failed to generate a caption' }, 503);
});

export default ai;
