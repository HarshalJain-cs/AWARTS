import { createClient } from '@supabase/supabase-js';
import { env } from '../../env.js';

// Service client: bypasses RLS, for server-side writes
export const serviceClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
