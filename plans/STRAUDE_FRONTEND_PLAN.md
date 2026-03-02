# 🚀 STRAUDE MULTI-MODEL — COMPLETE FRONTEND DEVELOPMENT PLAN

> **"Strava for AI Coding Agents — Claude, Codex, Gemini & Antigravity"**
> 
> Built with: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Base UI · motion/react · Supabase · Bun

---

## 📋 TABLE OF CONTENTS

1. [Design System & Tokens](#1-design-system--tokens)
2. [Project Structure](#2-project-structure)
3. [Phase 1 — Foundation & Core Shell](#phase-1--foundation--core-shell)
4. [Phase 2 — Feed & Activity Cards](#phase-2--feed--activity-cards)
5. [Phase 3 — Social Layer](#phase-3--social-layer)
6. [Phase 4 — Leaderboard & Search](#phase-4--leaderboard--search)
7. [Phase 5 — User Profiles & Contribution Graph](#phase-5--user-profiles--contribution-graph)
8. [Phase 6 — Multi-Model Provider UI](#phase-6--multi-model-provider-ui)
9. [Phase 7 — Achievements & Recap Cards](#phase-7--achievements--recap-cards)
10. [Phase 8 — Landing Page Rebuild](#phase-8--landing-page-rebuild)
11. [Phase 9 — Settings, Onboarding & Import](#phase-9--settings-onboarding--import)
12. [Phase 10 — Animations, Polish & Accessibility](#phase-10--animations-polish--accessibility)
13. [Component Reference Catalogue](#component-reference-catalogue)
14. [State Management Strategy](#state-management-strategy)
15. [Performance Guidelines](#performance-guidelines)

---

## 1. DESIGN SYSTEM & TOKENS

### 1.1 Color Palette

```css
/* globals.css — CSS Custom Properties */
:root {
  /* ── Primary Brand ── */
  --color-accent:           #DF561F;   /* Burnt orange — CTAs, active states, rank #1 */
  --color-accent-hover:     #C44A18;   /* Darker hover */
  --color-accent-subtle:    rgba(223, 86, 31, 0.08);  /* Hover backgrounds */
  --color-highlight-row:    rgba(223, 86, 31, 0.12);  /* Current user on leaderboard */

  /* ── Secondary Accents ── */
  --color-secondary-blue:   #7BD0E8;   /* Secondary accent */
  --color-secondary-yellow: #FDFFA4;   /* Highlight callouts */

  /* ── AI Provider Colors (NEW — Multi-Model) ── */
  --color-claude:           #DF561F;   /* Burnt orange — matches brand */
  --color-claude-subtle:    rgba(223, 86, 31, 0.10);
  --color-codex:            #10A37F;   /* OpenAI green */
  --color-codex-subtle:     rgba(16, 163, 127, 0.10);
  --color-gemini:           #4285F4;   /* Google blue */
  --color-gemini-subtle:    rgba(66, 133, 244, 0.10);
  --color-antigravity:      #A142F4;   /* Purple */
  --color-antigravity-subtle: rgba(161, 66, 244, 0.10);

  /* ── Neutrals ── */
  --color-background:       #FFFFFF;
  --color-foreground:       #000000;
  --color-border:           #000000;
  --color-muted:            #666666;
  --color-subtle:           #F5F5F5;
  --color-error:            #C94A4A;
  --color-hover:            rgba(223, 86, 31, 0.05);

  /* ── Rank Badge Colors ── */
  --color-rank-1:           #FFD700;  /* Gold */
  --color-rank-2:           #C0C0C0;  /* Silver */
  --color-rank-3:           #CD7F32;  /* Bronze */

  /* ── Typography ── */
  --font-ui:    'Inter', sans-serif;
  --font-mono:  'JetBrains Mono', monospace;

  /* ── Spacing Scale ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* ── Border Radius ── */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-elevated: 0 4px 16px rgba(0,0,0,0.10);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.20);
}
```

### 1.2 Typography Scale

```typescript
// Typography system — use Tailwind classes
// Headings
// text-4xl font-bold tracking-tight    — Hero headlines
// text-2xl font-semibold               — Page titles
// text-xl font-semibold                — Card headers
// text-lg font-medium                  — Section titles
// text-base                            — Body / default
// text-sm                              — Secondary text
// text-xs                              — Labels, badges, metadata

// Mono (stats/code)
// font-mono text-2xl font-bold         — Primary stat numbers
// font-mono text-sm                    — Code snippets, CLI
```

### 1.3 Provider Badge System

Every provider gets a consistent visual language used across cards, profiles, chips, and filters:

```typescript
// lib/constants/providers.ts
export const PROVIDERS = {
  claude: {
    id: 'claude',
    label: 'Claude',
    shortLabel: 'Claude',
    color: '#DF561F',
    bgColor: 'rgba(223, 86, 31, 0.10)',
    textClass: 'text-[#DF561F]',
    bgClass: 'bg-[rgba(223,86,31,0.10)]',
    borderClass: 'border-[#DF561F]',
    icon: '🟠',  // Fallback emoji
    logo: '/logos/claude.svg',
  },
  codex: {
    id: 'codex',
    label: 'Codex',
    shortLabel: 'Codex',
    color: '#10A37F',
    bgColor: 'rgba(16, 163, 127, 0.10)',
    textClass: 'text-[#10A37F]',
    bgClass: 'bg-[rgba(16,163,127,0.10)]',
    borderClass: 'border-[#10A37F]',
    icon: '🟢',
    logo: '/logos/openai.svg',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    shortLabel: 'Gemini',
    color: '#4285F4',
    bgColor: 'rgba(66, 133, 244, 0.10)',
    textClass: 'text-[#4285F4]',
    bgClass: 'bg-[rgba(66,133,244,0.10)]',
    borderClass: 'border-[#4285F4]',
    icon: '🔵',
    logo: '/logos/gemini.svg',
  },
  antigravity: {
    id: 'antigravity',
    label: 'Antigravity',
    shortLabel: 'AG',
    color: '#A142F4',
    bgColor: 'rgba(161, 66, 244, 0.10)',
    textClass: 'text-[#A142F4]',
    bgClass: 'bg-[rgba(161,66,244,0.10)]',
    borderClass: 'border-[#A142F4]',
    icon: '🟣',
    logo: '/logos/antigravity.svg',
  },
} as const;

export type ProviderKey = keyof typeof PROVIDERS;
```

---

## 2. PROJECT STRUCTURE

```
apps/web/
├── app/
│   ├── (landing)/
│   │   └── page.tsx                    ← Landing page (public)
│   ├── (auth)/
│   │   ├── login/page.tsx              ← Magic link + GitHub OAuth
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── (onboarding)/
│   │   └── onboarding/page.tsx         ← Username + country setup
│   ├── (app)/                          ← Authenticated shell
│   │   ├── layout.tsx                  ← App shell (nav + sidebar)
│   │   ├── feed/
│   │   │   └── page.tsx                ← Social feed (following + global tabs)
│   │   ├── post/[id]/
│   │   │   └── page.tsx                ← Single post view
│   │   ├── u/[username]/
│   │   │   └── page.tsx                ← Public user profile
│   │   ├── leaderboard/
│   │   │   └── page.tsx                ← Rankings
│   │   ├── search/
│   │   │   └── page.tsx                ← User search
│   │   ├── settings/
│   │   │   ├── page.tsx                ← General settings
│   │   │   └── import/page.tsx         ← Web import (CLI fallback)
│   │   └── recap/
│   │       └── page.tsx                ← Recap card generator
│   ├── cli/verify/page.tsx             ← CLI auth verification page
│   ├── recap/[username]/               ← Public OG recap card
│   │   └── page.tsx
│   └── api/                            ← (see backend plan)
│
├── components/
│   ├── landing/                        ← Landing-specific components
│   │   ├── LandingNav.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesGrid.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── WallOfLove.tsx
│   │   ├── ProviderShowcase.tsx        ← NEW — 4 provider logos strip
│   │   └── LandingCTA.tsx
│   │
│   ├── app/                            ← Core app components
│   │   ├── feed/
│   │   │   ├── Feed.tsx                ← Feed container with tabs
│   │   │   ├── FeedTabs.tsx            ← Following / Global tabs
│   │   │   ├── ActivityCard.tsx        ← Primary post card
│   │   │   ├── ActivityCardSkeleton.tsx
│   │   │   ├── StatsGrid.tsx           ← Cost / tokens / sessions grid
│   │   │   ├── ProviderChips.tsx       ← NEW — provider color chips
│   │   │   ├── ProviderBreakdown.tsx   ← NEW — expanded per-provider stats
│   │   │   ├── ImageGallery.tsx        ← Up to 5 images + lightbox
│   │   │   └── Lightbox.tsx
│   │   │
│   │   ├── social/
│   │   │   ├── KudosButton.tsx         ← ⚡ kudos toggle with animation
│   │   │   ├── CommentSection.tsx      ← Flat comment thread
│   │   │   ├── CommentInput.tsx        ← Textarea + @mention autocomplete
│   │   │   ├── MentionAutocomplete.tsx ← Dropdown user search
│   │   │   ├── FollowButton.tsx        ← Follow/unfollow with optimistic UI
│   │   │   └── NotificationBell.tsx    ← Bell icon + badge + dropdown
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── Leaderboard.tsx         ← Container
│   │   │   ├── LeaderboardFilters.tsx  ← Time + Region + Provider filters
│   │   │   ├── LeaderboardTable.tsx    ← Ranked rows
│   │   │   ├── LeaderboardRow.tsx      ← Single row (rank, avatar, stats, providers)
│   │   │   └── RankBadge.tsx           ← 🥇🥈🥉 styled badges
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx       ← Avatar, bio, stats, follow button
│   │   │   ├── StatsCard.tsx           ← Lifetime spend/tokens breakdown
│   │   │   ├── ContributionGraph.tsx   ← 52×7 GitHub-style heatmap
│   │   │   ├── StreakCounter.tsx       ← Fire emoji + day count
│   │   │   ├── ProviderBadges.tsx      ← NEW — which providers user has used
│   │   │   ├── ProviderStatsBreakdown.tsx ← NEW — per-provider lifetime totals
│   │   │   └── AchievementBadges.tsx   ← Earned achievement display
│   │   │
│   │   ├── achievements/
│   │   │   ├── AchievementBadge.tsx    ← Single badge with tooltip
│   │   │   ├── AchievementToast.tsx    ← Achievement unlock animation
│   │   │   └── AchievementsGrid.tsx    ← Profile achievements section
│   │   │
│   │   ├── recap/
│   │   │   ├── RecapCard.tsx           ← Shareable card preview
│   │   │   ├── RecapActions.tsx        ← Download OG / Instagram buttons
│   │   │   └── RecapProviderBreakdown.tsx ← NEW — per-provider in recap
│   │   │
│   │   └── settings/
│   │       ├── ProfileSettings.tsx
│   │       ├── NotificationSettings.tsx
│   │       ├── PrivacySettings.tsx
│   │       ├── AIProviderSettings.tsx  ← NEW — default AI for captions
│   │       └── WebImport.tsx
│   │
│   └── ui/                             ← Shared primitives (Base UI wrappers)
│       ├── Button.tsx
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Textarea.tsx
│       ├── Select.tsx
│       ├── Dialog.tsx
│       ├── Tooltip.tsx
│       ├── Skeleton.tsx
│       ├── Spinner.tsx
│       ├── Tabs.tsx
│       ├── ProviderChip.tsx            ← NEW — reusable colored provider pill
│       └── VerifiedBadge.tsx           ← CLI-verified checkmark
│
├── lib/
│   ├── constants/
│   │   ├── providers.ts                ← Provider config (colors, labels, logos)
│   │   └── achievements.ts             ← Badge definitions
│   ├── hooks/
│   │   ├── useFeed.ts                  ← Infinite scroll + tab switching
│   │   ├── useKudos.ts                 ← Optimistic kudos toggle
│   │   ├── useFollow.ts                ← Optimistic follow/unfollow
│   │   ├── useNotifications.ts         ← Poll / mark-read
│   │   └── useProviderFilter.ts        ← NEW — leaderboard provider filter
│   ├── utils/
│   │   ├── cn.ts                       ← clsx + tailwind-merge
│   │   ├── format.ts                   ← formatCost(), formatTokens(), formatDate()
│   │   └── recap.ts                    ← Recap image computation
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── service.ts
│
└── types/
    ├── database.ts                     ← Supabase generated types
    ├── api.ts                          ← API request/response types
    └── providers.ts                    ← Provider-related types
```

---

## PHASE 1 — Foundation & Core Shell

### Goal
Set up the entire app scaffolding: routing, auth, layout shell, navigation, and design system primitives. No feature logic yet — just structure everything perfectly so all future phases slot in cleanly.

---

### 1.1 — Tailwind CSS v4 + Fonts Setup

**File: `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  /* Map CSS custom props to Tailwind tokens */
  --color-accent: var(--color-accent);
  --color-muted: var(--color-muted);
  --color-subtle: var(--color-subtle);
  --color-border: var(--color-border);
  --font-ui: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* All CSS vars defined here */
:root { /* ... all tokens from section 1.1 ... */ }
```

**File: `app/layout.tsx`**

```typescript
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-ui bg-white text-black antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

### 1.2 — Authenticated App Shell Layout

**File: `app/(app)/layout.tsx`**

The app shell is a three-column layout on desktop, collapsing to bottom navigation on mobile:

```
┌─────────────────────────────────────────────────────────┐
│  NAV BAR (sticky top, full width)                       │
│  [STRAUDE logo]    [search]    [notifications] [avatar] │
├──────────┬───────────────────────────┬───────────────────┤
│          │                           │                   │
│ LEFT     │  MAIN CONTENT AREA        │  RIGHT SIDEBAR    │
│ SIDEBAR  │  (max-w-2xl, centered)    │  (desktop only)   │
│ 240px    │                           │  280px            │
│          │                           │                   │
│ • Feed   │                           │  • Who to follow  │
│ • Board  │                           │  • Quick stats    │
│ • Search │                           │  • Top providers  │
│ • Profile│                           │                   │
│ • Settings│                          │                   │
│          │                           │                   │
└──────────┴───────────────────────────┴───────────────────┘

MOBILE (< md):
┌─────────────────┐
│  TOP NAV        │
│  [logo] [notif] │
├─────────────────┤
│                 │
│  CONTENT        │
│                 │
├─────────────────┤
│  BOTTOM NAV     │
│  🏠 🏆 🔍 👤   │
└─────────────────┘
```

```typescript
// app/(app)/layout.tsx
import { AppNav } from '@/components/app/AppNav';
import { LeftSidebar } from '@/components/app/LeftSidebar';
import { RightSidebar } from '@/components/app/RightSidebar';
import { BottomNav } from '@/components/app/BottomNav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.username) redirect('/onboarding');

  return (
    <div className="min-h-screen bg-white">
      <AppNav user={profile} />
      
      <div className="max-w-7xl mx-auto px-4 pt-16"> {/* pt-16 = nav height */}
        <div className="flex gap-8">
          {/* Left Sidebar — hidden on mobile */}
          <aside className="hidden md:block w-60 flex-shrink-0 sticky top-20 h-fit">
            <LeftSidebar user={profile} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-2xl mx-auto pb-20 md:pb-8">
            {children}
          </main>

          {/* Right Sidebar — hidden on tablet & mobile */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-20 h-fit">
            <RightSidebar />
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav className="md:hidden" />
    </div>
  );
}
```

---

### 1.3 — Top Navigation Bar

**File: `components/app/AppNav.tsx`**

```
┌────────────────────────────────────────────────────────────────┐
│  ◆ STRAUDE      [🔍 Search users...]    [🔔 3]  [● avatar ▾]  │
└────────────────────────────────────────────────────────────────┘
```

Key behaviors:
- Fixed at top, `backdrop-blur-md` with subtle border bottom
- Logo uses geometric trapezoid SVG mark (from original design)
- Search bar opens inline search on desktop, routes to `/search` on mobile
- Notification bell shows unread count badge (red dot if > 0), opens dropdown panel
- Avatar dropdown: Profile, Settings, Sign out

```typescript
// components/app/AppNav.tsx
'use client';
import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { NotificationBell } from '@/components/app/social/NotificationBell';
import { UserAvatarDropdown } from '@/components/app/UserAvatarDropdown';
import { StruadeLogo } from '@/components/ui/StruadeLogo';

export function AppNav({ user }: { user: UserProfile }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-black/10">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-4">
        
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 flex-shrink-0">
          <StruadeLogo className="h-8 w-8" />
          <span className="font-bold text-lg tracking-tight hidden sm:block">STRAUDE</span>
        </Link>

        {/* Search — grows to fill space */}
        <div className="flex-1 max-w-sm hidden md:block">
          <SearchInput />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Mobile search icon */}
          <Link href="/search" className="md:hidden p-2">
            <Search size={20} />
          </Link>
          
          <NotificationBell userId={user.id} />
          <UserAvatarDropdown user={user} />
        </div>
      </div>
    </nav>
  );
}
```

---

### 1.4 — Left Sidebar Navigation

```
┌──────────────────────────┐
│  🏠  Feed               │  ← Active state: bg-accent-subtle, accent text, left border accent
│  🏆  Leaderboard         │
│  🔍  Search              │
│  👤  My Profile          │
│  ⚙️  Settings            │
│                          │
│  ─────────────────────── │
│  📊  Import Data         │  ← Secondary action
│  📸  My Recap            │
└──────────────────────────┘
```

```typescript
// components/app/LeftSidebar.tsx
import { navItems } from '@/lib/constants/navigation';
import { SidebarNavItem } from './SidebarNavItem';

export function LeftSidebar({ user }) {
  return (
    <nav className="space-y-1">
      {navItems.map(item => (
        <SidebarNavItem key={item.href} item={item} username={user.username} />
      ))}
    </nav>
  );
}

// SidebarNavItem uses usePathname() for active detection
// Active: border-l-2 border-accent bg-accent-subtle text-accent font-semibold
// Default: text-gray-700 hover:bg-gray-50 rounded-lg
```

---

### 1.5 — Base UI Component Wrappers

Build all shared primitives as thin wrappers around `@base-ui-components/react`. These are the building blocks for every feature.

#### `Button.tsx`
```typescript
// components/ui/Button.tsx
import { Button as BaseButton } from '@base-ui-components/react/button';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-accent text-white hover:bg-accent-hover active:scale-95',
  secondary: 'border border-black text-black hover:bg-subtle active:scale-95',
  ghost:     'text-muted hover:text-black hover:bg-subtle',
  danger:    'bg-error text-white hover:bg-red-700',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <BaseButton
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
```

#### `ProviderChip.tsx` — NEW
```typescript
// components/ui/ProviderChip.tsx
import { PROVIDERS, ProviderKey } from '@/lib/constants/providers';
import { cn } from '@/lib/utils/cn';

interface ProviderChipProps {
  provider: ProviderKey;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function ProviderChip({ provider, size = 'sm', showDot = true }: ProviderChipProps) {
  const p = PROVIDERS[provider];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
      style={{
        color: p.color,
        backgroundColor: p.bgColor,
        borderColor: `${p.color}40`, // 25% opacity border
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: p.color }}
        />
      )}
      {size === 'sm' ? p.shortLabel : p.label}
    </span>
  );
}
```

#### `Avatar.tsx`
```typescript
// components/ui/Avatar.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const initials = alt.slice(0, 2).toUpperCase();
  
  return (
    <div className={cn('rounded-full overflow-hidden flex-shrink-0 bg-subtle flex items-center justify-center font-bold', sizes[size], className)}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
```

#### `Skeleton.tsx`
```typescript
// components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gradient-to-r from-subtle via-gray-200 to-subtle bg-[length:200%_100%] animate-shimmer rounded', className)} />
  );
}

// tailwind.config — add shimmer animation:
// '@keyframes shimmer': { '0%': {backgroundPosition:'200% 0'}, '100%': {backgroundPosition:'-200% 0'} }
```

---

### 1.6 — Utility Functions

```typescript
// lib/utils/format.ts

export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  if (usd < 100) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(0)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1_000) return tokens.toString();
  if (tokens < 1_000_000) return `${(tokens / 1_000).toFixed(1)}K`;
  if (tokens < 1_000_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  return `${(tokens / 1_000_000_000).toFixed(2)}B`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return 'Yesterday';
  if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  );
}
```

---

## PHASE 2 — Feed & Activity Cards

### Goal
Build the central feed experience — the page users see first and most often. This is the social heartbeat of the product.

---

### 2.1 — Feed Page Layout

**File: `app/(app)/feed/page.tsx`**

```typescript
// Server component — fetches initial data for SSR
import { Feed } from '@/components/app/feed/Feed';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function FeedPage({ searchParams }) {
  const supabase = createServerSupabaseClient();
  const tab = (searchParams.tab as string) || 'following';
  
  // Fetch first page server-side for fast initial render
  const initialPosts = await fetchFeedPosts(supabase, tab, null, 20);

  return <Feed initialPosts={initialPosts} initialTab={tab} />;
}
```

---

### 2.2 — Feed Tabs (Following / Global)

```
┌─────────────────────────────────────────────────┐
│  [  Following  ] [    Global    ]               │
│  ──────────────                                 │
│  (underline indicator, animated sliding)         │
└─────────────────────────────────────────────────┘
```

```typescript
// components/app/feed/FeedTabs.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';

const tabs = [
  { id: 'following', label: 'Following' },
  { id: 'global', label: 'Global' },
];

export function FeedTabs({ activeTab, onChange }) {
  return (
    <div className="flex border-b border-gray-100 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative pb-3 px-4 text-sm font-medium transition-colors',
            activeTab === tab.id ? 'text-black' : 'text-muted hover:text-black'
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="feedTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

---

### 2.3 — Activity Card — The Core UI Component

This is the most important component in the app. Every stat, social action, and provider indicator lives here.

```
┌───────────────────────────────────────────────────────────┐
│  ● avatar  @username  •  2h ago       ✓ verified          │
│           Feb 16, 2026                                    │
│                                                           │
│  Title of the coding session goes here                    │
│  Description text about what was built, rendered as       │
│  markdown with @mention links...                          │
│                                                           │
│  [🟠 Claude] [🟢 Codex]              ← Provider chips    │
│                                                           │
│  ┌──────────┬───────────┬───────────┬──────────┐         │
│  │  $4.82   │  2.3M     │  145K     │  7 sess  │         │
│  │  COST    │  IN TOKENS│ OUT TOKENS│ SESSIONS │         │
│  └──────────┴───────────┴───────────┴──────────┘         │
│                                                           │
│  [img1][img2][img3]  +2                                   │
│                                                           │
│  ────────────────────────────────────────────────         │
│  ⚡ 23   💬 5   Share                                     │
└───────────────────────────────────────────────────────────┘
```

```typescript
// components/app/feed/ActivityCard.tsx
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ProviderChips } from './ProviderChips';
import { StatsGrid } from './StatsGrid';
import { ImageGallery } from './ImageGallery';
import { KudosButton } from '../social/KudosButton';
import { ProviderBreakdown } from './ProviderBreakdown';
import { formatDate } from '@/lib/utils/format';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import Link from 'next/link';
import { useState } from 'react';

interface ActivityCardProps {
  post: Post & { 
    user: UserProfile;
    daily_usage: DailyUsage[];
    kudos_count: number;
    comment_count: number;
    user_has_kudosed: boolean;
    providers: ProviderKey[];
  };
  currentUserId?: string;
}

export function ActivityCard({ post, currentUserId }: ActivityCardProps) {
  const [showProviderBreakdown, setShowProviderBreakdown] = useState(false);

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 hover:border-gray-200 transition-colors">
      
      {/* Header — Avatar + User info + Date */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.user.username}`}>
            <Avatar src={post.user.avatar_url} alt={post.user.username} size="md" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={`/u/${post.user.username}`} className="font-semibold text-sm hover:underline">
                @{post.user.username}
              </Link>
              {post.daily_usage[0]?.is_verified && <VerifiedBadge />}
            </div>
            <time className="text-xs text-muted">
              {formatDate(post.created_at)} · {new Date(post.daily_usage[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </time>
          </div>
        </div>
        
        {currentUserId === post.user_id && <PostMenu postId={post.id} />}
      </header>

      {/* Title */}
      {post.title && (
        <h2 className="font-semibold text-base leading-snug">
          <Link href={`/post/${post.id}`} className="hover:text-accent transition-colors">
            {post.title}
          </Link>
        </h2>
      )}

      {/* Description — markdown rendered */}
      {post.description && (
        <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkBreaks]}
            components={{
              a: ({ href, children }) => (
                <Link href={href || '#'} className="text-accent hover:underline">{children}</Link>
              ),
            }}
          >
            {post.description}
          </ReactMarkdown>
        </div>
      )}

      {/* Provider Chips — NEW */}
      {post.providers?.length > 0 && (
        <div className="flex items-center gap-2">
          <ProviderChips providers={post.providers} />
          {post.providers.length > 1 && (
            <button
              onClick={() => setShowProviderBreakdown(v => !v)}
              className="text-xs text-muted hover:text-black"
            >
              {showProviderBreakdown ? 'Hide breakdown' : 'See breakdown'}
            </button>
          )}
        </div>
      )}

      {/* Provider Breakdown — expandable, NEW */}
      {showProviderBreakdown && post.daily_usage.length > 1 && (
        <ProviderBreakdown usageData={post.daily_usage} />
      )}

      {/* Stats Grid */}
      <StatsGrid 
        costUSD={post.daily_usage.reduce((s, d) => s + d.cost_usd, 0)}
        inputTokens={post.daily_usage.reduce((s, d) => s + d.input_tokens, 0)}
        outputTokens={post.daily_usage.reduce((s, d) => s + d.output_tokens, 0)}
        sessions={post.daily_usage.length}
      />

      {/* Image Gallery */}
      {post.images?.length > 0 && (
        <ImageGallery images={post.images} />
      )}

      {/* Actions Bar */}
      <footer className="flex items-center gap-4 pt-1 border-t border-gray-50">
        <KudosButton
          postId={post.id}
          initialCount={post.kudos_count}
          initialKudosed={post.user_has_kudosed}
          currentUserId={currentUserId}
        />
        <Link href={`/post/${post.id}#comments`} className="flex items-center gap-1.5 text-sm text-muted hover:text-black transition-colors">
          <span>💬</span>
          <span>{post.comment_count}</span>
        </Link>
        <ShareButton post={post} />
      </footer>
    </article>
  );
}
```

---

### 2.4 — Stats Grid

```typescript
// components/app/feed/StatsGrid.tsx
import { formatCost, formatTokens } from '@/lib/utils/format';

interface StatsGridProps {
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  sessions: number;
}

export function StatsGrid({ costUSD, inputTokens, outputTokens, sessions }: StatsGridProps) {
  const stats = [
    { label: 'Cost', value: formatCost(costUSD), mono: true, highlight: true },
    { label: 'Input', value: formatTokens(inputTokens), mono: true },
    { label: 'Output', value: formatTokens(outputTokens), mono: true },
    { label: 'Sessions', value: sessions.toString(), mono: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(stat => (
        <div key={stat.label} className={cn(
          'bg-subtle rounded-lg p-3 text-center',
          stat.highlight && 'bg-accent/5 border border-accent/10'
        )}>
          <div className={cn('text-base font-bold', stat.mono && 'font-mono', stat.highlight && 'text-accent')}>
            {stat.value}
          </div>
          <div className="text-xs text-muted uppercase tracking-wide mt-0.5">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 2.5 — Provider Chips Component

```typescript
// components/app/feed/ProviderChips.tsx
import { ProviderChip } from '@/components/ui/ProviderChip';
import type { ProviderKey } from '@/types/providers';

export function ProviderChips({ providers }: { providers: ProviderKey[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {providers.map(provider => (
        <ProviderChip key={provider} provider={provider} size="sm" />
      ))}
    </div>
  );
}
```

---

### 2.6 — Provider Breakdown (Expandable) — NEW

```
╔═══════════════════════════════════════════════════╗
║  Provider Breakdown for Feb 16                    ║
║  ─────────────────────────────────────────────    ║
║  🟠 Claude      $3.21   1.8M in   98K out         ║
║  🟢 Codex       $1.61   0.5M in   47K out         ║
╚═══════════════════════════════════════════════════╝
```

```typescript
// components/app/feed/ProviderBreakdown.tsx
import { PROVIDERS } from '@/lib/constants/providers';
import { formatCost, formatTokens } from '@/lib/utils/format';
import { motion } from 'motion/react';

export function ProviderBreakdown({ usageData }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-subtle rounded-lg p-4 space-y-3"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Provider Breakdown</h4>
      {usageData.map(usage => {
        const p = PROVIDERS[usage.provider];
        return (
          <div key={usage.provider} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-28">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-sm font-medium">{p.label}</span>
            </div>
            <div className="flex gap-4 text-sm font-mono">
              <span className="text-accent font-bold">{formatCost(usage.cost_usd)}</span>
              <span className="text-muted">{formatTokens(usage.input_tokens)} in</span>
              <span className="text-muted">{formatTokens(usage.output_tokens)} out</span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
```

---

### 2.7 — Image Gallery + Lightbox

```
Up to 5 images in a responsive grid:
1 image:  Full width
2 images: 50/50 split
3 images: 50% | 25% / 25%
4 images: 2×2 grid
5 images: 50% | 3 thumbnails

Clicking any image → fullscreen lightbox with arrow navigation
```

```typescript
// components/app/feed/ImageGallery.tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Lightbox } from './Lightbox';

const gridLayouts = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2', // special: first image spans full height
  4: 'grid-cols-2',
  5: 'grid-cols-2',
};

export function ImageGallery({ images }: { images: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const displayImages = images.slice(0, 5);
  const extraCount = Math.max(0, images.length - 5);

  return (
    <>
      <div className={`grid ${gridLayouts[displayImages.length]} gap-1 rounded-xl overflow-hidden`}>
        {displayImages.map((img, i) => (
          <div
            key={i}
            onClick={() => setLightboxIndex(i)}
            className={cn(
              'relative cursor-pointer bg-subtle aspect-video',
              displayImages.length === 3 && i === 0 && 'row-span-2',
              displayImages.length === 5 && i === 0 && 'row-span-2'
            )}
          >
            <Image src={img} alt={`Image ${i + 1}`} fill className="object-cover hover:opacity-90 transition-opacity" />
            {i === 4 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{extraCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
```

---

### 2.8 — Infinite Scroll Feed

```typescript
// lib/hooks/useFeed.ts
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useFeed(tab: 'following' | 'global', initialPosts: Post[]) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(
    initialPosts[initialPosts.length - 1]?.created_at || null
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === 20);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    
    const res = await fetch(`/api/feed?type=${tab}&cursor=${cursor}&limit=20`);
    const { posts: newPosts, nextCursor } = await res.json();
    
    setPosts(prev => [...prev, ...newPosts]);
    setCursor(nextCursor);
    setHasMore(newPosts.length === 20);
    setLoading(false);
  }, [loading, hasMore, cursor, tab]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // Reset when tab changes
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
  }, [tab]);

  return { posts, loading, hasMore, loaderRef };
}
```

---

### 2.9 — Activity Card Skeleton

```typescript
// components/app/feed/ActivityCardSkeleton.tsx
import { Skeleton } from '@/components/ui/Skeleton';

export function ActivityCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({length: 4}).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

---

## PHASE 3 — Social Layer

### Goal
Build all engagement mechanics: kudos, comments, follow/unfollow, @mentions, and notifications.

---

### 3.1 — Kudos Button (⚡)

The ⚡ kudos button is like a "like" — toggle with optimistic UI and spring animation on the bolt.

```typescript
// components/app/social/KudosButton.tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils/cn';

export function KudosButton({ postId, initialCount, initialKudosed, currentUserId }) {
  const [count, setCount] = useState(initialCount);
  const [kudosed, setKudosed] = useState(initialKudosed);
  const [animating, setAnimating] = useState(false);

  const toggle = async () => {
    if (!currentUserId) {
      // Redirect to login
      return;
    }
    
    // Optimistic update
    const newKudosed = !kudosed;
    setKudosed(newKudosed);
    setCount(c => newKudosed ? c + 1 : c - 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    // API call
    const method = newKudosed ? 'POST' : 'DELETE';
    const res = await fetch('/api/social/kudos', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    });
    
    // Revert on error
    if (!res.ok) {
      setKudosed(!newKudosed);
      setCount(c => newKudosed ? c - 1 : c + 1);
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        'flex items-center gap-1.5 text-sm transition-colors group',
        kudosed ? 'text-accent' : 'text-muted hover:text-accent'
      )}
    >
      <motion.span
        animate={animating ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-base"
      >
        ⚡
      </motion.span>
      <span className="font-medium tabular-nums">{count}</span>
    </button>
  );
}
```

---

### 3.2 — Comment Section

```typescript
// components/app/social/CommentSection.tsx
'use client';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { CommentInput } from './CommentInput';
import { formatDate } from '@/lib/utils/format';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export function CommentSection({ postId, initialComments, currentUser }) {
  const [comments, setComments] = useState(initialComments);

  const addComment = async (text: string) => {
    const res = await fetch('/api/social/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content: text }),
    });
    const newComment = await res.json();
    setComments(prev => [...prev, newComment]);
  };

  return (
    <section id="comments" className="space-y-4">
      <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h3>

      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <Link href={`/u/${comment.user.username}`} className="flex-shrink-0">
              <Avatar src={comment.user.avatar_url} alt={comment.user.username} size="sm" />
            </Link>
            <div className="flex-1 bg-subtle rounded-xl px-4 py-3">
              <div className="flex items-baseline gap-2 mb-1">
                <Link href={`/u/${comment.user.username}`} className="font-semibold text-sm hover:underline">
                  @{comment.user.username}
                </Link>
                <span className="text-xs text-muted">{formatDate(comment.created_at)}</span>
              </div>
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown>{comment.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentUser && (
        <div className="flex gap-3">
          <Avatar src={currentUser.avatar_url} alt={currentUser.username} size="sm" />
          <CommentInput onSubmit={addComment} currentUser={currentUser} />
        </div>
      )}
    </section>
  );
}
```

---

### 3.3 — @Mention Autocomplete in Comment Input

```typescript
// components/app/social/CommentInput.tsx
'use client';
import { useState, useRef } from 'react';
import { MentionAutocomplete } from './MentionAutocomplete';
import { Button } from '@/components/ui/Button';

export function CommentInput({ onSubmit, currentUser }) {
  const [value, setValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);
    
    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (username: string) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursor);
    const textAfterCursor = value.slice(cursor);
    const newText = textBeforeCursor.replace(/@\w*$/, `@${username} `) + textAfterCursor;
    setValue(newText);
    setMentionQuery(null);
  };

  const handleSubmit = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(value.trim());
    setValue('');
    setSubmitting(false);
  };

  return (
    <div className="flex-1 relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
        placeholder="Add a comment... @mention someone"
        rows={2}
        className="w-full bg-subtle rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-colors"
      />
      
      {mentionQuery !== null && (
        <MentionAutocomplete
          query={mentionQuery}
          onSelect={handleMentionSelect}
          onClose={() => setMentionQuery(null)}
        />
      )}
      
      <div className="flex justify-end mt-2">
        <Button
          onClick={handleSubmit}
          size="sm"
          disabled={!value.trim() || submitting}
        >
          {submitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}
```

---

### 3.4 — Follow Button

```typescript
// components/app/social/FollowButton.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function FollowButton({ targetUserId, initialFollowing, currentUserId }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!currentUserId || currentUserId === targetUserId) return null;

  const toggle = async () => {
    setLoading(true);
    const method = following ? 'DELETE' : 'POST';
    
    // Optimistic
    setFollowing(!following);
    
    const res = await fetch('/api/social/follow', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    });
    
    if (!res.ok) setFollowing(following); // revert
    setLoading(false);
  };

  return (
    <Button
      variant={following ? 'secondary' : 'primary'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {following ? (hovered ? 'Unfollow' : 'Following') : 'Follow'}
    </Button>
  );
}
```

---

### 3.5 — Notification Bell + Dropdown

```typescript
// components/app/social/NotificationBell.tsx
'use client';
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Avatar } from '@/components/ui/Avatar';

export function NotificationBell({ userId }) {
  const { notifications, unreadCount, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open) markAllRead(); }}
        className="relative p-2 hover:bg-subtle rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-elevated overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">
                  No notifications yet
                </div>
              ) : notifications.map(n => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## PHASE 4 — Leaderboard & Search

### Goal
Build the competitive ranking system with multi-dimensional filtering: time period, region, and now provider.

---

### 4.1 — Leaderboard Page Layout

```
┌────────────────────────────────────────────────────────────┐
│  🏆 LEADERBOARD                                            │
│                                                            │
│  [Day ▾] [Global ▾] [All Providers ▾]                     │
│                                                            │
│  ─────────────────────────────────────────────────────     │
│  #   Avatar   Username        Spend    Tokens   Streak     │
│  ─────────────────────────────────────────────────────     │
│  🥇  ● user1   @alice         $94.20   48.3M    🔥23       │
│  🥈  ● user2   @bob           $71.50   31.2M    🔥18       │
│  🥉  ● user3   @charlie       $58.90   27.8M    🔥12       │
│  4   ● user4   @dave          $42.10   19.1M    🔥7        │
│  ▶5  ● YOU     @harry         $38.20   15.4M    🔥4     ◀  │
│      (highlighted row)                                     │
└────────────────────────────────────────────────────────────┘
```

---

### 4.2 — Leaderboard Filters — NEW Multi-Provider Filter

```typescript
// components/app/leaderboard/LeaderboardFilters.tsx
'use client';
import { Select } from '@/components/ui/Select';
import { PROVIDERS } from '@/lib/constants/providers';
import { useRouter, useSearchParams } from 'next/navigation';

const TIME_PERIODS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

const PROVIDER_OPTIONS = [
  { value: 'all', label: '✦ All Providers' },
  ...Object.values(PROVIDERS).map(p => ({ value: p.id, label: p.label })),
];

export function LeaderboardFilters({ period, region, provider }) {
  const router = useRouter();
  
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams({ period, region, provider, [key]: value });
    router.push(`/leaderboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select
        value={period}
        onChange={v => updateFilter('period', v)}
        options={TIME_PERIODS}
        className="w-36"
      />
      <RegionSelect value={region} onChange={v => updateFilter('region', v)} />
      
      {/* Provider Filter — NEW */}
      <Select
        value={provider}
        onChange={v => updateFilter('provider', v)}
        options={PROVIDER_OPTIONS}
        className="w-44"
        renderOption={({ value, label }) => (
          <div className="flex items-center gap-2">
            {value !== 'all' && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: PROVIDERS[value as keyof typeof PROVIDERS]?.color }}
              />
            )}
            {label}
          </div>
        )}
      />
    </div>
  );
}
```

---

### 4.3 — Leaderboard Table

```typescript
// components/app/leaderboard/LeaderboardTable.tsx
import { LeaderboardRow } from './LeaderboardRow';

export function LeaderboardTable({ entries, currentUserId }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      
      {/* Table Header */}
      <div className="grid grid-cols-[48px_auto_120px_120px_80px] gap-4 px-4 py-3 bg-subtle text-xs font-semibold text-muted uppercase tracking-wide">
        <span>Rank</span>
        <span>User</span>
        <span className="text-right">Spend</span>
        <span className="text-right">Tokens</span>
        <span className="text-right">Streak</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.user_id}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.user_id === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
```

```typescript
// components/app/leaderboard/LeaderboardRow.tsx
import { RankBadge } from './RankBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ProviderChips } from '../feed/ProviderChips';
import { formatCost, formatTokens } from '@/lib/utils/format';
import Link from 'next/link';

export function LeaderboardRow({ entry, rank, isCurrentUser }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[48px_auto_120px_120px_80px] gap-4 px-4 py-4 items-center transition-colors',
        isCurrentUser
          ? 'bg-[rgba(223,86,31,0.12)] border-l-2 border-accent'
          : 'hover:bg-hover'
      )}
    >
      <RankBadge rank={rank} />
      
      <Link href={`/u/${entry.username}`} className="flex items-center gap-3 min-w-0 group">
        <Avatar src={entry.avatar_url} alt={entry.username} size="sm" />
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
            @{entry.username}
          </div>
          {entry.providers?.length > 0 && (
            <div className="flex gap-1 mt-0.5">
              {entry.providers.map(p => (
                <span
                  key={p}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PROVIDERS[p]?.color }}
                  title={PROVIDERS[p]?.label}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="text-right font-mono font-bold text-accent">
        {formatCost(entry.total_cost_usd)}
      </div>
      
      <div className="text-right font-mono text-sm text-muted">
        {formatTokens(entry.total_tokens)}
      </div>
      
      <div className="text-right text-sm">
        {entry.streak > 0 ? (
          <span className="flex items-center justify-end gap-1">
            <span>🔥</span>
            <span className="font-bold font-mono">{entry.streak}</span>
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </div>
    </div>
  );
}
```

---

### 4.4 — Rank Badge

```typescript
// components/app/leaderboard/RankBadge.tsx
export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl" title="1st Place">🥇</span>;
  if (rank === 2) return <span className="text-xl" title="2nd Place">🥈</span>;
  if (rank === 3) return <span className="text-xl" title="3rd Place">🥉</span>;
  
  return (
    <span className="font-mono font-bold text-sm text-muted w-8 text-center">
      {rank}
    </span>
  );
}
```

---

### 4.5 — Search Page

```typescript
// app/(app)/search/page.tsx + components/app/SearchResults.tsx

// Instant search with debouncing — URL-based state for shareability
// Results: User cards showing avatar, username, bio, follower count, provider badges

// Search input:
// - Autofocused on page load
// - Debounced 300ms
// - Shows results in grid below
// - Empty state: "Search for users by username"
// - No results: "No users found for '@query'"
```

---

## PHASE 5 — User Profiles & Contribution Graph

### Goal
Build the profile page — the user's public showcase of their AI coding activity.

---

### 5.1 — Profile Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [back button]                                              │
│                                                             │
│  ○ AVATAR (80px)                                            │
│  @username                          [Follow] [···]          │
│  Bio text here...                                           │
│  📍 India  ·  Joined Jan 2026                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  STATS CARD                                         │    │
│  │  $182.40 total · 94.2M tokens · 🔥23 streak        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  PROVIDERS USED: [🟠 Claude] [🟢 Codex]                    │
│  PER-PROVIDER BREAKDOWN: (collapsible table)               │
│                                                             │
│  CONTRIBUTION GRAPH (52×7 grid)                             │
│  Jan  Feb  Mar  Apr  May  Jun  Jul                         │
│  ▓▓▒▒░░░░░░▓▓▓▓▓▒▒▒▒░░░░▓▓▓▓▓▓▒▒                           │
│                                                             │
│  ACHIEVEMENTS                                               │
│  🏆 First Sync  ⚡ Power User  🌈 Full Stack AI ...         │
│                                                             │
│  POSTS (same ActivityCard feed)                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.2 — Profile Header

```typescript
// components/app/profile/ProfileHeader.tsx
import { Avatar } from '@/components/ui/Avatar';
import { FollowButton } from '../social/FollowButton';
import { StreakCounter } from './StreakCounter';
import { MapPin, Calendar } from 'lucide-react';
import { ProviderBadges } from './ProviderBadges';

export function ProfileHeader({ profile, currentUserId, isOwnProfile, isFollowing }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <Avatar src={profile.avatar_url} alt={profile.username} size="xl" />
        
        <div className="flex items-center gap-2">
          {!isOwnProfile && (
            <FollowButton
              targetUserId={profile.id}
              initialFollowing={isFollowing}
              currentUserId={currentUserId}
            />
          )}
          {isOwnProfile && (
            <Button variant="secondary" size="sm" href="/settings">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">@{profile.username}</h1>
        {profile.bio && (
          <p className="text-gray-700 mt-1 text-sm leading-relaxed">{profile.bio}</p>
        )}
        
        <div className="flex items-center gap-4 mt-2 text-sm text-muted">
          {profile.country && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {profile.country}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm">
          <span><strong>{profile.following_count}</strong> <span className="text-muted">Following</span></span>
          <span><strong>{profile.follower_count}</strong> <span className="text-muted">Followers</span></span>
        </div>
      </div>
    </div>
  );
}
```

---

### 5.3 — Provider Badges Section — NEW

```typescript
// components/app/profile/ProviderBadges.tsx
import { PROVIDERS } from '@/lib/constants/providers';
import { ProviderChip } from '@/components/ui/ProviderChip';

interface ProviderBadgesProps {
  usedProviders: string[];
  providerStats: Record<string, { cost_usd: number; total_tokens: number }>;
}

export function ProviderBadges({ usedProviders, providerStats }: ProviderBadgesProps) {
  if (usedProviders.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">AI Providers Used</h3>
      <div className="flex flex-wrap gap-2">
        {usedProviders.map(p => (
          <ProviderChip key={p} provider={p as any} size="md" />
        ))}
      </div>
      
      {/* Per-provider stats */}
      <div className="bg-subtle rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted">Lifetime Breakdown</h4>
        {usedProviders.map(p => {
          const stats = providerStats[p];
          const provider = PROVIDERS[p as keyof typeof PROVIDERS];
          return (
            <div key={p} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-32">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: provider.color }} />
                <span className="text-sm font-medium">{provider.label}</span>
              </div>
              <div className="flex gap-6 text-sm font-mono">
                <span className="font-bold" style={{ color: provider.color }}>
                  {formatCost(stats.cost_usd)}
                </span>
                <span className="text-muted">{formatTokens(stats.total_tokens)} tokens</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 5.4 — Contribution Graph — 52×7 Heatmap with Provider Colors

This is the GitHub-style contribution heatmap. For multi-model, each cell's color is based on the dominant provider that day.

```typescript
// components/app/profile/ContributionGraph.tsx
'use client';
import { useMemo } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { PROVIDERS } from '@/lib/constants/providers';
import { formatCost } from '@/lib/utils/format';

interface DayData {
  date: string;
  cost_usd: number;
  dominant_provider: string | null;
  providers: string[];
}

interface ContributionGraphProps {
  data: DayData[];
  year?: number;
}

export function ContributionGraph({ data, year = new Date().getFullYear() }: ContributionGraphProps) {
  const { weeks, months } = useMemo(() => {
    // Build 52-week grid from data
    const map = new Map(data.map(d => [d.date, d]));
    const weeks: (DayData | null)[][] = [];
    
    // Start from first Sunday of the year
    const start = new Date(year, 0, 1);
    while (start.getDay() !== 0) start.setDate(start.getDate() - 1);
    
    for (let w = 0; w < 52; w++) {
      const week: (DayData | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = start.toISOString().split('T')[0];
        week.push(map.get(dateStr) || null);
        start.setDate(start.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return { weeks, months: getMonthLabels(year) };
  }, [data, year]);

  const getColor = (day: DayData | null) => {
    if (!day || day.cost_usd === 0) return '#F5F5F5';
    
    // Multi-model: color by dominant provider
    if (day.dominant_provider && PROVIDERS[day.dominant_provider as keyof typeof PROVIDERS]) {
      const provider = PROVIDERS[day.dominant_provider as keyof typeof PROVIDERS];
      const intensity = Math.min(1, day.cost_usd / 10); // normalize up to $10
      // Interpolate from subtle to full provider color
      return adjustColorOpacity(provider.color, 0.2 + intensity * 0.8);
    }
    
    // Fallback: accent color scale
    const intensity = Math.min(1, day.cost_usd / 10);
    return intensity < 0.25 ? '#FECACA' : intensity < 0.5 ? '#FCA5A5' : intensity < 0.75 ? '#F97316' : '#DF561F';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Coding Activity</h3>
        <span className="text-xs text-muted">{year}</span>
      </div>
      
      {/* Month labels */}
      <div className="flex text-xs text-muted mb-1">
        {months.map((m, i) => (
          <div key={i} className="flex-1 text-left">{m}</div>
        ))}
      </div>
      
      {/* Graph grid */}
      <div className="flex gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <Tooltip
                key={di}
                content={day
                  ? `${day.date}: ${formatCost(day.cost_usd)} (${day.providers.map(p => PROVIDERS[p as keyof typeof PROVIDERS]?.label).join(', ')})`
                  : 'No activity'
                }
              >
                <div
                  className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125"
                  style={{ backgroundColor: getColor(day) }}
                />
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
          <div
            key={intensity}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: intensity === 0 ? '#F5F5F5' : adjustColorOpacity('#DF561F', 0.2 + intensity * 0.8) }}
          />
        ))}
        <span>More</span>
        <span className="ml-4">Color = dominant provider</span>
      </div>
    </div>
  );
}
```

---

### 5.5 — Streak Counter

```typescript
// components/app/profile/StreakCounter.tsx
export function StreakCounter({ streak }: { streak: number }) {
  if (streak === 0) {
    return (
      <div className="text-center p-4 bg-subtle rounded-xl">
        <div className="text-3xl mb-1">🔥</div>
        <div className="text-sm text-muted">No active streak</div>
        <div className="text-xs text-muted mt-1">Push data daily to start one!</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-accent/5 border border-accent/15 rounded-xl p-4">
      <span className="text-4xl">🔥</span>
      <div>
        <div className="font-mono font-bold text-3xl text-accent">{streak}</div>
        <div className="text-sm text-muted">day streak</div>
      </div>
    </div>
  );
}
```

---

## PHASE 6 — Multi-Model Provider UI

### Goal
Build all the new provider-specific UI components that power the multi-model experience.

---

### 6.1 — Provider Filter in Feed — NEW

Add an optional provider filter above the feed (collapsed by default, expandable):

```typescript
// components/app/feed/FeedProviderFilter.tsx
'use client';
import { useState } from 'react';
import { PROVIDERS } from '@/lib/constants/providers';
import { Filter } from 'lucide-react';

export function FeedProviderFilter({ activeProvider, onChange }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-xs text-muted hover:text-black transition-colors mb-4"
      >
        <Filter size={14} />
        Filter by provider
        {activeProvider !== 'all' && (
          <ProviderChip provider={activeProvider} size="sm" />
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-subtle rounded-xl">
      <button
        onClick={() => onChange('all')}
        className={cn('px-3 py-1.5 text-xs rounded-full font-medium border transition-all',
          activeProvider === 'all' ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400'
        )}
      >
        All
      </button>
      {Object.values(PROVIDERS).map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className="transition-all"
          style={activeProvider === p.id ? {
            backgroundColor: p.bgColor,
            color: p.color,
            border: `1px solid ${p.color}40`,
          } : {}}
        >
          <ProviderChip provider={p.id as any} size="sm" />
        </button>
      ))}
      <button onClick={() => setExpanded(false)} className="text-xs text-muted hover:text-black ml-auto">
        Done
      </button>
    </div>
  );
}
```

---

### 6.2 — Provider Selection in Settings — NEW

```typescript
// components/app/settings/AIProviderSettings.tsx
import { PROVIDERS } from '@/lib/constants/providers';

export function AIProviderSettings({ defaultProvider, onSave }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold">AI Caption Provider</h2>
        <p className="text-sm text-muted mt-1">
          Choose which AI generates captions for your coding sessions
        </p>
      </div>

      <div className="space-y-3">
        {Object.values(PROVIDERS).map(p => (
          <label key={p.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl cursor-pointer hover:border-gray-300 transition-colors has-[:checked]:border-2"
            style={{ '--provider-color': p.color } as any}
          >
            <input
              type="radio"
              name="ai_provider"
              value={p.id}
              defaultChecked={defaultProvider === p.id}
              className="accent-[var(--provider-color)]"
            />
            <div className="flex items-center gap-3">
              <img src={p.logo} alt={p.label} className="w-6 h-6" />
              <div>
                <div className="font-medium text-sm">{p.label}</div>
                <div className="text-xs text-muted">{getProviderCaptionDescription(p.id)}</div>
              </div>
            </div>
            <ProviderChip provider={p.id as any} size="sm" className="ml-auto" />
          </label>
        ))}
      </div>

      <Button onClick={onSave} size="sm">Save Preference</Button>
    </section>
  );
}
```

---

## PHASE 7 — Achievements & Recap Cards

### Goal
Build the achievements system (badges + unlock animation) and shareable recap cards with multi-provider breakdown.

---

### 7.1 — Achievement Badge

```typescript
// lib/constants/achievements.ts
export const ACHIEVEMENTS = {
  // Original badges
  'first-sync':        { emoji: '🏆', name: 'First Sync',      desc: 'Pushed your first day of usage' },
  'seven-day-streak':  { emoji: '🔥', name: 'Week Warrior',     desc: 'Maintained a 7-day streak' },
  'power-user':        { emoji: '⚡', name: 'Power User',       desc: 'Spent over $10 in a single day' },
  'century-tokens':    { emoji: '🎯', name: '100K Output',      desc: 'Generated 100K output tokens in a day' },
  'million-output':    { emoji: '💯', name: '1M Output',         desc: 'Generated 1M output tokens in a day' },
  'one-hundred-m':     { emoji: '🚀', name: '100M Output',      desc: 'Lifetime 100M output tokens' },
  'big-spender':       { emoji: '💰', name: 'Big Spender',      desc: 'Spent over $100 in a week' },
  'global-top-10':     { emoji: '🌍', name: 'Elite',            desc: 'Reached global top 10' },
  
  // New multi-model badges
  'multi-provider':    { emoji: '🔀', name: 'Polyglot Coder',   desc: 'Pushed data from 2+ providers' },
  'all-providers':     { emoji: '🌈', name: 'Full Stack AI',    desc: 'Pushed data from all 4 providers' },
  'codex-first':       { emoji: '🤖', name: 'Codex Pioneer',    desc: 'First Codex data push' },
  'gemini-first':      { emoji: '💎', name: 'Gemini Explorer',  desc: 'First Gemini data push' },
  'antigravity-first': { emoji: '🚀', name: 'AG Pilot',         desc: 'First Antigravity data push' },
} as const;
```

```typescript
// components/app/achievements/AchievementBadge.tsx
import { Tooltip } from '@/components/ui/Tooltip';
import { ACHIEVEMENTS } from '@/lib/constants/achievements';

export function AchievementBadge({ slug, earned = true, size = 'md' }) {
  const achievement = ACHIEVEMENTS[slug];
  if (!achievement) return null;

  return (
    <Tooltip content={`${achievement.name}: ${achievement.desc}`}>
      <div className={cn(
        'flex items-center justify-center rounded-xl border transition-all',
        size === 'sm' ? 'w-10 h-10 text-xl' : 'w-14 h-14 text-3xl',
        earned
          ? 'bg-subtle border-gray-100 hover:border-accent/30 hover:bg-accent/5'
          : 'bg-gray-50 border-gray-100 opacity-30 grayscale'
      )}>
        {achievement.emoji}
      </div>
    </Tooltip>
  );
}
```

---

### 7.2 — Achievement Unlock Toast

```typescript
// components/app/achievements/AchievementToast.tsx
'use client';
import { motion, AnimatePresence } from 'motion/react';
import { ACHIEVEMENTS } from '@/lib/constants/achievements';

export function AchievementToast({ slug, onDismiss }) {
  const achievement = ACHIEVEMENTS[slug];
  if (!achievement) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed bottom-6 right-6 z-50 bg-white border-2 border-accent rounded-2xl p-4 shadow-elevated flex items-center gap-4 cursor-pointer max-w-xs"
      onClick={onDismiss}
    >
      <div className="text-4xl">{achievement.emoji}</div>
      <div>
        <div className="text-xs font-semibold text-accent uppercase tracking-wide">Achievement Unlocked!</div>
        <div className="font-bold">{achievement.name}</div>
        <div className="text-xs text-muted">{achievement.desc}</div>
      </div>
    </motion.div>
  );
}
```

---

### 7.3 — Shareable Recap Card — With Provider Breakdown

```typescript
// components/app/recap/RecapCard.tsx
// Renders as: 1200×630 (OG) or 1080×1080 (Instagram)

export function RecapCard({ user, period, stats, providers, background }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 1200, height: 630, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background */}
      {background && (
        <img src={background} className="absolute inset-0 w-full h-full object-cover" alt="" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-16 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">STRAUDE</div>
          <div className="text-sm opacity-75">@{user.username} · {period}</div>
        </div>

        {/* Main Stats */}
        <div className="flex-1 flex items-center gap-16">
          <div>
            <div className="text-7xl font-bold font-mono">{formatCost(stats.total_cost)}</div>
            <div className="text-xl opacity-75 mt-2">total spend</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-mono font-bold">{formatTokens(stats.total_tokens)}</div>
              <div className="text-sm opacity-60">total tokens</div>
            </div>
            <div>
              <div className="text-3xl font-bold">🔥{stats.streak}</div>
              <div className="text-sm opacity-60">day streak</div>
            </div>
          </div>
        </div>

        {/* Provider Breakdown — NEW */}
        {providers.length > 0 && (
          <div className="flex items-center gap-6">
            {providers.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm opacity-90">{p.label}</span>
                <span className="text-sm font-mono font-bold">{formatCost(p.cost)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm opacity-50">
          <span>straude.dev</span>
          <span>Track your AI coding. All of it.</span>
        </div>
      </div>
    </div>
  );
}
```

---

## PHASE 8 — Landing Page Rebuild

### Goal
Rebuild the public landing page for the multi-model era. Strava-for-AI-coding energy, now spanning 4 providers.

---

### 8.1 — Landing Page Architecture

```
/                 (app/(landing)/page.tsx)
├── LandingNav    — Sticky nav: STRAUDE logo + Get Started button
├── HeroSection   — Headline + CTA + FLUX background + provider logos
├── ProviderShowcase — 4 provider cards with colors and descriptions
├── FeaturesGrid  — Track, Share, Compete, Streak, Multi-Model Dashboard
├── HowItWorks    — 3-step flow (npx → push → compete)
├── WallOfLove    — Curated tweets (masonry, no Twitter JS)
├── CTASection    — Final CTA
└── Footer        — Privacy, Terms, GitHub, Built with AI Coding Agents
```

---

### 8.2 — Hero Section

```
┌───────────────────────────────────────────────────────────────┐
│  FLUX-generated athletic/tech background                      │
│  (dark overlay for readability)                               │
│                                                               │
│         Track your AI coding.                                 │
│              All of it.                                       │
│                                                               │
│     The social platform for Claude, Codex, Gemini,           │
│          and Antigravity developers.                          │
│                                                               │
│         [  Get Started — Free  →  ]                           │
│                                                               │
│  [🟠 Claude] [🟢 Codex] [🔵 Gemini] [🟣 Antigravity]        │
│                                                               │
│         npx straude@latest                                    │
│         > Syncing 23 days of usage...                         │
│         > ✓ Pushed to straude.dev                             │
└───────────────────────────────────────────────────────────────┘
```

```typescript
// components/landing/HeroSection.tsx
'use client';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ProviderLogoStrip } from './ProviderLogoStrip';
import { CLIDemo } from './CLIDemo';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      </div>

      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6"
        >
          Track your AI coding.
          <br />
          <span className="text-accent">All of it.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl md:text-2xl text-white/80 mb-10 font-light"
        >
          The social platform for Claude, Codex, Gemini,
          <br />
          and Antigravity developers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/login"
            className="bg-accent text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            Get Started — Free
            <span>→</span>
          </Link>
          <Link
            href="/leaderboard"
            className="text-white/80 hover:text-white px-6 py-4 text-sm font-medium transition-colors"
          >
            View Leaderboard ↗
          </Link>
        </motion.div>

        {/* Provider Logo Strip */}
        <ProviderLogoStrip />
        
        {/* CLI Demo Terminal */}
        <CLIDemo />
      </div>
    </section>
  );
}
```

---

### 8.3 — Provider Showcase Section — NEW

```typescript
// components/landing/ProviderShowcase.tsx
import { PROVIDERS } from '@/lib/constants/providers';

const providerDescriptions = {
  claude: 'npx ccusage — Zero-install. Reads ~/.claude/projects/*.jsonl',
  codex: 'npx @ccusage/codex — Same experience as ccusage, for Codex logs',
  gemini: 'OpenTelemetry adapter — Reads ~/.gemini/tmp/ session data',
  antigravity: 'Custom adapter — IDE session logs, auto-detected',
};

export function ProviderShowcase() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-black text-center mb-4">One platform. Every AI tool.</h2>
        <p className="text-xl text-muted text-center mb-16">
          Straude automatically detects which AI coding agents you use.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.values(PROVIDERS).map(p => (
            <div
              key={p.id}
              className="rounded-2xl border-2 p-6 text-center hover:scale-105 transition-transform cursor-default"
              style={{ borderColor: `${p.color}40`, backgroundColor: p.bgColor }}
            >
              <img src={p.logo} alt={p.label} className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2" style={{ color: p.color }}>{p.label}</h3>
              <p className="text-xs text-muted leading-relaxed">{providerDescriptions[p.id]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### 8.4 — CLI Demo Terminal Animation

```typescript
// components/landing/CLIDemo.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const lines = [
  { text: '$ npx straude@latest', delay: 0, type: 'input' },
  { text: '✓ Logged in as @harry', delay: 0.8, type: 'success' },
  { text: '→ Detecting providers...', delay: 1.4, type: 'info' },
  { text: '  🟠 Claude Code: found (23 days)', delay: 1.8, type: 'provider' },
  { text: '  🟢 Codex: found (12 days)', delay: 2.2, type: 'provider' },
  { text: '  🔵 Gemini: found (8 days)', delay: 2.6, type: 'provider' },
  { text: '→ Syncing 43 days of usage...', delay: 3.0, type: 'info' },
  { text: '✓ Pushed! View at straude.dev/u/harry', delay: 4.2, type: 'success' },
];

export function CLIDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setVisibleLines(v => Math.max(v, i + 1)), lines[i].delay * 1000 + 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-10 bg-black/80 backdrop-blur rounded-xl p-6 font-mono text-left max-w-lg mx-auto text-sm border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-white/40 text-xs">Terminal</span>
      </div>

      <div className="space-y-1">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              line.type === 'input' ? 'text-white' :
              line.type === 'success' ? 'text-green-400' :
              line.type === 'provider' ? 'text-white/80' :
              'text-white/60'
            }
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <span className="animate-pulse text-white/60">█</span>
        )}
      </div>
    </motion.div>
  );
}
```

---

### 8.5 — Wall of Love (Static, No Twitter JS)

```typescript
// components/landing/WallOfLove.tsx

// Design: Masonry grid of static tweet cards
// Each card: avatar + name + @handle + tweet text + date
// No Twitter embed JS — just styled divs with ✕ (Twitter/X) logo
// Cards slightly rotated for organic feel

interface Tweet {
  avatar: string;
  name: string;
  handle: string;
  text: string;
  date: string;
  provider?: string; // NEW — tag which provider they're talking about
}

export function WallOfLove({ tweets }: { tweets: Tweet[] }) {
  return (
    <section className="py-24 bg-subtle">
      <h2 className="text-4xl font-black text-center mb-16">Builders love it</h2>
      
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 max-w-6xl mx-auto px-6">
        {tweets.map((tweet, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-card"
            style={{ transform: `rotate(${(i % 3 - 1) * 0.5}deg)` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img src={tweet.avatar} alt={tweet.name} className="w-8 h-8 rounded-full" />
                <div>
                  <div className="font-semibold text-sm">{tweet.name}</div>
                  <div className="text-xs text-muted">{tweet.handle}</div>
                </div>
              </div>
              <XIcon className="w-4 h-4 text-muted" />
            </div>
            <p className="text-sm leading-relaxed">{tweet.text}</p>
            {tweet.provider && (
              <ProviderChip provider={tweet.provider as any} size="sm" className="mt-3" />
            )}
            <div className="text-xs text-muted mt-3">{tweet.date}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## PHASE 9 — Settings, Onboarding & Import

### Goal
Build profile management, privacy settings, the first-run onboarding flow, and the web import fallback.

---

### 9.1 — Onboarding Flow

```
Step 1/3: Choose a username
Step 2/3: Set your country (for regional leaderboard)
Step 3/3: Install the CLI (or import via web)
```

```typescript
// app/(onboarding)/onboarding/page.tsx

// Multi-step form with progress indicator
// Step 1: Username availability check (debounced API call)
// Step 2: Country select (ISO dropdown)
// Step 3: CLI install instructions + "Skip, I'll import manually" link

// Each step: smooth slide-in animation with motion/react
// Progress bar at top: 1/3 → 2/3 → 3/3
// Cannot go to app until username is set (enforced in layout.tsx)
```

---

### 9.2 — Web Import (Settings Page)

```typescript
// components/app/settings/WebImport.tsx

// File upload interface for importing ccusage/Gemini/Codex JSON output
// Drag & drop zone with dashed border
// Manual paste textarea as alternative
// Provider selector (which AI is this data from?)
// Date picker for the day being imported
// Preview parsed stats before submitting
// Submit → POST /api/usage/submit
```

---

### 9.3 — Settings Page Structure

```
Settings
├── Profile          — Avatar upload, display name, bio, timezone
├── Privacy          — Public/private toggle, blocked users
├── Notifications    — Kudos, comments, mentions, follows — on/off each
├── AI Provider      — NEW: Default AI for caption generation
├── Import Data      — Web import fallback (link to /settings/import)
└── Account          — Change email, delete account
```

---

## PHASE 10 — Animations, Polish & Accessibility

### Goal
Elevate the experience from functional to delightful. Motion, micro-interactions, accessibility, and performance polish.

---

### 10.1 — Motion Patterns

```typescript
// Consistent animation primitives across the app

// Page transition (route changes)
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// Card stagger on feed load
const feedContainerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const feedItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Spring physics for interactive elements
const springConfig = { type: 'spring', stiffness: 300, damping: 25 };

// Kudos bolt: scale + rotate burst
// Provider chips: slide in left-to-right on mount
// Achievement toast: spring from bottom
// Notification badge: scale pulse when new notification arrives
// Leaderboard rows: subtle stagger on load
// Contribution graph cells: fade-in in wave pattern from left
```

---

### 10.2 — Responsive Breakpoints

```
Mobile:   < 768px  — Bottom nav, full-width cards, no sidebar
Tablet:   768-1024px — Side nav visible, no right sidebar  
Desktop:  > 1024px — Both sidebars, 3-column layout
Wide:     > 1280px — Max-width container centered
```

Key mobile adaptations:
- Stats grid: 2×2 on mobile (4×1 on desktop)
- Contribution graph: horizontally scrollable on mobile
- Leaderboard: stack rank + user info, show only cost on mobile
- Provider chips: wrap naturally

---

### 10.3 — Accessibility

```typescript
// Key a11y requirements:

// 1. All interactive elements: focus-visible ring
// focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2

// 2. Color is never the only differentiator
// Provider chips: always show text label, not just color dot

// 3. Contribution graph: aria-label on each cell
// aria-label="Feb 16: $4.82 spend, Claude + Codex"

// 4. Modals/dialogs: focus trap, Escape to close (Base UI handles this)

// 5. Loading states: aria-busy, aria-live="polite" for dynamic content

// 6. Reduced motion: respect prefers-reduced-motion
// Use CSS: @media (prefers-reduced-motion: reduce) { ... }
// And Framer: reducedMotion prop

// 7. Semantic HTML: article, section, nav, header, footer
// -- ActivityCard uses <article>
// -- Feed uses <section>
// -- Nav uses <nav>

// 8. Skip links: "Skip to main content" for keyboard users
```

---

### 10.4 — Loading & Error States

Every data-fetching component needs three states:

```typescript
// Pattern for all data components:

// Loading: Show skeleton (ActivityCardSkeleton, LeaderboardSkeleton, etc.)
// Error:   Show error card with retry button
// Empty:   Show contextual empty state with CTA

// Empty states:
// - Following feed empty: "Follow some developers to see their activity. Browse the global feed →"
// - Profile with no posts: "No posts yet. Push your first day of usage with npx straude@latest"
// - Search no results: "No users found for '@query'. Check the spelling or try a different username."
// - Leaderboard filter empty: "No data for this provider + time period. Try 'All Providers' →"
```

---

### 10.5 — SEO & Metadata

```typescript
// app/(app)/u/[username]/page.tsx
export async function generateMetadata({ params }) {
  const profile = await getProfile(params.username);
  return {
    title: `@${profile.username} on Straude`,
    description: `${profile.username}'s AI coding stats — ${formatCost(profile.total_spend)} total, ${profile.streak_days} day streak`,
    openGraph: {
      images: [{ url: `/recap/${profile.username}?type=og`, width: 1200, height: 630 }],
    },
  };
}

// Recap route generates OG images server-side via Next.js ImageResponse
// app/recap/[username]/route.tsx → uses @vercel/og
```

---

## COMPONENT REFERENCE CATALOGUE

| Component | Location | Phase | Description |
|-----------|----------|-------|-------------|
| `Button` | `ui/Button.tsx` | 1 | Base button with 4 variants |
| `Avatar` | `ui/Avatar.tsx` | 1 | User avatar with fallback initials |
| `ProviderChip` | `ui/ProviderChip.tsx` | 1 | Colored provider pill — NEW |
| `VerifiedBadge` | `ui/VerifiedBadge.tsx` | 1 | CLI-verified checkmark |
| `Skeleton` | `ui/Skeleton.tsx` | 1 | Shimmer loading placeholder |
| `Tooltip` | `ui/Tooltip.tsx` | 1 | Hover tooltip (Base UI wrapper) |
| `Dialog` | `ui/Dialog.tsx` | 1 | Modal dialog (Base UI wrapper) |
| `AppNav` | `app/AppNav.tsx` | 1 | Top navigation bar |
| `LeftSidebar` | `app/LeftSidebar.tsx` | 1 | Desktop left nav |
| `RightSidebar` | `app/RightSidebar.tsx` | 1 | Who to follow widget |
| `BottomNav` | `app/BottomNav.tsx` | 1 | Mobile bottom navigation |
| `FeedTabs` | `feed/FeedTabs.tsx` | 2 | Following/Global tab switcher |
| `ActivityCard` | `feed/ActivityCard.tsx` | 2 | **Core card component** |
| `StatsGrid` | `feed/StatsGrid.tsx` | 2 | 4-column stats grid |
| `ProviderChips` | `feed/ProviderChips.tsx` | 2 | Provider list on card — NEW |
| `ProviderBreakdown` | `feed/ProviderBreakdown.tsx` | 2 | Expandable per-provider stats — NEW |
| `ImageGallery` | `feed/ImageGallery.tsx` | 2 | Up to 5 images + lightbox |
| `Lightbox` | `feed/Lightbox.tsx` | 2 | Fullscreen image viewer |
| `ActivityCardSkeleton` | `feed/ActivityCardSkeleton.tsx` | 2 | Loading placeholder |
| `KudosButton` | `social/KudosButton.tsx` | 3 | ⚡ with spring animation |
| `CommentSection` | `social/CommentSection.tsx` | 3 | Flat comment thread |
| `CommentInput` | `social/CommentInput.tsx` | 3 | Textarea + @mention |
| `MentionAutocomplete` | `social/MentionAutocomplete.tsx` | 3 | Dropdown user search |
| `FollowButton` | `social/FollowButton.tsx` | 3 | Follow/unfollow optimistic |
| `NotificationBell` | `social/NotificationBell.tsx` | 3 | Bell + dropdown panel |
| `LeaderboardFilters` | `leaderboard/LeaderboardFilters.tsx` | 4 | Time + Region + Provider — NEW |
| `LeaderboardTable` | `leaderboard/LeaderboardTable.tsx` | 4 | Ranked rows container |
| `LeaderboardRow` | `leaderboard/LeaderboardRow.tsx` | 4 | Single rank row |
| `RankBadge` | `leaderboard/RankBadge.tsx` | 4 | 🥇🥈🥉 |
| `ProfileHeader` | `profile/ProfileHeader.tsx` | 5 | Avatar, bio, stats |
| `StatsCard` | `profile/StatsCard.tsx` | 5 | Lifetime spend summary |
| `ContributionGraph` | `profile/ContributionGraph.tsx` | 5 | 52×7 heatmap with provider colors |
| `StreakCounter` | `profile/StreakCounter.tsx` | 5 | 🔥 day counter |
| `ProviderBadges` | `profile/ProviderBadges.tsx` | 6 | Which providers used — NEW |
| `ProviderStatsBreakdown` | `profile/ProviderStatsBreakdown.tsx` | 6 | Per-provider lifetime table — NEW |
| `FeedProviderFilter` | `feed/FeedProviderFilter.tsx` | 6 | Filter feed by provider — NEW |
| `AIProviderSettings` | `settings/AIProviderSettings.tsx` | 6 | Caption AI preference — NEW |
| `AchievementBadge` | `achievements/AchievementBadge.tsx` | 7 | Single badge + tooltip |
| `AchievementToast` | `achievements/AchievementToast.tsx` | 7 | Unlock animation |
| `AchievementsGrid` | `achievements/AchievementsGrid.tsx` | 7 | Profile achievement wall |
| `RecapCard` | `recap/RecapCard.tsx` | 7 | Shareable image component |
| `LandingNav` | `landing/LandingNav.tsx` | 8 | Public landing navbar |
| `HeroSection` | `landing/HeroSection.tsx` | 8 | Landing hero |
| `ProviderShowcase` | `landing/ProviderShowcase.tsx` | 8 | 4-provider cards — NEW |
| `CLIDemo` | `landing/CLIDemo.tsx` | 8 | Animated terminal — NEW |
| `WallOfLove` | `landing/WallOfLove.tsx` | 8 | Masonry tweet cards |
| `FeaturesGrid` | `landing/FeaturesGrid.tsx` | 8 | Feature cards |
| `HowItWorks` | `landing/HowItWorks.tsx` | 8 | 3-step flow |
| `WebImport` | `settings/WebImport.tsx` | 9 | Drag-drop JSON import |

---

## STATE MANAGEMENT STRATEGY

Straude does **not** use Redux, Zustand, or a global store. State is managed at the appropriate level:

```
Server State (data fetching):
├── Server Components (RSC)     — Initial page data, profiles, leaderboard
├── fetch() + revalidation      — SWR-style manual refresh where needed
└── Supabase Realtime           — (optional future) live kudos counts

Client State (UI state):
├── useState                   — Local component state (open/closed, form values)
├── useReducer                 — Complex local state (multi-step forms)
├── URL search params           — Filter state (tab, period, region, provider) — shareable!
└── Custom hooks                — useFeed, useKudos, useFollow, useNotifications

Optimistic UI:
├── KudosButton                — Instant toggle, revert on error
├── FollowButton               — Instant state change, revert on error
└── Comment submit             — Append locally, rollback on error

Global:
└── No global store needed     — User profile available via server component prop drilling
                               — Toast notifications via React Context (AchievementToastContext)
```

---

## PERFORMANCE GUIDELINES

### Image Optimization
```typescript
// Always use next/image for all user-uploaded content
// - Automatic WebP conversion
// - Lazy loading by default
// - Blur placeholder for images above the fold

// Supabase Storage image transforms for thumbnails:
// ${SUPABASE_URL}/storage/v1/render/image/public/uploads/${path}?width=400&quality=75
```

### Code Splitting
```typescript
// Dynamic imports for heavy components
const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false });
const RecapCard = dynamic(() => import('./RecapCard'), { ssr: false });
const ContributionGraph = dynamic(() => import('./ContributionGraph'), { ssr: false });
```

### Feed Performance
```typescript
// Cursor-based pagination (not offset) — consistent, fast
// Initial 20 posts SSR, then infinite scroll client-side
// Virtual scrolling not needed until >200 posts in view
// ActivityCard: memo() if list becomes large
```

### Bundle Size Targets
```
Page JS budget:      < 150KB gzipped per route
Total First Load JS: < 300KB
Core Web Vitals:
  LCP: < 2.5s
  FID/INP: < 100ms
  CLS: < 0.1
```

---

## DEVELOPMENT ORDER (RECOMMENDED)

```
Week 1: Foundation
  Day 1-2: Design system, tokens, base components (Button, Avatar, etc.)
  Day 3-4: App shell, routing, auth guards, nav
  Day 5:   ActivityCard (the most important component)

Week 2: Core Features  
  Day 1-2: Feed with infinite scroll, tabs
  Day 3:   Social (kudos, comments, follow)
  Day 4:   Leaderboard
  Day 5:   Profile page

Week 3: Multi-Model UI
  Day 1-2: Provider chips, breakdown, profile badges
  Day 3:   Provider filter (feed + leaderboard)
  Day 4:   Contribution graph with provider colors
  Day 5:   AI Provider settings

Week 4: Polish & Launch
  Day 1:   Achievements + toasts
  Day 2:   Recap cards
  Day 3:   Landing page rebuild
  Day 4:   Onboarding + web import
  Day 5:   Animations, a11y audit, performance
```

---

*This plan covers every component, layout, interaction, and design decision needed to build the complete Straude multi-model frontend. Each phase is self-contained and deliverable. Ready for backend plan when you are.*
