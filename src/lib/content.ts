/**
 * All marketing copy lives here so it can be edited without touching layout.
 * Anything wrapped in ph() is a PLACEHOLDER and renders with a dashed "TBD" chip.
 */

export type Copy = string | { placeholder: string };
export const ph = (placeholder: string): Copy => ({ placeholder });
export const isPlaceholder = (c: Copy): c is { placeholder: string } => typeof c !== 'string';

export const nav = [
  { id: 'design', label: 'Design' },
  { id: 'install', label: 'Install' },
  { id: 'surround', label: 'Surround' },
  { id: 'demo', label: 'Demo' },
  { id: 'specs', label: 'Specs' },
  { id: 'faq', label: 'FAQ' },
];

export const hero = {
  eyebrow: 'HEXA — The Corner Series',
  title: 'Surround by design',
  sub: '6 speakers. 6 corners. One immersive room.',
  primaryCta: 'Join the waitlist',
  secondaryCta: 'Hear it',
  formation: { eyebrow: 'The Corner Series', line1: 'Six speakers', line2: 'One room' },
};

export const exploded = {
  eyebrow: '02 — Anatomy',
  title: 'Five layers. Nothing extra.',
  layers: [
    { key: 'grille', title: 'Acoustic fabric grille', note: 'Dust resistant' },
    { key: 'driver', title: 'Full-range driver', note: 'Rich, balanced sound' },
    { key: 'housing', title: 'Durable ABS housing', note: 'Matte finish' },
    { key: 'magnet', title: 'Magnetic snap core', note: 'Self-aligning' },
    { key: 'plate', title: 'Adhesive corner plate', note: 'No drilling' },
  ] as const,
};

export const snap = {
  eyebrow: '03 — Install',
  lines: ['Stick.', 'Snap.', 'Done.'],
  sub: 'No drills, no installers, no damage.',
};

export const corners = {
  eyebrow: '04 — Six corners',
  title: 'Full surround',
  sub: 'Place one in each corner. Your movies, music and games, everywhere at once.',
  sweetSpot: 'Sweet spot',
};

export const demo = {
  eyebrow: '05 — Listen',
  title: 'Hear the room move',
  sub: '“Orbit”: a chord blooms from all six corners while a music-box melody circles the room. Close your eyes and follow it.',
  headphones: 'Best with headphones',
  play: 'Play demo',
  stop: 'Stop',
};

export const features = [
  {
    icon: 'surround',
    title: '360° Surround',
    body: 'Six speakers, six corners. Sound that wraps every seat, not just the one in the middle.',
  },
  {
    icon: 'wave',
    title: 'Clear and Balanced Audio',
    body: 'A tuned full-range driver keeps dialogue crisp and bass warm, at any volume.',
  },
  {
    icon: 'discreet',
    title: 'Discreet Design',
    body: 'A matte puck that tucks into the corner and blends into your space.',
  },
  {
    icon: 'magnet',
    title: 'Easy Installation',
    body: 'Adhesive corner plate, magnetic snap. Up in minutes, with no holes to patch.',
  },
] as const;

export const specs: { label: string; value: Copy }[] = [
  { label: 'Diameter', value: '~18 cm' },
  { label: 'Depth', value: '~6 cm' },
  { label: 'Power', value: '50W RMS' },
  { label: 'Frequency response', value: '70Hz – 20kHz' },
  { label: 'Impedance', value: '8Ω' },
  { label: 'Connectivity', value: ph('Wired or wireless — TBD') },
  { label: 'Mount hold rating', value: ph('Hold rating — TBD') },
];

export const inTheBox = {
  eyebrow: '08 — In the box',
  title: 'Sold as a set of 6',
  sub: 'Everything you need for full surround.',
  items: [
    { qty: '6', label: 'Corner Speakers' },
    { qty: '6', label: 'Adhesive Corner Plates' },
    { qty: '1', label: 'Quick Start Guide' },
    { qty: '—', label: ph('Cables / charger — TBD') as Copy },
  ] as { qty: string; label: Copy }[],
};

export const finish = {
  eyebrow: '09 — Finish',
  title: 'Premium finish.',
  sub: 'Built to last.',
  detail: 'Serrated ring with a soft metallic sheen. Woven acoustic fabric. Matte ABS that doesn’t fingerprint.',
};

export const waitlist = {
  eyebrow: '10 — Waitlist',
  title: 'Be first in the corner',
  sub: 'Join the waitlist to lock in founding-customer pricing on the set of 6.',
  pricing: ph('Founding price: $XXX for the set of 6 (RRP $XXX)'),
  counterLabel: 'people on the waitlist',
  button: 'Join the waitlist',
  success: 'You’re on the list. We’ll email you before anyone else.',
  legal: 'One email at launch. No spam. Unsubscribe any time.',
};

