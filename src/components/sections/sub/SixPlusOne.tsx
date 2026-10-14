'use client';

import { motion } from 'framer-motion';

/** Six speakers in a hexagon with the Sub at the centre; all pulse once on sign-up. */
export function SixPlusOne({ pulse }: { pulse: number }) {
  const R = 34;
  return (
    <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-[440px]" role="img" aria-label="Six HEXA speakers around a Corner Sub">
      <defs>
        <radialGradient id="spoGrille" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#36312c" />
          <stop offset="100%" stopColor="#171513" />
        </radialGradient>
        <radialGradient id="spoGlow">
          <stop offset="0%" stopColor="#E8A866" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#E8A866" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(242,238,232,0.08)" strokeWidth="0.3" strokeDasharray="1 1.6" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i} transform={`translate(${(50 + Math.cos(a) * R).toFixed(2)} ${(50 + Math.sin(a) * R).toFixed(2)})`}>
            <motion.g
              key={`p-${pulse}`}
              animate={pulse ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.07 }}
            >
              <circle r="7.5" fill="#1d1b19" stroke="#2c2926" strokeWidth="1" strokeDasharray="0.4 0.3" />
              <circle r="6" fill="url(#spoGrille)" />
            </motion.g>
          </g>
        );
      })}
      {/* The Sub, centre stage, sends one wave out to all six. */}
      <motion.circle
        key={`wave-${pulse}`}
        cx="50"
        cy="50"
        r="10"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="0.6"
        initial={{ scale: 1, opacity: 0 }}
        animate={pulse ? { scale: [1, 3.6], opacity: [0.9, 0] } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      <circle cx="50" cy="50" r="16" fill="url(#spoGlow)" />
      <path d="M57 57 L41 57 L57 41 Z" fill="#141210" stroke="#E8A866" strokeWidth="0.7" strokeLinejoin="round" />
      <circle cx="52.5" cy="52.5" r="1" fill="#E8A866" />
    </svg>
  );
}
