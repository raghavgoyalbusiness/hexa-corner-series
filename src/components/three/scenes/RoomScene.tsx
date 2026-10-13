'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Speaker } from '../models/Speaker';
import { cornerQuaternion } from '../models/geometry';
import { cityTexture, screenTexture } from '../models/textures';
import { ROOM, SPEAKERS, type Vec3 } from '@/lib/audio/speakers';
import { corners } from '@/lib/content';
import { easeInOutCubic, easeOutBack, range, smoothstep } from '@/lib/math';
import type { SceneProps } from './types';

const { damp } = THREE.MathUtils;
const WAVE = '#3B82F6';
const AMBER = '#E8A866';

/** Speakers are drawn 1.4× life size so they read at room scale. */
const SPEAKER_SCALE = 0.14;
const SEAT = 0.105 * 1.4;

/** Order in which speakers appear, and when (progress). The first is already snapped. */
const APPEAR = ['flh', 'frh', 'fll', 'frl', 'rlh', 'rrh'].map((id, i) => ({
  index: SPEAKERS.findIndex((s) => s.id === id),
  at: i === 0 ? -1 : 0.36 + (i - 1) * 0.065,
}));
export const sweetSpotAmount = (p: number) => smoothstep(0.72, 0.82, p);

const L = new THREE.Vector3(...ROOM.listener);

