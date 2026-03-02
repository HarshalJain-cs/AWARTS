-- AWARTS Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cli_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries_to_regions ENABLE ROW LEVEL SECURITY;

-- ─── Countries (public read) ────────────────────────────────────────────
CREATE POLICY "countries_select_all" ON countries_to_regions
  FOR SELECT USING (true);

-- ─── USERS ──────────────────────────────────────────────────────────────
CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (is_public = true OR auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_service" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── DAILY_USAGE ────────────────────────────────────────────────────────
CREATE POLICY "daily_usage_select_all" ON daily_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = daily_usage.user_id
      AND (u.is_public = true OR u.id = auth.uid())
    )
  );

CREATE POLICY "daily_usage_insert_own" ON daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_usage_update_own" ON daily_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── POSTS ──────────────────────────────────────────────────────────────
CREATE POLICY "posts_select_published" ON posts
  FOR SELECT USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = posts.user_id
      AND (u.is_public = true OR u.id = auth.uid())
    )
  );

CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ─── POST_DAILY_USAGE ──────────────────────────────────────────────────
CREATE POLICY "post_daily_usage_select_all" ON post_daily_usage
  FOR SELECT USING (true);

CREATE POLICY "post_daily_usage_insert_own" ON post_daily_usage
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

CREATE POLICY "post_daily_usage_delete_own" ON post_daily_usage
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

-- ─── COMMENTS ───────────────────────────────────────────────────────────
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ─── FOLLOWS ────────────────────────────────────────────────────────────
CREATE POLICY "follows_select_all" ON follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ─── KUDOS ──────────────────────────────────────────────────────────────
CREATE POLICY "kudos_select_all" ON kudos
  FOR SELECT USING (true);

CREATE POLICY "kudos_insert_own" ON kudos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kudos_delete_own" ON kudos
  FOR DELETE USING (auth.uid() = user_id);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Inserts are service-role only (from backend)

-- ─── CLI_AUTH_CODES ─────────────────────────────────────────────────────
CREATE POLICY "cli_auth_select_own" ON cli_auth_codes
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ─── USER_ACHIEVEMENTS ─────────────────────────────────────────────────
CREATE POLICY "achievements_select_all" ON user_achievements
  FOR SELECT USING (true);

-- Inserts are service-role only
