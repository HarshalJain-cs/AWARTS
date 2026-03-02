import { LeaderboardEntry } from '@/lib/types';
import { ProviderChip } from './ProviderChip';
import { formatCost, formatTokens } from '@/lib/format';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { COUNTRIES, PROVIDERS } from '@/lib/constants';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const { user } = useAuth();
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground w-16">#</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Spend</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Tokens</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isMe = user ? entry.user.id === user.id : false;
              const flag = COUNTRIES.find((c) => c.code === entry.user.countryCode)?.flag;
              return (
                <tr
                  key={entry.user.id}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors hover:bg-muted/20',
                    isMe && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <td className="py-3 px-4 font-mono font-bold">
                    {medals[entry.rank] || entry.rank}
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/u/${entry.user.username}`} className="flex items-center gap-2.5">
                      <img src={entry.user.avatar} alt="" className="h-8 w-8 rounded-full" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">@{entry.user.username}</span>
                          {flag && <span className="text-xs">{flag}</span>}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {entry.providers.map((p) => (
                            <span key={p} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROVIDERS[p].color }} />
                          ))}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right font-mono hidden sm:table-cell">{formatCost(entry.spend)}</td>
                  <td className="py-3 px-4 text-right font-mono hidden md:table-cell">{formatTokens(entry.tokens)}</td>
                  <td className="py-3 px-4 text-right font-mono">🔥 {entry.streak}d</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
