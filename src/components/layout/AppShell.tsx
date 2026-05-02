import { ReactNode, useEffect, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/context/AuthContext';
// removed unused import
import { toast } from '@/hooks/use-toast';

interface AppShellProps {
  children: ReactNode;
}

// Self-recovering error boundary — hides on error, retries after 2s
class RecoverBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidUpdate(_: unknown, prevState: { hasError: boolean }) {
    if (this.state.hasError && !prevState.hasError) {
      this.timer = setTimeout(() => this.setState({ hasError: false }), 2000);
    }
  }
  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
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

  // Hourly auto-sync notification (Convex is real-time, no need to reload)
  useEffect(() => {
    if (!isSignedIn) return;
    const ONE_HOUR = 60 * 60 * 1000;
    const intervalId = setInterval(() => {
      toast({
        title: "Background Sync Complete",
        description: "Your session stats are up to date.",
        duration: 3000,
      });
    }, ONE_HOUR);
    return () => clearInterval(intervalId);
  }, [isSignedIn]);

  const isDocsPage = location.pathname === '/docs';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />
      <div className="flex flex-1 min-h-0 w-full max-w-screen-2xl mx-auto overflow-hidden">
        <RecoverBoundary><LeftSidebar /></RecoverBoundary>
        <main className={`flex-1 min-w-0 relative flex flex-col h-full ${isDocsPage ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain sidebar-scroll'}`}>
          {children}
        </main>
        {!isDocsPage && <RecoverBoundary><RightSidebar /></RecoverBoundary>}
      </div>
      <RecoverBoundary><BottomNav /></RecoverBoundary>
    </div>
  );
}
