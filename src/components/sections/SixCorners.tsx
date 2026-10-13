'use client';

import { useRef } from 'react';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { RoomScene } from '@/components/three/scenes';
import { Eyebrow } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { corners } from '@/lib/content';
import { smoothstep } from '@/lib/math';

export function SixCorners() {
  const ref = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 0.9,
    onUpdate: (p) => {
      if (copy.current) {
        const a = smoothstep(0.28, 0.4, p);
        copy.current.style.opacity = String(a);
        copy.current.style.transform = `translate3d(0, ${(1 - a) * 20}px, 0)`;
      }
      if (count.current) {
        // Mirrors the speaker appearance timeline in RoomScene.
        const n = p < 0.36 ? 1 : Math.min(6, 2 + Math.floor((p - 0.36) / 0.065));
        count.current.textContent = String(n);
      }
    },
  });

  return (
    <section
      ref={ref}
      id="surround"
      aria-label="Six corners, full surround"
      className={reduced ? 'relative h-screen' : 'relative h-[420vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-charcoal">
        <SceneCanvas
          className="absolute inset-0"
          camera={{ position: [0, 4.4, 8.6], fov: 40, near: 0.05, far: 60 }}
          fallback={<SceneFallback src="/fallbacks/placeholder-room.svg" alt="Living room with six corner speakers" />}
        >
          <RoomScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{ background: 'linear-gradient(#0E0D0C, transparent)' }}
        />

        <div className="site-x pointer-events-none relative flex h-full flex-col justify-start pt-24">
          <div ref={copy} className="max-w-lg space-y-5" style={{ opacity: reduced ? 1 : 0 }}>
            <Eyebrow>{corners.eyebrow}</Eyebrow>
            <h2 className="display text-[clamp(1.4rem,3.4vw,2.8rem)]">{corners.title}</h2>
            <p className="body-copy max-w-sm">{corners.sub}</p>
            <p className="eyebrow pt-2" aria-live="off">
              <span ref={count} className="text-amber">
                {reduced ? 6 : 1}
              </span>{' '}
              / 6 corners
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
