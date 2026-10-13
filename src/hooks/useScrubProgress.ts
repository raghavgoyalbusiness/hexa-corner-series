'use client';

import { useRef, type RefObject } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';

export type Progress = { value: number };

/**
 * Tracks how far the viewport has travelled through a tall "sticky" section
 * (0 when its top hits the top of the viewport, 1 when its bottom reaches the
 * bottom). 3D scenes read the returned ref inside useFrame and damp toward it.
 *
 * With reduced motion the section is not tall and progress is frozen at
 * `staticValue`, so the scene renders one meaningful still frame.
 */
export function useScrubProgress(
  ref: RefObject<HTMLElement>,
  { reduced, staticValue, onUpdate }: { reduced: boolean; staticValue: number; onUpdate?: (p: number) => void },
) {
  const progress = useRef<Progress>({ value: reduced ? staticValue : 0 });

  useGSAP(
    () => {
      if (reduced) {
        progress.current.value = staticValue;
        onUpdate?.(staticValue);
        return;
      }
      const st = ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progress.current.value = self.progress;
          onUpdate?.(self.progress);
        },
      });
      progress.current.value = st.progress;
      return () => st.kill();
    },
    { dependencies: [reduced], scope: ref },
  );

  return progress;
}
