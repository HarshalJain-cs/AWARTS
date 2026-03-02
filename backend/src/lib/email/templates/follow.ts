import { getUnsubscribeUrl } from '../unsubscribe.js';

export function followEmailHtml(params: {
  recipientName: string;
  senderName: string;
  senderProfileUrl: string;
  recipientId: string;
}): string {
  const { recipientName, senderName, senderProfileUrl, recipientId } = params;
  const unsubscribeUrl = getUnsubscribeUrl(recipientId);

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #E87A35;">AWARTS</h2>
      <p>Hey ${recipientName},</p>
      <p><strong>${senderName}</strong> started following you!</p>
      <a href="${senderProfileUrl}" style="display: inline-block; padding: 10px 20px; background: #E87A35; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Profile</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888;"><a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a></p>
    </div>
  `;
}
