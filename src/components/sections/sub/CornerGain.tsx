'use client';

import { useRef } from 'react';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { CornerGainScene } from '@/components/three/scenes';
import { Eyebrow, Text } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { sub } from '@/lib/content';
import { gainDb } from '@/lib/subTimeline';

export function CornerGain() {
  const ref = useRef<HTMLElement>(null);
  const db = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const stages = useRef<(HTMLLIElement | null)[]>([]);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 1,
    onUpdate: (p) => {
      const g = gainDb(p);
      if (db.current) db.current.textContent = `+${g.toFixed(1)}`;
      if (bar.current) bar.current.style.transform = `scaleX(${0.08 + (g / 9) * 0.92})`;
      const stage = p < 0.3 ? 0 : p < 0.64 ? 1 : 2;
      stages.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = i === stage ? '1' : '0.35';
        el.dataset.active = String(i === stage);
      });
    },
  });

  return (
    <section
      ref={ref}
      id="physics"
      aria-labelledby="physics-title"
      className={reduced ? 'relative h-screen' : 'relative h-[380vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-charcoal">
        <SceneCanvas
          className="absolute inset-0"
          camera={{ position: [12, 9.5, 12], fov: 34, near: 0.1, far: 80 }}
          fallback={<SceneFallback src="/fallbacks/placeholder-sub.svg" alt="Subwoofer moving into a corner" />}
        >
          <CornerGainScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(14,13,12,0.9) 0%, rgba(14,13,12,0.4) 40%, transparent 60%)' }}
        />

        <div className="site-x pointer-events-none relative flex h-full flex-col justify-start pt-24 lg:justify-center lg:pt-0">
          <div className="max-w-md space-y-6">
            <Eyebrow>{sub.physics.eyebrow}</Eyebrow>
            <h2 id="physics-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
              {sub.physics.title}
            </h2>
            <p className="body-copy hidden sm:block">{sub.physics.sub}</p>

            <ol className="space-y-2 pt-2">
              {sub.physics.stages.map((s, i) => (
                <li
                  key={s}
                  ref={(el) => {
                    stages.current[i] = el;
                  }}
                  className="flex items-center gap-4 text-[15px] font-light transition-opacity duration-500"
                  style={{ opacity: i === 0 ? 1 : 0.35 }}
                >
                  <span className="display w-6 text-[11px] text-amber">0{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>

            <div className="space-y-3 pt-2" aria-live="off">
              <p className="flex items-baseline gap-2">
                <span ref={db} className="display text-4xl !tracking-[0.08em] text-bone sm:text-5xl">
                  +0.0
                </span>
                <span className="eyebrow">dB of free bass</span>
              </p>
              <span className="relative block h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-bone/10">
                <span
                  ref={bar}
                  className="absolute inset-0 origin-left rounded-full"
                  style={{ transform: 'scaleX(0.08)', background: 'linear-gradient(90deg, #3B82F6, #E8A866)' }}
                />
              </span>
            </div>
            <p className="max-w-sm text-xs font-light leading-relaxed text-bone/40">
              {sub.physics.footnote} <Text value={sub.physics.footnotePlaceholder} />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
