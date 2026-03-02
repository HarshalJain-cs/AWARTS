-- AWARTS Base Schema
-- 9 tables: users, countries_to_regions, daily_usage, posts, post_daily_usage,
--           comments, follows, kudos, notifications, cli_auth_codes, user_achievements

-- ─── Extensions ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Custom Types ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'kudos',
    'comment',
    'mention',
    'follow',
    'achievement'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── USERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE,
  display_name    TEXT,
  bio             TEXT CHECK (length(bio) <= 500),
  avatar_url      TEXT,
  country         TEXT,
  region          TEXT,
  timezone        TEXT DEFAULT 'UTC',
  is_public       BOOLEAN DEFAULT true,
  email           TEXT,
  default_ai_provider TEXT DEFAULT 'claude',
  email_notifications_enabled BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COUNTRIES_TO_REGIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS countries_to_regions (
  country_code    TEXT PRIMARY KEY,
  country_name    TEXT NOT NULL,
  region          TEXT NOT NULL
);

-- ─── DAILY_USAGE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_usage (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                    DATE NOT NULL,
  provider                TEXT NOT NULL DEFAULT 'claude',
  cost_usd                NUMERIC(12, 6) NOT NULL DEFAULT 0,
  input_tokens            BIGINT NOT NULL DEFAULT 0,
  output_tokens           BIGINT NOT NULL DEFAULT 0,
  cache_creation_tokens   BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens       BIGINT NOT NULL DEFAULT 0,
  total_tokens            BIGINT GENERATED ALWAYS AS (
                            input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens
                          ) STORED,
  models                  TEXT[] NOT NULL DEFAULT '{}',
  source                  TEXT NOT NULL DEFAULT 'web',
  is_verified             BOOLEAN GENERATED ALWAYS AS (source = 'cli') STORED,
  data_hash               TEXT,
  raw_data                JSONB,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT daily_usage_provider_check CHECK (
    provider IN ('claude', 'codex', 'gemini', 'antigravity')
  ),
  CONSTRAINT daily_usage_unique_user_date_provider UNIQUE (user_id, date, provider),
  CONSTRAINT daily_usage_cost_positive CHECK (cost_usd >= 0),
  CONSTRAINT daily_usage_tokens_positive CHECK (
    input_tokens >= 0 AND output_tokens >= 0 AND
    cache_creation_tokens >= 0 AND cache_read_tokens >= 0
  )
);

-- ─── POSTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date      DATE NOT NULL,
  title           TEXT CHECK (length(title) <= 280),
  description     TEXT CHECK (length(description) <= 2000),
  images          TEXT[] DEFAULT '{}',
  providers       TEXT[] DEFAULT '{}',
  is_published    BOOLEAN DEFAULT true,
  caption_generated_by TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT posts_unique_user_date UNIQUE (user_id, usage_date)
);

-- ─── POST_DAILY_USAGE (join table) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_daily_usage (
  post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
  daily_usage_id  UUID REFERENCES daily_usage(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, daily_usage_id)
);

-- ─── COMMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FOLLOWS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

-- ─── KUDOS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kudos (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  type            notification_type NOT NULL,
  post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id      UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLI_AUTH_CODES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cli_auth_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  device_token    TEXT UNIQUE NOT NULL,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending',
  jwt_token       TEXT,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER_ACHIEVEMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, slug)
);
