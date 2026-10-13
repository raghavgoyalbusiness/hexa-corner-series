'use client';

import { motion } from 'framer-motion';
import { Eyebrow, Reveal } from '@/components/ui/primitives';
import { sub } from '@/lib/content';

type Icon = (typeof sub.design.items)[number]['icon'];

/** Line diagrams, one per design idea. */
const icons: Record<Icon, JSX.Element> = {
  corner: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M8 8v48M8 8h48" strokeOpacity="0.5" />
      <path d="M14 14h22L14 36Z" strokeLinejoin="round" />
      {[10, 16, 22].map((r) => (
        <path key={r} d={`M${14 + r} 14 A${r} ${r} 0 0 1 14 ${14 + r}`} stroke="#3B82F6" strokeOpacity={0.9 - r / 30} />
      ))}
    </svg>
  ),
  dial: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="32" cy="32" r="20" strokeDasharray="2 1.6" strokeWidth="3" />
      <circle cx="32" cy="32" r="14" />
      <circle cx="40" cy="26" r="2" fill="#E8A866" stroke="none" />
      <path d="M46 14a24 24 0 0 1 6 10" strokeOpacity="0.5" />
      <path d="M52 24l0-5-4.5 2.5" strokeOpacity="0.5" />
    </svg>
  ),
  glow: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <rect x="14" y="12" width="36" height="34" rx="2" />
      <path d="M18 42h28" stroke="#E8A866" strokeWidth="2" />
      <ellipse cx="32" cy="52" rx="22" ry="3.5" stroke="#E8A866" strokeOpacity="0.45" />
      <ellipse cx="32" cy="52" rx="13" ry="2" stroke="#E8A866" strokeOpacity="0.8" />
    </svg>
  ),
  shape: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M10 10v44M10 10h44" strokeOpacity="0.5" />
      <path d="M13 13h30L13 43Z" strokeLinejoin="round" />
      <path d="M13 21h6v-8" strokeOpacity="0.6" />
      <text x="22" y="24" fontSize="6" fill="currentColor" stroke="none" opacity="0.7">
        90°
      </text>
    </svg>
  ),
};

export function SubDesign() {
  return (
    <section id="sub-design" aria-labelledby="sub-design-title" className="relative py-28 sm:py-40">
      <div className="site-x">
        <Reveal className="mb-16 max-w-xl space-y-5">
          <Eyebrow>{sub.design.eyebrow}</Eyebrow>
          <h2 id="sub-design-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
            {sub.design.title}
          </h2>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sub.design.items.map((f, i) => (
            <motion.li
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 24 } }}
              className="group relative list-none overflow-hidden rounded-2xl border border-bone/[0.08] bg-stone/40 p-7 transition-colors duration-500 hover:border-amber/40"
            >
              <span className="mb-10 block h-16 w-16 text-bone/80" aria-hidden>
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
