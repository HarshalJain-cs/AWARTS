import { ReactNode, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: ReactNode;
}

// Silent error boundary — renders nothing on error instead of crashing the page
class SilentBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
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
        <SilentBoundary><LeftSidebar /></SilentBoundary>
        <main className="flex-1 min-w-0 px-4 py-6 pb-20 lg:pb-6">
          {children}
        </main>
        <SilentBoundary><RightSidebar /></SilentBoundary>
      </div>
      <SilentBoundary><BottomNav /></SilentBoundary>
    </div>
  );
}
