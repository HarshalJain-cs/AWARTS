import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useFollowers, useFollowing } from '@/hooks/use-api';
import { transformUser } from '@/lib/transformers';
import { FollowButton } from '@/components/FollowButton';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ErrorState';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { SEO } from '@/components/SEO';

const tabs = ['Followers', 'Following'] as const;

export default function Follows() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Followers');

  const { data: followersData, isLoading: loadingFollowers, error: followersError } =
    useFollowers(username ?? '');
  const { data: followingData, isLoading: loadingFollowing, error: followingError } =
    useFollowing(username ?? '');

  const isLoading = activeTab === 'Followers' ? loadingFollowers : loadingFollowing;
  const isError = activeTab === 'Followers' ? !!followersError : !!followingError;
  const rawUsers = activeTab === 'Followers' ? (followersData?.users ?? []) : (followingData?.users ?? []);
  const users = rawUsers.map(transformUser);

  return (
    <AppShell>
      <SEO title={`@${username} — Followers & Following`} description={`See who @${username} follows and who follows them on AWARTS.`} canonical={`/u/${username}/follows`} noindex />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to={`/u/${username}`} className="text-lg font-bold text-foreground hover:underline">
            @{username}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border">
          {([
            { label: 'Followers', count: followersData?.users.length ?? 0 },
            { label: 'Following', count: followingData?.users.length ?? 0 },
          ] as const).map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label as typeof activeTab)}
              className={cn(
                'pb-3 text-sm font-medium transition-colors relative',
                activeTab === tab.label ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label} {!loadingFollowers && !loadingFollowing && <span className="text-muted-foreground">({tab.count})</span>}
              {activeTab === tab.label && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={`Failed to load ${activeTab.toLowerCase()}.`} onRetry={() => window.location.reload()} />
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {activeTab === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
            <p className="text-sm mt-1">
              {activeTab === 'Followers'
                ? 'When people follow this profile, they\'ll appear here.'
                : 'Profiles followed by this user will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 py-3">
                <Link to={`/u/${user.username}`}>
                  <img src={user.avatar || '/placeholder.svg'} alt={user.username} className="h-10 w-10 rounded-full" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/u/${user.username}`} className="text-sm font-semibold text-foreground hover:underline">
                    @{user.username}
                  </Link>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                  )}
                </div>
                <FollowButton
                  targetUserId={user.id}
                  isFollowing={user.isFollowing}
                  username={user.username}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
