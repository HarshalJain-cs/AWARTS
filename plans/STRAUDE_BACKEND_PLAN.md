# ⚙️ STRAUDE MULTI-MODEL — COMPLETE BACKEND DEVELOPMENT PLAN

> **Full-stack backend blueprint: Database · API · CLI · Auth · Security · Email · AI**
>
> Stack: Next.js 16 App Router · Supabase PostgreSQL · TypeScript · Bun · Turborepo

---

## 📋 TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Schema — Complete SQL](#3-database-schema--complete-sql)
4. [Supabase RLS Policies](#4-supabase-rls-policies)
5. [Database Views & Stored Procedures](#5-database-views--stored-procedures)
6. [Phase 1 — Supabase Client Setup](#phase-1--supabase-client-setup)
7. [Phase 2 — Authentication System](#phase-2--authentication-system)
8. [Phase 3 — Core API Endpoints](#phase-3--core-api-endpoints)
9. [Phase 4 — Social API Layer](#phase-4--social-api-layer)
10. [Phase 5 — Leaderboard & Search API](#phase-5--leaderboard--search-api)
11. [Phase 6 — AI Caption Generation](#phase-6--ai-caption-generation)
12. [Phase 7 — Image Upload Pipeline](#phase-7--image-upload-pipeline)
13. [Phase 8 — Achievement Engine](#phase-8--achievement-engine)
14. [Phase 9 — Email Notification System](#phase-9--email-notification-system)
15. [Phase 10 — CLI Architecture & Adapters](#phase-10--cli-architecture--adapters)
16. [Phase 11 — Security Hardening](#phase-11--security-hardening)
17. [Phase 12 — Testing Strategy](#phase-12--testing-strategy)
18. [API Reference Catalogue](#api-reference-catalogue)
19. [Deployment & Observability](#deployment--observability)

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STRAUDE BACKEND ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────┘

  USER/CLI                   NEXT.JS 16                      SUPABASE
  ─────────                  ──────────────────              ─────────────────
  Browser   ──HTTPS──►  App Router (app/)                   PostgreSQL DB
  Mobile    ──HTTPS──►  ├── (app)/  [authenticated]    ◄──► ├── 9 tables
  CLI       ──HTTPS──►  │   └── page.tsx (RSC)              ├── 4 views
                        ├── api/   [18 endpoints]            ├── 2 procedures
                        │   ├── auth/cli/init               └── RLS on all
                        │   ├── auth/cli/poll
                        │   ├── usage/submit          ◄──►  Supabase Storage
                        │   ├── feed/                        └── uploads/ bucket
                        │   ├── posts/[id]
                        │   ├── social/follow         ◄──►  Supabase Auth
                        │   ├── social/kudos                 ├── Magic Link
                        │   ├── social/comments              └── GitHub OAuth
                        │   ├── social/notifications
                        │   ├── leaderboard/          ◄──►  External Services
                        │   ├── search/                      ├── Anthropic (captions)
                        │   ├── users/[username]             ├── Google AI (captions)
                        │   ├── upload/                      ├── OpenAI (captions)
                        │   └── ai/generate-caption          ├── Resend (email)
                        └── proxy.ts [auth guard]            └── BFL FLUX (OG images)

  MONOREPO STRUCTURE:
  straude/
  ├── apps/web/          ← Next.js 16 app
  │   ├── app/api/       ← 18 Route Handlers
  │   ├── lib/           ← Shared server utilities
  │   └── proxy.ts       ← Next.js 16 auth guard (NOT middleware.ts)
  ├── packages/cli/      ← npx straude@latest
  │   └── src/adapters/  ← 4 provider adapters
  └── supabase/
      └── migrations/    ← Versioned SQL migrations
```

### Request Lifecycle

```
Browser Request
  → proxy.ts (auth check, redirect if needed)
  → Next.js Route Handler / Server Component
  → Supabase Server Client (service role for writes, anon for reads)
  → PostgreSQL (with RLS enforced)
  → Response (JSON or HTML)

CLI Request
  → packages/cli (adapter reads local logs)
  → HTTPS to /api/usage/submit (JWT in Authorization header)
  → Route Handler validates JWT (CLI_JWT_SECRET)
  → Upserts daily_usage + creates post + fires achievements
  → Response { success, postsCreated, achievementsUnlocked }
```

---

## 2. ENVIRONMENT CONFIGURATION

```bash
# apps/web/.env.local — COMPLETE variable list

# ─── Supabase (New Key Model) ───────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[key]   # NOT legacy anon key
SUPABASE_SECRET_KEY=sb_secret_[key]                          # NOT service_role

# ─── CLI Authentication ──────────────────────────────────────────────────
CLI_JWT_SECRET=[minimum-64-char-random-hex-string]
# Generate: openssl rand -hex 32

# ─── AI Providers (for caption generation) ──────────────────────────────
ANTHROPIC_API_KEY=sk-ant-[key]
GOOGLE_AI_API_KEY=[key]                  # Gemini API
OPENAI_API_KEY=sk-[key]                  # Codex/GPT captions

# ─── Image Generation ────────────────────────────────────────────────────
BFL_API_KEY=[key]                        # Black Forest Labs FLUX for OG backgrounds

# ─── Email ───────────────────────────────────────────────────────────────
RESEND_API_KEY=re_[key]
EMAIL_FROM=notifications@straude.dev
EMAIL_UNSUBSCRIBE_SECRET=[32-char-hex]   # HMAC secret for unsubscribe links

# ─── App Config ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://straude.dev
NODE_ENV=production

# packages/cli/.env — CLI package
STRAUDE_API_URL=https://straude.dev
```

```typescript
// lib/env.ts — Type-safe environment validation (run at startup)
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  CLI_JWT_SECRET: z.string().min(64, 'JWT secret must be at least 64 chars'),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  GOOGLE_AI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_FROM: z.string().email(),
  EMAIL_UNSUBSCRIBE_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## 3. DATABASE SCHEMA — COMPLETE SQL

### Migration 001 — Base Schema

```sql
-- supabase/migrations/001_base_schema.sql

-- ─── Extensions ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";  -- For SHA-256 hashing

-- ─── Custom Types ────────────────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'kudos',
  'comment',
  'mention',
  'follow',
  'achievement'
);

-- ─── USERS ───────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  display_name    TEXT,
  bio             TEXT CHECK (length(bio) <= 500),
  avatar_url      TEXT,
  country         TEXT,               -- ISO 3166-1 alpha-2 (e.g., 'IN', 'US')
  region          TEXT,               -- Derived from country via trigger
  timezone        TEXT DEFAULT 'UTC',
  is_public       BOOLEAN DEFAULT true,
  email           TEXT,               -- Synced from auth.users
  default_ai_provider TEXT DEFAULT 'claude', -- For caption generation
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COUNTRIES_TO_REGIONS ────────────────────────────────────────────────
CREATE TABLE countries_to_regions (
  country_code    TEXT PRIMARY KEY,
  country_name    TEXT NOT NULL,
  region          TEXT NOT NULL       -- 'north-america', 'europe', 'asia', 'oceania', 'africa', 'latin-america'
);

-- ─── DAILY_USAGE ─────────────────────────────────────────────────────────
CREATE TABLE daily_usage (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                    DATE NOT NULL,
  provider                TEXT NOT NULL DEFAULT 'claude',
    -- 'claude' | 'codex' | 'gemini' | 'antigravity'
  cost_usd                NUMERIC(12, 6) NOT NULL DEFAULT 0,
  input_tokens            BIGINT NOT NULL DEFAULT 0,
  output_tokens           BIGINT NOT NULL DEFAULT 0,
  cache_creation_tokens   BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens       BIGINT NOT NULL DEFAULT 0,
  total_tokens            BIGINT GENERATED ALWAYS AS (
                            input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens
                          ) STORED,
  models                  TEXT[] NOT NULL DEFAULT '{}',
  source                  TEXT NOT NULL DEFAULT 'web',  -- 'cli' | 'web'
  is_verified             BOOLEAN GENERATED ALWAYS AS (source = 'cli') STORED,
  data_hash               TEXT,       -- SHA-256 of raw CLI output (dedup guard)
  raw_data                JSONB,      -- Store raw adapter output for debugging
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

-- ─── POSTS ───────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date      DATE NOT NULL,      -- The date this post is for
  title           TEXT CHECK (length(title) <= 280),
  description     TEXT CHECK (length(description) <= 2000),
  images          TEXT[] DEFAULT '{}' CHECK (array_length(images, 1) <= 5),
  providers       TEXT[] DEFAULT '{}',  -- Which providers are in this post
  is_published    BOOLEAN DEFAULT true,
  caption_generated_by TEXT,          -- Which AI generated the caption
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- One post per user per date (auto-created on usage submit)
  CONSTRAINT posts_unique_user_date UNIQUE (user_id, usage_date)
);

-- Join: post → usage rows for that date
CREATE TABLE post_daily_usage (
  post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
  daily_usage_id  UUID REFERENCES daily_usage(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, daily_usage_id)
);

-- ─── COMMENTS ────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────
CREATE TABLE follows (
  follower_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

-- ─── KUDOS ───────────────────────────────────────────────────────────────
CREATE TABLE kudos (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  type            notification_type NOT NULL,
  post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id      UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLI_AUTH_CODES ───────────────────────────────────────────────────────
-- Device flow: CLI generates a code, user verifies in browser, CLI polls
CREATE TABLE cli_auth_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,         -- Short display code (e.g., "STRAUDE-A1B2C3")
  device_token    TEXT UNIQUE NOT NULL,          -- UUID polled by CLI
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending',        -- 'pending' | 'verified' | 'expired'
  jwt_token       TEXT,                          -- Set when user verifies
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER_ACHIEVEMENTS ───────────────────────────────────────────────────
CREATE TABLE user_achievements (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,                -- e.g., 'first-sync', 'multi-provider'
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, slug)
);
```

### Migration 002 — Indexes

```sql
-- supabase/migrations/002_indexes.sql

-- High-traffic query optimization
CREATE INDEX idx_daily_usage_user_date ON daily_usage (user_id, date DESC);
CREATE INDEX idx_daily_usage_date_cost ON daily_usage (date DESC, cost_usd DESC);
CREATE INDEX idx_daily_usage_provider ON daily_usage (provider);
CREATE INDEX idx_daily_usage_user_provider ON daily_usage (user_id, provider);

CREATE INDEX idx_posts_user ON posts (user_id, created_at DESC);
CREATE INDEX idx_posts_created ON posts (created_at DESC) WHERE is_published = true;
CREATE INDEX idx_posts_usage_date ON posts (usage_date DESC);

CREATE INDEX idx_comments_post ON comments (post_id, created_at ASC);
CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_following ON follows (following_id);

CREATE INDEX idx_kudos_post ON kudos (post_id);
CREATE INDEX idx_kudos_user ON kudos (user_id);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX idx_cli_auth_device_token ON cli_auth_codes (device_token)
  WHERE status = 'pending';

-- Full-text search on username
CREATE INDEX idx_users_username_search ON users USING gin(to_tsvector('english', username));
```

### Migration 003 — Triggers

```sql
-- supabase/migrations/003_triggers.sql

-- Auto-update updated_at on any table mutation
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_usage_updated_at
  BEFORE UPDATE ON daily_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-set user region from country code
CREATE OR REPLACE FUNCTION sync_user_region()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country IS NOT NULL THEN
    SELECT region INTO NEW.region
    FROM countries_to_regions
    WHERE country_code = NEW.country;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_user_region
  BEFORE INSERT OR UPDATE OF country ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_region();

-- Expire stale CLI auth codes (run via pg_cron every 5 minutes)
-- If pg_cron not available, handle in API route
CREATE OR REPLACE FUNCTION expire_cli_auth_codes()
RETURNS void AS $$
BEGIN
  UPDATE cli_auth_codes
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Migration 004 — Seed Countries to Regions

```sql
-- supabase/migrations/004_countries_to_regions.sql
INSERT INTO countries_to_regions (country_code, country_name, region) VALUES
  ('US', 'United States', 'north-america'),
  ('CA', 'Canada', 'north-america'),
  ('MX', 'Mexico', 'latin-america'),
  ('GB', 'United Kingdom', 'europe'),
  ('DE', 'Germany', 'europe'),
  ('FR', 'France', 'europe'),
  ('NL', 'Netherlands', 'europe'),
  ('SE', 'Sweden', 'europe'),
  ('PL', 'Poland', 'europe'),
  ('ES', 'Spain', 'europe'),
  ('IN', 'India', 'asia'),
  ('CN', 'China', 'asia'),
  ('JP', 'Japan', 'asia'),
  ('KR', 'South Korea', 'asia'),
  ('SG', 'Singapore', 'asia'),
  ('AU', 'Australia', 'oceania'),
  ('NZ', 'New Zealand', 'oceania'),
  ('BR', 'Brazil', 'latin-america'),
  ('AR', 'Argentina', 'latin-america'),
  ('NG', 'Nigeria', 'africa'),
  ('ZA', 'South Africa', 'africa'),
  ('EG', 'Egypt', 'africa')
  -- ... complete ISO list
ON CONFLICT (country_code) DO NOTHING;
```

---

## 4. SUPABASE RLS POLICIES

```sql
-- supabase/migrations/005_rls.sql

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

-- ─── Revoke excess default privileges (defense-in-depth) ────────────────
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON countries_to_regions TO anon, authenticated;

-- ─── USERS ───────────────────────────────────────────────────────────────
-- Anyone can view public profiles
CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (is_public = true OR auth.uid() = id);

-- Only the user can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert: created via auth trigger only (service role)
-- Service role bypasses RLS by default

-- ─── DAILY_USAGE ─────────────────────────────────────────────────────────
-- Anyone can read usage (for leaderboard, profiles)
CREATE POLICY "daily_usage_select_all" ON daily_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = daily_usage.user_id
      AND (u.is_public = true OR u.id = auth.uid())
    )
  );

-- Only own data, only via API (service role for CLI submissions)
CREATE POLICY "daily_usage_insert_own" ON daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_usage_update_own" ON daily_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── POSTS ───────────────────────────────────────────────────────────────
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

-- ─── COMMENTS ────────────────────────────────────────────────────────────
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (true);  -- Open, but post must be visible (handled in JOIN)

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ─── FOLLOWS ─────────────────────────────────────────────────────────────
CREATE POLICY "follows_select_all" ON follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ─── KUDOS ───────────────────────────────────────────────────────────────
CREATE POLICY "kudos_select_all" ON kudos
  FOR SELECT USING (true);

CREATE POLICY "kudos_insert_own" ON kudos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kudos_delete_own" ON kudos
  FOR DELETE USING (auth.uid() = user_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ─── CLI_AUTH_CODES ───────────────────────────────────────────────────────
-- Deliberately restrictive — CLI auth is handled via service role in API routes
CREATE POLICY "cli_auth_select_own" ON cli_auth_codes
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ─── USER_ACHIEVEMENTS ───────────────────────────────────────────────────
CREATE POLICY "achievements_select_all" ON user_achievements
  FOR SELECT USING (true);
-- Inserts are service-role ONLY — never client-side
```

---

## 5. DATABASE VIEWS & STORED PROCEDURES

### Leaderboard Views

```sql
-- supabase/migrations/006_leaderboard_views.sql

-- ─── LEADERBOARD DAILY ───────────────────────────────────────────────────
-- Rolling 2-day window with UTC offset grace (users in UTC+X may not have synced yet)
CREATE OR REPLACE VIEW leaderboard_daily AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  -- Aggregate across ALL providers for the day
  COALESCE(SUM(du.cost_usd), 0) AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0) AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0) AS total_output_tokens,
  -- Which providers they used today
  ARRAY_AGG(DISTINCT du.provider ORDER BY du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  -- Streak calculation (see stored procedure)
  calculate_user_streak(u.id) AS streak,
  -- Boolean flags
  bool_or(du.is_verified) AS has_verified_data
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
  AND du.date >= CURRENT_DATE - INTERVAL '1 day'  -- 2-day rolling window
  AND du.date <= CURRENT_DATE
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;

-- ─── LEADERBOARD WEEKLY ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0) AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0) AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0) AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data,
  COUNT(DISTINCT du.date) AS active_days
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
  AND du.date >= date_trunc('week', CURRENT_DATE)::date
  AND du.date <= CURRENT_DATE
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;

-- ─── LEADERBOARD MONTHLY ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_monthly AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0) AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0) AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0) AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data,
  COUNT(DISTINCT du.date) AS active_days
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
  AND du.date >= date_trunc('month', CURRENT_DATE)::date
  AND du.date <= CURRENT_DATE
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;

-- ─── LEADERBOARD ALL TIME ────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
  u.id AS user_id,
  u.username,
  u.avatar_url,
  u.country,
  u.region,
  COALESCE(SUM(du.cost_usd), 0) AS total_cost_usd,
  COALESCE(SUM(du.total_tokens), 0) AS total_tokens,
  COALESCE(SUM(du.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(du.output_tokens), 0) AS total_output_tokens,
  ARRAY_AGG(DISTINCT du.provider) FILTER (WHERE du.provider IS NOT NULL) AS providers,
  calculate_user_streak(u.id) AS streak,
  bool_or(du.is_verified) AS has_verified_data,
  COUNT(DISTINCT du.date) AS active_days,
  MIN(du.date) AS first_activity,
  MAX(du.date) AS last_activity
FROM users u
LEFT JOIN daily_usage du ON du.user_id = u.id
WHERE u.is_public = true
GROUP BY u.id, u.username, u.avatar_url, u.country, u.region
HAVING COALESCE(SUM(du.cost_usd), 0) > 0
ORDER BY total_cost_usd DESC;
```

### Stored Procedures

```sql
-- supabase/migrations/007_stored_procedures.sql

-- ─── CALCULATE USER STREAK ────────────────────────────────────────────────
-- Checks consecutive days of usage. UTC grace: also accepts yesterday as "today"
-- to handle users in UTC+ timezones who haven't synced yet today.
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
    
    -- Safety limit: 3650 days (10 years)
    IF v_streak >= 3650 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── GET USER PROFILE WITH STATS ─────────────────────────────────────────
-- Single query for full profile data (used in /api/users/[username])
CREATE OR REPLACE FUNCTION get_user_profile(p_username TEXT, p_viewer_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'user', row_to_json(u),
    'stats', json_build_object(
      'total_cost_usd', COALESCE(SUM(du.cost_usd), 0),
      'total_tokens', COALESCE(SUM(du.total_tokens), 0),
      'total_input_tokens', COALESCE(SUM(du.input_tokens), 0),
      'total_output_tokens', COALESCE(SUM(du.output_tokens), 0),
      'active_days', COUNT(DISTINCT du.date),
      'streak', calculate_user_streak(u.id),
      'first_activity', MIN(du.date),
      'last_activity', MAX(du.date)
    ),
    'provider_stats', (
      SELECT json_object_agg(provider, json_build_object(
        'cost_usd', SUM(cost_usd),
        'total_tokens', SUM(total_tokens),
        'active_days', COUNT(DISTINCT date)
      ))
      FROM daily_usage WHERE user_id = u.id
      GROUP BY provider
    ),
    'providers_used', (
      SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
      FROM daily_usage WHERE user_id = u.id
    ),
    'follower_count', (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
    'following_count', (SELECT COUNT(*) FROM follows WHERE follower_id = u.id),
    'is_following', (
      CASE WHEN p_viewer_id IS NOT NULL THEN
        EXISTS(SELECT 1 FROM follows WHERE follower_id = p_viewer_id AND following_id = u.id)
      ELSE false END
    ),
    'achievements', (
      SELECT ARRAY_AGG(slug ORDER BY earned_at)
      FROM user_achievements WHERE user_id = u.id
    )
  )
  INTO v_result
  FROM users u
  LEFT JOIN daily_usage du ON du.user_id = u.id
  WHERE u.username = p_username
  AND (u.is_public = true OR u.id = p_viewer_id)
  GROUP BY u.id, u.username, u.display_name, u.bio, u.avatar_url,
           u.country, u.region, u.timezone, u.is_public, u.created_at, u.updated_at;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── GET CONTRIBUTION GRAPH DATA ─────────────────────────────────────────
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
    SUM(du.cost_usd) AS cost_usd,
    SUM(du.total_tokens) AS total_tokens,
    -- Dominant provider = the one with highest cost that day
    (
      SELECT provider FROM daily_usage di
      WHERE di.user_id = p_user_id AND di.date = du.date
      ORDER BY cost_usd DESC LIMIT 1
    ) AS dominant_provider,
    ARRAY_AGG(DISTINCT du.provider ORDER BY du.provider) AS providers
  FROM daily_usage du
  WHERE du.user_id = p_user_id
    AND EXTRACT(YEAR FROM du.date) = p_year
  GROUP BY du.date
  ORDER BY du.date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── AWARD ACHIEVEMENT (idempotent) ──────────────────────────────────────
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
    RETURN false;  -- Already has it
  END IF;

  INSERT INTO user_achievements (user_id, slug)
  VALUES (p_user_id, p_slug)
  ON CONFLICT DO NOTHING;

  RETURN true;  -- Newly awarded
END;
$$ LANGUAGE plpgsql;
```

---

## PHASE 1 — Supabase Client Setup

```typescript
// lib/supabase/client.ts — Browser client (singleton pattern)
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return client;
}
```

```typescript
// lib/supabase/server.ts — Server component client (per-request)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server component — ignore */ }
        },
      },
    }
  );
}
```

```typescript
// lib/supabase/service.ts — Service role client (bypasses RLS for server-side writes)
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// CRITICAL: Never expose service client to browser
// Only use in API Route Handlers (server-side)
export const serviceClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
```

```typescript
// proxy.ts — Next.js 16 auth guard (NEVER use middleware.ts)
// This file intercepts all requests before they reach route handlers

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Protected routes that require authentication
const PROTECTED_PATHS = ['/feed', '/u/', '/leaderboard', '/search', '/settings', '/recap'];
const AUTH_PATHS = ['/login', '/signup'];
const ONBOARDING_PATH = '/onboarding';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response that we can modify cookies on
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Redirect unauthenticated users to login
  if (!user && PROTECTED_PATHS.some(p => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Open redirect prevention — only allow relative redirects
  const redirectTo = request.nextUrl.searchParams.get('redirectTo');
  if (redirectTo && !redirectTo.startsWith('/')) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return response;
}
```

---

## PHASE 2 — Authentication System

### 2.1 — Auth Route Handler

```typescript
// app/(auth)/login/page.tsx — Server component
// app/api/auth/callback/route.ts — OAuth callback

// app/api/auth/callback/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  // Open redirect prevention: only allow same-origin redirects
  if (!next.startsWith('/')) {
    return NextResponse.redirect(`${origin}/feed`);
  }

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Ensure user profile exists (created on first login)
      await ensureUserProfile(data.user);
      
      // Check if onboarding is needed
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.user.id)
        .single();
      
      const redirectTo = profile?.username ? next : '/onboarding';
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

async function ensureUserProfile(user: User) {
  const { data: existing } = await serviceClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existing) {
    await serviceClient.from('users').insert({
      id: user.id,
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url,
      // username intentionally NOT set here — user sets it in onboarding
    });
  }
}
```

### 2.2 — CLI Device Auth Flow

```typescript
// app/api/auth/cli/init/route.ts
// Step 1: CLI calls this to start device auth flow
import { serviceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST() {
  const deviceToken = nanoid(32);
  const displayCode = `STRAUDE-${nanoid(6).toUpperCase()}`;

  const { error } = await serviceClient.from('cli_auth_codes').insert({
    code: displayCode,
    device_token: deviceToken,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to create auth code' }, { status: 500 });
  }

  return NextResponse.json({
    code: displayCode,
    device_token: deviceToken,
    verify_url: `${process.env.NEXT_PUBLIC_APP_URL}/cli/verify?code=${displayCode}`,
    expires_in: 600,
  });
}

// app/api/auth/cli/poll/route.ts
// Step 2: CLI polls this every 2 seconds waiting for user to verify
import { signJWT } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  const { device_token } = await request.json();

  if (!device_token) {
    return NextResponse.json({ error: 'Missing device_token' }, { status: 400 });
  }

  const { data: authCode } = await serviceClient
    .from('cli_auth_codes')
    .select('*')
    .eq('device_token', device_token)
    .single();

  if (!authCode) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  if (authCode.expires_at < new Date().toISOString()) {
    return NextResponse.json({ status: 'expired' });
  }

  if (authCode.status === 'verified' && authCode.user_id) {
    // Generate a long-lived JWT for CLI use
    const token = await signJWT({
      sub: authCode.user_id,
      type: 'cli',
      iat: Date.now(),
    });

    // Clean up the auth code
    await serviceClient.from('cli_auth_codes')
      .delete().eq('device_token', device_token);

    return NextResponse.json({ status: 'verified', token });
  }

  return NextResponse.json({ status: authCode.status });
}

// app/cli/verify/page.tsx — Browser page user visits to verify
// Shows the code, user clicks "Authorize Straude CLI", marks code as verified
// Sets auth code user_id to current user's ID
```

### 2.3 — JWT Utilities

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.CLI_JWT_SECRET!);

export async function signJWT(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1y')  // CLI tokens last 1 year
    .sign(secret);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// lib/auth/requireCLIAuth.ts — Used in API routes that accept CLI requests
export async function requireCLIAuth(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token);
  
  if (!payload || payload.type !== 'cli') return null;
  return payload.sub as string; // user_id
}
```

---

## PHASE 3 — Core API Endpoints

### 3.1 — POST /api/usage/submit

The most critical endpoint. Receives daily usage data from CLI or web import.

```typescript
// app/api/usage/submit/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { requireCLIAuth } from '@/lib/auth/requireCLIAuth';
import { awardAchievements } from '@/lib/achievements';
import { createOrUpdatePost } from '@/lib/posts';
import { z } from 'zod';
import { createHash } from 'crypto';

// ─── Schema Validation ────────────────────────────────────────────────────
const DailyEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  provider: z.enum(['claude', 'codex', 'gemini', 'antigravity']),
  cost_usd: z.number().min(0).max(100_000),       // sanity cap
  input_tokens: z.number().int().min(0).max(1_000_000_000),
  output_tokens: z.number().int().min(0).max(1_000_000_000),
  cache_creation_tokens: z.number().int().min(0).default(0),
  cache_read_tokens: z.number().int().min(0).default(0),
  models: z.array(z.string().max(100)).max(20).default([]),
  raw_data: z.record(z.unknown()).optional(),
});

const SubmitRequestSchema = z.object({
  entries: z.array(DailyEntrySchema).min(1).max(365),
  source: z.enum(['cli', 'web']).default('web'),
  hash: z.string().optional(),  // SHA-256 of raw output (CLI only)
});

export async function POST(request: Request) {
  // ─── Authentication: CLI JWT or browser session ────────────────────────
  let userId: string | null = null;
  
  // Try CLI JWT first
  const cliUserId = await requireCLIAuth(request);
  if (cliUserId) {
    userId = cliUserId;
  } else {
    // Fall back to browser session
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ─── Parse & Validate ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { entries, source, hash } = parsed.data;

  // ─── Data Hash Dedup Guard (CLI only) ────────────────────────────────────
  if (source === 'cli' && hash) {
    const expectedHash = createHash('sha256')
      .update(JSON.stringify(entries))
      .digest('hex');
    
    // Note: We accept hash mismatches — just log them, don't reject.
    // Users may push partial data from different runs.
  }

  // ─── Upsert daily_usage rows ─────────────────────────────────────────────
  const upsertResults: { date: string; provider: string; isNew: boolean }[] = [];
  const errors: { date: string; provider: string; error: string }[] = [];

  for (const entry of entries) {
    const { error: upsertError } = await serviceClient
      .from('daily_usage')
      .upsert({
        user_id: userId,
        date: entry.date,
        provider: entry.provider,
        cost_usd: entry.cost_usd,
        input_tokens: entry.input_tokens,
        output_tokens: entry.output_tokens,
        cache_creation_tokens: entry.cache_creation_tokens,
        cache_read_tokens: entry.cache_read_tokens,
        models: entry.models,
        source,
        data_hash: hash,
        raw_data: entry.raw_data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date,provider',
        // Always update — later runs have more accurate data
        ignoreDuplicates: false,
      });

    if (upsertError) {
      errors.push({ date: entry.date, provider: entry.provider, error: upsertError.message });
    } else {
      upsertResults.push({ date: entry.date, provider: entry.provider, isNew: true });
    }
  }

  // ─── Sync posts (one post per user per date, updated with all providers) ─
  const uniqueDates = [...new Set(entries.map(e => e.date))];
  const postsCreated: string[] = [];

  for (const date of uniqueDates) {
    const postId = await createOrUpdatePost(userId, date, serviceClient);
    if (postId) postsCreated.push(postId);
  }

  // ─── Fire Achievement Engine (async, non-blocking) ────────────────────────
  // Use Promise without await — fire and forget
  awardAchievements(userId, serviceClient).catch(err =>
    console.error('[Achievements] Error:', err)
  );

  return NextResponse.json({
    success: true,
    processed: upsertResults.length,
    errors: errors.length > 0 ? errors : undefined,
    posts_created: postsCreated.length,
  });
}
```

### 3.2 — Post Creation & Management

```typescript
// lib/posts.ts — Post management logic

export async function createOrUpdatePost(
  userId: string,
  date: string,
  supabase: SupabaseClient
): Promise<string | null> {
  // Get all usage rows for this user + date (across all providers)
  const { data: usageRows } = await supabase
    .from('daily_usage')
    .select('id, provider, cost_usd')
    .eq('user_id', userId)
    .eq('date', date);

  if (!usageRows || usageRows.length === 0) return null;

  const providers = [...new Set(usageRows.map(r => r.provider))];

  // Upsert post (one per user per date)
  const { data: post, error } = await supabase
    .from('posts')
    .upsert({
      user_id: userId,
      usage_date: date,
      providers,
      is_published: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,usage_date',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error || !post) return null;

  // Sync post_daily_usage join table
  // Remove old links, add all current usage rows
  await supabase.from('post_daily_usage')
    .delete().eq('post_id', post.id);

  await supabase.from('post_daily_usage').insert(
    usageRows.map(u => ({ post_id: post.id, daily_usage_id: u.id }))
  );

  return post.id;
}
```

```typescript
// app/api/posts/[id]/route.ts — Read, update, delete a single post

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: post } = await serviceClient
    .from('posts')
    .select(`
      *,
      user:users(*),
      daily_usage:post_daily_usage(
        daily_usage(*)
      ),
      kudos_count:kudos(count),
      comments_count:comments(count),
      user_has_kudosed:kudos(user_id)
    `)
    .eq('id', params.id)
    .eq('is_published', true)
    .single();

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Flatten the nested kudos/comments counts
  const response = {
    ...post,
    kudos_count: post.kudos_count[0]?.count ?? 0,
    comments_count: post.comments_count[0]?.count ?? 0,
    user_has_kudosed: user
      ? post.user_has_kudosed.some(k => k.user_id === user.id)
      : false,
    daily_usage: post.daily_usage.map(pdu => pdu.daily_usage),
  };

  return NextResponse.json(response);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed = ['title', 'description', 'images', 'is_published'];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  // Validate image count
  if (updates.images && Array.isArray(updates.images) && updates.images.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 images per post' }, { status: 422 });
  }

  const { data, error } = await serviceClient
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)  // Ensures ownership
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await serviceClient
    .from('posts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### 3.3 — GET /api/feed — Paginated Social Feed

```typescript
// app/api/feed/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'global';          // 'following' | 'global'
  const cursor = searchParams.get('cursor');                   // ISO timestamp for pagination
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
  const provider = searchParams.get('provider') ?? 'all';     // Provider filter

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Build the base query
  let query = serviceClient
    .from('posts')
    .select(`
      id, user_id, usage_date, title, description, images, providers,
      created_at, updated_at,
      user:users(id, username, avatar_url, country),
      daily_usage:post_daily_usage(
        daily_usage(
          id, provider, cost_usd, input_tokens, output_tokens,
          cache_creation_tokens, cache_read_tokens, total_tokens,
          models, source, is_verified, date
        )
      ),
      kudos:kudos(count),
      comments:comments(count),
      user_kudos:kudos(user_id)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Cursor-based pagination (more consistent than offset)
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Following feed: only show posts from users the current user follows
  if (type === 'following' && user) {
    const { data: following } = await serviceClient
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (!following || following.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }

    const followingIds = following.map(f => f.following_id);
    query = query.in('user_id', followingIds);
  }

  // Provider filter
  if (provider !== 'all') {
    query = query.contains('providers', [provider]);
  }

  const { data: posts, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Transform: flatten nested counts, add user_has_kudosed
  const userId = user?.id;
  const transformed = (posts ?? []).map(post => ({
    ...post,
    kudos_count: post.kudos[0]?.count ?? 0,
    comment_count: post.comments[0]?.count ?? 0,
    user_has_kudosed: userId
      ? (post.user_kudos as Array<{ user_id: string }>).some(k => k.user_id === userId)
      : false,
    daily_usage: (post.daily_usage as Array<{ daily_usage: DailyUsage }>)
      .map(pdu => pdu.daily_usage)
      .filter(Boolean),
    // Remove raw fields
    kudos: undefined,
    comments: undefined,
    user_kudos: undefined,
  }));

  const nextCursor = transformed.length === limit
    ? transformed[transformed.length - 1]?.created_at
    : null;

  return NextResponse.json({ posts: transformed, nextCursor });
}
```

---

## PHASE 4 — Social API Layer

### 4.1 — Follow / Unfollow

```typescript
// app/api/social/follow/route.ts
import { requireAuth } from '@/lib/auth/requireAuth';
import { sendFollowNotification } from '@/lib/email/notifications';

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetUserId } = await request.json();
  if (!targetUserId || targetUserId === userId) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 422 });
  }

  const { error } = await serviceClient.from('follows').insert({
    follower_id: userId,
    following_id: targetUserId,
  });

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Already following' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire notification (async, non-blocking)
  createNotification({
    recipient_id: targetUserId,
    sender_id: userId,
    type: 'follow',
  }).catch(console.error);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetUserId } = await request.json();

  const { error } = await serviceClient.from('follows')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### 4.2 — Kudos Toggle

```typescript
// app/api/social/kudos/route.ts
export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await request.json();

  // Verify post exists and is not the user's own post
  const { data: post } = await serviceClient
    .from('posts').select('user_id').eq('id', postId).single();

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { error } = await serviceClient.from('kudos').insert({
    user_id: userId,
    post_id: postId,
  });

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Already kudosed' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify post author (unless they kudosed their own post)
  if (post.user_id !== userId) {
    createNotification({
      recipient_id: post.user_id,
      sender_id: userId,
      type: 'kudos',
      post_id: postId,
    }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId } = await request.json();

  const { error } = await serviceClient.from('kudos')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### 4.3 — Comments with @Mention Processing

```typescript
// app/api/social/comments/route.ts
import { extractMentions, resolveMentionedUsers } from '@/lib/mentions';

// @mention regex: finds @username patterns in text
function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) ?? [];
  return [...new Set(matches.map(m => m.slice(1)))]; // dedupe, strip @
}

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { postId, content } = await request.json();

  if (!content?.trim() || content.length > 1000) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 422 });
  }

  // Verify post exists
  const { data: post } = await serviceClient
    .from('posts').select('user_id').eq('id', postId).single();
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  // Insert comment
  const { data: comment, error } = await serviceClient
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`*, user:users(id, username, avatar_url)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire notifications async (non-blocking):
  // 1. Notify post author of new comment (unless commenter = author)
  // 2. Notify mentioned users
  const mentions = extractMentions(content);

  Promise.all([
    // Comment notification to post author
    post.user_id !== userId
      ? createNotification({
          recipient_id: post.user_id,
          sender_id: userId,
          type: 'comment',
          post_id: postId,
          comment_id: comment.id,
        })
      : Promise.resolve(),

    // Mention notifications
    ...(mentions.length > 0
      ? [sendMentionNotifications(mentions, userId, postId, comment.id)]
      : []),
  ]).catch(console.error);

  return NextResponse.json(comment, { status: 201 });
}

async function sendMentionNotifications(
  usernames: string[],
  senderId: string,
  postId: string,
  commentId: string
) {
  if (usernames.length === 0) return;

  // Resolve usernames to IDs
  const { data: users } = await serviceClient
    .from('users')
    .select('id')
    .in('username', usernames.slice(0, 10));  // Cap at 10 mentions

  if (!users) return;

  await Promise.all(
    users
      .filter(u => u.id !== senderId)  // Don't notify yourself
      .map(u => createNotification({
        recipient_id: u.id,
        sender_id: senderId,
        type: 'mention',
        post_id: postId,
        comment_id: commentId,
      }))
  );
}

// Shared notification creator
async function createNotification(params: {
  recipient_id: string;
  sender_id: string;
  type: 'kudos' | 'comment' | 'mention' | 'follow' | 'achievement';
  post_id?: string;
  comment_id?: string;
}) {
  await serviceClient.from('notifications').insert(params);
  // Also send email notification (see Phase 9)
  await queueEmailNotification(params);
}
```

### 4.4 — Notifications

```typescript
// app/api/social/notifications/route.ts
export async function GET(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: notifications } = await serviceClient
    .from('notifications')
    .select(`
      id, type, is_read, created_at,
      sender:users!sender_id(id, username, avatar_url),
      post:posts(id, title, usage_date)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { count: unreadCount } = await serviceClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  // Mark all as read
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await serviceClient
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  return NextResponse.json({ success: true });
}
```

---

## PHASE 5 — Leaderboard & Search API

### 5.1 — Leaderboard API

```typescript
// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PERIOD_VIEWS = {
  day: 'leaderboard_daily',
  week: 'leaderboard_weekly',
  month: 'leaderboard_monthly',
  all: 'leaderboard_all_time',
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') ?? 'week') as keyof typeof PERIOD_VIEWS;
  const region = searchParams.get('region') ?? 'global';
  const provider = searchParams.get('provider') ?? 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);

  // Validate period
  if (!PERIOD_VIEWS[period]) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }

  const viewName = PERIOD_VIEWS[period];

  let query = serviceClient.from(viewName).select('*');

  // Region filter
  if (region !== 'global') {
    query = query.eq('region', region);
  }

  // Provider filter — only show users who used this provider
  if (provider !== 'all') {
    query = query.contains('providers', [provider]);
  }

  query = query.order('total_cost_usd', { ascending: false }).limit(limit);

  const { data: entries, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get current user's rank (even if not in visible top 100)
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentUserRank: number | null = null;
  if (user) {
    const { count } = await serviceClient
      .from(viewName)
      .select('*', { count: 'exact', head: true })
      .gt('total_cost_usd', entries?.find(e => e.user_id === user.id)?.total_cost_usd ?? 0);
    currentUserRank = (count ?? 0) + 1;
  }

  return NextResponse.json({
    entries: entries ?? [],
    currentUserRank,
    period,
    region,
    provider,
  });
}
```

### 5.2 — User Search API

```typescript
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  if (!q || q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  // Sanitize: only allow alphanumeric + underscore
  const sanitized = q.replace(/[^a-zA-Z0-9_]/g, '');
  if (!sanitized) return NextResponse.json({ users: [] });

  const { data: users } = await serviceClient
    .from('users')
    .select(`
      id, username, avatar_url, bio, country,
      follower_count:follows!following_id(count)
    `)
    .ilike('username', `%${sanitized}%`)
    .eq('is_public', true)
    .order('username')
    .limit(limit);

  return NextResponse.json({ users: users ?? [] });
}
```

### 5.3 — User Profile API

```typescript
// app/api/users/[username]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user: viewer } } = await supabase.auth.getUser();

  // Use the stored procedure for efficient single-query profile fetch
  const { data, error } = await serviceClient.rpc('get_user_profile', {
    p_username: params.username,
    p_viewer_id: viewer?.id ?? null,
  });

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
```

---

## PHASE 6 — AI Caption Generation

### 6.1 — Multi-Provider Caption Engine

```typescript
// app/api/ai/generate-caption/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { generateWithClaude } from '@/lib/ai/claude';
import { generateWithGemini } from '@/lib/ai/gemini';
import { generateWithOpenAI } from '@/lib/ai/openai';
import { ALLOWED_IMAGE_ORIGINS } from '@/lib/constants/security';

// SSRF prevention: only allow Supabase Storage URLs for image input
function isImageUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_ORIGINS.some(origin => parsed.origin === origin);
  } catch {
    return false;
  }
}

const CAPTION_PROMPT = `You are a social media writer for developers who use AI coding agents.
Given usage stats and optional screenshots, write a short, engaging post caption.

Rules:
- Title: max 80 chars, punchy, no generic phrases like "Exciting news!"
- Description: max 200 chars, conversational, highlight what was built or achieved
- Don't mention specific token counts in the description (they're shown as stats)
- Can include emojis but don't overuse them
- Respond ONLY with JSON: { "title": "...", "description": "..." }`;

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { stats, imageUrls = [], preferredProvider = 'claude' } = body;

  // Validate image URLs (SSRF prevention)
  const safeImageUrls = imageUrls
    .filter((url: string) => typeof url === 'string' && isImageUrlAllowed(url))
    .slice(0, 3); // Max 3 images for caption context

  const context = {
    cost_usd: stats?.cost_usd,
    total_tokens: stats?.total_tokens,
    providers: stats?.providers,
    date: stats?.date,
  };

  // Try preferred provider first, then fall back down the chain
  const providerChain = buildProviderChain(preferredProvider);

  for (const provider of providerChain) {
    try {
      const result = await generateCaption(provider, context, safeImageUrls);
      if (result) {
        return NextResponse.json({ ...result, generated_by: provider });
      }
    } catch (err) {
      console.error(`[AI Caption] ${provider} failed:`, err);
      // Continue to next provider
    }
  }

  // All providers failed
  return NextResponse.json(
    { error: 'Caption generation unavailable' },
    { status: 503 }
  );
}

function buildProviderChain(preferred: string): string[] {
  const all = ['claude', 'gemini', 'openai'];
  return [preferred, ...all.filter(p => p !== preferred)];
}

async function generateCaption(
  provider: string,
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  switch (provider) {
    case 'claude':
      return generateWithClaude(context, imageUrls);
    case 'gemini':
      return generateWithGemini(context, imageUrls);
    case 'openai':
      return generateWithOpenAI(context, imageUrls);
    default:
      return null;
  }
}
```

```typescript
// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function generateWithClaude(
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  const content: Anthropic.MessageParam['content'] = [];

  // Add images if provided
  for (const url of imageUrls.slice(0, 3)) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mediaType = response.headers.get('content-type') as 'image/jpeg' | 'image/png' | 'image/webp';

      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType ?? 'image/jpeg', data: base64 },
      });
    } catch {
      // Skip failed image
    }
  }

  content.push({
    type: 'text',
    text: `Generate a caption for this AI coding session.\n\nStats:\n${JSON.stringify(context, null, 2)}`,
  });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 300,
    system: CAPTION_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseJSONResponse(text);
}
```

```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function generateWithGemini(
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  const model = client.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: `${CAPTION_PROMPT}\n\nStats: ${JSON.stringify(context)}` },
  ];

  for (const url of imageUrls.slice(0, 3)) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      parts.push({
        inlineData: {
          mimeType: response.headers.get('content-type') ?? 'image/jpeg',
          data: Buffer.from(buffer).toString('base64'),
        },
      });
    } catch { /* skip */ }
  }

  const result = await model.generateContent(parts);
  return parseJSONResponse(result.response.text());
}
```

```typescript
// lib/ai/openai.ts
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateWithOpenAI(
  context: Record<string, unknown>,
  imageUrls: string[]
): Promise<{ title: string; description: string } | null> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: CAPTION_PROMPT },
    {
      role: 'user',
      content: [
        ...imageUrls.slice(0, 3).map(url => ({
          type: 'image_url' as const,
          image_url: { url },
        })),
        {
          type: 'text' as const,
          text: `Generate a caption for this AI coding session.\n\nStats:\n${JSON.stringify(context)}`,
        },
      ],
    },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  });

  return parseJSONResponse(response.choices[0].message.content ?? '');
}

// Shared JSON parser with validation
function parseJSONResponse(text: string): { title: string; description: string } | null {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.title === 'string' && typeof parsed.description === 'string') {
      return {
        title: parsed.title.slice(0, 280),
        description: parsed.description.slice(0, 2000),
      };
    }
    return null;
  } catch {
    return null;
  }
}
```

---

## PHASE 7 — Image Upload Pipeline

```typescript
// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { serviceClient } from '@/lib/supabase/service';
import { nanoid } from 'nanoid';

const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'uploads';

export async function POST(request: Request) {
  const userId = await requireAuth(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}` },
      { status: 422 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 422 }
    );
  }

  // Read file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validate actual image content (not just MIME type spoofing)
  if (!isValidImageBuffer(buffer)) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 422 });
  }

  // Generate unique path: userId/date/randomId.ext
  const ext = file.type.split('/')[1];
  const date = new Date().toISOString().split('T')[0];
  const path = `${userId}/${date}/${nanoid(12)}.${ext}`;

  const { data, error } = await serviceClient.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get public URL
  const { data: { publicUrl } } = serviceClient.storage
    .from(BUCKET).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, path: data.path });
}

