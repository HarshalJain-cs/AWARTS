import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface FollowButtonProps {
  isFollowing: boolean;
  username?: string;
  onToggle?: () => void;
  size?: 'sm' | 'default';
}

export function FollowButton({ isFollowing: initial, username, onToggle, size = 'sm' }: FollowButtonProps) {
  const [following, setFollowing] = useState(initial);
  const [hovering, setHovering] = useState(false);

  const handleClick = () => {
    const next = !following;
    setFollowing(next);
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
