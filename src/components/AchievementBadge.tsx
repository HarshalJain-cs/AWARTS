import { Achievement } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-all',
            achievement.earned
              ? 'bg-primary/10 border border-primary/20 hover:scale-110'
              : 'bg-muted/30 opacity-40 grayscale'
          )}
        >
          {achievement.emoji}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">{achievement.name}</p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        {achievement.earned && achievement.earnedAt && (
          <p className="text-xs text-primary mt-1">Earned {new Date(achievement.earnedAt).toLocaleDateString()}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
