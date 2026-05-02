import { useNavigate } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo } from "react";
import { SEO } from '@/components/SEO';
import { toast } from '@/hooks/use-toast';

/** Read a CSS variable from :root and convert HSL triplet to a full hsl() string */
function getCssHsl(varName: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return raw ? `hsl(${raw})` : '';
}

function useClerkTheme() {
  const isDark = document.documentElement.classList.contains('dark');

  return useMemo(() => ({
    variables: {
      colorPrimary: getCssHsl('--primary'),
      colorBackground: getCssHsl('--card'),
      colorText: getCssHsl('--card-foreground'),
      colorTextSecondary: getCssHsl('--muted-foreground'),
      colorInputBackground: getCssHsl('--muted'),
      colorInputText: getCssHsl('--card-foreground'),
      colorDanger: getCssHsl('--destructive'),
      borderRadius: '0.5rem',
    },
    elements: {
      rootBox: 'mx-auto',
      card: {
        backgroundColor: getCssHsl('--card'),
        border: `1px solid ${getCssHsl('--border')}`,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      },
      formButtonPrimary: {
        backgroundColor: getCssHsl('--primary'),
        color: getCssHsl('--primary-foreground'),
      },
      formFieldInput: {
        backgroundColor: getCssHsl('--muted'),
        borderColor: getCssHsl('--border'),
        color: getCssHsl('--card-foreground'),
      },
      footerActionLink: { color: getCssHsl('--primary') },
      identityPreviewEditButton: { color: getCssHsl('--primary') },
      socialButtonsBlockButton: {
        backgroundColor: getCssHsl('--muted'),
        borderColor: getCssHsl('--border'),
        color: getCssHsl('--card-foreground'),
      },
      dividerLine: { backgroundColor: getCssHsl('--border') },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isDark]);
}

export default function Login() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const clerkAppearance = useClerkTheme();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      toast({ title: 'You are already logged in!', description: 'Redirecting to your feed...' });
      navigate("/feed", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Log In" description="Sign in to AWARTS to track your AI coding sessions, view your stats, and compete on leaderboards." canonical="/login" />
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-6 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono text-2xl font-bold text-foreground">AWARTS</span>
          </div>
          <p className="text-sm text-muted-foreground">Strava for AI Coding</p>
        </div>

        <SignIn
          routing="hash"
          fallbackRedirectUrl="/feed"
          signUpFallbackRedirectUrl="/onboarding"
          appearance={clerkAppearance}
        />

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
          <div className="space-y-1">
            <div className="text-lg">📊</div>
            <p>Track sessions</p>
          </div>
          <div className="space-y-1">
            <div className="text-lg">🏆</div>
            <p>Leaderboards</p>
          </div>
          <div className="space-y-1">
            <div className="text-lg">🔥</div>
            <p>Streaks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
