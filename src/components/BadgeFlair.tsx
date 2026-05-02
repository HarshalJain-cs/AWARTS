import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgeFlairProps {
  username: string;
  compact?: boolean;
}

export function BadgeFlair({ username, compact = false }: BadgeFlairProps) {
  const badges = useQuery(api.badges.getUserBadges, { username });

  if (!badges || badges.length === 0) return null;

  if (compact) {
    // Show only first 3 badges inline
    return (
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          {badges.slice(0, 3).map((b) => (
            <Tooltip key={b.badge}>
              <TooltipTrigger asChild>
                <span className="text-sm cursor-default">{b.emoji}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium text-xs">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {badges.length > 3 && (
            <span className="text-xs text-muted-foreground ml-0.5">+{badges.length - 3}</span>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full badge grid
  const categories = ['special', 'achievement', 'provider', 'social', 'other'];
  const grouped = categories
    .map((cat) => ({
      category: cat,
      badges: badges.filter((b) => b.category === cat),
    }))
    .filter((g) => g.badges.length > 0);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {grouped.map((group) => (
          <div key={group.category} className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.badges.map((b) => (
                <Tooltip key={b.badge}>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium cursor-default hover:border-primary/30 transition-colors">
                      <span>{b.emoji}</span>
                      <span className="text-foreground">{b.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{b.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
