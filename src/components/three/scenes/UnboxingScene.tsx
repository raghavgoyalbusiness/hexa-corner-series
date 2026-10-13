'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Speaker } from '../models/Speaker';
import { lidLogoTexture } from '../models/textures';
import { StudioLights } from '../StudioLights';
import { easeInOutCubic, easeOutCubic, lerp, range, smoothstep } from '@/lib/math';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;

// Product units (10 cm). A 3 × 2 foam tray for six Ø18 cm pucks.
const PITCH = 2.15;
const SLOTS = [-1, 0, 1].flatMap((c) => [-0.5, 0.5].map((r) => [c * PITCH, r * PITCH] as [number, number]));
const BOX = { w: 6.8, d: 4.6, h: 1.1, wall: 0.08 };

export const lidAmount = (p: number) => easeInOutCubic(range(0.08, 0.42, p));
export const clearAmount = (p: number) => easeInOutCubic(range(0.42, 0.66, p));

export default function UnboxingScene({ progress, mobile }: SceneProps) {
  const lid = useRef<THREE.Group>(null);
  const pucks = useRef<(THREE.Group | null)[]>([]);
  const p = useRef(progress.current.value);

  const black = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({ color: '#0f0e0d', roughness: 0.82, clearcoat: 0.08, clearcoatRoughness: 0.9 }),
    [],
  );
  const foam = useMemo(() => new THREE.MeshStandardMaterial({ color: '#191715', roughness: 1 }), []);
  const logo = useMemo(() => lidLogoTexture(), []);

  const foamTop = useMemo(() => {
    const s = new THREE.Shape();
    const w = BOX.w - BOX.wall * 2 - 0.02;
    const d = BOX.d - BOX.wall * 2 - 0.02;
    s.moveTo(-w / 2, -d / 2);
    s.lineTo(w / 2, -d / 2);
    s.lineTo(w / 2, d / 2);
    s.lineTo(-w / 2, d / 2);
    s.closePath();
    SLOTS.forEach(([x, z]) => {
      const hole = new THREE.Path();
      hole.absarc(x, -z, 0.97, 0, Math.PI * 2, true);
      s.holes.push(hole);
    });
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: false, curveSegments: 48 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 6, dt);
    const pv = p.current;
    const l = lidAmount(pv);
    const c = clearAmount(pv);

    if (lid.current) {
      lid.current.position.set(0, l * 2.2 + c * 3.5, -c * 6);
      lid.current.rotation.x = -l * 0.18 - c * 0.7;
      lid.current.visible = c < 0.999;
    }
    // Each puck lifts a touch, in sequence, once the lid has gone.
    pucks.current.forEach((g, i) => {
      if (!g) return;
      const a = easeOutCubic(range(0.62 + i * 0.035, 0.74 + i * 0.035, pv));
      g.position.y = 0.5 + a * 0.18;
    });

    // Camera: low three-quarter → near top-down as the tray is revealed.
    const cam = smoothstep(0.1, 0.8, pv);
    const aspect = state.size.width / state.size.height;
    const k = Math.max(1, 1.25 / aspect);
    state.camera.position.set(lerp(-1.5, 0, cam) * k, lerp(5.2, 10.6, cam) * k, lerp(9.2, 6.6, cam) * k);
    state.camera.lookAt(0, lerp(0.8, 0.2, cam), lerp(0, -0.2, cam));
  });

  const { w, d, h, wall } = BOX;

  return (
    <>
      <StudioLights intensity={1.1} />
      <spotLight position={[0, 9, 3]} angle={0.5} penumbra={0.8} intensity={30} distance={20} color="#ffd9b0" />

      {/* Base tray */}
      <group>
        <mesh material={black} position={[0, wall / 2, 0]}>
          <boxGeometry args={[w, wall, d]} />
        </mesh>
        {[
          [0, h / 2, d / 2 - wall / 2, w, wall],
          [0, h / 2, -d / 2 + wall / 2, w, wall],
        ].map(([x, y, z, sx, sz], i) => (
          <mesh key={`z${i}`} material={black} position={[x, y, z]}>
            <boxGeometry args={[sx, h, sz]} />
          </mesh>
        ))}
        {[-1, 1].map((sgn) => (
          <mesh key={`x${sgn}`} material={black} position={[sgn * (w / 2 - wall / 2), h / 2, 0]}>
            <boxGeometry args={[wall, h, d - wall * 2]} />
          </mesh>
        ))}
        {/* Foam: a floor plus a top layer with six cut-outs. */}
        <mesh material={foam} position={[0, 0.3, 0]}>
          <boxGeometry args={[w - wall * 2, 0.4, d - wall * 2]} />
        </mesh>
        <mesh material={foam} geometry={foamTop} position={[0, 0.55, 0]} />
      </group>

      {SLOTS.map(([x, z], i) => (
        <group
          key={i}
          ref={(g) => {
            pucks.current[i] = g;
          }}
          position={[x, 0.5, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <Speaker withDriver={false} />
        </group>
      ))}

      {/* Lid: top + skirt, hinged visually by the animation. */}
      <group ref={lid}>
        <mesh material={black} position={[0, h + 0.14, 0]}>
          <boxGeometry args={[w + 0.12, 0.08, d + 0.12]} />
        </mesh>
        {[-1, 1].map((sgn) => (
          <mesh key={`lz${sgn}`} material={black} position={[0, h - 0.15, sgn * (d / 2 + 0.03)]}>
            <boxGeometry args={[w + 0.12, 0.66, 0.06]} />
          </mesh>
        ))}
        {[-1, 1].map((sgn) => (
          <mesh key={`lx${sgn}`} material={black} position={[sgn * (w / 2 + 0.03), h - 0.15, 0]}>
            <boxGeometry args={[0.06, 0.66, d]} />
          </mesh>
        ))}
        <mesh position={[0, h + 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.4, 1.7]} />
          <meshStandardMaterial map={logo} transparent roughness={0.35} metalness={0.4} depthWrite={false} />
        </mesh>
      </group>

      {!mobile && (
        <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={14} blur={2.5} far={4} resolution={256} />
      )}
    </>
  );
}