export default function RoomScene({ progress, mobile, reduced }: SceneProps) {
  const p = useRef(progress.current.value);
  const camera = useThree((s) => s.camera);
  const speakerRefs = useRef<(THREE.Group | null)[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sweet = useRef<THREE.Group>(null);
  const sweetRings = useRef<THREE.Group>(null);
  const sweetLabel = useRef<HTMLDivElement>(null);
  const ringsPer = mobile ? 2 : 3;

  const spots = useMemo(
    () =>
      SPEAKERS.map((s) => {
        const d = new THREE.Vector3(...s.inward);
        const pos = new THREE.Vector3(...s.corner).addScaledVector(d, SEAT);
        return { pos, quat: cornerQuaternion(s.inward, s.edge) };
      }),
    [],
  );

  const camState = useMemo(() => {
    const c = SPEAKERS[0];
    const d = new THREE.Vector3(...c.inward);
    return {
      closePos: new THREE.Vector3(...c.corner).addScaledVector(d, 1.25).add(new THREE.Vector3(0.1, -0.05, 0.05)),
      closeLook: new THREE.Vector3(...c.corner).addScaledVector(d, 0.12),
      widePos: new THREE.Vector3(0, 4.4, 8.6),
      wideLook: new THREE.Vector3(0, 0.95, -0.2),
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      off: new THREE.Vector3(),
    };
  }, []);

  useFrame((state, dt) => {
    p.current = damp(p.current, progress.current.value, 6, dt);
    const pv = p.current;
    const t = reduced ? 1.3 : state.clock.elapsedTime;

    // Camera: tight on the first corner → pull back to reveal the room.
    const pull = easeInOutCubic(range(0.02, 0.36, pv));
    const aspect = state.size.width / state.size.height;
    const portrait = aspect < 0.8;
    const k = portrait ? 1.05 / aspect : Math.max(1, 1.35 / aspect);
    // On wide screens slide the room right so the copy has the left third.
    const shift = aspect > 1.2 ? -1.25 : 0;
    camState.off.copy(camState.widePos).sub(camState.wideLook).multiplyScalar(k).add(camState.wideLook);
    camState.off.x += shift;
    camState.pos.lerpVectors(camState.closePos, camState.off, pull);
    camState.look.lerpVectors(camState.closeLook, camState.wideLook, pull);
    camState.look.x += shift * pull;
    // Portrait: the copy sits on top, so drop the room into the lower half.
    if (portrait) camState.look.y += 2.2 * pull;
    if (!reduced) camState.pos.x += Math.sin(t * 0.15) * 0.15 * pull;
    camera.position.copy(camState.pos);
    camera.lookAt(camState.look);

    // Speakers pop in one by one; each one's rings ramp with it.
    APPEAR.forEach(({ index, at }) => {
      const a = at < 0 ? 1 : easeOutBack(range(at, at + 0.05, pv));
      const g = speakerRefs.current[index];
      if (g) {
        g.scale.setScalar(SPEAKER_SCALE * Math.max(0.0001, a));
        g.visible = a > 0.001;
      }
      const ringOn = at < 0 ? smoothstep(0.3, 0.38, pv) : range(at, at + 0.06, pv);
      const S = spots[index].pos;
      for (let r = 0; r < ringsPer; r++) {
        const mesh = ringRefs.current[index * ringsPer + r];
        if (!mesh) continue;
        const f = (t * 0.28 + r / ringsPer + index * 0.11) % 1;
        mesh.position.lerpVectors(S, L, f);
        mesh.lookAt(L);
        mesh.scale.setScalar(0.06 + f * 0.34 - f * f * 0.22);
        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.pow(Math.sin(Math.PI * f), 1.4) * 0.6 * ringOn;
        mesh.visible = ringOn > 0.001;
      }
    });

    // Sweet spot pulse at the listener's head.
    const s = sweetSpotAmount(pv);
    if (sweet.current) sweet.current.visible = s > 0.001;
    if (sweetRings.current) {
      sweetRings.current.children.forEach((child, i) => {
        const f = (t * 0.45 + i / 3) % 1;
        child.scale.setScalar(0.15 + f * 0.9);
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - f) * 0.7 * s;
      });
    }
    if (sweetLabel.current) sweetLabel.current.style.opacity = String(s);
  });

  const ringGeo = useMemo(() => new THREE.RingGeometry(0.93, 1, 64), []);
  const ringMats = useMemo(
    () =>
      Array.from(
        { length: SPEAKERS.length * ringsPer },
        () =>
          new THREE.MeshBasicMaterial({
            color: WAVE,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
      ),
    [ringsPer],
  );

  return (
    <>
      <RoomShell />
      <Furniture />

      {SPEAKERS.map((s, i) => (
        <group
          key={s.id}
          ref={(g) => {
            speakerRefs.current[i] = g;
          }}
          position={spots[i].pos}
          quaternion={spots[i].quat}
          scale={SPEAKER_SCALE}
        >
          <Speaker withPlate withDriver={false} />
        </group>
      ))}

      {ringMats.map((m, i) => (
        <mesh
          key={i}
          ref={(r) => {
            ringRefs.current[i] = r;
          }}
          geometry={ringGeo}
          material={m}
          visible={false}
        />
      ))}

      <group ref={sweet} position={L} visible={false}>
        <group ref={sweetRings}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo}>
              <meshBasicMaterial
                color={WAVE}
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
        <Html position={[0, 0.55, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div ref={sweetLabel} className="sweet-label" style={{ opacity: 0 }}>
            {corners.sweetSpot}
          </div>
        </Html>
      </group>

      {!mobile && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.65} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.7} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </>
  );
}

/** Walls face inward, so from outside the near walls and ceiling vanish (dollhouse cutaway). */
function RoomShell() {
  const { w, d, h } = ROOM;
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f2924', roughness: 0.95 }), []);
  const floor = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1e1915', roughness: 0.6, metalness: 0.05 }),
    [],
  );
  const cove = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(AMBER).multiplyScalar(1.3), toneMapped: false }),
    [],
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), [w, h, d]);
  const city = useMemo(() => cityTexture(), []);

  const plane = (pos: Vec3, rot: Vec3, size: [number, number], mat: THREE.Material) => (
    <mesh position={pos} rotation={rot} material={mat}>
      <planeGeometry args={size} />
    </mesh>
  );

  return (
    <group>
      {plane([0, 0, 0], [-Math.PI / 2, 0, 0], [w, d], floor)}
      {plane([0, h, 0], [Math.PI / 2, 0, 0], [w, d], wall)}
      {plane([0, h / 2, -d / 2], [0, 0, 0], [w, h], wall)}
      {plane([0, h / 2, d / 2], [0, Math.PI, 0], [w, h], wall)}
      {plane([-w / 2, h / 2, 0], [0, Math.PI / 2, 0], [d, h], wall)}
      {plane([w / 2, h / 2, 0], [0, -Math.PI / 2, 0], [d, h], wall)}

      {/* Cove lighting strips along the top of three walls. */}
      <mesh position={[0, h - 0.06, -d / 2 + 0.04]} material={cove}>
        <boxGeometry args={[w - 1.2, 0.025, 0.02]} />
      </mesh>
      <mesh position={[-w / 2 + 0.04, h - 0.06, 0]} material={cove}>
        <boxGeometry args={[0.02, 0.025, d - 1.2]} />
      </mesh>
      <mesh position={[w / 2 - 0.04, h - 0.06, 0]} material={cove}>
        <boxGeometry args={[0.02, 0.025, d - 1.2]} />
      </mesh>
      <pointLight position={[0, h - 0.3, -d / 2 + 0.4]} intensity={4} distance={5} decay={2} color={AMBER} />
      <pointLight position={[-w / 2 + 0.4, h - 0.3, 0]} intensity={3} distance={5} decay={2} color={AMBER} />
      <pointLight position={[w / 2 - 0.4, h - 0.3, 0]} intensity={3} distance={5} decay={2} color={AMBER} />
      <hemisphereLight args={['#5a4a3a', '#0e0d0c', 0.35]} />
      <directionalLight position={[-3, 5, 6]} intensity={0.5} color="#ffd9b0" />

      {/* City window on the left wall. */}
      <group position={[-w / 2 + 0.01, 1.5, 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[2.4, 1.5]} />
          <meshBasicMaterial map={city} toneMapped={false} />
        </mesh>
        {[-0.8, 0, 0.8].map((x) => (
          <mesh key={x} position={[x, 0, 0.02]}>
            <boxGeometry args={[0.03, 1.5, 0.04]} />
            <meshStandardMaterial color="#141210" roughness={0.6} />
          </mesh>
        ))}
        <pointLight position={[0, 0, 0.6]} intensity={0.6} distance={3} color="#7f95ff" />
      </group>

      <lineSegments geometry={edges} position={[0, h / 2, 0]}>
        <lineBasicMaterial color={AMBER} transparent opacity={0.18} />
      </lineSegments>
    </group>
  );
}

