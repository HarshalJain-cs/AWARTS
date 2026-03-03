<p align="center">
  <img src="public/favicon.svg" alt="AWARTS Logo" width="60" height="60" />
</p>

<h1 align="center">AWARTS</h1>

<p align="center">
  <strong>Strava for AI Coding</strong> — Track your Claude, Codex, Gemini & Antigravity sessions.<br/>
  Compete on leaderboards. Maintain streaks. Share your sessions with developers worldwide.
</p>

<p align="center">
  <a href="https://awarts.vercel.app">Live App</a> &middot;
  <a href="https://www.npmjs.com/package/awarts">CLI on npm</a> &middot;
  <a href="https://awarts.vercel.app/docs">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Convex-Backend-FF6B00?logo=data:image/svg+xml;base64,PHN2Zy8+" alt="Convex" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/npm/v/awarts?label=CLI&color=CB3837&logo=npm" alt="npm version" />
</p>

---

## What is AWARTS?

AWARTS (**A**I **W**orkflow **A**ctivity & **R**untime **T**racking **S**ystem) is a social fitness tracker for AI-assisted coding. It automatically reads your local AI provider usage data and turns it into a social profile with stats, streaks, leaderboards, and achievements.

**Think Strava, but for your AI coding sessions.**

### Supported Providers

| Provider | Color | Source |
|---|---|---|
| **Claude** (Anthropic) | Orange | `~/.claude/usage/` |
| **Codex** (OpenAI) | Green | Local session logs |
| **Gemini** (Google) | Blue | Local session logs |
| **Antigravity** | Purple | Local session logs |

---

## Features

- **Session Tracking** — Automatically detect and sync AI coding sessions (tokens, cost, duration, model)
- **Global Leaderboard** — Ranked by output tokens with daily/weekly/monthly/all-time filters and country-specific rankings
- **Social Feed** — Follow developers, give kudos, comment on sessions
- **Contribution Graph** — GitHub-style heatmap showing your daily AI coding activity
- **13 Achievements** — Unlock badges for milestones (streaks, token counts, multi-provider usage)
- **Recap Cards** — Generate shareable recap cards with your stats
- **CLI with Daemon** — Background auto-sync every 5 minutes, or manual `sync` on demand
- **AI Captions** — Auto-generate social post captions from your session stats
- **Privacy Controls** — Public/private profiles, no code or prompts are ever collected

---

## Quick Start

### 1. Create an account

Visit [awarts.vercel.app](https://awarts.vercel.app) and sign up with GitHub.

### 2. Install the CLI

```bash
npx awarts@latest
```

Or install globally:

```bash
npm install -g awarts
```

### 3. Authenticate

```bash
npx awarts login
```

This opens a browser window to verify your device.

### 4. Sync your sessions

```bash
npx awarts sync
```

### 5. Enable auto-sync (optional)

```bash
npx awarts daemon start
```

The daemon syncs every 5 minutes in the background.

---

## CLI Reference

| Command | Description |
|---|---|
| `awarts login` | Authenticate via device code flow |
| `awarts sync` | Detect providers and push all new sessions |
| `awarts sync -p claude` | Sync only Claude sessions |
| `awarts status` | Show auth status and detected providers |
| `awarts daemon start` | Start background auto-sync |
| `awarts daemon stop` | Stop the daemon |
| `awarts daemon status` | Check if daemon is running |
| `awarts daemon logs` | View recent daemon output |
| `awarts whoami` | Show current logged-in user |
| `awarts logout` | Clear stored credentials |

### Flags

| Flag | Description | Default |
|---|---|---|
| `--provider, -p` | Filter by provider | all |
| `--since` | Only sync sessions after this date | last sync |
| `--dry-run` | Preview without posting | false |
| `--verbose, -v` | Detailed output | false |
| `--interval` | Sync interval in minutes (daemon) | 5 |

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives)
- **React Router v6** for client-side routing
- **Framer Motion** for animations
- **Recharts** for data visualization
- **React Helmet Async** for per-page SEO
- **Clerk** for authentication (GitHub OAuth)

### Backend
- **Convex** — Serverless database, real-time queries, mutations, and scheduled jobs
- **OpenAI GPT-4o-mini** — AI caption generation (optional)

