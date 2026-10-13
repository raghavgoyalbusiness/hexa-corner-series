'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAudio } from '@/components/providers/AudioProvider';
import { Logo } from '@/components/ui/primitives';
import { navByPath, products } from '@/lib/content';
import { scrollToId } from '@/lib/scroll';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { enabled, toggle, supported } = useAudio();
  const path = usePathname();
  const items = navByPath[path] ?? [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled ? 'border-b border-bone/[0.06] bg-charcoal/70 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav aria-label="Primary" className="site-x flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {path === '/' ? (
            <a href="#top" onClick={go('top')} className="focus-ring rounded text-bone" aria-label="HEXA, back to top">
              <Logo />
            </a>
          ) : (
            <Link href="/" className="focus-ring rounded text-bone" aria-label="HEXA home">
              <Logo />
            </Link>
          )}
          {/* Product switcher */}
          <div className="hidden rounded-full border border-bone/10 p-1 md:flex" role="navigation" aria-label="Products">
            {products.map((pr) => {
              const active = pr.href === path;
              return (
                <Link
                  key={pr.href}
                  href={pr.href}
                  aria-current={active ? 'page' : undefined}
                  className={`focus-ring whitespace-nowrap rounded-full px-3 py-1.5 font-display text-[10px] uppercase tracking-wide2 transition-colors [font-stretch:112%] ${
                    active ? 'bg-bone/10 text-bone' : 'text-bone/50 hover:text-bone'
                  }`}
                >
                  {pr.label}
                </Link>
              );
            })}
          </div>
        </div>

        <ul className="hidden items-center gap-6 xl:flex">
          {items.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                onClick={go(n.id)}
                className="focus-ring eyebrow whitespace-nowrap rounded transition-colors hover:text-bone"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-4">
          {supported && (
            <button
              type="button"
              onClick={toggle}
              aria-pressed={enabled}
              aria-label={enabled ? 'Turn sound off' : 'Turn sound on'}
              className="focus-ring flex items-center gap-2.5 rounded-full border border-bone/15 px-3.5 py-2 transition-colors hover:border-amber/60"
            >
              <SoundBars on={enabled} />
              <span className="eyebrow whitespace-nowrap !text-[10px] !text-bone/80">{enabled ? 'Sound on' : 'Sound off'}</span>
            </button>
          )}
          <a
            href="#waitlist"
            onClick={go('waitlist')}
            className="focus-ring hidden whitespace-nowrap rounded-full bg-bone px-5 py-2.5 font-display text-[10px] uppercase tracking-wide2 text-charcoal transition-colors [font-stretch:112%] hover:bg-amber sm:inline-flex"
          >
            Join waitlist
          </a>
        </div>
      </nav>
    </header>
  );
}

function SoundBars({ on }: { on: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0.5, 1, 0.7, 0.85].map((h, i) => (
        <motion.span
          key={i}
          className={`w-[2px] rounded-full ${on ? 'bg-amber' : 'bg-bone/50'}`}
          animate={on ? { height: ['30%', `${h * 100}%`, '45%', `${h * 80}%`, '30%'] } : { height: '25%' }}
          transition={on ? { duration: 1.1 + i * 0.15, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          style={{ height: '25%' }}
        />
      ))}
    </span>
  );
}
