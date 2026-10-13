'use client';

/**
 * A single window-level pointer tracker. Canvases sit under HTML overlays, so
 * R3F's own pointer state never sees the mouse; scenes read this instead.
 * x / y are normalised to [-1, 1] with +y up.
 */
export const pointer = { x: 0, y: 0 };

let attached = false;

export function attachPointer() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}
