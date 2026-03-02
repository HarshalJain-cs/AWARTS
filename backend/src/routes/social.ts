import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { requireAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { createNotification } from '../lib/notifications.js';
import { sendMentionNotifications } from '../lib/mentions.js';
import { FollowSchema, KudosSchema, CommentSchema, DeleteCommentSchema } from '../lib/validation/schemas.js';
import { stripHtml } from '../lib/validation/sanitize.js';

const social = new Hono();

// ─── POST /follow ──────────────────────────────────────────────────────
social.post('/follow', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'social/follow');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = FollowSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { targetUserId } = parsed.data;

  if (targetUserId === userId) {
    return c.json({ error: 'Cannot follow yourself' }, 400);
  }

  // Check that target user exists
  const { data: target } = await serviceClient
    .from('users')
    .select('id')
    .eq('id', targetUserId)
    .single();

  if (!target) {
    return c.json({ error: 'User not found' }, 404);
  }

  const { error } = await serviceClient
    .from('follows')
    .insert({
      follower_id: userId,
      following_id: targetUserId,
    });

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Already following this user' }, 409);
    }
    console.error('[social] follow error:', error.message);
    return c.json({ error: 'Failed to follow user' }, 500);
  }

  // Create notification async
  createNotification({
    recipientId: targetUserId,
    senderId: userId,
    type: 'follow',
  }).catch((err) => console.error('[social] follow notification error:', err));

  return c.json({ success: true });
});

// ─── DELETE /follow ────────────────────────────────────────────────────
social.delete('/follow', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'social/follow');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = FollowSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { targetUserId } = parsed.data;

  const { error, count } = await serviceClient
    .from('follows')
    .delete({ count: 'exact' })
    .eq('follower_id', userId)
    .eq('following_id', targetUserId);

  if (error) {
    console.error('[social] unfollow error:', error.message);
    return c.json({ error: 'Failed to unfollow user' }, 500);
  }

  if (count === 0) {
    return c.json({ error: 'Not following this user' }, 404);
  }

  return c.json({ success: true });
});

// ─── POST /kudos ───────────────────────────────────────────────────────
social.post('/kudos', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'social/kudos');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = KudosSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { postId } = parsed.data;

  // Verify post exists and get owner
  const { data: post } = await serviceClient
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single();

  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  const { error } = await serviceClient
    .from('kudos')
    .insert({
      user_id: userId,
      post_id: postId,
    });

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'Already gave kudos to this post' }, 409);
    }
    console.error('[social] kudos error:', error.message);
    return c.json({ error: 'Failed to give kudos' }, 500);
  }

  // Create notification if not own post
  if (post.user_id !== userId) {
    createNotification({
      recipientId: post.user_id,
      senderId: userId,
      type: 'kudos',
      postId,
    }).catch((err) => console.error('[social] kudos notification error:', err));
  }

  return c.json({ success: true });
});

// ─── DELETE /kudos ─────────────────────────────────────────────────────
social.delete('/kudos', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'social/kudos');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = KudosSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { postId } = parsed.data;

  const { error, count } = await serviceClient
    .from('kudos')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) {
    console.error('[social] remove kudos error:', error.message);
    return c.json({ error: 'Failed to remove kudos' }, 500);
  }

  if (count === 0) {
    return c.json({ error: 'Kudos not found' }, 404);
  }

  return c.json({ success: true });
});

// ─── POST /comments ────────────────────────────────────────────────────
social.post('/comments', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'social/comments');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { postId, content: rawContent } = parsed.data;
  const content = stripHtml(rawContent);

  if (content.length === 0) {
    return c.json({ error: 'Comment cannot be empty after sanitization' }, 400);
  }

  // Verify post exists and get owner
  const { data: post } = await serviceClient
    .from('posts')
    .select('id, user_id')
    .eq('id', postId)
    .single();

  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  const { data: comment, error } = await serviceClient
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select('id, post_id, user_id, content, created_at')
    .single();

  if (error || !comment) {
    console.error('[social] comment insert error:', error?.message);
    return c.json({ error: 'Failed to create comment' }, 500);
  }

  // Create notification for post owner if not own post
  if (post.user_id !== userId) {
    createNotification({
      recipientId: post.user_id,
      senderId: userId,
      type: 'comment',
      postId,
      commentId: comment.id,
    }).catch((err) => console.error('[social] comment notification error:', err));
  }

  // Process @mentions asynchronously
  sendMentionNotifications(content, userId, postId, comment.id).catch((err) =>
    console.error('[social] mention notification error:', err)
  );

  return c.json(comment, 201);
});

