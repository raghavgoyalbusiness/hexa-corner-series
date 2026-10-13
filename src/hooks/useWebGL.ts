'use client';

import { useEffect, useState } from 'react';

let cached: boolean | null = null;

function detect() {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    cached = !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    cached = false;
  }
  return cached;
}

/** null while unknown (SSR / first paint), then true / false. */
export function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => setOk(detect()), []);
  return ok;
}
