import { SEO } from "@/components/SEO";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

const ComparisonRow = ({ feature, awarts, other }: { feature: string; awarts: boolean; other: boolean }) => (
  <tr className="border-b border-border/50">
    <td className="py-4 font-medium">{feature}</td>
    <td className="py-4 text-center">
      {awarts ? <Check className="mx-auto text-primary h-5 w-5" /> : <X className="mx-auto text-muted-foreground h-5 w-5" />}
    </td>
    <td className="py-4 text-center">
      {other ? <Check className="mx-auto text-primary h-5 w-5" /> : <X className="mx-auto text-muted-foreground h-5 w-5" />}
    </td>
  </tr>
);

export default function WakaTimeComparison() {
  return (
    <AppShell>
      <SEO 
        title="AWARTS vs WakaTime — Best AI Coding Tracker" 
        description="Comparing AWARTS and WakaTime for AI-assisted coding tracking. Learn why AWARTS is the Strava for AI developers with native Claude, Codex, and Gemini support."
        keywords="AWARTS vs WakaTime, AI coding tracker comparison, track Claude usage, best developer activity tracker, Strava for AI"
      />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">AWARTS vs WakaTime</h1>
          <p className="text-xl text-muted-foreground">
            The social fitness tracker for the AI era.
          </p>
        </div>

        <Card className="mb-12 border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Comparison Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 text-left font-semibold">Feature</th>
                  <th className="py-4 text-center font-bold text-primary">AWARTS</th>
                  <th className="py-4 text-center font-semibold text-muted-foreground">WakaTime</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow feature="Native Claude Code Tracking" awarts={true} other={false} />
                <ComparisonRow feature="Native Google Gemini Tracking" awarts={true} other={false} />
                <ComparisonRow feature="Native OpenAI Codex Tracking" awarts={true} other={false} />
                <ComparisonRow feature="Global AI Coding Leaderboard" awarts={true} other={false} />
                <ComparisonRow feature="Social Feed & Kudos" awarts={true} other={true} />
                <ComparisonRow feature="Token & Cost Analytics" awarts={true} other={false} />
                <ComparisonRow feature="Privacy-First (No API Keys)" awarts={true} other={false} />
                <ComparisonRow feature="100% Free & Open Source" awarts={true} other={false} />
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="prose prose-invert max-w-none">
          <h2>Why switch to AWARTS?</h2>
          <p>
            While WakaTime is an excellent tool for tracking time spent in editors, it was built for the pre-AI era. 
            <strong> AWARTS is built specifically for vibe coding.</strong> It doesn't just track time; it tracks tokens, 
            costs, and provider-specific sessions across the web and the terminal.
          </p>
          <p>
            If you are using <strong>Claude Code</strong>, <strong>Antigravity</strong>, or browser-based AI assistants, 
            AWARTS provides the visibility you need to optimize your workflow and compete with the best AI developers in the world.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
