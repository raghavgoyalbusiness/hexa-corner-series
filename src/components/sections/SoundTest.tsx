'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '@/components/providers/AudioProvider';
import { Eyebrow, Reveal } from '@/components/ui/primitives';
import { audioEngine } from '@/lib/audio/engine';
import { SONG, STEMS, SUB_INDEX, type StemId } from '@/lib/audio/song';
import { LISTENER_PLAN, SPEAKERS, SUB_PLAN } from '@/lib/audio/speakers';
import { soundTest } from '@/lib/content';
import { useReducedMotion } from '@/hooks/useMediaQuery';

const P = (v: number) => (v * 100).toFixed(2);
const SHORT: Record<string, string> = { flh: 'FL ↑', frh: 'FR ↑', fll: 'FL ↓', frl: 'FR ↓', rlh: 'RL ↑', rrh: 'RR ↑' };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Plays "Afterglow" through the six corners (plus the Sub on its page) and
 * lights each speaker as its instruments hit. Per-hit visuals are driven
 * straight from the audio scheduler via the Web Animations API, so nothing
 * re-renders on every note.
 */
export function SoundTest({ withSub = false, id = 'sound-test' }: { withSub?: boolean; id?: string }) {
  const { enabled, setEnabled, supported } = useAudio();
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [section, setSection] = useState('');
  const glows = useRef<(SVGCircleElement | null)[]>([]);
  const dots = useRef<Partial<Record<StemId, HTMLSpanElement | null>>>({});
  const bar = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const orbit = useRef<SVGGElement>(null);
  const sectionRef = useRef('');

  const flash = useCallback(
    (el: Element | null | undefined, big = true) => {
      if (!el) return;
      el.animate(
        reduced
          ? [{ opacity: 0.8 }, { opacity: 0 }]
          : [
              { opacity: 0.9, transform: 'scale(0.6)' },
              { opacity: 0, transform: `scale(${big ? 2.2 : 1.4})` },
            ],
        { duration: 600, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' },
      );
    },
    [reduced],
  );

  const reset = useCallback(() => {
    setPlaying(false);
    setSection('');
    sectionRef.current = '';
    if (bar.current) bar.current.style.transform = 'scaleX(0)';
    if (time.current) time.current.textContent = fmt(0);
    if (orbit.current) orbit.current.style.opacity = '0';
  }, []);

  const start = useCallback(() => {
    setPlaying(true);
    audioEngine.startSong(
      {
        onHit: (speakers, stem) => {
          speakers.forEach((i) => flash(glows.current[i]));
          flash(dots.current[stem], false);
        },
        onFrame: (f) => {
          if (bar.current) bar.current.style.transform = `scaleX(${f.t / f.total})`;
          if (time.current) time.current.textContent = fmt(f.t);
          if (orbit.current) {
            orbit.current.style.opacity = f.orbit ? '1' : '0';
            if (f.orbit) orbit.current.setAttribute('transform', `translate(${P(f.orbit.x)} ${P(f.orbit.y)})`);
          }
          if (f.section !== sectionRef.current) {
            sectionRef.current = f.section;
            setSection(f.section);
          }
        },
        onEnd: reset,
      },
      { withSub },
    );
  }, [flash, reset, withSub]);

  const onPlay = () => {
    if (playing) {
      audioEngine.stopSong();
      return;
    }
    if (!enabled) setEnabled(true); // the click is the user's consent to sound
    start();
  };

  const onTest = (i: number) => {
    if (!enabled) setEnabled(true);
    if (playing) reset();
    audioEngine.testSpeaker(i);
    flash(glows.current[i]);
  };

  // Sound toggled off in the nav: the engine has already stopped; sync the UI.
  useEffect(() => {
    if (!enabled && playing) reset();
  }, [enabled, playing, reset]);

  const copy = withSub ? { ...soundTest, ...soundTest.withSub } : soundTest;
  const targets = [...SPEAKERS.map((s, i) => ({ i, label: SHORT[s.id] })), ...(withSub ? [{ i: SUB_INDEX, label: 'Sub' }] : [])];

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative py-28 sm:py-40">
      <div className="site-x grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="space-y-7">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 id={`${id}-title`} className="display text-[clamp(1.4rem,3.4vw,2.8rem)]">
            {copy.title}
          </h2>
          <p className="body-copy max-w-md">{copy.sub}</p>

          {supported ? (
            <div className="max-w-md space-y-6 rounded-2xl border border-bone/[0.08] bg-stone/30 p-6">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={onPlay}
                  aria-pressed={playing}
                  aria-label={playing ? `${copy.stop} ${SONG.title}` : copy.play}
                  className="focus-ring flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bone text-charcoal transition-colors hover:bg-amber"
                >
                  {playing ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                      <rect x="2" y="2" width="10" height="10" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      <path d="M4 2v12l10-6z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="display truncate text-[13px] !tracking-wide2">{SONG.title}</p>
                  <p className="mt-1 text-xs font-light text-bone/50">
                    {SONG.artist} · {SONG.bpm} BPM · {SONG.key}
                  </p>
                </div>
                <span className="eyebrow !text-[10px] text-amber" aria-live="polite">
                  {playing ? section : ''}
                </span>
              </div>
              <div className="space-y-2">
                <span className="relative block h-[3px] overflow-hidden rounded-full bg-bone/10">
                  <span
                    ref={bar}
                    className="absolute inset-0 origin-left rounded-full"
                    style={{ transform: 'scaleX(0)', background: 'linear-gradient(90deg, #E8A866, #3B82F6)' }}
                  />
                </span>
                <p className="flex justify-between text-[11px] font-light tabular-nums text-bone/45">
                  <span ref={time}>{fmt(0)}</span>
                  <span>{fmt(SONG.duration)}</span>
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-2 border-t border-bone/[0.08] pt-5 text-xs font-light sm:grid-cols-2">
                {STEMS.map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <span
                      ref={(el) => {
                        dots.current[s.id] = el;
                      }}
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-wave opacity-0"
                      aria-hidden
                    />
                    <span className="text-bone/80">{s.label}</span>
                    <span className="truncate text-bone/40">{withSub && s.whereWithSub ? s.whereWithSub : s.where}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-bone/60">Your browser doesn’t support Web Audio, so the song can’t play here.</p>
          )}
          <p className="text-xs font-light text-bone/40">
            {copy.headphones}. {copy.note}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <figure className="relative mx-auto w-full max-w-[560px]">
            <svg
              viewBox="0 0 100 100"
              className="aspect-square h-auto w-full"
              role="img"
              aria-label={`Top-down plan: six corner speakers${withSub ? ' and the Corner Sub' : ''} light up as their parts play`}
            >
              <defs>
                <radialGradient id={`${id}-floor`} cx="50%" cy="60%" r="60%">
                  <stop offset="0%" stopColor="#2A2622" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0E0D0C" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${id}-glow`}>
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="8" y="8" width="84" height="84" fill={`url(#${id}-floor)`} stroke="rgba(242,238,232,0.18)" strokeWidth="0.3" />
              <line x1="36" y1="10" x2="64" y2="10" stroke="rgba(242,238,232,0.7)" strokeWidth="0.9" strokeLinecap="round" />
              <rect x="31" y="70.5" width="38" height="9" rx="2" fill="rgba(242,238,232,0.05)" stroke="rgba(242,238,232,0.2)" strokeWidth="0.3" />
              <circle cx={P(LISTENER_PLAN.x)} cy={P(LISTENER_PLAN.y)} r="2.4" fill="#F2EEE8" />

              {SPEAKERS.map((s, i) => (
                <g key={s.id} transform={`translate(${P(s.plan.x)} ${P(s.plan.y)})`}>
                  <circle
                    ref={(el) => {
                      glows.current[i] = el;
                    }}
                    r="6"
                    fill={`url(#${id}-glow)`}
                    opacity="0"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                  <circle r="2.1" fill={s.id.endsWith('h') ? '#1a1816' : 'transparent'} stroke="rgba(242,238,232,0.55)" strokeWidth="0.5" />
                  <circle r="0.9" fill="#E8A866" />
                  <text
                    y={s.plan.y > 0.5 || !s.id.endsWith('h') ? 5.4 : -3.8}
                    textAnchor="middle"
                    fontSize="2"
                    letterSpacing="0.3"
                    fill="rgba(242,238,232,0.45)"
                  >
                    {SHORT[s.id]}
                  </text>
                </g>
              ))}

              {withSub && (
                <g transform={`translate(${P(SUB_PLAN.x)} ${P(SUB_PLAN.y)})`}>
                  <circle
                    ref={(el) => {
                      glows.current[SUB_INDEX] = el;
                    }}
                    r="8"
                    fill={`url(#${id}-glow)`}
                    opacity="0"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                  <path d="M5.5 5.5 L-3.5 5.5 L5.5 -3.5 Z" fill="#1a1816" stroke="#E8A866" strokeWidth="0.6" strokeLinejoin="round" />
                </g>
              )}

              {/* The orbiting melody (chorus + outro). */}
              <g ref={orbit} style={{ opacity: 0, transition: 'opacity 400ms' }}>
                <circle r="4.5" fill={`url(#${id}-glow)`} />
                <circle r="1.2" fill="#DCE8FF" />
              </g>
            </svg>

            <figcaption className="mt-5 space-y-3">
              <p className="eyebrow !text-[10px]">{copy.testTitle}</p>
              <div className="flex flex-wrap gap-2">
                {targets.map((t) => (
                  <button
                    key={t.i}
                    type="button"
                    onClick={() => onTest(t.i)}
                    disabled={!supported}
                    className="focus-ring rounded-full border border-bone/15 px-3.5 py-2 font-display text-[10px] uppercase tracking-wide2 text-bone/80 transition-colors [font-stretch:112%] hover:border-amber hover:text-amber disabled:opacity-40"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
