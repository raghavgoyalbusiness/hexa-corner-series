'use client';

import Link from 'next/link';
import { Eyebrow, Reveal } from '@/components/ui/primitives';
import { sub } from '@/lib/content';

/** Home-page teaser for the Corner Sub. Pure SVG, so it costs no extra WebGL context. */
export function NextProduct() {
  return (
    <section aria-labelledby="next-title" className="relative py-20 sm:py-28">
      <div className="site-x">
        <Reveal>
          <Link
            href="/corner-sub"
            className="focus-ring group relative grid items-center gap-10 overflow-hidden rounded-3xl border border-bone/[0.08] bg-stone/30 p-8 transition-colors duration-500 hover:border-amber/40 sm:p-12 lg:grid-cols-[1.2fr_1fr]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 right-0 h-72 w-[60%] rounded-full bg-amber/10 blur-3xl transition-colors duration-700 group-hover:bg-amber/20"
            />
            <div className="relative space-y-6">
              <Eyebrow className="!text-amber">{sub.teaser.eyebrow}</Eyebrow>
              <h2 id="next-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
                {sub.teaser.title}
              </h2>
              <p className="body-copy max-w-md">{sub.teaser.sub}</p>
              <span className="inline-flex items-center gap-3 font-display text-[11px] uppercase tracking-wide2 text-bone [font-stretch:112%]">
                {sub.teaser.cta}
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1.5">
                  →
                </span>
              </span>
            </div>
            <SubIllustration />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function SubIllustration() {
  return (
    <svg viewBox="0 0 320 260" className="relative mx-auto w-full max-w-[380px]" aria-hidden>
      <defs>
        <pattern id="teaserWeave" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 2h4M2 0v4" stroke="rgba(242,238,232,0.06)" strokeWidth="0.8" />
        </pattern>
        <linearGradient id="teaserFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2622" />
          <stop offset="1" stopColor="#151311" />
        </linearGradient>
        <radialGradient id="teaserFloor" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#E8A866" stopOpacity="0.5" />
          <stop offset="1" stopColor="#E8A866" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Corner lines */}
      <path d="M160 20 V150 M160 150 L20 215 M160 150 L300 215" stroke="rgba(242,238,232,0.12)" />
      <ellipse cx="160" cy="226" rx="120" ry="18" fill="url(#teaserFloor)" />
      {/* Top face (triangle, seen from above) */}
      <path d="M160 70 L70 104 L250 104 Z" fill="#1d1b19" stroke="rgba(242,238,232,0.18)" />
      <ellipse cx="160" cy="94" rx="18" ry="6" fill="#2c2926" stroke="#5a5148" strokeDasharray="1.2 1" />
      <circle cx="167" cy="96" r="1.6" fill="#E8A866" />
      {/* Front face (fabric) */}
      <rect x="70" y="104" width="180" height="112" fill="url(#teaserFront)" />
      <rect x="82" y="114" width="156" height="88" fill="url(#teaserWeave)" />
      <line x1="84" y1="210" x2="236" y2="210" stroke="#E8A866" strokeWidth="2" />
      {/* Bass waves */}
      {[40, 70, 100].map((r, i) => (
        <ellipse key={r} cx="160" cy="224" rx={r * 1.4} ry={r * 0.22} fill="none" stroke="#3B82F6" strokeOpacity={0.5 - i * 0.14} />
      ))}
    </svg>
  );
}
