'use client';

import { useRef } from 'react';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { ExplodedScene } from '@/components/three/scenes';
import { Eyebrow } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { exploded } from '@/lib/content';
import { smoothstep } from '@/lib/math';

export function ExplodedView() {
  const ref = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const progress = useScrubProgress(ref, {
    reduced,
    // Reduced motion: a single, fully exploded and labelled still.
    staticValue: 0.6,
    onUpdate: (p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (title.current) title.current.style.opacity = String(1 - smoothstep(0.12, 0.26, p) + smoothstep(0.8, 0.95, p));
    },
  });

  return (
    <section
      ref={ref}
      id="design"
      aria-label="Anatomy of the speaker"
      className={reduced ? 'relative h-screen' : 'relative h-[420vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'radial-gradient(70% 60% at 55% 50%, rgba(42,38,34,0.85), #0E0D0C 75%)' }}
        />
        <SceneCanvas
          className="absolute inset-0"
          camera={{ position: [0, 0.4, 9], fov: 32 }}
          fallback={
            <SceneFallback src="/fallbacks/placeholder-exploded.svg" alt="Exploded view of the speaker layers" />
          }
        >
          <ExplodedScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>

        <div className="site-x pointer-events-none relative flex h-full flex-col justify-between pb-10 pt-24">
          <div ref={title} className="max-w-md space-y-5">
            <Eyebrow>{exploded.eyebrow}</Eyebrow>
            <h2 className="display text-[clamp(1.25rem,3vw,2.4rem)]">{exploded.title}</h2>
          </div>

          {/* Screen-reader version of the callouts. */}
          <ol className="sr-only">
            {exploded.layers.map((l) => (
              <li key={l.key}>
                {l.title} ({l.note})
              </li>
            ))}
          </ol>

          <div className="flex items-center gap-4" aria-hidden>
            <span className="eyebrow !text-[10px]">Assembled</span>
            <span className="relative h-px w-40 overflow-hidden bg-bone/15">
              <span ref={bar} className="absolute inset-0 origin-left bg-amber" style={{ transform: 'scaleX(0)' }} />
            </span>
            <span className="eyebrow !text-[10px]">Reassembled</span>
          </div>
        </div>
      </div>
    </section>
  );
}
