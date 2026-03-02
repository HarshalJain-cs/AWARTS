import OpenAI from 'openai';
import { env } from '../../env.js';
import { CAPTION_PROMPT, parseJSONResponse } from './shared.js';

export async function generateWithOpenAI(
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  if (!env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: CAPTION_PROMPT },
    {
      role: 'user',
      content: [
        ...imageUrls.slice(0, 3).map(
          (url) =>
            ({
              type: 'image_url' as const,
              image_url: { url },
            })
        ),
        {
          type: 'text' as const,
          text: `Generate a caption for this AI coding session.\n\nStats:\n${JSON.stringify(context)}`,
        },
      ],
    },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  return parseJSONResponse(response.choices[0].message.content ?? '');
}
