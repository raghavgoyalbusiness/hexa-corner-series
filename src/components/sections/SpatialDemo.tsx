'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '@/components/providers/AudioProvider';
import { Button, Eyebrow, Reveal } from '@/components/ui/primitives';
import { audioEngine, type DemoFrame } from '@/lib/audio/engine';
import { ROOM, SPEAKERS } from '@/lib/audio/speakers';
import { demo } from '@/lib/content';

const TRAIL = 46;
const P = (v: number) => v * 100;
const LISTENER = {
  x: 0.08 + 0.84 * ((ROOM.listener[0] + ROOM.w / 2) / ROOM.w),
  y: 0.08 + 0.84 * ((ROOM.listener[2] + ROOM.d / 2) / ROOM.d),
};
const SHORT: Record<string, string> = { flh: 'FL ↑', frh: 'FR ↑', fll: 'FL ↓', frl: 'FR ↓', rlh: 'RL ↑', rrh: 'RR ↑' };

export function SpatialDemo() {
  const { enabled, setEnabled, supported, demoRequest } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);
  const source = useRef<SVGGElement>(null);
  const trail = useRef<SVGPolylineElement>(null);
  const points = useRef<string[]>([]);
  const activeRef = useRef(-1);

  const onFrame = useCallback((f: DemoFrame) => {
    const x = P(f.plan.x);
    const y = P(f.plan.y);
    source.current?.setAttribute('transform', `translate(${x} ${y})`);
    points.current.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    if (points.current.length > TRAIL) points.current.shift();
    trail.current?.setAttribute('points', points.current.join(' '));
    if (f.active !== activeRef.current) {
      activeRef.current = f.active;
      setActive(f.active);
    }
  }, []);

  const onEnd = useCallback(() => {
    setPlaying(false);
    setActive(-1);
    activeRef.current = -1;
    points.current = [];
    trail.current?.setAttribute('points', '');
  }, []);

  const start = useCallback(() => {
    audioEngine.stopSpatialDemo();
    points.current = [];
    setPlaying(true);
    audioEngine.startSpatialDemo(onFrame, onEnd);
  }, [onFrame, onEnd]);

  const onPlay = () => {
    if (playing) {
      audioEngine.stopSpatialDemo();
      return;
    }
    if (!enabled) setEnabled(true); // the click is the user's consent to sound
    start();
  };

  // "Hear it" in the hero: audio was unlocked in that click; start once we've scrolled here.
  useEffect(() => {
    if (demoRequest === 0) return;
    const id = window.setTimeout(start, 1400);
    return () => window.clearTimeout(id);
  }, [demoRequest, start]);

  // Turning sound off in the nav stops the demo (engine.mute → onEnd).
  useEffect(() => {
    if (!enabled && playing) onEnd();
  }, [enabled, playing, onEnd]);

  return (
    <section id="demo" aria-label="Spatial audio demo" className="relative py-28 sm:py-40">
      <div className="site-x grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="space-y-7">
          <Eyebrow>{demo.eyebrow}</Eyebrow>
          <h2 className="display text-[clamp(1.4rem,3.4vw,2.8rem)]">{demo.title}</h2>
          <p className="body-copy max-w-md">{demo.sub}</p>
          <p className="flex items-center gap-3 text-sm text-amber">
            <HeadphonesIcon />
            {demo.headphones}
          </p>
          {supported ? (
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <Button onClick={onPlay} aria-pressed={playing}>
                {playing ? <StopGlyph /> : <PlayGlyph />}
                {playing ? demo.stop : demo.play}
              </Button>
              <p className="text-sm font-light text-bone/55" aria-live="polite">
                {playing
                  ? active >= 0
                    ? `Now: ${SPEAKERS[active].label}`
                    : 'In flight…'
                  : enabled
                    ? 'Sound is on'
                    : 'Plays sound when pressed'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-bone/60">Your browser doesn’t support Web Audio, so the demo can’t play here.</p>
          )}
        </Reveal>

        <Reveal delay={0.15}>
          <figure className="relative mx-auto aspect-square w-full max-w-[560px]">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full"
              role="img"
              aria-label="Top-down plan of a room with six corner speakers around a listener on the sofa"
            >
              <defs>
                <radialGradient id="glow">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="floor" cx="50%" cy="60%" r="60%">
                  <stop offset="0%" stopColor="#2A2622" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0E0D0C" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect
                x="8"
                y="8"
                width="84"
                height="84"
                fill="url(#floor)"
                stroke="rgba(242,238,232,0.18)"
                strokeWidth="0.3"
              />
              {/* TV wall */}
              <line
                x1="36"
                y1="10"
                x2="64"
                y2="10"
                stroke="rgba(242,238,232,0.7)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
              <text x="50" y="14.6" textAnchor="middle" fontSize="2.2" letterSpacing="0.6" fill="rgba(242,238,232,0.4)">
                TV
              </text>
              {/* Sofa */}
              <rect
                x="31"
                y="70.5"
                width="38"
                height="9"
                rx="2"
                fill="rgba(242,238,232,0.05)"
                stroke="rgba(242,238,232,0.2)"
                strokeWidth="0.3"
              />

              {/* Listener (facing the TV) */}
              <g transform={`translate(${P(LISTENER.x).toFixed(2)} ${P(LISTENER.y).toFixed(2)})`}>
                <circle r="9" fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="0.25" strokeDasharray="0.8 1.2" />
                <circle r="2.4" fill="#F2EEE8" />
                <path
                  d="M-3.3 0.6 A3.4 3.4 0 0 1 3.3 0.6"
                  fill="none"
                  stroke="#E8A866"
                  strokeWidth="0.55"
                  strokeLinecap="round"
                />
                <path d="M0 -3.4 l-0.9 -1.4 h1.8z" fill="rgba(242,238,232,0.6)" />
              </g>

              {/* Speakers */}
              {SPEAKERS.map((s, i) => {
                const on = i === active;
                const high = s.id.endsWith('h');
                const x = P(s.plan.x).toFixed(2);
                const y = P(s.plan.y).toFixed(2);
                const labelBelow = s.plan.y > 0.5 || !high;
                return (
                  <g key={s.id} transform={`translate(${x} ${y})`}>
                    <circle r={on ? 9 : 0} fill="url(#glow)" style={{ transition: 'r 300ms ease' }} />
                    <circle
                      r="2.1"
                      fill={high ? '#1a1816' : 'transparent'}
                      stroke={on ? '#3B82F6' : 'rgba(242,238,232,0.55)'}
                      strokeWidth="0.5"
                      style={{ transition: 'stroke 200ms' }}
                    />
                    <circle r="0.9" fill={on ? '#3B82F6' : '#E8A866'} style={{ transition: 'fill 200ms' }} />
                    <text
                      y={labelBelow ? 5.4 : -3.8}
                      textAnchor="middle"
                      fontSize="2"
                      letterSpacing="0.3"
                      fill={on ? '#BCD3FB' : 'rgba(242,238,232,0.45)'}
                    >
                      {SHORT[s.id]}
                    </text>
                  </g>
                );
              })}

              {/* Moving source + trail */}
              <polyline
                ref={trail}
                fill="none"
                stroke="#3B82F6"
                strokeOpacity="0.55"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g ref={source} style={{ opacity: playing ? 1 : 0, transition: 'opacity 400ms' }}>
                <circle r="5" fill="url(#glow)" />
                <circle r="1.3" fill="#DCE8FF" />
              </g>
            </svg>
            <figcaption className="mt-4 flex justify-between text-[11px] font-light text-bone/40">
              <span>↑ ceiling corner · ↓ floor corner</span>
              <span>HRTF · Web Audio</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4" height="7" rx="1.5" />
      <rect x="17" y="14" width="4" height="7" rx="1.5" />
    </svg>
  );
}
function PlayGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M2 1.2v7.6L8.6 5z" fill="currentColor" />
    </svg>
  );
}
function StopGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <rect x="2" y="2" width="6" height="6" fill="currentColor" />
    </svg>
  );
}
