'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { SubHeroScene } from '@/components/three/scenes';
import { useAudio } from '@/components/providers/AudioProvider';
import { Button } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { sub } from '@/lib/content';
import { range } from '@/lib/math';
import { scrollToId } from '@/lib/scroll';

const ease = [0.22, 1, 0.36, 1] as const;

export function SubHero() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const { requestLowEnd } = useAudio();

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 0,
    onUpdate: (p) => {
      if (!copy.current) return;
      const out = range(0.25, 0.75, p);
      copy.current.style.opacity = String(1 - out);
      copy.current.style.transform = `translate3d(0, ${-out * 50}px, 0)`;
    },
  });

  const feelIt = () => {
    requestLowEnd(); // unlocks audio inside this click
    scrollToId('low-end');
  };

  return (
    <section
      ref={ref}
      id="top"
      aria-label="The Corner Sub"
      className={reduced ? 'relative h-screen' : 'relative h-[190vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-charcoal">
        <SceneCanvas
          eager
          className="absolute inset-0"
          camera={{ position: [11, 6, 11], fov: 34, near: 0.1, far: 80 }}
          fallback={<SceneFallback src="/fallbacks/placeholder-sub.svg" alt="The Corner Sub in a floor corner" />}
        >
          <SubHeroScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(14,13,12,0.92) 0%, rgba(14,13,12,0.55) 38%, transparent 62%), linear-gradient(0deg, rgba(14,13,12,0.7), transparent 30%)',
          }}
        />

        <div
          ref={copy}
          className="site-x relative flex h-full flex-col justify-end pb-14 pt-24 lg:justify-center lg:pb-0"
        >
          <div className="max-w-xl space-y-7">
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
            >
              {sub.hero.eyebrow}
            </motion.p>
            <motion.h1
              className="display text-[clamp(1.5rem,3.4vw,3rem)] !tracking-[0.2em] sm:!tracking-wide3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, ease, delay: 0.35 }}
            >
              {sub.hero.title}
            </motion.h1>
            <motion.p
              className="body-copy max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
            >
              {sub.hero.sub}
            </motion.p>
            <motion.div
              className="flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 1 }}
            >
              <Button onClick={() => scrollToId('waitlist')}>{sub.hero.primaryCta}</Button>
              <Button variant="ghost" onClick={feelIt} aria-describedby="feel-it-note">
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <path d="M2 1.2v7.6L8.6 5z" fill="currentColor" />
                </svg>
                {sub.hero.secondaryCta}
              </Button>
              <span id="feel-it-note" className="sr-only">
                Turns sound on and plays the bass preview.
              </span>
            </motion.div>
            <p className="text-xs font-light text-bone/40">Concept product. Details below are targets, not final specs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
