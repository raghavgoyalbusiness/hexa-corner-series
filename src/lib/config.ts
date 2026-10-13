/**
 * Central switches for swapping placeholder assets for real ones.
 * See README → "Swapping in real assets".
 */

/** 'procedural' builds the speaker in code; 'glb' loads SPEAKER_GLB_URL. */
export const MODEL_SOURCE: 'procedural' | 'glb' = process.env.NEXT_PUBLIC_MODEL_SOURCE === 'glb' ? 'glb' : 'procedural';

/** Draco-compressed GLB. Must contain the node names in GLB_NODE_NAMES. */
export const SPEAKER_GLB_URL = '/models/hexa-speaker.glb';

/** Self-hosted Draco decoder (copied from three.js on postinstall). */
export const DRACO_DECODER_PATH = '/draco/';

/**
 * Node names the GLB must expose so the exploded view can move each layer.
 * Each node's local origin should match the assembled position (product units:
 * 1 unit = 10 cm, speaker faces +Z, back of the housing at z = 0).
 */
export const GLB_NODE_NAMES = {
  grille: 'Grille',
  driver: 'Driver',
  housing: 'Housing',
  magnet: 'MagnetDisc',
  plate: 'CornerPlate',
} as const;

/** PLACEHOLDER: seed count shown before real waitlist numbers exist. */
export const WAITLIST_BASE_COUNT = 2847;
