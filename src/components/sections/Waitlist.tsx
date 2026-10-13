'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useAudio } from '@/components/providers/AudioProvider';
import { Button, Eyebrow, Reveal, Text } from '@/components/ui/primitives';
import { audioEngine } from '@/lib/audio/engine';
import { WAITLIST_BASE_COUNTS, type ProductId } from '@/lib/config';
import { waitlist as defaultCopy } from '@/lib/content';

type Status = 'idle' | 'loading' | 'done' | 'error';

type WaitlistProps = {
  product?: ProductId;
  copy?: typeof defaultCopy;
  /** Visual beside the form; receives a counter that bumps once per successful sign-up. */
  visual?: (pulse: number) => ReactNode;
};

export function Waitlist({
  product = 'corner-series',
  copy: waitlist = defaultCopy,
  visual = (pulse) => <SixPucks pulse={pulse} />,
}: WaitlistProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState(0);
  const { enabled } = useAudio();

  const count = useMotionValue<number>(WAITLIST_BASE_COUNTS[product]);
  const shown = useTransform(count, (v) => Math.round(v).toLocaleString('en-US'));

  useEffect(() => {
    fetch(`/api/waitlist?product=${product}`)
      .then((r) => r.json())
      .then((d: { count?: number }) => typeof d.count === 'number' && animate(count, d.count, { duration: 1.2 }))
      .catch(() => {});
  }, [count, product]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const company = new FormData(e.currentTarget).get('company');
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, product }),
      });
      const data = (await res.json()) as { count?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
      setStatus('done');
      setPulse((n) => n + 1);
      if (enabled) audioEngine.playChime();
      if (typeof data.count === 'number') animate(count, data.count, { duration: 1.4, ease: 'easeOut' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className="relative overflow-hidden py-28 sm:py-40">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'radial-gradient(50% 60% at 50% 40%, rgba(232,168,102,0.10), transparent 70%)' }}
      />
      <div className="site-x relative grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="space-y-8">
          <Eyebrow>{waitlist.eyebrow}</Eyebrow>
          <h2 id="waitlist-title" className="display text-[clamp(1.4rem,3.6vw,3rem)]">
            {waitlist.title}
          </h2>
          <p className="body-copy max-w-md">{waitlist.sub}</p>
          <p className="text-[15px] font-light">
            <Text value={waitlist.pricing} />
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {status === 'done' ? (
              <motion.p
                key="done"
                role="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md border-l border-amber pl-5 text-[15px] font-light text-bone"
              >
                {waitlist.success}
              </motion.p>
            ) : (
              <motion.form
                key="form"
                onSubmit={submit}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md space-y-3"
                noValidate
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label htmlFor={`${id}-email`} className="sr-only">
                    Email address
                  </label>
                  <input
                    id={`${id}-email`}
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={status === 'error'}
                    aria-describedby={`${id}-msg`}
                    className="focus-ring min-w-0 flex-1 rounded-full border border-bone/15 bg-transparent px-6 py-3.5 text-[15px] font-light text-bone placeholder:text-bone/30 focus:border-amber/60"
                  />
                  {/* Honeypot */}
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                  <Button type="submit" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Joining…' : waitlist.button}
                  </Button>
                </div>
                <p id={`${id}-msg`} className="min-h-[1.25rem] pl-6 text-xs font-light text-bone/45" aria-live="polite">
                  {status === 'error' ? <span className="text-amber">{error}</span> : waitlist.legal}
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="flex items-baseline gap-3">
            <motion.span className="display text-2xl !tracking-[0.12em] text-bone">{shown}</motion.span>
            <span className="eyebrow">{waitlist.counterLabel}</span>
          </p>
        </Reveal>

        <Reveal delay={0.15}>{visual(pulse)}</Reveal>
      </div>
    </section>
  );
}

/** Six speakers in a hexagon; they pulse once, in sequence, on success. */
function SixPucks({ pulse }: { pulse: number }) {
  const R = 34;
  return (
    <svg
      viewBox="0 0 100 100"
      className="mx-auto w-full max-w-[440px]"
      role="img"
      aria-label="Six HEXA speakers arranged in a hexagon"
    >
      <defs>
        <radialGradient id="puckGrille" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#36312c" />
          <stop offset="100%" stopColor="#171513" />
        </radialGradient>
        <pattern id="weave" width="1.2" height="1.2" patternUnits="userSpaceOnUse">
          <path d="M0 0.6h1.2M0.6 0v1.2" stroke="rgba(242,238,232,0.05)" strokeWidth="0.25" />
        </pattern>
      </defs>
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        stroke="rgba(242,238,232,0.08)"
        strokeWidth="0.3"
        strokeDasharray="1 1.6"
      />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(a) * R;
        const y = 50 + Math.sin(a) * R;
        return (
          <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
            <motion.circle
              key={`ring-${pulse}`}
              r="10"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="0.6"
              initial={{ scale: 1, opacity: 0 }}
              animate={pulse ? { scale: [1, 2.1], opacity: [0.9, 0] } : { opacity: 0 }}
              transition={{ duration: 1.1, delay: i * 0.09, ease: 'easeOut' }}
            />
            <motion.g
              key={`puck-${pulse}`}
              animate={pulse ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.6, delay: i * 0.09, ease: 'easeOut' }}
            >
              {/* Serrated ring as a dashed stroke. */}
              <circle r="9.3" fill="#1d1b19" stroke="#2c2926" strokeWidth="1.1" strokeDasharray="0.45 0.35" />
              <circle r="7.6" fill="url(#puckGrille)" />
              <circle r="7.6" fill="url(#weave)" />
              <circle r="1.1" fill="#E8A866" opacity="0.7" />
            </motion.g>
          </g>
        );
      })}
      <text x="50" y="51.2" textAnchor="middle" fontSize="2.6" letterSpacing="1.4" fill="rgba(242,238,232,0.5)">
        6 × HEXA
      </text>
    </svg>
  );
}
