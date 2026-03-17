import { useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useWeeklyStats } from '@/hooks/use-api';
import { ShareCard } from '@/components/ShareCard';
import { ShareActions } from '@/components/ShareActions';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCost, formatTokens } from '@/lib/format';
import { transformHeatmap } from '@/lib/transformers';
import { cn } from '@/lib/utils';
import type { Provider } from '@/lib/types';
import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';

export default function Recap() {
  return (
    <AuthGate>
      <RecapContent />
    </AuthGate>
  );
}

export const GRADIENTS = [
  { id: 'amber', label: 'Amber', style: 'linear-gradient(135deg, #F59E0B, #EA580C)', dark: false },
  { id: 'coral', label: 'Coral', style: 'linear-gradient(135deg, #F43F5E, #E11D48)', dark: true },
  { id: 'crimson', label: 'Crimson', style: 'linear-gradient(135deg, #991B1B, #7F1D1D)', dark: true },
  { id: 'teal', label: 'Teal', style: 'linear-gradient(135deg, #14B8A6, #0891B2)', dark: false },
  { id: 'mocha', label: 'Mocha', style: 'linear-gradient(135deg, #78716C, #44403C)', dark: true },
  { id: 'purple', label: 'Purple', style: 'linear-gradient(135deg, #A855F7, #7C3AED)', dark: true },
  { id: 'sunset', label: 'Sunset', style: 'linear-gradient(135deg, #F59E0B, #F97316, #EF4444)', dark: false },
  { id: 'charcoal', label: 'Charcoal', style: 'linear-gradient(135deg, #1F2937, #111827)', dark: true },
  { id: 'peach', label: 'Peach', style: 'linear-gradient(135deg, #FDA4AF, #FBBF24)', dark: false },
  { id: 'midnight', label: 'Midnight', style: 'linear-gradient(135deg, #0f1219, #1a1f2e)', dark: true },
];

const PROVIDER_NAMES: Record<string, string> = {
  claude: 'Claude',
  codex: 'Codex',
  gemini: 'Gemini',
  antigravity: 'Antigravity',
};

function RecapContent() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.username ?? '');
  const weeklyStats = useWeeklyStats();
  const [period, setPeriod] = useState('week');
  const [gradientId, setGradientId] = useState('amber');
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
  const posts = profile.stats?.posts ?? 0;

  const gradient = GRADIENTS.find((g) => g.id === gradientId) ?? GRADIENTS[0];

  return (
    <AppShell>
      <SEO title="Recap" description="Generate a beautiful share card of your AI coding stats." noindex />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Header controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">Recap</h1>
        </div>

        {/* Weekly stats summary */}
        {weeklyStats.data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cost', value: formatCost(weeklyStats.data.totalCost) },
              { label: 'Tokens', value: formatTokens(weeklyStats.data.totalTokens) },
              { label: 'Active Days', value: `${weeklyStats.data.activeDays}/7` },
              { label: 'Streak', value: `${weeklyStats.data.streak}d` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Period toggle pills */}
        <div className="flex gap-2">
          {['week', 'month', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full border transition-all',
                period === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {!hasData && (
          <div className="text-center py-8 text-muted-foreground rounded-lg border border-border bg-card p-6">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No session data yet</p>
            <p className="text-sm mt-1">Push sessions with the CLI to generate your share card.</p>
            <code className="block mt-3 text-xs font-mono text-foreground bg-muted/50 rounded px-3 py-2 max-w-xs mx-auto">npx awarts@latest sync</code>
          </div>
        )}

        {/* Gradient picker */}
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Background</p>
          <div className="flex gap-2 flex-wrap">
            {GRADIENTS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGradientId(g.id)}
                className={cn(
                  'h-10 w-10 rounded-lg transition-all duration-200 hover:scale-110',
                  gradientId === g.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''
                )}
                style={{ background: g.style }}
                title={g.label}
              />
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
            gradient={gradient}
            sessions={posts}
          />
        </div>

        {/* Export actions */}
        <ShareActions cardRef={cardRef} username={username} avatarUrl={avatarUrl} providers={providers} stats={{ totalCost, totalDays, streak }} />
      </motion.div>
    </AppShell>
  );
}
