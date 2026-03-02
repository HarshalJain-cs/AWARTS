import { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityCard } from '@/components/ActivityCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ErrorState } from '@/components/ErrorState';
import { useFeed } from '@/hooks/use-api';
import { transformFeedPost } from '@/lib/transformers';
import { useAuth } from '@/context/AuthContext';
import { Provider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const tabs = ['Following', 'Global'] as const;
const providers: (Provider | 'all')[] = ['all', 'claude', 'codex', 'gemini', 'antigravity'];

export default function Feed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Global');
  const [providerFilter, setProviderFilter] = useState<Provider | 'all'>('all');
  const [showTop, setShowTop] = useState(false);

  const feedType = activeTab === 'Following' ? 'following' : 'global';
  const providerParam = providerFilter === 'all' ? undefined : providerFilter;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(feedType, providerParam);

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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
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

        {/* Auth prompt for Following tab */}
        {activeTab === 'Following' && !user && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Sign in to see your feed</p>
            <p className="text-sm mt-1">Follow developers and see their sessions here.</p>
            <Link to="/login" className="inline-block mt-4 text-sm text-primary hover:underline">
              Sign in
            </Link>
          </div>
        )}

        {/* Feed */}
        {(activeTab !== 'Following' || user) && (
          <div className="space-y-4">
            {isLoading
              ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
              : isError
                ? <ErrorState message="Failed to load feed." onRetry={() => refetch()} />
                : posts.length === 0
                  ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-lg font-medium">No posts yet</p>
                      <p className="text-sm mt-1">
                        {activeTab === 'Following'
                          ? 'Follow some developers to see their sessions here.'
                          : 'Try changing your filters or check back later.'}
                      </p>
                    </div>
                  )
                  : posts.map((post, i) => <ActivityCard key={post.id} post={post} index={i} />)
            }

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} />
            {isFetchingNextPage && <SkeletonCard />}
          </div>
        )}
      </div>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors animate-fade-in"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </AppShell>
  );
}
