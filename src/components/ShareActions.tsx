import { useState, useRef, useCallback, type RefObject } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Link2, Image, Download, Check, MessageCircle, Instagram, Linkedin, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PlatformShareCard, type SharePlatform, type PlatformCardData } from './PlatformShareCard';

interface ShareActionsProps {
  cardRef: RefObject<HTMLDivElement | null>;
  username: string;
  avatarUrl?: string;
  providers?: string[];
  stats?: {
    totalCost?: number;
    totalDays?: number;
    streak?: number;
  };
}

export function ShareActions({ cardRef, username, avatarUrl, providers, stats }: ShareActionsProps) {
  const [copying, setCopying] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generating, setGenerating] = useState<SharePlatform | null>(null);

  const xRef = useRef<HTMLDivElement>(null);
  const igRef = useRef<HTMLDivElement>(null);
  const liRef = useRef<HTMLDivElement>(null);
  const waRef = useRef<HTMLDivElement>(null);

  const platformRefs: Record<SharePlatform, RefObject<HTMLDivElement | null>> = {
    x: xRef, instagram: igRef, linkedin: liRef, whatsapp: waRef,
  };

  const profileUrl = `${window.location.origin}/u/${username}`;
  const shareText = `I've spent $${stats?.totalCost?.toFixed(2) ?? '0.00'} on AI coding across ${stats?.totalDays ?? 0} days with a ${stats?.streak ?? 0}-day streak on AWARTS! Check out my stats:`;

  const cardData: PlatformCardData = {
    type: 'profile',
    username,
    avatarUrl,
    totalCost: stats?.totalCost,
    totalDays: stats?.totalDays,
    streak: stats?.streak,
    providers,
  };

  const generatePlatformImage = useCallback(async (platform: SharePlatform): Promise<string | null> => {
    const ref = platformRefs[platform];
    if (!ref.current) return null;
    try {
      await toPng(ref.current, { quality: 1, pixelRatio: 2 });
      return await toPng(ref.current, { quality: 1, pixelRatio: 2 });
    } catch {
      return null;
    }
  }, [platformRefs]);

  const downloadPlatformImage = useCallback(async (platform: SharePlatform) => {
    const dataUrl = await generatePlatformImage(platform);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `awarts-${username}-${platform}.png`;
    link.href = dataUrl;
    link.click();
    return dataUrl;
  }, [generatePlatformImage, username]);

  const handlePlatformShare = useCallback(async (platform: SharePlatform) => {
    setGenerating(platform);
    try {
      await downloadPlatformImage(platform);
      await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);

      const encoded = encodeURIComponent(`${shareText}\n${profileUrl}`);
      switch (platform) {
        case 'x':
          window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, '_blank', 'noopener,noreferrer');
          break;
        case 'instagram':
          break;
      }

      toast({
        title: `${platform === 'x' ? 'X' : platform === 'instagram' ? 'Instagram' : platform === 'linkedin' ? 'LinkedIn' : 'WhatsApp'} card downloaded!`,
        description: platform === 'instagram'
          ? 'Image saved! Open Instagram and share it as a post or story.'
          : 'Image saved! Attach it to your post for a visual card.',
      });
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  }, [downloadPlatformImage, shareText, profileUrl]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      toast({ title: 'Link copied!', description: profileUrl });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', description: 'Could not access clipboard.', variant: 'destructive' });
    }
  }

  async function generatePng(): Promise<string | null> {
    if (!cardRef.current) return null;
    try {
      await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      return dataUrl;
    } catch {
      return null;
    }
  }

  async function handleCopyImage() {
    setCopying(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) throw new Error('Failed to generate image');
      const res = await fetch(dataUrl);
      if (!res.ok) throw new Error('Failed to convert image');
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast({ title: 'Image copied!', description: 'Paste it anywhere to share.' });
    } catch {
      toast({ title: 'Failed to copy image', description: 'Try downloading the PNG instead.', variant: 'destructive' });
    } finally {
      setCopying(false);
    }
  }

  async function handleDownloadPng() {
    setDownloadingPng(true);
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) throw new Error('Failed to generate image');
      const link = document.createElement('a');
      link.download = `awarts-${username}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: 'Downloaded!', description: `awarts-${username}.png saved.` });
    } catch {
      toast({ title: 'Download failed', description: 'Could not generate the image.', variant: 'destructive' });
    } finally {
      setDownloadingPng(false);
    }
  }

  return (
    <>
      {/* Hidden platform cards for image generation */}
      <PlatformShareCard ref={xRef} platform="x" data={cardData} />
      <PlatformShareCard ref={igRef} platform="instagram" data={cardData} />
      <PlatformShareCard ref={liRef} platform="linkedin" data={cardData} />
      <PlatformShareCard ref={waRef} platform="whatsapp" data={cardData} />

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1 min-w-[120px]">
          {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
          {linkCopied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyImage} disabled={copying} className="flex-1 min-w-[120px]">
          <Image className="h-4 w-4 mr-2" />
          {copying ? 'Copying...' : 'Copy Image'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPng} disabled={downloadingPng} className="flex-1 min-w-[120px]">
          <Download className="h-4 w-4 mr-2" />
          {downloadingPng ? 'Saving...' : 'Download PNG'}
        </Button>

        {/* Platform-specific share buttons with image cards */}
        <div className="w-full pt-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Share with photo card</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlatformShare('x')}
              disabled={generating !== null}
              className="flex-1 gap-1.5 text-xs"
            >
              {generating === 'x' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              )}
              X Card
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlatformShare('whatsapp')}
              disabled={generating !== null}
              className="flex-1 gap-1.5 text-xs"
            >
              {generating === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
              WhatsApp
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlatformShare('instagram')}
              disabled={generating !== null}
              className="flex-1 gap-1.5 text-xs"
            >
              {generating === 'instagram' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Instagram className="h-3.5 w-3.5" />}
              Instagram
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlatformShare('linkedin')}
              disabled={generating !== null}
              className="flex-1 gap-1.5 text-xs"
            >
              {generating === 'linkedin' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Linkedin className="h-3.5 w-3.5" />}
              LinkedIn
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
