'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import type * as THREE from 'three';
import { CornerSub, SUB } from '../../models/Sub';
import { StudioLights } from '../../StudioLights';
import type { SceneProps } from '../types';

/** The Sub on a slow turntable beside the spec table. */
export default function SubSpecScene({ mobile, reduced }: Omit<SceneProps, 'progress'>) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current && !reduced) spin.current.rotation.y += dt * 0.25;
  });
  // Rotate about the footprint's centroid, not the back corner.
  const c = SUB.leg / 3;
  return (
    <>
      <StudioLights />
      <group ref={spin} rotation={[0, Math.PI / 4 + 0.6, 0]} position={[0, -SUB.height / 2, 0]}>
        <CornerSub position={[-c, 0, -c]} withFloorLight={false} />
      </group>
      {!mobile && (
        <ContactShadows position={[0, -SUB.height / 2, 0]} opacity={0.55} scale={10} blur={2.4} far={3} resolution={256} />
      )}
    </>
  );
}
