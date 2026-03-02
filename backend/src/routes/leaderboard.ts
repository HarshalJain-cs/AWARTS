import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { checkRateLimit } from '../middleware/rate-limit.js';

const leaderboard = new Hono();

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

const VIEW_MAP: Record<Period, string> = {
  daily: 'leaderboard_daily',
  weekly: 'leaderboard_weekly',
  monthly: 'leaderboard_monthly',
  all_time: 'leaderboard_all_time',
};

// ─── GET / ─────────────────────────────────────────────────────────────
// Query params: period (daily|weekly|monthly|all_time), provider, region, limit, offset
leaderboard.get('/', async (c) => {
  const rateLimited = checkRateLimit(c, 'leaderboard');
  if (rateLimited) return rateLimited;

  const period = (c.req.query('period') ?? 'weekly') as Period;
  const provider = c.req.query('provider');
  const region = c.req.query('region');
  const limitParam = parseInt(c.req.query('limit') ?? '50', 10);
  const offsetParam = parseInt(c.req.query('offset') ?? '0', 10);

  const limit = Math.min(Math.max(limitParam, 1), 100);
  const offset = Math.max(offsetParam, 0);

  const viewName = VIEW_MAP[period];
  if (!viewName) {
    return c.json({ error: 'Invalid period. Use: daily, weekly, monthly, all_time' }, 400);
  }

  let query = serviceClient
    .from(viewName)
    .select('*')
    .order('total_cost_usd', { ascending: false })
    .range(offset, offset + limit - 1);

  // Provider filter: the view includes provider-specific columns
  // For provider filtering, we use the daily_usage table directly
  if (provider) {
    // Use a custom query when filtering by provider
    const { data, error } = await serviceClient.rpc('get_leaderboard', {
      p_period: period,
      p_provider: provider,
      p_region: region ?? null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('[leaderboard] rpc error:', error.message);
      return c.json({ error: 'Failed to fetch leaderboard' }, 500);
    }

    return c.json({
      entries: data ?? [],
      period,
      provider,
      region: region ?? null,
    });
  }

  // Region filter via user's region
  if (region) {
    query = query.eq('region', region);
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error('[leaderboard] query error:', error.message);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }

  return c.json({
    entries: entries ?? [],
    period,
    provider: null,
    region: region ?? null,
  });
});

export default leaderboard;
