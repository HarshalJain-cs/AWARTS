'use client';
import { ReactLenis } from 'lenis/react';
import React, { forwardRef } from 'react';

interface SmoothScrollProps {
    children: React.ReactNode;
}

const SmoothScroll = forwardRef<HTMLDivElement, SmoothScrollProps>(({ children }, ref) => {
    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
            <div ref={ref}>{children}</div>
        </ReactLenis>
    );
});

SmoothScroll.displayName = 'SmoothScroll';

export { SmoothScroll };
export default SmoothScroll;
