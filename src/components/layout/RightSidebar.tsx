import { useAuth } from '@/context/AuthContext';
import { useProfile, useSuggestedUsers, useTopWeekly, useToggleFollow } from '@/hooks/use-api';
import { Link } from 'react-router-dom';
import { Flame, DollarSign, Trophy, ChevronRight, Target } from 'lucide-react';
import { formatCost } from '@/lib/format';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { transformLeaderboardEntry } from '@/lib/transformers';
import { motion } from 'framer-motion';

export function RightSidebar() {
  const { user, isSignedIn, isUserLoading } = useAuth();
  const { data: profileData, isLoading } = useProfile(user?.username ?? '');
  const { data: suggested } = useSuggestedUsers();
  const { data: topWeeklyData } = useTopWeekly();
  const toggleFollow = useToggleFollow();

  const topEntries = topWeeklyData?.entries
    ?.slice(0, 5)
    .map((e: any, i: number) => transformLeaderboardEntry(e, i + 1)) ?? [];

  return (
    <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-border p-4 gap-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Your Stats */}
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
      ) : (isSignedIn || isUserLoading) ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="h-4 w-16 bg-muted animate-pulse rounded" />
                <span className="h-4 w-10 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Sign in</Link> to see your stats
          </p>
        </div>
      )}

      {/* Suggested Friends */}
      {suggested && suggested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Suggested Friends</h3>
          <div className="space-y-2.5">
            {suggested.map((u: any) => (
              <div key={u._id} className="flex items-center gap-2">
                <Link to={`/u/${u.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.avatarUrl ?? ''} />
                    <AvatarFallback className="text-xs">{(u.displayName ?? u.username ?? '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">@{u.username}</p>
                    {u.bio && <p className="text-[10px] text-muted-foreground truncate">{u.bio}</p>}
                  </div>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 shrink-0"
                  disabled={toggleFollow.isPending}
                  onClick={() => toggleFollow.mutate({ targetUserId: u._id, isFollowing: false })}
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Challenge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-lg border border-border bg-card p-4 space-y-2"
      >
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Featured Challenge</h3>
        </div>
        <p className="text-sm font-bold text-foreground">The Three Comma Club</p>
        <p className="text-xs text-muted-foreground">First to one billion output tokens</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0 (&lt;0.01%)</span>
            <span>1B</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary/50" style={{ width: '0.01%' }} />
          </div>
        </div>
      </motion.div>

      {/* Top This Week */}
      {topEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Top This Week</h3>
          <div className="space-y-2">
            {topEntries.map((entry: any) => (
              <Link
                key={entry.user.id}
                to={`/u/${entry.user.username}`}
                className="flex items-center gap-2 group"
              >
                <span className="text-xs font-bold text-muted-foreground w-4 text-right">{entry.rank}</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={entry.user.avatar ?? ''} />
                  <AvatarFallback className="text-[10px]">{(entry.user.username ?? '?')[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground truncate flex-1 group-hover:text-primary transition-colors">@{entry.user.username}</span>
                <span className="text-xs font-mono font-semibold text-primary">{formatCost(entry.spend)}</span>
              </Link>
            ))}
          </div>
          <Link to="/leaderboard" className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
            View Full Leaderboard <ChevronRight className="h-3 w-3" />
          </Link>
        </motion.div>
      )}
    </aside>
  );
}
