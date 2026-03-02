-- AWARTS Leaderboard Views
-- The calculate_user_streak function is defined here so it exists before the views reference it.
-- It is also defined in 007_stored_procedures.sql via CREATE OR REPLACE, so no conflict occurs.

-- ─── CALCULATE USER STREAK (must exist before views) ────────────────────
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_has_data BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM daily_usage
    WHERE user_id = p_user_id
    AND date IN (CURRENT_DATE, CURRENT_DATE - 1)
  ) INTO v_has_data;

  IF NOT v_has_data THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS(SELECT 1 FROM daily_usage WHERE user_id = p_user_id AND date = CURRENT_DATE) THEN
    v_check_date := CURRENT_DATE - 1;
  END IF;

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

    IF v_streak >= 3650 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── LEADERBOARD DAILY ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_daily AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0)::numeric AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0)::bigint AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0)::bigint AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0)::bigint AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider ORDER BY du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
  AND du.date >= CURRENT_DATE - INTERVAL '1 day'
  AND du.date <= CURRENT_DATE
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;

-- ─── LEADERBOARD WEEKLY ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0)::numeric AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0)::bigint AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0)::bigint AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0)::bigint AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data,
  COUNT(DISTINCT du.date)::integer AS active_days
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
  AND du.date >= date_trunc('week', CURRENT_DATE)::date
  AND du.date <= CURRENT_DATE
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;

-- ─── LEADERBOARD MONTHLY ────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_monthly AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0)::numeric AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0)::bigint AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0)::bigint AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0)::bigint AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data,
  COUNT(DISTINCT du.date)::integer AS active_days
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
  AND du.date >= date_trunc('month', CURRENT_DATE)::date
  AND du.date <= CURRENT_DATE
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;

-- ─── LEADERBOARD ALL TIME ───────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0)::numeric AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0)::bigint AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0)::bigint AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0)::bigint AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data,
  COUNT(DISTINCT du.date)::integer AS active_days,
  MIN(du.date) AS first_activity,
  MAX(du.date) AS last_activity
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;
