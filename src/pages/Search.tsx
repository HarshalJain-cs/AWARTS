import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { UserSearchCard } from '@/components/UserSearchCard';
import { ErrorState } from '@/components/ErrorState';
import { useSearch } from '@/hooks/use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { transformUser } from '@/lib/transformers';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, Loader2, X, Filter } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { PROVIDERS, COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [providerFilter, setProviderFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 300);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const { data, isLoading, error } = useSearch(debouncedQuery, providerFilter, countryFilter);
  const isError = !!error;

  const results = data?.users.map(transformUser) ?? [];
  const hasFilters = providerFilter || countryFilter;

  return (
    <AppShell>
      <SEO title="Search Developers" description="Find AI-assisted developers by username on AWARTS. Discover coders using Claude, Codex, Gemini, and Antigravity." canonical="/search" keywords="search developers, find AI coders, AWARTS users" />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, name, or bio..."
              className="pl-10 pr-20 h-11 bg-muted/50 border-none"
              aria-label="Search developers"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isLoading && debouncedQuery.length >= 2 && (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'p-1 rounded transition-colors',
                  showFilters || hasFilters ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </button>
              {!isLoading && query.length > 0 && (
                <button
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter pills */}
          {showFilters && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PROVIDERS).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProviderFilter(providerFilter === p.id ? '' : p.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all',
                        providerFilter === p.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/30'
                      )}
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCountryFilter(countryFilter === c.code ? '' : c.code)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-all',
                        countryFilter === c.code
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/30'
                      )}
                    >
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setProviderFilter(''); setCountryFilter(''); }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {debouncedQuery.length < 2 ? (
            <div className="text-center py-16 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Search for developers</p>
              <p className="text-sm mt-1">Find people by username, name, or bio (at least 2 characters).</p>
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
              <p className="text-sm mt-1">Try a different search term{hasFilters ? ' or clear filters' : ''}.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"{hasFilters ? ' (filtered)' : ''}</p>
              {results.map((user, i) => <UserSearchCard key={user.id} user={user} index={i} />)}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
