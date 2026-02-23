import { mockUsers, currentUser } from '@/lib/mock-data';
import { FollowButton } from '@/components/FollowButton';
import { Link } from 'react-router-dom';
import { Flame, DollarSign, Trophy } from 'lucide-react';
import { formatCost } from '@/lib/format';

const suggestions = mockUsers.filter((u) => u.id !== currentUser.id && !u.isFollowing).slice(0, 3);

export function RightSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-border p-4 gap-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Quick stats */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Your Stats</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" /> Streak
            </span>
            <span className="font-mono font-semibold text-foreground">{currentUser.streak}d</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 text-primary" /> This month
            </span>
            <span className="font-mono font-semibold text-foreground">{formatCost(currentUser.totalSpend / 6)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-primary" /> Rank
            </span>
            <span className="font-mono font-semibold text-foreground">#4</span>
          </div>
        </div>
      </div>

      {/* Who to follow */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Who to follow</h3>
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center gap-2.5">
            <Link to={`/u/${user.username}`}>
              <img src={user.avatar} alt={user.displayName} className="h-9 w-9 rounded-full" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/u/${user.username}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                @{user.username}
              </Link>
              <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
            </div>
            <FollowButton isFollowing={user.isFollowing} size="sm" />
          </div>
        ))}
      </div>
    </aside>
  );
}
