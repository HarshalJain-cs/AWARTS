import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { currentUser } from '@/lib/mock-data';
import { formatCost, formatTokens } from '@/lib/format';
import { ProviderChip } from '@/components/ProviderChip';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';

export default function Recap() {
  const [period, setPeriod] = useState('month');

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Your Recap</h1>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recap card preview */}
        <div className="rounded-xl bg-gradient-to-br from-[hsl(224,25%,8%)] to-[hsl(224,25%,14%)] border border-border p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-4 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono text-sm font-bold text-foreground">AWARTS RECAP</span>
          </div>

          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt="" className="h-12 w-12 rounded-full" />
            <div>
              <p className="font-semibold text-foreground">@{currentUser.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{period === 'all' ? 'All Time' : `This ${period}`}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Spend</p>
              <p className="font-mono text-xl font-bold text-foreground">{formatCost(currentUser.totalSpend)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tokens</p>
              <p className="font-mono text-xl font-bold text-foreground">{formatTokens(currentUser.totalTokens)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
              <p className="font-mono text-xl font-bold text-foreground">🔥 {currentUser.streak}d</p>
            </div>
          </div>

          <div className="flex gap-2">
            {currentUser.providers.map((p) => <ProviderChip key={p} provider={p} size="md" />)}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" /> OG (1200×630)
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" /> Square (1080×1080)
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