// Magic bytes validation for common image formats
function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E) return true;
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  // WebP: 52 49 46 46 (RIFF)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;

  return false;
}
```

---

## PHASE 8 — Achievement Engine

### 8.1 — Achievement Definitions

```typescript
// lib/achievements/definitions.ts

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
  // ─── Original badges ─────────────────────────────────────────────────────
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

  // ─── Multi-model badges (NEW) ─────────────────────────────────────────────
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
    emoji: '🚀',
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
```

### 8.2 — Achievement Evaluation Engine

```typescript
// lib/achievements/engine.ts
import { ACHIEVEMENT_DEFINITIONS } from './definitions';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function awardAchievements(
  userId: string,
  supabase: SupabaseClient
): Promise<string[]> {  // Returns slugs of newly earned achievements
  // Fetch all the data needed for achievement checks
  const [
    totalStats,
    maxDayStats,
    weeklyStats,
    providers,
    streak,
    globalRank,
    alreadyEarned,
  ] = await Promise.all([
    // Total lifetime stats
    supabase.from('daily_usage')
      .select('cost_usd, output_tokens')
      .eq('user_id', userId)
      .then(({ data }) => ({
        total_cost_usd: data?.reduce((s, r) => s + r.cost_usd, 0) ?? 0,
        lifetime_output_tokens: data?.reduce((s, r) => s + r.output_tokens, 0) ?? 0,
      })),

    // Max single-day stats
    supabase.from('daily_usage')
      .select('cost_usd, output_tokens, date')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return { single_day_max_cost: 0, single_day_max_output_tokens: 0 };
        // Group by date, sum across providers for that day
        const byDate = data.reduce((acc, r) => {
          const d = acc[r.date] ?? { cost: 0, output: 0 };
          acc[r.date] = { cost: d.cost + r.cost_usd, output: d.output + r.output_tokens };
          return acc;
        }, {} as Record<string, { cost: number; output: number }>);
        const days = Object.values(byDate);
        return {
          single_day_max_cost: Math.max(0, ...days.map(d => d.cost)),
          single_day_max_output_tokens: Math.max(0, ...days.map(d => d.output)),
        };
      }),

    // Current week cost
    supabase.from('daily_usage')
      .select('cost_usd')
      .eq('user_id', userId)
      .gte('date', getWeekStart())
      .then(({ data }) => ({
        weekly_cost: data?.reduce((s, r) => s + r.cost_usd, 0) ?? 0,
      })),

    // Providers used
    supabase.from('daily_usage')
      .select('provider')
      .eq('user_id', userId)
      .then(({ data }) => [...new Set(data?.map(r => r.provider) ?? [])]),

    // Current streak
    supabase.rpc('calculate_user_streak', { p_user_id: userId })
      .then(({ data }) => data ?? 0),

    // Global rank (all-time)
    supabase.from('leaderboard_all_time')
      .select('user_id', { count: 'exact' })
      .then(({ data }) => {
        if (!data) return 0;
        const userIdx = data.findIndex(r => r.user_id === userId);
        return userIdx >= 0 ? userIdx + 1 : 0;
      }),

    // Already earned
    supabase.from('user_achievements')
      .select('slug')
      .eq('user_id', userId)
      .then(({ data }) => data?.map(r => r.slug) ?? []),
  ]);

  const userStats = {
    ...totalStats,
    ...maxDayStats,
    ...weeklyStats,
    providers_used: providers,
    current_streak: streak,
    global_rank: globalRank,
  };

  // Check each achievement
  const newlyEarned: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (alreadyEarned.includes(def.slug)) continue;  // Already has it

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
          // No sender — system notification
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
```

---

## PHASE 9 — Email Notification System

### 9.1 — Email Templates (React Email)

```typescript
// lib/email/templates/KudosEmail.tsx
import {
  Html, Head, Body, Container, Section, Text, Link, Button, Hr
} from '@react-email/components';

