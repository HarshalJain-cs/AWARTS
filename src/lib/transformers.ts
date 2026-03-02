/**
 * Transform API responses (snake_case) to frontend types (camelCase).
 * This bridges the Supabase/Hono backend with the React frontend.
 */
import type { Post, User, Comment, Notification, LeaderboardEntry, Provider, HeatmapDay, Achievement } from './types';

// ─── Feed Post Transformer ────────────────────────────────────────────
export function transformFeedPost(raw: any): Post {
  const usage = raw.daily_usage ?? [];
  const totalCost = usage.reduce((sum: number, u: any) => sum + Number(u.cost_usd ?? 0), 0);
  const totalInput = usage.reduce((sum: number, u: any) => sum + Number(u.input_tokens ?? 0), 0);
  const totalOutput = usage.reduce((sum: number, u: any) => sum + Number(u.output_tokens ?? 0), 0);

  const providerBreakdown = usage.map((u: any) => ({
    provider: u.provider as Provider,
    cost: Number(u.cost_usd ?? 0),
    inputTokens: Number(u.input_tokens ?? 0),
    outputTokens: Number(u.output_tokens ?? 0),
    sessions: 1,
  }));

  return {
    id: raw.id,
    user: transformUser(raw.user),
    title: raw.title ?? '',
    description: raw.description ?? '',
    providers: (raw.providers ?? []) as Provider[],
    providerBreakdown,
    stats: {
      cost: totalCost,
      inputTokens: totalInput,
      outputTokens: totalOutput,
      sessions: usage.length,
    },
    images: raw.images ?? [],
    kudosCount: raw.kudos_count ?? 0,
    commentCount: raw.comment_count ?? raw.comments_count ?? 0,
    hasKudosed: raw.user_has_kudosed ?? false,
    createdAt: raw.created_at,
  };
}

// ─── User Transformer ─────────────────────────────────────────────────
export function transformUser(raw: any): User {
  if (!raw) {
    return {
      id: '',
      username: 'unknown',
      displayName: 'Unknown',
      avatar: '',
      bio: '',
      location: '',
      country: '',
      countryCode: '',
      joinDate: '',
      followers: 0,
      following: 0,
      isVerified: false,
      isFollowing: false,
      providers: [],
      streak: 0,
      totalSpend: 0,
      totalTokens: 0,
    };
  }

  return {
    id: raw.id ?? '',
    username: raw.username ?? 'unknown',
    displayName: raw.display_name ?? raw.displayName ?? raw.username ?? '',
    avatar: raw.avatar_url ?? raw.avatar ?? '',
    bio: raw.bio ?? '',
    location: raw.country ?? raw.location ?? '',
    country: raw.country ?? '',
    countryCode: raw.country ?? '',
    joinDate: raw.created_at ?? raw.joinDate ?? '',
    followers: raw.followers_count ?? raw.followers ?? 0,
    following: raw.following_count ?? raw.following ?? 0,
    isVerified: raw.is_verified ?? false,
    isFollowing: raw.is_following ?? false,
    providers: (raw.providers_used ?? raw.providers ?? []) as Provider[],
    streak: raw.stats?.current_streak ?? raw.streak ?? 0,
    totalSpend: raw.stats?.total_cost_usd ?? raw.totalSpend ?? 0,
    totalTokens: raw.totalTokens ?? 0,
  };
}

// ─── Comment Transformer ──────────────────────────────────────────────
export function transformComment(raw: any): Comment {
  return {
    id: raw.id,
    user: transformUser(raw.user),
    content: raw.content,
    createdAt: raw.created_at,
  };
}

// ─── Notification Transformer ─────────────────────────────────────────
export function transformNotification(raw: any): Notification {
  return {
    id: raw.id,
    type: raw.type,
    actor: transformUser(raw.sender),
    post: raw.post ? transformFeedPost(raw.post) : undefined,
    read: raw.is_read,
    createdAt: raw.created_at,
  };
}

// ─── Leaderboard Transformer ──────────────────────────────────────────
export function transformLeaderboardEntry(raw: any, rank: number): LeaderboardEntry {
  return {
    rank,
    user: transformUser(raw),
    spend: Number(raw.total_cost ?? 0),
    tokens: Number(raw.total_tokens ?? 0),
    streak: Number(raw.current_streak ?? 0),
    providers: (raw.providers ?? []) as Provider[],
  };
}

// ─── Heatmap Transformer ──────────────────────────────────────────────
export function transformHeatmap(heatmapData: Record<string, number>): HeatmapDay[] {
  const maxSpend = Math.max(...Object.values(heatmapData), 1);
  return Object.entries(heatmapData).map(([date, spend]) => {
    const ratio = spend / maxSpend;
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (ratio > 0.75) intensity = 4;
    else if (ratio > 0.5) intensity = 3;
    else if (ratio > 0.25) intensity = 2;
    else if (ratio > 0) intensity = 1;

    return {
      date,
      spend,
      dominantProvider: null,
      intensity,
    };
  });
}

// ─── Achievement Transformer ──────────────────────────────────────────
const ACHIEVEMENT_META: Record<string, { name: string; emoji: string; description: string }> = {
  'first-submit': { name: 'First Sync', emoji: '🚀', description: 'Push your first session' },
  'week-warrior': { name: 'Week Warrior', emoji: '⚔️', description: '7-day streak' },
  'month-master': { name: 'Power User', emoji: '💪', description: '30-day streak' },
  'hundred-days': { name: '100 Days', emoji: '💯', description: '100-day streak' },
  'big-spender-10': { name: 'Spender $10', emoji: '💵', description: 'Spend $10 total' },
  'big-spender-100': { name: 'Big Spender', emoji: '💸', description: 'Spend $100 total' },
  'big-spender-1000': { name: 'Whale', emoji: '🐳', description: 'Spend $1000 total' },
  'multi-provider': { name: 'Polyglot Coder', emoji: '🌐', description: 'Use 2+ providers' },
  'all-providers': { name: 'Full Stack AI', emoji: '🤖', description: 'Use all 4 providers' },
};

export function transformAchievement(raw: { slug: string; awarded_at: string }): Achievement {
  const meta = ACHIEVEMENT_META[raw.slug] ?? { name: raw.slug, emoji: '🏆', description: '' };
  return {
    id: raw.slug,
    name: meta.name,
    emoji: meta.emoji,
    description: meta.description,
    earned: true,
    earnedAt: raw.awarded_at,
  };
}
