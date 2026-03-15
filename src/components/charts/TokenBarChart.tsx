import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { formatTokens } from '@/lib/format';

interface TokenData {
  date: string;
  input: number;
  output: number;
}

interface TokenBarChartProps {
  data: TokenData[];
}

const chartConfig: ChartConfig = {
  input: { label: 'Input', color: 'hsl(var(--primary))' },
  output: { label: 'Output', color: 'hsl(var(--primary) / 0.5)' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TokenBarChart({ data }: TokenBarChartProps) {
  if (data.length === 0) return null;

  return (
    <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
          tickFormatter={(v) => formatTokens(v)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.date) return formatDate(payload[0].payload.date);
                return '';
              }}
              formatter={(value) => (
                <span className="font-mono">{formatTokens(Number(value))}</span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="input" fill="var(--color-input)" radius={[2, 2, 0, 0]} />
        <Bar dataKey="output" fill="var(--color-output)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
