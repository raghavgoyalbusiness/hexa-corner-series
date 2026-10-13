'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Speaker } from '../models/Speaker';
import { StudioLights } from '../StudioLights';
import { attachPointer, pointer } from '@/lib/pointer';
import { easeInOutCubic, lerp, range } from '@/lib/math';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;
const WAVE = '#3B82F6';

type Vec3 = [number, number, number];

/**
 * Five satellites drift in the dark around the hero speaker. On scroll all six
 * fly into a hexagon (slot 0 = top, counter-clockwise), then sound rings flow
 * from each speaker into the centre: six corners, one room.
 */
const SATELLITES: { slot: number; rest: Vec3; rot: Vec3; scale: number; phase: number }[] = [
  { slot: 5, rest: [2.85, 0.5, 1.0], rot: [0.12, -0.75, 0.06], scale: 0.8, phase: 0.3 },
  { slot: 4, rest: [3.35, -1.5, -2.2], rot: [-0.2, -0.95, 0.1], scale: 0.72, phase: 1.7 },
  { slot: 3, rest: [1.2, -2.75, -4.6], rot: [-0.45, -0.3, 0], scale: 0.8, phase: 2.4 },
  { slot: 2, rest: [-3.05, -1.25, -1.6], rot: [0.1, 0.85, -0.05], scale: 0.72, phase: 3.1 },
  { slot: 1, rest: [-3.45, 1.45, -3.6], rot: [0.3, 0.55, 0], scale: 0.85, phase: 4.2 },
];

const MAIN_REST: Vec3 = [0, 0.62, 0];

/** Timeline, shared with the hero HTML. */
export const formAmount = (p: number) => easeInOutCubic(range(0.06, 0.62, p));
export const ringsAmount = (p: number) => range(0.55, 0.72, p);

