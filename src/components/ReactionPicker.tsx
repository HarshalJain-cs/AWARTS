import { useState, Component, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

const REACTIONS = [
  { type: 'fire', emoji: '\uD83D\uDD25', label: 'Fire' },
  { type: 'mind_blown', emoji: '\uD83E\uDD2F', label: 'Mind Blown' },
  { type: 'rocket', emoji: '\uD83D\uDE80', label: 'Rocket' },
  { type: 'heart', emoji: '\u2764\uFE0F', label: 'Heart' },
  { type: 'clap', emoji: '\uD83D\uDC4F', label: 'Clap' },
] as const;

interface ReactionPickerProps {
  postId: string;
}

// Silent error boundary — renders nothing on error instead of crashing the page
class ReactionErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ReactionPickerInner({ postId }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const data = useQuery(api.reactions.getReactions, { postId: postId as Id<'posts'> });
  const toggle = useMutation(api.reactions.toggleReaction);

  const handleReact = async (type: string) => {
    setOpen(false);
    try {
      await toggle({ postId: postId as Id<'posts'>, type });
    } catch {
      // silently fail
    }
  };

  if (!data) return null;

  const activeReactions = REACTIONS.filter((r) => (data.counts[r.type] ?? 0) > 0);

  return (
    <div className="flex items-center gap-1">
      {activeReactions.map((r) => (
        <button
          key={r.type}
          onClick={() => handleReact(r.type)}
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs border transition-all',
            data.myReaction === r.type
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-foreground/30'
          )}
        >
          <span>{r.emoji}</span>
          <span className="font-mono">{data.counts[r.type]}</span>
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <SmilePlus className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align="start">
          <div className="flex gap-1">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => handleReact(r.type)}
                className={cn(
                  'rounded-lg p-2 text-lg hover:bg-muted transition-colors',
                  data.myReaction === r.type && 'bg-primary/10'
                )}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ReactionPicker({ postId }: ReactionPickerProps) {
  return (
    <ReactionErrorBoundary>
      <ReactionPickerInner postId={postId} />
    </ReactionErrorBoundary>
  );
}
