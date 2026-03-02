import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { ProfileUpdateSchema } from '../lib/validation/schemas.js';
import { validateUsername } from '../lib/validation/sanitize.js';

const users = new Hono();

// ─── GET /:username ────────────────────────────────────────────────────
// Public profile with stats, achievements, and contribution graph.
users.get('/:username', optionalAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'users/profile');
  if (rateLimited) return rateLimited;

  const username = c.req.param('username');
  const currentUserId = c.get('userId') as string | undefined;

  // Fetch user profile
  const { data: user, error } = await serviceClient
    .from('users')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      country,
      region,
      timezone,
      is_public,
      default_ai_provider,
      created_at
    `)
    .eq('username', username)
    .single();

  if (error || !user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // If profile is private, only the owner can see full data
  const isOwner = currentUserId === user.id;
  if (!user.is_public && !isOwner) {
    return c.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_public: false,
    });
  }

  // Fetch aggregate stats
  const { data: statsRows } = await serviceClient
    .from('daily_usage')
    .select('cost_usd, provider, date')
    .eq('user_id', user.id);

  const stats = {
    total_cost_usd: 0,
    total_days: 0,
    providers_used: new Set<string>(),
    provider_breakdown: {} as Record<string, number>,
  };

  const uniqueDates = new Set<string>();

  for (const row of statsRows ?? []) {
    const cost = Number(row.cost_usd);
    stats.total_cost_usd += cost;
    stats.providers_used.add(row.provider);
    uniqueDates.add(row.date);
    stats.provider_breakdown[row.provider] =
      (stats.provider_breakdown[row.provider] ?? 0) + cost;
  }
  stats.total_days = uniqueDates.size;

  // Streak (use stored procedure)
  const { data: streakResult } = await serviceClient.rpc('calculate_user_streak', {
    p_user_id: user.id,
  });
  const currentStreak = streakResult ?? 0;

  // Followers / following counts
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    serviceClient
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    serviceClient
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id),
  ]);

  // Is current user following this profile?
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const { data: followRow } = await serviceClient
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', user.id)
      .maybeSingle();
    isFollowing = !!followRow;
  }

  // Achievements
  const { data: achievements } = await serviceClient
    .from('user_achievements')
    .select('slug, awarded_at')
    .eq('user_id', user.id)
    .order('awarded_at', { ascending: false });

  // Contribution graph (last 365 days)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const { data: contributions } = await serviceClient
    .from('daily_usage')
    .select('date, cost_usd')
    .eq('user_id', user.id)
    .gte('date', oneYearAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Build heatmap data: { date: totalCost }
  const heatmap: Record<string, number> = {};
  for (const row of contributions ?? []) {
    heatmap[row.date] = (heatmap[row.date] ?? 0) + Number(row.cost_usd);
  }

  return c.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    country: user.country,
    region: user.region,
    timezone: user.timezone,
    is_public: user.is_public,
    default_ai_provider: user.default_ai_provider,
    created_at: user.created_at,
    stats: {
      total_cost_usd: stats.total_cost_usd,
      total_days: stats.total_days,
      current_streak: currentStreak,
      providers_used: Array.from(stats.providers_used),
      provider_breakdown: stats.provider_breakdown,
    },
    followers_count: followersCount ?? 0,
    following_count: followingCount ?? 0,
    is_following: isFollowing,
    achievements: achievements ?? [],
    heatmap,
  });
});

// ─── PATCH /me ─────────────────────────────────────────────────────────
// Update own profile. Requires auth.
users.patch('/me', requireAuth, async (c) => {
  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const updates: Record<string, unknown> = {};
  const data = parsed.data;

  if (data.display_name !== undefined) updates.display_name = data.display_name;
  if (data.bio !== undefined) updates.bio = data.bio;
  if (data.country !== undefined) updates.country = data.country;
  if (data.timezone !== undefined) updates.timezone = data.timezone;
  if (data.is_public !== undefined) updates.is_public = data.is_public;
  if (data.default_ai_provider !== undefined) updates.default_ai_provider = data.default_ai_provider;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  const { data: updated, error } = await serviceClient
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[users] update error:', error.message);
    return c.json({ error: 'Failed to update profile' }, 500);
  }

  return c.json(updated);
});

// ─── GET /me ───────────────────────────────────────────────────────────
// Get current user's profile. Requires auth.
users.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');

  const { data: user, error } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

export default users;
