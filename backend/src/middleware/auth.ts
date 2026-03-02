import { createMiddleware } from 'hono/factory';
import { getUserFromToken } from '../lib/supabase/auth.js';
import { verifyCLIToken } from '../lib/auth/jwt.js';

/**
 * Middleware: requires authentication via Supabase session token or CLI JWT.
 * Sets `userId` and `authType` on the Hono context.
 */
export const requireAuth = createMiddleware<{
  Variables: { userId: string; authType: 'session' | 'cli' };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  // Try CLI JWT first (they have type: 'cli' in payload)
  const cliPayload = await verifyCLIToken(token);
  if (cliPayload?.type === 'cli' && typeof cliPayload.sub === 'string') {
    c.set('userId', cliPayload.sub);
    c.set('authType', 'cli' as const);
    return next();
  }

  // Fall back to Supabase access token
  const user = await getUserFromToken(token);
  if (user) {
    c.set('userId', user.id);
    c.set('authType', 'session' as const);
    return next();
  }

  return c.json({ error: 'Unauthorized' }, 401);
});

/**
 * Middleware: optional auth. Populates userId if token present, does not block.
 */
export const optionalAuth = createMiddleware<{
  Variables: { userId?: string; authType?: 'session' | 'cli' };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    const cliPayload = await verifyCLIToken(token);
    if (cliPayload?.type === 'cli' && typeof cliPayload.sub === 'string') {
      c.set('userId', cliPayload.sub);
      c.set('authType', 'cli' as const);
    } else {
      const user = await getUserFromToken(token);
      if (user) {
        c.set('userId', user.id);
        c.set('authType', 'session' as const);
      }
    }
  }
  return next();
});
