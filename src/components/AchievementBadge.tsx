import { useState } from 'react';
import { Achievement } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Lock, X } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={achievement.name}
            onClick={() => setOpen(true)}
            className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              achievement.earned
                ? 'bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 hover:scale-110 hover:shadow-lg hover:shadow-primary/25 hover:border-primary/40 cursor-pointer'
                : 'bg-muted/20 border border-border/50 cursor-pointer hover:bg-muted/30'
            )}
          >
            {achievement.earned ? (
              <span className="drop-shadow-sm">{achievement.emoji}</span>
            ) : (
              <div className="relative flex items-center justify-center">
                <span className="opacity-20 grayscale blur-[1px]">{achievement.emoji}</span>
                <Lock className="absolute h-4 w-4 text-muted-foreground/60" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          {achievement.earned && achievement.earnedAt && (
            <p className="text-xs text-primary mt-1">Earned {new Date(Number(achievement.earnedAt)).toLocaleDateString()}</p>
          )}
          {!achievement.earned && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic">Not yet earned</p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Detail Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs bg-card border border-border rounded-2xl p-6 space-y-4 animate-in zoom-in-95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-2xl text-4xl',
                achievement.earned
                  ? 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 shadow-lg shadow-primary/10'
                  : 'bg-muted/30 border border-border'
              )}>
                {achievement.earned ? (
                  achievement.emoji
                ) : (
                  <div className="relative flex items-center justify-center">
                    <span className="opacity-20 grayscale">{achievement.emoji}</span>
                    <Lock className="absolute h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">{achievement.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
            </div>

            {achievement.earned && achievement.earnedAt ? (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                <span className="text-primary text-sm font-medium">Earned</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(Number(achievement.earnedAt)).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground">Keep coding to unlock this achievement!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
