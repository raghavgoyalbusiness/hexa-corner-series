'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eyebrow, Reveal, Text } from '@/components/ui/primitives';
import { faq } from '@/lib/content';

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <section id="faq" aria-labelledby="faq-title" className="relative py-28 sm:py-40">
      <div className="site-x grid gap-14 lg:grid-cols-[1fr_1.6fr]">
        <Reveal className="space-y-5">
          <Eyebrow>11 — FAQ</Eyebrow>
          <h2 id="faq-title" className="display text-[clamp(1.3rem,3vw,2.4rem)]">
            Questions
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="border-b border-bone/[0.08]">
            {faq.map((item, i) => {
              const isOpen = open === i;
              const btn = `${base}-q${i}`;
              const panel = `${base}-a${i}`;
              return (
                <li key={item.q} className="border-t border-bone/[0.08]">
                  <h3>
                    <button
                      id={btn}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panel}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="focus-ring group flex w-full items-center justify-between gap-6 rounded py-6 text-left"
                    >
                      <span className="text-[17px] font-light text-bone transition-colors group-hover:text-amber">
                        {item.q}
                      </span>
                      <span aria-hidden className="relative h-3 w-3 shrink-0">
                        <span className="absolute left-0 top-1/2 h-px w-3 bg-bone/70" />
                        <motion.span
                          className="absolute left-0 top-1/2 h-px w-3 bg-bone/70"
                          animate={{ rotate: isOpen ? 0 : 90 }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panel}
                        role="region"
                        aria-labelledby={btn}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="max-w-xl space-y-3 pb-7 text-[15px] font-light leading-relaxed text-bone/60">
                          {item.a.map((a, j) => (
                            <p key={j}>
                              <Text value={a} />
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
