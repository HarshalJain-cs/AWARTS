import { Comment, User } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { currentUser } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentThreadProps {
  comments: Comment[];
}

export function CommentThread({ comments }: CommentThreadProps) {
  const [input, setInput] = useState('');
  const [localComments, setLocalComments] = useState(comments);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      user: currentUser,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setLocalComments([...localComments, newComment]);
    setInput('');
  };

  return (
    <div className="space-y-4">
      {localComments.map((c) => (
        <div key={c.id} className="flex gap-3">
          <Link to={`/u/${c.user.username}`}>
            <img src={c.user.avatar} alt={c.user.displayName} className="h-8 w-8 rounded-full" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link to={`/u/${c.user.username}`} className="text-sm font-semibold text-foreground hover:underline">
                @{c.user.username}
              </Link>
              <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}

      {/* Input */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <img src={currentUser.avatar} alt="You" className="h-8 w-8 rounded-full mt-1" />
        <div className="flex-1 space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none bg-muted/50"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={!input.trim()}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