// ─── GET /comments ─────────────────────────────────────────────────────
social.get('/comments', async (c) => {
  const postId = c.req.query('postId');
  if (!postId) {
    return c.json({ error: 'postId query parameter is required' }, 400);
  }

  const cursor = c.req.query('cursor');
  const limitParam = parseInt(c.req.query('limit') ?? '50', 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);

  let query = serviceClient
    .from('comments')
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit + 1);

  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data: comments, error } = await query;

  if (error) {
    console.error('[social] fetch comments error:', error.message);
    return c.json({ error: 'Failed to fetch comments' }, 500);
  }

  const hasMore = (comments?.length ?? 0) > limit;
  const commentsPage = hasMore ? comments!.slice(0, limit) : (comments ?? []);
  const nextCursor = hasMore
    ? commentsPage[commentsPage.length - 1].created_at
    : null;

  const result = commentsPage.map((cm) => {
    const user = Array.isArray(cm.users) ? cm.users[0] : cm.users;
    return {
      id: cm.id,
      post_id: cm.post_id,
      user_id: cm.user_id,
      content: cm.content,
      created_at: cm.created_at,
      user: user
        ? {
            id: (user as any).id,
            username: (user as any).username,
            avatar_url: (user as any).avatar_url,
          }
        : null,
    };
  });

  return c.json({ comments: result, nextCursor });
});

// ─── DELETE /comments ──────────────────────────────────────────────────
social.delete('/comments', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'social/comments');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = DeleteCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { commentId } = parsed.data;

  // Verify ownership
  const { data: comment } = await serviceClient
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .single();

  if (!comment) {
    return c.json({ error: 'Comment not found' }, 404);
  }

  if (comment.user_id !== userId) {
    return c.json({ error: 'Forbidden: you do not own this comment' }, 403);
  }

  const { error } = await serviceClient
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('[social] delete comment error:', error.message);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }

  return c.json({ success: true });
});

// ─── GET /notifications ────────────────────────────────────────────────
social.get('/notifications', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'notifications');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');
  const cursor = c.req.query('cursor');
  const limitParam = parseInt(c.req.query('limit') ?? '30', 10);
  const limit = Math.min(Math.max(limitParam, 1), 50);

  let query = serviceClient
    .from('notifications')
    .select(`
      id,
      type,
      is_read,
      created_at,
      post_id,
      sender:users!notifications_sender_id_fkey (
        id,
        username,
        avatar_url
      ),
      post:posts!notifications_post_id_fkey (
        id,
        title,
        usage_date
      )
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error('[social] fetch notifications error:', error.message);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }

  const hasMore = (notifications?.length ?? 0) > limit;
  const notifPage = hasMore
    ? notifications!.slice(0, limit)
    : (notifications ?? []);
  const nextCursor = hasMore
    ? notifPage[notifPage.length - 1].created_at
    : null;

  // Count unread
  const { count: unreadCount } = await serviceClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  const result = notifPage.map((n) => {
    const sender = Array.isArray(n.sender) ? n.sender[0] : n.sender;
    const post = Array.isArray(n.post) ? n.post[0] : n.post;
    return {
      id: n.id,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
      sender: sender
        ? {
            id: (sender as any).id,
            username: (sender as any).username,
            avatar_url: (sender as any).avatar_url,
          }
        : null,
      post: post
        ? {
            id: (post as any).id,
            title: (post as any).title,
            usage_date: (post as any).usage_date,
          }
        : null,
    };
  });

  return c.json({
    notifications: result,
    nextCursor,
    unread_count: unreadCount ?? 0,
  });
});

// ─── PATCH /notifications ──────────────────────────────────────────────
// Mark all notifications as read for the current user.
social.patch('/notifications', requireAuth, async (c) => {
  const userId = c.get('userId');

  const { error } = await serviceClient
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('[social] mark notifications read error:', error.message);
    return c.json({ error: 'Failed to mark notifications as read' }, 500);
  }

  return c.json({ success: true });
});

export default social;
