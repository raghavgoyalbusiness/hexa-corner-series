'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/components/providers/AudioProvider';
import { Button, Eyebrow, Reveal } from '@/components/ui/primitives';
import { audioEngine } from '@/lib/audio/engine';
import { sub } from '@/lib/content';

/** Bass preview: each note sends a pressure wave through the rings. */
export function LowEnd() {
  const { enabled, setEnabled, supported, lowEndRequest } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(-1);

  const start = useCallback(() => {
    audioEngine.stopLowEnd();
    setPlaying(true);
    audioEngine.startLowEnd(
      (i) => setBeat(i),
      () => {
        setPlaying(false);
        setBeat(-1);
      },
    );
  }, []);

  const onPlay = () => {
    if (playing) {
      audioEngine.stopLowEnd();
      return;
    }
    if (!enabled) setEnabled(true); // the click is the user's consent to sound
    start();
  };

  // "Feel the low end" in the hero: audio was unlocked in that click; start once we arrive.
  useEffect(() => {
    if (lowEndRequest === 0) return;
    const id = window.setTimeout(start, 1400);
    return () => window.clearTimeout(id);
  }, [lowEndRequest, start]);

  useEffect(() => {
    if (!enabled && playing) {
      setPlaying(false);
      setBeat(-1);
    }
  }, [enabled, playing]);

  return (
    <section id="low-end" aria-labelledby="low-end-title" className="relative overflow-hidden py-28 sm:py-40">
      <div className="site-x grid items-center gap-16 lg:grid-cols-2">
        <Reveal className="space-y-7">
          <Eyebrow>{sub.lowEnd.eyebrow}</Eyebrow>
          <h2 id="low-end-title" className="display text-[clamp(1.4rem,3.4vw,2.8rem)]">
            {sub.lowEnd.title}
          </h2>
          <p className="body-copy max-w-md">{sub.lowEnd.sub}</p>
          {supported ? (
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Button onClick={onPlay} aria-pressed={playing}>
                {playing ? sub.lowEnd.stop : sub.lowEnd.play}
              </Button>
              <p className="text-sm font-light text-bone/55" aria-live="polite">
                {playing ? `Note ${Math.max(1, beat + 1)} of 8` : enabled ? 'Sound is on' : 'Plays sound when pressed'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-bone/60">Your browser doesn’t support Web Audio, so the preview can’t play here.</p>
          )}
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative mx-auto aspect-square w-full max-w-[480px]" aria-hidden>
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(232,168,102,0.14), transparent 65%)' }}
            />
            {[0.32, 0.5, 0.68, 0.86].map((s, i) => (
              <span
                key={s}
                className="absolute left-1/2 top-1/2 rounded-full border border-wave/30"
                style={{ width: `${s * 100}%`, height: `${s * 100}%`, transform: 'translate(-50%, -50%)', opacity: 0.25 + i * 0.1 }}
              />
            ))}
            {/* One pressure wave per note. */}
            {beat >= 0 && (
              <motion.span
                key={beat}
                className="absolute left-1/2 top-1/2 rounded-full border-2 border-wave"
                initial={{ width: '18%', height: '18%', x: '-50%', y: '-50%', opacity: 0.95 }}
                animate={{ width: '100%', height: '100%', opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            )}
            <motion.span
              className="absolute left-1/2 top-1/2 h-[18%] w-[18%] rounded-full"
              style={{
                x: '-50%',
                y: '-50%',
                background: 'radial-gradient(circle at 40% 35%, #3a3530, #141210 70%)',
                boxShadow: '0 0 0 3px #22201d, 0 0 40px rgba(232,168,102,0.25)',
              }}
              animate={beat >= 0 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
              key={`core-${beat}`}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
