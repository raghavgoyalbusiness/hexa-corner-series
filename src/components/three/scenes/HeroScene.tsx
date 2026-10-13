'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Speaker } from '../models/Speaker';
import { StudioLights } from '../StudioLights';
import { attachPointer, pointer } from '@/lib/pointer';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;

/** A single speaker floating in a dark warm room, tilting toward the cursor. */
export default function HeroScene({ progress, mobile, reduced }: SceneProps) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const lift = useRef<THREE.Group>(null);
  const p = useRef(0);

  useEffect(attachPointer, []);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 6, dt);
    const t = state.clock.elapsedTime;

    if (spin.current && !reduced) {
      // Slow turn that keeps the grille mostly facing us.
      spin.current.rotation.y = Math.sin(t * 0.22) * 0.75 - 0.25;
      spin.current.rotation.x = 0.18 + Math.sin(t * 0.17) * 0.06;
    }
    if (tilt.current && !reduced && !mobile) {
      tilt.current.rotation.x = damp(tilt.current.rotation.x, -pointer.y * 0.22, 3, dt);
      tilt.current.rotation.y = damp(tilt.current.rotation.y, pointer.x * 0.32, 3, dt);
      tilt.current.position.x = damp(tilt.current.position.x, pointer.x * 0.12, 3, dt);
    }
    if (lift.current) {
      // As the hero scrolls away the speaker rises and recedes.
      lift.current.position.y = 0.62 + p.current * 1.6;
      lift.current.position.z = -p.current * 1.5;
    }
  });

  return (
    <>
      <StudioLights />
      <group ref={lift} position={[0, 0.62, 0]}>
        <group ref={tilt}>
          <Float
            enabled={!reduced}
            speed={1.1}
            rotationIntensity={0.15}
            floatIntensity={0.5}
            floatingRange={[-0.08, 0.08]}
          >
            <group ref={spin} rotation={[0.18, -0.25, 0]}>
              <Speaker scale={mobile ? 0.72 : 0.86} position={[0, 0, -0.3]} />
            </group>
          </Float>
        </group>
      </group>
      {!mobile && (
        <ContactShadows
          position={[0, -1.55, 0]}
          opacity={0.55}
          scale={7}
          blur={2.8}
          far={3.5}
          resolution={256}
          color="#000000"
        />
      )}
      <Sparkles
        count={mobile ? 18 : 60}
        scale={[9, 5, 4]}
        size={mobile ? 1.6 : 2.2}
        speed={reduced ? 0 : 0.22}
        opacity={0.55}
        color="#E8A866"
      />
    </>
  );
}
