import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { sanitizeSearchQuery } from '../lib/validation/sanitize.js';

const search = new Hono();

// ─── GET / ─────────────────────────────────────────────────────────────
// Query params: q (search term), limit
search.get('/', async (c) => {
  const rateLimited = checkRateLimit(c, 'search');
  if (rateLimited) return rateLimited;

  const rawQuery = c.req.query('q');
  if (!rawQuery || rawQuery.trim().length === 0) {
    return c.json({ error: 'Search query is required' }, 400);
  }

  const q = sanitizeSearchQuery(rawQuery);
  const limitParam = parseInt(c.req.query('limit') ?? '20', 10);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  // Search by username or display_name using ilike
  const { data: users, error } = await serviceClient
    .from('users')
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      bio,
      country,
      is_public
    `)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .eq('is_public', true)
    .order('username', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[search] query error:', error.message);
    return c.json({ error: 'Search failed' }, 500);
  }

  return c.json({
    users: users ?? [],
    query: rawQuery.trim(),
  });
});

export default search;
