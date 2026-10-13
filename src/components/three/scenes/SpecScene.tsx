'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import type * as THREE from 'three';
import { Speaker } from '../models/Speaker';
import { StudioLights } from '../StudioLights';
import type { SceneProps } from './types';

/** Slowly rotating reference model beside the spec table. */
export default function SpecScene({ mobile, reduced }: Omit<SceneProps, 'progress'>) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current && !reduced) spin.current.rotation.y += dt * 0.3;
  });
  return (
    <>
      <StudioLights />
      <group ref={spin} rotation={[0.2, -0.6, 0]}>
        <Speaker position={[0, 0, -0.27]} withDriver={false} />
      </group>
      {!mobile && (
        <ContactShadows position={[0, -1.25, 0]} opacity={0.5} scale={5} blur={2.4} far={2.5} resolution={256} />
      )}
    </>
  );
}
