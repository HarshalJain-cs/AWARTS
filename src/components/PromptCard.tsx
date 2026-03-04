import { ChevronUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';

interface PromptCardProps {
  prompt: {
    _id: string;
    content: string;
    isAnonymous: boolean;
    status: string;
    _creationTime: number;
    author: {
      _id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    } | null;
    voteCount: number;
    hasVoted: boolean;
    isOwn: boolean;
  };
  onVote: (promptId: string) => void;
  isAuthenticated: boolean;
}

export function PromptCard({ prompt, onVote, isAuthenticated }: PromptCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Content */}
      <p className="text-sm text-foreground whitespace-pre-wrap">{prompt.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {prompt.author ? (
            <Link
              to={`/u/${prompt.author.username}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              {prompt.author.avatarUrl ? (
                <img
                  src={prompt.author.avatarUrl}
                  alt={prompt.author.username}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              @{prompt.author.username}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Anonymous
            </span>
          )}
          <span>·</span>
          <span>{formatDate(new Date(prompt._creationTime).toISOString())}</span>
          {prompt.status !== 'pending' && (
            <>
              <span>·</span>
              <span className={cn(
                'capitalize font-medium',
                prompt.status === 'merged' && 'text-green-500',
                prompt.status === 'approved' && 'text-blue-500',
                prompt.status === 'rejected' && 'text-red-500',
              )}>
                {prompt.status}
              </span>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVote(prompt._id)}
          disabled={!isAuthenticated}
          className={cn(
            'flex items-center gap-1 px-2 h-7',
            prompt.hasVoted && 'text-primary'
          )}
        >
          <ChevronUp className={cn('h-4 w-4', prompt.hasVoted && 'fill-primary')} />
          <span className="text-xs font-medium">{prompt.voteCount}</span>
        </Button>
      </div>
    </div>
  );
}
