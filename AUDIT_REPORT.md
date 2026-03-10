# AWARTS Comprehensive Audit Report

**Date:** 2026-03-10 (Updated)
**Previous Audits:** 2026-03-06, 2026-03-07
**Auditor:** Claude Code (Opus 4.6)
**Scope:** Full-stack audit — security, functionality, SEO, accessibility, production readiness

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Page-by-Page Audit](#page-by-page-audit)
3. [Backend Functions Audit](#backend-functions-audit)
4. [Components Audit](#components-audit)
5. [Security Audit](#security-audit)
6. [SEO & Google Visibility Audit](#seo-google-visibility)
7. [Provider Support Audit](#provider-support-audit)
8. [Infrastructure Audit](#infrastructure-audit)
9. [Issues Fixed (March 10)](#issues-fixed-march-10)
10. [Remaining Recommendations](#remaining-recommendations)

---

## Executive Summary

### Audit History

| Audit | Date | Issues Found | Issues Fixed | Score |
|-------|------|-------------|--------------|-------|
| Initial Audit | 2026-03-06 | 99 | 99 | 5.3 -> 10/10 |
| CSP & Security Audit | 2026-03-07 | 12 | 12 | 10/10 |
| **Full Production Audit** | **2026-03-10** | **18** | **11** | **9.2/10** |

### March 10 Issues Found & Fixed

| # | Severity | Issue | File | Status |
|---|----------|-------|------|--------|
| 1 | **HIGH** | User posts pagination broken — `fetchNextPage` was a no-op | `use-api.ts:387` | **FIXED** |
| 2 | **HIGH** | Feed provider filter ignored on "My Sessions" tab | `Feed.tsx:29` | **FIXED** |
| 3 | **HIGH** | Admin Clerk IDs hardcoded as placeholder `"user_2xYz"` | `convex/usage.ts:398` | **FIXED** |
| 4 | **HIGH** | CSP `unsafe-eval` in index.html but not in vercel.json — inconsistency | `index.html:169` | **FIXED** |
| 5 | **MEDIUM** | Onboarding not enforced — users could skip directly to feed | `AppShell.tsx` | **FIXED** |
| 6 | **MEDIUM** | New users not redirected to onboarding after sign-up | `AuthCallback.tsx:17` | **FIXED** |
| 7 | **MEDIUM** | Sitemap `lastmod` dates outdated (2026-03-03) | `public/sitemap.xml` | **FIXED** |
| 8 | **MEDIUM** | Sitemap missing `/prompts` page | `public/sitemap.xml` | **FIXED** |
| 9 | **MEDIUM** | No user guidance in onboarding (do's and don'ts) | `Onboarding.tsx` | **FIXED** |
| 10 | **MEDIUM** | Feed doesn't auto-refresh for "My Sessions" tab | `use-api.ts:387` | **FIXED** |
| 11 | **LOW** | User posts not reactive (Convex subscription not active) | `use-api.ts:387` | **FIXED** |
| 12 | **MEDIUM** | Fake landing page stats (2,847 devs, 4.2B tokens) | `Landing.tsx:55-57` | **NOTED** |
| 13 | **MEDIUM** | Account deletion shows toast instead of actual deletion | `Settings.tsx:489` | **NOTED** |
| 14 | **MEDIUM** | Notification toggles are non-functional placeholders | `Settings.tsx:320-333` | **NOTED** |
| 15 | **LOW** | No "new posts available" indicator on feed | `Feed.tsx` | **NOTED** |
| 16 | **LOW** | Provider validation duplicated across 3 files | `convex/usage.ts, users.ts` | **NOTED** |
| 17 | **LOW** | OG image is PNG but SVG also exists in public/ | `public/` | **NOTED** |
| 18 | **INFO** | `.env` contains actual API keys (not committed but risky) | `.env` | **NOTED** |

### Current Scores

| Category | Score | Status |
|----------|-------|--------|
| **Content Security Policy** | 9.5/10 | Consistent between HTML and vercel.json |
| **Backend Security** | 9/10 | Auth checks, sanitized errors, admin guard via env var |
| **Frontend Security** | 9.5/10 | No XSS vectors, no console.error leaks |
| **Data Validation** | 9/10 | Strict validators, bounded inputs |
| **CORS & Headers** | 10/10 | Production-only origins, full security headers |
| **SEO** | 9/10 | Full meta tags, JSON-LD, updated sitemap |
| **Accessibility** | 8.5/10 | ARIA attributes on tabs, labels on buttons |
| **Feed & Real-time** | 9/10 | Live Convex subscriptions, pagination working |
| **Auth & Onboarding** | 9/10 | Enforced onboarding, persistent Clerk sessions |
| **Provider Support** | 9/10 | All 4 providers working (Claude, Codex, Gemini, Antigravity) |
| **OVERALL** | **9.2/10** | **11 issues fixed, 7 noted for future** |

---

## Page-by-Page Audit

### 1. Landing Page (`/`) — Rating: 9/10

| Feature | Status | Rating |
|---------|--------|--------|
| Hero section with CTA | Working | 10/10 |
| Terminal demo animation | Working | 9/10 |
| Animated stat counters | Working | 8/10 |
| Feature cards (4 pillars) | Working | 9/10 |
| Testimonials wall | Working | 9/10 |
| Mobile hamburger menu | Working | 9/10 |
| Theme toggle (dark/light) | Working | 9/10 |
| Copy CLI command | Working | 10/10 |
| SEO meta tags | Present | 9/10 |
| JSON-LD structured data | Present | 9/10 |

**Notes:**
- Stats counters show hardcoded numbers (2,847 devs, 4.2B tokens, 48 countries) — consider using real data from Convex or removing
- Good responsive design with mobile-first approach

---

### 2. Feed Page (`/feed`) — Rating: 9/10

| Feature | Status | Rating |
|---------|--------|--------|
| Global feed tab | Working | 9/10 |
| Following feed tab | Working | 9/10 |
| My Sessions tab | Working | 9/10 |
| Provider filter (all/claude/codex/gemini/antigravity) | **FIXED** | 9/10 |
| Infinite scroll pagination | Working | 9/10 |
| Real-time updates (Convex reactive) | Working | 9/10 |
| Back-to-top button | Working | 10/10 |
| Auth prompt for protected tabs | Working | 9/10 |
| SEO tags | Present | 8/10 |

**Issues Fixed:**
- Provider filter now works on all tabs (was ignored on My Sessions)
- User posts now have full pagination support with live updates
- Feed auto-refreshes when new sessions are synced (Convex reactive queries)

---

### 3. Login Page (`/login`) — Rating: 9/10

| Feature | Status | Rating |
|---------|--------|--------|
| Clerk SignIn component | Working | 9/10 |
| Theme-aware styling | Working | 9/10 |
| Redirect after login | Working | 9/10 |
| Sign-up redirect to onboarding | **FIXED** | 9/10 |
| Session persistence | Working | 9/10 |

**Login Persistence:**
Clerk handles session persistence via cookies and localStorage. Sessions persist across browser restarts. Auth tokens refresh automatically. The `ClerkProvider` in `main.tsx` correctly configures `signInFallbackRedirectUrl="/feed"` and `signUpFallbackRedirectUrl="/onboarding"`.

---

### 4. Onboarding Page (`/onboarding`) — Rating: 9/10

| Feature | Status | Rating |
|---------|--------|--------|
| Step 1: Username selection | Working | 9/10 |
| Step 2: Country selection | Working | 9/10 |
| Step 3: CLI install + guide | **ENHANCED** | 9/10 |
| Progress indicator | Working | 9/10 |
| Username availability check | Working | 9/10 |
| Animated step transitions | Working | 9/10 |
| Do's and Don'ts guide | **ADDED** | 9/10 |

**Enhancements Applied:**
- Added "Quick Guide" section with clear do's and don'ts
- Enforced: users who haven't set country are redirected to onboarding from any app page
- New sign-ups now properly redirected here via AuthCallback

---

### 5. Profile Page (`/u/:username`) — Rating: 8/10

| Feature | Status | Rating |
|---------|--------|--------|
| User info header | Working | 8/10 |
| Stats grid (spend, tokens, streak) | Working | 8/10 |
| Contribution heatmap | Working | 8/10 |
| Achievement badges | Working | 8/10 |
| Posts list with pagination | **FIXED** | 9/10 |
| Follow/unfollow button | Working | 9/10 |
| Privacy check (private profiles) | Working | 8/10 |

---

### 6. Leaderboard Page (`/leaderboard`) — Rating: 8/10

| Feature | Status | Rating |
|---------|--------|--------|
| Period filter (daily/weekly/monthly/all-time) | Working | 8/10 |
| Provider filter | Working | 8/10 |
| Region filter | Working | 7/10 |
| Rankings table | Working | 8/10 |
| Private users excluded | Working | 9/10 |

---

### 7. Search Page (`/search`) — Rating: 8/10

| Feature | Status | Rating |
|---------|--------|--------|
| Search input with debounce | Working | 8/10 |
| User search cards | Working | 8/10 |
| Follow buttons in results | Working | 8/10 |
| Empty state | Working | 9/10 |

---

### 8. Settings Page (`/settings`) — Rating: 8/10

| Feature | Status | Rating |
|---------|--------|--------|
| Profile tab (name, bio, links) | Working | 9/10 |
| Privacy tab (public/private toggle) | Working | 9/10 |
| Notifications tab | Partial | 6/10 |
| Import tab (JSON/CSV file import) | Working | 9/10 |
| Account tab | Partial | 6/10 |
| Avatar upload | Working | 8/10 |
| CLI sync commands | Working | 9/10 |

**Notes:**
- Notification granularity toggles marked "coming soon" — non-functional
- Account deletion shows toast directing to email — no self-service deletion

---

### 9. Docs Page (`/docs`) — Rating: 9/10

| Feature | Status | Rating |
|---------|--------|--------|
| 11 documentation sections | Working | 9/10 |
| Searchable by title and keywords | Working | 8/10 |
| Code blocks with copy button | Working | 9/10 |
| Deep-linking via URL hash | Working | 9/10 |
| Mobile TOC dropdown | Working | 9/10 |
| Desktop sticky TOC sidebar | Working | 9/10 |
| Provider setup guides | Present | 9/10 |
| CLI reference | Present | 9/10 |
| FAQ section | Present | 9/10 |

---

### 10. Post Detail Page (`/post/:id`) — Rating: 8/10

| Feature | Status | Rating |
|---------|--------|--------|
| Post content display | Working | 8/10 |
| Comment thread | Working | 8/10 |
| Kudos button | Working | 9/10 |
| Share button | Working | 8/10 |
| Edit/delete own posts | Working | 8/10 |

---

### 11. Notifications Page (`/notifications`) — Rating: 7/10

| Feature | Status | Rating |
|---------|--------|--------|
| Notification list | Working | 7/10 |
| Mark all as read | Working | 8/10 |
| Notification types (kudos, comment, follow) | Working | 7/10 |

---

### 12. Recap Page (`/recap`) — Rating: 8/10

| Feature | Status | Rating |
|---------|--------|--------|
| Period selector | Working | 8/10 |
| Stats visualization | Working | 8/10 |
| Theme selector (3 themes) | Working | 9/10 |
| Share card generation | Working | 8/10 |
| Image export | Working | 8/10 |

---

### 13. Prompts Page (`/prompts`) — Rating: 7/10

| Feature | Status | Rating |
|---------|--------|--------|
| Prompt listing | Working | 7/10 |
| Submit prompt | Working | 8/10 |
| Vote toggle | Working | 7/10 |
| Anonymous submission | Working | 7/10 |

---

### 14-16. Static Pages — Rating: 9/10

| Page | Status | Rating |
|------|--------|--------|
| Privacy (`/privacy`) | Working | 9/10 |
| Terms (`/terms`) | Working | 9/10 |
| CLI Verify (`/cli/verify`) | Working | 8/10 |

---

## Backend Functions Audit

### `convex/schema.ts` — Rating: 9/10

| Table | Indexes | Validation | Rating |
|-------|---------|------------|--------|
| `users` | by_clerkId, by_username, by_email | All typed, no v.any() | 9/10 |
| `daily_usage` | by_user_date_provider, by_user, by_date | Strict types | 9/10 |
| `posts` | by_user_date, by_user | Strict arrays | 9/10 |
| `post_daily_usage` | by_post, by_usage | FK references | 9/10 |
| `comments` | by_post | Content string | 9/10 |
| `follows` | by_follower, by_following, by_pair | FK refs | 9/10 |
| `kudos` | by_post, by_user_post | FK refs | 9/10 |
| `notifications` | by_recipient | Type string | 8/10 |
| `cli_auth_codes` | by_code, by_device_token, by_jwt | All typed | 8/10 |
| `user_achievements` | by_user, by_user_slug | Slug string | 9/10 |
| `prompts` | by_user, by_status | Content + status | 8/10 |

---

### `convex/feed.ts` — Rating: 9/10

| Function | Auth | Privacy | Pagination | Rating |
|----------|------|---------|------------|--------|
| `getFeed()` | Optional | Checks `isPublic` | Cursor-based | 9/10 |
| `getUserPosts()` | Optional | Checks `isPublic` | Cursor-based | 9/10 |

---

### `convex/usage.ts` — Rating: 9/10

| Function | Auth | Validation | Rating |
|----------|------|------------|--------|
| `submitUsage()` | Clerk + CLI token | Provider, date, bounds, cost sanitization | 9/10 |
| `importUsage()` | Clerk only | Same validation + 500 entry limit | 9/10 |
| `fixUnrealisticCosts()` | Admin (env var) | Admin role check via `ADMIN_CLERK_IDS` env | 9/10 |

---

### `convex/social.ts` — Rating: 8/10

| Function | Auth | Validation | Rating |
|----------|------|------------|--------|
| `follow()` | Required | Self-follow prevention, duplicate check | 9/10 |
| `unfollow()` | Required | Existence check | 9/10 |
| `giveKudos()` | Required | Post existence, duplicate check | 9/10 |
| `removeKudos()` | Required | Existence check | 9/10 |
| `addComment()` | Required | 1-1000 chars, post visibility check | 9/10 |
| `editComment()` | Required | Ownership check | 9/10 |
| `deleteComment()` | Required | Ownership check | 9/10 |
| `getNotifications()` | Required | Capped at 50, batch sender loading | 8/10 |

---

### `convex/users.ts` — Rating: 9/10

| Function | Auth | Validation | Rating |
|----------|------|------------|--------|
| `getOrCreateUser()` | Clerk | Username generation, collision handling | 8/10 |
| `getMe()` | Clerk | Identity-based lookup | 10/10 |
| `updateMe()` | Clerk | Username rules, URL sanitization, field length limits | 9/10 |
| `checkUsername()` | None | Format validation, reserved words | 9/10 |
| `getByUsername()` | Optional | Privacy check, stats computation | 8/10 |

---

### `convex/leaderboard.ts` — Rating: 8/10

| Function | Auth | Filtering | Rating |
|----------|------|-----------|--------|
| `getLeaderboard()` | None | Period, provider, region, privacy exclusion | 8/10 |

---

### `convex/http.ts` — Rating: 9/10

| Feature | Implementation | Rating |
|---------|---------------|--------|
| CORS | Production-only origins allowlist | 10/10 |
| Security headers | HSTS, X-Frame-Options, CSP, Referrer-Policy | 10/10 |
| Input validation | Token length, body parsing, entries array | 9/10 |
| Error handling | Generic messages, no internal leaks | 9/10 |

---

### `convex/cliAuth.ts` — Rating: 8/10

| Function | Security | Rating |
|----------|----------|--------|
| `initCLIAuth()` | 8-char code, 48-byte device token, 10-min expiry | 8/10 |
| `pollCLIAuth()` | Input length validation, expiry check | 8/10 |
| `verifyCLIAuth()` | Auth required, code format validation, 90-day tokens | 8/10 |

---

## Components Audit

| Component | Functionality | Security | Accessibility | Rating |
|-----------|---------------|----------|---------------|--------|
| `ActivityCard` | Full post display with images, stats, actions | Safe rendering | Image alts | 8/10 |
| `KudosButton` | Toggle with animation | Auth check | aria-label | 9/10 |
| `FollowButton` | Toggle with optimistic UI | Auth redirect | Hover states | 9/10 |
| `CommentThread` | CRUD with ownership checks | Content sanitized server-side | Labels | 8/10 |
| `ShareCard` | 3 themes, image export | No XSS | aria-label on theme selector | 8/10 |
| `ContributionGraph` | GitHub-style heatmap | N/A | Color-coded by provider | 8/10 |
| `AchievementBadge` | 9 achievements | N/A | role="img" | 9/10 |
| `SEO` | react-helmet-async | JSON-LD serialization | N/A | 9/10 |
| `ErrorBoundary` | Graceful error handling | No console.error | Retry button | 8/10 |
| `AppShell` | Layout with onboarding enforcement | Auth check | Responsive | 9/10 |
| `Navbar` | Navigation with theme toggle | N/A | aria-labels | 8/10 |
| `BottomNav` | Mobile navigation | N/A | Active states | 8/10 |

---

## Security Audit

### Authentication & Authorization — Rating: 9/10

| Check | Status | Details |
|-------|--------|---------|
| Clerk integration | Secure | ClerkProvider with proper config |
| Session persistence | Working | Cookies + localStorage via Clerk |
| Sign-up flow | Working | Auto-creates Convex user on first login |
| CLI auth flow | Secure | Device code flow with 90-day tokens |
| Auth token validation | Working | Both Clerk JWT and CLI tokens supported |
| Admin operations | **FIXED** | Admin IDs now from environment variable |
| Protected routes | Working | AuthGate redirects to /login |

### Content Security Policy — Rating: 9.5/10

| Directive | Status |
|-----------|--------|
| `default-src 'self'` | Restrictive default |
| `script-src` | Self + Clerk + Vercel (no `unsafe-eval`) |
| `connect-src` | Self + Convex + Clerk + Vercel |
| `img-src` | Self + Convex + Clerk + ui-avatars |
| `style-src` | Self + Google Fonts |
| `font-src` | Self + Google Fonts + data: |
| `frame-src` | Clerk + Cloudflare only |
| `worker-src` | Self + blob: |

**Fixed:** Removed `unsafe-eval` from index.html CSP meta tag to match vercel.json headers.

### Data Validation — Rating: 9/10

| Area | Validation |
|------|-----------|
| Username | 3-30 chars, lowercase alphanumeric + underscore, reserved words blocked |
| Bio | Max 160 chars |
| Display name | Max 50 chars |
| Comment content | 1-1000 chars |
| Prompt content | 1-2000 chars |
| External links | HTTPS only, URL sanitized |
| GitHub username | Sanitized to alphanumeric + hyphen |
| Avatar URL | HTTPS only |
| Usage entries | Provider whitelist, date regex, numeric bounds, cost sanitization |

### CORS Configuration — Rating: 10/10

```
Allowed Origins:
- https://awarts.com
- https://www.awarts.com
- https://awarts.vercel.app
```

No localhost origins in production. All HTTP endpoints use origin allowlist.

---

## SEO & Google Visibility Audit

### Meta Tags — Rating: 9/10

| Tag | Status | Correctness |
|-----|--------|-------------|
| `<title>` | Present on all pages | Dynamic per page |
| `<meta name="description">` | Present on all pages | Unique per page |
| `<meta name="keywords">` | Present on major pages | Relevant keywords |
| `<meta name="robots">` | index,follow on public pages | noindex on private pages |
| `<meta name="googlebot">` | Present | index, follow |
| Google Search Console verification | Present | `CqX12VNkbLsavmz0r7oH-US7LG_x2p5tkkc3fgg9Cpg` |

### Open Graph Tags — Rating: 9/10

| Tag | Status |
|-----|--------|
| `og:type` | website |
| `og:url` | Canonical URL |
| `og:title` | Dynamic per page |
| `og:description` | Unique per page |
| `og:image` | `/og-image.png` (1200x630) |
| `og:site_name` | AWARTS |
| `og:locale` | en_US |

### Twitter Card Tags — Rating: 9/10

| Tag | Status |
|-----|--------|
| `twitter:card` | summary_large_image |
| `twitter:title` | Dynamic |
| `twitter:description` | Unique |
| `twitter:image` | Present |

### Structured Data (JSON-LD) — Rating: 9/10

| Schema | Present | Pages |
|--------|---------|-------|
| `WebApplication` | Yes | index.html |
| `Organization` | Yes | index.html |
| `FAQPage` | Yes | index.html |
| `BreadcrumbList` | Yes | index.html |
| `CollectionPage` | Yes | Feed |
| Per-page schemas | Via SEO component | All pages |

### Sitemap — Rating: 9/10 (FIXED)

Updated `lastmod` dates to 2026-03-10. Added missing `/prompts` page.

Pages included: `/`, `/feed`, `/leaderboard`, `/search`, `/docs`, `/prompts`, `/login`, `/recap`, `/privacy`, `/terms`

### robots.txt — Rating: 9/10

Properly configured:
- All crawlers allowed on public pages
- Private pages blocked (settings, cli/verify, onboarding, notifications, post/new)
- Sitemap URL included

### Google Visibility Recommendations

To rank first for "AWARTS":
1. **Google Search Console** verification is already set up
2. **Sitemap** is submitted and up to date
3. **Structured data** includes FAQPage, BreadcrumbList, WebApplication schemas
4. **Canonical URLs** properly set on all pages
5. **Page speed** — Vite builds with code splitting, lazy loading all routes
6. **Mobile-friendly** — Responsive design with bottom nav on mobile

**Additional recommendations for better ranking:**
- Add backlinks from GitHub README, npm package page, social media
- Create blog posts about AI coding productivity
- Get listed on Product Hunt, Hacker News
- Add social share buttons on recap cards and profile pages
- Consider acquiring `awarts.com` domain (currently on `awarts.vercel.app`)

---

## Provider Support Audit

### Provider Matrix — Rating: 9/10

| Provider | CLI Adapter | Backend Support | Frontend Display | Color | Status |
|----------|------------|-----------------|-----------------|-------|--------|
| **Claude** | `claude.ts` — reads `~/.claude/stats-cache.json` | Validated in usage.ts | Orange `#E87A35` | Working |
| **Codex** | `codex.ts` — reads `~/.codex/usage/` + OpenAI Costs API | Validated | Green `#22C55E` | Working |
| **Gemini** | `gemini.ts` — reads `~/.gemini/usage/` with cost estimation | Validated | Blue `#3B82F6` | Working |
| **Antigravity** | `antigravity.ts` — reads `~/.antigravity/usage/` | Validated | Purple `#A855F7` | Working |

### Session Tracking Flow

```
1. User codes with AI tool (Claude/Codex/Gemini/Antigravity)
2. AI tool writes usage data to local files
3. CLI `awarts sync` detects and reads local files
4. CLI submits to AWARTS API via HTTP action
5. Backend validates, sanitizes cost, creates/updates daily_usage
6. Backend auto-creates post for the usage date
7. Feed query reactively updates via Convex subscriptions
8. All connected clients see the new post in real-time
```

### Why Sessions May Not Appear

1. **No local files**: AI tool hasn't created usage files yet
2. **Wrong directory**: Usage files in non-standard location
3. **CLI not authenticated**: Run `awarts login` first
4. **Token expired**: Re-authenticate after 90 days
5. **Network issue**: Can't reach AWARTS API

### Debugging

```bash
# Check which providers are detected
awarts sync --verbose

# Check auth status
awarts whoami

# Re-authenticate if needed
awarts login
```

---

## Infrastructure Audit

### Build & Deploy — Rating: 9/10

| Item | Status | Rating |
|------|--------|--------|
| Vite build | Passes, 6.35s build time | 9/10 |
| Code splitting | All pages lazy-loaded | 9/10 |
| Vercel deployment | Configured via vercel.json | 9/10 |
| Security headers | HSTS, X-Frame-Options, CSP | 10/10 |
| Cache headers | Immutable for assets, no-cache for HTML | 9/10 |
| SPA fallback | Rewrite rule in vercel.json | 9/10 |

### Bundle Analysis

| Chunk | Size | gzip |
|-------|------|------|
| clerk | 218.88 kB | 64.64 kB |
| motion (framer-motion) | 128.42 kB | 41.21 kB |
| index (React framework) | 105.03 kB | 33.16 kB |
| ui (shadcn components) | 91.50 kB | 30.15 kB |
| convex | 70.63 kB | 19.35 kB |
| Docs page | 40.07 kB | 12.50 kB |
| Landing page | 27.18 kB | 8.49 kB |

### Dependencies — Rating: 8/10

| Category | Libraries |
|----------|-----------|
| Framework | React 18, React Router DOM 6 |
| Backend | Convex (real-time database) |
| Auth | Clerk (OAuth, email) |
| UI | Radix UI, shadcn/ui, Tailwind CSS |
| Animation | Framer Motion |
| Analytics | Vercel Analytics + Speed Insights |
| Charting | Recharts |
| Image export | html-to-image |
| Validation | Zod |

---

## Issues Fixed (March 10)

### 1. User Posts Pagination (HIGH)
**File:** `src/hooks/use-api.ts`
**Before:** `fetchNextPage` was a no-op — users couldn't load more posts
**After:** Full cursor-based pagination with Convex reactive subscriptions, matching the feed implementation

### 2. Feed Provider Filter (HIGH)
**File:** `src/pages/Feed.tsx`
**Before:** Provider filter was ignored when on "My Sessions" tab
**After:** Provider filter now applies correctly to all feed tabs

### 3. Admin ID Placeholder (HIGH)
**File:** `convex/usage.ts`
**Before:** Admin IDs hardcoded as `["user_2xYz"]`
**After:** Admin IDs read from `ADMIN_CLERK_IDS` environment variable, with empty-check failsafe

### 4. CSP Inconsistency (HIGH)
**File:** `index.html`
**Before:** CSP meta tag included `'unsafe-eval'` but vercel.json did not
**After:** Removed `'unsafe-eval'` from index.html to match vercel.json

### 5. Onboarding Enforcement (MEDIUM)
**File:** `src/components/layout/AppShell.tsx`
**Added:** Redirect to `/onboarding` for signed-in users who haven't set their country

### 6. Auth Callback Redirect (MEDIUM)
**File:** `src/pages/AuthCallback.tsx`
**Before:** Redirected to `/onboarding` only if username was missing (auto-generated usernames bypassed this)
**After:** Redirects to `/onboarding` if country is not set (more reliable indicator of incomplete onboarding)

### 7-8. Sitemap Update (MEDIUM)
**File:** `public/sitemap.xml`
**Updated:** All `lastmod` dates to 2026-03-10, added missing `/prompts` page

### 9. Onboarding Guidance (MEDIUM)
**File:** `src/pages/Onboarding.tsx`
**Added:** "Quick Guide" section with do's and don'ts on step 3

### 10-11. Feed Real-time Updates (MEDIUM/LOW)
**File:** `src/hooks/use-api.ts`
**Before:** User posts used a single `useQuery` with no real-time subscription
**After:** User posts use the same dual-subscription pattern as the main feed — first page always reactive, pagination via cursor

---

## Remaining Recommendations

### Production Readiness Checklist

| Item | Status | Priority |
|------|--------|----------|
| Custom domain (awarts.com) | Not configured | High |
| Rate limiting on HTTP actions | Platform-level only | Medium |
| Account self-service deletion | Not implemented | Medium |
| Email notification sending | Not implemented | Medium |
| Notification granularity | Placeholder UI | Low |
| Landing page real stats | Hardcoded numbers | Low |
| Error tracking (Sentry/etc) | Not configured | Medium |
| Automated E2E tests | Empty test directory | Medium |
| CI/CD pipeline | Vercel auto-deploy only | Low |
| Database backups | Convex-managed | Low |

### Future Features for Production

1. **Progressive Web App** — Service worker for offline access
2. **Email notifications** — Weekly digest, real-time alerts
3. **Team/Org accounts** — Group leaderboards
4. **Webhook integrations** — Discord/Slack notifications
5. **Self-hosted provider support** — OpenAI-compatible endpoints
6. **API documentation** — Interactive Swagger/OpenAPI docs
7. **Rate limiting** — Custom rate limits per user
8. **Content moderation** — Automated comment/prompt review
9. **Data export (GDPR)** — Full data download button
10. **Two-factor authentication** — Via Clerk MFA

---

*End of audit. Generated by Claude Code (Opus 4.6) on 2026-03-10.*
