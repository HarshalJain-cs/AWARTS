import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useProfile, useUserPosts } from '@/hooks/use-api';
import { useAuth } from '@/context/AuthContext';
import { transformUser, transformHeatmap, transformAchievement, transformFeedPost } from '@/lib/transformers';
import { ProviderChip } from '@/components/ProviderChip';
import { FollowButton } from '@/components/FollowButton';
import { ContributionGraph } from '@/components/ContributionGraph';
import { AchievementBadge } from '@/components/AchievementBadge';
import { StatsGrid } from '@/components/StatsGrid';
import { ActivityCard } from '@/components/ActivityCard';
import { SkeletonProfile } from '@/components/SkeletonProfile';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { formatNumber } from '@/lib/format';
import { MapPin, Calendar, BadgeCheck, Flame, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();
  const { data: raw, isLoading } = useProfile(username ?? '');
  const { data: postsData, isLoading: postsLoading } = useUserPosts(username ?? '');

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <SkeletonProfile />
        </div>
      </AppShell>
    );
  }

  if (!raw) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto">
          <ErrorState message="Profile not found." />
        </div>
      </AppShell>
    );
  }

  // Private profile check
  if (raw.isPublic === false && !raw.isOwnProfile) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h2 className="text-xl font-bold text-foreground">This profile is private</h2>
          <p className="text-muted-foreground">@{raw.username} has set their profile to private.</p>
        </div>
      </AppShell>
    );
  }

  const user = transformUser(raw);
  const isOwn = raw.isOwnProfile ?? (authUser ? raw._id === authUser._id : false);
  const heatmap = raw.heatmap ? transformHeatmap(raw.heatmap) : [];
  const achievements = (raw.achievements ?? []).map(transformAchievement);
  const posts = postsData?.pages.flatMap((page) => page.posts.map(transformFeedPost)) ?? [];

  const totalInput = raw.stats?.total_input_tokens ?? 0;
  const totalOutput = raw.stats?.total_output_tokens ?? 0;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6">
          <img src={user.avatar || '/placeholder.svg'} alt={user.displayName} className="h-24 w-24 rounded-full border-2 border-border object-cover" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">@{user.username}</h1>
              {user.displayName && user.displayName !== user.username && (
                <span className="text-sm text-muted-foreground">{user.displayName}</span>
              )}
              {user.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {user.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>
              )}
              {user.joinDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            {/* Clickable followers/following + activities count */}
            <div className="flex gap-4 text-sm">
              <Link to={`/u/${user.username}/follows`} className="hover:underline">
                <strong className="text-foreground">{formatNumber(user.followers)}</strong>{' '}
                <span className="text-muted-foreground">followers</span>
              </Link>
              <Link to={`/u/${user.username}/follows`} className="hover:underline">
                <strong className="text-foreground">{formatNumber(user.following)}</strong>{' '}
                <span className="text-muted-foreground">following</span>
              </Link>
              <span>
                <strong className="text-foreground">{raw.stats?.posts ?? posts.length}</strong>{' '}
                <span className="text-muted-foreground">activities</span>
              </span>
            </div>
            {user.providers.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {user.providers.map((p) => <ProviderChip key={p} provider={p} />)}
              </div>
            )}
          </div>
          <div className="shrink-0">
            {isOwn ? (
              <Button variant="outline" size="sm" asChild><Link to="/settings">Edit Profile</Link></Button>
            ) : (
              <FollowButton targetUserId={raw._id} isFollowing={raw.isFollowing} username={user.username} />
            )}
          </div>
        </div>

        {/* Streak + Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Flame className="h-5 w-5 text-primary" />
            {raw.stats?.current_streak ?? 0} day streak
          </div>
          <StatsGrid
            cost={raw.stats?.total_cost_usd ?? 0}
            inputTokens={totalInput}
            outputTokens={totalOutput}
            sessions={raw.stats?.total_days ?? 0}
          />
        </div>

        {/* Contribution Graph */}
        {heatmap.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Activity</h2>
            <ContributionGraph data={heatmap} />
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {achievements.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Posts</h2>
          {postsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((p, i) => <ActivityCard key={p.id} post={p} index={i} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No posts yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
