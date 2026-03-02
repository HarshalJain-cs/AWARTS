import { createClient } from '@supabase/supabase-js';
import { env } from '../../env.js';

// Anon client: respects RLS, for public reads
export const anonClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
