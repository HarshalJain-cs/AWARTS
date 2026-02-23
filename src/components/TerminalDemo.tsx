import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const lines = [
  { text: '$ bunx straude', delay: 0 },
  { text: '', delay: 800 },
  { text: '  Scanning session data...', delay: 1200 },
  { text: '  Found 3 sessions across 2 providers', delay: 2000 },
  { text: '', delay: 2200 },
  { text: '  ┌──────────────────────────────────────┐', delay: 2500 },
  { text: '  │ Provider    Cost      Tokens    Sess. │', delay: 2600 },
  { text: '  ├──────────────────────────────────────┤', delay: 2700 },
  { text: '  │ Claude      $12.40    245K      2     │', delay: 2900 },
  { text: '  │ Codex       $4.20     89K       1     │', delay: 3100 },
  { text: '  ├──────────────────────────────────────┤', delay: 3300 },
  { text: '  │ Total       $16.60    334K      3     │', delay: 3500 },
  { text: '  └──────────────────────────────────────┘', delay: 3600 },
  { text: '', delay: 3800 },
  { text: '  ✓ POSTED to straude.com/u/alexdev', delay: 4000 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-[hsl(224,25%,6%)] p-4 font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="h-3 w-3 rounded-full bg-destructive/60" />
        <div className="h-3 w-3 rounded-full bg-gold/60" />
        <div className="h-3 w-3 rounded-full bg-codex/60" />
      </div>
      <div className="space-y-0.5">
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              i === 0
                ? 'text-foreground'
                : line.text.includes('✓')
                ? 'text-codex'
                : line.text.includes('Claude')
                ? 'text-claude'
                : line.text.includes('Codex')
                ? 'text-codex'
                : 'text-muted-foreground'
            }
          >
            {line.text || '\u00A0'}
          </motion.div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-foreground animate-pulse" />
        )}
      </div>
    </div>
  );
}
