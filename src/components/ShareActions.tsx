import { useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Link2, Image, Download, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareActionsProps {
  cardRef: RefObject<HTMLDivElement | null>;
  username: string;
}

export function ShareActions({ cardRef, username }: ShareActionsProps) {
  const [copying, setCopying] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const profileUrl = `${window.location.origin}/u/${username}`;

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
      // Render twice for font loading
      await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      return dataUrl;
    } catch (err) {
      console.error('Image generation failed:', err);
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
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
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
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex-1 min-w-[120px]"
      >
        {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
        {linkCopied ? 'Copied!' : 'Copy Link'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyImage}
        disabled={copying}
        className="flex-1 min-w-[120px]"
      >
        <Image className="h-4 w-4 mr-2" />
        {copying ? 'Copying...' : 'Copy Image'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPng}
        disabled={downloadingPng}
        className="flex-1 min-w-[120px]"
      >
        <Download className="h-4 w-4 mr-2" />
        {downloadingPng ? 'Saving...' : 'Download PNG'}
      </Button>
    </div>
  );
}
