import { AppShell } from '@/components/layout/AppShell';
import { SEO } from '@/components/SEO';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCost, formatTokens } from '@/lib/format';
import { motion } from 'framer-motion';
import { Globe, Coins, Users, Flame, BarChart3, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OpenStats() {
  const data = useQuery(api.openStats.getOpenStats);

  return (
    <AppShell>
      <SEO
        title="Open Stats — Community Metrics"
        description="Public aggregate statistics for the AWARTS community. See total spend, token usage, and popular models across all users."
        canonical="/open"
        keywords="AWARTS stats, community metrics, AI coding statistics, open data, token usage"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Open Stats</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Public aggregate statistics from the AWARTS community. Updated in real time.
          </p>
        </div>

        {!data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Hero Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Coins className="h-5 w-5" />}
                label="Total Spend"
                value={formatCost(data.totalSpend)}
                delay={0}
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Total Tokens"
                value={formatTokens(data.totalTokens)}
                delay={0.05}
              />
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Active Users"
                value={String(data.totalUsers)}
                delay={0.1}
              />
              <StatCard
                icon={<Flame className="h-5 w-5" />}
                label="Avg Active Days"
                value={`${data.avgStreak}d`}
                delay={0.15}
              />
            </div>

            {/* 30-Day Trend */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-lg border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                30-Day Spend Trend
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrend}>
                    <defs>
                      <linearGradient id="openSpendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}`}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spend']}
                      labelFormatter={(label: string) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--primary))"
                      fill="url(#openSpendGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Popular Models */}
            {data.popularModels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="rounded-lg border border-border bg-card p-5 space-y-4"
              >
                <h2 className="text-sm font-medium text-foreground">Most Popular Models</h2>
                <div className="space-y-3">
                  {data.popularModels.map((model, i) => (
                    <div key={model.model} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium truncate mr-2">
                          #{i + 1} {model.model}
                        </span>
                        <span className="text-muted-foreground text-xs shrink-0">
                          {model.percent}% · {formatCost(model.cost)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(model.percent, 2)}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-center space-y-3"
            >
              <p className="text-sm text-foreground font-medium">Join the community</p>
              <p className="text-xs text-muted-foreground">
                Start tracking your AI coding sessions and contribute to the global stats.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/leaderboard"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Leaderboard →
                </Link>
                <Link
                  to="/feed"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Feed →
                </Link>
                <Link
                  to="/docs"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Get Started →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-lg border border-border bg-card p-4 space-y-1.5"
    >
      <div className="text-primary">{icon}</div>
      <p className="text-xl font-bold text-foreground font-mono">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
