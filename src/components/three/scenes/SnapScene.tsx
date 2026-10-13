'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Speaker, SpeakerPart } from '../models/Speaker';
import { cornerQuaternion } from '../models/geometry';
import { StudioLights } from '../StudioLights';
import { easeInCubic, easeOutCubic, lerp, range, smoothstep } from '@/lib/math';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;

/*
 * A ceiling corner at the origin: left wall on x = 0, back wall on z = 0,
 * ceiling on y = 0; the room is +x, -y, +z. Metres. The speaker is 18 cm.
 */
const S3 = 1 / Math.sqrt(3);
const INWARD: THREE.Vector3Tuple = [S3, -S3, S3];
const EDGE: THREE.Vector3Tuple = [0, -1, 0];
const D = new THREE.Vector3(...INWARD);
/** Distance from the corner (along D) where the plate's vertices meet the edges. */
const SEAT = 0.105;
const SCALE = 0.1; // product units (10 cm) → metres
// Screen-space-ish directions for the fly-in path (both perpendicular to D).
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const UP = new THREE.Vector3().crossVectors(D, RIGHT).normalize();

/** Timeline, shared with the HTML copy. */
export const SNAP_AT = 0.72;
export const plateAmount = (p: number) => smoothstep(0.06, 0.34, p);
export const flyAmount = (p: number) => range(0.4, SNAP_AT, p);

export default function SnapScene({ progress, mobile, reduced, onSnap }: SceneProps & { onSnap?: () => void }) {
  const plate = useRef<THREE.Group>(null);
  const speaker = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Mesh>(null);
  const p = useRef(progress.current.value);
  const snapped = useRef(progress.current.value >= SNAP_AT);
  const bounceT = useRef(10);

  const quat = useMemo(() => cornerQuaternion(INWARD, EDGE), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    // Scrubbed, but tight, so the snap lands where the scroll says it does.
    p.current = damp(p.current, progress.current.value, 9, dt);
    const pv = p.current;

    // 1. Plate glides in and presses into the corner.
    const pa = easeOutCubic(plateAmount(pv));
    if (plate.current) {
      const press = Math.sin(smoothstep(0.28, 0.36, pv) * Math.PI) * 0.06;
      plate.current.position.copy(D).multiplyScalar(lerp(0.75, SEAT, pa) - press * 0.02);
      plate.current.scale.set(SCALE, SCALE, SCALE * (1 - press));
      plate.current.visible = pa > 0.001 || reduced;
    }

    // 2. Speaker flies in, hovers, then the magnet pulls it home.
    const fa = flyAmount(pv);
    if (speaker.current) {
      const hover = 0.34;
      let dist: number;
      let side: number;
      if (fa < 0.7) {
        const t = easeOutCubic(fa / 0.7);
        dist = lerp(0.95, hover, t);
        side = lerp(0.55, 0, t);
      } else {
        dist = lerp(hover, SEAT, easeInCubic((fa - 0.7) / 0.3));
        side = 0;
      }

      // Snap detection (forward only) → click + bounce + flash.
      if (!snapped.current && pv >= SNAP_AT - 0.002) {
        snapped.current = true;
        bounceT.current = 0;
        onSnap?.();
      } else if (snapped.current && pv < SNAP_AT - 0.05) {
        snapped.current = false;
      }
      bounceT.current += dt;
      const b = bounceT.current;
      const bounce = b < 1.2 && !reduced ? Math.exp(-7 * b) * Math.sin(b * 26) * 0.012 : 0;

      tmp.copy(D).multiplyScalar(dist + bounce);
      tmp.addScaledVector(RIGHT, side).addScaledVector(UP, side * 0.35);
      speaker.current.position.copy(tmp);
      // A lazy spin while in flight that settles to the plate's orientation.
      speaker.current.quaternion.copy(quat);
      speaker.current.rotateZ((1 - easeOutCubic(Math.min(1, fa / 0.85))) * 2.4);
      speaker.current.visible = fa > 0.001 || reduced;

      if (flash.current) {
        const f = Math.min(1, b / 0.7);
        const m = flash.current.material as THREE.MeshBasicMaterial;
        m.opacity = b < 0.7 && !reduced ? (1 - f) * 0.8 : 0;
        flash.current.scale.setScalar(SCALE * (1 + f * 0.9));
        flash.current.position.copy(D).multiplyScalar(SEAT + 0.03);
      }
    }

    // Gentle drift so the frame never feels static.
    const t = reduced ? 0 : state.clock.elapsedTime;
    state.camera.position.set(
      0.62 + Math.sin(t * 0.2) * 0.02 - pv * 0.05,
      -0.58 + pv * 0.04,
      0.72 + Math.cos(t * 0.2) * 0.02,
    );
    state.camera.lookAt(D.x * 0.1, D.y * 0.1 - 0.02, D.z * 0.1);
  });

  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3b342d', roughness: 0.96 }), []);
  const ceiling = useMemo(() => new THREE.MeshStandardMaterial({ color: '#433b33', roughness: 0.96 }), []);

  return (
    <>
      <StudioLights intensity={0.7} />
      {/* Warm uplight pooling into the corner. */}
      <pointLight position={[0.55, -0.9, 0.6]} intensity={2.2} distance={3} decay={2} color="#E8A866" />
      <pointLight position={[0.9, -0.2, 1.2]} intensity={0.8} distance={3} decay={2} color="#ffd9b0" />

      <mesh material={wall} position={[0, -1.5, 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 3]} />
      </mesh>
      <mesh material={wall} position={[2, -1.5, 0]}>
        <planeGeometry args={[4, 3]} />
      </mesh>
      <mesh material={ceiling} position={[2, 0, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
      </mesh>

      <group ref={plate} quaternion={quat}>
        <SpeakerPart name="plate" />
      </group>

      <group ref={speaker} scale={SCALE}>
        <Speaker withDriver={!mobile} />
      </group>

      <mesh ref={flash} quaternion={quat}>
        <ringGeometry args={[0.95, 1.05, 96]} />
        <meshBasicMaterial color="#E8A866" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}
