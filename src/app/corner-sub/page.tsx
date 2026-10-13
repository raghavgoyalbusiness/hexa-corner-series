import type { Metadata } from 'next';
import { SubHero } from '@/components/sections/sub/SubHero';
import { CornerGain } from '@/components/sections/sub/CornerGain';
import { SubDesign } from '@/components/sections/sub/SubDesign';
import { SubSystem } from '@/components/sections/sub/SubSystem';
import { LowEnd } from '@/components/sections/sub/LowEnd';
import { SubSpecs } from '@/components/sections/sub/SubSpecs';
import { SubWaitlist } from '@/components/sections/sub/SubWaitlist';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'HEXA — The Corner Sub | The deepest seat in the room',
  description: 'A subwoofer shaped for the corner, where bass is strongest. The seventh corner for the HEXA Corner Series.',
};

export default function CornerSubPage() {
  return (
    <>
      <SubHero />
      <CornerGain />
      <SubDesign />
      <SubSystem />
      <LowEnd />
      <SubSpecs />
      <SubWaitlist />
      <Footer />
    </>
  );
}
