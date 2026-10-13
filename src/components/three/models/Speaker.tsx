'use client';

import { useMemo, type ComponentProps } from 'react';
import { Clone, useGLTF } from '@react-three/drei';
import type * as THREE from 'three';
import { DRACO_DECODER_PATH, GLB_NODE_NAMES, MODEL_SOURCE, SPEAKER_GLB_URL } from '@/lib/config';
import {
  driverGeometries,
  grilleGeometry,
  housingGeometry,
  magnetGeometry,
  plateDiscGeometry,
  plateGeometry,
  ringGeometry,
} from './geometry';
import { speakerMaterials } from './materials';

export type PartName = keyof typeof GLB_NODE_NAMES;

function ProceduralPart({ name }: { name: PartName }) {
  const m = speakerMaterials();
  switch (name) {
    case 'grille':
      return <mesh geometry={grilleGeometry()} material={m.grille} />;
    case 'housing':
      return (
        <>
          <mesh geometry={housingGeometry()} material={m.housing} />
          <mesh geometry={ringGeometry()} material={m.ring} />
        </>
      );
    case 'driver':
      return <Driver />;
    case 'magnet':
      return <mesh geometry={magnetGeometry()} material={m.chrome} />;
    case 'plate':
      return (
        <>
          <mesh geometry={plateGeometry()} material={m.plate} />
          <mesh geometry={plateDiscGeometry()} material={m.chrome} />
        </>
      );
  }
}

function Driver() {
  const m = speakerMaterials();
  const g = driverGeometries();
  const spokes = useMemo(() => [0, 1, 2, 3].map((i) => (i * Math.PI) / 2 + Math.PI / 4), []);
  return (
    <group>
      <mesh geometry={g.cone} material={m.cone} />
      <mesh geometry={g.cap} material={m.rubber} />
      <mesh geometry={g.surround} material={m.rubber} />
      <mesh geometry={g.frame} material={m.metalDark} />
      <mesh geometry={g.motor} material={m.metalDark} />
      {spokes.map((a) => (
        <mesh
          key={a}
          geometry={g.spoke}
          material={m.metalDark}
          position={[Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0.34]}
          rotation={[0, 0, a - Math.PI / 2]}
        />
      ))}
    </group>
  );
}

/** Loads a named node from the production GLB (see README). */
function GlbPart({ name }: { name: PartName }) {
  const gltf = useGLTF(SPEAKER_GLB_URL, DRACO_DECODER_PATH);
  const node = (gltf.nodes as Record<string, THREE.Object3D>)[GLB_NODE_NAMES[name]];
  return node ? <Clone object={node} /> : null;
}

/** One layer of the speaker, procedural or from the GLB depending on config. */
export function SpeakerPart({ name }: { name: PartName }) {
  return MODEL_SOURCE === 'glb' ? <GlbPart name={name} /> : <ProceduralPart name={name} />;
}

type SpeakerProps = ComponentProps<'group'> & {
  /** Include the adhesive corner plate behind the puck. */
  withPlate?: boolean;
  /** The driver is hidden behind the grille; skip it when there are many speakers. */
  withDriver?: boolean;
};

/** The assembled speaker, facing +Z. */
export function Speaker({ withPlate = false, withDriver = true, ...props }: SpeakerProps) {
  return (
    <group {...props}>
      <SpeakerPart name="housing" />
      <SpeakerPart name="grille" />
      {withDriver && <SpeakerPart name="driver" />}
      <SpeakerPart name="magnet" />
      {withPlate && <SpeakerPart name="plate" />}
    </group>
  );
}

if (MODEL_SOURCE === 'glb') useGLTF.preload(SPEAKER_GLB_URL, DRACO_DECODER_PATH);
