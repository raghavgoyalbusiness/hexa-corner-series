import { Hero } from '@/components/sections/Hero';
import { ExplodedView } from '@/components/sections/ExplodedView';
import { Snap } from '@/components/sections/Snap';
import { SixCorners } from '@/components/sections/SixCorners';
import { SpatialDemo } from '@/components/sections/SpatialDemo';
import { Features } from '@/components/sections/Features';
import { Specs } from '@/components/sections/Specs';
import { InTheBox } from '@/components/sections/InTheBox';
import { PremiumFinish } from '@/components/sections/PremiumFinish';
import { Waitlist } from '@/components/sections/Waitlist';
import { FAQ } from '@/components/sections/FAQ';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <ExplodedView />
      <Snap />
      <SixCorners />
      <SpatialDemo />
      <Features />
      <Specs />
      <InTheBox />
      <PremiumFinish />
      <Waitlist />
      <FAQ />
      <Footer />
    </>
  );
}
