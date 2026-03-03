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
        afterSignInUrl="/feed"
        afterSignUpUrl="/onboarding"
        appearance={{
          variables: {
            colorPrimary: "#7c3aed",
            colorBackground: "#09090b",
            colorText: "#fafafa",
            colorTextSecondary: "#a1a1aa",
            colorInputBackground: "#18181b",
            colorInputText: "#fafafa",
            borderRadius: "0.5rem",
          },
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#09090b] border border-zinc-800 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white",
            formFieldInput: "bg-zinc-900 border-zinc-700 text-white",
            formFieldLabel: "text-zinc-300",
            footerActionLink: "text-violet-400 hover:text-violet-300",
            identityPreviewEditButton: "text-violet-400",
            socialButtonsBlockButton: "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800",
            socialButtonsBlockButtonArrow: "text-zinc-400",
            socialButtonsProviderIcon: "[filter:invert(1)]",
            dividerLine: "bg-zinc-700",
            dividerText: "text-zinc-500",
          },
        }}
      />
    </div>
  );
}
