import { getUnsubscribeUrl } from '../unsubscribe.js';

export function achievementEmailHtml(params: {
  recipientName: string;
  achievementName: string;
  achievementEmoji: string;
  achievementDescription: string;
  profileUrl: string;
  recipientId: string;
}): string {
  const { recipientName, achievementName, achievementEmoji, achievementDescription, profileUrl, recipientId } = params;
  const unsubscribeUrl = getUnsubscribeUrl(recipientId);

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #E87A35;">AWARTS</h2>
      <p>Hey ${recipientName},</p>
      <div style="text-align: center; padding: 24px; background: #f9f9f9; border-radius: 12px; margin: 16px 0;">
        <div style="font-size: 48px;">${achievementEmoji}</div>
        <h3 style="margin: 8px 0 4px;">Achievement Unlocked!</h3>
        <p style="font-weight: bold; margin: 0;">${achievementName}</p>
        <p style="color: #666; margin: 4px 0 0; font-size: 14px;">${achievementDescription}</p>
      </div>
      <a href="${profileUrl}" style="display: inline-block; padding: 10px 20px; background: #E87A35; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Your Profile</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #888;"><a href="${unsubscribeUrl}" style="color: #888;">Unsubscribe</a></p>
    </div>
  `;
}
