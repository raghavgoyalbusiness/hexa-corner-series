'use client';

import { Component, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useWebGL } from '@/hooks/useWebGL';

const GLCanvas = dynamic(() => import('./GLCanvas'), { ssr: false });

class GLErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('[HEXA] 3D scene failed, showing fallback.', err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Props = {
  children: ReactNode;
  /** Static image shown when WebGL is unavailable or the scene errors. */
  fallback: ReactNode;
  className?: string;
  camera?: ComponentProps<typeof GLCanvas>['camera'];
  /** Mount immediately instead of waiting to approach the viewport. */
  eager?: boolean;
};

/**
 * Every 3D scene goes through this wrapper:
 * - mounts the WebGL context only once the section is within ~1 viewport,
 * - pauses the render loop while offscreen,
 * - caps DPR at 2 (1.5 on mobile) and drops MSAA on mobile,
 * - swaps in a static fallback if WebGL is missing or the scene throws.
 */
export function SceneCanvas({ children, fallback, className, camera, eager = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(eager);
  const [visible, setVisible] = useState(eager);
  const webgl = useWebGL();
  const mobile = useIsMobile();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearObs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          nearObs.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    const visObs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '10% 0px' });
    nearObs.observe(el);
    visObs.observe(el);
    return () => {
      nearObs.disconnect();
      visObs.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {webgl === false ? (
        fallback
      ) : near && webgl ? (
        <GLErrorBoundary fallback={fallback}>
          <GLCanvas camera={camera} mobile={mobile} visible={visible}>
            {children}
          </GLCanvas>
        </GLErrorBoundary>
      ) : null}
    </div>
  );
}

/** Static fallback image, styled to sit where the canvas would. */
export function SceneFallback({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-contain opacity-90" loading="lazy" decoding="async" />
  );
}
