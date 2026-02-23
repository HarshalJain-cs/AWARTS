

# AWARTS -- Comprehensive Docs Page + Final Fixes

## Bug Fix

**Duplicate Gemini in Leaderboard filter** -- `src/pages/Leaderboard.tsx` line 55 has a duplicate `<SelectItem value="gemini">Gemini</SelectItem>`. Remove it.

## New Docs Page (`/docs`)

A full-featured documentation page with sidebar navigation, searchable content, and sections covering everything from beginner to advanced usage. Uses the existing `AppShell` layout and Accordion/Tabs components already in the project.

### Docs Page Structure

The page will have a left-hand table of contents (sticky on desktop) and a main content area with all sections rendered as anchored headings. A search bar at the top filters visible sections.

### Content Sections (Beginner to Advanced)

1. **Getting Started**
   - What is AWARTS
   - Quick start (3-step guide matching onboarding)
   - System requirements

2. **Installation**
   - CLI install via `npx awarts@latest`
   - Configuration file (`.awartsrc`)
   - Updating the CLI

3. **Providers**
   - Claude -- setup, API key config, session tracking
   - Codex -- setup, API key config, session tracking
   - Gemini -- setup, API key config, session tracking
   - Multi-provider sessions

4. **Core Concepts**
   - Sessions -- what counts as a session
   - Tokens -- input vs output, how they're measured
   - Cost tracking -- how spend is calculated
   - Streaks -- how streaks work, reset rules

5. **Dashboard Guide**
   - Feed -- filtering, following, global view
   - Leaderboard -- filters (time, region, provider)
   - Profile -- stats, contribution graph, achievements
   - Recap -- generating and exporting recap cards
   - Search -- finding users

6. **Achievements**
   - Full list of all 12 achievements with unlock criteria
   - Pulled dynamically from `ACHIEVEMENTS` constant

7. **CLI Reference**
   - Commands table: `awarts sync`, `awarts status`, `awarts export`, `awarts config`
   - Flags and options
   - Environment variables

8. **API Reference**
   - Endpoints overview (REST)
   - Authentication (API keys)
   - Rate limits
   - Example requests/responses

9. **Privacy and Data**
   - What data is collected
   - Public vs private profiles
   - Data export and deletion

10. **FAQ**
    - Common questions with accordion expand/collapse

11. **Keyboard Shortcuts**
    - `/` to focus search
    - All navigation shortcuts

12. **Troubleshooting**
    - Common errors and fixes
    - CLI debug mode
    - Contacting support

### Navigation Updates

| File | Change |
|------|--------|
| `src/pages/Docs.tsx` | New file -- full docs page with TOC + searchable sections |
| `src/App.tsx` | Add lazy route for `/docs` |
| `src/components/layout/LeftSidebar.tsx` | Add "Docs" nav item with `BookOpen` icon |
| `src/components/layout/BottomNav.tsx` | Replace one item or add docs link |
| `src/pages/Landing.tsx` | Add "Docs" link in the landing nav header |
| `src/pages/Leaderboard.tsx` | Remove duplicate Gemini `<SelectItem>` |

### Technical Approach

- Docs content is defined as a structured array of sections, each with `id`, `title`, `icon`, and `content` (JSX)
- Table of contents is auto-generated from the sections array
- Search filters sections by title/content text match
- Uses existing `Accordion` for FAQ, code blocks with `font-mono` styling for CLI/API examples
- Smooth scroll to section on TOC click via `scrollIntoView`
- Mobile: TOC collapses into a dropdown select at the top
- Achievements section dynamically maps `ACHIEVEMENTS` from constants

### Total: 1 new file, 5 files modified

