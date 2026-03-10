import { useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-api';
import { ShareCard, type ShareTheme } from '@/components/ShareCard';
import { ShareActions } from '@/components/ShareActions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { transformHeatmap } from '@/lib/transformers';
import { cn } from '@/lib/utils';
import type { Provider } from '@/lib/types';
import { SEO } from '@/components/SEO';

export default function Recap() {
  return (
    <AuthGate>
      <RecapContent />
    </AuthGate>
  );
}

const THEMES: { id: ShareTheme; label: string; preview: string }[] = [
  { id: 'midnight', label: 'Midnight', preview: 'bg-gradient-to-br from-[#0f1219] to-[#1a1f2e]' },
  { id: 'frost', label: 'Frost', preview: 'bg-white border-2 border-gray-200' },
  { id: 'neon', label: 'Neon', preview: 'bg-gradient-to-br from-[#1a0533] via-[#0d1b3e] to-[#0a2540]' },
];

function RecapContent() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.username ?? '');
  const [period, setPeriod] = useState('month');
  const [theme, setTheme] = useState<ShareTheme>('midnight');
  const cardRef = useRef<HTMLDivElement>(null);

  if (isLoading || !profile) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  const username = profile.username ?? user?.username ?? '';
  const avatarUrl = profile.avatarUrl ?? user?.avatarUrl ?? '/placeholder.svg';
  const totalCost = profile.stats?.total_cost_usd ?? 0;
  const totalOutput = profile.stats?.total_output_tokens ?? 0;
  const streak = profile.stats?.current_streak ?? 0;
  const totalDays = profile.stats?.total_days ?? 0;
  const providers = (profile.providers_used ?? []) as Provider[];
  const heatmap = profile.heatmap ? transformHeatmap(profile.heatmap) : [];
  const hasData = totalCost > 0 || totalDays > 0;

  return (
    <AppShell>
      <SEO title="Share Your Stats" description="Generate a beautiful share card of your AI coding stats." noindex />
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">Share Your Stats</h1>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!hasData && (
          <div className="text-center py-8 text-muted-foreground rounded-lg border border-border bg-card p-6">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No session data yet</p>
            <p className="text-sm mt-1">Push sessions with the CLI to generate your share card.</p>
            <code className="block mt-3 text-xs font-mono text-foreground bg-muted/50 rounded px-3 py-2 max-w-xs mx-auto">npx awarts@latest sync</code>
          </div>
        )}

        {/* Theme picker */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Theme</p>
          <div className="flex gap-3" aria-label="Theme selector" role="group">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  theme === t.id
                    ? 'ring-2 ring-primary bg-muted'
                    : 'bg-muted/50 hover:bg-muted'
                )}
              >
                <div className={cn('h-4 w-4 rounded-full', t.preview)} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card preview */}
        <div className="flex justify-center overflow-x-auto py-4">
          <ShareCard
            ref={cardRef}
            username={username}
            avatarUrl={avatarUrl}
            period={period}
            totalCost={totalCost}
            outputTokens={totalOutput}
            streak={streak}
            daysActive={totalDays}
            providers={providers}
            heatmap={heatmap}
            theme={theme}
          />
        </div>

        {/* Export actions */}
        <ShareActions cardRef={cardRef} username={username} stats={{ totalCost, totalDays, streak }} />
      </div>
    </AppShell>
  );
}
