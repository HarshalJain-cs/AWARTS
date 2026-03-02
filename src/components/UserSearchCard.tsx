import { User } from '@/lib/types';
import { Link } from 'react-router-dom';
import { ProviderChip } from './ProviderChip';
import { FollowButton } from './FollowButton';
import { Users } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface UserSearchCardProps {
  user: User;
}

export function UserSearchCard({ user }: UserSearchCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Link to={`/u/${user.username}`}>
        <img src={user.avatar} alt={user.displayName} className="h-12 w-12 rounded-full" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/u/${user.username}`} className="font-semibold text-foreground hover:underline">
          @{user.username}
        </Link>
        <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {formatNumber(user.followers)}
          </span>
          <div className="flex gap-1">
            {user.providers.map((p) => (
              <ProviderChip key={p} provider={p} size="sm" />
            ))}
          </div>
        </div>
      </div>
      <FollowButton targetUserId={user.id} isFollowing={user.isFollowing} username={user.username} />
    </div>
  );
}
