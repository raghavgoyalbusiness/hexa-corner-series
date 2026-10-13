'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { HeroScene } from '@/components/three/scenes';
import { useAudio } from '@/components/providers/AudioProvider';
import { Button } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { hero } from '@/lib/content';
import { range } from '@/lib/math';
import { scrollToId } from '@/lib/scroll';

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const formed = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const { requestDemo } = useAudio();

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 0,
    onUpdate: (p) => {
      if (copy.current) {
        const out = range(0.04, 0.34, p);
        copy.current.style.opacity = String(1 - out);
        copy.current.style.transform = `translate3d(0, ${-out * 60}px, 0)`;
      }
      // Caption inside the hexagon once all six speakers have formed up.
      if (formed.current) {
        const a = range(0.58, 0.72, p) * (1 - range(0.9, 1, p));
        formed.current.style.opacity = String(a);
        formed.current.style.transform = `scale(${0.96 + a * 0.04})`;
      }
    },
  });

  const hearIt = () => {
    requestDemo(); // unlocks audio inside this click
    scrollToId('demo');
  };

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      className={reduced ? 'relative h-screen' : 'relative h-[260vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Warm room glow behind the canvas. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 42%, rgba(232,168,102,0.16), transparent 70%), radial-gradient(90% 60% at 50% 110%, rgba(42,38,34,0.9), transparent 70%), #0E0D0C',
          }}
        />
        <SceneCanvas
          eager
          className="absolute inset-0"
          camera={{ position: [0, 0, 6], fov: 35 }}
          fallback={<SceneFallback src="/fallbacks/placeholder-speaker.svg" alt="HEXA corner speaker" />}
        >
          <HeroScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>

        <div
          ref={formed}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 pb-[2vh] text-center"
          style={{ opacity: 0 }}
        >
          <p className="eyebrow !text-amber">{hero.formation.eyebrow}</p>
          <p className="display text-[clamp(0.85rem,1.6vw,1.25rem)] !leading-relaxed">
            {hero.formation.line1}
            <br />
            {hero.formation.line2}
          </p>
        </div>

        <div ref={copy} className="site-x relative flex h-full flex-col pb-8 pt-24 sm:pb-10">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            {hero.eyebrow}
          </motion.p>

          <div className="flex-1" />

          <div className="space-y-6 text-center sm:space-y-7">
            <motion.h1
              className="display text-[clamp(1.6rem,6.2vw,5.6rem)] !tracking-[0.22em] sm:!tracking-wide3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, ease, delay: 0.35 }}
            >
              {hero.title}
            </motion.h1>
            <motion.p
              className="body-copy mx-auto max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
            >
              {hero.sub}
            </motion.p>
            <motion.div
              className="flex flex-col items-center justify-center gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 1 }}
            >
              <Button onClick={() => scrollToId('waitlist')}>{hero.primaryCta}</Button>
              <Button variant="ghost" onClick={hearIt} aria-describedby="hear-it-note">
                <PlayGlyph />
                {hero.secondaryCta}
              </Button>
              <span id="hear-it-note" className="sr-only">
                Turns sound on and plays the spatial audio demo.
              </span>
            </motion.div>
          </div>

          <div className="mt-8 flex items-center justify-center" aria-hidden>
            <span className="eyebrow !text-[10px]">Scroll</span>
            <span className="ml-3 block h-px w-10 bg-bone/30" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M2 1.2v7.6L8.6 5z" fill="currentColor" />
    </svg>
  );
}
