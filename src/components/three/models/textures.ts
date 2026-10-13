'use client';

import * as THREE from 'three';

/**
 * Procedural textures, generated once on the client and shared by every
 * canvas (three.js tracks GPU uploads per renderer, so sharing is safe).
 * PLACEHOLDER: replace with photographed / baked maps when available.
 */

const cache = new Map<string, THREE.Texture | { map: THREE.Texture; normalMap: THREE.Texture }>();

function dataTex(data: Uint8Array, size: number, srgb: boolean) {
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Plain-weave acoustic fabric: colour map + tangent-space normal map. */
export function fabricTextures() {
  const hit = cache.get('fabric');
  if (hit) return hit as { map: THREE.Texture; normalMap: THREE.Texture };

  const size = 256;
  const threads = 16;
  const cell = size / threads;
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = Math.floor(x / cell);
      const j = Math.floor(y / cell);
      const fx = (x % cell) / cell;
      const fy = (y % cell) / cell;
      const warpOnTop = (i + j) % 2 === 0;
      // Thread cross-section across its width, bulging where it crosses over.
      const warp = Math.pow(Math.sin(Math.PI * fx), 0.7) * (warpOnTop ? 0.65 + 0.35 * Math.sin(Math.PI * fy) : 0.35);
      const weft = Math.pow(Math.sin(Math.PI * fy), 0.7) * (!warpOnTop ? 0.65 + 0.35 * Math.sin(Math.PI * fx) : 0.35);
      height[y * size + x] = Math.max(warp, weft) * (0.92 + Math.random() * 0.08);
    }
  }

  const color = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  const strength = 2.2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = (y * size + x) * 4;
      const v = h(x, y);
      const c = 46 + v * 74;
      color[k] = c + 2;
      color[k + 1] = c;
      color[k + 2] = c - 2;
      color[k + 3] = 255;

      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      normal[k] = ((-dx / len) * 0.5 + 0.5) * 255;
      normal[k + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      normal[k + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      normal[k + 3] = 255;
    }
  }

  const out = { map: dataTex(color, size, true), normalMap: dataTex(normal, size, false) };
  out.map.repeat.set(7, 7);
  out.normalMap.repeat.set(7, 7);
  cache.set('fabric', out);
  return out;
}

function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const hit = cache.get(key);
  if (hit) return hit as THREE.Texture;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

/** Night skyline for the living-room window. PLACEHOLDER art. */
export function cityTexture() {
  return canvasTex('city', 1024, 640, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 640);
    sky.addColorStop(0, '#05070d');
    sky.addColorStop(0.65, '#121626');
    sky.addColorStop(1, '#2a1f1a');
    g.fillStyle = sky;
    g.fillRect(0, 0, 1024, 640);

    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    for (let layer = 0; layer < 3; layer++) {
      const shade = ['#0b0d14', '#0e1018', '#12131a'][layer];
      let x = -20;
      while (x < 1040) {
        const bw = 40 + rnd() * (110 - layer * 20);
        const bh = 140 + rnd() * (380 - layer * 90);
        const top = 640 - bh;
        g.fillStyle = shade;
        g.fillRect(x, top, bw, bh);
        for (let wy = top + 10; wy < 630; wy += 14) {
          for (let wx = x + 6; wx < x + bw - 6; wx += 10) {
            const r = rnd();
            if (r > 0.72 - layer * 0.08) {
              const warm = rnd() > 0.25;
              g.fillStyle = warm
                ? `rgba(240,${170 + rnd() * 50},${100 + rnd() * 40},${0.35 + rnd() * 0.5})`
                : `rgba(160,190,255,${0.25 + rnd() * 0.35})`;
              g.fillRect(wx, wy, 5, 7);
            }
          }
        }
        x += bw + rnd() * 12;
      }
    }
  });
}

/** A warm film still on the TV. PLACEHOLDER art. */
export function screenTexture() {
  return canvasTex('screen', 512, 288, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 288);
    grd.addColorStop(0, '#1a1210');
    grd.addColorStop(0.55, '#6b3a1f');
    grd.addColorStop(0.62, '#c9783c');
    grd.addColorStop(1, '#120c0a');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 288);
    const sun = g.createRadialGradient(330, 168, 4, 330, 168, 90);
    sun.addColorStop(0, 'rgba(255,214,160,0.95)');
    sun.addColorStop(1, 'rgba(255,214,160,0)');
    g.fillStyle = sun;
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = '#0d0907';
    g.beginPath();
    g.moveTo(0, 200);
    g.bezierCurveTo(120, 170, 220, 210, 330, 190);
    g.bezierCurveTo(420, 175, 470, 200, 512, 195);
    g.lineTo(512, 288);
    g.lineTo(0, 288);
    g.fill();
  });
}

/** Debossed wordmark for the box lid. */
export function lidLogoTexture() {
  return canvasTex('lid', 1024, 512, (g) => {
    g.clearRect(0, 0, 1024, 512);
    g.fillStyle = 'rgba(242,238,232,0.9)';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '300 120px "Helvetica Neue", Helvetica, Arial, sans-serif';
    // Manual letter-spacing for the wide-tracked wordmark.
    const word = 'HEXA';
    const spacing = 70;
    const widths = [...word].map((ch) => g.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (word.length - 1);
    let x = 512 - total / 2;
    [...word].forEach((ch, i) => {
      g.fillText(ch, x + widths[i] / 2, 230);
      x += widths[i] + spacing;
    });
    g.fillStyle = 'rgba(232,168,102,0.85)';
    g.font = '400 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
    const sub = 'T H E   C O R N E R   S E R I E S';
    g.fillText(sub, 512, 340);
  });
}
