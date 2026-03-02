import { serviceClient } from './supabase/service.js';
import { createNotification } from './notifications.js';

// Matches @username patterns — GitHub-style usernames (alphanumeric, hyphens, underscores)
const MENTION_RE = /@([a-zA-Z0-9_-]{1,39})\b/g;

/**
 * Extract all unique @mentions from text.
 */
export function extractMentions(text: string): string[] {
  const matches = text.matchAll(MENTION_RE);
  const usernames = new Set<string>();
  for (const match of matches) {
    usernames.add(match[1].toLowerCase());
  }
  return Array.from(usernames);
}

/**
 * Resolve mentioned usernames to user IDs and create mention notifications.
 *
 * @param text - The comment text to scan for @mentions
 * @param senderId - The user who wrote the comment
 * @param postId - The post the comment belongs to
 * @param commentId - The comment ID
 */
export async function sendMentionNotifications(
  text: string,
  senderId: string,
  postId: string,
  commentId: string
): Promise<void> {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;

  // Resolve usernames to user IDs
  const { data: users, error } = await serviceClient
    .from('users')
    .select('id, username')
    .in('username', usernames);

  if (error || !users || users.length === 0) return;

  // Create a notification for each mentioned user (excluding the sender)
  const notificationPromises = users
    .filter((u) => u.id !== senderId)
    .map((u) =>
      createNotification({
        recipientId: u.id,
        senderId,
        type: 'mention',
        postId,
        commentId,
      })
    );

  await Promise.allSettled(notificationPromises);
}
