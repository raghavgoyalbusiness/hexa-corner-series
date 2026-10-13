'use client';

import { useRef } from 'react';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { UnboxingScene } from '@/components/three/scenes';
import { Eyebrow, Text } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { inTheBox } from '@/lib/content';
import { smoothstep } from '@/lib/math';

export function InTheBox() {
  const ref = useRef<HTMLElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 1,
    onUpdate: (p) => {
      items.current.forEach((el, i) => {
        if (!el) return;
        const a = smoothstep(0.55 + i * 0.06, 0.65 + i * 0.06, p);
        el.style.opacity = String(a);
        el.style.transform = `translate3d(0, ${(1 - a) * 12}px, 0)`;
      });
    },
  });

  return (
    <section ref={ref} id="box" aria-labelledby="box-title" className={reduced ? 'relative' : 'relative h-[300vh]'}>
      <div className={reduced ? 'relative min-h-screen' : 'sticky top-0 h-screen overflow-hidden'}>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'radial-gradient(60% 55% at 62% 55%, rgba(42,38,34,0.9), #0E0D0C 75%)' }}
        />
        <SceneCanvas
          className="absolute inset-0 lg:left-[28%]"
          camera={{ position: [-1.5, 5.2, 9.2], fov: 38 }}
          fallback={
            <SceneFallback
              src="/fallbacks/placeholder-box.svg"
              alt="Open box with six speakers in a 3 by 2 foam tray"
            />
          }
        >
          <UnboxingScene progress={progress} mobile={mobile} reduced={reduced} />
        </SceneCanvas>

        <div className="site-x pointer-events-none relative flex h-full min-h-screen flex-col justify-end pb-14 pt-24 lg:justify-center lg:pb-0">
          <div className="max-w-sm space-y-6 rounded-2xl bg-charcoal/40 p-1 backdrop-blur-[2px] lg:bg-transparent lg:p-0 lg:backdrop-blur-0">
            <Eyebrow>{inTheBox.eyebrow}</Eyebrow>
            <h2 id="box-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
              {inTheBox.title}
            </h2>
            <p className="body-copy">{inTheBox.sub}</p>
            <ul className="space-y-0 pt-2">
              {inTheBox.items.map((it, i) => (
                <li
                  key={i}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  className="flex items-baseline gap-5 border-t border-bone/[0.08] py-3.5 last:border-b"
                  style={{ opacity: reduced ? 1 : 0 }}
                >
                  <span className="display w-6 text-[13px] text-amber">{it.qty}</span>
                  <span className="text-[15px] font-light">
                    <Text value={it.label} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