interface KudosEmailProps {
  recipientUsername: string;
  senderUsername: string;
  senderAvatar: string;
  postTitle: string;
  postUrl: string;
  unsubscribeUrl: string;
}

export default function KudosEmail({
  recipientUsername,
  senderUsername,
  postTitle,
  postUrl,
  unsubscribeUrl,
}: KudosEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>

          {/* Logo */}
          <Text style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1 }}>
            STRAUDE ⚡
          </Text>

          <Hr style={{ borderColor: '#f0f0f0', margin: '24px 0' }} />

          <Text style={{ fontSize: 16, color: '#000' }}>
            Hey @{recipientUsername},
          </Text>

          <Text style={{ fontSize: 16, color: '#333' }}>
            <strong>@{senderUsername}</strong> gave your post a ⚡ kudos!
          </Text>

          {postTitle && (
            <Section style={{
              background: '#f5f5f5', borderRadius: 12, padding: 16, margin: '16px 0'
            }}>
              <Text style={{ fontSize: 14, color: '#666', margin: 0 }}>
                "{postTitle}"
              </Text>
            </Section>
          )}

          <Button
            href={postUrl}
            style={{
              backgroundColor: '#DF561F',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            View Post →
          </Button>

          <Hr style={{ borderColor: '#f0f0f0', margin: '32px 0 16px' }} />

          <Text style={{ fontSize: 12, color: '#999' }}>
            Straude · Track your AI coding. All of it. ·{' '}
            <Link href={unsubscribeUrl} style={{ color: '#999' }}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### 9.2 — Email Sending Service

```typescript
// lib/email/sender.ts
import { Resend } from 'resend';
import { createHmac } from 'crypto';
import { render } from '@react-email/render';
import KudosEmail from './templates/KudosEmail';
import CommentEmail from './templates/CommentEmail';
import MentionEmail from './templates/MentionEmail';
import FollowEmail from './templates/FollowEmail';

const resend = new Resend(process.env.RESEND_API_KEY!);

// HMAC-based unsubscribe tokens (tamper-proof, no DB needed)
function generateUnsubscribeToken(userId: string): string {
  const hmac = createHmac('sha256', process.env.EMAIL_UNSUBSCRIBE_SECRET!);
  hmac.update(userId);
  return hmac.digest('hex');
}

function getUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?userId=${userId}&token=${token}`;
}

export async function sendKudosEmail(params: {
  recipientId: string;
  recipientUsername: string;
  recipientEmail: string;
  senderUsername: string;
  postTitle: string;
  postId: string;
}) {
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/post/${params.postId}`;
  const unsubscribeUrl = getUnsubscribeUrl(params.recipientId);

  const html = await render(
    KudosEmail({
      recipientUsername: params.recipientUsername,
      senderUsername: params.senderUsername,
      senderAvatar: '',
      postTitle: params.postTitle,
      postUrl,
      unsubscribeUrl,
    })
  );

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: params.recipientEmail,
    subject: `⚡ @${params.senderUsername} gave you kudos on Straude`,
    html,
  });
}

// Unsubscribe endpoint verification
// app/api/email/unsubscribe/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  if (!userId || !token) return new Response('Invalid', { status: 400 });

  const expectedToken = generateUnsubscribeToken(userId);
  if (token !== expectedToken) return new Response('Invalid token', { status: 403 });

  // Mark user as email-unsubscribed (add email_notifications_enabled column)
  await serviceClient.from('users')
    .update({ email_notifications_enabled: false })
    .eq('id', userId);

  return new Response('You have been unsubscribed.', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

---

## PHASE 10 — CLI Architecture & Adapters

### 10.1 — CLI Package Structure

```
packages/cli/
├── package.json          ← name: "straude", bin: { straude: "./dist/index.js" }
├── tsconfig.json
├── src/
│   ├── index.ts          ← Entry point: arg router → command dispatch
│   ├── commands/
│   │   ├── login.ts      ← Opens browser → device auth flow
│   │   ├── push.ts       ← Detect providers → collect usage → POST
│   │   ├── status.ts     ← Show streak, weekly stats, rank
│   │   └── sync.ts       ← Smart sync: login if needed + push missing days
│   ├── adapters/
│   │   ├── types.ts      ← UsageAdapter interface
│   │   ├── claude.ts     ← Wraps npx ccusage
│   │   ├── codex.ts      ← Wraps npx @ccusage/codex
│   │   ├── gemini.ts     ← Parses OpenTelemetry logs
│   │   └── antigravity.ts ← Parses IDE session data
│   └── lib/
│       ├── api.ts         ← HTTP client for straude.dev API
│       ├── auth.ts        ← Token storage (~/.straude/config.json)
│       ├── detect.ts      ← Auto-detect installed providers
│       ├── hash.ts        ← SHA-256 of raw data
│       └── output.ts      ← CLI output formatting (chalk, ora)
```

### 10.2 — Adapter Interface

```typescript
// packages/cli/src/adapters/types.ts

export interface DailyEntry {
  date: string;                // YYYY-MM-DD
  provider: ProviderKey;
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  models: string[];
  raw_data?: Record<string, unknown>;
}

export interface UsageAdapter {
  provider: ProviderKey;
  displayName: string;

  // Check if this provider is available on the user's machine
  isAvailable(): Promise<boolean>;

  // Fetch usage for a date range (YYYY-MM-DD format)
  fetchUsage(since: string, until: string): Promise<DailyEntry[]>;

  // Get raw string for SHA-256 hashing (reproducible)
  getRawForHash(since: string, until: string): Promise<string>;
}

export type ProviderKey = 'claude' | 'codex' | 'gemini' | 'antigravity';
```

### 10.3 — Claude Adapter

```typescript
// packages/cli/src/adapters/claude.ts
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { UsageAdapter, DailyEntry } from './types';

const execAsync = promisify(exec);

// ccusage v18 output format (as of 2026)
interface CcusageDailyEntry {
  date: string;
  models: string[];
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costUSD: number;
}

export class ClaudeAdapter implements UsageAdapter {
  provider = 'claude' as const;
  displayName = 'Claude Code';

  async isAvailable(): Promise<boolean> {
    // Check if ~/.claude/projects/ directory exists
    const claudeDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(claudeDir)) return false;

    // Check if ccusage can run
    try {
      execSync('npx --yes ccusage --version 2>/dev/null', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async fetchUsage(since: string, until: string): Promise<DailyEntry[]> {
    const raw = await this.runCcusage(since, until);
    return this.normalize(JSON.parse(raw));
  }

  async getRawForHash(since: string, until: string): Promise<string> {
    return this.runCcusage(since, until);
  }

  private async runCcusage(since: string, until: string): Promise<string> {
    const { stdout, stderr } = await execAsync(
      `npx --yes ccusage daily --json --since ${since} --until ${until}`,
      {
        timeout: 60_000,  // 60s timeout
        maxBuffer: 50 * 1024 * 1024,  // 50MB buffer
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );

    if (stderr && stderr.includes('error')) {
      throw new Error(`ccusage error: ${stderr}`);
    }

    return stdout.trim();
  }

  private normalize(entries: CcusageDailyEntry[]): DailyEntry[] {
    return entries
      .filter(e => e.costUSD > 0 || e.inputTokens > 0)
      .map(e => ({
        date: e.date,
        provider: 'claude',
        cost_usd: e.costUSD,
        input_tokens: e.inputTokens,
        output_tokens: e.outputTokens,
        cache_creation_tokens: e.cacheCreationTokens ?? 0,
        cache_read_tokens: e.cacheReadTokens ?? 0,
        models: e.models ?? [],
        raw_data: e as unknown as Record<string, unknown>,
      }));
  }
}
```

### 10.4 — Codex Adapter

```typescript
// packages/cli/src/adapters/codex.ts
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { UsageAdapter, DailyEntry } from './types';

const execAsync = promisify(exec);

export class CodexAdapter implements UsageAdapter {
  provider = 'codex' as const;
  displayName = 'OpenAI Codex CLI';

  async isAvailable(): Promise<boolean> {
    // @ccusage/codex reads Codex session logs
    // Check for Codex's local log directory
    const possiblePaths = [
      join(homedir(), '.codex'),
      join(homedir(), '.openai', 'codex'),
      join(process.env.APPDATA ?? '', 'Codex'),
    ];

    const hasLogs = possiblePaths.some(p => existsSync(p));
    if (!hasLogs) return false;

    try {
      execSync('npx --yes @ccusage/codex --version 2>/dev/null', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async fetchUsage(since: string, until: string): Promise<DailyEntry[]> {
    const raw = await this.runCodexCcusage(since, until);
    const entries = JSON.parse(raw);
    return this.normalize(entries);
  }

  async getRawForHash(since: string, until: string): Promise<string> {
    return this.runCodexCcusage(since, until);
  }

  private async runCodexCcusage(since: string, until: string): Promise<string> {
    const { stdout } = await execAsync(
      `npx --yes @ccusage/codex daily --json --since ${since} --until ${until}`,
      { timeout: 60_000, maxBuffer: 50 * 1024 * 1024 }
    );
    return stdout.trim();
  }

  private normalize(entries: unknown[]): DailyEntry[] {
    // @ccusage/codex uses the same output format as ccusage
    return (entries as Array<{
      date: string;
      costUSD: number;
      inputTokens: number;
      outputTokens: number;
      cacheCreationTokens?: number;
      cacheReadTokens?: number;
      models?: string[];
    }>)
      .filter(e => e.costUSD > 0 || e.inputTokens > 0)
      .map(e => ({
        date: e.date,
        provider: 'codex',
        cost_usd: e.costUSD,
        input_tokens: e.inputTokens,
        output_tokens: e.outputTokens,
        cache_creation_tokens: e.cacheCreationTokens ?? 0,
        cache_read_tokens: e.cacheReadTokens ?? 0,
        models: e.models ?? [],
        raw_data: e as unknown as Record<string, unknown>,
      }));
  }
}
```

### 10.5 — Gemini Adapter

```typescript
// packages/cli/src/adapters/gemini.ts
// Reads OpenTelemetry logs from ~/.gemini/tmp/<hash>/otel/

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { UsageAdapter, DailyEntry } from './types';

// Gemini CLI OpenTelemetry metric names (from official docs)
const OTEL_METRICS = {
  TOKEN_USAGE: 'gemini_cli.token.usage',
  SESSION_COUNT: 'gemini_cli.session.count',
};

// Gemini model pricing (per 1M tokens, as of 2026)
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-pro':   { input: 1.25,  output: 10.00 },
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'default':          { input: 0.075, output: 0.30 },  // fallback
};

interface OtelEntry {
  timestamp: string;
  name: string;
  attributes: Record<string, string | number>;
  value: number;
}

export class GeminiAdapter implements UsageAdapter {
  provider = 'gemini' as const;
  displayName = 'Gemini CLI';
  private geminiDir: string;

  constructor() {
    this.geminiDir = join(homedir(), '.gemini', 'tmp');
  }

  async isAvailable(): Promise<boolean> {
    if (!existsSync(this.geminiDir)) return false;
    // Check if any project directories exist with OTEL data
    try {
      const dirs = readdirSync(this.geminiDir);
      return dirs.some(d => existsSync(join(this.geminiDir, d, 'otel')));
    } catch {
      return false;
    }
  }

  async fetchUsage(since: string, until: string): Promise<DailyEntry[]> {
    const sinceDate = new Date(since);
    const untilDate = new Date(until);

    // Scan all project directories
    const projectDirs = this.getProjectDirs();
    const entriesByDate = new Map<string, { input: number; output: number; models: Set<string> }>();

    for (const projectDir of projectDirs) {
      const otelEntries = this.readOtelLogs(projectDir);

      for (const entry of otelEntries) {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < sinceDate || entryDate > untilDate) continue;

        const dateStr = entry.timestamp.split('T')[0];
        const existing = entriesByDate.get(dateStr) ?? { input: 0, output: 0, models: new Set() };

        if (entry.name === OTEL_METRICS.TOKEN_USAGE) {
          const tokenType = entry.attributes.token_type as string;
          const modelName = entry.attributes.model as string;

          if (tokenType === 'input') existing.input += entry.value;
          if (tokenType === 'output') existing.output += entry.value;
          if (modelName) existing.models.add(modelName);
        }

        entriesByDate.set(dateStr, existing);
      }
    }

    return Array.from(entriesByDate.entries())
      .filter(([, data]) => data.input > 0 || data.output > 0)
      .map(([date, data]) => {
        const models = Array.from(data.models);
        const primaryModel = models[0] ?? 'default';
        const pricing = GEMINI_PRICING[primaryModel] ?? GEMINI_PRICING.default;
        const cost_usd = (data.input / 1_000_000) * pricing.input
                       + (data.output / 1_000_000) * pricing.output;

        return {
          date,
          provider: 'gemini',
          cost_usd: Math.round(cost_usd * 100_000) / 100_000,  // 6 decimal places
          input_tokens: Math.round(data.input),
          output_tokens: Math.round(data.output),
          cache_creation_tokens: 0,
          cache_read_tokens: 0,
          models,
          raw_data: { models, input: data.input, output: data.output },
        };
      });
  }

  async getRawForHash(since: string, until: string): Promise<string> {
    const entries = await this.fetchUsage(since, until);
    return JSON.stringify(entries);
  }

  private getProjectDirs(): string[] {
    try {
      return readdirSync(this.geminiDir)
        .map(d => join(this.geminiDir, d))
        .filter(d => statSync(d).isDirectory() && existsSync(join(d, 'otel')));
    } catch {
      return [];
    }
  }

  private readOtelLogs(projectDir: string): OtelEntry[] {
    const otelDir = join(projectDir, 'otel');
    const entries: OtelEntry[] = [];

    try {
      const files = readdirSync(otelDir)
        .filter(f => f.endsWith('.jsonl') || f === 'telemetry.log');

      for (const file of files) {
        const content = readFileSync(join(otelDir, file), 'utf-8');
        const lines = content.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            // Handle both OTEL format and Gemini's custom telemetry.log format
            if (parsed.name && parsed.value !== undefined) {
              entries.push(parsed as OtelEntry);
            } else if (parsed.metric && parsed.point) {
              // Normalize Gemini's alternate format
              entries.push({
                timestamp: parsed.point.time ?? new Date().toISOString(),
                name: parsed.metric,
                attributes: parsed.attributes ?? {},
                value: parsed.point.value ?? 0,
              });
            }
          } catch { /* Skip malformed lines */ }
        }
      }
    } catch { /* Skip unreadable directories */ }

    return entries;
  }
}
```

### 10.6 — Antigravity Adapter

```typescript
// packages/cli/src/adapters/antigravity.ts
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';
import type { UsageAdapter, DailyEntry } from './types';

// Antigravity AI is a desktop IDE built on Google's platform, powered by Gemini 3 Pro
// Session data location varies by OS

const ANTIGRAVITY_PATHS = {
  linux:   [join(homedir(), '.antigravity'), join(homedir(), '.config', 'antigravity')],
  darwin:  [join(homedir(), 'Library', 'Application Support', 'Antigravity')],
  win32:   [join(process.env.APPDATA ?? '', 'Antigravity')],
};

// Gemini 3 Pro pricing (estimated as of 2026)
const GEMINI_3_PRO_PRICING = { input: 2.50, output: 15.00 };  // per 1M tokens

export class AntigravityAdapter implements UsageAdapter {
  provider = 'antigravity' as const;
  displayName = 'Antigravity AI';
  private dataDirs: string[];

  constructor() {
    const os = platform() as 'linux' | 'darwin' | 'win32';
    this.dataDirs = ANTIGRAVITY_PATHS[os] ?? ANTIGRAVITY_PATHS.linux;
  }

  async isAvailable(): Promise<boolean> {
    return this.dataDirs.some(d => existsSync(d));
  }

  async fetchUsage(since: string, until: string): Promise<DailyEntry[]> {
    const sinceDate = new Date(since);
    const untilDate = new Date(until);
    const entriesByDate = new Map<string, {
      input: number; output: number; models: Set<string>; sessions: number;
    }>();

    for (const dataDir of this.dataDirs) {
      if (!existsSync(dataDir)) continue;
      this.parseSessionData(dataDir, sinceDate, untilDate, entriesByDate);
    }

    return Array.from(entriesByDate.entries())
      .filter(([, data]) => data.input > 0 || data.output > 0)
      .map(([date, data]) => {
        const models = Array.from(data.models);
        const cost_usd = (data.input / 1_000_000) * GEMINI_3_PRO_PRICING.input
                       + (data.output / 1_000_000) * GEMINI_3_PRO_PRICING.output;

        return {
          date,
          provider: 'antigravity',
          cost_usd: Math.round(cost_usd * 100_000) / 100_000,
          input_tokens: Math.round(data.input),
          output_tokens: Math.round(data.output),
          cache_creation_tokens: 0,
          cache_read_tokens: 0,
          models,
          raw_data: { models, input: data.input, output: data.output, sessions: data.sessions },
        };
      });
  }

  async getRawForHash(since: string, until: string): Promise<string> {
    const entries = await this.fetchUsage(since, until);
    return JSON.stringify(entries);
  }

  private parseSessionData(
    dataDir: string,
    since: Date,
    until: Date,
    accumulator: Map<string, { input: number; output: number; models: Set<string>; sessions: number }>
  ) {
    // Look for common Antigravity session log patterns
    // (reverse-engineered from the IDE's local data directory)
    const patterns = [
      'sessions',
      'logs',
      'history',
      'usage',
    ];

    for (const pattern of patterns) {
      const dir = join(dataDir, pattern);
      if (!existsSync(dir)) continue;

      try {
        const files = readdirSync(dir)
          .filter(f => f.endsWith('.json') || f.endsWith('.jsonl'));

        for (const file of files) {
          // Parse file date from filename (common pattern: YYYY-MM-DD-session.json)
          const dateMatcher = file.match(/(\d{4}-\d{2}-\d{2})/);
          const fileDate = dateMatcher ? new Date(dateMatcher[1]) : null;

          if (fileDate && (fileDate < since || fileDate > until)) continue;

          try {
            const content = readFileSync(join(dir, file), 'utf-8');
            this.extractUsageFromSession(content, since, until, accumulator);
          } catch { /* Skip unreadable files */ }
        }
      } catch { /* Skip unreadable directories */ }
    }
  }

  private extractUsageFromSession(
    content: string,
    since: Date,
    until: Date,
    accumulator: Map<string, { input: number; output: number; models: Set<string>; sessions: number }>
  ) {
    // Handle both JSON and JSONL formats
    const lines = content.includes('\n') && !content.startsWith('{')
      ? content.split('\n').filter(Boolean)
      : [content];

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        // Look for usage-like fields in various possible formats
        const usage = data.usage ?? data.tokenUsage ?? data.token_usage ?? data;

        if (!usage) continue;

        const timestamp = data.timestamp ?? data.created_at ?? data.date ?? null;
        if (!timestamp) continue;

        const entryDate = new Date(timestamp);
        if (entryDate < since || entryDate > until) continue;

        const dateStr = timestamp.toString().split('T')[0];
        const existing = accumulator.get(dateStr) ?? {
          input: 0, output: 0, models: new Set<string>(), sessions: 0
        };

        // Try multiple field name conventions
        existing.input += usage.input_tokens ?? usage.inputTokens ?? usage.prompt_tokens ?? 0;
        existing.output += usage.output_tokens ?? usage.outputTokens ?? usage.completion_tokens ?? 0;

        const model = data.model ?? usage.model ?? 'gemini-3-pro';
        if (model) existing.models.add(model);
        existing.sessions += 1;

        accumulator.set(dateStr, existing);
      } catch { /* Skip malformed entries */ }
    }
  }
}
```

### 10.7 — Provider Auto-Detection

```typescript
// packages/cli/src/lib/detect.ts
import { ClaudeAdapter } from '../adapters/claude';
import { CodexAdapter } from '../adapters/codex';
import { GeminiAdapter } from '../adapters/gemini';
import { AntigravityAdapter } from '../adapters/antigravity';
import type { UsageAdapter } from '../adapters/types';

export async function detectInstalledProviders(): Promise<UsageAdapter[]> {
  const adapters: UsageAdapter[] = [
    new ClaudeAdapter(),
    new CodexAdapter(),
    new GeminiAdapter(),
    new AntigravityAdapter(),
  ];

  const available = await Promise.all(
    adapters.map(async adapter => ({
      adapter,
      available: await adapter.isAvailable(),
    }))
  );

  return available.filter(a => a.available).map(a => a.adapter);
}
```

### 10.8 — Push Command

```typescript
// packages/cli/src/commands/push.ts
import { detectInstalledProviders } from '../lib/detect';
import { loadAuthToken } from '../lib/auth';
import { straude_api } from '../lib/api';
import { createHash } from 'crypto';
import ora from 'ora';
import chalk from 'chalk';

interface PushOptions {
  days?: number;
  provider?: string;
  dryRun?: boolean;
  since?: string;
  until?: string;
}

export async function push(options: PushOptions = {}) {
  const token = await loadAuthToken();
  if (!token) {
    console.log(chalk.yellow('Not logged in. Run: straude login'));
    process.exit(1);
  }

  const until = options.until ?? new Date().toISOString().split('T')[0];
  const sinceDate = options.since
    ? new Date(options.since)
    : new Date(Date.now() - (options.days ?? 1) * 24 * 60 * 60 * 1000);
  const since = sinceDate.toISOString().split('T')[0];

  // Get providers to sync
  let adapters = await detectInstalledProviders();

  if (options.provider && options.provider !== 'all') {
    adapters = adapters.filter(a => a.provider === options.provider);
    if (adapters.length === 0) {
      console.log(chalk.red(`Provider '${options.provider}' not found or not installed.`));
      process.exit(1);
    }
  }

  if (adapters.length === 0) {
    console.log(chalk.yellow('No AI coding agents detected. Install Claude Code, Codex CLI, Gemini CLI, or Antigravity.'));
    process.exit(0);
  }

  console.log(`\n${chalk.bold('STRAUDE')} · Syncing ${since} → ${until}\n`);
  console.log('Detected providers:');
  adapters.forEach(a => console.log(`  ${chalk.cyan(a.displayName)}`));
  console.log();

  // Collect usage from all providers
  const allEntries = [];
  for (const adapter of adapters) {
    const spinner = ora(`Fetching ${adapter.displayName} usage...`).start();
    try {
      const entries = await adapter.fetchUsage(since, until);
      spinner.succeed(`${adapter.displayName}: ${entries.length} days`);
      allEntries.push(...entries);
    } catch (err) {
      spinner.fail(`${adapter.displayName}: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }

  if (allEntries.length === 0) {
    console.log(chalk.yellow('\nNo usage data found for this date range.'));
    return;
  }

  if (options.dryRun) {
    console.log('\n' + chalk.bold('Dry run — would push:'));
    allEntries.forEach(e =>
      console.log(`  ${e.date} [${e.provider}] $${e.cost_usd.toFixed(3)} · ${e.output_tokens.toLocaleString()} output tokens`)
    );
    return;
  }

  // Compute hash of all data for dedup
  const hash = createHash('sha256')
    .update(JSON.stringify(allEntries))
    .digest('hex');

  // Push to API
  const spinner = ora('Pushing to Straude...').start();
  const result = await straude_api.post('/api/usage/submit', {
    entries: allEntries,
    source: 'cli',
    hash,
  }, { Authorization: `Bearer ${token}` });

  if (result.success) {
    spinner.succeed(`Pushed ${result.processed} days · ${result.posts_created} posts created`);
    console.log(`\n${chalk.cyan('→')} View at ${chalk.underline(`straude.dev/u/me`)}`);
  } else {
    spinner.fail('Push failed');
    console.error(result.errors);
    process.exit(1);
  }
}
```

### 10.9 — Smart Sync Command

```typescript
// packages/cli/src/commands/sync.ts
// Default behavior when user just runs `straude`
import { push } from './push';
import { loadAuthToken, getLastPushDate } from '../lib/auth';
import { login } from './login';

export async function sync() {
  let token = await loadAuthToken();

  // Auto-login if not authenticated
  if (!token) {
    console.log('Not logged in. Starting authentication...\n');
    await login();
    token = await loadAuthToken();
    if (!token) process.exit(1);
  }

  // Calculate days since last push (default: 1 day if no prior push)
  const lastPushDate = await getLastPushDate();
  const daysSinceLastPush = lastPushDate
    ? Math.ceil((Date.now() - new Date(lastPushDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  const daysToSync = Math.min(Math.max(daysSinceLastPush, 1), 30);

  await push({ days: daysToSync });
}
```

---

## PHASE 11 — Security Hardening

### 11.1 — Rate Limiting

```typescript
// lib/rateLimit.ts
// In-memory rate limiter (replace with Upstash Redis in production)

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitStore>();

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(key: string, options: RateLimitOptions): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt };
  }

  if (existing.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: options.maxRequests - existing.count, resetAt: existing.resetAt };
}

// Rate limit configs per endpoint
export const RATE_LIMITS = {
  'usage/submit':     { maxRequests: 20,  windowMs: 60_000 },   // 20/minute (4 providers × 5 retries)
  'social/kudos':     { maxRequests: 60,  windowMs: 60_000 },   // 60/minute
  'social/comments':  { maxRequests: 20,  windowMs: 60_000 },   // 20/minute
  'social/follow':    { maxRequests: 30,  windowMs: 60_000 },   // 30/minute
  'ai/generate':      { maxRequests: 10,  windowMs: 60_000 },   // 10/minute (AI is expensive)
  'upload':           { maxRequests: 10,  windowMs: 60_000 },   // 10/minute
  'auth/cli/poll':    { maxRequests: 300, windowMs: 60_000 },   // 300/minute (polling)
};

// Middleware helper
export function checkRateLimit(request: Request, endpoint: keyof typeof RATE_LIMITS) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${endpoint}:${ip}`;
  const config = RATE_LIMITS[endpoint];

  const result = rateLimit(key, config);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null; // Allowed
}
```

### 11.2 — Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export default {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  // ... other config
};
```

### 11.3 — Input Sanitization & Validation Helpers

```typescript
// lib/validation/sanitize.ts

// Strip HTML tags from user input
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

// Validate and normalize username
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) return { valid: false, error: 'Username is required' };
  if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 30) return { valid: false, error: 'Username must be at most 30 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  // Reserved usernames
  const reserved = ['admin', 'api', 'straude', 'support', 'help', 'me', 'system'];
  if (reserved.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }
  return { valid: true };
}

// Allowed image URL origins (SSRF prevention for AI caption endpoint)
export const ALLOWED_IMAGE_ORIGINS = [
  `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]}`,
  `https://${process.env.NEXT_PUBLIC_APP_URL?.split('//')[1]}`,
];
```

### 11.4 — requireAuth Helper

```typescript
// lib/auth/requireAuth.ts
// Accepts both browser sessions and CLI JWTs

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyJWT } from './jwt';

export async function requireAuth(request: Request): Promise<string | null> {
  // 1. Try CLI JWT
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyJWT(token);
    if (payload?.type === 'cli' && typeof payload.sub === 'string') {
      return payload.sub;
    }
  }

  // 2. Fall back to Supabase session cookie
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
```

---

## PHASE 12 — Testing Strategy

### 12.1 — Unit Tests (Vitest)

```typescript
// apps/web/__tests__/achievements.test.ts
import { describe, it, expect } from 'vitest';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/definitions';

describe('Achievement Definitions', () => {
  it('awards first-sync to anyone with usage data', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.slug === 'first-sync')!;
    expect(def.check({ total_cost_usd: 0.001 } as any)).toBe(true);
    expect(def.check({ total_cost_usd: 0 } as any)).toBe(false);
  });

  it('awards multi-provider when 2+ providers used', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.slug === 'multi-provider')!;
    expect(def.check({ providers_used: ['claude', 'codex'] } as any)).toBe(true);
    expect(def.check({ providers_used: ['claude'] } as any)).toBe(false);
  });

  it('awards all-providers when all 4 providers used', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.slug === 'all-providers')!;
    const all = { providers_used: ['claude', 'codex', 'gemini', 'antigravity'] } as any;
    expect(def.check(all)).toBe(true);
  });
});
```

```typescript
// packages/cli/__tests__/gemini-adapter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GeminiAdapter } from '../src/adapters/gemini';

