import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { verifyUnsubscribeToken } from '../lib/email/unsubscribe.js';
import { env } from '../env.js';

const email = new Hono();

// ─── GET /unsubscribe ──────────────────────────────────────────────────
// One-click email unsubscribe via HMAC token.
email.get('/unsubscribe', async (c) => {
  const userId = c.req.query('uid');
  const token = c.req.query('token');
  const type = c.req.query('type'); // 'all' | 'kudos' | 'comments' | 'follows' | 'mentions'

  if (!userId || !token) {
    return c.json({ error: 'Missing uid or token parameter' }, 400);
  }

  if (!verifyUnsubscribeToken(userId, token)) {
    return c.json({ error: 'Invalid or expired unsubscribe link' }, 403);
  }

  // Update user's email preferences
  const updateField = type === 'all' ? 'email_notifications_enabled' : `email_${type}_enabled`;

  // For simplicity, we'll toggle the main email_notifications_enabled flag
  // A more granular approach would use a JSONB preferences column
  const { error } = await serviceClient
    .from('users')
    .update({ email_notifications_enabled: false })
    .eq('id', userId);

  if (error) {
    console.error('[email] unsubscribe error:', error.message);
    return c.json({ error: 'Failed to unsubscribe' }, 500);
  }

  // Return a simple HTML page confirming unsubscribe
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>Unsubscribed - AWARTS</title></head>
    <body style="font-family: system-ui; max-width: 500px; margin: 100px auto; text-align: center;">
      <h1>Unsubscribed</h1>
      <p>You've been unsubscribed from AWARTS email notifications.</p>
      <p>You can re-enable notifications in your <a href="${env.APP_URL}/settings">settings</a>.</p>
    </body>
    </html>
  `);
});

export default email;
