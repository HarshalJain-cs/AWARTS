import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { UserSearchCard } from '@/components/UserSearchCard';
import { ErrorState } from '@/components/ErrorState';
import { useSearch } from '@/hooks/use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { transformUser } from '@/lib/transformers';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Loader2, X } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const debouncedQuery = useDebounce(query.trim(), 300);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const { data, isLoading, error } = useSearch(debouncedQuery);
  const isError = !!error;

  const results = data?.users.map(transformUser) ?? [];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by username..."
            className="pl-10 h-11 bg-muted/50 border-none"
          />
          {isLoading && debouncedQuery.length >= 2 && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          )}
          {!isLoading && query.length > 0 && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {debouncedQuery.length < 2 ? (
            <div className="text-center py-16 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Search for developers</p>
              <p className="text-sm mt-1">Find people by username (at least 2 characters).</p>
            </div>
          ) : isError ? (
            <ErrorState message="Search failed." onRetry={() => window.location.reload()} />
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different search term.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"</p>
              {results.map((user) => <UserSearchCard key={user.id} user={user} />)}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
