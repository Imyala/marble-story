import * as THREE from 'three';

export interface MatOpts {
  emissive?: number;
  emissiveIntensity?: number;
  rough?: number;
  metal?: number;
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  vertexColors?: boolean;
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** Shared material. Anything that needs to flash or fade gets matUnique instead. */
export function mat(color: number, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.emissive ?? 0}|${o.emissiveIntensity ?? 1}|${o.rough ?? 0.85}|${o.metal ?? 0}|${o.flat ? 1 : 0}|${o.transparent ? 1 : 0}|${o.opacity ?? 1}|${o.side ?? 0}|${o.vertexColors ? 1 : 0}`;
  let m = cache.get(key);
  if (!m) {
    m = matUnique(color, o);
    cache.set(key, m);
  }
  return m;
}

export function matUnique(color: number, o: MatOpts = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.emissiveIntensity ?? 1,
    roughness: o.rough ?? 0.85,
    metalness: o.metal ?? 0,
    flatShading: o.flat ?? false,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide,
    vertexColors: o.vertexColors ?? false,
  });
}

/** Unlit glowing material for magic, eyes, crystals' cores. */
export function glow(color: number, opacity = 1, additive = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1 || additive,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !additive,
    fog: !additive,
  });
}

export const ELEMENT_COLORS = {
  fire: 0xff7a2a,
  lightning: 0xa8e6ff,
  ice: 0x8fe4ff,
  earth: 0x9be06a,
  physical: 0xffffff,
  shadow: 0xb04cff,
} as const;