function Furniture() {
  const screen = useMemo(() => screenTexture(), []);
  const fabric = useMemo(() => new THREE.MeshStandardMaterial({ color: '#574c42', roughness: 0.92 }), []);
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2A2622', roughness: 0.7 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0c0b0a', roughness: 0.4, metalness: 0.3 }), []);
  const d2 = ROOM.d / 2;

  return (
    <group>
      {/* TV + console */}
      <mesh position={[0, 1.45, -d2 + 0.03]} material={dark}>
        <boxGeometry args={[2.1, 1.2, 0.05]} />
      </mesh>
      <mesh position={[0, 1.45, -d2 + 0.061]}>
        <planeGeometry args={[2.02, 1.13]} />
        <meshBasicMaterial map={screen} color="#9a9a9a" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.4, -d2 + 0.8]} intensity={0.8} distance={3.5} color="#e6a06a" />
      <RoundedBox args={[2.8, 0.42, 0.42]} radius={0.03} position={[0, 0.21, -d2 + 0.24]} material={stone} />

      {/* Rug */}
      <mesh position={[0, 0.006, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 2.8]} />
        <meshStandardMaterial color="#3a322b" roughness={1} />
      </mesh>

      {/* Sofa, facing the TV */}
      <group position={[0, 0, 1.5]}>
        <RoundedBox args={[2.7, 0.42, 0.95]} radius={0.08} position={[0, 0.25, 0]} material={fabric} />
        <RoundedBox args={[2.7, 0.6, 0.24]} radius={0.08} position={[0, 0.68, 0.38]} material={fabric} />
        <RoundedBox args={[0.24, 0.62, 0.95]} radius={0.08} position={[-1.35, 0.36, 0]} material={fabric} />
        <RoundedBox args={[0.24, 0.62, 0.95]} radius={0.08} position={[1.35, 0.36, 0]} material={fabric} />
        <RoundedBox args={[1.2, 0.14, 0.72]} radius={0.06} position={[-0.62, 0.52, -0.06]} material={fabric} />
        <RoundedBox args={[1.2, 0.14, 0.72]} radius={0.06} position={[0.62, 0.52, -0.06]} material={fabric} />
      </group>

      {/* Coffee table */}
      <mesh position={[0, 0.18, 0.15]} material={stone}>
        <cylinderGeometry args={[0.48, 0.44, 0.36, 48]} />
      </mesh>

      {/* Floor lamp */}
      <group position={[2.3, 0, 1.9]}>
        <mesh position={[0, 0.75, 0]} material={dark}>
          <cylinderGeometry args={[0.012, 0.012, 1.5, 8]} />
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.28, 32, 1, true]} />
          <meshBasicMaterial
            color={new THREE.Color(AMBER).multiplyScalar(1.3)}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <pointLight position={[0, 1.45, 0]} intensity={2.4} distance={4} decay={2} color={AMBER} />
      </group>
    </group>
  );
}
