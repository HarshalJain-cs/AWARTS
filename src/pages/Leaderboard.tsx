import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { ErrorState } from '@/components/ErrorState';
import { useLeaderboard } from '@/hooks/use-api';
import { transformLeaderboardEntry } from '@/lib/transformers';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const PERIODS = [
  { key: 'today', label: 'Day', api: 'daily' },
  { key: 'week', label: 'Week', api: 'weekly' },
  { key: 'month', label: 'Month', api: 'monthly' },
  { key: 'all', label: 'All Time', api: 'all_time' },
] as const;

const REGIONS = [
  { key: 'global', label: 'Global' },
  { key: 'north_america', label: 'N. America' },
  { key: 'south_america', label: 'S. America' },
  { key: 'europe', label: 'Europe' },
  { key: 'asia', label: 'Asia' },
  { key: 'africa', label: 'Africa' },
  { key: 'oceania', label: 'Oceania' },
] as const;

export default function Leaderboard() {
  const [period, setPeriod] = useState('week');
  const [region, setRegion] = useState('global');

  const apiPeriod = PERIODS.find((p) => p.key === period)?.api ?? 'weekly';
  const apiRegion = region === 'global' ? undefined : region;

  const { data, isLoading, error } = useLeaderboard(apiPeriod, undefined, apiRegion);
  const isError = !!error;

  const entries = data?.entries.map((e: any, i: number) => transformLeaderboardEntry(e, i + 1)) ?? [];

  return (
    <AppShell>
      <SEO title="Leaderboard — Top AI Coders" description="See who's writing the most AI-assisted code. Global leaderboard ranked by output tokens across Claude, Codex, Gemini, and Antigravity." canonical="/leaderboard" keywords="AI coding leaderboard, top developers, Claude leaderboard, Codex ranking, developer competition" jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", "name": "AI Coding Leaderboard", "description": "Top AI-assisted developers ranked by usage", "url": "https://awarts.vercel.app/leaderboard" }} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-5"
      >
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>

        {/* Time period tabs */}
        <div className="flex gap-1 border-b border-border">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                period === p.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
              {period === p.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Region filter chips */}
        <div className="flex gap-2 flex-wrap">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRegion(r.key)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full border transition-all',
                region === r.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load leaderboard." onRetry={() => window.location.reload()} />
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No entries yet</p>
            <p className="text-sm mt-1">Be the first on the board!</p>
          </div>
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </motion.div>
    </AppShell>
  );
}
