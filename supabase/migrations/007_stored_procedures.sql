-- AWARTS Stored Procedures
-- NOTE: This file must be run BEFORE 006_leaderboard_views.sql

-- ─── CALCULATE USER STREAK ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_has_data BOOLEAN;
BEGIN
  -- Check if today or yesterday has data (UTC grace)
  SELECT EXISTS(
    SELECT 1 FROM daily_usage
    WHERE user_id = p_user_id
    AND date IN (CURRENT_DATE, CURRENT_DATE - 1)
  ) INTO v_has_data;

  IF NOT v_has_data THEN
    RETURN 0;
  END IF;

  -- If only yesterday has data, start from yesterday
  IF NOT EXISTS(SELECT 1 FROM daily_usage WHERE user_id = p_user_id AND date = CURRENT_DATE) THEN
    v_check_date := CURRENT_DATE - 1;
  END IF;

  -- Walk backwards counting consecutive days
  LOOP
    IF EXISTS(
      SELECT 1 FROM daily_usage
      WHERE user_id = p_user_id AND date = v_check_date
    ) THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - 1;
    ELSE
      EXIT;
    END IF;

    -- Safety limit
    IF v_streak >= 3650 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── GET USER PROFILE WITH STATS ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_profile(p_username TEXT, p_viewer_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_user_id UUID;
BEGIN
  -- Get user ID first
  SELECT id INTO v_user_id FROM users WHERE username = p_username;
  IF v_user_id IS NULL THEN RETURN NULL; END IF;

  SELECT json_build_object(
    'user', json_build_object(
      'id', u.id,
      'username', u.username,
      'display_name', u.display_name,
      'bio', u.bio,
      'avatar_url', u.avatar_url,
      'country', u.country,
      'region', u.region,
      'timezone', u.timezone,
      'is_public', u.is_public,
      'default_ai_provider', u.default_ai_provider,
      'created_at', u.created_at,
      'updated_at', u.updated_at
    ),
    'stats', json_build_object(
      'total_cost_usd', COALESCE((SELECT SUM(cost_usd) FROM daily_usage WHERE user_id = u.id), 0),
      'total_tokens', COALESCE((SELECT SUM(total_tokens) FROM daily_usage WHERE user_id = u.id), 0),
      'total_input_tokens', COALESCE((SELECT SUM(input_tokens) FROM daily_usage WHERE user_id = u.id), 0),
      'total_output_tokens', COALESCE((SELECT SUM(output_tokens) FROM daily_usage WHERE user_id = u.id), 0),
      'active_days', (SELECT COUNT(DISTINCT date) FROM daily_usage WHERE user_id = u.id),
      'streak', calculate_user_streak(u.id),
      'first_activity', (SELECT MIN(date) FROM daily_usage WHERE user_id = u.id),
      'last_activity', (SELECT MAX(date) FROM daily_usage WHERE user_id = u.id)
    ),
    'provider_stats', COALESCE(
      (SELECT json_object_agg(sub.provider, json_build_object(
        'cost_usd', sub.total_cost,
        'total_tokens', sub.total_tok,
        'active_days', sub.days
      ))
      FROM (
        SELECT provider, SUM(cost_usd) AS total_cost, SUM(total_tokens) AS total_tok, COUNT(DISTINCT date) AS days
        FROM daily_usage WHERE user_id = u.id
        GROUP BY provider
      ) sub),
      '{}'::json
    ),
    'providers_used', COALESCE(
      (SELECT array_agg(DISTINCT provider ORDER BY provider) FROM daily_usage WHERE user_id = u.id),
      ARRAY[]::text[]
    ),
    'follower_count', (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
    'following_count', (SELECT COUNT(*) FROM follows WHERE follower_id = u.id),
    'is_following', CASE
      WHEN p_viewer_id IS NOT NULL THEN
        EXISTS(SELECT 1 FROM follows WHERE follower_id = p_viewer_id AND following_id = u.id)
      ELSE false
    END,
    'achievements', COALESCE(
      (SELECT array_agg(slug ORDER BY earned_at) FROM user_achievements WHERE user_id = u.id),
      ARRAY[]::text[]
    )
  )
  INTO v_result
  FROM users u
  WHERE u.id = v_user_id
  AND (u.is_public = true OR u.id = p_viewer_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── GET CONTRIBUTION GRAPH DATA ────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_contribution_graph(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE(
  date DATE,
  cost_usd NUMERIC,
  total_tokens BIGINT,
  dominant_provider TEXT,
  providers TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    du.date,
    SUM(du.cost_usd)::numeric AS cost_usd,
    SUM(du.total_tokens)::bigint AS total_tokens,
    (
      SELECT di.provider FROM daily_usage di
      WHERE di.user_id = p_user_id AND di.date = du.date
      ORDER BY di.cost_usd DESC LIMIT 1
    ) AS dominant_provider,
    ARRAY_AGG(DISTINCT du.provider ORDER BY du.provider) AS providers
  FROM daily_usage du
  WHERE du.user_id = p_user_id
    AND EXTRACT(YEAR FROM du.date) = p_year
  GROUP BY du.date
  ORDER BY du.date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── AWARD ACHIEVEMENT (idempotent) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id UUID,
  p_slug TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_has BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND slug = p_slug
  ) INTO v_already_has;

  IF v_already_has THEN
    RETURN false;
  END IF;

  INSERT INTO user_achievements (user_id, slug)
  VALUES (p_user_id, p_slug)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ─── GET LEADERBOARD (with provider/region filters) ───────────────────
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_period TEXT DEFAULT 'weekly',
  p_provider TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_cost NUMERIC,
  total_tokens BIGINT,
  current_streak INTEGER,
  region TEXT
) AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- Calculate period start date
  v_start_date := CASE p_period
    WHEN 'daily' THEN CURRENT_DATE
    WHEN 'weekly' THEN CURRENT_DATE - 7
    WHEN 'monthly' THEN CURRENT_DATE - 30
    ELSE '2000-01-01'::DATE
  END;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.username,
    u.avatar_url,
    COALESCE(SUM(du.cost_usd), 0)::numeric AS total_cost,
    COALESCE(SUM(du.total_tokens), 0)::bigint AS total_tokens,
    calculate_user_streak(u.id) AS current_streak,
    u.region
  FROM users u
  INNER JOIN daily_usage du ON du.user_id = u.id
  WHERE du.date >= v_start_date
    AND u.is_public = true
    AND (p_provider IS NULL OR du.provider = p_provider)
    AND (p_region IS NULL OR u.region = p_region)
  GROUP BY u.id, u.username, u.avatar_url, u.region
  ORDER BY total_cost DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
