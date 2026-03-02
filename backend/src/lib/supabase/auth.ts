import { createClient } from '@supabase/supabase-js';
import { env } from '../../env.js';

/**
 * Validate a Supabase access token and return the user.
 * Creates a throwaway client scoped to the user's token.
 */
export async function getUserFromToken(accessToken: string) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
