import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PROVIDERS } from '@/lib/constants';

interface SpendChartProps {
  data: Array<Record<string, any>>;
}

const chartConfig: ChartConfig = {
  claude: { label: 'Claude', color: PROVIDERS.claude.color },
  codex: { label: 'Codex', color: PROVIDERS.codex.color },
  gemini: { label: 'Gemini', color: PROVIDERS.gemini.color },
  antigravity: { label: 'Antigravity', color: PROVIDERS.antigravity.color },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SpendChart({ data }: SpendChartProps) {
  // Find which providers are present in the data
  const activeProviders = Object.keys(PROVIDERS).filter((p) =>
    data.some((d) => (d[p] ?? 0) > 0)
  );

  if (data.length === 0) return null;

  return (
    <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.date) return formatDate(payload[0].payload.date);
                return '';
              }}
              formatter={(value, name) => {
                const provider = chartConfig[name as string];
                return (
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium">{provider?.label ?? name}</span>
                    <span className="font-mono">${Number(value).toFixed(2)}</span>
                  </span>
                );
              }}
            />
          }
        />
        {activeProviders.map((provider) => (
          <Area
            key={provider}
            type="monotone"
            dataKey={provider}
            stackId="1"
            fill={`var(--color-${provider})`}
            stroke={`var(--color-${provider})`}
            fillOpacity={0.3}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
