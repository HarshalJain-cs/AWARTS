import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Create or update the post for a given user + date.
 *
 * Each user has at most one post per usage_date. This function:
 * 1. Fetches all daily_usage rows for the user on that date.
 * 2. Upserts a post (one per user per date).
 * 3. Syncs the post_daily_usage join table so the post links to all usage rows.
 *
 * @returns The number of posts created (0 if updated, 1 if created).
 */
export async function createOrUpdatePost(
  userId: string,
  date: string,
  supabase: SupabaseClient
): Promise<number> {
  // 1. Fetch all daily_usage rows for user + date
  const { data: usageRows, error: usageErr } = await supabase
    .from('daily_usage')
    .select('id, provider')
    .eq('user_id', userId)
    .eq('date', date);

  if (usageErr) {
    console.error('[posts] Failed to fetch daily_usage:', usageErr.message);
    return 0;
  }

  if (!usageRows || usageRows.length === 0) {
    return 0;
  }

  // Collect unique providers
  const providers = [...new Set(usageRows.map((r) => r.provider))].sort();

  // 2. Upsert the post — one per (user_id, usage_date)
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .upsert(
      {
        user_id: userId,
        usage_date: date,
        providers,
        is_published: true,
      },
      { onConflict: 'user_id,usage_date' }
    )
    .select('id, created_at, updated_at')
    .single();

  if (postErr || !post) {
    console.error('[posts] Failed to upsert post:', postErr?.message);
    return 0;
  }

  // Determine if this was a create or update (created_at ~= updated_at means new)
  const wasCreated =
    Math.abs(new Date(post.created_at).getTime() - new Date(post.updated_at).getTime()) < 2000;

  // 3. Sync post_daily_usage join table
  // Delete existing links first to handle removed usage rows
  await supabase
    .from('post_daily_usage')
    .delete()
    .eq('post_id', post.id);

  // Insert current links
  const joinRows = usageRows.map((r) => ({
    post_id: post.id,
    daily_usage_id: r.id,
  }));

  const { error: joinErr } = await supabase
    .from('post_daily_usage')
    .insert(joinRows);

  if (joinErr) {
    console.error('[posts] Failed to sync post_daily_usage:', joinErr.message);
  }

  return wasCreated ? 1 : 0;
}
