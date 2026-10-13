'use client';

import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { isPlaceholder, type Copy } from '@/lib/content';

/** Renders copy; placeholders get a dashed "TBD" chip so they can't ship unnoticed. */
export function Text({ value }: { value: Copy }) {
  if (isPlaceholder(value))
    return (
      <span className="ph" data-placeholder>
        {value.placeholder}
      </span>
    );
  return <>{value}</>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost'; children: ReactNode };

export function Button({ variant = 'solid', className = '', children, ...rest }: ButtonProps) {
  const base =
    'focus-ring group relative inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-[11px] uppercase tracking-wide2 transition-colors duration-300 font-display [font-stretch:112%] disabled:opacity-50';
  const styles =
    variant === 'solid'
      ? 'bg-bone text-charcoal hover:bg-amber'
      : 'border border-bone/25 text-bone hover:border-amber hover:text-amber';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Fade (and, unless reduced motion, rise) into view once. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** Hexagon mark + wordmark. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="3.2" fill="#E8A866" />
      </svg>
      <span className="display text-[13px] tracking-[0.42em]">Hexa</span>
    </span>
  );
}
