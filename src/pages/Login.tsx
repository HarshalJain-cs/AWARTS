import { useNavigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { SEO } from '@/components/SEO';

export default function Login() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/feed", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Log In" description="Sign in to AWARTS to track your AI coding sessions, view your stats, and compete on leaderboards." canonical="/login" />
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/feed"
        signUpFallbackRedirectUrl="/onboarding"
        appearance={{
          variables: {
            colorPrimary: "hsl(18, 82%, 50%)",
            borderRadius: "0.5rem",
          },
          elements: {
            rootBox: "mx-auto",
            card: "bg-card border border-border shadow-xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
            formFieldInput: "bg-muted border-border text-foreground",
            formFieldLabel: "text-foreground",
            footerActionLink: "text-primary hover:text-primary/80",
            identityPreviewEditButton: "text-primary",
            socialButtonsBlockButton: "bg-muted border-border text-foreground hover:bg-muted/80",
            socialButtonsBlockButtonArrow: "text-muted-foreground",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
