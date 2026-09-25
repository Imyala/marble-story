import * as THREE from 'three';

export interface SkyDef {
  top: number;
  horizon: number;
  bottom: number;
  sunDir: [number, number, number];
  sunColor: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  fogNear: number;
  fogFar: number;
  stars?: number;
  moons?: boolean;
  /** Fog color if it should differ from the horizon. */
  fog?: number;
  /** Cloud cover, 0 (clear) to 1 (heavy). Defaults to a light scatter. */
  clouds?: number;
}

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const frag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uStars;
uniform float uMoons;
uniform float uTime;
uniform float uClouds;
uniform float uFlash;
uniform vec3 uFlashDir;
varying vec3 vDir;

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0
    ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55))
    : mix(uHorizon, uBottom, pow(clamp(-h, 0.0, 1.0), 0.4));
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(sd, 900.0) * 3.0 + pow(sd, 18.0) * 0.28 + pow(sd, 3.0) * 0.08);
  if (uStars > 0.0 && h > 0.0) {
    vec3 cell = floor(d * 220.0);
    float s = hash(cell);
    float tw = 0.6 + 0.4 * sin(uTime * 2.0 + s * 40.0);
    col += vec3(step(0.9965, s) * uStars * tw * smoothstep(0.0, 0.25, h));
  }
  if (uClouds > 0.0 && h > 0.0) {
    // A soft cloud deck projected on the dome, drifting slowly.
    vec2 uv = d.xz / (d.y + 0.22) * 0.9 + vec2(uTime * 0.012, uTime * 0.005);
    float c = fbm(uv);
    float cover = smoothstep(0.62 - uClouds * 0.28, 0.9, c);
    vec3 lit = mix(uHorizon, vec3(1.0), 0.55) + uSunColor * (0.18 + pow(sd, 6.0) * 0.5);
    vec3 shade = mix(uTop, uHorizon, 0.6) * 0.85;
    vec3 cloud = mix(shade, lit, smoothstep(0.55, 0.95, c + 0.15));
    col = mix(col, cloud, cover * smoothstep(0.0, 0.22, h) * 0.85);
  }
  if (uMoons > 0.0) {
    vec3 m1 = normalize(vec3(-0.45, 0.42, -0.78));
    vec3 m2 = normalize(vec3(-0.30, 0.50, -0.81));
    float a = smoothstep(0.9992, 0.9995, dot(d, m1));
    float b = smoothstep(0.99955, 0.9998, dot(d, m2));
    col = mix(col, vec3(0.95, 0.9, 1.0), a);
    col = mix(col, vec3(0.75, 0.55, 1.0), b);
    col += vec3(0.4, 0.3, 0.6) * pow(max(dot(d, m1), 0.0), 60.0) * 0.5 * uMoons;
  }
  if (uFlash > 0.0) {
    // Lightning lights the whole sky, brightest (and the clouds most) around the bolt.
    float near = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), uFlashDir), 0.0), 3.0);
    col += vec3(0.75, 0.8, 1.0) * uFlash * (0.18 + near * 0.9) * smoothstep(-0.1, 0.3, h);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class Sky {
  readonly mesh: THREE.Mesh;
  private uniforms: Record<string, THREE.IUniform>;

  constructor() {
    this.uniforms = {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color() },
      uStars: { value: 0 },
      uMoons: { value: 0 },
      uTime: { value: 0 },
      uClouds: { value: 0.45 },
      uFlash: { value: 0 },
      uFlashDir: { value: new THREE.Vector3(0, 0, 1) },
    };
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), m);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  apply(def: SkyDef): void {
    (this.uniforms.uTop!.value as THREE.Color).setHex(def.top);
    (this.uniforms.uHorizon!.value as THREE.Color).setHex(def.horizon);
    (this.uniforms.uBottom!.value as THREE.Color).setHex(def.bottom);
    (this.uniforms.uSunDir!.value as THREE.Vector3).set(...def.sunDir).normalize();
    (this.uniforms.uSunColor!.value as THREE.Color).setHex(def.sunColor);
    this.uniforms.uStars!.value = def.stars ?? 0;
    this.uniforms.uMoons!.value = def.moons ? 1 : 0;
    this.uniforms.uClouds!.value = def.clouds ?? 0.45;
  }

  setClouds(v: number): void {
    this.uniforms.uClouds!.value = v;
  }

  /** Lightning: how bright, and (when a new bolt strikes) its bearing. */
  flash(v: number, azimuth?: number): void {
    this.uniforms.uFlash!.value = v;
    if (azimuth !== undefined) (this.uniforms.uFlashDir!.value as THREE.Vector3).set(Math.sin(azimuth), 0, Math.cos(azimuth));
  }

  update(camPos: THREE.Vector3, time: number): void {
    this.mesh.position.copy(camPos);
    this.uniforms.uTime!.value = time;
  }
}
