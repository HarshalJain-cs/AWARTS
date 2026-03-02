// Request/Response types for AWARTS API

export type ProviderKey = 'claude' | 'codex' | 'gemini' | 'antigravity';

// POST /api/usage/submit
export interface UsageSubmitRequest {
  entries: Array<{
    date: string;
    provider: ProviderKey;
    cost_usd: number;
    input_tokens: number;
    output_tokens: number;
    cache_creation_tokens?: number;
    cache_read_tokens?: number;
    models: string[];
    raw_data?: Record<string, unknown>;
  }>;
  source: 'cli' | 'web';
  hash?: string;
}

export interface UsageSubmitResponse {
  success: boolean;
  processed: number;
  posts_created: number;
  errors?: Array<{ date: string; provider: string; error: string }>;
}

// GET /api/feed
export interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  usage_date: string;
  title: string | null;
  description: string | null;
  images: string[];
  providers: string[];
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    country: string | null;
  };
  daily_usage: DailyUsageRow[];
  kudos_count: number;
  comment_count: number;
  user_has_kudosed: boolean;
}

export interface DailyUsageRow {
  id: string;
  provider: string;
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  total_tokens: number;
  models: string[];
  source: string;
  is_verified: boolean;
  date: string;
}

// GET /api/leaderboard
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  period: string;
  region: string;
  provider: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
  region: string | null;
  total_cost_usd: number;
  total_tokens: number;
  providers: string[];
  streak: number;
  has_verified_data: boolean;
  active_days?: number;
}

// GET /api/users/:username
export interface UserProfileResponse {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    country: string | null;
    region: string | null;
    timezone: string;
    is_public: boolean;
    default_ai_provider: string;
    created_at: string;
    updated_at: string;
  };
  stats: {
    total_cost_usd: number;
    total_tokens: number;
    total_input_tokens: number;
    total_output_tokens: number;
    active_days: number;
    streak: number;
    first_activity: string | null;
    last_activity: string | null;
  };
  provider_stats: Record<
    string,
    { cost_usd: number; total_tokens: number; active_days: number }
  >;
  providers_used: string[];
  follower_count: number;
  following_count: number;
  is_following: boolean;
  achievements: string[];
}

// Notifications
export interface NotificationItem {
  id: string;
  type: 'kudos' | 'comment' | 'mention' | 'follow' | 'achievement';
  is_read: boolean;
  created_at: string;
  sender: { id: string; username: string; avatar_url: string | null } | null;
  post: { id: string; title: string | null; usage_date: string } | null;
}

// AI Caption
export interface CaptionRequest {
  stats: {
    cost_usd?: number;
    total_tokens?: number;
    providers?: string[];
    date?: string;
  };
  imageUrls?: string[];
  preferredProvider?: string;
}

export interface CaptionResponse {
  title: string;
  description: string;
  generated_by: string;
}
