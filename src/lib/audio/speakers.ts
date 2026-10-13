/**
 * One source of truth for the room and where the six speakers live, shared by
 * the 3D living room, the top-down demo plan and the HRTF audio path.
 *
 * World units are metres. TV wall at -Z, sofa toward +Z, Y up.
 * Four speakers sit in the ceiling corners, two in the floor corners either
 * side of the TV: six corners, full surround with height.
 */

export type Vec3 = [number, number, number];

export const ROOM = {
  w: 6,
  d: 5,
  h: 2.8,
  /** Listener's head on the sofa. */
  listener: [0, 1.1, 1.2] as Vec3,
};

const hw = ROOM.w / 2;
const hd = ROOM.d / 2;
const s3 = 1 / Math.sqrt(3);

export type SpeakerSpot = {
  id: string;
  label: string;
  /** The room corner (where the three surfaces meet). */
  corner: Vec3;
  /** Unit vector from the corner into the room: the speaker's facing. */
  inward: Vec3;
  /** Direction of the vertical wall junction, used to align the plate. */
  edge: Vec3;
  /** Position on the top-down plan, 0..1. */
  plan: { x: number; y: number };
};

const toPlan = (x: number, z: number, inset = 0) => ({
  x: 0.08 + 0.84 * ((x + hw) / ROOM.w) + inset * -Math.sign(x),
  y: 0.08 + 0.84 * ((z + hd) / ROOM.d) + inset * -Math.sign(z),
});

export const SPEAKERS: SpeakerSpot[] = [
  {
    id: 'flh',
    label: 'Front left · high',
    corner: [-hw, ROOM.h, -hd],
    inward: [s3, -s3, s3],
    edge: [0, -1, 0],
    plan: toPlan(-hw, -hd),
  },
  {
    id: 'frh',
    label: 'Front right · high',
    corner: [hw, ROOM.h, -hd],
    inward: [-s3, -s3, s3],
    edge: [0, -1, 0],
    plan: toPlan(hw, -hd),
  },
  {
    id: 'fll',
    label: 'Front left · low',
    corner: [-hw, 0, -hd],
    inward: [s3, s3, s3],
    edge: [0, 1, 0],
    plan: toPlan(-hw, -hd, 0.085),
  },
  {
    id: 'frl',
    label: 'Front right · low',
    corner: [hw, 0, -hd],
    inward: [-s3, s3, s3],
    edge: [0, 1, 0],
    plan: toPlan(hw, -hd, 0.085),
  },
  {
    id: 'rlh',
    label: 'Rear left · high',
    corner: [-hw, ROOM.h, hd],
    inward: [s3, -s3, -s3],
    edge: [0, -1, 0],
    plan: toPlan(-hw, hd),
  },
  {
    id: 'rrh',
    label: 'Rear right · high',
    corner: [hw, ROOM.h, hd],
    inward: [-s3, -s3, -s3],
    edge: [0, -1, 0],
    plan: toPlan(hw, hd),
  },
];

/** Where the sound actually comes from: just in front of the corner. */
export const speakerPoint = (s: SpeakerSpot, offset = 0.15): Vec3 => [
  s.corner[0] + s.inward[0] * offset,
  s.corner[1] + s.inward[1] * offset,
  s.corner[2] + s.inward[2] * offset,
];

// ---------------------------------------------------------------------------
// Demo flight path: a closed loop that passes through every speaker.

const ORDER = ['rlh', 'flh', 'fll', 'frl', 'frh', 'rrh'];
const pathSpots = ORDER.map((id) => SPEAKERS.findIndex((s) => s.id === id));

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export const DEMO_PATH = {
  /** t in 0..1 covers exactly one lap. */
  sample(t: number) {
    const n = pathSpots.length;
    const u = (((t % 1) + 1) % 1) * n;
    const i = Math.floor(u);
    const f = u - i;
    const idx = (k: number) => pathSpots[(((i + k) % n) + n) % n];
    const P = [-1, 0, 1, 2].map((k) => SPEAKERS[idx(k)]);
    const W = P.map((s) => speakerPoint(s, 0.35));

    const world: Vec3 = [0, 1, 2].map((c) => catmull(W[0][c], W[1][c], W[2][c], W[3][c], f)) as Vec3;
    const plan = {
      x: catmull(P[0].plan.x, P[1].plan.x, P[2].plan.x, P[3].plan.x, f),
      y: catmull(P[0].plan.y, P[1].plan.y, P[2].plan.y, P[3].plan.y, f),
    };
    const active = f < 0.22 ? idx(0) : f > 0.78 ? idx(1) : -1;
    return { world, plan, active };
  },
};
