import { cn } from '@/lib/utils';

interface StreakLevelProps {
  totalDays: number;
  compact?: boolean;
}

const LEVELS = [
  { min: 365, level: 8, label: 'Legend', color: 'from-amber-400 to-yellow-500', textColor: 'text-amber-900' },
  { min: 200, level: 7, label: 'Elite', color: 'from-amber-300 to-amber-400', textColor: 'text-amber-900' },
  { min: 100, level: 6, label: 'Veteran', color: 'from-purple-400 to-violet-500', textColor: 'text-white' },
  { min: 60, level: 5, label: 'Committed', color: 'from-purple-300 to-purple-400', textColor: 'text-white' },
  { min: 30, level: 4, label: 'Dedicated', color: 'from-blue-400 to-blue-500', textColor: 'text-white' },
  { min: 14, level: 3, label: 'Regular', color: 'from-blue-300 to-blue-400', textColor: 'text-white' },
  { min: 7, level: 2, label: 'Starter', color: 'from-zinc-300 to-zinc-400', textColor: 'text-zinc-800' },
  { min: 1, level: 1, label: 'Rookie', color: 'from-zinc-200 to-zinc-300', textColor: 'text-zinc-700' },
] as const;

export function getStreakLevel(totalDays: number) {
  for (const tier of LEVELS) {
    if (totalDays >= tier.min) return tier;
  }
  return LEVELS[LEVELS.length - 1];
}

export function StreakLevel({ totalDays, compact = false }: StreakLevelProps) {
  if (totalDays <= 0) return null;

  const tier = getStreakLevel(totalDays);

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded px-1 text-[10px] font-bold bg-gradient-to-r',
          tier.color,
          tier.textColor,
        )}
        title={`Level ${tier.level}: ${tier.label} (${totalDays} active days)`}
      >
        L{tier.level}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold bg-gradient-to-r',
        tier.color,
        tier.textColor,
      )}
      title={`${totalDays} active days`}
    >
      L{tier.level}
      <span className="font-medium opacity-80">{tier.label}</span>
    </span>
  );
}
