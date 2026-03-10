import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to onboarding if signed in but hasn't completed setup
  useEffect(() => {
    if (isSignedIn && user && !user.country && location.pathname !== '/onboarding' && location.pathname !== '/settings') {
      navigate('/onboarding', { replace: true });
    }
  }, [isSignedIn, user, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex w-full max-w-screen-2xl mx-auto">
        <LeftSidebar />
        <main className="flex-1 min-w-0 px-4 py-6 pb-20 lg:pb-6">
          {children}
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
