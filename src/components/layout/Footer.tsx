import { Logo } from '@/components/ui/primitives';
import { footer } from '@/lib/content';

export function Footer() {
  return (
    <footer className="border-t border-bone/[0.08] py-16">
      <div className="site-x flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
        <div className="space-y-5">
          <Logo className="text-bone" />
          <p className="max-w-xs text-sm font-light text-bone/50">The Corner Series. Surround by design.</p>
        </div>
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Social">
            {footer.socials.map((s) => (
              <li key={s.label}>
                {/* PLACEHOLDER: social URLs */}
                <a href={s.href} className="focus-ring eyebrow rounded transition-colors hover:text-amber">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
            {footer.legal.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="focus-ring eyebrow rounded transition-colors hover:text-bone">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="site-x mt-14 text-xs font-light text-bone/35">
        © {new Date().getFullYear()} HEXA Audio. All rights reserved.
      </p>
    </footer>
  );
}