export const faq: { q: string; a: Copy[] }[] = [
  {
    q: 'Will it damage my walls?',
    a: [
      'No drilling, no screws. The corner plate uses a removable adhesive designed for painted plaster and drywall, so it peels away cleanly when you move.',
      ph('Confirm adhesive spec, supported surfaces and removal method'),
    ],
  },
  {
    q: 'How strong is the mount?',
    a: [
      'Each speaker snaps onto its plate with a magnetic core and the plate is rated well above the speaker’s weight.',
      ph('Mount hold rating and test conditions — TBD'),
    ],
  },
  {
    q: 'Do I need a receiver?',
    a: [ph('Depends on the final wired / wireless architecture — answer once connectivity is confirmed')],
  },
  {
    q: 'Does it work with my TV?',
    a: [
      'The Corner Series is designed to sit alongside any modern TV.',
      ph('List supported inputs (HDMI eARC / optical / Bluetooth / Wi-Fi) once confirmed'),
    ],
  },
  {
    q: 'Can I use fewer than 6?',
    a: [
      'Yes. Four corners already gives you convincing surround; six adds height and fills the front stage. The set of 6 is how we tune it.',
      ph('Confirm supported configurations (2 / 4 / 6)'),
    ],
  },
  {
    q: 'Wired or wireless?',
    a: [ph('Connectivity is being finalised — wired or wireless TBD')],
  },
];

export const footer = {
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'YouTube', href: '#' },
    { label: 'TikTok', href: '#' },
    { label: 'X', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
};

// ---------------------------------------------------------------------------
// Product switcher + per-page nav.

export const products = [
  { href: '/', label: 'Corner Series' },
  { href: '/corner-sub', label: 'Corner Sub' },
];

export const subNav = [
  { id: 'physics', label: 'Physics' },
  { id: 'sub-design', label: 'Design' },
  { id: 'system', label: 'System' },
  { id: 'low-end', label: 'Listen' },
  { id: 'sub-specs', label: 'Specs' },
];

export const navByPath: Record<string, { id: string; label: string }[]> = {
  '/': nav,
  '/corner-sub': subNav,
};

// ---------------------------------------------------------------------------
// The Corner Sub (concept). Every unconfirmed number is a ph() placeholder.

export const sub = {
  hero: {
    eyebrow: 'HEXA — The Corner Sub',
    title: 'The deepest seat in the room',
    sub: 'A subwoofer shaped for the one place bass loves most: the corner.',
    primaryCta: 'Join the Sub waitlist',
    secondaryCta: 'Feel the low end',
  },
  physics: {
    eyebrow: '01 — Why corners',
    title: 'Physics, not power',
    sub: 'Every surface next to a subwoofer reflects its bass back into the room. On open floor you get one. Against a wall, two. In a corner, three, and the room does the heavy lifting.',
    stages: ['Open floor', 'Against a wall', 'In the corner'],
    footnote: 'Illustrative boundary gain at low frequencies. Real-world gain depends on the room.',
    footnotePlaceholder: ph('Acoustics team to confirm measured corner-loading gain'),
  },
  design: {
    eyebrow: '02 — Design',
    title: 'Quiet from the front',
    items: [
      {
        icon: 'corner',
        title: 'Fires into the corner',
        body: 'The driver faces the walls, not you. The corner becomes part of the cabinet, and the room-facing side stays a calm wall of fabric.',
      },
      {
        icon: 'dial',
        title: 'The ring becomes a dial',
        body: 'The serrated ring from the Corner Series moves to the top as a real dial. Turn for level, press for crossover. An amber pip shows where you are.',
      },
      {
        icon: 'glow',
        title: 'A warm floor glow',
        body: 'A thin amber line at the base washes the floor, so the Sub reads as a lamp at night, not a box.',
      },
      {
        icon: 'shape',
        title: 'Shaped for 90°',
        body: 'A right-triangle footprint sits flush in any floor corner and leaves no dead space behind it.',
      },
    ],
  },
  system: {
    eyebrow: '03 — The seventh corner',
    title: 'Six corners plus one',
    sub: 'Bass isn’t directional, so the Sub takes whichever floor corner is free. With the Corner Series it becomes 6.1, with the low end handed off to the Sub automatically.',
    brain: ph('Decide whether the Sub also houses the amp + HDMI eARC (the system “brain”)'),
  },
  lowEnd: {
    eyebrow: '04 — Listen',
    title: 'Feel the low end',
    sub: 'Eight deep notes. On a laptop you’ll hear the shape; on headphones or a real sub you’ll feel it.',
    play: 'Play the low end',
    stop: 'Stop',
  },
  specs: [
    { label: 'Driver', value: ph('8″ (20 cm) long-throw, rear-firing — target') },
    { label: 'Amplifier', value: ph('Class D, ~150W RMS — target') },
    { label: 'Frequency response', value: ph('28Hz – 150Hz — target') },
    { label: 'Dimensions', value: ph('~38 × 38 × 42 cm — target') },
    { label: 'Finish', value: 'Matte black ABS, woven acoustic fabric' },
    { label: 'Controls', value: 'Top dial (level / crossover), amber status pip' },
    { label: 'Connectivity', value: ph('Wired or wireless — TBD, same as Corner Series') },
    { label: 'Room calibration', value: ph('Auto-EQ for corner loading — TBD') },
  ] as { label: string; value: Copy }[],
  waitlist: {
    eyebrow: '05 — Waitlist',
    title: 'Claim the seventh corner',
    sub: 'Join the Sub waitlist for early access and bundle pricing with the Corner Series.',
    pricing: ph('Sub price $XXX · bundle with Corner Series $XXX'),
    counterLabel: 'people waiting for the Sub',
    button: 'Join the Sub waitlist',
    success: 'You’re on the Sub list. We’ll be in touch before launch.',
    legal: 'One email at launch. No spam. Unsubscribe any time.',
  },
  teaser: {
    eyebrow: 'Coming next',
    title: 'The Corner Sub',
    sub: 'A subwoofer shaped for the corner, where bass is strongest. Six corners, plus one.',
    cta: 'Meet the Corner Sub',
  },
};
