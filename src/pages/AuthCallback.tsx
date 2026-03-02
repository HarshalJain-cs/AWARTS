import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// With Clerk, auth callbacks are handled automatically.
// This page just redirects signed-in users to /feed.
export default function AuthCallback() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      navigate(user?.username ? "/feed" : "/onboarding", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
