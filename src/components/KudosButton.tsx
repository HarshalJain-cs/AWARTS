import { useState, useEffect, forwardRef } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useToggleKudos } from '@/hooks/use-api';
import { useNavigate } from 'react-router-dom';

interface KudosButtonProps {
  postId: string;
  count: number;
  hasKudosed: boolean;
  onToggle?: () => void;
}

export const KudosButton = forwardRef<HTMLButtonElement, KudosButtonProps>(
  ({ postId, count, hasKudosed, onToggle }, ref) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toggleKudos = useToggleKudos();
    const [active, setActive] = useState(hasKudosed);
    const [localCount, setLocalCount] = useState(count);

    useEffect(() => { setActive(hasKudosed); }, [hasKudosed]);
    useEffect(() => { setLocalCount(count); }, [count]);

    const handleClick = () => {
      if (!user) {
        navigate('/login');
        return;
      }
      const next = !active;
      setActive(next);
      setLocalCount(next ? localCount + 1 : localCount - 1);

      toggleKudos.mutate({ postId, hasKudosed: active });
      toast({ title: next ? 'Kudos sent!' : 'Kudos removed' });
      onToggle?.();
    };

    return (
      <button
        ref={ref}
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
);

KudosButton.displayName = 'KudosButton';
