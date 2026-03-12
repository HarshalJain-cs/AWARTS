import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Search, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUnreadMessageCount } from '@/hooks/use-api';

export function BottomNav() {
  const location = useLocation();
  const { user, isSignedIn } = useAuth();
  const unreadMessages = useUnreadMessageCount();

  const items = [
    { icon: Home, href: '/feed', label: 'Feed' },
    { icon: Trophy, href: '/leaderboard', label: 'Board' },
    { icon: MessageSquare, href: '/messages', label: 'DMs', badge: unreadMessages > 0 ? unreadMessages : undefined },
    { icon: Search, href: '/search', label: 'Search' },
    { icon: User, href: user ? `/u/${user.username}` : isSignedIn ? '#' : '/login', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-around">
        {items.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
                {'badge' in item && item.badge && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
