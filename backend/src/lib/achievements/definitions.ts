export interface AchievementDefinition {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  total_cost_usd: number;
  lifetime_output_tokens: number;
  single_day_max_cost: number;
  single_day_max_output_tokens: number;
  current_streak: number;
  providers_used: string[];
  weekly_cost: number;
  global_rank: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    slug: 'first-sync',
    name: 'First Sync',
    emoji: '🏆',
    description: 'Pushed your first day of usage',
    check: (s) => s.total_cost_usd > 0,
  },
  {
    slug: 'seven-day-streak',
    name: 'Week Warrior',
    emoji: '🔥',
    description: 'Maintained a 7-day streak',
    check: (s) => s.current_streak >= 7,
  },
  {
    slug: 'thirty-day-streak',
    name: 'Monthly Legend',
    emoji: '🌟',
    description: 'Maintained a 30-day streak',
    check: (s) => s.current_streak >= 30,
  },
  {
    slug: 'power-user',
    name: 'Power User',
    emoji: '⚡',
    description: 'Spent over $10 in a single day',
    check: (s) => s.single_day_max_cost >= 10,
  },
  {
    slug: 'century-tokens',
    name: '100K Output',
    emoji: '🎯',
    description: 'Generated 100K output tokens in a single day',
    check: (s) => s.single_day_max_output_tokens >= 100_000,
  },
  {
    slug: 'million-output',
    name: '1M Output',
    emoji: '💯',
    description: 'Generated 1M output tokens in a single day',
    check: (s) => s.single_day_max_output_tokens >= 1_000_000,
  },
  {
    slug: 'one-hundred-m',
    name: '100M Output',
    emoji: '🚀',
    description: 'Lifetime 100M output tokens',
    check: (s) => s.lifetime_output_tokens >= 100_000_000,
  },
  {
    slug: 'big-spender',
    name: 'Big Spender',
    emoji: '💰',
    description: 'Spent over $100 in a single week',
    check: (s) => s.weekly_cost >= 100,
  },
  {
    slug: 'global-top-10',
    name: 'Elite',
    emoji: '🌍',
    description: 'Reached global top 10',
    check: (s) => s.global_rank <= 10 && s.global_rank > 0,
  },
  {
    slug: 'codex-first',
    name: 'Codex Pioneer',
    emoji: '🤖',
    description: 'Pushed your first Codex data',
    check: (s) => s.providers_used.includes('codex'),
  },
  {
    slug: 'gemini-first',
    name: 'Gemini Explorer',
    emoji: '💎',
    description: 'Pushed your first Gemini data',
    check: (s) => s.providers_used.includes('gemini'),
  },
  {
    slug: 'antigravity-first',
    name: 'AG Pilot',
    emoji: '🛸',
    description: 'Pushed your first Antigravity data',
    check: (s) => s.providers_used.includes('antigravity'),
  },
  {
    slug: 'multi-provider',
    name: 'Polyglot Coder',
    emoji: '🔀',
    description: 'Pushed data from 2 or more providers',
    check: (s) => s.providers_used.length >= 2,
  },
  {
    slug: 'all-providers',
    name: 'Full Stack AI',
    emoji: '🌈',
    description: 'Pushed data from all 4 providers',
    check: (s) => s.providers_used.length >= 4,
  },
];
