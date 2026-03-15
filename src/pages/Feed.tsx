import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityCard } from '@/components/ActivityCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { useFeed, useUserPosts } from '@/hooks/use-api';
import { transformFeedPost } from '@/lib/transformers';
import { useAuth } from '@/context/AuthContext';
import { Provider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const tabs = ['Following', 'Global', 'My Sessions'] as const;
const providers: (Provider | 'all')[] = ['all', 'claude', 'codex', 'gemini', 'antigravity'];

export default function Feed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Global');
  const [providerFilter, setProviderFilter] = useState<Provider | 'all'>('all');
  const [showTop, setShowTop] = useState(false);

  const isMySessionsTab = activeTab === 'My Sessions';
  const feedType = activeTab === 'Following' ? 'following' : 'global';
  const providerParam = providerFilter === 'all' ? undefined : providerFilter;

  const feedResult = useFeed(
    isMySessionsTab ? 'global' : feedType,
    providerParam
  );
  const myPostsResult = useUserPosts(isMySessionsTab && user ? user.username : '');

  // Use the right data source based on active tab
  const activeResult = isMySessionsTab ? myPostsResult : feedResult;
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
  } = activeResult;
  const fetchNextPage = activeResult.fetchNextPage;
  const isError = !!error;

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Back to top
  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const posts = data?.pages.flatMap((page) => page.posts.map(transformFeedPost)) ?? [];

  return (
    <AppShell>
      <SEO title="Feed — AI Coding Activity" description="See the latest AI coding sessions from developers worldwide. Filter by Claude, Codex, Gemini, and Antigravity providers." canonical="/feed" keywords="AI coding feed, developer activity, Claude sessions, Codex sessions, AI coding community" jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", "name": "AI Coding Activity Feed", "description": "Latest AI coding sessions from developers worldwide", "url": "https://awarts.vercel.app/feed" }} />
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-border" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-medium transition-colors relative',
                activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Provider filters */}
        <div className="flex gap-2 flex-wrap">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setProviderFilter(p)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                providerFilter === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground'
              )}
            >
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Auth prompt for auth-required tabs */}
        {(activeTab === 'Following' || activeTab === 'My Sessions') && !user && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Sign in to see {activeTab === 'My Sessions' ? 'your sessions' : 'your feed'}</p>
            <p className="text-sm mt-1">{activeTab === 'My Sessions' ? 'Track your AI coding sessions and view them here.' : 'Follow developers and see their sessions here.'}</p>
            <Link to="/login" className="inline-block mt-4 text-sm text-primary hover:underline">
              Sign in
            </Link>
          </div>
        )}

        {/* Feed */}
        {((activeTab !== 'Following' && activeTab !== 'My Sessions') || user) && (
          <div className="space-y-4">
            {isLoading
              ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
              : isError
                ? <ErrorState message="Failed to load feed." onRetry={() => window.location.reload()} />
                : posts.length === 0
                  ? (
                    <div className="text-center py-16 text-muted-foreground space-y-3">
                      <div className="text-4xl">
                        {activeTab === 'Following' ? '👥' : activeTab === 'My Sessions' ? '🚀' : '📡'}
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {activeTab === 'Following'
                          ? 'Your feed is empty'
                          : activeTab === 'My Sessions'
                            ? 'No sessions yet'
                            : 'No activity yet'}
                      </p>
                      <p className="text-sm max-w-xs mx-auto">
                        {activeTab === 'Following'
                          ? 'Follow developers from the Leaderboard or Search to see their sessions here.'
                          : activeTab === 'My Sessions'
                            ? 'Run npx awarts@latest sync to push your first AI coding session.'
                            : 'Be the first! Install the CLI and start tracking your AI coding sessions.'}
                      </p>
                    </div>
                  )
                  : posts.map((post, i) => <ActivityCard key={post.id} post={post} index={i} />)
            }

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} />
            {isFetchingNextPage && <SkeletonCard />}
            {!isLoading && !isFetchingNextPage && posts.length > 0 && !hasNextPage && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm font-medium">You're all caught up!</p>
                <p className="text-xs mt-1">Check back later for new sessions.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo(0, 0)}
        className={cn(
          "fixed bottom-20 right-6 z-40 rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 lg:bottom-6",
          showTop ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </AppShell>
  );
}
