'use client';

import { Environment, Lightformer } from '@react-three/drei';

/**
 * The house lighting rig: warm low-angle key, soft amber rim, a whisper of
 * fill, and a custom (network-free) environment for the ring's metallic sheen.
 */
export function StudioLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.08 * intensity} color="#ffe6cc" />
      {/* Key: warm, low, from front-left so it rakes across the fabric. */}
      <directionalLight position={[-4, 0.6, 3.5]} intensity={2.4 * intensity} color="#ffd8ad" />
      {/* Rim: amber, from behind-right, outlines the serrated ring. */}
      <directionalLight position={[3.5, 2.2, -4]} intensity={3.2 * intensity} color="#E8A866" />
      <pointLight position={[2.5, -1.5, 2]} intensity={0.6 * intensity} color="#b8a48e" distance={12} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#ffd9b0" position={[-3, 1, 3]} scale={[4, 1.2, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#E8A866" position={[3, 2, -3]} scale={2.4} />
        <Lightformer
          form="rect"
          intensity={0.35}
          color="#ffffff"
          position={[0, 5, 0]}
          rotation-x={Math.PI / 2}
          scale={[8, 8, 1]}
        />
      </Environment>
    </>
  );
}
