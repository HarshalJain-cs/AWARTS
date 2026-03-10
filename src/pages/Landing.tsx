import { Link } from 'react-router-dom';
import { TerminalDemo } from '@/components/TerminalDemo';
import { TestimonialCard } from '@/components/TestimonialCard';
import { ActivityCard } from '@/components/ActivityCard';
import { mockPosts, mockTestimonials } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { EtheralShadow } from '@/components/ui/etheral-shadow';
import { ArrowRight, Terminal, Share2, Trophy, Copy, Menu, X, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';

function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

export default function Landing() {
  const [copied, setCopied] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  const countries = useCounter(195);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const copyCommand = () => {
    navigator.clipboard.writeText('npx awarts@latest');
    setCopied(true);
    toast({ title: 'Copied!', description: 'CLI command copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <SEO
        canonical="/"
        keywords="AI coding tracker, Strava for coding, Claude tracker, Codex tracker, Gemini tracker, AI session tracker, developer leaderboard, coding streak, AI usage tracker, Claude Code tracker, code Strava, Antigravity tracker, AI developer tools, coding competition, developer stats, token tracker, AI cost tracker"
      />

      {/* Ethereal Shadow Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <EtheralShadow
          color="rgba(232, 122, 53, 0.12)"
          animation={{ scale: 60, speed: 40 }}
          noise={{ opacity: 0.3, scale: 1.2 }}
          sizing="fill"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-5 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono text-lg font-bold text-foreground">AWARTS</span>
          </Link>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Button asChild size="sm">
              <Link to="/onboarding">Get Started</Link>
            </Button>
          </div>
          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenu && (
          <div className="sm:hidden border-t border-border bg-background px-4 py-3 space-y-2 animate-fade-in">
            <Link to="/docs" className="block text-sm text-muted-foreground hover:text-foreground py-1" onClick={() => setMobileMenu(false)}>Docs</Link>
            <Link to="/login" className="block text-sm text-muted-foreground hover:text-foreground py-1" onClick={() => setMobileMenu(false)}>Log in</Link>
            <Button asChild size="sm" className="w-full">
              <Link to="/onboarding" onClick={() => setMobileMenu(false)}>Get Started</Link>
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-16 text-center overflow-hidden">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-sm uppercase tracking-widest text-primary mb-4"
        >
          STRAVA FOR CLAUDE, CODEX, GEMINI & ANTIGRAVITY
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight"
        >
          Every AI coding session counts.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
        >
          The Strava for AI-assisted coding. Track sessions across Claude, Codex, Gemini & Antigravity. No API keys needed — reads from your local files. Compete on leaderboards worldwide.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
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
            <span>npx awarts@latest</span>
            <Copy className="h-3.5 w-3.5" />
            {copied && <span className="text-xs text-primary">Copied!</span>}
          </button>
        </motion.div>
      </section>

      {/* Terminal Demo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-2xl px-4 pb-20"
      >
        <TerminalDemo />
      </motion.section>

      {/* Platform highlights */}
      <section className="relative z-10 border-y border-border bg-muted/20 py-12">
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-8 text-center">
          <div ref={devs.ref}>
            <p className="font-mono text-3xl font-bold text-foreground">4</p>
            <p className="text-sm text-muted-foreground mt-1">AI providers supported</p>
          </div>
          <div ref={tokens.ref}>
            <p className="font-mono text-3xl font-bold text-foreground">100%</p>
            <p className="text-sm text-muted-foreground mt-1">free & open source</p>
          </div>
          <div ref={countries.ref}>
            <p className="font-mono text-3xl font-bold text-foreground">{countries.count}+</p>
            <p className="text-sm text-muted-foreground mt-1">countries supported</p>
          </div>
        </div>
      </section>

      {/* Sessions Visualized */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">Sessions visualized</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            See your AI coding activity come to life with detailed session cards and real-time leaderboards.
          </p>
        </motion.div>
        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {mockPosts.slice(0, 2).map((post, i) => (
            <ActivityCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Terminal, title: 'Log your output', desc: 'One CLI command. All your sessions tracked across providers.' },
            { icon: ShieldCheck, title: 'No API keys needed', desc: 'Reads local files from Claude, Codex, Gemini & Antigravity. Your API keys never leave your machine.' },
            { icon: Share2, title: 'Share your sessions', desc: 'Beautiful activity cards. Show the world what you shipped.' },
            { icon: Trophy, title: 'Chase the leaderboard', desc: 'Compete globally or by country. Maintain your streak.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-lg border border-border bg-card p-6 space-y-3"
            >
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Wall of Love */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-foreground text-center mb-10"
        >
          Wall of Love
        </motion.h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {mockTestimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <TestimonialCard author={t.author} handle={t.handle} content={t.content} provider={t.provider} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center"
      >
        <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6">Your move.</h2>
        <Button asChild size="lg" className="text-base px-10">
          <Link to="/onboarding">
            Get Started — Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-3.5 bg-primary" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }} />
            <span className="font-mono font-bold">AWARTS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <a href="https://github.com/HarshalJain-cs/AWARTS" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
          <p>&copy; {new Date().getFullYear()} AWARTS</p>
        </div>
      </footer>
    </div>
  );
}
