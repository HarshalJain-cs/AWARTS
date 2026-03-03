import { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ACHIEVEMENTS, PROVIDERS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  BookOpen, Download, Cpu, Layers, LayoutDashboard, Award,
  TerminalSquare, Code2, Shield, HelpCircle, Keyboard, Bug,
  Search, ChevronUp
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/50 overflow-hidden my-3">
      {title && <div className="border-b border-border px-3 py-1.5 text-xs font-mono text-muted-foreground bg-muted/80">{title}</div>}
      <pre className="p-3 text-sm font-mono text-foreground overflow-x-auto whitespace-pre">{children}</pre>
    </div>
  );
}

function Heading3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h3>;
}

function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-foreground my-3">
      {children}
    </div>
  );
}

function TableWrapper({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border border-border rounded-md">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h) => <th key={h} className="text-left px-3 py-2 font-medium text-foreground border-b border-border">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {row.map((cell, j) => <td key={j} className="px-3 py-2 text-muted-foreground font-mono text-xs">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    content: (
      <>
        <Heading3>What is AWARTS?</Heading3>
        <Para>
          AWARTS (AI Workflow Activity & Runtime Tracking System) is the social fitness tracker for AI-assisted coding. Think Strava, but for your Claude, Codex, Gemini, and Antigravity sessions. Track tokens, costs, streaks, and compete with developers worldwide.
        </Para>

        <Heading3>Quick Start (3 Steps)</Heading3>
        <div className="space-y-3 my-3">
          <div className="flex gap-3 items-start">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <div><p className="text-sm font-medium text-foreground">Create your username</p><p className="text-xs text-muted-foreground">Pick a unique handle — this is your public identity on AWARTS.</p></div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <div><p className="text-sm font-medium text-foreground">Choose your country</p><p className="text-xs text-muted-foreground">Set your region for country-specific leaderboards.</p></div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            <div><p className="text-sm font-medium text-foreground">Install the CLI</p><p className="text-xs text-muted-foreground">Run <code className="font-mono bg-muted px-1 rounded text-foreground">npx awarts@latest</code> to start tracking.</p></div>
          </div>
        </div>

        <Heading3>System Requirements</Heading3>
        <Para>Node.js 18+ and a terminal. Works on macOS, Linux, and Windows (via WSL or PowerShell). Supports Bun and pnpm as well.</Para>
      </>
    ),
  },
  {
    id: 'installation',
    title: 'Installation',
    icon: Download,
    content: (
      <>
        <Heading3>Install the CLI</Heading3>
        <Para>The fastest way to get started is with npx (no install needed):</Para>
        <CodeBlock title="Terminal">{`npx awarts@latest`}</CodeBlock>
        <Para>Or install globally:</Para>
        <CodeBlock title="Terminal">{`npm install -g awarts\n# or\nbun add -g awarts`}</CodeBlock>

        <Heading3>Configuration File</Heading3>
        <Para>After first run, AWARTS creates a <code className="font-mono bg-muted px-1 rounded text-foreground">.awartsrc</code> file in your home directory:</Para>
        <CodeBlock title="~/.awartsrc">{`{
  "username": "alexdev",
  "apiKey": "aw_xxxxxxxxxxxxxxxxxxxx",
  "providers": {
    "claude": { "enabled": true, "apiKey": "sk-ant-..." },
    "codex": { "enabled": true },
    "gemini": { "enabled": false }
  },
  "autoSync": true,
  "syncInterval": 300
}`}</CodeBlock>

        <Heading3>Updating the CLI</Heading3>
        <CodeBlock title="Terminal">{`npm update -g awarts\n# or just use npx — it always fetches the latest`}</CodeBlock>

        <InfoBox>
          💡 <strong>Tip:</strong> If you use <code className="font-mono">npx</code>, you're always on the latest version automatically.
        </InfoBox>
      </>
    ),
  },
  {
    id: 'providers',
    title: 'Providers',
    icon: Cpu,
    content: (
      <>
        <Para>AWARTS supports four AI coding providers. Each tracks sessions, tokens, and cost independently.</Para>

        {Object.values(PROVIDERS).map((p) => (
          <div key={p.id} className="my-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('h-3 w-3 rounded-full', p.dotClass)} />
              <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
            </div>
            <Para>To enable {p.name} tracking, add your API key to the configuration:</Para>
            <CodeBlock title={`~/.awartsrc → providers.${p.id}`}>{`{
  "${p.id}": {
    "enabled": true,
    "apiKey": "your-${p.id}-api-key",
    "sessionDir": "~/.${p.id}/sessions"
  }
}`}</CodeBlock>
            <Para>
              AWARTS reads session data from {p.name}'s local cache directory. Sessions are detected automatically when you start and stop a coding conversation. Each session records: start time, end time, input tokens, output tokens, model used, and estimated cost.
            </Para>
          </div>
        ))}

        <Heading3>Multi-Provider Sessions</Heading3>
        <Para>
          If you switch between providers during a single work period, AWARTS tracks each provider segment separately but groups them under one "work session" on your profile. Your contribution graph shows the dominant provider per day by color.
        </Para>
        <InfoBox>
          🌐 <strong>Polyglot Coder:</strong> Use 2+ providers to unlock the Polyglot achievement. Use all 4 for Full Stack AI!
        </InfoBox>
      </>
    ),
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: Layers,
    content: (
      <>
        <Heading3>Sessions</Heading3>
        <Para>
          A session is a single continuous interaction with an AI provider. It starts when you send your first message and ends after 5 minutes of inactivity or when you explicitly close the conversation. Each session records:
        </Para>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3 ml-2">
          <li>Provider (Claude, Codex, Gemini, or Antigravity)</li>
          <li>Start and end timestamps</li>
          <li>Input and output token counts</li>
          <li>Estimated cost based on the model's pricing</li>
          <li>Model identifier (e.g., claude-4-sonnet, codex-1, gemini-2.5-pro)</li>
        </ul>

        <Heading3>Tokens</Heading3>
        <Para>
          Tokens are the fundamental unit of AI usage. <strong>Input tokens</strong> are what you send to the model (your prompts, code context, file contents). <strong>Output tokens</strong> are what the model generates (responses, code, explanations).
        </Para>
        <Para>
          AWARTS displays output tokens prominently since they represent the AI's actual work. The leaderboard ranks by total output tokens by default.
        </Para>

        <Heading3>Cost Tracking</Heading3>
        <Para>
          Cost is calculated using each provider's published pricing at the time of the session. AWARTS stores the per-token rate alongside each session so historical costs remain accurate even after pricing changes.
        </Para>
        <TableWrapper
          headers={['Provider', 'Input (per 1M)', 'Output (per 1M)', 'Example Session']}
          rows={[
            ['Claude 4 Sonnet', '$3.00', '$15.00', '~$0.45 for 10K in / 25K out'],
            ['Codex', '$2.00', '$8.00', '~$0.28 for 15K in / 30K out'],
            ['Gemini 2.5 Pro', '$1.25', '$10.00', '~$0.35 for 20K in / 30K out'],
            ['Antigravity', '$2.50', '$12.00', '~$0.40 for 15K in / 25K out'],
          ]}
        />

        <Heading3>Streaks</Heading3>
        <Para>
          A streak counts consecutive days with at least one synced session. Streaks reset at midnight in your local timezone. Missing a single day resets your streak to 0.
        </Para>
        <InfoBox>
          🔥 <strong>Streak milestones:</strong> 7 days → Week Warrior badge. 30 days → Power User badge. Your current streak is shown on your profile card.
        </InfoBox>
      </>
    ),
  },
  {
    id: 'dashboard',
    title: 'Dashboard Guide',
    icon: LayoutDashboard,
    content: (
      <>
        <Heading3>Feed</Heading3>
        <Para>
          The Feed shows recent sessions from developers you follow, or globally. Each activity card shows the provider, token counts, cost, and a relative timestamp. You can:
        </Para>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3 ml-2">
          <li>Toggle between <strong>Following</strong> and <strong>Global</strong> views</li>
          <li>Give kudos (👏) to impressive sessions</li>
          <li>Comment on activity cards</li>
          <li>Click through to see full session details</li>
        </ul>

        <Heading3>Leaderboard</Heading3>
        <Para>
          The leaderboard ranks developers by total output tokens. Filter by:
        </Para>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3 ml-2">
          <li><strong>Time period:</strong> Today, This Week, This Month, All Time</li>
          <li><strong>Region:</strong> Global or by country</li>
          <li><strong>Provider:</strong> All, Claude, Codex, Gemini, or Antigravity</li>
        </ul>

        <Heading3>Profile</Heading3>
        <Para>
          Your profile page displays: stats grid (total spend, output tokens, sessions, streak), a contribution graph (GitHub-style heatmap showing daily activity), provider breakdown, and earned achievements.
        </Para>

        <Heading3>Recap</Heading3>
        <Para>
          Generate a shareable recap card summarizing your AWARTS stats. Choose a time period, customize the theme, and export as an image to share on social media. The recap includes top stats, provider split, and your best streak.
        </Para>

        <Heading3>Search</Heading3>
        <Para>
          Find other developers by username. Search results show user cards with their stats, provider badges, and verification status. Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-xs font-mono">/</kbd> anywhere to jump to search.
        </Para>
      </>
    ),
  },
  {
    id: 'achievements',
    title: 'Achievements',
    icon: Award,
    content: (
      <>
        <Para>
          Achievements are badges earned by hitting specific milestones. There are {ACHIEVEMENTS.length} achievements in total. They appear on your profile once unlocked.
        </Para>
        <div className="grid sm:grid-cols-2 gap-2 my-4">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
              <span className="text-2xl">{a.emoji}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
        <InfoBox>
          🏆 Achievements are checked on every sync. Once earned, they're permanent and can't be lost — even if your stats later decrease.
        </InfoBox>
      </>
    ),
  },
  {
    id: 'cli-reference',
    title: 'CLI Reference',
    icon: TerminalSquare,
    content: (
      <>
        <Para>The AWARTS CLI is your primary interface for syncing session data. Here are all available commands:</Para>

        <TableWrapper
          headers={['Command', 'Description', 'Example']}
          rows={[
            ['awarts sync', 'Sync all new sessions to AWARTS', 'awarts sync'],
            ['awarts sync --provider claude', 'Sync only a specific provider', 'awarts sync -p claude'],
            ['awarts status', 'Show current streak, last sync, pending sessions', 'awarts status'],
            ['awarts export', 'Export all session data as JSON or CSV', 'awarts export --format csv'],
            ['awarts config', 'View or edit configuration', 'awarts config set autoSync true'],
            ['awarts whoami', 'Show current logged-in user', 'awarts whoami'],
            ['awarts logout', 'Clear stored credentials', 'awarts logout'],
            ['awarts daemon start', 'Start background auto-sync daemon', 'awarts daemon start --interval 10'],
            ['awarts daemon stop', 'Stop the background daemon', 'awarts daemon stop'],
            ['awarts daemon status', 'Check if daemon is running', 'awarts daemon status'],
            ['awarts daemon logs', 'View recent daemon log output', 'awarts daemon logs -n 100'],
          ]}
        />

        <Heading3>Flags & Options</Heading3>
        <TableWrapper
          headers={['Flag', 'Description', 'Default']}
          rows={[
            ['--provider, -p', 'Filter by provider (claude, codex, gemini, antigravity)', 'all'],
            ['--format, -f', 'Output format for export (json, csv)', 'json'],
            ['--since', 'Only sync sessions after this date', '(last sync)'],
            ['--dry-run', 'Preview what would be synced without posting', 'false'],
            ['--verbose, -v', 'Show detailed output', 'false'],
            ['--quiet, -q', 'Suppress all output', 'false'],
            ['--interval', 'Sync interval in minutes (daemon start)', '5'],
          ]}
        />

        <Heading3>Environment Variables</Heading3>
        <CodeBlock title="Shell">{`# Override config file location
export AWARTS_CONFIG="~/custom/.awartsrc"

# Set API key without config file
export AWARTS_API_KEY="aw_xxxxxxxxxxxxxxxxxxxx"

# Enable debug logging
export AWARTS_DEBUG=1

# Set custom API endpoint (self-hosted)
export AWARTS_API_URL="https://api.your-server.com"`}</CodeBlock>
      </>
    ),
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: Code2,
    content: (
      <>
        <Para>The AWARTS REST API lets you programmatically access your data. All endpoints require authentication via API key.</Para>

        <Heading3>Authentication</Heading3>
        <CodeBlock title="HTTP Header">{`Authorization: Bearer aw_xxxxxxxxxxxxxxxxxxxx`}</CodeBlock>

        <Heading3>Base URL</Heading3>
        <CodeBlock>{`https://api.awarts.com/v1`}</CodeBlock>

        <Heading3>Endpoints</Heading3>
        <TableWrapper
          headers={['Method', 'Endpoint', 'Description']}
          rows={[
            ['GET', '/me', 'Get current user profile'],
            ['GET', '/users/:username', 'Get a user\'s public profile'],
            ['GET', '/users/:username/sessions', 'List user sessions (paginated)'],
            ['POST', '/sessions', 'Create a new session (used by CLI)'],
            ['GET', '/leaderboard', 'Get leaderboard (supports ?period, ?region, ?provider)'],
            ['GET', '/feed', 'Get global or following feed'],
            ['POST', '/sessions/:id/kudos', 'Give kudos to a session'],
            ['DELETE', '/sessions/:id/kudos', 'Remove kudos'],
          ]}
        />

        <Heading3>Example: Get Your Profile</Heading3>
        <CodeBlock title="curl">{`curl -H "Authorization: Bearer aw_xxx" \\
  https://api.awarts.com/v1/me

# Response
{
  "username": "alexdev",
  "totalSpend": 1284.50,
  "totalOutputTokens": 48230000,
  "totalSessions": 342,
  "currentStreak": 23,
  "providers": ["claude", "codex"],
  "verified": true
}`}</CodeBlock>

        <Heading3>Example: Submit a Session</Heading3>
        <CodeBlock title="curl">{`curl -X POST -H "Authorization: Bearer aw_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "claude",
    "model": "claude-4-sonnet",
    "inputTokens": 12400,
    "outputTokens": 34200,
    "cost": 0.62,
    "startedAt": "2026-02-23T10:00:00Z",
    "endedAt": "2026-02-23T10:45:00Z"
  }' \\
  https://api.awarts.com/v1/sessions`}</CodeBlock>

        <Heading3>Rate Limits</Heading3>
        <Para>
          API requests are limited to <strong>100 requests per minute</strong> per API key. The CLI's sync command batches sessions efficiently and should never hit this limit under normal usage. Rate limit headers:
        </Para>
        <CodeBlock>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1708700000`}</CodeBlock>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    icon: Shield,
    content: (
      <>
        <Heading3>What Data is Collected</Heading3>
        <Para>AWARTS collects only session metadata — never your actual code or conversation content. Specifically:</Para>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3 ml-2">
          <li>Session start/end timestamps</li>
          <li>Provider and model identifier</li>
          <li>Input and output token counts</li>
          <li>Estimated cost</li>
          <li>Your username and country (set during onboarding)</li>
        </ul>
        <InfoBox>
          🔒 <strong>No code is ever sent.</strong> AWARTS reads token counts from provider logs — it never accesses your prompts or generated code.
        </InfoBox>

        <Heading3>Public vs Private Profiles</Heading3>
        <Para>
          By default, your profile is public — anyone can see your stats, contribution graph, and achievements. You can make your profile private in Settings → Privacy. Private profiles:
        </Para>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3 ml-2">
          <li>Don't appear in search results</li>
          <li>Don't appear on the leaderboard</li>
          <li>Activity cards are only visible to followers</li>
          <li>Your profile URL returns a "Private Profile" message to non-followers</li>
        </ul>

        <Heading3>Data Export & Deletion</Heading3>
        <Para>
          You can export all your data at any time via the CLI or Settings page:
        </Para>
        <CodeBlock title="Terminal">{`# Export all data as JSON
awarts export --format json --output my-data.json

# Export as CSV
awarts export --format csv --output my-data.csv`}</CodeBlock>
        <Para>
          To delete your account and all associated data, go to Settings → Danger Zone → Delete Account. This action is irreversible and removes all sessions, achievements, and profile data within 30 days.
        </Para>
      </>
    ),
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    content: (
      <>
        <Para>Common questions from the AWARTS community.</Para>
        <Accordion type="multiple" className="w-full">
          {[
            { q: 'Is AWARTS free?', a: 'Yes! AWARTS is free for individual developers. We may introduce premium features in the future (custom themes, team leaderboards), but core tracking and social features will always be free.' },
            { q: 'Does AWARTS read my code or prompts?', a: 'No. AWARTS only reads session metadata (timestamps, token counts, costs) from provider log files. Your actual code and conversations are never accessed or transmitted.' },
            { q: 'How accurate are the cost estimates?', a: 'Costs are calculated using each provider\'s published per-token pricing at the time of the session. They should be within 5% of your actual bill. If a provider changes pricing, new sessions reflect the new rates.' },
            { q: 'Can I use AWARTS with a self-hosted LLM?', a: 'Not yet, but it\'s on our roadmap. We plan to support OpenAI-compatible endpoints so you can track usage from local models like Llama or Mistral.' },
            { q: 'What happens if I miss a day — does my streak reset?', a: 'Yes. Streaks count consecutive calendar days (in your local timezone) with at least one synced session. Missing a single day resets it to 0.' },
            { q: 'Can I backfill old sessions?', a: 'Yes! Use `awarts sync --since 2025-01-01` to sync sessions from a specific date. The CLI will scan provider logs for any sessions it hasn\'t already uploaded.' },
            { q: 'How do I connect multiple machines?', a: 'Install the CLI on each machine and run `awarts config set apiKey YOUR_KEY`. All machines sync to the same account. Sessions are deduplicated by their provider-assigned IDs.' },
            { q: 'Can I hide specific sessions?', a: 'Yes. Go to your Profile, click on any session card, and select "Make Private". Private sessions still count toward your stats but aren\'t visible to others.' },
            { q: 'Is there a team/org version?', a: 'Coming soon! Team leaderboards and organization dashboards are in development. Join the waitlist in Settings → Teams.' },
            { q: 'How do I report a bug or request a feature?', a: 'Open an issue on our GitHub repository or email support@awarts.com. We respond to all reports within 48 hours.' },
          ].map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
              <AccordionContent><p className="text-sm text-muted-foreground">{item.a}</p></AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </>
    ),
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    content: (
      <>
        <Para>Navigate AWARTS faster with these keyboard shortcuts. Available on all pages within the dashboard.</Para>
        <TableWrapper
          headers={['Shortcut', 'Action', 'Scope']}
          rows={[
            ['/', 'Focus search bar', 'Global'],
            ['G then F', 'Go to Feed', 'Global'],
            ['G then L', 'Go to Leaderboard', 'Global'],
            ['G then P', 'Go to Profile', 'Global'],
            ['G then S', 'Go to Settings', 'Global'],
            ['G then D', 'Go to Docs', 'Global'],
            ['G then R', 'Go to Recap', 'Global'],
            ['K', 'Give kudos to focused card', 'Feed'],
            ['J / K', 'Navigate between cards', 'Feed'],
            ['Enter', 'Open focused card', 'Feed'],
            ['Esc', 'Close modal / clear search', 'Global'],
            ['? ', 'Show keyboard shortcuts help', 'Global'],
          ]}
        />
        <InfoBox>
          ⌨️ <strong>Pro tip:</strong> Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-xs font-mono">?</kbd> at any time to see an overlay of all available shortcuts.
        </InfoBox>
      </>
    ),
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: Bug,
    content: (
      <>
        <Para>Common issues and how to fix them.</Para>

        <Heading3>"No sessions found" after sync</Heading3>
        <Para>
          This usually means the CLI can't find your provider's session logs. Check that:
        </Para>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3 ml-2">
          <li>The provider is enabled in your <code className="font-mono bg-muted px-1 rounded text-foreground">.awartsrc</code></li>
          <li>The session directory path is correct</li>
          <li>You've actually had a coding session since the last sync</li>
        </ul>
        <CodeBlock title="Debug">{`# Run with verbose output to see what's happening
awarts sync --verbose

# Check your config
awarts config list`}</CodeBlock>

        <Heading3>"Authentication failed"</Heading3>
        <Para>Your API key may be invalid or expired. Re-authenticate:</Para>
        <CodeBlock title="Terminal">{`awarts logout
awarts login`}</CodeBlock>

        <Heading3>"Rate limit exceeded"</Heading3>
        <Para>
          You've sent too many API requests in a short time. Wait 60 seconds and try again. If you're running automated scripts, add delays between requests.
        </Para>

        <Heading3>Sessions showing wrong cost</Heading3>
        <Para>
          Cost is calculated at sync time using the provider's current pricing. If pricing changed between when you had the session and when you synced, costs may differ from your actual bill. Sync promptly for the most accurate costs.
        </Para>

        <Heading3>CLI debug mode</Heading3>
        <CodeBlock title="Terminal">{`# Enable debug logging for maximum detail
export AWARTS_DEBUG=1
awarts sync --verbose

# This will show:
# - Config file location and contents
# - Provider session directories scanned
# - Each session found with full metadata
# - API requests and responses
# - Any errors with stack traces`}</CodeBlock>

        <Heading3>Still stuck?</Heading3>
        <Para>
          Reach out to us at <strong>support@awarts.com</strong> or open an issue on GitHub. Include the output of <code className="font-mono bg-muted px-1 rounded text-foreground">awarts status --verbose</code> for faster debugging.
        </Para>
      </>
    ),
  },
];

export default function Docs() {
  const [search, setSearch] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (typeof s.content === 'string' && s.content.toLowerCase().includes(search.toLowerCase()))
      )
    : sections;

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = document.getElementById(`docs-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((s) => {
      const el = document.getElementById(`docs-${s.id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSectionId(s.id); },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto flex gap-8">
        {/* Desktop TOC */}
        <aside className="hidden lg:block w-[200px] shrink-0">
          <div className="sticky top-20 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Documentation</p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={cn(
                  'flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors',
                  activeSectionId === s.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6" ref={contentRef}>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Documentation</h1>

            {/* Mobile TOC */}
            <div className="lg:hidden">
              <Select value={activeSectionId} onValueChange={scrollToSection}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Jump to section..." />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Sections */}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No sections match "{search}"</p>
          )}

          {filtered.map((section) => (
            <section
              key={section.id}
              id={`docs-${section.id}`}
              className="scroll-mt-20 rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <section.icon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
              </div>
              {section.content}
            </section>
          ))}

          {/* Back to top */}
          <div className="text-center pb-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="h-4 w-4" /> Back to top
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
