import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase detects the tokens in the URL hash automatically
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_failed', { replace: true });
        return;
      }

      if (session) {
        navigate('/feed', { replace: true });
      } else {
        // Token exchange may still be in progress, wait a moment
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          navigate(retrySession ? '/feed' : '/login', { replace: true });
        }, 1000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
