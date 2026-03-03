import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { ErrorState } from '@/components/ErrorState';
import { useLeaderboard } from '@/hooks/use-api';
import { transformLeaderboardEntry } from '@/lib/transformers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

const periodMap: Record<string, string> = {
  today: 'daily',
  week: 'weekly',
  month: 'monthly',
  all: 'all_time',
};

export default function Leaderboard() {
  const [period, setPeriod] = useState('all');
  const [region, setRegion] = useState('global');
  const [provider, setProvider] = useState('all');

  const apiPeriod = periodMap[period] ?? 'all_time';
  const apiProvider = provider === 'all' ? undefined : provider;
  const apiRegion = region === 'global' ? undefined : region;

  const { data, isLoading, error } = useLeaderboard(apiPeriod, apiProvider, apiRegion);
  const isError = !!error;

  const entries = data?.entries.map((e, i) => transformLeaderboardEntry(e, i + 1)) ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>

        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="north_america">North America</SelectItem>
              <SelectItem value="south_america">South America</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="asia">Asia</SelectItem>
              <SelectItem value="africa">Africa</SelectItem>
              <SelectItem value="oceania">Oceania</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="codex">Codex</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="antigravity">Antigravity</SelectItem>
            </SelectContent>
          </Select>
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
      </div>
    </AppShell>
  );
}
