import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useToggleFollow } from '@/hooks/use-api';
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
  const toggleFollow = useToggleFollow();
  const [following, setFollowing] = useState(initial);
  const [hovering, setHovering] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const next = !following;
    setFollowing(next);

    toggleFollow.mutate(
      { targetUserId, isFollowing: following },
      {
        onError: () => {
          setFollowing(following);
          toast({ title: 'Failed to update follow', variant: 'destructive' });
        },
      }
    );
    toast({ title: next ? `Followed${username ? ` @${username}` : ''}` : `Unfollowed${username ? ` @${username}` : ''}` });
    onToggle?.();
  };

  return (
    <Button
      variant={following ? 'secondary' : 'default'}
      size={size}
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        'min-w-[90px] transition-colors',
        following && hovering && 'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20'
      )}
    >
      {following ? (hovering ? 'Unfollow' : 'Following') : 'Follow'}
    </Button>
  );
}
