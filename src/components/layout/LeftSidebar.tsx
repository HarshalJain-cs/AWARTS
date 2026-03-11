import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Search, User, Settings, Upload, BarChart3, BookOpen, Bell, PlusCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function LeftSidebar() {
  const location = useLocation();
  const { user, isSignedIn } = useAuth();

  const navItems = [
    { label: 'Feed', icon: Home, href: '/feed' },
    { label: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
    { label: 'Search', icon: Search, href: '/search' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'New Post', icon: PlusCircle, href: '/post/new' },
    { label: 'My Profile', icon: User, href: user ? `/u/${user.username}` : isSignedIn ? '#' : '/login' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Import Data', icon: Upload, href: '/settings' },
    { label: 'My Recap', icon: BarChart3, href: '/recap' },
    { label: 'Prompts', icon: Lightbulb, href: '/prompts' },
    { label: 'Docs', icon: BookOpen, href: '/docs' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-border p-4 gap-1 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
