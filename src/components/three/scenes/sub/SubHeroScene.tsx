'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { CornerSub } from '../../models/Sub';
import { StudioLights } from '../../StudioLights';
import { attachPointer, pointer } from '@/lib/pointer';
import { lerp } from '@/lib/math';
import { BassRings, CornerShell } from './shared';
import type { SceneProps } from '../types';

const { damp } = THREE.MathUtils;

/** The Sub in its floor corner: warm uplight, slow low-frequency rings, gentle orbit. */
export default function SubHeroScene({ progress, mobile, reduced }: SceneProps) {
  const p = useRef(0);
  const center = useRef(new THREE.Vector3(0.9, 0, 0.9));
  const gain = useRef(0.75);
  const look = useMemo(() => new THREE.Vector3(), []);
  const par = useRef({ x: 0, y: 0 });

  useEffect(attachPointer, []);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 6, dt);
    const t = reduced ? 0 : state.clock.elapsedTime;
    if (!reduced && !mobile) {
      par.current.x = damp(par.current.x, pointer.x, 2.5, dt);
      par.current.y = damp(par.current.y, pointer.y, 2.5, dt);
    }
    const aspect = state.size.width / state.size.height;
    const k = aspect < 0.8 ? 1.7 : Math.max(1, 1.4 / aspect);
    // Orbit around the corner diagonal; scroll dollies in and lowers the eye.
    const a = Math.PI / 4 + Math.sin(t * 0.08) * 0.12 + par.current.x * 0.1;
    const dist = lerp(23, 17, p.current) * k;
    const h = lerp(11.5, 7, p.current) + par.current.y * 0.6;
    state.camera.position.set(Math.cos(a) * dist, h, Math.sin(a) * dist);
    // On wide screens park the Sub right of centre so the headline has the left.
    const side = aspect > 1.1 ? 3.6 : 0;
    look.set(1.3 - side * 0.707, lerp(2.2, 1.9, p.current) + (aspect < 0.8 ? -4.2 : 0), 1.3 + side * 0.707);
    state.camera.lookAt(look);
    // A slow "heartbeat" in the floor rings.
    gain.current = 0.6 + 0.25 * Math.max(0, Math.sin(t * 1.4)) ** 6;
  });

  return (
    <>
      <fog attach="fog" args={['#0E0D0C', 30, 55]} />
      <StudioLights intensity={0.8} />
      <pointLight position={[5, 9, 5]} intensity={18} distance={22} decay={2} color="#ffd9b0" />
      {/* Amber wall-washers either side of the Sub so the corner reads. */}
      <pointLight position={[6.5, 2.6, 1.1]} intensity={22} distance={13} decay={2} color="#E8A866" />
      <pointLight position={[1.1, 2.6, 6.5]} intensity={22} distance={13} decay={2} color="#E8A866" />
      <pointLight position={[2.2, 9, 2.2]} intensity={10} distance={12} decay={2} color="#ffd9b0" />
      <directionalLight position={[14, 10, 14]} intensity={1.6} color="#ffe2c2" />
      <CornerShell />
      <CornerSub />
      <BassRings center={center} gain={gain} count={mobile ? 3 : 5} speed={0.18} reach={[6, 12]} reduced={reduced} />
      <Sparkles
        count={mobile ? 16 : 50}
        scale={[14, 9, 14]}
        position={[6, 4.5, 6]}
        size={mobile ? 2 : 3}
        speed={reduced ? 0 : 0.2}
        opacity={0.5}
        color="#E8A866"
      />
    </>
  );
}
