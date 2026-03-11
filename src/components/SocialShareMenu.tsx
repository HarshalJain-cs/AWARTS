import { useState, useRef, useCallback } from 'react';
import { Share2, X, MessageCircle, Instagram, Linkedin, Copy, Check, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';
import { PlatformShareCard, type SharePlatform, type PlatformCardData } from './PlatformShareCard';

type ShareTemplate = 'flex' | 'minimal' | 'detailed';

interface ShareData {
  type: 'session' | 'profile';
  username: string;
  url: string;
  avatarUrl?: string;
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

/** Convert data URL to Blob */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Try native Web Share API with image file */
async function tryNativeShare(imageDataUrl: string, text: string, url: string, filename: string): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    const blob = await dataUrlToBlob(imageDataUrl);
    const file = new File([blob], filename, { type: 'image/png' });
    const shareData = { text, url, files: [file] };
    if (!navigator.canShare(shareData)) return false;
    await navigator.share(shareData);
    return true;
  } catch (err) {
    // User cancelled or not supported
    if (err instanceof Error && err.name === 'AbortError') return true; // user cancelled is still "handled"
    return false;
  }
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
  const [generating, setGenerating] = useState<SharePlatform | 'all' | null>(null);

  // Refs for platform-specific hidden cards
  const xRef = useRef<HTMLDivElement>(null);
  const igRef = useRef<HTMLDivElement>(null);
  const liRef = useRef<HTMLDivElement>(null);
  const waRef = useRef<HTMLDivElement>(null);

  const platformRefs: Record<SharePlatform, React.RefObject<HTMLDivElement | null>> = {
    x: xRef,
    instagram: igRef,
    linkedin: liRef,
    whatsapp: waRef,
  };

  const text = generateText(data, template);

  const cardData: PlatformCardData = {
    type: data.type,
    username: data.username,
    avatarUrl: data.avatarUrl,
    cost: data.cost,
    tokens: data.tokens,
    providers: data.providers,
    streak: data.streak,
    date: data.date,
    totalCost: data.totalCost,
    totalDays: data.totalDays,
    followers: data.followers,
  };

  const generateImage = useCallback(async (platform: SharePlatform): Promise<string | null> => {
    const ref = platformRefs[platform];
    if (!ref.current) return null;
    try {
      // Double render: first pass warms up, second captures
      await toPng(ref.current, { quality: 1, pixelRatio: 2, skipFonts: true, cacheBust: true });
      const dataUrl = await toPng(ref.current, { quality: 1, pixelRatio: 2, skipFonts: true, cacheBust: true });
      return dataUrl;
    } catch {
      return null;
    }
  }, [platformRefs]);

  const downloadImage = useCallback(async (platform: SharePlatform) => {
    const dataUrl = await generateImage(platform);
    if (!dataUrl) {
      toast({ title: 'Failed to generate image', variant: 'destructive' });
      return null;
    }
    const link = document.createElement('a');
    link.download = `awarts-${data.username}-${platform}.png`;
    link.href = dataUrl;
    link.click();
    return dataUrl;
  }, [generateImage, data.username]);

  const handlePlatformShare = useCallback(async (platform: SharePlatform) => {
    setGenerating(platform);
    try {
      const dataUrl = await generateImage(platform);
      if (!dataUrl) {
        toast({ title: 'Failed to generate image', variant: 'destructive' });
        return;
      }

      // Try native share API first (mobile — shares image directly to app)
      const filename = `awarts-${data.username}-${platform}.png`;
      const shared = await tryNativeShare(dataUrl, text, data.url, filename);

      if (shared) {
        toast({ title: 'Shared!', description: 'Your AWARTS card was shared.' });
        setOpen(false);
        return;
      }

      // Fallback: download image + copy caption + open platform URL
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      await navigator.clipboard.writeText(text).catch(() => {});

      const platformName = platform === 'x' ? 'X' : platform === 'instagram' ? 'Instagram' : platform === 'linkedin' ? 'LinkedIn' : 'WhatsApp';
      const encoded = encodeURIComponent(text);

      switch (platform) {
        case 'x':
          window.open(`https://x.com/intent/tweet?text=${encoded}`, '_blank', 'noopener,noreferrer');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'instagram':
          break;
      }

      toast({
        title: `${platformName} card downloaded!`,
        description: platform === 'instagram'
          ? 'Image saved! Open Instagram and share it as a post or story.'
          : 'Image saved & caption copied! Attach the image to your post.',
      });

      if (platform !== 'instagram') {
        setOpen(false);
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  }, [generateImage, text, data.url, data.username]);

  const handleDownloadAll = useCallback(async () => {
    setGenerating('all');
    for (const platform of ['x', 'instagram', 'linkedin', 'whatsapp'] as SharePlatform[]) {
      await downloadImage(platform);
    }
    toast({ title: 'All cards downloaded!', description: '4 platform-specific images saved.' });
    setGenerating(null);
  }, [downloadImage]);

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
    <>
      {/* Hidden container for platform cards — uses overflow:hidden to clip while keeping cards renderable */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -9999,
        }}
        aria-hidden
      >
        <PlatformShareCard ref={xRef} platform="x" data={cardData} />
        <PlatformShareCard ref={igRef} platform="instagram" data={cardData} />
        <PlatformShareCard ref={liRef} platform="linkedin" data={cardData} />
        <PlatformShareCard ref={waRef} platform="whatsapp" data={cardData} />
      </div>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in" onClick={() => setOpen(false)}>
        <div
          className="w-full max-w-md bg-card border border-border rounded-t-xl sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Share {data.type === 'session' ? 'Session' : 'Profile'}</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
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

          {/* Caption Preview */}
          <div className="rounded-lg border border-border bg-muted/20 p-3 max-h-32 overflow-y-auto">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Caption</p>
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
          </div>

          {/* Platform share buttons */}
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Share with photo card</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlatformShare('x')}
                disabled={generating !== null}
                className="gap-2"
              >
                {generating === 'x' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                )}
                X Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlatformShare('whatsapp')}
                disabled={generating !== null}
                className="gap-2"
              >
                {generating === 'whatsapp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                WhatsApp Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlatformShare('instagram')}
                disabled={generating !== null}
                className="gap-2"
              >
                {generating === 'instagram' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
                Instagram Card
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlatformShare('linkedin')}
                disabled={generating !== null}
                className="gap-2"
              >
                {generating === 'linkedin' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
                LinkedIn Card
              </Button>
            </div>
          </div>

          {/* Utility row */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadAll}
              disabled={generating !== null}
              className="flex-1 gap-2 text-xs"
            >
              {generating === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download All Cards
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="flex-1 gap-2 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Caption'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
