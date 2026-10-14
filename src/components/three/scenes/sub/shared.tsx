'use client';

import { forwardRef, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** A floor corner at the origin: walls on x = 0 and z = 0, room toward +X/+Z. Product units. */
export const WALL = { size: 26, height: 14 };

export const CornerShell = forwardRef<THREE.Group, { backWall?: MutableRefObject<THREE.Mesh | null>; leftWall?: MutableRefObject<THREE.Mesh | null> }>(
  function CornerShell({ backWall, leftWall }, ref) {
    const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a322b', roughness: 0.92 }), []);
    const floor = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.55, metalness: 0.05 }), []);
    const { size, height } = WALL;
    return (
      <group ref={ref}>
        <mesh material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[size / 2 - 4, 0, size / 2 - 4]}>
          <planeGeometry args={[size, size]} />
        </mesh>
        {/* Back wall (z = 0), facing +Z. */}
        <mesh ref={backWall} material={wall} position={[size / 2 - 4, height / 2, 0]}>
          <planeGeometry args={[size, height]} />
        </mesh>
        {/* Left wall (x = 0), facing +X. */}
        <mesh ref={leftWall} material={wall} position={[0, height / 2, size / 2 - 4]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[size, height]} />
        </mesh>
      </group>
    );
  },
);

/** Grow a wall up from the floor: 0 = flat, 1 = full height. */
export function setWallRise(mesh: THREE.Mesh | null, amount: number) {
  if (!mesh) return;
  const a = Math.max(0.0001, amount);
  mesh.scale.y = a;
  mesh.position.y = (WALL.height * a) / 2;
  mesh.visible = amount > 0.001;
}

/**
 * Low-frequency waves as slow blue rings spreading across the floor from a
 * point. `gain` (0..1) makes them reach further and glow brighter; walls
 * occlude them naturally.
 */
export function BassRings({
  center,
  gain,
  count = 5,
  speed = 0.22,
  reach = [5, 11],
  reduced = false,
}: {
  center: MutableRefObject<THREE.Vector3>;
  gain: MutableRefObject<number>;
  count?: number;
  speed?: number;
  reach?: [number, number];
  reduced?: boolean;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const geo = useMemo(() => new THREE.RingGeometry(0.975, 1, 160), []);
  const mats = useMemo(
    () =>
      Array.from(
        { length: count },
        () =>
          new THREE.MeshBasicMaterial({
            color: '#3B82F6',
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
      ),
    [count],
  );

  useFrame((state) => {
    const t = reduced ? 1.7 : state.clock.elapsedTime;
    const g = gain.current;
    const maxR = reach[0] + (reach[1] - reach[0]) * g;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const f = (t * speed + i / count) % 1;
      m.position.set(center.current.x, 0.03, center.current.z);
      m.scale.setScalar(0.4 + f * maxR);
      (m.material as THREE.MeshBasicMaterial).opacity = Math.pow(1 - f, 1.4) * (0.22 + 0.6 * g);
    });
  });

  return (
    <>
      {mats.map((mat, i) => (
        <mesh
          key={i}
          ref={(r) => {
            refs.current[i] = r;
          }}
          geometry={geo}
          material={mat}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
    </>
  );
}
