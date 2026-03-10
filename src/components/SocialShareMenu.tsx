import { useState } from 'react';
import { Share2, X, MessageCircle, Instagram, Linkedin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type ShareTemplate = 'flex' | 'minimal' | 'detailed';

interface ShareData {
  type: 'session' | 'profile';
  username: string;
  url: string;
  // Session-specific
  cost?: number;
  tokens?: number;
  providers?: string[];
  streak?: number;
  date?: string;
  // Profile-specific
  totalCost?: number;
  totalDays?: number;
  followers?: number;
}

const TEMPLATES: { id: ShareTemplate; label: string; desc: string }[] = [
  { id: 'flex', label: 'Flex', desc: 'Show off your stats' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean and simple' },
  { id: 'detailed', label: 'Detailed', desc: 'Full breakdown' },
];

function generateText(data: ShareData, template: ShareTemplate): string {
  const { type, username, url } = data;

  if (type === 'session') {
    const cost = data.cost?.toFixed(2) ?? '0.00';
    const tokens = data.tokens ? formatTokensShort(data.tokens) : '0';
    const providerList = data.providers?.join(', ') ?? '';
    const date = data.date ?? 'today';

    switch (template) {
      case 'flex':
        return `Just shipped with AI! $${cost} spent, ${tokens} tokens generated across ${providerList}. Every session counts.\n\nTrack yours on AWARTS:\n${url}`;
      case 'minimal':
        return `AI coding session: $${cost} | ${tokens} tokens | ${providerList}\n\n${url}`;
      case 'detailed':
        return `Session Report (${date})\nCost: $${cost}\nTokens: ${tokens}\nProviders: ${providerList}${data.streak ? `\nStreak: ${data.streak} days` : ''}\n\nTracked with AWARTS - the Strava for AI coding\n${url}`;
    }
  } else {
    const totalCost = data.totalCost?.toFixed(2) ?? '0.00';
    const days = data.totalDays ?? 0;
    const streak = data.streak ?? 0;

    switch (template) {
      case 'flex':
        return `I've spent $${totalCost} on AI coding across ${days} days with a ${streak}-day streak! Think you can beat that?\n\nJoin AWARTS and find out:\n${url}`;
      case 'minimal':
        return `@${username} on AWARTS: $${totalCost} spent | ${days} days active | ${streak}-day streak\n\n${url}`;
      case 'detailed':
        return `My AI Coding Stats (@${username})\nTotal Spent: $${totalCost}\nDays Active: ${days}\nCurrent Streak: ${streak} days${data.followers ? `\nFollowers: ${data.followers}` : ''}\n\nTracked with AWARTS\n${url}`;
    }
  }
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function shareToX(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(`https://x.com/intent/tweet?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

function shareToWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

function shareToLinkedIn(url: string) {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
}

function copyForInstagram(text: string) {
  navigator.clipboard.writeText(text);
  toast({
    title: 'Copied for Instagram!',
    description: 'Paste this as your Instagram story or post caption.',
  });
}

interface SocialShareMenuProps {
  data: ShareData;
  trigger?: React.ReactNode;
  className?: string;
}

export function SocialShareMenu({ data, trigger, className }: SocialShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<ShareTemplate>('flex');
  const [copied, setCopied] = useState(false);

  const text = generateText(data, template);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) {
    return (
      <span onClick={() => setOpen(true)} className={cn('cursor-pointer', className)}>
        {trigger ?? (
          <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md bg-card border border-border rounded-t-xl sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Share {data.type === 'session' ? 'Session' : 'Profile'}</h3>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Template picker */}
        <div className="flex gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-left transition-all text-xs',
                template === t.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              <p className="font-medium">{t.label}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border bg-muted/20 p-3 max-h-40 overflow-y-auto">
          <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { shareToX(text); setOpen(false); }}
            className="gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Post on X
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { shareToWhatsApp(text); setOpen(false); }}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { copyForInstagram(text); }}
            className="gap-2"
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { shareToLinkedIn(data.url); setOpen(false); }}
            className="gap-2"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 col-span-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>
        </div>
      </div>
    </div>
  );
}
