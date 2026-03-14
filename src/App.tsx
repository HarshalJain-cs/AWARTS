import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import { ConvexAuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

// Retry wrapper for lazy imports — handles stale chunk 404s after new deploys
function lazyRetry<T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>
): React.LazyExoticComponent<T["default"]> {
  return lazy(() =>
    factory().catch((err) => {
      // If a chunk fails to load (404 after deploy), reload once to get fresh HTML
      const key = "chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise<T>(() => { }); // never resolves, page is reloading
      }
      sessionStorage.removeItem(key);
      throw err;
    })
  );
}

const Landing = lazyRetry(() => import("./pages/Landing"));
const Feed = lazyRetry(() => import("./pages/Feed"));
const Leaderboard = lazyRetry(() => import("./pages/Leaderboard"));
const Search = lazyRetry(() => import("./pages/Search"));
const Profile = lazyRetry(() => import("./pages/Profile"));
const Follows = lazyRetry(() => import("./pages/Follows"));
const PostDetail = lazyRetry(() => import("./pages/PostDetail"));
const PostNew = lazyRetry(() => import("./pages/PostNew"));
const Settings = lazyRetry(() => import("./pages/Settings"));
const Recap = lazyRetry(() => import("./pages/Recap"));
const Prompts = lazyRetry(() => import("./pages/Prompts"));
const Notifications = lazyRetry(() => import("./pages/Notifications"));
const Onboarding = lazyRetry(() => import("./pages/Onboarding"));
const Docs = lazyRetry(() => import("./pages/Docs"));
const Login = lazyRetry(() => import("./pages/Login"));
const CLIVerify = lazyRetry(() => import("./pages/CLIVerify"));
const Privacy = lazyRetry(() => import("./pages/Privacy"));
const Terms = lazyRetry(() => import("./pages/Terms"));
const AuthCallback = lazyRetry(() => import("./pages/AuthCallback"));
const Messages = lazyRetry(() => import("./pages/Messages"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="page-enter">{children}</div>;
}

const App = () => (
  <HelmetProvider>
    <ConvexAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SmoothScroll>
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/u/:username" element={<Profile />} />
                    <Route path="/u/:username/follows" element={<Follows />} />
                    <Route path="/post/new" element={<PostNew />} />
                    <Route path="/post/:id" element={<PostDetail />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/recap" element={<Recap />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/prompts" element={<Prompts />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cli/verify" element={<CLIVerify />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          </SmoothScroll>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </TooltipProvider>
    </ConvexAuthProvider>
  </HelmetProvider>
);

export default App;
