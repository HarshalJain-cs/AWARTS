import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Search, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const items = [
    { icon: Home, href: '/feed', label: 'Feed' },
    { icon: Trophy, href: '/leaderboard', label: 'Board' },
    { icon: PlusCircle, href: '/post/new', label: 'Post' },
    { icon: Search, href: '/search', label: 'Search' },
    { icon: User, href: user ? `/u/${user.username}` : '/login', label: 'Profile' },
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
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
