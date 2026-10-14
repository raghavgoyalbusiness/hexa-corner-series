'use client';

import { useMemo, type ComponentProps } from 'react';
import * as THREE from 'three';
import { ringGeometry } from './geometry';
import { speakerMaterials } from './materials';
import { fabricTextures } from './textures';

/**
 * The Corner Sub (PLACEHOLDER concept model). Product units: 1 unit = 10 cm.
 *
 * Right-triangle footprint whose square corner sits in the room corner at the
 * origin; the two legs run along +X and +Z (against the walls) and the fabric
 * front faces the room along (1, 0, 1). The driver fires backwards into the
 * corner, so it is never seen. The speakers' serrated ring becomes a top dial.
 *   Legs ≈ 38 cm, height ≈ 42 cm.
 */
export const SUB = { leg: 3.8, height: 4.2 };

const cache = new Map<string, THREE.BufferGeometry>();
const memo = (key: string, make: () => THREE.BufferGeometry) => {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = make()));
  return g;
};

/** Polygon with each corner rounded by its own radius (quadratic fillets). */
function roundedPolygon(points: [number, number][], radii: number[]) {
  const shape = new THREE.Shape();
  const n = points.length;
  points.forEach((v, i) => {
    const p = points[(i - 1 + n) % n];
    const nx = points[(i + 1) % n];
    const r = radii[i];
    const toP = new THREE.Vector2(p[0] - v[0], p[1] - v[1]).normalize().multiplyScalar(r);
    const toN = new THREE.Vector2(nx[0] - v[0], nx[1] - v[1]).normalize().multiplyScalar(r);
    const start: [number, number] = [v[0] + toP.x, v[1] + toP.y];
    const end: [number, number] = [v[0] + toN.x, v[1] + toN.y];
    if (i === 0) shape.moveTo(...start);
    else shape.lineTo(...start);
    shape.quadraticCurveTo(v[0], v[1], ...end);
  });
  shape.closePath();
  return shape;
}

const cabinetGeometry = () =>
  memo('sub-cabinet', () => {
    const L = SUB.leg;
    // Shape y is negative so that, after rotating to stand up, the leg runs along +Z.
    const shape = roundedPolygon(
      [
        [0, 0],
        [L, 0],
        [0, -L],
      ],
      [0.2, 0.5, 0.5],
    );
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: SUB.height,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 16,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0.08, 0.06, 0.08);
    return g;
  });

let subMats: ReturnType<typeof buildMats> | null = null;
function buildMats() {
  const { map, normalMap } = fabricTextures();
  const fMap = map.clone();
  const fNormal = normalMap.clone();
  fMap.repeat.set(20, 15);
  fNormal.repeat.set(20, 15);
  fMap.needsUpdate = fNormal.needsUpdate = true;
  return {
    cabinet: new THREE.MeshPhysicalMaterial({ color: '#131211', roughness: 0.7, clearcoat: 0.08, clearcoatRoughness: 0.8 }),
    fabric: new THREE.MeshPhysicalMaterial({
      color: '#6a6660',
      map: fMap,
      normalMap: fNormal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.95,
      sheen: 0.6,
      sheenColor: new THREE.Color('#5c5752'),
      sheenRoughness: 0.55,
    }),
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color('#E8A866').multiplyScalar(1.6), toneMapped: false }),
    pip: new THREE.MeshBasicMaterial({ color: new THREE.Color('#E8A866').multiplyScalar(2), toneMapped: false }),
  };
}
const materials = () => (subMats ??= buildMats());

type SubProps = ComponentProps<'group'> & {
  /** Warm light the glow strip throws onto the floor. */
  withFloorLight?: boolean;
};

export function CornerSub({ withFloorLight = true, ...props }: SubProps) {
  const m = materials();
  const s = speakerMaterials();
  const L = SUB.leg;
  const H = SUB.height;
  const front = useMemo(() => {
    // Midpoint of the hypotenuse, pushed just proud of the cabinet face.
    const n = new THREE.Vector3(1, 0, 1).normalize();
    return { mid: new THREE.Vector3(L / 2 + 0.08, 0, L / 2 + 0.08).addScaledVector(n, 0.07), n };
  }, [L]);
  const dialAt = new THREE.Vector3(L * 0.36 + 0.08, H + 0.12, L * 0.36 + 0.08);

  return (
    <group {...props}>
      <mesh geometry={cabinetGeometry()} material={m.cabinet} />

      {/* Woven fabric front. */}
      <mesh material={m.fabric} position={[front.mid.x, H / 2 + 0.28, front.mid.z]} rotation={[0, Math.PI / 4, 0]}>
        <planeGeometry args={[L * Math.SQRT2 - 1.15, H - 0.95]} />
      </mesh>

      {/* Amber floor-glow strip along the base of the front. */}
      <mesh material={m.glow} position={[front.mid.x, 0.2, front.mid.z]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[L * Math.SQRT2 - 1.3, 0.035, 0.03]} />
      </mesh>
      {withFloorLight && (
        <pointLight
          position={[front.mid.x + front.n.x * 0.6, 0.3, front.mid.z + front.n.z * 0.6]}
          intensity={6}
          distance={7}
          decay={2}
          color="#E8A866"
        />
      )}

      {/* The serrated ring, promoted to a top dial. */}
      <group position={dialAt}>
        <mesh geometry={ringGeometry()} material={s.ring} rotation={[-Math.PI / 2, 0, 0]} scale={0.55} position={[0, -0.27, 0]} />
        <mesh material={s.metalDark} position={[0, 0.0, 0]}>
          <cylinderGeometry args={[0.43, 0.45, 0.08, 48]} />
        </mesh>
        <mesh material={m.pip} position={[0.22, 0.08, 0.22]}>
          <sphereGeometry args={[0.04, 12, 8]} />
        </mesh>
      </group>
    </group>
  );
}
