import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { UserSearchCard } from '@/components/UserSearchCard';
import { mockUsers } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return mockUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, username, or bio..."
            className="pl-10 h-11 bg-muted/50 border-none"
          />
        </div>

        <div className="space-y-3">
          {query.trim() === '' ? (
            <div className="text-center py-16 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Search for developers</p>
              <p className="text-sm mt-1">Find people by username, name, or bio.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try a different search term.</p>
            </div>
          ) : (
            results.map((user) => <UserSearchCard key={user.id} user={user} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}
