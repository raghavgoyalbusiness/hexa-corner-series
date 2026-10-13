'use client';

import * as THREE from 'three';

/**
 * Procedural speaker geometry. Product units: 1 unit = 10 cm.
 * The puck faces +Z; the back of the housing sits at z = 0.
 *   Ø ≈ 18 cm (ring tips r = 0.93), depth ≈ 6 cm (back 0 → grille 0.535).
 * The housing back is chamfered so the puck nests into a three-way corner.
 * Everything is built once and shared between canvases.
 */

const cache = new Map<string, THREE.BufferGeometry>();
const memo = (key: string, make: () => THREE.BufferGeometry) => {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = make()));
  return g;
};

/** Lathe around Z from (radius, z) pairs. */
function latheZ(points: [number, number][], segments = 96) {
  const g = new THREE.LatheGeometry(
    points.map(([r, z]) => new THREE.Vector2(r, z)),
    segments,
  );
  g.rotateX(Math.PI / 2);
  return g;
}

export const housingGeometry = () =>
  memo('housing', () =>
    latheZ([
      [0, 0],
      [0.5, 0],
      [0.56, 0.025],
      [0.7, 0.18],
      [0.82, 0.32],
      [0.855, 0.38],
      [0.86, 0.47],
      [0.84, 0.5],
      [0.76, 0.5],
      [0.72, 0.47],
      [0.66, 0.3],
      [0.4, 0.2],
      [0, 0.19],
    ]),
  );

/** Serrated outer ring: trapezoid teeth around a sleeve that hugs the housing. */
export const ringGeometry = () =>
  memo('ring', () => {
    const teeth = 96;
    const rTip = 0.93;
    const rRoot = 0.895;
    const shape = new THREE.Shape();
    const step = (Math.PI * 2) / teeth;
    for (let k = 0; k < teeth; k++) {
      const a = k * step;
      const pts: [number, number][] = [
        [rRoot, a],
        [rTip, a + step * 0.2],
        [rTip, a + step * 0.5],
        [rRoot, a + step * 0.7],
      ];
      pts.forEach(([r, ang], i) => {
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (k === 0 && i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.8, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 96,
    });
    g.translate(0, 0, 0.37);
    return g;
  });

/** Slightly domed fabric disc with planar UVs (so the weave stays square). */
export const grilleGeometry = () =>
  memo('grille', () => {
    const R = 0.77;
    const g = new THREE.RingGeometry(0.0001, R, 128, 20);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i)) / R;
      pos.setZ(i, 0.5 + 0.035 * (1 - r * r));
    }
    g.computeVertexNormals();
    return g;
  });

export const driverGeometries = () => ({
  cone: memo('cone', () =>
    latheZ(
      [
        [0.17, 0.3],
        [0.3, 0.36],
        [0.45, 0.415],
        [0.57, 0.45],
      ],
      64,
    ),
  ),
  surround: memo('surround', () => {
    const g = new THREE.TorusGeometry(0.6, 0.035, 12, 96);
    g.translate(0, 0, 0.45);
    return g;
  }),
  frame: memo('frame', () => {
    const g = new THREE.TorusGeometry(0.66, 0.022, 8, 96);
    g.translate(0, 0, 0.465);
    return g;
  }),
  cap: memo('cap', () => {
    const g = new THREE.SphereGeometry(0.2, 32, 12, 0, Math.PI * 2, 0, 0.9);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, 0.2);
    return g;
  }),
  motor: memo('motor', () => {
    const g = new THREE.CylinderGeometry(0.3, 0.32, 0.12, 48);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, 0.22);
    return g;
  }),
  spoke: memo('spoke', () => new THREE.BoxGeometry(0.04, 0.36, 0.02)),
});

export const magnetGeometry = () =>
  memo('magnet', () =>
    latheZ(
      [
        [0, -0.05],
        [0.3, -0.05],
        [0.32, -0.035],
        [0.32, -0.015],
        [0.3, 0],
        [0, 0],
      ],
      64,
    ),
  );

/** Rounded equilateral triangle. Circumradius R, corner fillet rc. */
export const plateGeometry = () =>
  memo('plate', () => {
    const R = 1.15;
    const rc = 0.22;
    const shape = new THREE.Shape();
    [90, 210, 330].forEach((deg, i) => {
      const t = THREE.MathUtils.degToRad(deg);
      const cx = Math.cos(t) * (R - 2 * rc);
      const cy = Math.sin(t) * (R - 2 * rc);
      const a0 = t - Math.PI / 3;
      const a1 = t + Math.PI / 3;
      if (i === 0) shape.moveTo(cx + Math.cos(a0) * rc, cy + Math.sin(a0) * rc);
      shape.absarc(cx, cy, rc, a0, a1, false);
    });
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 24,
    });
    g.translate(0, 0, -0.22);
    return g;
  });

/** Steel contact disc set into the face of the plate. */
export const plateDiscGeometry = () =>
  memo('plateDisc', () => {
    const g = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 64);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, -0.07);
    return g;
  });

/**
 * Orientation that points local +Z along `inward` and turns the plate so one
 * triangle vertex runs down the vertical wall junction (`edge`).
 */
export function cornerQuaternion(inward: THREE.Vector3Tuple, edge: THREE.Vector3Tuple) {
  const z = new THREE.Vector3(...inward).normalize();
  const e = new THREE.Vector3(...edge);
  const y = e.sub(z.clone().multiplyScalar(e.dot(z))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
