import { getUnsubscribeUrl } from '../unsubscribe.js';

export function commentEmailHtml(params: {
  recipientName: string;
  senderName: string;
  commentText: string;
  postTitle: string | null;
  postUrl: string;
  recipientId: string;
}): string {
  const { recipientName, senderName, commentText, postTitle, postUrl, recipientId } = params;
  const unsubscribeUrl = getUnsubscribeUrl(recipientId);

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #E87A35;">AWARTS</h2>
      <p>Hey ${recipientName},</p>
      <p><strong>${senderName}</strong> commented on your post${postTitle ? ` "${postTitle}"` : ''}:</p>
      <blockquote style="border-left: 3px solid #E87A35; padding-left: 12px; margin: 16px 0; color: #555;">${commentText}</blockquote>
      <a href="${postUrl}" style="display: inline-block; padding: 10px 20px; background: #E87A35; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Comment</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888;"><a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a></p>
    </div>
  `;
}
