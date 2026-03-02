import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();
const port = env.BACKEND_PORT;

console.log(`
  ╔══════════════════════════════════════╗
  ║    AWARTS Backend API Server         ║
  ║    http://localhost:${port}              ║
  ╚══════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port });
