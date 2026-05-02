import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  username?: string;
  onToggle?: () => void;
  size?: 'sm' | 'default';
}

export function FollowButton({ targetUserId, isFollowing: initial, username, onToggle, size = 'sm' }: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const followMutation = useMutation(api.social.follow);
  const unfollowMutation = useMutation(api.social.unfollow);
  const [following, setFollowing] = useState(initial);
  const [isPending, setIsPending] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Sync with server-driven prop when it changes (e.g. after Convex reactivity refetch)
  useEffect(() => { setFollowing(initial); }, [initial]);

  const handleClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isPending) return;

    const wasFollowing = following;
    const willFollow = !wasFollowing;

    // Optimistic update
    setFollowing(willFollow);
    setIsPending(true);

    try {
      const followingId = targetUserId as Id<"users">;
      if (willFollow) {
        await followMutation({ followingId });
      } else {
        await unfollowMutation({ followingId });
      }
      toast({ title: willFollow ? `Followed${username ? ` @${username}` : ''}` : `Unfollowed${username ? ` @${username}` : ''}` });
      onToggle?.();
    } catch (err) {
      // Revert on failure
      setFollowing(wasFollowing);
      toast({ title: 'Failed to update follow', variant: 'destructive' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={following ? 'secondary' : 'default'}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        'min-w-[90px] transition-all duration-200 hover:scale-105 active:scale-95',
        following && hovering && 'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20'
      )}
    >
      {isPending ? '...' : following ? (hovering ? 'Unfollow' : 'Following') : 'Follow'}
    </Button>
  );
}
