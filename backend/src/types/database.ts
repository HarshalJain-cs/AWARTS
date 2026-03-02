// Placeholder for Supabase-generated types
// Generate with: bunx supabase gen types typescript --project-id <project-id> > src/types/database.ts
// For now, we use the service client without strict typing and rely on api.ts types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          country: string | null;
          region: string | null;
          timezone: string;
          is_public: boolean;
          email: string | null;
          default_ai_provider: string;
          email_notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      daily_usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
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
          data_hash: string | null;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_usage']['Row'], 'id' | 'total_tokens' | 'is_verified' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['daily_usage']['Insert']>;
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          usage_date: string;
          title: string | null;
          description: string | null;
          images: string[];
          providers: string[];
          is_published: boolean;
          caption_generated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['posts']['Row']> & { user_id: string; usage_date: string };
        Update: Partial<Database['public']['Tables']['posts']['Row']>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'created_at'>;
        Update: never;
      };
      kudos: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kudos']['Row'], 'created_at'>;
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          type: string;
          post_id: string | null;
          comment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'is_read' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      cli_auth_codes: {
        Row: {
          id: string;
          code: string;
          device_token: string;
          user_id: string | null;
          status: string;
          jwt_token: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cli_auth_codes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['cli_auth_codes']['Row']>;
      };
      user_achievements: {
        Row: {
          user_id: string;
          slug: string;
          earned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'earned_at'>;
        Update: never;
      };
    };
    Views: {
      leaderboard_daily: { Row: LeaderboardViewRow };
      leaderboard_weekly: { Row: LeaderboardViewRow & { active_days: number } };
      leaderboard_monthly: { Row: LeaderboardViewRow & { active_days: number } };
      leaderboard_all_time: { Row: LeaderboardViewRow & { active_days: number; first_activity: string | null; last_activity: string | null } };
    };
    Functions: {
      calculate_user_streak: { Args: { p_user_id: string }; Returns: number };
      get_user_profile: { Args: { p_username: string; p_viewer_id?: string | null }; Returns: Json };
      get_contribution_graph: {
        Args: { p_user_id: string; p_year?: number };
        Returns: Array<{ date: string; cost_usd: number; total_tokens: number; dominant_provider: string; providers: string[] }>;
      };
      award_achievement: { Args: { p_user_id: string; p_slug: string }; Returns: boolean };
    };
  };
}

interface LeaderboardViewRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  country: string | null;
  region: string | null;
  total_cost_usd: number;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  providers: string[];
  streak: number;
  has_verified_data: boolean;
}
