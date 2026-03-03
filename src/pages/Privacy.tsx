import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-4 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono text-sm font-bold text-foreground">AWARTS</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: March 1, 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_strong]:text-foreground">
          <h2>What We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> Email address, username, profile details (display name, bio, country, avatar).</li>
            <li><strong>Usage data:</strong> AI coding session statistics from the AWARTS CLI — token counts, cost estimates, provider and model breakdowns, session dates. No source code or prompts are collected.</li>
            <li><strong>Analytics:</strong> Basic page views and performance metrics via Vercel Analytics.</li>
          </ul>

          <h2>How We Use It</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Display your profile, feed posts, and leaderboard rankings.</li>
            <li>Calculate streaks, achievements, and recap cards.</li>
            <li>Send optional email notifications (comments, mentions, weekly digest).</li>
          </ul>

          <h2>Your Controls</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Private mode:</strong> Switch your profile to private in Settings. Private profiles are hidden from the leaderboard and only visible to followers.</li>
            <li><strong>Data export:</strong> You can request a full export of your data at any time.</li>
            <li><strong>Account deletion:</strong> Delete your account from Settings &gt; Account. All data is permanently removed.</li>
          </ul>

          <h2>Data Storage</h2>
          <p>Data is stored in Convex with encryption at rest. Authentication is handled by Clerk. We use only essential cookies for authentication — no tracking cookies.</p>

          <h2>Third Parties</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Convex:</strong> Backend and database.</li>
            <li><strong>Clerk:</strong> Authentication and identity.</li>
            <li><strong>Vercel:</strong> Hosting and analytics.</li>
            <li><strong>Resend:</strong> Transactional emails.</li>
          </ul>
          <p>We do not sell or share your personal data with advertisers.</p>

          <h2>Contact</h2>
          <p>Questions? Open an issue on <a href="https://github.com/HarshalJain-cs/AWARTS" className="text-primary hover:underline">GitHub</a> or email us.</p>
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} AWARTS</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