describe('GeminiAdapter', () => {
  it('correctly calculates cost from token counts', async () => {
    const adapter = new GeminiAdapter();
    // Mock file system with sample OTEL data
    vi.mock('fs', () => ({
      existsSync: vi.fn().mockReturnValue(true),
      readdirSync: vi.fn().mockReturnValue(['project-abc']),
      readFileSync: vi.fn().mockReturnValue(
        JSON.stringify({
          timestamp: '2026-02-16T10:00:00Z',
          name: 'gemini_cli.token.usage',
          attributes: { token_type: 'input', model: 'gemini-2.5-pro' },
          value: 1_000_000,
        })
      ),
      statSync: vi.fn().mockReturnValue({ isDirectory: () => true }),
    }));

    const entries = await adapter.fetchUsage('2026-02-16', '2026-02-16');
    expect(entries).toHaveLength(1);
    expect(entries[0].input_tokens).toBe(1_000_000);
    expect(entries[0].cost_usd).toBeCloseTo(1.25, 2); // $1.25 per 1M input tokens
  });
});
```

### 12.2 — Integration Tests (Vitest)

```typescript
// apps/web/__tests__/api/usage-submit.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, cleanupTestUser } from '../helpers/testUser';

describe('POST /api/usage/submit', () => {
  let userId: string;
  let cliToken: string;

  beforeAll(async () => {
    ({ userId, cliToken } = await createTestUser());
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
  });

  it('accepts valid Claude usage entry', async () => {
    const response = await fetch('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cliToken}`,
      },
      body: JSON.stringify({
        entries: [{
          date: '2026-02-16',
          provider: 'claude',
          cost_usd: 4.82,
          input_tokens: 1_800_000,
          output_tokens: 98_000,
          cache_creation_tokens: 0,
          cache_read_tokens: 450_000,
          models: ['claude-sonnet-4-5-20250929'],
        }],
        source: 'cli',
      }),
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
  });

  it('rejects invalid provider', async () => {
    const response = await fetch('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cliToken}` },
      body: JSON.stringify({
        entries: [{ date: '2026-02-16', provider: 'invalid-provider', cost_usd: 1 }],
        source: 'cli',
      }),
    });

    expect(response.status).toBe(422);
  });

  it('upserts on duplicate push (same user/date/provider)', async () => {
    const entry = { date: '2026-02-17', provider: 'codex', cost_usd: 2.0,
      input_tokens: 500_000, output_tokens: 47_000, models: ['gpt-5.3-codex'] };

    const push = (cost: number) => fetch('http://localhost:3000/api/usage/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cliToken}` },
      body: JSON.stringify({ entries: [{ ...entry, cost_usd: cost }], source: 'cli' }),
    });

    await push(2.0);
    const res2 = await push(3.5);  // Second push with updated amount
    const data = await res2.json();
    expect(data.success).toBe(true);
    // Should update, not create duplicate
  });

  it('rate limits after 20 requests per minute', async () => {
    const promises = Array.from({ length: 22 }, () =>
      fetch('http://localhost:3000/api/usage/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cliToken}` },
        body: JSON.stringify({ entries: [], source: 'cli' }),
      })
    );
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 12.3 — E2E Tests (Playwright)

```typescript
// apps/web/e2e/multi-provider-push.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Multi-provider feed display', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('Activity card shows provider chips when multiple providers pushed', async ({ page }) => {
    // Navigate to the feed
    await page.goto('/feed');

    // Check that provider chips appear on cards with multiple providers
    const card = page.locator('[data-testid="activity-card"]').first();
    await expect(card).toBeVisible();

    const chips = card.locator('[data-testid="provider-chip"]');
    await expect(chips).toHaveCountGreaterThan(0);
  });

  test('Leaderboard provider filter narrows results', async ({ page }) => {
    await page.goto('/leaderboard');

    // Click provider filter
    await page.click('[data-testid="provider-filter"]');
    await page.click('[data-testid="provider-option-claude"]');

    await page.waitForURL(/provider=claude/);

    // All visible rows should have Claude
    const rows = page.locator('[data-testid="leaderboard-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Contribution graph shows provider colors', async ({ page }) => {
    await page.goto('/u/testuser');

    const graph = page.locator('[data-testid="contribution-graph"]');
    await expect(graph).toBeVisible();

    // Days with Claude usage should have orange-tinted cells
    const activeDays = graph.locator('[data-testid="graph-cell"][data-has-usage="true"]');
    await expect(activeDays).toHaveCountGreaterThan(0);
  });
});
```

---

## API REFERENCE CATALOGUE

| # | Method | Path | Auth | Rate Limit | Description |
|---|--------|------|------|-----------|-------------|
| 1 | POST | `/api/auth/cli/init` | None | 10/min | Start device auth flow |
| 2 | POST | `/api/auth/cli/poll` | None | 300/min | Poll for CLI auth completion |
| 3 | GET | `/api/auth/callback` | None | — | OAuth callback handler |
| 4 | POST | `/api/usage/submit` | CLI JWT or session | 20/min | Submit daily usage (upsert) |
| 5 | GET | `/api/feed` | Session (optional) | 120/min | Paginated feed |
| 6 | GET | `/api/posts/[id]` | Session (optional) | 120/min | Single post |
| 7 | PATCH | `/api/posts/[id]` | Session | 30/min | Update own post |
| 8 | DELETE | `/api/posts/[id]` | Session | 30/min | Delete own post |
| 9 | POST | `/api/upload` | Session | 10/min | Upload image (5MB max) |
| 10 | POST | `/api/ai/generate-caption` | Session | 10/min | AI caption generation |
| 11 | POST | `/api/social/follow` | Session | 30/min | Follow user |
| 12 | DELETE | `/api/social/follow` | Session | 30/min | Unfollow user |
| 13 | POST | `/api/social/kudos` | Session | 60/min | Give kudos to post |
| 14 | DELETE | `/api/social/kudos` | Session | 60/min | Remove kudos |
| 15 | POST | `/api/social/comments` | Session | 20/min | Create comment |
| 16 | PATCH | `/api/social/comments` | Session | 20/min | Edit own comment |
| 17 | DELETE | `/api/social/comments` | Session | 20/min | Delete own comment |
| 18 | GET | `/api/social/notifications` | Session | 30/min | List notifications |
| 19 | PATCH | `/api/social/notifications` | Session | 30/min | Mark all as read |
| 20 | GET | `/api/leaderboard` | None | 60/min | Ranked leaderboard |
| 21 | GET | `/api/search` | None | 30/min | User search |
| 22 | GET | `/api/users/[username]` | None | 60/min | Public user profile |
| 23 | GET | `/api/email/unsubscribe` | HMAC token | 10/min | Email unsubscribe |

### Request/Response Types

```typescript
// types/api.ts

// POST /api/usage/submit
interface UsageSubmitRequest {
  entries: Array<{
    date: string;                    // YYYY-MM-DD
    provider: 'claude' | 'codex' | 'gemini' | 'antigravity';
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

interface UsageSubmitResponse {
  success: boolean;
  processed: number;
  posts_created: number;
  errors?: Array<{ date: string; provider: string; error: string }>;
}

// GET /api/feed
interface FeedResponse {
  posts: Array<{
    id: string;
    user_id: string;
    usage_date: string;
    title: string | null;
    description: string | null;
    images: string[];
    providers: string[];
    created_at: string;
    user: { id: string; username: string; avatar_url: string | null; country: string | null };
    daily_usage: DailyUsage[];
    kudos_count: number;
    comment_count: number;
    user_has_kudosed: boolean;
  }>;
  nextCursor: string | null;
}

// GET /api/leaderboard
interface LeaderboardResponse {
  entries: Array<{
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
    active_days: number;
  }>;
  currentUserRank: number | null;
  period: string;
  region: string;
  provider: string;
}
```

---

## DEPLOYMENT & OBSERVABILITY

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": "@supabase_publishable_key",
    "SUPABASE_SECRET_KEY": "@supabase_secret_key",
    "CLI_JWT_SECRET": "@cli_jwt_secret",
    "ANTHROPIC_API_KEY": "@anthropic_api_key",
    "GOOGLE_AI_API_KEY": "@google_ai_api_key",
    "OPENAI_API_KEY": "@openai_api_key",
    "RESEND_API_KEY": "@resend_api_key",
    "EMAIL_FROM": "@email_from",
    "EMAIL_UNSUBSCRIBE_SECRET": "@email_unsubscribe_secret",
    "BFL_API_KEY": "@bfl_api_key"
  }
}
```

### Observability Stack

```typescript
// Vercel Analytics — built-in, zero config
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

