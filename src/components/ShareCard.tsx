import { forwardRef } from 'react';
import { formatCost, formatNumber } from '@/lib/format';
import { ProviderChip } from '@/components/ProviderChip';
import type { Provider, HeatmapDay } from '@/lib/types';
import { cn } from '@/lib/utils';

export type ShareTheme = 'midnight' | 'frost' | 'neon';

interface ShareCardProps {
  username: string;
  avatarUrl: string;
  period: string;
  totalCost: number;
  outputTokens: number;
  streak: number;
  daysActive: number;
  providers: Provider[];
  heatmap: HeatmapDay[];
  theme: ShareTheme;
}

const PROVIDER_HSL: Record<Provider, string> = {
  claude: '24, 95%, 53%',
  codex: '142, 71%, 45%',
  gemini: '217, 91%, 60%',
  antigravity: '270, 91%, 65%',
};

const INTENSITY_OPACITY: Record<number, number> = {
  1: 0.3,
  2: 0.5,
  3: 0.7,
  4: 0.9,
};

const themeStyles: Record<ShareTheme, {
  card: string;
  title: string;
  username: string;
  label: string;
  value: string;
  stat: string;
  border: string;
  emptyCellBg: string;
  footer: string;
  brandBg: string;
}> = {
  midnight: {
    card: 'bg-gradient-to-br from-[#0f1219] to-[#1a1f2e]',
    title: 'text-white',
    username: 'text-white',
    label: 'text-gray-400',
    value: 'text-white',
    stat: 'bg-white/5 border border-white/10',
    border: 'border-white/10',
    emptyCellBg: 'bg-white/5',
    footer: 'text-gray-500',
    brandBg: 'bg-white',
  },
  frost: {
    card: 'bg-white',
    title: 'text-gray-900',
    username: 'text-gray-900',
    label: 'text-gray-500',
    value: 'text-gray-900',
    stat: 'bg-gray-50 border border-gray-200',
    border: 'border-gray-200',
    emptyCellBg: 'bg-gray-100',
    footer: 'text-gray-400',
    brandBg: 'bg-gray-900',
  },
  neon: {
    card: 'bg-gradient-to-br from-[#1a0533] via-[#0d1b3e] to-[#0a2540]',
    title: 'text-white',
    username: 'text-white',
    label: 'text-purple-300/70',
    value: 'text-white',
    stat: 'bg-white/5 border border-purple-500/20',
    border: 'border-purple-500/20',
    emptyCellBg: 'bg-purple-500/10',
    footer: 'text-purple-400/50',
    brandBg: 'bg-purple-500',
  },
};

function MiniHeatmap({ data, theme }: { data: HeatmapDay[]; theme: ShareTheme }) {
  const styles = themeStyles[theme];
  // Show last 12 weeks (84 days)
  const recent = data.slice(-84);
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < recent.length; i += 7) {
    weeks.push(recent.slice(i, i + 7));
  }

  return (
    <div className="flex gap-[2px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[2px]">
          {week.map((day) => {
            const hasActivity = day.intensity > 0 && day.dominantProvider;
            let bg: React.CSSProperties = {};
            if (hasActivity && day.dominantProvider) {
              const hsl = PROVIDER_HSL[day.dominantProvider];
              const opacity = INTENSITY_OPACITY[day.intensity] ?? 0;
              bg = { backgroundColor: `hsl(${hsl} / ${opacity})` };
            }
            return (
              <div
                key={day.date}
                className={cn(
                  'h-[8px] w-[8px] rounded-[1px]',
                  !hasActivity && styles.emptyCellBg,
                )}
                style={bg}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ username, avatarUrl, period, totalCost, outputTokens, streak, daysActive, providers, heatmap, theme }, ref) => {
    const s = themeStyles[theme];
    const periodLabel = period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week';

    const stats = [
      { label: 'Total Spend', value: formatCost(totalCost) },
      { label: 'Output Tokens', value: formatNumber(outputTokens) },
      { label: 'Streak', value: `${streak}d` },
      { label: 'Days Active', value: String(daysActive) },
    ];

    return (
      <div
        ref={ref}
        className={cn('w-[480px] rounded-2xl p-6 space-y-5', s.card, `border ${s.border}`)}
        style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* Header with branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn('h-5 w-3', s.brandBg)}
              style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }}
            />
            <span className={cn('font-mono text-xs font-bold tracking-wider', s.title)}>AWARTS</span>
          </div>
          <span className={cn('text-xs font-medium', s.label)}>{periodLabel}</span>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={username}
            className="h-12 w-12 rounded-full object-cover border-2"
            style={{ borderColor: theme === 'frost' ? '#e5e7eb' : 'rgba(255,255,255,0.15)' }}
          />
          <div>
            <p className={cn('font-bold text-lg', s.username)}>@{username}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className={cn('rounded-lg px-3 py-2', s.stat)}>
              <p className={cn('text-[10px] uppercase tracking-wider font-medium', s.label)}>{stat.label}</p>
              <p className={cn('font-mono text-lg font-bold', s.value)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Provider chips */}
        {providers.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {providers.map((p) => <ProviderChip key={p} provider={p} size="md" />)}
          </div>
        )}

        {/* Mini heatmap */}
        {heatmap.length > 0 && (
          <div className="space-y-2">
            <p className={cn('text-[10px] uppercase tracking-wider font-medium', s.label)}>Activity</p>
            <MiniHeatmap data={heatmap} theme={theme} />
          </div>
        )}

        {/* Footer branding */}
        <div className={cn('flex items-center justify-between pt-2 border-t', s.border)}>
          <span className={cn('text-[10px] font-mono', s.footer)}>awarts.com</span>
          <span className={cn('text-[10px] font-mono', s.footer)}>AI Coding Stats</span>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';
