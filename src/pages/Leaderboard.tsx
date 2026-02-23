import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { mockLeaderboard } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants';

export default function Leaderboard() {
  const [period, setPeriod] = useState('all');
  const [region, setRegion] = useState('global');
  const [provider, setProvider] = useState('all');

  let filtered = [...mockLeaderboard];
  if (region !== 'global') {
    filtered = filtered.filter((e) => e.user.countryCode === region);
  }
  if (provider !== 'all') {
    filtered = filtered.filter((e) => e.providers.includes(provider as any));
  }
  filtered = filtered.map((e, i) => ({ ...e, rank: i + 1 }));

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
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">🌍 Global</SelectItem>
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

        <LeaderboardTable entries={filtered} />
      </div>
    </AppShell>
  );
}
