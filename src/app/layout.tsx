import type { Metadata, Viewport } from 'next';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Nav } from '@/components/layout/Nav';
import { GrainOverlay } from '@/components/layout/GrainOverlay';

/*
 * Display: Archivo at an expanded width stands in for a wide geometric grotesk.
 * To use Neue Montreal (licensed), drop the .woff2 files in src/app/fonts and
 * swap this for next/font/local — see README.
 */
const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'HEXA — The Corner Series | Surround by design',
  description:
    '6 speakers. 6 corners. One immersive room. Adhesive corner plates and a magnetic snap: full surround sound with no drilling.',
  openGraph: {
    title: 'HEXA — The Corner Series',
    description: '6 speakers. 6 corners. One immersive room.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0E0D0C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-bone focus:px-4 focus:py-2 focus:text-charcoal"
        >
          Skip to content
        </a>
        <Providers>
          <Nav />
          <main id="main">{children}</main>
        </Providers>
        <GrainOverlay />
      </body>
    </html>
  );
}
