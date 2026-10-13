'use client';

import { useCallback, useRef } from 'react';
import { SceneCanvas, SceneFallback } from '@/components/three/SceneCanvas';
import { SnapScene } from '@/components/three/scenes';
import { useAudio } from '@/components/providers/AudioProvider';
import { Eyebrow } from '@/components/ui/primitives';
import { useIsMobile, useReducedMotion } from '@/hooks/useMediaQuery';
import { useScrubProgress } from '@/hooks/useScrubProgress';
import { audioEngine } from '@/lib/audio/engine';
import { snap } from '@/lib/content';
import { smoothstep } from '@/lib/math';

/** When each word lands, matching the scene: plate lands, speaker snaps, settle. */
const WORD_AT = [0.3, 0.72, 0.84];

export function Snap() {
  const ref = useRef<HTMLElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const sub = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const { enabled } = useAudio();
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const progress = useScrubProgress(ref, {
    reduced,
    staticValue: 1,
    onUpdate: (p) => {
      WORD_AT.forEach((at, i) => {
        const el = words.current[i];
        if (!el) return;
        const a = smoothstep(at - 0.03, at + 0.02, p);
        el.style.opacity = String(0.12 + a * 0.88);
        el.style.transform = `translate3d(0, ${(1 - a) * 14}px, 0)`;
      });
      if (sub.current) sub.current.style.opacity = String(smoothstep(0.86, 0.93, p));
    },
  });

  // The click only ever plays if the user has turned sound on.
  const onSnap = useCallback(() => {
    if (enabledRef.current) audioEngine.playClick();
  }, []);

  return (
    <section
      ref={ref}
      id="install"
      aria-label="Installation"
      className={reduced ? 'relative h-screen' : 'relative h-[320vh]'}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-charcoal">
        <SceneCanvas
          className="absolute inset-0"
          camera={{ position: [0.62, -0.58, 0.72], fov: 40, near: 0.01, far: 20 }}
          fallback={<SceneFallback src="/fallbacks/placeholder-corner.svg" alt="Speaker mounted in a ceiling corner" />}
        >
          <SnapScene progress={progress} mobile={mobile} reduced={reduced} onSnap={onSnap} />
        </SceneCanvas>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(14,13,12,0.85) 0%, rgba(14,13,12,0.2) 45%, transparent 70%)',
          }}
        />

        <div className="site-x pointer-events-none relative flex h-full flex-col justify-end pb-16 sm:justify-center sm:pb-0">
          <Eyebrow className="mb-6">{snap.eyebrow}</Eyebrow>
          <h2 className="display text-[clamp(2rem,6vw,5rem)] !leading-[1.15]">
            {snap.lines.map((w, i) => (
              <span
                key={w}
                ref={(el) => {
                  words.current[i] = el;
                }}
                className="block will-change-transform"
                style={{ opacity: reduced ? 1 : 0.12 }}
              >
                {w}
              </span>
            ))}
          </h2>
          <p ref={sub} className="body-copy mt-6 max-w-sm" style={{ opacity: reduced ? 1 : 0 }}>
            {snap.sub}
          </p>
        </div>
      </div>
    </section>
  );
}