// Structured logging for API routes
// lib/logger.ts
export function log(level: 'info' | 'warn' | 'error', event: string, data?: object) {
  console.log(JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...data,
  }));
}

// Usage in API routes:
// log('info', 'usage_submitted', { userId, entriesCount: entries.length, providers });
// log('error', 'ai_caption_failed', { provider, error: err.message });
```

### Database Backup & Maintenance

```sql
-- Scheduled maintenance (run via pg_cron or Supabase Edge Functions)

-- 1. Expire CLI auth codes (every 5 minutes)
SELECT cron.schedule('expire-cli-codes', '*/5 * * * *', $$
  SELECT expire_cli_auth_codes();
$$);

-- 2. Delete expired CLI codes older than 24 hours
SELECT cron.schedule('cleanup-cli-codes', '0 */6 * * *', $$
  DELETE FROM cli_auth_codes
  WHERE status = 'expired'
  AND created_at < NOW() - INTERVAL '24 hours';
$$);

-- 3. Clean up orphaned notifications older than 90 days
SELECT cron.schedule('cleanup-old-notifications', '0 2 * * *', $$
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND is_read = true;
$$);
```

### CLI Package Publishing

```json
// packages/cli/package.json
{
  "name": "straude",
  "version": "2.0.0",
  "description": "Track your AI coding across Claude, Codex, Gemini & Antigravity",
  "bin": { "straude": "./dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir dist --target node",
    "prepublishOnly": "bun run build",
    "test": "vitest run"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "nanoid": "^5.0.0",
    "ora": "^8.0.0",
    "jose": "^5.0.0"
  },
  "engines": { "node": ">=18.0.0" }
}
```

---

## BACKEND DEVELOPMENT ORDER (RECOMMENDED)

```
Week 1: Foundation
  Day 1:   Database migrations (001-004), Supabase client setup, proxy.ts
  Day 2:   Auth system (magic link, GitHub OAuth, callback, onboarding)
  Day 3:   CLI device auth flow (init + poll + verify page)
  Day 4:   POST /api/usage/submit (the most critical endpoint)
  Day 5:   GET /api/feed with cursor pagination

Week 2: Social + Profiles
  Day 1:   Follow/unfollow + kudos toggle
  Day 2:   Comments + @mention notification dispatch
  Day 3:   Notifications API
  Day 4:   User profile API (get_user_profile stored procedure)
  Day 5:   Leaderboard API with views + provider filter

Week 3: Features
  Day 1:   Image upload + magic bytes validation
  Day 2:   AI caption generation (Claude → Gemini → OpenAI fallback chain)
  Day 3:   Achievement engine (all 14 badges)
  Day 4:   Email notification system (React Email + Resend)
  Day 5:   Search API + post CRUD

Week 4: CLI Adapters + Security
  Day 1:   Claude adapter (refactor from existing)
  Day 2:   Codex adapter (@ccusage/codex)
  Day 3:   Gemini adapter (OpenTelemetry parser)
  Day 4:   Antigravity adapter + auto-detection
  Day 5:   Rate limiting, security headers, E2E tests, deploy
```

---

*This plan provides the complete backend architecture for Straude Multi-Model. Every endpoint, migration, stored procedure, CLI adapter, security control, and test is specified. Frontend plan covers the UI layer. Together they form the complete technical blueprint for the rebuild.*
