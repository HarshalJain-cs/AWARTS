import { LeaderboardEntry } from '@/lib/types';
import { formatCost, formatTokens } from '@/lib/format';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { COUNTRIES, PROVIDERS } from '@/lib/constants';
import { motion } from 'framer-motion';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold" style={{ background: '#FFD700', color: '#1a1a1a' }}>
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold" style={{ background: '#C0C0C0', color: '#1a1a1a' }}>
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold" style={{ background: '#CD7F32', color: '#fff' }}>
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold bg-primary/10 text-primary">
      {rank}
    </span>
  );
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const { user } = useAuth();
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-semibold text-xs tracking-wider uppercase text-muted-foreground w-16">Rank</th>
              <th className="text-left py-3 px-4 font-semibold text-xs tracking-wider uppercase text-muted-foreground">User</th>
              <th className="text-right py-3 px-4 font-semibold text-xs tracking-wider uppercase text-muted-foreground hidden sm:table-cell">Cost</th>
              <th className="text-right py-3 px-4 font-semibold text-xs tracking-wider uppercase text-muted-foreground hidden md:table-cell">Output</th>
              <th className="text-right py-3 px-4 font-semibold text-xs tracking-wider uppercase text-muted-foreground">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isMe = user ? entry.user.id === (user as any)._id : false;
              const country = COUNTRIES.find((c) => c.code === entry.user.countryCode);
              return (
                <motion.tr
                  key={entry.user.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={cn(
                    'border-b border-border last:border-0 transition-all duration-200 hover:bg-muted/30 hover:shadow-sm',
                    isMe && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <td className="py-3 px-4">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/u/${entry.user.username}`} className="flex items-center gap-2.5">
                      <img src={entry.user.avatar} alt="" className="h-8 w-8 rounded-full" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground truncate">@{entry.user.username}</span>
                          {country && (
                            <span className="text-xs text-muted-foreground">{country.flag} {country.code}</span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {entry.providers.map((p) => (
                            <span key={p} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PROVIDERS[p]?.color }} />
                          ))}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-primary hidden sm:table-cell">{formatCost(entry.spend)}</td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground hidden md:table-cell">{formatTokens(entry.tokens)}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {entry.streak > 0 ? `${entry.streak}d` : <span className="text-muted-foreground">-</span>}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
