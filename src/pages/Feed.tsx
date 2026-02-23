import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ActivityCard } from '@/components/ActivityCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ProviderChip } from '@/components/ProviderChip';
import { mockPosts } from '@/lib/mock-data';
import { Provider } from '@/lib/types';
import { cn } from '@/lib/utils';

const tabs = ['Following', 'Global'] as const;
const providers: (Provider | 'all')[] = ['all', 'claude', 'codex', 'gemini'];

export default function Feed() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Global');
  const [providerFilter, setProviderFilter] = useState<Provider | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const filtered = mockPosts.filter((p) => {
    if (providerFilter !== 'all' && !p.providers.includes(providerFilter)) return false;
    if (activeTab === 'Following') return p.user.isFollowing;
    return true;
  });

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

        {/* Feed */}
        <div className="space-y-4">
          {loading
            ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((post, i) => <ActivityCard key={post.id} post={post} index={i} />)
          }
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm mt-1">Try changing your filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
