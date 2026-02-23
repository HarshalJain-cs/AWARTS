import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle?: () => void;
  size?: 'sm' | 'default';
}

export function FollowButton({ isFollowing: initial, onToggle, size = 'sm' }: FollowButtonProps) {
  const [following, setFollowing] = useState(initial);
  const [hovering, setHovering] = useState(false);

  const handleClick = () => {
    setFollowing(!following);
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
