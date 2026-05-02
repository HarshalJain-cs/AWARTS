import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UsageBarProps {
  /** 0 to 100 */
  percent: number;
  label: string;
  sublabel?: string;
  /** Color of the fill */
  color?: string;
  /** Show warning styling above this threshold (default 80) */
  warnAt?: number;
  /** Optional time marker position (0 to 100) */
  markerPercent?: number;
  /** Tooltip text */
  tooltip?: string;
  /** Mini variant (60px wide, 7px tall) */
  mini?: boolean;
}

export function UsageBar({
  percent,
  label,
  sublabel,
  color = 'hsl(var(--primary))',
  warnAt = 80,
  markerPercent,
  tooltip,
  mini = false,
}: UsageBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const isWarning = clamped >= warnAt;
  const isFull = clamped >= 99.5;

  const bar = (
    <div
      className={cn(
        'relative overflow-visible select-none',
        mini ? 'w-[60px] h-[7px] rounded-sm' : 'w-full h-2.5 rounded-[3px]',
        'border border-border bg-muted/30'
      )}
    >
      {/* Fill */}
      <div
        className={cn(
          'h-full transition-all duration-300 ease-out',
          isFull ? 'rounded-[2px]' : 'rounded-l-[2px]',
        )}
        style={{
          width: `${clamped}%`,
          background: isWarning ? '#ce2029' : color,
        }}
      />
      {/* Time marker */}
      {markerPercent != null && markerPercent > 0 && (
        <div
          className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
          style={{
            left: `${Math.min(100, markerPercent)}%`,
            background: 'hsl(var(--foreground))',
          }}
        />
      )}
    </div>
  );

  if (mini) {
    return tooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 cursor-help">
            <span className="text-xs font-mono text-muted-foreground">{label}</span>
            {bar}
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    ) : (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{label}</span>
        {bar}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {sublabel && (
          <span className={cn(
            'text-xs font-mono',
            isWarning ? 'text-red-500 font-semibold' : 'text-muted-foreground'
          )}>
            {sublabel}
          </span>
        )}
      </div>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{bar}</TooltipTrigger>
          <TooltipContent className="text-xs max-w-[240px]">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        bar
      )}
    </div>
  );
}
