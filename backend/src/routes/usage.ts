import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { requireAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { SubmitRequestSchema } from '../lib/validation/schemas.js';
import { createOrUpdatePost } from '../lib/posts.js';
import type { UsageSubmitResponse } from '../types/api.js';

const usage = new Hono();

// ─── POST /submit ──────────────────────────────────────────────────────
// The most critical endpoint. Accepts usage data from CLI or web,
// upserts daily_usage rows, creates/updates posts, fires achievement engine.
usage.post('/submit', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'usage/submit');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');
  const authType = c.get('authType');

  const body = await c.req.json().catch(() => null);
  const parsed = SubmitRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400
    );
  }

  const { entries, source, hash } = parsed.data;

  // CLI auth can only submit with source: 'cli', browser with source: 'web'
  const effectiveSource = authType === 'cli' ? 'cli' : source;

  const errors: Array<{ date: string; provider: string; error: string }> = [];
  let processed = 0;
  const affectedDates = new Set<string>();

  for (const entry of entries) {
    const totalTokens =
      entry.input_tokens +
      entry.output_tokens +
      (entry.cache_creation_tokens ?? 0) +
      (entry.cache_read_tokens ?? 0);

    // Upsert: unique on (user_id, date, provider)
    const { error: upsertErr } = await serviceClient
      .from('daily_usage')
      .upsert(
        {
          user_id: userId,
          date: entry.date,
          provider: entry.provider,
          cost_usd: entry.cost_usd,
          input_tokens: entry.input_tokens,
          output_tokens: entry.output_tokens,
          cache_creation_tokens: entry.cache_creation_tokens ?? 0,
          cache_read_tokens: entry.cache_read_tokens ?? 0,
          models: entry.models,
          source: effectiveSource,
          data_hash: hash ?? null,
          raw_data: entry.raw_data ?? null,
        },
        { onConflict: 'user_id,date,provider' }
      );

    if (upsertErr) {
      console.error('[usage] upsert error:', upsertErr.message);
      errors.push({
        date: entry.date,
        provider: entry.provider,
        error: upsertErr.message,
      });
      continue;
    }

    processed++;
    affectedDates.add(entry.date);
  }

  // Create or update posts for each affected date
  let postsCreated = 0;
  for (const date of affectedDates) {
    const created = await createOrUpdatePost(userId, date, serviceClient);
    postsCreated += created;
  }

  // Fire achievement engine asynchronously (non-blocking)
  checkAchievements(userId).catch((err) =>
    console.error('[usage] achievement check failed:', err)
  );

  const response: UsageSubmitResponse = {
    success: errors.length === 0,
    processed,
    posts_created: postsCreated,
    ...(errors.length > 0 && { errors }),
  };

  return c.json(response, errors.length > 0 ? 207 : 200);
});

/**
 * Async achievement check after usage submission.
 * Checks for common milestones and awards badges.
 */
async function checkAchievements(userId: string): Promise<void> {
  // Fetch aggregate stats for the user
  const { data: stats } = await serviceClient
    .from('daily_usage')
    .select('date, cost_usd, provider')
    .eq('user_id', userId);

  if (!stats || stats.length === 0) return;

  const totalCost = stats.reduce((sum, r) => sum + Number(r.cost_usd), 0);
  const uniqueDates = new Set(stats.map((r) => r.date));
  const uniqueProviders = new Set(stats.map((r) => r.provider));
  const dayCount = uniqueDates.size;

  // Define achievement thresholds
  const checks: Array<{ slug: string; condition: boolean }> = [
    { slug: 'first-submit', condition: dayCount >= 1 },
    { slug: 'week-warrior', condition: dayCount >= 7 },
    { slug: 'month-master', condition: dayCount >= 30 },
    { slug: 'hundred-days', condition: dayCount >= 100 },
    { slug: 'big-spender-10', condition: totalCost >= 10 },
    { slug: 'big-spender-100', condition: totalCost >= 100 },
    { slug: 'big-spender-1000', condition: totalCost >= 1000 },
    { slug: 'multi-provider', condition: uniqueProviders.size >= 2 },
    { slug: 'all-providers', condition: uniqueProviders.size >= 4 },
  ];

  for (const { slug, condition } of checks) {
    if (condition) {
      await serviceClient.rpc('award_achievement', {
        p_user_id: userId,
        p_slug: slug,
      });
    }
  }
}

export default usage;
