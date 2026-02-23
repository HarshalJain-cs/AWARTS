

# 🚀 STRAUDE Multi-Model — Implementation Plan

> "Strava for AI Coding Agents" — Built with React + Vite + TypeScript + Tailwind CSS + shadcn/ui

---

## Overview

A social platform where developers track, share, and compete based on their AI coding agent usage (Claude, Codex, Gemini, Antigravity). Features a social feed, leaderboards, user profiles with GitHub-style heatmaps, achievements, and shareable recap cards. All pages will use realistic mock data with the architecture ready for future Supabase integration.

---

## Phase 1 — Design System & App Shell

**Design System Setup**
- Custom color tokens: burnt orange brand accent (#DF561F), provider colors (Claude orange, Codex green, Gemini blue, Antigravity purple), neutrals, rank badge colors
- Typography: Inter for UI, JetBrains Mono for stats/code
- Custom CSS variables for shadows, spacing, and radii

**Provider Constants**
- Provider config system with colors, labels, logos, and CSS classes for Claude, Codex, Gemini, and Antigravity
- Reusable `ProviderChip` component (colored pill with dot + label)

**App Shell — 3-Column Layout**
- Top navbar: STRAUDE logo, search input, notification bell with badge, user avatar dropdown
- Left sidebar (desktop): Feed, Leaderboard, Search, My Profile, Settings, Import Data, My Recap — with active route highlighting
- Right sidebar (desktop): "Who to follow" suggestions, quick stats widget
- Bottom navigation (mobile): Home, Leaderboard, Search, Profile icons
- Responsive: collapses to single column + bottom nav on mobile

**Utility Functions**
- `formatCost()`, `formatTokens()`, `formatDate()` helpers for consistent display
- Mock data generators for all entity types (users, posts, usage data, comments)

---

## Phase 2 — Feed & Activity Cards

**Feed Page**
- Two tabs: "Following" and "Global" with animated sliding underline indicator
- Infinite scroll loading with intersection observer
- Skeleton loading cards while data loads

**Activity Card (Core Component)**
- Header: avatar, @username, verified badge, timestamp
- Title + markdown-rendered description with @mention links
- Provider chips showing which AI tools were used (colored pills)
- Expandable "Provider Breakdown" section showing per-provider cost/tokens
- Stats grid: Cost, Input Tokens, Output Tokens, Sessions — in a 4-column layout with monospace numbers
- Image gallery: responsive grid (1-5 images) with fullscreen lightbox
- Action bar: ⚡ Kudos button with count, 💬 Comment count link, Share button

---

## Phase 3 — Social Layer

**Kudos System (⚡)**
- Toggle button with optimistic UI and spring animation on the bolt icon
- Instant count update, reverts on error

**Comments**
- Flat comment thread on post detail page
- Comment input with @mention autocomplete (dropdown user search as you type @)
- Markdown-rendered comment content

**Follow/Unfollow**
- Follow button with optimistic state change
- Hover state shows "Unfollow" when already following

**Notifications**
- Bell icon with unread count badge
- Dropdown panel: kudos, comments, mentions, new followers
- "Mark all read" action

---

## Phase 4 — Leaderboard & Search

**Leaderboard Page**
- Three filter dropdowns: Time Period (Today/Week/Month/All Time), Region (Global + countries), Provider (All/Claude/Codex/Gemini/Antigravity)
- Ranked table with columns: Rank, User (avatar + username + provider dots), Spend, Tokens, Streak
- Gold/Silver/Bronze medal emojis for top 3
- Current user's row highlighted with accent background and left border
- Provider color dots next to each user showing which tools they use

**Search Page**
- Autofocused search input with 300ms debounce
- User result cards: avatar, username, bio, follower count, provider badges
- Empty and no-results states

---

## Phase 5 — User Profiles & Contribution Graph

**Profile Header**
- Large avatar, @username, bio, location, join date
- Following/Followers counts
- Follow button (for other users) or Edit Profile button (own profile)
- Provider badges showing which AI tools the user has used

**Stats Card**
- Lifetime totals: total spend, total tokens, current streak
- Per-provider breakdown table (collapsible)

**Contribution Graph**
- 52×7 GitHub-style heatmap grid
- Cell colors based on dominant AI provider used that day
- Tooltips showing date, spend, and providers used
- Legend with intensity scale + "Color = dominant provider" label

**Streak Counter**
- Fire emoji + day count with accent styling
- Empty state encouraging first data push

**Profile Posts**
- Feed of user's activity cards (same component as main feed)

---

## Phase 6 — Multi-Model Provider UI

**Feed Provider Filter**
- Collapsible filter bar above the feed
- Filter chips for each provider + "All" option
- Provider-colored active states

**Provider Stats Breakdown on Profile**
- Detailed per-provider lifetime stats table
- Cost and token totals for each provider with provider-colored values

**AI Provider Settings**
- Radio selection for default caption generation AI
- Provider cards with logo, name, and description

---

## Phase 7 — Achievements & Recap Cards

**Achievement System**
- 13 badges: First Sync, Week Warrior, Power User, 100K Output, 1M Output, 100M Output, Big Spender, Elite, Polyglot Coder, Full Stack AI, Codex Pioneer, Gemini Explorer, AG Pilot
- Badge display: emoji in rounded box with tooltip showing name + description
- Unearned badges shown greyed out
- Achievement unlock toast: spring animation from bottom with accent border

**Recap Card Generator**
- Shareable card rendered at 1200×630 (OG) and 1080×1080 (Instagram)
- Content: username, period, total spend, total tokens, streak, provider breakdown
- Dark gradient background
- Download buttons for both formats

---

## Phase 8 — Landing Page

**Hero Section**
- Bold headline: "Track your AI coding. All of it."
- Subtitle mentioning all 4 providers
- CTA button: "Get Started — Free"
- Provider logo strip showing all 4 provider icons
- Animated CLI demo terminal showing multi-provider sync

**Provider Showcase**
- 4 provider cards with provider-colored borders and backgrounds
- Each card: logo, provider name, CLI command description

**Features Grid**
- Feature cards: Track spending, Share activity, Compete on leaderboards, Maintain streaks, Multi-model dashboard

**How It Works**
- 3-step flow: Install CLI → Push data → Compete & share

**Wall of Love**
- Masonry grid of static tweet-style testimonial cards
- Slightly rotated cards for organic feel
- Optional provider chip per testimonial

---

## Phase 9 — Settings & Onboarding

**Onboarding Flow**
- 3-step wizard: Choose username → Set country → Install CLI/import instructions
- Progress bar, smooth slide transitions
- Username availability check

**Settings Page**
- Profile: avatar, display name, bio, timezone
- Privacy: public/private toggle
- Notifications: per-type toggles (kudos, comments, mentions, follows)
- AI Provider: default caption AI selection
- Import Data: drag-and-drop JSON import with provider selection and date picker
- Account: email, delete account

---

## Phase 10 — Animations & Polish

**Motion**
- Page transitions: fade + slide
- Feed card stagger animation on load
- Kudos bolt: scale + rotate burst
- Provider chips: slide-in on mount
- Contribution graph: wave fade-in
- Achievement toast: spring from bottom

**Responsive Adaptations**
- Stats grid: 2×2 on mobile, 4×1 on desktop
- Contribution graph: horizontally scrollable on mobile
- Leaderboard: simplified columns on mobile

**Accessibility**
- Focus-visible rings on all interactive elements
- Provider chips always show text labels (not just color)
- Aria labels on contribution graph cells
- Semantic HTML: article, section, nav elements
- Reduced motion support

**Loading & Error States**
- Skeleton loaders for every data component
- Error cards with retry buttons
- Contextual empty states with CTAs

