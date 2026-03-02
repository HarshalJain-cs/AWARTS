import { serviceClient } from './supabase/service.js';

interface CreateNotificationParams {
  recipientId: string;
  senderId: string | null;
  type: 'kudos' | 'comment' | 'mention' | 'follow' | 'achievement';
  postId?: string | null;
  commentId?: string | null;
}

/**
 * Insert a notification into the notifications table.
 * Does not send email — email sending will be added in Phase 9.
 *
 * Silently skips if recipientId === senderId (don't notify yourself).
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { recipientId, senderId, type, postId, commentId } = params;

  // Don't notify yourself
  if (senderId && recipientId === senderId) return;

  const { error } = await serviceClient
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      sender_id: senderId,
      type,
      post_id: postId ?? null,
      comment_id: commentId ?? null,
    });

  if (error) {
    console.error('[notifications] Failed to create notification:', error.message);
  }
}
