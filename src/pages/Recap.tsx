import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-api';
import { formatCost, formatTokens } from '@/lib/format';
import { ProviderChip } from '@/components/ProviderChip';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import type { Provider } from '@/lib/types';
import { SEO } from '@/components/SEO';

export default function Recap() {
  return (
    <AuthGate>
      <RecapContent />
    </AuthGate>
  );
}

function RecapContent() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.username ?? '');
  const [period, setPeriod] = useState('month');

  if (isLoading || !profile) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  const username = profile.username ?? user?.username ?? '';
  const avatarUrl = profile.avatarUrl ?? user?.avatarUrl ?? '/placeholder.svg';
  const totalCost = profile.stats?.total_cost_usd ?? 0;
  const streak = profile.stats?.current_streak ?? 0;
  const totalDays = profile.stats?.total_days ?? 0;
  const providers = (profile.providers_used ?? []) as Provider[];
  const hasData = totalCost > 0 || totalDays > 0;

  return (
    <AppShell>
      <SEO title="Your Recap" description="View your personal AI coding recap card — stats, streaks, providers, and more." noindex />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Your Recap</h1>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
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
            <p className="text-sm mt-1">Push sessions with the CLI to generate your recap card.</p>
            <code className="block mt-3 text-xs font-mono text-foreground bg-muted/50 rounded px-3 py-2 max-w-xs mx-auto">npx awarts@latest sync</code>
          </div>
        )}

        {/* Recap card preview */}
        <div className="rounded-xl bg-gradient-to-br from-[hsl(224,25%,8%)] to-[hsl(224,25%,14%)] border border-border p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-4 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono text-sm font-bold text-foreground">AWARTS RECAP</span>
          </div>

          <div className="flex items-center gap-3">
            <img src={avatarUrl} alt={username} className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-foreground">@{username}</p>
              <p className="text-xs text-muted-foreground capitalize">{period === 'all' ? 'All Time' : `This ${period}`}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Spend</p>
              <p className="font-mono text-xl font-bold text-foreground">{formatCost(totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Days Active</p>
              <p className="font-mono text-xl font-bold text-foreground">{profile.stats?.total_days ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
              <p className="font-mono text-xl font-bold text-foreground">🔥 {streak}d</p>
            </div>
          </div>

          {providers.length > 0 && (
            <div className="flex gap-2">
              {providers.map((p) => <ProviderChip key={p} provider={p} size="md" />)}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toast({ title: 'Coming soon', description: 'Image export will be available in a future update.' })}
          >
            <Download className="h-4 w-4 mr-2" /> OG (1200x630)
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toast({ title: 'Coming soon', description: 'Image export will be available in a future update.' })}
          >
            <Download className="h-4 w-4 mr-2" /> Square (1080x1080)
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
