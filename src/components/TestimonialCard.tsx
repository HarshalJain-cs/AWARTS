import { Provider } from '@/lib/types';

interface TestimonialCardProps {
  author: string;
  handle: string;
  content: string;
  provider?: Provider;
}

export function TestimonialCard({ author, handle, content, provider }: TestimonialCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2 break-inside-avoid">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
          {author[1]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{author}</p>
          <p className="text-xs text-muted-foreground">{handle}</p>
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{content}</p>
    </div>
  );
}
