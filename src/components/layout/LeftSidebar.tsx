import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Search, User, Settings, Upload, BarChart3, BookOpen, Bell, PlusCircle, Lightbulb, MessageSquare, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useUnreadMessageCount } from '@/hooks/use-api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatTokens } from '@/lib/format';
import { PROVIDERS } from '@/lib/constants';
import type { Provider } from '@/lib/types';

export function LeftSidebar() {
  const location = useLocation();
  const { user, isSignedIn } = useAuth();
  const { data: profileData } = useProfile(user?.username ?? '');
  const unreadMessages = useUnreadMessageCount(!isSignedIn);

  const navItems = [
    { label: 'Feed', icon: Home, href: '/feed' },
    { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
    { label: 'Search', icon: Search, href: '/search' },
    { label: 'Messages', icon: MessageSquare, href: '/messages', badge: unreadMessages > 0 ? unreadMessages : undefined },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'New Post', icon: PlusCircle, href: '/post/new' },
    { label: 'My Profile', icon: User, href: user ? `/u/${user.username}` : isSignedIn ? '#' : '/login' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Import Data', icon: Upload, href: '/settings' },
    { label: 'My Recap', icon: BarChart3, href: '/recap' },
    { label: 'Prompts', icon: Lightbulb, href: '/prompts' },
    { label: 'Docs', icon: BookOpen, href: '/docs' },
  ];

  // Calculate provider usage breakdown from profile
  const providers = (profileData?.providers_used ?? []) as Provider[];
  const totalOutput = profileData?.stats?.total_output_tokens ?? 0;

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-border p-4 gap-1 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Profile mini-card */}
      {isSignedIn && user && (
        <div className="mb-3 pb-3 border-b border-border">
          <Link to={`/u/${user.username}`} className="flex items-center gap-2.5 group">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl ?? ''} />
              <AvatarFallback>{(user.displayName ?? user.username ?? '?')[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{user.displayName || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </Link>

          {profileData && (
            <>
              {/* Stats row */}
              <div className="flex gap-3 mt-2 text-xs">
                <Link to={`/u/${user.username}/follows`} className="hover:text-primary transition-colors">
                  <span className="font-semibold text-foreground">{profileData.stats?.following ?? 0}</span>{' '}
                  <span className="text-muted-foreground">Following</span>
                </Link>
                <Link to={`/u/${user.username}/follows`} className="hover:text-primary transition-colors">
                  <span className="font-semibold text-foreground">{profileData.stats?.followers ?? 0}</span>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </Link>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <Flame className="h-3 w-3 text-primary" />
                {(profileData.stats?.current_streak ?? 0) > 0
                  ? <span>{profileData.stats?.current_streak} day streak</span>
                  : <span>No active streak</span>
                }
              </div>

              {/* All-time stats */}
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">All Time</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Output</span>
                  <span className="font-mono font-medium text-foreground">{formatTokens(totalOutput)}</span>
                </div>
                {/* Provider bar */}
                {providers.length > 0 && (
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/50">
                    {providers.map((p) => (
                      <div
                        key={p}
                        className="h-full"
                        style={{
                          backgroundColor: PROVIDERS[p]?.color ?? '#888',
                          flex: 1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.href || (item.href === '/feed' && location.pathname === '/');
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {'badge' in item && item.badge && (
                <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
