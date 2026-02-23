

# AWARTS -- Final Fixes and Feature Additions

## Remaining Bugs to Fix

### 1. Console Warning: StatsGrid and KudosButton ref errors
Both `StatsGrid` and `KudosButton` are function components that receive refs from `motion` wrappers but don't use `React.forwardRef`. This produces React warnings in the console.

**Fix**: Wrap both components with `React.forwardRef`.

### 2. Navbar search bar is non-functional
The search input in the Navbar doesn't navigate to `/search` or pass query params. It's a dead input.

**Fix**: Add `onKeyDown` handler that navigates to `/search?q=...` on Enter, and wire the Search page to read from URL params.

### 3. NotFound page uses `bg-muted` instead of `bg-background`
The 404 page has a mismatched background color compared to the rest of the app.

**Fix**: Change to `bg-background`.

### 4. `TODO` comment still in index.html
Line 6 has `<!-- TODO: Set the document title to the name of your application -->` -- should be removed since the title is already set.

**Fix**: Remove the comment.

### 5. Unused imports: `Menu` in Navbar, `useRef` in Feed
`Menu` icon is imported but never used in `Navbar.tsx`. `useRef` is imported but unused in `Feed.tsx`.

**Fix**: Remove unused imports.

---

## New Features to Add

### 1. Functional Navbar Search
Wire the Navbar search to navigate to `/search` with query, and have the Search page read from URL params to pre-populate.

### 2. Toast feedback for Follow/Unfollow and Kudos actions
- `FollowButton`: Show toast "Followed @user" / "Unfollowed @user"
- `KudosButton`: Show toast "Kudos sent!" / "Kudos removed"

### 3. Animated number counter on Landing page stats
The "2,847 developers" / "4.2B tokens" / "48 countries" stats should animate from 0 to their value using a simple counter effect.

### 4. Mobile hamburger menu on Landing page
The landing page nav has no mobile menu. Add a hamburger icon that toggles a mobile dropdown with Log In / Get Started links.

### 5. Keyboard shortcut: "/" to focus search
Press "/" anywhere to focus the Navbar search input -- a common dev-tool pattern.

### 6. Scroll-to-top on route change
When navigating between pages, scroll to top automatically.

### 7. Back to top button on Feed
Show a floating "back to top" button when scrolled down on the Feed page.

---

## Technical Implementation Details

### Files to modify:

| File | Changes |
|------|---------|
| `src/components/StatsGrid.tsx` | Wrap with `React.forwardRef` to fix console warning |
| `src/components/KudosButton.tsx` | Wrap with `React.forwardRef` to fix console warning |
| `src/components/FollowButton.tsx` | Add toast notifications for follow/unfollow |
| `src/components/layout/Navbar.tsx` | Remove unused `Menu` import, add search navigation on Enter, add "/" keyboard shortcut |
| `src/pages/Search.tsx` | Read initial query from URL search params |
| `src/pages/Feed.tsx` | Remove unused `useRef`, add scroll-to-top button |
| `src/pages/NotFound.tsx` | Fix background color to `bg-background` |
| `src/pages/Landing.tsx` | Add animated counter for stats, add mobile hamburger menu |
| `index.html` | Remove TODO comment |
| `src/App.tsx` | Add `ScrollToTop` component that scrolls to top on route change |

### Animated counter approach:
```typescript
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  // Animate from 0 to target using requestAnimationFrame
  // Triggered when element enters viewport via IntersectionObserver
}
```

### ScrollToTop component:
```typescript
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
```

### Total changes: 10 files modified, 0 new files created

