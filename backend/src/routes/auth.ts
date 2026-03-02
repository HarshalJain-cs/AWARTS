import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { serviceClient } from '../lib/supabase/service.js';
import { anonClient } from '../lib/supabase/client.js';
import { signCLIToken } from '../lib/auth/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { env } from '../env.js';
import { CLIVerifySchema } from '../lib/validation/schemas.js';

const auth = new Hono();

// ─── POST /cli/init ────────────────────────────────────────────────────
// Creates a device auth code. Called by the CLI to start the auth flow.
auth.post('/cli/init', async (c) => {
  const rateLimited = checkRateLimit(c, 'auth/cli/poll');
  if (rateLimited) return rateLimited;

  // Generate a short human-readable code and a longer device token
  const code = nanoid(8).toUpperCase();
  const deviceToken = nanoid(32);

  // Code expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await serviceClient
    .from('cli_auth_codes')
    .insert({
      code,
      device_token: deviceToken,
      status: 'pending',
      user_id: null,
      jwt_token: null,
      expires_at: expiresAt,
    });

  if (error) {
    console.error('[auth] cli/init insert error:', error.message);
    return c.json({ error: 'Failed to create auth code' }, 500);
  }

  const verifyUrl = `${env.APP_URL}/cli/verify?code=${code}`;

  return c.json({
    code,
    device_token: deviceToken,
    verify_url: verifyUrl,
    expires_in: 600,
  });
});

// ─── POST /cli/poll ────────────────────────────────────────────────────
// CLI polls this endpoint with its device_token to check if auth has completed.
auth.post('/cli/poll', async (c) => {
  const rateLimited = checkRateLimit(c, 'auth/cli/poll');
  if (rateLimited) return rateLimited;

  const body = await c.req.json<{ device_token: string }>().catch(() => null);
  if (!body?.device_token) {
    return c.json({ error: 'device_token is required' }, 400);
  }

  const { data: row, error } = await serviceClient
    .from('cli_auth_codes')
    .select('*')
    .eq('device_token', body.device_token)
    .single();

  if (error || !row) {
    return c.json({ error: 'Invalid device token' }, 404);
  }

  // Check expiry
  if (new Date(row.expires_at) < new Date()) {
    return c.json({ status: 'expired' });
  }

  if (row.status === 'pending') {
    return c.json({ status: 'pending' });
  }

  if (row.status === 'verified' && row.jwt_token) {
    // Clean up the auth code now that the CLI has the token
    await serviceClient
      .from('cli_auth_codes')
      .delete()
      .eq('id', row.id);

    return c.json({
      status: 'verified',
      token: row.jwt_token,
      user_id: row.user_id,
    });
  }

  return c.json({ status: row.status });
});

// ─── POST /cli/verify ──────────────────────────────────────────────────
// Browser-authenticated user verifies a CLI code, linking it to their account.
auth.post('/cli/verify', requireAuth, async (c) => {
  const userId = c.get('userId');

  const body = await c.req.json().catch(() => null);
  const parsed = CLIVerifySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);
  }

  const { code } = parsed.data;

  // Find the pending auth code
  const { data: row, error } = await serviceClient
    .from('cli_auth_codes')
    .select('*')
    .eq('code', code)
    .eq('status', 'pending')
    .single();

  if (error || !row) {
    return c.json({ error: 'Invalid or expired code' }, 404);
  }

  // Check expiry
  if (new Date(row.expires_at) < new Date()) {
    return c.json({ error: 'Code has expired' }, 410);
  }

  // Sign a CLI JWT for this user
  const jwt = await signCLIToken({
    sub: userId,
    type: 'cli',
  });

  // Mark code as verified and store the JWT
  const { error: updateErr } = await serviceClient
    .from('cli_auth_codes')
    .update({
      status: 'verified',
      user_id: userId,
      jwt_token: jwt,
    })
    .eq('id', row.id);

  if (updateErr) {
    console.error('[auth] cli/verify update error:', updateErr.message);
    return c.json({ error: 'Failed to verify code' }, 500);
  }

  return c.json({ success: true });
});

// ─── GET /callback ─────────────────────────────────────────────────────
// OAuth callback handler. Supabase redirects here after the user signs in.
auth.get('/callback', async (c) => {
  const code = c.req.query('code');

  if (!code) {
    return c.redirect(`${env.APP_URL}/auth/error?reason=missing_code`);
  }

  // Exchange the code for a session
  const { data, error } = await anonClient.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('[auth] callback exchange error:', error?.message);
    return c.redirect(`${env.APP_URL}/auth/error?reason=exchange_failed`);
  }

  const user = data.user;

  // Ensure user profile exists in our users table
  const { data: existingProfile } = await serviceClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingProfile) {
    // Derive username and avatar from OAuth metadata
    const meta = user.user_metadata ?? {};
    const username =
      meta.user_name ??
      meta.preferred_username ??
      meta.name?.replace(/\s+/g, '').toLowerCase() ??
      `user_${nanoid(8)}`;
    const avatarUrl = meta.avatar_url ?? null;
    const displayName = meta.full_name ?? meta.name ?? null;
    const email = user.email ?? null;

    const { error: insertErr } = await serviceClient
      .from('users')
      .insert({
        id: user.id,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
        email,
      });

    if (insertErr) {
      // If username collision, try with a random suffix
      if (insertErr.code === '23505' && insertErr.message.includes('username')) {
        await serviceClient.from('users').insert({
          id: user.id,
          username: `${username}_${nanoid(4)}`,
          display_name: displayName,
          avatar_url: avatarUrl,
          email,
        });
      } else {
        console.error('[auth] callback profile insert error:', insertErr.message);
      }
    }
  }

  // Redirect to frontend with the session tokens
  const accessToken = data.session?.access_token ?? '';
  const refreshToken = data.session?.refresh_token ?? '';
  const redirectUrl = new URL(`${env.APP_URL}/auth/callback`);
  redirectUrl.searchParams.set('access_token', accessToken);
  redirectUrl.searchParams.set('refresh_token', refreshToken);

  return c.redirect(redirectUrl.toString());
});

export default auth;
