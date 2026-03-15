import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatCost } from '@/lib/format';

interface CumulativeData {
  date: string;
  cumulative: number;
}

interface CumulativeChartProps {
  data: CumulativeData[];
}

const chartConfig: ChartConfig = {
  cumulative: { label: 'Total Spend', color: 'hsl(var(--primary))' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CumulativeChart({ data }: CumulativeChartProps) {
  if (data.length === 0) return null;

  return (
    <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
                <span className="font-mono">{formatCost(Number(value))}</span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="hsl(var(--primary))"
          fill="url(#cumulativeGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
