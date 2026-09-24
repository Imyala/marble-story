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
varying vec3 vWorld;
varying float vWave;
void main() {
  vec3 v = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(v.y, 0.0), 3.0);
  vec3 col = mix(uDeep, uShallow, 0.35 + 0.35 * vWave);
  col = mix(col, uGlint, fres * 0.6);
  float r = sin(vWorld.x * 1.9 + uTime * 2.0) * sin(vWorld.z * 2.3 - uTime * 1.7);
  col += uGlint * smoothstep(0.85, 1.0, r) * 0.35;
  gl_FragColor = vec4(col, mix(uOpacity, 1.0, fres * 0.5));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

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
