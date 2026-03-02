import { createHmac } from 'crypto';
import { env } from '../../env.js';

export function generateUnsubscribeToken(userId: string): string {
  if (!env.EMAIL_UNSUBSCRIBE_SECRET) return '';
  const hmac = createHmac('sha256', env.EMAIL_UNSUBSCRIBE_SECRET);
  hmac.update(userId);
  return hmac.digest('hex');
}

export function verifyUnsubscribeToken(
  userId: string,
  token: string
): boolean {
  const expected = generateUnsubscribeToken(userId);
  if (!expected) return false;
  return token === expected;
}

export function getUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${env.APP_URL}/api/email/unsubscribe?userId=${userId}&token=${token}`;
}
