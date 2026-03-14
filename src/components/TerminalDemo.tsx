import { useEffect, useState, useRef, useCallback } from 'react';

const LINES = [
  { text: '$ bunx awarts', delay: 0, typewriter: true },
  { text: '', delay: 800 },
  { text: '  Scanning session data...', delay: 1200 },
  { text: '  Found 5 sessions across 4 providers', delay: 2000 },
  { text: '', delay: 2200 },
  { text: '  ┌──────────────────────────────────────────┐', delay: 2500 },
  { text: '  │ Provider       Cost      Tokens    Sess. │', delay: 2600 },
  { text: '  ├──────────────────────────────────────────┤', delay: 2700 },
  { text: '  │ Claude         $12.40    245K      2     │', delay: 2900 },
  { text: '  │ Codex          $4.20     89K       1     │', delay: 3100 },
  { text: '  │ Gemini         $3.10     112K      1     │', delay: 3300 },
  { text: '  │ Antigravity    $1.80     42K       1     │', delay: 3500 },
  { text: '  ├──────────────────────────────────────────┤', delay: 3700 },
  { text: '  │ Total          $21.50    488K      5     │', delay: 3900 },
  { text: '  └──────────────────────────────────────────┘', delay: 4000 },
  { text: '', delay: 4200 },
  { text: '  ✓ POSTED to awarts.com/u/alexdev', delay: 4400 },
];

function getLineColor(text: string, index: number): string {
  if (index === 0) return 'text-foreground';
  if (text.includes('✓')) return 'text-[hsl(142,71%,45%)]';
  if (text.includes('Claude')) return 'text-[hsl(24,95%,53%)]';
  if (text.includes('Codex')) return 'text-[hsl(142,71%,45%)]';
  if (text.includes('Gemini')) return 'text-[hsl(217,91%,60%)]';
  if (text.includes('Antigravity')) return 'text-[hsl(270,91%,65%)]';
  return 'text-muted-foreground';
}

export function TerminalDemo() {
  const [started, setStarted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Only start when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Typewriter effect for the first line
  const firstLineText = LINES[0].text;
  useEffect(() => {
    if (!started) return;
    const charTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i <= firstLineText.length; i++) {
      charTimers.push(
        setTimeout(() => setTypedChars(i), i * 50)
      );
    }
    // After typewriter finishes, mark first line as fully visible
    charTimers.push(
      setTimeout(() => setVisibleLines(1), firstLineText.length * 50)
    );
    timersRef.current = charTimers;
    return () => charTimers.forEach(clearTimeout);
  }, [started, firstLineText]);

  // Remaining lines appear after typewriter completes
  const typewriterDone = visibleLines >= 1;
  const startOffset = useCallback(() => firstLineText.length * 50, [firstLineText]);

  useEffect(() => {
    if (!typewriterDone) return;
    const offset = startOffset();
    const remaining = LINES.slice(1).map((line, i) =>
      setTimeout(() => setVisibleLines(i + 2), line.delay - LINES[1].delay + offset + 200)
    );
    timersRef.current.push(...remaining);
    return () => remaining.forEach(clearTimeout);
  }, [typewriterDone, startOffset]);

  const isAnimating = started && visibleLines < LINES.length;

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-border bg-[hsl(224,25%,6%)] p-4 font-mono text-sm overflow-hidden"
    >
      {/* Traffic light dots */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="h-3 w-3 rounded-full bg-destructive/60" />
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(45, 93%, 47%, 0.6)' }} />
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%, 0.6)' }} />
      </div>

      {/* Fixed-height container — all lines pre-rendered to reserve space */}
      <div className="space-y-0.5">
        {LINES.map((line, i) => {
          const isFirstLine = i === 0;
          const isVisible = i < visibleLines;
          const isTypewriting = isFirstLine && started && !isVisible;

          // First line: typewriter character reveal
          if (isFirstLine) {
            const displayText = isVisible
              ? line.text
              : isTypewriting
                ? line.text.slice(0, typedChars)
                : '';

            return (
              <div key={i} className={getLineColor(line.text, i)} style={{ minHeight: '1.25rem' }}>
                {displayText || '\u00A0'}
                {isTypewriting && (
                  <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            );
          }

          // Other lines: fade in when visible, but always reserve space
          return (
            <div
              key={i}
              className={`transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'} ${getLineColor(line.text, i)}`}
              style={{ minHeight: '1.25rem' }}
              aria-hidden={!isVisible}
            >
              {line.text || '\u00A0'}
            </div>
          );
        })}

        {/* Blinking cursor at the end while animating */}
        {isAnimating && visibleLines >= 1 && (
          <div style={{ minHeight: '1.25rem' }}>
            <span className="inline-block w-2 h-4 bg-foreground animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
