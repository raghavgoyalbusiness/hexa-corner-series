import type { MutableRefObject } from 'react';
import type { Progress } from '@/hooks/useScrubProgress';

export type SceneProps = {
  /** Scroll progress through the section (0..1). Read inside useFrame. */
  progress: MutableRefObject<Progress>;
  /** Simplified scene: fewer particles / rings, no post-processing. */
  mobile: boolean;
  /** prefers-reduced-motion: no idle animation; progress is a fixed still. */
  reduced: boolean;
};
