'use client';

import { Waitlist } from '@/components/sections/Waitlist';
import { sub } from '@/lib/content';
import { SixPlusOne } from './SixPlusOne';

export function SubWaitlist() {
  return <Waitlist product="corner-sub" copy={sub.waitlist} visual={(pulse) => <SixPlusOne pulse={pulse} />} />;
}
