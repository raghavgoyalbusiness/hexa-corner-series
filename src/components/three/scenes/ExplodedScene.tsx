'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SpeakerPart, type PartName } from '../models/Speaker';
import { StudioLights } from '../StudioLights';
import { exploded } from '@/lib/content';
import { lerp, smoothstep } from '@/lib/math';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;

/** Exploded offset along Z for each layer, and which side its label sits on. */
const LAYERS: { name: PartName; z: number; side: 1 | -1 }[] = [
  { name: 'grille', z: 2.7, side: 1 },
  { name: 'driver', z: 1.4, side: -1 },
  { name: 'housing', z: 0, side: 1 },
  { name: 'magnet', z: -1.25, side: -1 },
  { name: 'plate', z: -2.5, side: 1 },
];

/** Timeline (progress → state), shared with the HTML so they stay in sync. */
export const explodeAmount = (p: number) => smoothstep(0.08, 0.38, p) * (1 - smoothstep(0.74, 0.94, p));
export const labelAmount = (p: number, i: number) =>
  smoothstep(0.3 + i * 0.045, 0.36 + i * 0.045, p) * (1 - smoothstep(0.68, 0.74, p));

export default function ExplodedScene({ progress, mobile }: SceneProps) {
  const root = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const p = useRef(progress.current.value);

  useFrame((_, dt) => {
    p.current = damp(p.current, progress.current.value, 7, dt);
    const e = explodeAmount(p.current);

    if (root.current) {
      if (mobile) {
        // Portrait: tip the stack so it explodes down the screen, labels to the right.
        root.current.rotation.x = lerp(0.15, 1.12, e);
        root.current.rotation.y = lerp(-0.35, -0.3, e) + p.current * 0.2;
        root.current.position.x = lerp(0, -0.42, e);
      } else {
        root.current.rotation.y = lerp(-0.55, -1.08, e) + p.current * 0.35;
        root.current.rotation.x = lerp(0.18, 0.28, e);
        root.current.position.x = lerp(1.25, 0.45, e);
        root.current.scale.setScalar(lerp(1.45, 0.9, e));
      }
    }
    LAYERS.forEach((l, i) => {
      const g = layers.current[i];
      if (g) g.position.z = l.z * e;
      const el = labels.current[i];
      if (el) {
        const a = labelAmount(p.current, i);
        el.style.opacity = String(a);
        el.style.setProperty('--line', String(a));
      }
    });
  });

  return (
    <>
      <StudioLights intensity={1.1} />
      <group ref={root} scale={mobile ? 0.5 : 0.9}>
        <group position={[0, 0, -0.27]}>
          {LAYERS.map((l, i) => {
            const copy = exploded.layers[i];
            return (
              <group
                key={l.name}
                ref={(g) => {
                  layers.current[i] = g;
                }}
              >
                <SpeakerPart name={l.name} />
                <Html
                  position={
                    mobile
                      ? [l.name === 'plate' ? 0.75 : 0.95, 0, 0.25]
                      : [0, l.side * (l.name === 'plate' ? 1.2 : 1.0), 0.25]
                  }
                  zIndexRange={[20, 0]}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    ref={(el) => {
                      labels.current[i] = el;
                    }}
                    className={`callout ${mobile ? 'callout-side' : l.side > 0 ? 'callout-up' : 'callout-down'}`}
                    style={{ opacity: 0 }}
                  >
                    <span className="callout-dot" />
                    <span className="callout-line" />
                    <span className="callout-text">
                      <span className="callout-title">{copy.title}</span>
                      <span className="callout-note">{copy.note}</span>
                    </span>
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      </group>
    </>
  );
}