export default function HeroScene({ progress, mobile, reduced }: SceneProps) {
  const tilt = useRef<THREE.Group>(null);
  const formation = useRef<THREE.Group>(null);
  const main = useRef<THREE.Group>(null);
  const mainSpin = useRef<THREE.Group>(null);
  const sats = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const p = useRef(0);

  useEffect(attachPointer, []);

  const hex = useMemo(() => {
    const R = mobile ? 0.74 : 1.18;
    const y0 = mobile ? 0.15 : 0.05;
    return Array.from({ length: 6 }, (_, k) => {
      const a = Math.PI / 2 + (k * Math.PI) / 3;
      return new THREE.Vector3(Math.cos(a) * R, y0 + Math.sin(a) * R, 0);
    });
  }, [mobile]);
  const formedScale = mobile ? 0.28 : 0.4;
  const mainScale = mobile ? 0.72 : 0.86;
  // On narrow screens pull the satellites in so they stay in frame.
  const spread = mobile ? 0.42 : 1;
  const center = hex[0].clone().setY(mobile ? 0.15 : 0.05).setX(0);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 6, dt);
    const pv = p.current;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const form = formAmount(pv);

    // Main speaker: idle turn → faces us at the top of the hexagon.
    if (main.current) {
      const bob = Math.sin(t * 0.9) * 0.06 * (1 - form);
      main.current.position.set(
        lerp(MAIN_REST[0], hex[0].x, form),
        lerp(MAIN_REST[1], hex[0].y, form) + bob,
        lerp(MAIN_REST[2], hex[0].z, form),
      );
      main.current.scale.setScalar(lerp(mainScale, formedScale, form));
    }
    if (mainSpin.current) {
      mainSpin.current.rotation.y = lerp(Math.sin(t * 0.22) * 0.75 - 0.25, 0, form);
      mainSpin.current.rotation.x = lerp(0.18 + Math.sin(t * 0.17) * 0.06, 0, form);
    }

    // Satellites: drift in depth, then fly to their hexagon slot (staggered).
    SATELLITES.forEach((s, i) => {
      const g = sats.current[i];
      if (!g) return;
      const f = easeInOutCubic(range(0.06 + i * 0.035, 0.5 + i * 0.035, pv));
      const drift = (1 - f) * (reduced ? 0 : 1);
      const target = hex[s.slot];
      g.position.set(
        lerp(s.rest[0] * spread, target.x, f) + Math.sin(t * 0.3 + s.phase) * 0.08 * drift,
        lerp(s.rest[1] * (mobile ? 0.8 : 1), target.y, f) + Math.sin(t * 0.55 + s.phase) * 0.1 * drift,
        lerp(s.rest[2], target.z, f),
      );
      g.rotation.set(
        lerp(s.rot[0] + Math.sin(t * 0.2 + s.phase) * 0.12 * drift, 0, f),
        lerp(s.rot[1] + Math.sin(t * 0.16 + s.phase) * 0.25 * drift, 0, f),
        lerp(s.rot[2], 0, f),
      );
      g.scale.setScalar(lerp(s.scale * (mobile ? 0.7 : 1), formedScale, f));
    });

    // Formed hexagon breathes, then recedes as the section ends.
    if (formation.current) {
      formation.current.rotation.z = Math.sin(t * 0.12) * 0.04 * form;
      formation.current.position.z = -range(0.78, 1, pv) * 1.2;
    }

    // Blue rings flow from each speaker into the centre (the listener).
    const ra = ringsAmount(pv);
    rings.current.forEach((m, i) => {
      if (!m) return;
      const k = Math.floor(i / 2);
      const f = (t * 0.32 + (i % 2) * 0.5 + k * 0.07) % 1;
      // Rings travel ~halfway in and fade, leaving the centre caption clear.
      m.position.lerpVectors(hex[k], center, f * 0.55);
      m.position.z += 0.3;
      m.scale.setScalar(formedScale * (1.05 + f * 0.25));
      (m.material as THREE.MeshBasicMaterial).opacity = Math.pow(1 - f, 1.6) * 0.55 * ra;
      m.visible = ra > 0.001;
    });

    if (tilt.current && !reduced && !mobile) {
      tilt.current.rotation.x = damp(tilt.current.rotation.x, -pointer.y * 0.12, 3, dt);
      tilt.current.rotation.y = damp(tilt.current.rotation.y, pointer.x * 0.2, 3, dt);
      tilt.current.position.x = damp(tilt.current.position.x, pointer.x * 0.1, 3, dt);
    }
  });

  const ringGeo = useMemo(() => new THREE.RingGeometry(0.975, 1, 96), []);
  const ringMats = useMemo(
    () =>
      Array.from(
        { length: 12 },
        () =>
          new THREE.MeshBasicMaterial({
            color: WAVE,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
      ),
    [],
  );

  return (
    <>
      <fog attach="fog" args={['#0E0D0C', 6.5, 14]} />
      <StudioLights />
      <group ref={tilt}>
        <group ref={formation}>
          <group ref={main} position={MAIN_REST} scale={mainScale}>
            <group ref={mainSpin} rotation={[0.18, -0.25, 0]}>
              <Speaker position={[0, 0, -0.27]} />
            </group>
          </group>
          {SATELLITES.map((s, i) => (
            <group
              key={s.slot}
              ref={(g) => {
                sats.current[i] = g;
              }}
              position={s.rest}
              rotation={s.rot}
              scale={s.scale}
            >
              <Speaker position={[0, 0, -0.27]} withDriver={false} />
            </group>
          ))}
          {ringMats.map((m, i) => (
            <mesh
              key={i}
              ref={(r) => {
                rings.current[i] = r;
              }}
              geometry={ringGeo}
              material={m}
              visible={false}
            />
          ))}
        </group>
      </group>
      {!mobile && (
        <ContactShadows
          position={[0, -1.75, 0]}
          opacity={0.5}
          scale={10}
          blur={2.8}
          far={4}
          resolution={256}
          color="#000000"
        />
      )}
      <Sparkles
        count={mobile ? 18 : 70}
        scale={[11, 6, 6]}
        size={mobile ? 1.6 : 2.2}
        speed={reduced ? 0 : 0.22}
        opacity={0.55}
        color="#E8A866"
      />
    </>
  );
}
