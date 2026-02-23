import { Link } from 'react-router-dom';
import { TerminalDemo } from '@/components/TerminalDemo';
import { TestimonialCard } from '@/components/TestimonialCard';
import { ActivityCard } from '@/components/ActivityCard';
import { mockPosts, mockTestimonials } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { ArrowRight, Terminal, Share2, Trophy, Flame, BarChart3, Copy } from 'lucide-react';
import { PROVIDERS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Landing() {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('npx straude@latest');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-5 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono text-lg font-bold text-foreground">AWARTS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Button asChild size="sm">
              <Link to="/onboarding">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm uppercase tracking-widest text-primary mb-4"
        >
          Strava for Claude Code
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight"
        >
          Every session counts.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
        >
          Track your AI coding sessions across Claude, Codex, Gemini & Antigravity. Compete with devs worldwide.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="text-base px-8">
            <Link to="/onboarding">
              Start Your Streak <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <button
            onClick={copyCommand}
            className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2.5 font-mono text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <span>npx straude@latest</span>
            <Copy className="h-3.5 w-3.5" />
            {copied && <span className="text-xs text-primary">Copied!</span>}
          </button>
        </motion.div>
      </section>

      {/* Terminal Demo */}
      <section className="mx-auto max-w-2xl px-4 pb-20">
        <TerminalDemo />
      </section>

      {/* Live Stats */}
      <section className="border-y border-border bg-muted/20 py-12">
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-8 text-center">
          {[
            { value: '2,847', label: 'developers logging daily' },
            { value: '4.2B', label: 'tokens tracked' },
            { value: '48', label: 'countries' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-mono text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sessions Visualized */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold text-foreground text-center mb-4">Sessions visualized</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
          See your AI coding activity come to life with detailed session cards and real-time leaderboards.
        </p>
        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {mockPosts.slice(0, 2).map((post, i) => (
            <ActivityCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Terminal, title: 'Log your output', desc: 'One CLI command. All your sessions tracked across providers.' },
            { icon: Share2, title: 'Share your sessions', desc: 'Beautiful activity cards. Show the world what you shipped.' },
            { icon: Trophy, title: 'Chase the leaderboard', desc: 'Compete globally or by country. Maintain your streak.' },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-6 space-y-3">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Wall of Love */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-10">Wall of Love</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {mockTestimonials.map((t) => (
            <TestimonialCard key={t.id} author={t.author} handle={t.handle} content={t.content} provider={t.provider} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6">Your move.</h2>
        <Button asChild size="lg" className="text-base px-10">
          <Link to="/onboarding">
            Get Started — Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-3.5 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono font-bold">AWARTS</span>
          </div>
          <p>© 2026 AWARTS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
