-- AWARTS Indexes - Query optimization

CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date_cost ON daily_usage (date DESC, cost_usd DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_provider ON daily_usage (provider);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_provider ON daily_usage (user_id, provider);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_posts_usage_date ON posts (usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);

CREATE INDEX IF NOT EXISTS idx_kudos_post ON kudos (post_id);
CREATE INDEX IF NOT EXISTS idx_kudos_user ON kudos (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_cli_auth_device_token ON cli_auth_codes (device_token)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_users_username_search ON users USING gin(to_tsvector('english', coalesce(username, '')));
