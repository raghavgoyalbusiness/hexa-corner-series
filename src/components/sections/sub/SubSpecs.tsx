'use client';

import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { SubSpecScene } from '@/components/three/scenes';
import { Eyebrow, Reveal, Text } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { sub } from '@/lib/content';

export function SubSpecs() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  return (
    <section id="sub-specs" aria-labelledby="sub-specs-title" className="relative py-28 sm:py-40">
      <div className="site-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-square w-full">
          <div
            aria-hidden
            className="absolute inset-[12%] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(232,168,102,0.12), transparent 70%)' }}
          />
          <SceneCanvas
            className="absolute inset-0"
            camera={{ position: [0, 3.2, 13], fov: 32 }}
            fallback={<SceneFallback src="/fallbacks/placeholder-sub.svg" alt="The Corner Sub" />}
          >
            <SubSpecScene mobile={mobile} reduced={reduced} />
          </SceneCanvas>
        </div>

        <Reveal className="space-y-10">
          <div className="space-y-5">
            <Eyebrow>Specifications</Eyebrow>
            <h2 id="sub-specs-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
              Target specs
            </h2>
          </div>
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Corner Sub target specifications</caption>
            <tbody>
              {sub.specs.map((s) => (
                <tr key={s.label} className="border-t border-bone/[0.08] last:border-b">
                  <th scope="row" className="eyebrow py-5 pr-6 align-top font-normal">
                    {s.label}
                  </th>
                  <td className="py-5 text-right text-[15px] font-light text-bone">
                    <Text value={s.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
