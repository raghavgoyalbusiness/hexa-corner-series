'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CornerSub } from '../../models/Sub';
import { StudioLights } from '../../StudioLights';
import { easeInOutCubic, lerp, smoothstep } from '@/lib/math';
import { backWallAmount, gainDb, leftWallAmount } from '@/lib/subTimeline';
import { BassRings, CornerShell, setWallRise } from './shared';
import type { SceneProps } from '../types';

const { damp } = THREE.MathUtils;

export default function CornerGainScene({ progress, mobile, reduced }: SceneProps) {
  const p = useRef(progress.current.value);
  const back = useRef<THREE.Mesh | null>(null);
  const left = useRef<THREE.Mesh | null>(null);
  const sub = useRef<THREE.Group>(null);
  const center = useRef(new THREE.Vector3());
  const gain = useRef(0);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 6, dt);
    const pv = p.current;
    const b = backWallAmount(pv);
    const l = leftWallAmount(pv);

    setWallRise(back.current, easeInOutCubic(b));
    setWallRise(left.current, easeInOutCubic(l));

    // The Sub slides back to the first wall, then sideways into the corner.
    const x = lerp(2.6, 0, easeInOutCubic(smoothstep(0.6, 0.78, pv)));
    const z = lerp(2.6, 0, easeInOutCubic(smoothstep(0.25, 0.43, pv)));
    sub.current?.position.set(x, 0, z);
    center.current.set(x + 0.9, 0, z + 0.9);
    gain.current = gainDb(pv) / 9;

    const aspect = state.size.width / state.size.height;
    const k = aspect < 0.8 ? 1.9 : Math.max(1, 1.4 / aspect);
    const t = reduced ? 0 : state.clock.elapsedTime;
    const a = Math.PI / 4 + Math.sin(t * 0.1) * 0.05;
    state.camera.position.set(Math.cos(a) * 23 * k + 1, 13 * (aspect < 0.8 ? 1.4 : 1), Math.sin(a) * 23 * k + 1);
    // Wide screens: room sits right of centre, copy and meter on the left.
    const side = aspect > 1.1 ? 4 : 0;
    look.set(2 - side * 0.707, aspect < 0.8 ? 6.5 : 1.4, 2 + side * 0.707);
    state.camera.lookAt(look);
  });

  return (
    <>
      <StudioLights intensity={0.8} />
      <pointLight position={[6, 10, 6]} intensity={16} distance={24} decay={2} color="#ffd9b0" />
      <directionalLight position={[14, 12, 14]} intensity={0.9} color="#ffe2c2" />
      <CornerShell backWall={back} leftWall={left} />
      <group ref={sub} position={[2.6, 0, 2.6]}>
        <CornerSub withFloorLight={!mobile} />
      </group>
      <BassRings center={center} gain={gain} count={mobile ? 4 : 6} speed={0.2} reach={[5, 13]} reduced={reduced} />
    </>
  );
}
