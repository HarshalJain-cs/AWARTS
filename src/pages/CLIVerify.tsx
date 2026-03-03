import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Terminal } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function CLIVerify() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const { user, isSignedIn } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const verifyCLI = useMutation(api.cliAuth.verifyCLIAuth);

  const handleAuthorize = async () => {
    if (!isSignedIn) return;
    setStatus('loading');
    try {
      await verifyCLI({ code });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <SEO title="Authorize CLI" description="Authorize the AWARTS CLI to access your account." noindex />
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-6 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
          <span className="font-mono text-xl font-bold text-foreground">AWARTS</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <Terminal className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-xl font-bold text-foreground">Authorize CLI</h1>
          <p className="text-sm text-muted-foreground">
            The AWARTS CLI is requesting access to your account.
          </p>

          {code && (
            <div className="rounded-md bg-muted/50 px-4 py-3 font-mono text-lg font-bold tracking-widest text-foreground">
              {code}
            </div>
          )}

          {!isSignedIn ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">You need to sign in first.</p>
              <Button asChild className="w-full">
                <a href={`/login?next=${encodeURIComponent(`/cli/verify?code=${code}`)}`}>Sign In</a>
              </Button>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-2">
              <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">CLI authorized!</p>
              <p className="text-xs text-muted-foreground">You can close this window and return to your terminal.</p>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">Authorization failed. The code may have expired.</p>
              <Button variant="outline" onClick={() => setStatus('idle')}>Try Again</Button>
            </div>
          ) : (
            <Button onClick={handleAuthorize} disabled={!code || status === 'loading'} className="w-full">
              {status === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Authorizing...</>
              ) : (
                'Authorize CLI'
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Only authorize if you initiated this from your terminal.
        </p>
      </div>
    </div>
  );
}
