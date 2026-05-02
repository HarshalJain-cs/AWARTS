import { SEO } from "@/components/SEO";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClaudeTrackerPage() {
  return (
    <AppLayout>
      <SEO 
        title="Best Claude Code Usage Tracker — AWARTS" 
        description="Monitor your Claude Code token usage, costs, and session frequency with AWARTS. The ultimate tracker for Anthropic's Claude Code and web-based Claude assistants."
        keywords="track Claude usage, Claude token counter, Claude Code tracker, Anthropic Claude usage dashboard, AI coding tracker"
      />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">The Ultimate Claude Usage Tracker</h1>
          <p className="text-xl text-muted-foreground">
            Get 100% visibility into your Claude Code and web-based Claude sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle>Token Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track every input and output token consumed by Claude. See daily trends and optimize your prompts to save on costs.
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Keep a history of your Claude sessions without storing your private code. See when you were most productive.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="prose prose-invert max-w-none">
          <h2>How it works with Claude</h2>
          <p>
            AWARTS automatically detects Claude usage from two main sources:
          </p>
          <ol>
            <li><strong>Claude Code CLI:</strong> We read the stats cache from <code>~/.claude/stats-cache.json</code> locally.</li>
            <li><strong>Web Extension:</strong> Our Chrome extension counts tokens in real-time as you chat on <code>claude.ai</code>.</li>
          </ol>
          <p>
            All data is synced to your private dashboard on <strong>awarts.club</strong> where you can compare your usage with other vibe coders.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