### CLI
- **Commander.js** for argument parsing
- **Jose** for JWT handling
- **Chalk** + **Ora** for terminal styling

### Deployment
- **Vercel** for frontend hosting
- **Convex Cloud** for backend
- **npm** for CLI distribution

---

## Project Structure

```
awarts/
├── cli/                    # CLI tool (published to npm as "awarts")
│   └── src/
│       ├── index.ts        # Entry point with all commands
│       ├── commands/       # login, push, sync, status, daemon
│       ├── adapters/       # Provider integrations (claude, codex, gemini, antigravity)
│       └── lib/            # API client, auth store, daemon, detection
├── convex/                 # Convex backend functions + schema
│   ├── schema.ts           # Database tables definition
│   ├── feed.ts             # Feed queries with pagination
│   ├── leaderboard.ts      # Ranking by period/region/provider
│   ├── posts.ts            # Post CRUD
│   ├── social.ts           # Follow, kudos, comments
│   ├── usage.ts            # Session submission endpoint
│   ├── users.ts            # Profile management
│   ├── search.ts           # User search
│   ├── cliAuth.ts          # Device auth flow
│   └── ai.ts               # AI caption generation
├── src/
│   ├── components/         # 19 React components
│   │   ├── SEO.tsx         # Per-page meta tags
│   │   ├── ActivityCard.tsx
│   │   ├── ContributionGraph.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── ProviderChip.tsx
│   │   └── layout/
│   │       └── AppShell.tsx # Main layout wrapper
│   ├── pages/              # 18 route pages
│   │   ├── Landing.tsx     # Marketing homepage
│   │   ├── Feed.tsx        # Activity feed
│   │   ├── Leaderboard.tsx # Global rankings
│   │   ├── Profile.tsx     # User profile
│   │   ├── Docs.tsx        # Full documentation
│   │   └── ...
│   ├── hooks/              # Custom React hooks (use-api, use-toast)
│   ├── context/            # Auth context provider
│   └── lib/                # Utils, types, constants, formatters
├── public/                 # Static assets (favicons, sitemap, robots.txt)
├── vercel.json             # Vercel deployment config
├── vite.config.ts          # Vite build config with chunk splitting
└── index.html              # Entry HTML with JSON-LD structured data
```

---

## Achievements

| Badge | Name | Requirement |
|---|---|---|
| 🚀 | First Sync | Push your first session |
| ⚔️ | Week Warrior | 7-day streak |
| 💪 | Power User | 30-day streak |
| 📝 | 100K Output | 100K output tokens in one session |
| 📚 | 1M Output | 1M total output tokens |
| 🏛️ | 100M Output | 100M total output tokens |
| 💸 | Big Spender | Spend $100 in a single session |
| 👑 | Elite | Top 10 on leaderboard |
| 🌐 | Polyglot Coder | Use 2+ providers |
| 🤖 | Full Stack AI | Use all 4 providers |
| 🟢 | Codex Pioneer | First Codex session |
| 🔵 | Gemini Explorer | First Gemini session |
| 🟣 | Antigravity Adept | First Antigravity session |

---

## Development

### Prerequisites

- Node.js 18+
- npm or bun

### Setup

```bash
# Clone the repo
git clone https://github.com/HarshalJain-cs/AWARTS.git
cd AWARTS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in VITE_CONVEX_URL, VITE_CLERK_PUBLISHABLE_KEY, CONVEX_DEPLOYMENT
```

### Run locally

```bash
# Start Convex backend + Vite dev server
npm run dev

# Or run frontend only (if Convex is already running)
npm run dev:frontend

# Or run Convex dev server separately
npm run dev:convex
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_CONVEX_URL` | Convex deployment URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CONVEX_DEPLOYMENT` | Convex deployment identifier |
| `CONVEX_DEPLOY_KEY` | Convex deploy key (for CI/CD) |
| `OPENAI_API_KEY` | OpenAI key for AI captions (optional) |

---

## Privacy

AWARTS collects **only session metadata** — token counts, costs, timestamps, provider, and model. **No source code, prompts, or conversation content is ever accessed or transmitted.** See the full [Privacy Policy](https://awarts.vercel.app/privacy).

---

## License

MIT

---

<p align="center">
  Built by <a href="https://github.com/HarshalJain-cs">Harshal Jain</a>
</p>
