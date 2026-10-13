// Copies the Draco decoder that ships with three.js into /public/draco so
// Draco-compressed GLBs decode from our own origin (no third-party CDN).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/three/examples/jsm/libs/draco/gltf');
const dest = join(root, 'public/draco');

if (!existsSync(src)) {
  console.warn('[copy-draco] three.js Draco decoder not found, skipping.');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log('[copy-draco] Draco decoder copied to public/draco');
