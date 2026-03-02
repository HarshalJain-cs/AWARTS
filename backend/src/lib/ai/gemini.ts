import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../env.js';
import { CAPTION_PROMPT, parseJSONResponse } from './shared.js';

export async function generateWithGemini(
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  if (!env.GOOGLE_AI_API_KEY) return null;

  const client = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  const model = client.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: `${CAPTION_PROMPT}\n\nStats: ${JSON.stringify(context)}` }];

  for (const url of imageUrls.slice(0, 3)) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      parts.push({
        inlineData: {
          mimeType: response.headers.get('content-type') ?? 'image/jpeg',
          data: Buffer.from(buffer).toString('base64'),
        },
      });
    } catch {
      /* skip */
    }
  }

  const result = await model.generateContent(parts);
  return parseJSONResponse(result.response.text());
}
