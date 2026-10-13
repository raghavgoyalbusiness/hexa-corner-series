'use client';

import * as THREE from 'three';
import { fabricTextures } from './textures';

/** PBR materials for the speaker, shared across scenes. */
let mats: ReturnType<typeof build> | null = null;

function build() {
  const fabric = fabricTextures();
  return {
    housing: new THREE.MeshPhysicalMaterial({
      color: '#121110',
      roughness: 0.72,
      metalness: 0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.8,
      side: THREE.DoubleSide,
    }),
    ring: new THREE.MeshPhysicalMaterial({
      color: '#22201d',
      roughness: 0.3,
      metalness: 0.72,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25,
    }),
    grille: new THREE.MeshPhysicalMaterial({
      color: '#6a6660',
      map: fabric.map,
      normalMap: fabric.normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.95,
      sheen: 0.6,
      sheenColor: new THREE.Color('#5c5752'),
      sheenRoughness: 0.55,
    }),
    cone: new THREE.MeshStandardMaterial({ color: '#171514', roughness: 0.92, side: THREE.DoubleSide }),
    rubber: new THREE.MeshStandardMaterial({ color: '#0d0c0c', roughness: 0.55 }),
    metalDark: new THREE.MeshStandardMaterial({ color: '#45423e', roughness: 0.35, metalness: 0.85 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c2bcb4', roughness: 0.2, metalness: 1, side: THREE.DoubleSide }),
    plate: new THREE.MeshPhysicalMaterial({ color: '#211f1c', roughness: 0.55, clearcoat: 0.12 }),
  };
}

export function speakerMaterials() {
  if (!mats) mats = build();
  return mats;
}
