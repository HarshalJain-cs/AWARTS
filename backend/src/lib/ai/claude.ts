import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../env.js';
import { CAPTION_PROMPT, parseJSONResponse } from './shared.js';

export async function generateWithClaude(
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  if (!env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

  // Add images if provided
  for (const url of imageUrls.slice(0, 3)) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mediaType = (response.headers.get('content-type') ??
        'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64,
        },
      });
    } catch {
      // Skip failed image
    }
  }

  content.push({
    type: 'text',
    text: `Generate a caption for this AI coding session.\n\nStats:\n${JSON.stringify(context, null, 2)}`,
  });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 300,
    system: CAPTION_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const text =
    message.content[0].type === 'text' ? message.content[0].text : '';
  return parseJSONResponse(text);
}
