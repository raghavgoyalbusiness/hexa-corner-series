'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import { AudioProvider } from './AudioProvider';
import { SmoothScroll } from './SmoothScroll';

export function Providers({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user": Framer drops transforms but keeps fades when the OS asks.
    <MotionConfig reducedMotion="user">
      <AudioProvider>
        <SmoothScroll>{children}</SmoothScroll>
      </AudioProvider>
    </MotionConfig>
  );
}
