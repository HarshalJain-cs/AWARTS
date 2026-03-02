import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { optionalAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';

const feed = new Hono();

// ─── GET / ─────────────────────────────────────────────────────────────
// Paginated feed with cursor-based pagination.
// Query params: type (following|global), cursor, limit, provider
feed.get('/', optionalAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'feed');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId') as string | undefined;
  const feedType = c.req.query('type') ?? 'global';
  const cursor = c.req.query('cursor');
  const limitParam = parseInt(c.req.query('limit') ?? '20', 10);
  const provider = c.req.query('provider');

  const limit = Math.min(Math.max(limitParam, 1), 50);

  // Build the query
  let query = serviceClient
    .from('posts')
    .select(`
      id,
      user_id,
      usage_date,
      title,
      description,
      images,
      providers,
      is_published,
      created_at,
      users!inner (
        id,
        username,
        avatar_url,
        country
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to detect next page

  // Cursor-based pagination: cursor is the created_at of the last item
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Provider filter
  if (provider) {
    query = query.contains('providers', [provider]);
  }

  // Following feed: only posts from users the current user follows
  if (feedType === 'following' && userId) {
    const { data: followingRows } = await serviceClient
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = followingRows?.map((f) => f.following_id) ?? [];

    // Include own posts in the following feed
    followingIds.push(userId);

    if (followingIds.length === 0) {
      return c.json({ posts: [], nextCursor: null });
    }

    query = query.in('user_id', followingIds);
  }

  // Following feed requires auth
  if (feedType === 'following' && !userId) {
    return c.json({ error: 'Authentication required for following feed' }, 401);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error('[feed] query error:', error.message);
    return c.json({ error: 'Failed to fetch feed' }, 500);
  }

  if (!posts || posts.length === 0) {
    return c.json({ posts: [], nextCursor: null });
  }

  // Determine pagination
  const hasMore = posts.length > limit;
  const postsPage = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore
    ? postsPage[postsPage.length - 1].created_at
    : null;

  // Collect post IDs for batch lookups
  const postIds = postsPage.map((p) => p.id);

  // Batch fetch daily_usage via post_daily_usage join
  const { data: joinRows } = await serviceClient
    .from('post_daily_usage')
    .select(`
      post_id,
      daily_usage (
        id,
        provider,
        cost_usd,
        input_tokens,
        output_tokens,
        cache_creation_tokens,
        cache_read_tokens,
        total_tokens,
        models,
        source,
        is_verified,
        date
      )
    `)
    .in('post_id', postIds);

  // Group usage by post_id
  const usageByPost = new Map<string, any[]>();
  for (const row of joinRows ?? []) {
    const existing = usageByPost.get(row.post_id) ?? [];
    if (row.daily_usage) {
      existing.push(row.daily_usage);
    }
    usageByPost.set(row.post_id, existing);
  }

  // Batch fetch kudos counts
  const { data: kudosCounts } = await serviceClient
    .from('kudos')
    .select('post_id')
    .in('post_id', postIds);

  const kudosCountMap = new Map<string, number>();
  for (const k of kudosCounts ?? []) {
    kudosCountMap.set(k.post_id, (kudosCountMap.get(k.post_id) ?? 0) + 1);
  }

  // Batch fetch comment counts
  const { data: commentCounts } = await serviceClient
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);

  const commentCountMap = new Map<string, number>();
  for (const cm of commentCounts ?? []) {
    commentCountMap.set(cm.post_id, (commentCountMap.get(cm.post_id) ?? 0) + 1);
  }

  // Check if current user has kudosed each post
  let userKudosSet = new Set<string>();
  if (userId) {
    const { data: userKudos } = await serviceClient
      .from('kudos')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    userKudosSet = new Set((userKudos ?? []).map((k) => k.post_id));
  }

  // Assemble response
  const feedPosts = postsPage.map((post) => {
    const user = Array.isArray(post.users) ? post.users[0] : post.users;
    return {
      id: post.id,
      user_id: post.user_id,
      usage_date: post.usage_date,
      title: post.title,
      description: post.description,
      images: post.images,
      providers: post.providers,
      created_at: post.created_at,
      user: user
        ? {
            id: (user as any).id,
            username: (user as any).username,
            avatar_url: (user as any).avatar_url,
            country: (user as any).country,
          }
        : { id: post.user_id, username: 'unknown', avatar_url: null, country: null },
      daily_usage: usageByPost.get(post.id) ?? [],
      kudos_count: kudosCountMap.get(post.id) ?? 0,
      comment_count: commentCountMap.get(post.id) ?? 0,
      user_has_kudosed: userKudosSet.has(post.id),
    };
  });

  return c.json({
    posts: feedPosts,
    nextCursor,
  });
});

export default feed;
