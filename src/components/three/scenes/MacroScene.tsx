'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { DepthOfFieldEffect } from 'postprocessing';
import * as THREE from 'three';
import { Speaker } from '../models/Speaker';
import { StudioLights } from '../StudioLights';
import { lerp } from '@/lib/math';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;

/**
 * Macro dolly along the serrated ring with shallow depth of field.
 * Mobile skips the DOF pass (expensive) and keeps the dolly.
 */
export default function MacroScene({ progress, mobile, reduced }: SceneProps) {
  const p = useRef(progress.current.value);
  const sweep = useRef<THREE.PointLight>(null);
  const dof = useRef<DepthOfFieldEffect>(null);
  const focus = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 4, dt);
    const t = reduced ? 0 : state.clock.elapsedTime;

    // Angle around the ring that the camera is studying.
    const a = lerp(0.35, 1.25, p.current) + Math.sin(t * 0.12) * 0.04;
    const r = 0.92;
    focus.set(Math.cos(a) * r, Math.sin(a) * r, 0.46);

    const camA = a - 0.32;
    state.camera.position.set(Math.cos(camA) * 1.55, Math.sin(camA) * 1.55, lerp(1.0, 0.82, p.current));
    state.camera.up.set(0, 0, 1);
    state.camera.lookAt(focus.x * 0.82, focus.y * 0.82, 0.42);

    if (dof.current?.target) dof.current.target.copy(focus);

    // A thin amber light slides across the teeth.
    if (sweep.current) {
      const s = a + 0.5 + Math.sin(t * 0.5) * 0.25;
      sweep.current.position.set(Math.cos(s) * 1.6, Math.sin(s) * 1.6, 0.9);
    }
  });

  return (
    <>
      <StudioLights intensity={0.9} />
      <pointLight ref={sweep} intensity={3} distance={3} decay={2} color="#E8A866" />
      <Speaker />
      {!mobile && (
        <EffectComposer multisampling={0}>
          <DepthOfField ref={dof} target={[0.8, 0.4, 0.46]} focalLength={0.04} bokehScale={6} height={540} />
          <Vignette offset={0.2} darkness={0.8} />
        </EffectComposer>
      )}
    </>
  );
}
