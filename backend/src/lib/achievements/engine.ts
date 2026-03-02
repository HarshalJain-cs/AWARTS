import { ACHIEVEMENT_DEFINITIONS, type UserStats } from './definitions.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function awardAchievements(
  userId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const [
    totalStats,
    maxDayStats,
    weeklyStats,
    providers,
    streakResult,
    globalRank,
    alreadyEarnedResult,
  ] = await Promise.all([
    // Total lifetime stats
    supabase
      .from('daily_usage')
      .select('cost_usd, output_tokens')
      .eq('user_id', userId)
      .then(({ data }) => ({
        total_cost_usd:
          data?.reduce((s, r) => s + Number(r.cost_usd), 0) ?? 0,
        lifetime_output_tokens:
          data?.reduce((s, r) => s + Number(r.output_tokens), 0) ?? 0,
      })),

    // Max single-day stats (grouped by date, summed across providers)
    supabase
      .from('daily_usage')
      .select('cost_usd, output_tokens, date')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data)
          return { single_day_max_cost: 0, single_day_max_output_tokens: 0 };
        const byDate = data.reduce(
          (acc, r) => {
            const d = acc[r.date] ?? { cost: 0, output: 0 };
            acc[r.date] = {
              cost: d.cost + Number(r.cost_usd),
              output: d.output + Number(r.output_tokens),
            };
            return acc;
          },
          {} as Record<string, { cost: number; output: number }>
        );
        const days = Object.values(byDate);
        return {
          single_day_max_cost: Math.max(0, ...days.map((d) => d.cost)),
          single_day_max_output_tokens: Math.max(
            0,
            ...days.map((d) => d.output)
          ),
        };
      }),

    // Current week cost
    supabase
      .from('daily_usage')
      .select('cost_usd')
      .eq('user_id', userId)
      .gte('date', getWeekStart())
      .then(({ data }) => ({
        weekly_cost:
          data?.reduce((s, r) => s + Number(r.cost_usd), 0) ?? 0,
      })),

    // Providers used
    supabase
      .from('daily_usage')
      .select('provider')
      .eq('user_id', userId)
      .then(({ data }) => [
        ...new Set(data?.map((r) => r.provider) ?? []),
      ]),

    // Current streak
    supabase
      .rpc('calculate_user_streak', { p_user_id: userId })
      .then(({ data }) => (data as number) ?? 0),

    // Global rank (all-time)
    supabase
      .from('leaderboard_all_time')
      .select('user_id')
      .then(({ data }) => {
        if (!data) return 0;
        const userIdx = data.findIndex(
          (r: { user_id: string }) => r.user_id === userId
        );
        return userIdx >= 0 ? userIdx + 1 : 0;
      }),

    // Already earned
    supabase
      .from('user_achievements')
      .select('slug')
      .eq('user_id', userId)
      .then(({ data }) => data?.map((r) => r.slug) ?? []),
  ]);

  const userStats: UserStats = {
    ...totalStats,
    ...maxDayStats,
    ...weeklyStats,
    providers_used: providers,
    current_streak: streakResult,
    global_rank: globalRank,
  };

  const alreadyEarned = alreadyEarnedResult;
  const newlyEarned: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (alreadyEarned.includes(def.slug)) continue;

    if (def.check(userStats)) {
      const { data: awarded } = await supabase.rpc('award_achievement', {
        p_user_id: userId,
        p_slug: def.slug,
      });

      if (awarded) {
        newlyEarned.push(def.slug);
        // Send achievement notification
        await supabase.from('notifications').insert({
          recipient_id: userId,
          type: 'achievement',
          sender_id: null,
          post_id: null,
          comment_id: null,
        });
      }
    }
  }

  return newlyEarned;
}

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}
