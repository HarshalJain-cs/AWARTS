import { useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { mockUsers, mockPosts, mockHeatmap, mockAchievements, currentUser } from '@/lib/mock-data';
import { ProviderChip } from '@/components/ProviderChip';
import { FollowButton } from '@/components/FollowButton';
import { ActivityCard } from '@/components/ActivityCard';
import { ContributionGraph } from '@/components/ContributionGraph';
import { AchievementBadge } from '@/components/AchievementBadge';
import { StatsGrid } from '@/components/StatsGrid';
import { formatCost, formatTokens, formatNumber } from '@/lib/format';
import { MapPin, Calendar, BadgeCheck, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const user = mockUsers.find((u) => u.username === username) || currentUser;
  const isOwn = user.id === currentUser.id;
  const userPosts = mockPosts.filter((p) => p.user.id === user.id);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6">
          <img src={user.avatar} alt={user.displayName} className="h-24 w-24 rounded-full border-2 border-border" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">@{user.username}</h1>
              {user.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground">{user.bio}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {user.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Joined {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span><strong className="text-foreground">{formatNumber(user.followers)}</strong> <span className="text-muted-foreground">followers</span></span>
              <span><strong className="text-foreground">{formatNumber(user.following)}</strong> <span className="text-muted-foreground">following</span></span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {user.providers.map((p) => <ProviderChip key={p} provider={p} />)}
            </div>
          </div>
          <div className="shrink-0">
            {isOwn ? (
              <Button variant="outline" size="sm" asChild><Link to="/settings">Edit Profile</Link></Button>
            ) : (
              <FollowButton isFollowing={user.isFollowing} />
            )}
          </div>
        </div>

        {/* Streak + Stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Flame className="h-5 w-5 text-primary" />
            {user.streak} day streak
          </div>
          <StatsGrid cost={user.totalSpend} inputTokens={Math.floor(user.totalTokens * 0.6)} outputTokens={Math.floor(user.totalTokens * 0.4)} sessions={Math.floor(user.totalSpend / 500)} />
        </div>

        {/* Contribution Graph */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Activity</h2>
          <ContributionGraph data={mockHeatmap} />
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {mockAchievements.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Posts</h2>
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map((p, i) => <ActivityCard key={p.id} post={p} index={i} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No posts yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
