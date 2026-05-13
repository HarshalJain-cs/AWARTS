'use client';
import { ReactLenis } from 'lenis/react';
import React, { forwardRef } from 'react';

interface SmoothScrollProps {
    children: React.ReactNode;
    root?: boolean;
}

const SmoothScroll = forwardRef<HTMLDivElement, SmoothScrollProps>(({ children, root = true }, ref) => {
    return (
        <ReactLenis root={root} options={{ lerp: 0.05, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.2 }}>
            <div ref={ref} className={!root ? 'h-full overflow-y-auto' : ''}>{children}</div>
        </ReactLenis>
    );
});

SmoothScroll.displayName = 'SmoothScroll';

export { SmoothScroll };
export default SmoothScroll;
