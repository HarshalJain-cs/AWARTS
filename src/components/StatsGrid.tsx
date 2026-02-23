import { formatCost, formatTokens, formatNumber } from '@/lib/format';

interface StatsGridProps {
  cost: number;
  inputTokens: number;
  outputTokens: number;
  sessions: number;
}

export function StatsGrid({ cost, inputTokens, outputTokens, sessions }: StatsGridProps) {
  const stats = [
    { label: 'Cost', value: formatCost(cost) },
    { label: 'Input', value: formatTokens(inputTokens) },
    { label: 'Output', value: formatTokens(outputTokens) },
    { label: 'Sessions', value: formatNumber(sessions) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
          <p className="font-mono text-sm font-semibold text-foreground">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
