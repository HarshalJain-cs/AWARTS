import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { corsMiddleware } from './middleware/cors.js';

// Route imports
import auth from './routes/auth.js';
import usage from './routes/usage.js';
import feed from './routes/feed.js';
import posts from './routes/posts.js';
import social from './routes/social.js';
import leaderboard from './routes/leaderboard.js';
import search from './routes/search.js';
import users from './routes/users.js';
import upload from './routes/upload.js';
import ai from './routes/ai.js';
import email from './routes/email.js';

export function createApp() {
  const app = new Hono();

  // ─── Global Middleware ──────────────────────────────────────────────
  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use('*', corsMiddleware);

  // ─── Health Check ───────────────────────────────────────────────────
  app.get('/api/health', (c) =>
    c.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'awarts-backend' })
  );

  // ─── API Routes ─────────────────────────────────────────────────────
  app.route('/api/auth', auth);
  app.route('/api/usage', usage);
  app.route('/api/feed', feed);
  app.route('/api/posts', posts);
  app.route('/api/social', social);
  app.route('/api/leaderboard', leaderboard);
  app.route('/api/search', search);
  app.route('/api/users', users);
  app.route('/api/upload', upload);
  app.route('/api/ai', ai);
  app.route('/api/email', email);

  // ─── 404 Fallback ──────────────────────────────────────────────────
  app.notFound((c) =>
    c.json({ error: 'Not found', path: c.req.path }, 404)
  );

  // ─── Global Error Handler ──────────────────────────────────────────
  app.onError((err, c) => {
    console.error('[app] Unhandled error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
