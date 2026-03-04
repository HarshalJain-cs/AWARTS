import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ConvexAuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const Landing = lazy(() => import("./pages/Landing"));
const Feed = lazy(() => import("./pages/Feed"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Search = lazy(() => import("./pages/Search"));
const Profile = lazy(() => import("./pages/Profile"));
const Follows = lazy(() => import("./pages/Follows"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const PostNew = lazy(() => import("./pages/PostNew"));
const Settings = lazy(() => import("./pages/Settings"));
const Recap = lazy(() => import("./pages/Recap"));
const Prompts = lazy(() => import("./pages/Prompts"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Docs = lazy(() => import("./pages/Docs"));
const Login = lazy(() => import("./pages/Login"));
const CLIVerify = lazy(() => import("./pages/CLIVerify"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const App = () => (
  <HelmetProvider>
  <ConvexAuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
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
        </Suspense>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </TooltipProvider>
  </ConvexAuthProvider>
  </HelmetProvider>
);

export default App;
