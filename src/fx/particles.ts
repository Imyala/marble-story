import * as THREE from 'three';

/**
 * CPU-simulated point particles drawn in one call per pool. Two pools exist:
 * additive (fire, sparks, magic) and alpha-blended (smoke, dust, debris).
 */

const vert = /* glsl */ `
attribute float size;
attribute vec4 pcolor;
uniform float uScale;
varying vec4 vColor;
void main() {
  vColor = pcolor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * uScale / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`;

const fragAdd = /* glsl */ `
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 1.6) * vColor.a;
  gl_FragColor = vec4(vColor.rgb * a, a);
}`;

const fragAlpha = /* glsl */ `
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = smoothstep(1.0, 0.55, d) * vColor.a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb, a);
}`;

export interface ParticleSpec {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  size0: number;
  size1: number;
  color0: THREE.Color;
  color1: THREE.Color;
  alpha0: number;
  alpha1: number;
  gravity: number;
  drag: number;
}

export class ParticlePool {
  readonly points: THREE.Points;
  private max: number;
  private count = 0;
  private px: Float32Array;
  private py: Float32Array;
  private pz: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private vz: Float32Array;
  private age: Float32Array;
  private life: Float32Array;
  private s0: Float32Array;
  private s1: Float32Array;
  private c0: Float32Array;
  private c1: Float32Array;
  private grav: Float32Array;
  private drag: Float32Array;
  private posAttr: THREE.BufferAttribute;
  private colAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;
  private uniforms: { uScale: { value: number } };

  constructor(max: number, additive: boolean) {
    this.max = max;
    this.px = new Float32Array(max);
    this.py = new Float32Array(max);
    this.pz = new Float32Array(max);
    this.vx = new Float32Array(max);
    this.vy = new Float32Array(max);
    this.vz = new Float32Array(max);
    this.age = new Float32Array(max);
    this.life = new Float32Array(max);
    this.s0 = new Float32Array(max);
    this.s1 = new Float32Array(max);
    this.c0 = new Float32Array(max * 4);
    this.c1 = new Float32Array(max * 4);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(max * 3), 3);
    this.colAttr = new THREE.BufferAttribute(new Float32Array(max * 4), 4);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(max), 1);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.posAttr);
    g.setAttribute('pcolor', this.colAttr);
    g.setAttribute('size', this.sizeAttr);
    g.setDrawRange(0, 0);
    this.uniforms = { uScale: { value: 400 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: additive ? fragAdd : fragAlpha,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 20 : 10;
  }

  setViewportHeight(h: number, fovDeg: number): void {
    this.uniforms.uScale.value = h / (2 * Math.tan((fovDeg * Math.PI) / 360));
  }

  get alive(): number {
    return this.count;
  }

  spawn(p: ParticleSpec): void {
    let i = this.count;
    if (i >= this.max) {
      // Full: recycle a random slot rather than dropping the newest effect.
      i = Math.floor(Math.random() * this.max);
    } else this.count++;
    this.px[i] = p.x;
    this.py[i] = p.y;
    this.pz[i] = p.z;
    this.vx[i] = p.vx;
    this.vy[i] = p.vy;
    this.vz[i] = p.vz;
    this.age[i] = 0;
    this.life[i] = p.life;
    this.s0[i] = p.size0;
    this.s1[i] = p.size1;
    this.c0[i * 4] = p.color0.r;
    this.c0[i * 4 + 1] = p.color0.g;
    this.c0[i * 4 + 2] = p.color0.b;
    this.c0[i * 4 + 3] = p.alpha0;
    this.c1[i * 4] = p.color1.r;
    this.c1[i * 4 + 1] = p.color1.g;
    this.c1[i * 4 + 2] = p.color1.b;
    this.c1[i * 4 + 3] = p.alpha1;
    this.grav[i] = p.gravity;
    this.drag[i] = p.drag;
  }

  clear(): void {
    this.count = 0;
    this.points.geometry.setDrawRange(0, 0);
  }

  update(dt: number): void {
    const pos = this.posAttr.array as Float32Array;
    const col = this.colAttr.array as Float32Array;
    const siz = this.sizeAttr.array as Float32Array;
    let i = 0;
    while (i < this.count) {
      this.age[i]! += dt;
      if (this.age[i]! >= this.life[i]!) {
        this.kill(i);
        continue;
      }
      const d = Math.exp(-this.drag[i]! * dt);
      this.vx[i]! *= d;
      this.vz[i]! *= d;
      this.vy[i] = this.vy[i]! * d - this.grav[i]! * dt;
      this.px[i]! += this.vx[i]! * dt;
      this.py[i]! += this.vy[i]! * dt;
      this.pz[i]! += this.vz[i]! * dt;
      const t = this.age[i]! / this.life[i]!;
      pos[i * 3] = this.px[i]!;
      pos[i * 3 + 1] = this.py[i]!;
      pos[i * 3 + 2] = this.pz[i]!;
      for (let k = 0; k < 4; k++) col[i * 4 + k] = this.c0[i * 4 + k]! + (this.c1[i * 4 + k]! - this.c0[i * 4 + k]!) * t;
      siz[i] = this.s0[i]! + (this.s1[i]! - this.s0[i]!) * t;
      i++;
    }
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.points.geometry.setDrawRange(0, this.count);
  }

  private kill(i: number): void {
    const last = --this.count;
    if (i === last) return;
    this.px[i] = this.px[last]!;
    this.py[i] = this.py[last]!;
    this.pz[i] = this.pz[last]!;
    this.vx[i] = this.vx[last]!;
    this.vy[i] = this.vy[last]!;
    this.vz[i] = this.vz[last]!;
    this.age[i] = this.age[last]!;
    this.life[i] = this.life[last]!;
    this.s0[i] = this.s0[last]!;
    this.s1[i] = this.s1[last]!;
    for (let k = 0; k < 4; k++) {
      this.c0[i * 4 + k] = this.c0[last * 4 + k]!;
      this.c1[i * 4 + k] = this.c1[last * 4 + k]!;
    }
    this.grav[i] = this.grav[last]!;
    this.drag[i] = this.drag[last]!;
  }
}
