import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { PostUpdateSchema } from '../lib/validation/schemas.js';

const posts = new Hono();

// ─── GET /:id ──────────────────────────────────────────────────────────
// Single post with full data: user, daily_usage, kudos_count, comments_count, user_has_kudosed
posts.get('/:id', optionalAuth, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId') as string | undefined;

  // Fetch the post with user data
  const { data: post, error } = await serviceClient
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
      caption_generated_by,
      created_at,
      updated_at,
      users!inner (
        id,
        username,
        display_name,
        avatar_url,
        country
      )
    `)
    .eq('id', postId)
    .single();

  if (error || !post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  // If post is unpublished, only the owner can see it
  if (!post.is_published && post.user_id !== userId) {
    return c.json({ error: 'Post not found' }, 404);
  }

  // Fetch daily_usage via join table
  const { data: joinRows } = await serviceClient
    .from('post_daily_usage')
    .select(`
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
    .eq('post_id', postId);

  const dailyUsage = (joinRows ?? [])
    .map((r) => r.daily_usage)
    .filter(Boolean);

  // Kudos count
  const { count: kudosCount } = await serviceClient
    .from('kudos')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  // Comments count
  const { count: commentsCount } = await serviceClient
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  // Check if current user has kudosed
  let userHasKudosed = false;
  if (userId) {
    const { data: kudosRow } = await serviceClient
      .from('kudos')
      .select('user_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    userHasKudosed = !!kudosRow;
  }

  const user = Array.isArray(post.users) ? post.users[0] : post.users;

  return c.json({
    id: post.id,
    user_id: post.user_id,
    usage_date: post.usage_date,
    title: post.title,
    description: post.description,
    images: post.images,
    providers: post.providers,
    is_published: post.is_published,
    caption_generated_by: post.caption_generated_by,
    created_at: post.created_at,
    updated_at: post.updated_at,
    user: user
      ? {
          id: (user as any).id,
          username: (user as any).username,
          display_name: (user as any).display_name,
          avatar_url: (user as any).avatar_url,
          country: (user as any).country,
        }
      : null,
    daily_usage: dailyUsage,
    kudos_count: kudosCount ?? 0,
    comments_count: commentsCount ?? 0,
    user_has_kudosed: userHasKudosed,
  });
});

// ─── PATCH /:id ────────────────────────────────────────────────────────
// Update own post (title, description, images, is_published). Requires auth + ownership.
posts.patch('/:id', requireAuth, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId');

  // Verify ownership
  const { data: post, error: fetchErr } = await serviceClient
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single();

  if (fetchErr || !post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  if (post.user_id !== userId) {
    return c.json({ error: 'Forbidden: you do not own this post' }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = PostUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  const data = parsed.data;

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.images !== undefined) updates.images = data.images;
  if (data.is_published !== undefined) updates.is_published = data.is_published;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  updates.updated_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await serviceClient
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single();

  if (updateErr) {
    console.error('[posts] update error:', updateErr.message);
    return c.json({ error: 'Failed to update post' }, 500);
  }

  return c.json(updated);
});

// ─── DELETE /:id ───────────────────────────────────────────────────────
// Delete own post. Requires auth + ownership.
posts.delete('/:id', requireAuth, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId');

  // Verify ownership
  const { data: post, error: fetchErr } = await serviceClient
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single();

  if (fetchErr || !post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  if (post.user_id !== userId) {
    return c.json({ error: 'Forbidden: you do not own this post' }, 403);
  }

  const { error: deleteErr } = await serviceClient
    .from('posts')
    .delete()
    .eq('id', postId);

  if (deleteErr) {
    console.error('[posts] delete error:', deleteErr.message);
    return c.json({ error: 'Failed to delete post' }, 500);
  }

  return c.json({ success: true });
});

export default posts;
