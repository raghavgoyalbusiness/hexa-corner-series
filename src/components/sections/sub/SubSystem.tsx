'use client';

import { Eyebrow, Reveal, Text } from '@/components/ui/primitives';
import { ROOM, SPEAKERS } from '@/lib/audio/speakers';
import { sub } from '@/lib/content';

const P = (v: number) => (v * 100).toFixed(2);
const LISTENER = {
  x: 0.08 + 0.84 * ((ROOM.listener[0] + ROOM.w / 2) / ROOM.w),
  y: 0.08 + 0.84 * ((ROOM.listener[2] + ROOM.d / 2) / ROOM.d),
};
/** The Sub takes the free rear-right floor corner (inset like the other floor units). */
const SUB_AT = { x: 0.92 - 0.085, y: 0.92 - 0.085 };

export function SubSystem() {
  return (
    <section id="system" aria-labelledby="system-title" className="relative py-28 sm:py-40">
      <div className="site-x grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="space-y-7">
          <Eyebrow>{sub.system.eyebrow}</Eyebrow>
          <h2 id="system-title" className="display text-[clamp(1.4rem,3.4vw,2.8rem)]">
            {sub.system.title}
          </h2>
          <p className="body-copy max-w-md">{sub.system.sub}</p>
          <p className="max-w-md text-sm font-light">
            <Text value={sub.system.brain} />
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <figure className="relative mx-auto aspect-square w-full max-w-[560px]">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full"
              role="img"
              aria-label="Top-down plan: six Corner Series speakers plus the Corner Sub in the rear-right floor corner"
            >
              <defs>
                <radialGradient id="sysFloor" cx="50%" cy="60%" r="60%">
                  <stop offset="0%" stopColor="#2A2622" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0E0D0C" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="subGlow">
                  <stop offset="0%" stopColor="#E8A866" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#E8A866" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="8" y="8" width="84" height="84" fill="url(#sysFloor)" stroke="rgba(242,238,232,0.18)" strokeWidth="0.3" />
              <line x1="36" y1="10" x2="64" y2="10" stroke="rgba(242,238,232,0.7)" strokeWidth="0.9" strokeLinecap="round" />
              <rect x="31" y="70.5" width="38" height="9" rx="2" fill="rgba(242,238,232,0.05)" stroke="rgba(242,238,232,0.2)" strokeWidth="0.3" />
              <circle cx={P(LISTENER.x)} cy={P(LISTENER.y)} r="2.4" fill="#F2EEE8" />

              {/* Slow bass waves from the Sub's corner, clipped to the room. */}
              <clipPath id="roomClip">
                <rect x="8" y="8" width="84" height="84" />
              </clipPath>
              <g clipPath="url(#roomClip)">
                {[0, 1, 2, 3].map((i) => (
                  <circle
                    key={i}
                    cx="92"
                    cy="92"
                    r="10"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    className="sub-wave"
                    style={{ animationDelay: `${i * 1.1}s`, ['--s' as string]: 2 + i * 1.8 }}
                  />
                ))}
              </g>

              {SPEAKERS.map((s) => (
                <g key={s.id} transform={`translate(${P(s.plan.x)} ${P(s.plan.y)})`}>
                  <circle r="2.1" fill={s.id.endsWith('h') ? '#1a1816' : 'transparent'} stroke="rgba(242,238,232,0.55)" strokeWidth="0.5" />
                  <circle r="0.9" fill="#E8A866" />
                </g>
              ))}

              {/* The Sub: a right triangle tucked into the corner. */}
              <g transform={`translate(${P(SUB_AT.x)} ${P(SUB_AT.y)})`}>
                <circle r="9" fill="url(#subGlow)" />
                <path d="M5.5 5.5 L-3.5 5.5 L5.5 -3.5 Z" fill="#1a1816" stroke="#E8A866" strokeWidth="0.6" strokeLinejoin="round" />
                <text x="-1" y="-6.5" textAnchor="middle" fontSize="2.2" letterSpacing="0.4" fill="#F0C89A">
                  SUB
                </text>
              </g>
            </svg>
            <figcaption className="mt-4 flex justify-between text-[11px] font-light text-bone/40">
              <span>6 × Corner Series + 1 × Corner Sub</span>
              <span>6.1</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
