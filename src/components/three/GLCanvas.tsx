'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas, type CanvasProps } from '@react-three/fiber';

/** The actual WebGL canvas, in its own chunk so three.js stays out of the initial bundle. */
export default function GLCanvas({
  children,
  camera,
  mobile,
  visible,
}: {
  children: ReactNode;
  camera?: CanvasProps['camera'];
  mobile: boolean;
  visible: boolean;
}) {
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      frameloop={visible ? 'always' : 'never'}
      camera={camera ?? { position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
