import React from 'react';
import { Provider } from '@/lib/types';
import { PROVIDERS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProviderChipProps {
  provider: Provider;
  size?: 'sm' | 'md';
  className?: string;
}

export const ProviderChip = React.forwardRef<HTMLSpanElement, ProviderChipProps>(
  ({ provider, size = 'sm', className }, ref) => {
    const config = PROVIDERS[provider];
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          config.bgClass,
          config.textClass,
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          className
        )}
      >
        <span className={cn('rounded-full', config.dotClass, size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
        {config.name}
      </span>
    );
  }
);
ProviderChip.displayName = 'ProviderChip';
