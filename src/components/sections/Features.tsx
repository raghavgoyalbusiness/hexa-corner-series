'use client';

import { motion } from 'framer-motion';
import { Eyebrow, Reveal } from '@/components/ui/primitives';
import { features } from '@/lib/content';

const icons: Record<(typeof features)[number]['icon'], JSX.Element> = {
  surround: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="24" cy="24" r="3" />
      <circle cx="24" cy="24" r="9" strokeOpacity="0.6" />
      <circle cx="24" cy="24" r="15" strokeOpacity="0.35" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle
          key={a}
          cx={(24 + 20 * Math.cos((a * Math.PI) / 180)).toFixed(2)}
          cy={(24 + 20 * Math.sin((a * Math.PI) / 180)).toFixed(2)}
          r="1.6"
          fill="currentColor"
        />
      ))}
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      {[8, 13, 18, 23, 28, 33, 38].map((x, i) => {
        const h = [6, 12, 18, 22, 18, 12, 6][i];
        return <line key={x} x1={x + 1} y1={24 - h / 2} x2={x + 1} y2={24 + h / 2} />;
      })}
    </svg>
  ),
  discreet: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M6 6v36M6 6h36" strokeOpacity="0.5" />
      <path d="M6 6l14 14" strokeOpacity="0.35" strokeDasharray="2 2" />
      <circle cx="24" cy="24" r="8" />
      <circle cx="24" cy="24" r="5.5" strokeOpacity="0.5" />
    </svg>
  ),
  magnet: (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M8 10 L28 10 L8 30 Z" strokeLinejoin="round" />
      <circle cx="31" cy="31" r="9" />
      <circle cx="31" cy="31" r="3" fill="currentColor" />
      <path d="M17 17l6 6" strokeDasharray="1.5 2" strokeOpacity="0.6" />
    </svg>
  ),
};

export function Features() {
  return (
    <section aria-labelledby="features-title" className="relative py-28 sm:py-40">
      <div className="site-x">
        <Reveal className="mb-16 max-w-xl space-y-5">
          <Eyebrow>06 — Why HEXA</Eyebrow>
          <h2 id="features-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
            Big sound, small footprint
          </h2>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.li
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
              className="group relative list-none overflow-hidden rounded-2xl border border-bone/[0.08] bg-stone/40 p-7 transition-colors duration-500 hover:border-amber/40"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber/0 blur-3xl transition-colors duration-700 group-hover:bg-amber/15"
              />
              <span className="mb-10 block h-12 w-12 text-amber" aria-hidden>
                {icons[f.icon]}
              </span>
              <h3 className="display mb-3 text-[13px] !tracking-wide2">{f.title}</h3>
              <p className="text-sm font-light leading-relaxed text-bone/60">{f.body}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
