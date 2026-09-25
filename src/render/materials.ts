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

const glowCache = new Map<number, THREE.MeshBasicMaterial>();

/** A shared opaque glow material per color, for static scenery (so it batches). Never mutate it. */
export function glowShared(color: number): THREE.MeshBasicMaterial {
  let m = glowCache.get(color);
  if (!m) {
    m = glow(color);
    glowCache.set(color, m);
  }
  return m;
}

export const ELEMENT_COLORS = {
  fire: 0xff7a2a,
  lightning: 0xa8e6ff,
  ice: 0x8fe4ff,
  earth: 0x9be06a,
  physical: 0xffffff,
  shadow: 0xb04cff,
} as const;

// ---------------------------------------------------------------------------
// Shader touches: wind for foliage, rim light for characters, detail for ground.
// ---------------------------------------------------------------------------

/** Global wind clock, advanced by the game each frame. */
export const WIND = { value: 0 };
/** Where the dragon is, so grass and reeds can bend out of its way. */
export const PUSHER = { value: new THREE.Vector3(0, -1e4, 0) };

const windCache = new Map<string, THREE.Material>();

/**
 * A copy of `base` whose vertices sway in the wind, more the higher they sit
 * in the model (so grass tips and canopies move, roots stay put). Works on
 * instanced meshes: each instance gets its own phase from where it stands.
 */
export function windy<T extends THREE.MeshStandardMaterial>(base: T, strength = 0.08, hang = false): T {
  const key = `${base.uuid}|${strength}|${hang}`;
  const hit = windCache.get(key);
  if (hit) return hit as T;
  const m = base.clone() as T;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = { value: strength };
    shader.uniforms.uWindTime = WIND;
    shader.uniforms.uPusher = PUSHER;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;\nuniform float uWindTime;\nuniform vec3 uPusher;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        vec3 origin = vec3(0.0);
        #ifdef USE_INSTANCING
          origin = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        origin = (modelMatrix * vec4(origin, 1.0)).xyz;
        float ph = origin.x * 0.37 + origin.z * 0.29;
        float lift = ${hang ? 'max(-position.y, 0.0)' : 'max(position.y + 0.25, 0.0)'};
        float sway = sin(uWindTime * 1.6 + ph) * 0.7 + sin(uWindTime * 2.9 + ph * 1.7) * 0.3;
        transformed.x += sway * uWind * lift;
        transformed.z += cos(uWindTime * 1.2 + ph * 1.3) * uWind * 0.5 * lift;
        ${hang ? '' : `// Parts around the dragon's feet, pushed aside in world space.
        vec2 away = origin.xz - uPusher.xz;
        float dd = length(away);
        float push = (1.0 - smoothstep(0.35, 1.6, dd)) * (1.0 - smoothstep(0.8, 1.8, abs(origin.y - uPusher.y))) * min(lift, 1.2);
        if (push > 0.001) {
          mat3 toWorld = mat3(modelMatrix);
          #ifdef USE_INSTANCING
            toWorld = toWorld * mat3(instanceMatrix);
          #endif
          vec3 w = vec3(away / max(dd, 0.05) * 0.55, -0.25) * push;
          // Rotation with uniform scale: the inverse is the transpose over the squared scale.
          transformed += transpose(toWorld) * w / max(dot(toWorld[0], toWorld[0]), 1e-4);
        }`}
      }`);
  };
  m.customProgramCacheKey = () => `wind${hang ? 'h' : ''}`;
  windCache.set(key, m);
  return m;
}

/**
 * Adds the rim light to a material in place. Only for materials a model owns
 * outright (its skin), since shared cached materials would light up everything.
 */
export function addRim(m: THREE.MeshStandardMaterial, color = 0xfff0e0, strength = 0.35): void {
  const c = new THREE.Color(color);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: c };
    shader.uniforms.uRim = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRim;')
      .replace('#include <opaque_fragment>', `{
        float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
        outgoingLight += uRimColor * pow(rimF, 2.6) * uRim;
      }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'rim';
  m.needsUpdate = true;
}

/**
 * Ground detail: breaks up big flat vertex-coloured areas with two scales of
 * world-space noise and darkens the ground a touch where it meets the sky
 * line (cheap ambient occlusion in creases, from the vertex normal).
 */
export function groundDetail(m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGroundW;\nvarying float vGroundUp;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
      vGroundW = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vGroundUp = normalize(mat3(modelMatrix) * objectNormal).y;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
      varying vec3 vGroundW;
      varying float vGroundUp;
      float gHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gNoise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), u.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), u.x), u.y);
      }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        float big = gNoise(vGroundW.xz * 0.08);
        float fine = gNoise(vGroundW.xz * 0.9);
        diffuseColor.rgb *= 0.86 + big * 0.2 + fine * 0.08;
        // Steeper faces are rockier and a little darker.
        diffuseColor.rgb *= mix(0.78, 1.0, smoothstep(0.35, 0.9, vGroundUp));
      }`);
  };
  m.customProgramCacheKey = () => 'ground';
  return m;
}
