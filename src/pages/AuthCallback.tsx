import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AUTH_TIMEOUT_MS = 15000;

// With Clerk, auth callbacks are handled automatically.
// This page just redirects signed-in users to /feed.
export default function AuthCallback() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      // Redirect to onboarding if user doesn't have a country set (incomplete setup)
      const needsOnboarding = !user?.country;
      navigate(needsOnboarding ? "/onboarding" : "/feed", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  // Timeout fallback — if auth takes too long, show error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) setTimedOut(true);
    }, AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <p className="text-lg font-semibold text-foreground">Authentication is taking too long</p>
          <p className="text-sm text-muted-foreground">
            There may be a connectivity issue. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" aria-label="Signing in" role="status" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
