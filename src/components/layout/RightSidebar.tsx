import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-api';
import { Link } from 'react-router-dom';
import { Flame, DollarSign, Trophy } from 'lucide-react';
import { formatCost } from '@/lib/format';

export function RightSidebar() {
  const { user } = useAuth();
  const { data: profileData, isLoading } = useProfile(user?.username ?? '');

  return (
    <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-border p-4 gap-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {user ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Your Stats</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <span className="h-4 w-10 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-primary" /> Streak
              </span>
              <span className="font-mono font-semibold text-foreground">{profileData?.stats?.current_streak ?? 0}d</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-primary" /> Total
              </span>
              <span className="font-mono font-semibold text-foreground">{formatCost(profileData?.stats?.total_cost_usd ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-primary" /> Days
              </span>
              <span className="font-mono font-semibold text-foreground">{profileData?.stats?.total_days ?? 0}</span>
            </div>
          </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Sign in</Link> to see your stats
          </p>
        </div>
      )}
    </aside>
  );
}
