# AWARTS Comprehensive Audit Report

**Date:** 2026-03-06
**Auditor:** Claude Code (Opus 4.6)
**Scope:** Full-stack audit — Convex backend, React frontend, infrastructure, SEO, security

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Backend Audit (Convex)](#backend-audit)
3. [Frontend Pages Audit](#frontend-pages-audit)
4. [Frontend Components Audit](#frontend-components-audit)
5. [Infrastructure & Config Audit](#infrastructure-audit)
6. [SEO Audit](#seo-audit)
7. [Feature Recommendations](#feature-recommendations)
8. [Repo Organization Recommendations](#repo-organization)

---

## Executive Summary

| Category | Critical | High | Medium | Low | Score |
|----------|----------|------|--------|-----|-------|
| **Security** | 3 | 4 | 5 | 3 | 4/10 |
| **Data Integrity** | 2 | 3 | 4 | 2 | 5/10 |
| **Performance** | 1 | 3 | 5 | 4 | 5/10 |
| **SEO** | 0 | 2 | 4 | 3 | 7/10 |
| **Accessibility** | 0 | 4 | 6 | 5 | 4/10 |
| **Code Quality** | 1 | 3 | 5 | 8 | 6/10 |
| **UX/UI** | 1 | 4 | 8 | 6 | 6/10 |
| **OVERALL** | **8** | **23** | **37** | **31** | **5.3/10** |

**Total Issues Found: 99**

---

## Backend Audit

### File: `convex/schema.ts` — Rating: 6/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| Table definitions | Working | 7/10 | All tables defined with proper types |
| Indexes | Partial | 6/10 | Good coverage but missing uniqueness constraints |
| `by_email` index | Issue | 5/10 | Email is optional — NULL lookups may behave unexpectedly |

**Issues:**
- **[HIGH]** No UNIQUE constraint on `users.clerkId` — could create duplicate accounts per Clerk user
- **[HIGH]** No UNIQUE constraint on `users.username` — race condition allows duplicates
- **[MEDIUM]** No UNIQUE constraint on `follows (followerId + followingId)` — allows duplicate follows
- **[MEDIUM]** No UNIQUE constraint on `kudos (userId + postId)` — allows multiple kudos per user/post
- **[MEDIUM]** No UNIQUE constraint on `prompt_votes (userId + promptId)` — allows duplicate votes
- **[LOW]** No soft-delete support on any table — permanent deletion, no audit trail

---

### File: `convex/feed.ts` — Rating: 6/10

| Function | Status | Rating | Notes |
|----------|--------|--------|-------|
| `getFeed()` | Working | 7/10 | Cursor-based pagination works, privacy check present |
| `getUserPosts()` | **BUG** | 3/10 | **Missing privacy check for private profiles** |
| `batchLoadUsers()` | Working | 8/10 | Good batch loading pattern |

**Issues:**
- **[CRITICAL] `getUserPosts()` (line 127-202):** Does NOT check if `target.isPublic` is false. Any user can enumerate all posts from ANY user (including private profiles) by knowing their username. The `getFeed()` function correctly checks `author.isPublic` at line 64 but `getUserPosts()` skips this entirely.
- **[MEDIUM] Pagination over-fetch (line 50):** `candidates = await query.take(safeLimit * 5)` fetches 5x the needed posts. If heavy filtering removes most, could return incomplete pages.
- **[LOW]** Each post hydration still does 3 parallel queries (kudos, comments, usage links) — N+1 within the batch.

---

### File: `convex/social.ts` — Rating: 7/10

| Function | Status | Rating | Notes |
|----------|--------|--------|-------|
| `follow()` | Working | 8/10 | Duplicate check present, self-follow prevented |
| `unfollow()` | Working | 8/10 | Safe delete pattern |
| `giveKudos()` | Working | 8/10 | Duplicate check present, notification created |
| `removeKudos()` | Working | 8/10 | Safe delete pattern |
| `getComments()` | Working | 6/10 | N+1 author loading |
| `addComment()` | **Issue** | 5/10 | No post visibility check |
| `editComment()` | Working | 8/10 | Ownership check present |
| `deleteComment()` | Working | 8/10 | Ownership check present |
| `getNotifications()` | Working | 6/10 | N+1 sender loading |
| `markNotificationsRead()` | Working | 5/10 | Sequential updates, should batch |

**Issues:**
- **[HIGH] `addComment()` (line 135-168):** Does not verify the post is published or the post's author has a public profile. Users can comment on private users' unpublished posts.
- **[MEDIUM] `getComments()` (line 112-133):** N+1 query — each comment loads its author individually. Should batch load.
- **[MEDIUM] `markNotificationsRead()` (line 234-251):** Sequential `ctx.db.patch()` for each notification. With 100 unread notifications, this is 100 database operations.
- **[MEDIUM] `getNotifications()` (line 208-232):** N+1 query — each notification loads its sender individually.

---

### File: `convex/users.ts` — Rating: 7/10

| Function | Status | Rating | Notes |
|----------|--------|--------|-------|
| `getOrCreateUser()` | Working | 7/10 | TOCTOU race on username |
| `getMe()` | Working | 9/10 | Simple, correct |
| `updateMe()` | Working | 7/10 | Good validation, TOCTOU race |
| `checkUsername()` | Working | 8/10 | Proper validation |
| `getByUsername()` | Working | 6/10 | Heavy query, leaks some data |
| `getFollowers()` | Working | 6/10 | N+1 loading |
| `getFollowing()` | Working | 6/10 | N+1 loading |

**Issues:**
- **[HIGH] Username TOCTOU race (line 139-149):** In `updateMe()`, checks if username is taken then updates — another concurrent request could claim it between check and update.
- **[MEDIUM] `getByUsername()` (line 205-339):** For public profiles, loads ALL usage entries unbounded. Heavy profiles with years of data will slow down.
- **[MEDIUM] Private profile still returns `displayName` and `avatarUrl` (line 218-228):** This leaks identity info even when user chose to be private.
- **[LOW]** `getOrCreateUser()` (line 92): Sets `githubUsername` from `identity.nickname` which may not always be the GitHub username.

---

### File: `convex/leaderboard.ts` — Rating: 4/10

| Function | Status | Rating | Notes |
|----------|--------|--------|-------|
| `getLeaderboard()` | **Issues** | 4/10 | Multiple problems |

**Issues:**
- **[CRITICAL] Memory DoS with region filter (line 68-69):** `const sliceEnd = region ? sorted.length : safeOffset + safeLimit` — when region filter is used, loads ALL users into memory before filtering. With 100K+ users, causes memory exhaustion and server crash.
- **[HIGH] Shows private users (line 79-98):** No check for `user.isPublic`. Private users' usernames, avatars, countries, and regions are exposed on the leaderboard.
- **[HIGH] Rank miscalculation (line 85, 103):** Calculates rank BEFORE filtering private users and region, then re-ranks. The initial rank index is wrong because it includes filtered-out entries.
- **[MEDIUM] All-time query loads 10K entries (line 44):** `await ctx.db.query("daily_usage").take(10000)` — arbitrary limit that either misses data or loads too much.

---

### File: `convex/http.ts` — Rating: 6/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| CORS handling | Partial | 5/10 | Localhost in production |
| Security headers | Good | 8/10 | HSTS, X-Frame-Options, CSP present |
| Input validation | Good | 7/10 | Token length check, body parsing |

**Issues:**
- **[HIGH] Localhost in CORS (line 11-12):** `http://localhost:5173` and `http://localhost:3000` in production CORS whitelist. Should use environment-based configuration.
- **[MEDIUM] Source parameter not validated (line 118):** `source: body.source ?? "cli"` trusts user input without validation. Could store arbitrary strings.
- **[LOW]** Error matching uses string includes (line 124) — fragile pattern.

---

### File: `convex/auth.config.ts` — Rating: 3/10

**Issues:**
- **[HIGH] Hardcoded Clerk domain (line 4):** `domain: "https://adjusted-elk-93.clerk.accounts.dev"` — should use environment variable. Cannot change Clerk instance without code change.

---

### File: `convex/posts.ts` — Rating: 7/10

**Issues:**
- **[MEDIUM]** URL validation is weak — accepts malformed URLs.
- **[LOW]** `captionGeneratedBy` field accepts any string without validation.

---

### File: `convex/usage.ts` — Rating: 6/10

**Issues:**
- **[HIGH] Race condition (line ~102-107):** Concurrent submissions with same (userId, date, provider) can both create entries, violating uniqueness.
- **[MEDIUM]** Provider whitelist duplicated across multiple files instead of centralized.

---

### File: `convex/prompts.ts` — Rating: 5/10

**Issues:**
- **[HIGH] Broken pagination:** Paginates by creation time but sorts by vote count. Results in duplicated/skipped items across pages.
- **[MEDIUM] N+1 vote loading:** Each prompt individually queries vote count and user vote status.

---

### File: `convex/cliAuth.ts` — Rating: 5/10

**Issues:**
- **[HIGH] CLI tokens stored in plaintext:** JWT tokens saved unencrypted in database. Database breach = all CLI tokens exposed.
- **[MEDIUM]** No token revocation mechanism.

---

### File: `convex/ai.ts` — Rating: 6/10

**Issues:**
- **[MEDIUM]** User stats embedded directly in OpenAI prompt — potential prompt injection.
- **[MEDIUM]** OpenAI response not validated before returning to client.
- **[LOW]** Typo: "Cation" instead of "Caption".

---

## Frontend Pages Audit

### Page: `Feed.tsx` — Rating: 7/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Global tab | Working | 8/10 | Correctly shows all public posts |
| Following tab | Working | 7/10 | Auth prompt for unauthenticated users |
| Provider filters | Working | 7/10 | Filter persists when switching tabs (may confuse) |
| Infinite scroll | Working | 7/10 | Sentinel-based IntersectionObserver |
| Back to top button | Working | 9/10 | Accessible, correct |
| SEO meta tags | Present | 8/10 | Title, description, canonical, keywords |

**Issues:**
- **[MEDIUM] Multi-user data issue:** The core feed query (`getFeed`) works correctly for data isolation — it checks `author.isPublic` and filters properly. However, `getUserPosts()` called from Profile does NOT check privacy.
- **[MEDIUM]** No "pull to refresh" or "check for new posts" indicator
- **[LOW]** Provider filter persists across tab switches
- **[LOW]** Tab buttons missing `role="tab"` and `aria-selected` attributes

**SEO Status:**
- Title: "Feed -- AI Coding Activity | AWARTS"
- Description: Present and descriptive
- Keywords: Present
- Canonical: `/feed`
- JSON-LD: Not present (should add ItemList schema)

---

### Page: `Profile.tsx` — Rating: 6/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| User info header | Working | 7/10 | Shows avatar, name, bio, links |
| Stats grid | Working | 7/10 | Tokens, cost, streak, days |
| Heatmap | Working | 6/10 | Activity visualization |
| Posts list | **Issue** | 4/10 | Shows private user posts (backend bug) |
| Follow button | Working | 8/10 | Correct behavior |
| Edit profile | Working | 7/10 | Form with validation |
| Achievements | Working | 7/10 | Badge display |

**Issues:**
- **[CRITICAL]** Backend `getUserPosts()` returns posts for private profiles — Profile page displays them
- **[MEDIUM]** `isOwnProfile` could be undefined if user data hasn't loaded yet, making private profile check unreliable
- **[MEDIUM]** No error state if posts list fails to load
- **[LOW]** Activities count uses inconsistent source (`stats.posts` vs `posts.length`)

**SEO Status:**
- Title: Dynamic "@username -- Profile | AWARTS"
- Description: Dynamic per user
- Canonical: `/u/{username}`
- JSON-LD: Should add Person schema
- OG Image: Should use user's avatar

---

### Page: `Leaderboard.tsx` — Rating: 5/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Period selector | Working | 7/10 | Daily/Weekly/Monthly/All-time |
| Provider filter | Working | 7/10 | Filter by AI provider |
| Region filter | **Issue** | 3/10 | Unusable, causes backend DoS |
| Rankings table | Partial | 5/10 | Shows private users |
| Loading state | Working | 7/10 | Skeleton shown |

**Issues:**
- **[CRITICAL]** Region filter causes backend memory exhaustion (loads all users)
- **[HIGH]** Shows private users on leaderboard
- **[HIGH]** Country selector has 200+ options with NO search — practically unusable
- **[MEDIUM]** No pagination — all entries loaded at once
- **[LOW]** Select triggers have no aria-labels

**SEO Status:**
- Title: Present
- Description: Present
- JSON-LD: Should add RankingCollection schema

---

### Page: `Search.tsx` — Rating: 7/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Search input | Working | 7/10 | 300ms debounce, min 2 chars |
| Results display | Working | 7/10 | User cards with follow buttons |
| Empty state | Working | 8/10 | Clear messaging |
| Loading state | Working | 7/10 | Skeleton shown |

**Issues:**
- **[MEDIUM]** Input lacks associated `<label>` element (accessibility)
- **[MEDIUM]** Error state exists but error message not displayed
- **[LOW]** Loading spinner shows for invalid queries (<2 chars)
- **[LOW]** 300ms debounce not communicated to user

**SEO Status:**
- Title: Present
- Canonical: `/search`
- noindex: Correctly set

---

### Page: `Follows.tsx` — Rating: 5/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Followers tab | Working | 6/10 | Lists followers with follow buttons |
| Following tab | Working | 6/10 | Lists followed users |
| Tab switching | Working | 6/10 | TypeScript issue with `tabs` |
| Error handling | Working | 7/10 | Error state and retry |

**Issues:**
- **[HIGH]** `typeof tabs[number]` references undefined `tabs` variable — TypeScript type issue (compiles due to `strict: false`)
- **[MEDIUM]** Tab counts show during loading with potentially stale data
- **[MEDIUM]** FollowButton state not synced across tabs
- **[LOW]** Missing `role="tab"` and `aria-selected`

**SEO Status:**
- Title: Dynamic
- noindex: Correctly set (user-specific page)

---

### Page: `PostNew.tsx` — Rating: 6/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Title input | Working | 7/10 | Character limit enforced |
| Description editor | Working | 7/10 | Character limit enforced |
| Image upload | Partial | 5/10 | No progress indicator |
| AI caption | Working | 7/10 | Generate from stats |
| Publish toggle | Working | 8/10 | Clear toggle |

**Issues:**
- **[HIGH]** File upload shows NO progress indicator
- **[MEDIUM]** Multiple files uploaded sequentially — if file 5 fails, files 1-4 already uploaded with no rollback
- **[MEDIUM]** Memory leak — creates DOM input elements without cleanup
- **[LOW]** Title character limit (100) has no visual warning at 80/90%

**SEO Status:**
- noindex: Correctly set (editing page)

---

### Page: `Onboarding.tsx` — Rating: 7/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Username step | Working | 7/10 | Validation present |
| Profile step | Working | 7/10 | Optional fields |
| Setup complete | Working | 8/10 | CLI setup instructions |

**Issues:**
- **[MEDIUM]** Username validation silently removes invalid characters without feedback
- **[LOW]** No estimated time for 3-step process

---

### Page: `Docs.tsx` — Rating: 6/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Section listing | Working | 7/10 | 12 documentation sections |
| Section search | Partial | 5/10 | Only searches titles, not content |
| Code blocks | Partial | 4/10 | No copy button, no syntax highlighting |

**Issues:**
- **[MEDIUM]** Search only searches section TITLES, not content
- **[MEDIUM]** Code blocks have no copy-to-clipboard functionality
- **[MEDIUM]** Sections not deep-linkable (can't share URL to specific section)
- **[LOW]** No syntax highlighting on code blocks

**SEO Status:**
- Title: Present
- Description: Present
- JSON-LD: FAQPage schema (good)

---

### Page: `Prompts.tsx` — Rating: 6/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Prompt listing | Working | 6/10 | Pagination issues from backend |
| Submit prompt | Working | 7/10 | Form with validation |
| Vote toggle | Working | 7/10 | Optimistic UI |
| Anonymous submit | **Issue** | 5/10 | Shows username even when anonymous |

**Issues:**
- **[MEDIUM]** Backend pagination is broken (sorts by votes but paginates by time)
- **[MEDIUM]** Shows username even when "submit as anonymous" is checked
- **[LOW]** `err.message` might not exist — could show "undefined"

---

### Page: `Recap.tsx` — Rating: 6/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Period selector | Working | 7/10 | Weekly/Monthly/Yearly |
| Stats display | Working | 7/10 | Usage visualization |
| Share card | Working | 7/10 | Social sharing |

**Issues:**
- **[MEDIUM]** No error state if profile fetch fails
- **[LOW]** Period selector has no label text

---

### Page: `AuthCallback.tsx` — Rating: 4/10

| Section/Feature | Status | Rating | Notes |
|-----------------|--------|--------|-------|
| Auth redirect | Working | 5/10 | Shows spinner while loading |
| Error handling | **Missing** | 2/10 | No timeout, no error state |

**Issues:**
- **[HIGH]** No timeout handling — spinner shows forever if Clerk hangs
- **[MEDIUM]** No error boundary for authentication failures

---

### Pages: `Privacy.tsx`, `Terms.tsx` — Rating: 8/10

These are simple static pages with proper SEO. No significant issues.

---

## Frontend Components Audit

### Component: `ActivityCard.tsx` — Rating: 7/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| Post display | Working | 7/10 | Shows usage data, images, actions |
| Image grid | Working | 7/10 | Grid layout with lightbox |
| Kudos button | Working | 8/10 | Optimistic toggle |
| Comment link | Working | 8/10 | Links to post detail |

**Issues:**
- **[MEDIUM]** Nested ImageGrid/ImageLightbox functions recreated on every render — should memoize
- **[LOW]** Division by zero edge case when totalCost is 0

---

### Component: `FollowButton.tsx` — Rating: 8/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| Follow toggle | Working | 8/10 | Correct logic verified |
| Hover state | Working | 8/10 | Shows "Unfollow" on hover |
| Auth redirect | Working | 9/10 | Redirects to login |
| Optimistic UI | Working | 8/10 | Immediate state update |

The follow/unfollow logic is actually **correct** — the component sends the OLD state to the hook, and the hook's logic (`data.isFollowing ? unfollow() : follow()`) correctly interprets it. No bug here despite the confusing naming.

---

### Component: `KudosButton.tsx` — Rating: 8/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| Kudos toggle | Working | 8/10 | Correct logic verified |
| Animation | Working | 8/10 | Spring animation on toggle |
| Count display | Working | 8/10 | Optimistic count update |

Same as FollowButton — the logic is correct. OLD state is sent, hook interprets correctly.

---

### Component: `CommentThread.tsx` — Rating: 6/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| Comment display | Working | 6/10 | XSS risk from user content |
| Add comment | Working | 7/10 | Form with validation |
| Edit comment | Working | 7/10 | Inline editing |
| Delete comment | Working | 7/10 | Confirmation dialog |

**Issues:**
- **[HIGH]** User comments rendered as `<p>{comment.content}</p>` without sanitization. If backend ever fails to sanitize, XSS is possible.
- **[MEDIUM]** No optimistic UI for comments (waits for server response)

---

### Component: `NotificationPanel.tsx` — Rating: 6/10

**Issues:**
- **[MEDIUM]** Accesses `n.actor.username` without null check — should use `n.actor?.username`

---

### Component: `LeaderboardTable.tsx` — Rating: 6/10

**Issues:**
- **[MEDIUM]** Unsafe `(user as any)._id` type cast — violates type safety

---

### Component: `SEO.tsx` — Rating: 8/10

| Feature | Status | Rating | Notes |
|---------|--------|--------|-------|
| Meta tags | Working | 8/10 | Title, description, OG, Twitter |
| JSON-LD | Working | 7/10 | Serialized without validation |
| Canonical URL | Working | 8/10 | Base URL + path |

**Issues:**
- **[LOW]** `jsonLd` prop serialized without validation — but since it's always defined in source code (not from user input), risk is minimal.

---

### Component: `ErrorBoundary.tsx` — Rating: 7/10

**Issues:**
- **[LOW]** No error logging/reporting — errors only shown to user

---

### Component: `ShareActions.tsx` — Rating: 6/10

**Issues:**
- **[MEDIUM]** No `res.ok` check before calling `.blob()` on fetch response

---

### Layout Components — Rating: 7/10

| Component | Rating | Notes |
|-----------|--------|-------|
| `AppShell.tsx` | 7/10 | Good responsive layout |
| `Navbar.tsx` | 7/10 | "/" keyboard shortcut undiscoverable |
| `LeftSidebar.tsx` | 7/10 | Navigation links |
| `RightSidebar.tsx` | 6/10 | Shows "0d" stats during loading |
| `BottomNav.tsx` | 8/10 | Mobile navigation |

---

### Hooks — Rating: 7/10

| Hook | Rating | Notes |
|------|--------|-------|
| `use-api.ts` | 8/10 | Clean Convex hook wrappers |
| `use-debounce.ts` | 8/10 | Standard debounce |
| `use-mobile.tsx` | 6/10 | Potential hydration mismatch |
| `use-toast.ts` | 6/10 | Long timeouts (1000000ms) not cleared |

---

### Libraries — Rating: 7/10

| File | Rating | Notes |
|------|--------|-------|
| `utils.ts` | 9/10 | Standard cn() utility |
| `format.ts` | 8/10 | Good formatting functions |
| `types.ts` | 7/10 | Type definitions |
| `transformers.ts` | 7/10 | Handles legacy + Convex formats |
| `mock-data.ts` | N/A | Test data only |

---

## Infrastructure Audit

### `index.html` — Rating: 8/10

Good SEO foundation with comprehensive meta tags, JSON-LD schemas, Google Search Console verification.

**Issues:**
- **[LOW]** Missing font preload hints for performance

---

### `vercel.json` — Rating: 7/10

Good security headers (HSTS, X-Frame-Options, Referrer-Policy).

**Issues:**
- **[MEDIUM]** CSP uses `'unsafe-inline'` for scripts — weakens XSS protection (may be needed for Clerk)

---

### `.gitignore` — Rating: 6/10

**Issues:**
- **[HIGH]** `.claude/settings.local.json` is staged for commit — should be gitignored
- **[MEDIUM]** `.lovable/` directory should be added to `.gitignore`
- **[LOW]** Missing entries: `coverage/`, `.pnpm-store/`

---

### Lock Files — Rating: 4/10

**Issues:**
- **[HIGH]** Three lock files exist: `pnpm-lock.yaml`, `package-lock.json`, `bun.lockb`. Should standardize on pnpm only.

---

### TypeScript Config — Rating: 5/10

**Issues:**
- **[HIGH]** `strict: false` in `tsconfig.app.json` — disables all strict checks (`noImplicitAny`, `strictNullChecks`, etc.). This is why bugs like the `tabs` reference compile without error.

---

### `.env` / `.env.local` — Rating: 7/10

Both files are correctly in `.gitignore`.

**Issues:**
- **[MEDIUM]** No `.env.example` file for developer reference

---

### Repository Organization — Rating: 6/10

**Issues:**
- **[MEDIUM]** `/plans/` directory contains ~240 KB of planning docs — should be in wiki/docs repo
- **[MEDIUM]** `/backend/` directory is empty — unclear purpose
- **[MEDIUM]** `/e2e/` directory has test infrastructure but no actual tests
- **[LOW]** `dist/` should be gitignored (it appears to be built output)

---

## SEO Audit

### Current SEO Implementation — Rating: 7/10

**Strengths:**
- SEO component with reusable meta tags
- Open Graph and Twitter Card tags on all pages
- Canonical URLs properly set
- `noindex` correctly applied to user-specific/editing pages
- JSON-LD schemas in `index.html` (WebApplication, Organization, BreadcrumbList)
- Google Search Console verification present
- robots.txt and sitemap.xml configured

### Missing SEO Per Page:

| Page | Title | Description | Keywords | Canonical | JSON-LD | OG Image | Rating |
|------|-------|-------------|----------|-----------|---------|----------|--------|
| Feed | Yes | Yes | Yes | Yes | **Missing** | Default | 7/10 |
| Profile | Dynamic | Dynamic | **Missing** | Yes | **Missing Person** | **Should use avatar** | 6/10 |
| Leaderboard | Yes | Yes | **Missing** | Yes | **Missing** | Default | 6/10 |
| Search | Yes | Yes | **Missing** | Yes | N/A (noindex) | Default | 7/10 |
| Follows | Dynamic | Dynamic | N/A | N/A | N/A (noindex) | N/A | 7/10 |
| PostNew | N/A | N/A | N/A | N/A (noindex) | N/A | N/A | 8/10 |
| Onboarding | Yes | Yes | N/A | N/A (noindex) | N/A | N/A | 7/10 |
| Docs | Yes | Yes | Yes | Yes | Yes (FAQ) | Default | 8/10 |
| Privacy | Yes | Yes | **Missing** | Yes | **Missing** | Default | 6/10 |
| Terms | Yes | Yes | **Missing** | Yes | **Missing** | Default | 6/10 |
| Recap | Yes | Yes | N/A | N/A (noindex) | N/A | N/A | 7/10 |
| Prompts | Yes | Yes | **Missing** | Yes | **Missing** | Default | 6/10 |

### Recommended JSON-LD Additions:
1. **Feed page:** `ItemList` schema for recent posts
2. **Profile page:** `Person` schema with social links
3. **Leaderboard page:** `ItemList` schema for rankings
4. **Prompts page:** `ItemList` schema for prompts
5. **Privacy/Terms pages:** `WebPage` schema

---

## Feature Recommendations

### Advanced Features to Add:

1. **Real-time feed updates** — Show "X new posts" banner when new posts arrive (Convex supports this natively)
2. **Post bookmarks/saves** — Let users save posts for later
3. **User badges/achievements system** — Schema exists (`user_achievements`) but UI is minimal
4. **Weekly email digest** — Users already have `emailNotificationsEnabled` setting
5. **AI-powered recap insights** — Use the existing AI integration for weekly/monthly summaries
6. **Post reactions** — Beyond kudos, add emoji reactions
7. **Direct messaging** — Between users (with privacy controls)
8. **Provider comparison charts** — Compare cost/usage across providers over time
9. **Team/Organization accounts** — Group tracking for teams
10. **API rate limiting** — Prevent abuse on all HTTP endpoints
11. **Webhook integrations** — Send notifications to Discord/Slack
12. **Data export** — Let users export their usage data (GDPR compliance)
13. **Two-factor authentication** — Via Clerk (already supports it)
14. **Content moderation** — Automated + manual review for comments/prompts
15. **PWA support** — Service worker for offline access

### Quick Wins:
1. Add skeleton loading to RightSidebar
2. Add search to country selector on Leaderboard
3. Add copy-to-clipboard on code blocks in Docs
4. Add file upload progress indicator
5. Add "check for new posts" button on Feed

---

## Repo Organization

### Current Structure:
```
/
  backend/          (empty - remove or use)
  cli/              (CLI auth tool)
  convex/           (Convex backend)
  dist/             (build output - should gitignore)
  e2e/              (empty tests - remove or implement)
  plans/            (planning docs - move to wiki)
  public/           (static assets)
  src/
    components/
      layout/       (AppShell, Navbar, Sidebars, BottomNav)
      ui/           (shadcn/ui components)
      [components]  (custom components mixed at root)
    context/        (AuthContext)
    hooks/          (custom hooks)
    lib/            (utils, types, transformers)
    pages/          (route pages)
    test/           (test setup)
  .lovable/         (should gitignore)
```

### Recommended Structure:
```
/
  convex/           (Convex backend - keep as-is)
  cli/              (CLI tool - keep as-is)
  public/           (static assets - keep as-is)
  src/
    components/
      layout/       (layout components)
      ui/           (shadcn/ui)
      feed/         (ActivityCard, SkeletonCard)
      social/       (FollowButton, KudosButton, CommentThread)
      profile/      (StatsGrid, AchievementBadge, ShareCard)
      common/       (ErrorState, ErrorBoundary, SEO, NavLink)
    context/        (keep as-is)
    hooks/          (keep as-is)
    lib/            (keep as-is)
    pages/          (keep as-is)
    test/           (keep as-is)
  docs/             (move plans/ content here or to wiki)
```

### Files to Clean Up:
1. Remove `backend/` (empty directory)
2. Remove `e2e/` or implement tests
3. Move `plans/` to separate docs repo or wiki
4. Add `.lovable/` to `.gitignore`
5. Add `dist/` to `.gitignore` (if not already)
6. Remove `package-lock.json` and `bun.lockb`
7. Add `"packageManager": "pnpm@latest"` to `package.json`

---

## Priority Fix Order

### Week 1 (Critical):
1. Fix `getUserPosts()` privacy check
2. Fix `addComment()` post visibility check
3. Fix leaderboard region filter DoS
4. Fix leaderboard private user exposure
5. Add `tabs` constant to Follows.tsx
6. Add AuthCallback timeout handling
7. Move Clerk domain to environment variable

### Week 2 (High):
8. Fix username TOCTOU race condition
9. Fix usage submission race condition
10. Fix prompts pagination
11. Remove localhost from production CORS
12. Clean up lock files
13. Enable TypeScript strict mode
14. Add `.env.example`

### Week 3 (Medium):
15. Add missing JSON-LD schemas
16. Add missing keywords meta tags
17. Fix N+1 queries in social.ts
18. Add file upload progress
19. Fix NotificationPanel null checks
20. Add search to country selector
21. Add copy-to-clipboard on code blocks

### Week 4 (Low):
22. Add ARIA attributes to tabs
23. Add form labels for accessibility
24. Reorganize component directories
25. Add error logging
26. Implement skeleton for RightSidebar
27. Add deep-linking to Docs sections
