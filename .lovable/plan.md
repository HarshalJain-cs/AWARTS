

# STRAUDE — Full Implementation Plan (Matching straude.com Reference)

## Design Reference

Based on the live straude.com site, the design uses:
- **Dark theme by default** — near-black background (#0D0D0D range), dark cards
- **Burnt orange accent** (#DF561F / similar) for CTAs, the STRAUDE logo trapezoid, and highlights
- **Monospace font** (JetBrains Mono) for terminal demos, stats, and code snippets
- **Inter** for body/UI text
- **Minimal, clean layout** — lots of whitespace, sharp contrast
- **Orange trapezoid logo** icon next to "STRAUDE" wordmark

---

## File Structure Overview

```text
src/
  lib/
    types.ts          -- TypeScript types for all entities
    constants.ts      -- Provider config, achievements, country list
    format.ts         -- formatCost, formatTokens, formatDate helpers
    mock-data.ts      -- Realistic mock data for all entities
  components/
    layout/
      AppShell.tsx    -- 3-column responsive layout wrapper
      Navbar.tsx      -- Top navigation bar
      LeftSidebar.tsx -- Desktop left sidebar
      RightSidebar.tsx-- Desktop right sidebar  
      BottomNav.tsx   -- Mobile bottom navigation
    ProviderChip.tsx  -- Colored provider pill component
    ActivityCard.tsx  -- Feed post card (core reusable component)
    KudosButton.tsx   -- Lightning bolt kudos toggle
    FollowButton.tsx  -- Follow/Unfollow button
    CommentThread.tsx -- Comment list + input
    ContributionGraph.tsx -- GitHub-style heatmap
    AchievementBadge.tsx  -- Achievement badge display
    RecapCard.tsx     -- Shareable recap card generator
    StatsGrid.tsx     -- 4-column stats display
    SkeletonCard.tsx  -- Loading skeleton for cards
    TerminalDemo.tsx  -- Animated CLI demo for landing page
    TestimonialCard.tsx -- Tweet-style testimonial
    LeaderboardTable.tsx -- Ranked user table
    UserSearchCard.tsx   -- Search result card
    NotificationPanel.tsx -- Notification dropdown
  pages/
    Landing.tsx       -- Public landing page (/)
    Feed.tsx          -- Social feed (/feed)
    Leaderboard.tsx   -- Leaderboard (/leaderboard)
    Search.tsx        -- User search (/search)
    Profile.tsx       -- User profile (/u/:username)
    PostDetail.tsx    -- Single post detail (/post/:id)
    Settings.tsx      -- Settings page (/settings)
    Recap.tsx         -- Recap card generator (/recap)
    Onboarding.tsx    -- Onboarding wizard (/onboarding)
  App.tsx             -- Updated routing
```

---

## Phase 1 — Foundation (Types, Constants, Utils, Mock Data)

### `src/lib/types.ts`
- `Provider` enum: `claude | codex | gemini | antigravity`
- `User`: id, username, displayName, avatar, bio, location, country, countryCode, joinDate, followers, following, isVerified, isFollowing, providers[], streak, totalSpend, totalTokens
- `Post`: id, user, title, description, providers[], providerBreakdown[], stats (cost, inputTokens, outputTokens, sessions), images[], kudosCount, commentCount, hasKudosed, createdAt
- `Comment`: id, user, content, createdAt
- `Notification`: id, type (kudos|comment|mention|follow), actor, post?, read, createdAt
- `Achievement`: id, name, emoji, description, earned, earnedAt?
- `LeaderboardEntry`: rank, user, spend, tokens, streak, providers[]
- `HeatmapDay`: date, spend, dominantProvider, intensity (0-4)

### `src/lib/constants.ts`
- `PROVIDERS` config map: each provider has `id, name, color (hex), hslVar, bgClass, textClass, dotClass`
- `ACHIEVEMENTS` array of 13 badge definitions
- `COUNTRIES` list for leaderboard filter

### `src/lib/format.ts`
- `formatCost(cents: number)` -- "$1,420.50"
- `formatTokens(count: number)` -- "312K", "1.2M"
- `formatDate(date: string)` -- "2h ago", "Feb 18"
- `formatNumber(n: number)` -- "1,234"

### `src/lib/mock-data.ts`
- 10+ mock users with realistic data, avatars (ui-avatars.com), varied providers
- 15+ mock posts with varied stats, provider breakdowns
- Mock comments, notifications, leaderboard entries
- 365 days of heatmap data
- `currentUser` representing the logged-in user

---

## Phase 2 — App Shell & Layout

### `Navbar.tsx`
- Orange trapezoid icon + "STRAUDE" wordmark (left)
- Search input with magnifying glass icon (center, desktop only)
- Notification bell with red unread badge + user avatar dropdown (right)
- Dark background matching the reference site

### `LeftSidebar.tsx`
- Navigation links: Feed, Leaderboard, Search, My Profile, Settings, Import Data, My Recap
- Icons from lucide-react for each item
- Active route highlighted with orange accent + background
- Collapsed on mobile (hidden)

### `RightSidebar.tsx`
- "Who to follow" section: 3 suggested users with avatar, username, Follow button
- Quick stats widget: your streak, this month spend, rank

### `BottomNav.tsx`
- Mobile only (lg:hidden): Home, Leaderboard, Search, Profile icons
- Active state with orange fill

### `AppShell.tsx`
- 3-column grid on desktop: 240px left sidebar | flexible center | 300px right sidebar
- Single column + bottom nav on mobile
- Wraps page content as children
- Framer Motion page transition wrapper

### `App.tsx` routing
- `/` -- Landing page (no AppShell)
- `/feed` -- Feed (with AppShell)
- `/leaderboard` -- Leaderboard (with AppShell)
- `/search` -- Search (with AppShell)
- `/u/:username` -- Profile (with AppShell)
- `/post/:id` -- Post Detail (with AppShell)
- `/settings` -- Settings (with AppShell)
- `/recap` -- Recap (with AppShell)
- `/onboarding` -- Onboarding (no AppShell)

---

## Phase 3 — Core Components

### `ProviderChip.tsx`
- Small colored pill: colored dot + provider name
- Props: provider id, size (sm/md)
- Uses provider color from constants

### `StatsGrid.tsx`
- 4 stats in a row: Cost, Input Tokens, Output Tokens, Sessions
- Monospace font for numbers
- Muted labels above values
- 2x2 grid on mobile, 4x1 on desktop

### `ActivityCard.tsx` (the core feed card)
- Card with dark background matching reference
- Header: avatar, @username, verified badge, relative timestamp
- Title text
- Provider chips row
- Stats grid (Cost, Tokens, Models as shown on reference)
- Action bar: Kudos button with count, Comment count, Share
- Expandable provider breakdown (Collapsible)
- Stagger animation on mount

### `KudosButton.tsx`
- Lightning bolt icon toggle
- Orange when active, muted when inactive
- Count display
- `animate-kudos-burst` on toggle via framer-motion spring

### `FollowButton.tsx`
- "Follow" (outline) / "Following" (filled) states
- Hover on "Following" shows "Unfollow" in red
- Optimistic state toggle

### `SkeletonCard.tsx`
- Matches ActivityCard layout with shimmer placeholders

---

## Phase 4 — Pages

### `Landing.tsx` (matches straude.com homepage exactly)
- **Navbar**: STRAUDE logo left, "Log in" + "Get Started" button right
- **Hero**: "STRAVA FOR CLAUDE CODE" monospace subtitle, "Every session counts." large heading, subtitle text, "Start Your Streak" orange CTA + `npx straude@latest` copy pill
- **Terminal demo**: Animated typing effect showing `$ bunx straude`, scanning, results, "POSTED" line
- **Live stats counter**: "X developers logging daily", "X M tokens tracked", "X countries"
- **Sessions visualized section**: Mock feed cards + leaderboard preview side by side
- **Features grid**: "Log your output", "Share your sessions", "Chase the leaderboard"
- **Wall of Love**: Masonry grid of real tweet testimonials (from the reference data)
- **CTA footer**: "Your move." + sign up button
- Dark gradient background throughout, particle/wave effect via CSS

### `Feed.tsx`
- Tab bar: "Following" | "Global" with sliding underline
- Provider filter chips (All, Claude, Codex, Gemini, Antigravity)
- List of ActivityCard components with staggered load animation
- Skeleton loading state
- Intersection observer for infinite scroll simulation

### `Leaderboard.tsx`
- Filter bar: Time period dropdown, Region dropdown, Provider dropdown
- LeaderboardTable component
- Rank column with gold/silver/bronze medals for top 3
- User column: avatar + username + country flag + provider dots
- Spend, Tokens, Streak columns
- Current user row highlighted with orange left border
- Responsive: simplified on mobile

### `Search.tsx`
- Autofocused search input with debounce
- Results as UserSearchCard components
- Empty state and no-results state

### `Profile.tsx` (`/u/:username`)
- Profile header: large avatar, username, bio, location, join date, follower/following counts
- Follow/Edit button
- Provider badges
- Stats card with lifetime totals
- Contribution graph (52x7 heatmap)
- Streak counter with fire emoji
- Achievement badges grid
- User's posts feed

### `PostDetail.tsx`
- Full ActivityCard (expanded)
- Comment thread below
- Comment input with submit

### `Settings.tsx`
- Tabbed sections: Profile, Privacy, Notifications, AI Provider, Import Data, Account
- Profile: avatar, name, bio, timezone inputs
- Privacy: public/private toggle
- Notifications: per-type toggles
- Import: drag-and-drop zone with provider selection
- Account: email display, delete account button

### `Recap.tsx`
- Preview of shareable recap card
- Period selector (This Week, This Month, All Time)
- Card shows: username, period, total spend, tokens, streak, provider breakdown
- Dark gradient card design
- Download buttons: "Download OG (1200x630)" and "Download Square (1080x1080)"

### `Onboarding.tsx`
- 3-step wizard with progress bar
- Step 1: Choose username (with availability check simulation)
- Step 2: Select country
- Step 3: CLI install instructions
- Smooth slide transitions between steps

---

## Phase 5 — Social Components

### `CommentThread.tsx`
- List of comments with avatar, username, timestamp, content
- Comment input at bottom with "Post" button
- @mention autocomplete dropdown

### `NotificationPanel.tsx`
- Dropdown from bell icon
- Notification items: icon + actor + action + timestamp
- Unread styling (bold/dot)
- "Mark all read" button

### `ContributionGraph.tsx`
- 52x7 grid of small squares
- Color = dominant provider color, opacity = intensity
- Tooltip on hover: date, spend, providers
- Legend showing provider colors + intensity scale
- Horizontally scrollable on mobile

### `AchievementBadge.tsx`
- Emoji in a rounded container
- Tooltip with name + description
- Greyed out if unearned
- Grid layout for badge collection

---

## Phase 6 — Animations & Polish

- Framer Motion `AnimatePresence` for page transitions
- Staggered card entrance in feed (delay per index)
- Kudos burst spring animation
- Provider chips slide-in
- Contribution graph wave fade-in
- Skeleton shimmer animation
- Reduced motion media query support
- Focus-visible rings on all interactive elements
- Semantic HTML throughout (article, section, nav, main)
- All provider indicators include text labels for accessibility

---

## Technical Notes

- **Stack**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui (Radix)
- **Routing**: React Router v6 with nested layouts
- **Animation**: Framer Motion (already installed)
- **Icons**: Lucide React (already installed)
- **Charts**: Recharts for any chart needs
- **State**: React useState/useReducer for local state, no global state needed with mock data
- **Dark mode**: Default dark theme matching straude.com, with class-based toggle support
- **No backend**: All data is mock/hardcoded, architecture ready for future Supabase integration

