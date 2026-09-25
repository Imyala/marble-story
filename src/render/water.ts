import * as THREE from 'three';

const vert = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
uniform float uTime;
varying vec3 vWorld;
varying float vWave;
void main() {
  vec3 p = position;
  vec4 w = modelMatrix * vec4(p, 1.0);
  float wave = sin(w.x * 0.35 + uTime * 1.3) * 0.5 + sin(w.z * 0.42 - uTime * 1.1) * 0.5;
  w.y += wave * 0.12;
  vWave = wave;
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const frag = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uGlint;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSky;
varying vec3 vWorld;
varying float vWave;
void main() {
  vec3 v = normalize(cameraPosition - vWorld);
  // A ripple normal from the slopes of the same waves that move the surface.
  float t = uTime;
  vec2 p = vWorld.xz;
  float rx = sin(p.x * 1.9 + t * 2.0);
  float rz = sin(p.y * 2.3 - t * 1.7);
  float dx = 0.021 * cos(p.x * 0.35 + t * 1.3) + 0.17 * cos(p.x * 1.9 + t * 2.0) * rz + 0.06 * cos(p.x * 4.1 + p.y * 1.3 + t * 3.1);
  float dz = 0.025 * cos(p.y * 0.42 - t * 1.1) + 0.2 * rx * cos(p.y * 2.3 - t * 1.7) + 0.06 * cos(p.y * 3.7 - p.x * 1.1 - t * 2.7);
  // Calmer with distance, so far water does not shimmer into a pattern.
  float calm = clamp(1.0 - length(cameraPosition.xz - vWorld.xz) / 80.0, 0.2, 1.0) * 0.6;
  vec3 n = normalize(vec3(-dx * calm, 1.0, -dz * calm));
  float fres = pow(1.0 - max(dot(v, n), 0.0), 3.0);
  vec3 col = mix(uDeep, uShallow, 0.35 + 0.35 * vWave);
  col = mix(col, mix(uGlint, uSky, 0.6), fres * 0.7);
  vec3 refl = reflect(-v, n);
  float sd = max(dot(refl, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(sd, 220.0) * 2.2 + pow(sd, 18.0) * 0.12);
  float r = sin(vWorld.x * 1.9 + uTime * 2.0) * sin(vWorld.z * 2.3 - uTime * 1.7);
  col += uGlint * smoothstep(0.85, 1.0, r) * 0.35;
  gl_FragColor = vec4(col, mix(uOpacity, 1.0, fres * 0.5));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** Sun and sky seen in every water surface, set by the renderer's applySky. */
export const WATER_LIGHT = {
  uSunDir: { value: new THREE.Vector3(0.4, 0.6, 0.3) },
  uSunColor: { value: new THREE.Color(0xfff0d8) },
  uSky: { value: new THREE.Color(0xbfd8ff) },
};

export class Water {
  readonly mesh: THREE.Mesh;
  private uniforms: Record<string, THREE.IUniform>;
  constructor(level: number, size: number, deep: number, shallow: number, glint: number, opacity = 0.82) {
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color(deep) },
        uShallow: { value: new THREE.Color(shallow) },
        uGlint: { value: new THREE.Color(glint) },
        uOpacity: { value: opacity },
      },
    ]);
    // Shared, so the sky can update every body of water at once.
    this.uniforms.uSunDir = WATER_LIGHT.uSunDir;
    this.uniforms.uSunColor = WATER_LIGHT.uSunColor;
    this.uniforms.uSky = WATER_LIGHT.uSky;
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      fog: true,
      depthWrite: false,
    });
    const g = new THREE.PlaneGeometry(size, size, 96, 96);
    g.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(g, m);
    this.mesh.position.y = level;
    this.mesh.renderOrder = 5;
  }
  update(time: number, cx: number, cz: number): void {
    this.uniforms.uTime!.value = time;
    // Snap to a grid so the wave pattern does not swim with the camera.
    this.mesh.position.x = Math.round(cx / 8) * 8;
    this.mesh.position.z = Math.round(cz / 8) * 8;
  }
}
