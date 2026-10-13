'use client';

import { useRef } from 'react';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { MacroScene } from '@/components/three/scenes';
import { Eyebrow } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { finish } from '@/lib/content';
import { smoothstep } from '@/lib/math';

export function PremiumFinish() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 0.5,
    onUpdate: (p) => {
      if (!copy.current) return;
      const a = smoothstep(0.15, 0.35, p) * (1 - smoothstep(0.85, 1, p));
      copy.current.style.opacity = String(a);
    },
  });

  return (
    <section
      ref={ref}
      id="finish"
      aria-labelledby="finish-title"
      className={reduced ? 'relative h-screen' : 'relative h-[260vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-charcoal">
        <SceneCanvas
          className="absolute inset-0"
          camera={{ position: [1.4, 0.5, 1], fov: 30, near: 0.01, far: 20 }}
          fallback={
            <SceneFallback
              src="/fallbacks/placeholder-macro.svg"
              alt="Macro close-up of the serrated ring and fabric grille"
            />
          }
        >
          <MacroScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(0deg, rgba(14,13,12,0.9), transparent 45%)' }}
        />
        <div className="site-x pointer-events-none relative flex h-full flex-col justify-end pb-16 sm:pb-24">
          <div ref={copy} className="max-w-xl space-y-5" style={{ opacity: reduced ? 1 : 0 }}>
            <Eyebrow>{finish.eyebrow}</Eyebrow>
            <h2 id="finish-title" className="display text-[clamp(1.5rem,3.6vw,3rem)]">
              {finish.title}
              <br />
              <span className="text-bone/50">{finish.sub}</span>
            </h2>
            <p className="body-copy max-w-md">{finish.detail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
