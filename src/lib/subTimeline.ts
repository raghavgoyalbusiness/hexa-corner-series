import { smoothstep } from './math';

/**
 * Corner-gain section timeline, shared by the 3D scene and the HTML meter.
 * Stage 1: open floor → 2: one wall rises → 3: second wall (the corner).
 */
export const backWallAmount = (p: number) => smoothstep(0.2, 0.38, p);
export const leftWallAmount = (p: number) => smoothstep(0.55, 0.73, p);
/** Illustrative boundary gain in dB (see the footnote on the page). */
export const gainDb = (p: number) => backWallAmount(p) * 3 + leftWallAmount(p) * 6;
