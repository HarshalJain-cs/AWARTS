import { Comment } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCreateComment, useEditComment, useDeleteComment } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentThreadProps {
  postId: string;
  comments: Comment[];
}

function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const { user } = useAuth();
  const editComment = useEditComment();
  const deleteComment = useDeleteComment();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwn = user?.username === comment.user.username;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await editComment.mutateAsync({ commentId: comment.id, content: editContent.trim() });
      setEditing(false);
      toast({ title: 'Comment updated' });
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync(comment.id);
      toast({ title: 'Comment deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="flex gap-3 group">
      <Link to={`/u/${comment.user.username}`}>
        <img src={comment.user.avatar || '/placeholder.svg'} alt={comment.user.displayName} className="h-8 w-8 rounded-full object-cover" />
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link to={`/u/${comment.user.username}`} className="text-sm font-semibold text-foreground hover:underline">
            @{comment.user.username}
          </Link>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto p-1 rounded hover:bg-muted">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(comment.content); }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, 500))}
              className="min-h-[50px] resize-none bg-muted/50 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim() || editComment.isPending}>
                {editComment.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
        )}
      </div>
    </div>
  );
}

export function CommentThread({ postId, comments }: CommentThreadProps) {
  const { user } = useAuth();
  const createComment = useCreateComment();
  const [input, setInput] = useState('');

  const handleSubmit = async () => {
    if (!user || !input.trim()) return;
    try {
      await createComment.mutateAsync({ postId, content: input.trim() });
      setInput('');
    } catch {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} postId={postId} />
      ))}

      {user ? (
        <div className="flex gap-3 pt-2 border-t border-border">
          <img src={user.avatarUrl ?? ''} alt="You" className="h-8 w-8 rounded-full mt-1 object-cover" />
          <div className="flex-1 space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none bg-muted/50"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{input.length}/500</span>
              <Button size="sm" onClick={handleSubmit} disabled={!input.trim() || createComment.isPending}>
                {createComment.isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-border text-center">
          <Link to="/login" className="text-sm text-primary hover:underline">Sign in to comment</Link>
        </div>
      )}
    </div>
  );
}
