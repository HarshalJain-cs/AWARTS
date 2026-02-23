import { useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KudosButtonProps {
  count: number;
  hasKudosed: boolean;
  onToggle?: () => void;
}

export function KudosButton({ count, hasKudosed, onToggle }: KudosButtonProps) {
  const [active, setActive] = useState(hasKudosed);
  const [localCount, setLocalCount] = useState(count);

  const handleClick = () => {
    setActive(!active);
    setLocalCount(active ? localCount - 1 : localCount + 1);
    onToggle?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <motion.span
        key={active ? 'active' : 'inactive'}
        initial={{ scale: 1 }}
        animate={active ? { scale: [1, 1.4, 1], rotate: [0, -15, 0] } : {}}
        transition={{ duration: 0.4, type: 'spring' }}
      >
        <Zap className={cn('h-4 w-4', active && 'fill-primary')} />
      </motion.span>
      {localCount}
    </button>
  );
}
