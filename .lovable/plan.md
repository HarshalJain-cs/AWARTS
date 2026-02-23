

# AWARTS -- Full Audit, Bug Fixes, and Improvements Plan

## Performance Rating: 7/10

The app is well-structured with good component separation, but has several bugs and areas for improvement.

---

## BUGS FOUND (Critical)

### 1. ContributionGraph: Dynamic Tailwind classes won't work (Severity: HIGH)
The heatmap uses dynamic class names like `bg-claude/20`, `bg-codex/40` etc. Tailwind purges classes it doesn't see at build time, so these will render as invisible/unstyled squares.

**Fix**: Use inline styles with the actual HSL values from constants instead of dynamic Tailwind classes.

### 2. LeaderboardTable: Same dynamic class issue (Severity: HIGH)
Line 54 uses `bg-${p}` for provider dots -- these won't render colors.

**Fix**: Use a mapping object or inline styles.

### 3. TerminalDemo: Still references "straude" (Severity: MEDIUM)
Line 5 shows `$ bunx straude` and line 19 shows `straude.com/u/alexdev`. Should say AWARTS.

### 4. Landing page CLI command: Still says "straude" (Severity: MEDIUM)
Line 16 copies `npx straude@latest` to clipboard, and line 79 displays it.

### 5. Onboarding CLI command: Still says "straude" (Severity: MEDIUM)
Lines 23, 112 reference `npx straude@latest`.

### 6. Recap card: Says "STRAUDE RECAP" (Severity: MEDIUM)
Line 32 still shows old branding.

### 7. Settings import section: References "straude CLI" (Severity: LOW)
Line 82 says "JSON files from straude CLI export".

### 8. Landing page theme toggle missing (Severity: LOW)
The landing page has its own header (not using Navbar component), so the theme toggle is absent when visiting `/`.

### 9. Notification panel doesn't close on outside click (Severity: LOW)
Clicking outside the notification panel doesn't dismiss it.

### 10. `useEffect` import unused in Navbar (Severity: LOW)
`useEffect` is imported but never used.

---

## PERFORMANCE IMPROVEMENTS

### 1. Font loading blocks rendering (Rating impact: -1)
Google Fonts loaded via CSS `@import` blocks first paint. Should use `<link rel="preconnect">` in `index.html`.

### 2. Mock data re-generates heatmap on every import (Rating impact: -0.5)
`generateHeatmap()` runs on every module load with `Math.random()`, causing inconsistent data between renders if the module is re-evaluated.

### 3. No lazy loading for pages (Rating impact: -0.5)
All pages are eagerly imported in App.tsx. Should use `React.lazy()` for code splitting.

### 4. Large Framer Motion animations on every feed card (Rating impact: -0.5)
Every card animates on mount even when scrolling back -- could use `whileInView` with `once: true` instead.

---

## FEATURE ADDITIONS

### 1. Theme persistence
Save theme preference to `localStorage` so it persists across sessions.

### 2. Share button functionality
The share button on ActivityCard does nothing. Add `navigator.share()` or copy-link-to-clipboard.

### 3. Toast notifications for actions
Show toast when: copying CLI command, toggling kudos, following/unfollowing, saving settings.

### 4. Landing page theme toggle
Add Sun/Moon toggle to the landing page header.

### 5. Click-outside to close notifications
Dismiss notification panel when clicking outside.

---

## Technical Implementation Details

### Files to modify:

| File | Changes |
|------|---------|
| `src/components/ContributionGraph.tsx` | Replace dynamic Tailwind classes with inline styles using PROVIDERS constant colors |
| `src/components/LeaderboardTable.tsx` | Replace `bg-${p}` with inline style using PROVIDERS color |
| `src/components/TerminalDemo.tsx` | Replace "straude" with "awarts" |
| `src/pages/Landing.tsx` | Fix CLI command text, add theme toggle to header |
| `src/pages/Onboarding.tsx` | Fix CLI command text |
| `src/pages/Recap.tsx` | Fix "STRAUDE RECAP" to "AWARTS RECAP" |
| `src/pages/Settings.tsx` | Fix "straude CLI" reference |
| `src/components/layout/Navbar.tsx` | Remove unused `useEffect` import, add click-outside for notifications, persist theme to localStorage |
| `src/components/ActivityCard.tsx` | Add share functionality with toast |
| `index.html` | Add font preconnect links |
| `src/App.tsx` | Add React.lazy() for route-level code splitting |

### ContributionGraph fix approach:
Instead of `bg-${day.dominantProvider}/20`, use:
```typescript
const providerColors: Record<Provider, string> = {
  claude: '24, 95%, 53%',
  codex: '142, 71%, 45%',
  gemini: '217, 91%, 60%',
  antigravity: '262, 83%, 58%',
};
// Then: style={{ backgroundColor: `hsl(${providerColors[provider]} / ${opacity})` }}
```

### LeaderboardTable fix approach:
Same pattern -- replace dynamic `bg-${p}` with inline style using the provider color constant.

### Theme persistence approach:
```typescript
const [isDark, setIsDark] = useState(() => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return document.documentElement.classList.contains('dark');
});

const toggleTheme = () => {
  const next = !isDark;
  setIsDark(next);
  document.documentElement.classList.toggle('dark', next);
  localStorage.setItem('theme', next ? 'dark' : 'light');
};
```

### Total changes: 11 files modified, 0 new files created

