'use client';

import dynamic from 'next/dynamic';

/*
 * Each scene is its own code-split chunk, fetched only when its section's
 * <SceneCanvas> approaches the viewport. three.js is shared between them.
 */
export const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
export const ExplodedScene = dynamic(() => import('./ExplodedScene'), { ssr: false });
export const SnapScene = dynamic(() => import('./SnapScene'), { ssr: false });
export const RoomScene = dynamic(() => import('./RoomScene'), { ssr: false });
export const SpecScene = dynamic(() => import('./SpecScene'), { ssr: false });
export const UnboxingScene = dynamic(() => import('./UnboxingScene'), { ssr: false });
export const MacroScene = dynamic(() => import('./MacroScene'), { ssr: false });

export const SubHeroScene = dynamic(() => import('./sub/SubHeroScene'), { ssr: false });
export const CornerGainScene = dynamic(() => import('./sub/CornerGainScene'), { ssr: false });
export const SubSpecScene = dynamic(() => import('./sub/SubSpecScene'), { ssr: false });
