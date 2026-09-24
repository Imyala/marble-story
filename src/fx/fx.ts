import * as THREE from 'three';
import { ParticlePool } from './particles';
import { rng } from '../core/rng';

const tmpC0 = new THREE.Color();
const tmpC1 = new THREE.Color();
const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const tmpV3 = new THREE.Vector3();

export interface EmitOpts {
  count: number;
  speed?: number;
  speedJitter?: number;
  /** Preferred direction; velocity is dir*speed plus a random spherical spread. */
  dir?: [number, number, number];
  spread?: number;
  life?: [number, number];
  size?: [number, number];
  sizeEnd?: number;
  color: number;
  colorEnd?: number;
  alpha?: number;
  alphaEnd?: number;
  gravity?: number;
  drag?: number;
  /** Random offset radius around the spawn point. */
  jitter?: number;
  additive?: boolean;
  /** Emission intensity multiplier for additive colors (can exceed 1 for bloom). */
  bright?: number;
}

interface Ring {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  t: number;
  dur: number;
  r0: number;
  r1: number;
  active: boolean;
}

interface Swoosh {
  root: THREE.Object3D;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  t: number;
  dur: number;
  active: boolean;
}

interface Arc {
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.MeshBasicMaterial;
  from: THREE.Vector3;
  to: THREE.Vector3;
  pts: THREE.Vector3[];
  t: number;
  dur: number;
  width: number;
  rejit: number;
  active: boolean;
  chaos: number;
}

interface Flash {
  light: THREE.PointLight;
  t: number;
  dur: number;
  peak: number;
}

const ARC_POINTS = 14;

export class FX {
  readonly root = new THREE.Group();
  readonly add = new ParticlePool(5000, true);
  readonly alpha = new ParticlePool(3000, false);
  private rings: Ring[] = [];
  private swooshes: Swoosh[] = [];
  private arcs: Arc[] = [];
  private flashes: Flash[] = [];
  private camera: THREE.Camera;
  /** Quality scalar applied to particle counts. */
  density = 1;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.root.add(this.add.points, this.alpha.points);
    const ringGeo = new THREE.RingGeometry(0.85, 1, 48, 1);
    ringGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      mesh.renderOrder = 25;
      this.root.add(mesh);
      this.rings.push({ mesh, mat, t: 0, dur: 1, r0: 0, r1: 1, active: false });
    }
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide, vertexColors: true,
      });
      const root = new THREE.Object3D();
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      mesh.renderOrder = 26;
      root.add(mesh);
      root.visible = false;
      this.root.add(root);
      this.swooshes.push({ root, mesh, mat, t: 0, dur: 0.2, active: false });
    }
    for (let i = 0; i < 18; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_POINTS * 2 * 3), 3));
      const idx: number[] = [];
      for (let k = 0; k < ARC_POINTS - 1; k++) {
        const a = k * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      geo.setIndex(idx);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      mesh.renderOrder = 27;
      this.root.add(mesh);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k < ARC_POINTS; k++) pts.push(new THREE.Vector3());
      this.arcs.push({
        mesh, geo, mat, from: new THREE.Vector3(), to: new THREE.Vector3(), pts, t: 0, dur: 0.1, width: 0.1,
        rejit: 0, active: false, chaos: 0.3,
      });
    }
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 12, 1.6);
      this.root.add(light);
      this.flashes.push({ light, t: 1, dur: 1, peak: 0 });
    }
  }

  setViewport(h: number, fov: number): void {
    this.add.setViewportHeight(h, fov);
    this.alpha.setViewportHeight(h, fov);
  }

  clear(): void {
    this.add.clear();
    this.alpha.clear();
    for (const r of this.rings) {
      r.active = false;
      r.mesh.visible = false;
    }
    for (const s of this.swooshes) {
      s.active = false;
      s.root.visible = false;
    }
    for (const a of this.arcs) {
      a.active = false;
      a.mesh.visible = false;
    }
    for (const f of this.flashes) {
      f.t = f.dur;
      f.light.intensity = 0;
    }
  }

  emit(x: number, y: number, z: number, o: EmitOpts): void {
    const pool = o.additive === false ? this.alpha : this.add;
    const count = Math.max(1, Math.round(o.count * this.density));
    const bright = o.bright ?? 1;
    tmpC0.setHex(o.color).multiplyScalar(pool === this.add ? bright : 1);
    tmpC1.setHex(o.colorEnd ?? o.color).multiplyScalar(pool === this.add ? bright : 1);
    const sp = o.speed ?? 3;
    const spj = o.speedJitter ?? 0.4;
    const spread = o.spread ?? 1;
    const life = o.life ?? [0.4, 0.8];
    const size = o.size ?? [0.2, 0.4];
    const jit = o.jitter ?? 0;
    for (let i = 0; i < count; i++) {
      // Random unit vector.
      let rx = rng.signed();
      let ry = rng.signed();
      let rz = rng.signed();
      const rl = Math.hypot(rx, ry, rz) || 1;
      rx /= rl;
      ry /= rl;
      rz /= rl;
      const s = sp * (1 - spj + rng.next() * spj * 2);
      let vx: number;
      let vy: number;
      let vz: number;
      if (o.dir) {
        vx = (o.dir[0] + rx * spread) * s;
        vy = (o.dir[1] + ry * spread) * s;
        vz = (o.dir[2] + rz * spread) * s;
      } else {
        vx = rx * s;
        vy = ry * s;
        vz = rz * s;
      }
      const sz = size[0] + rng.next() * (size[1] - size[0]);
      pool.spawn({
        x: x + rng.signed() * jit,
        y: y + rng.signed() * jit,
        z: z + rng.signed() * jit,
        vx, vy, vz,
        life: life[0] + rng.next() * (life[1] - life[0]),
        size0: sz,
        size1: o.sizeEnd !== undefined ? sz * o.sizeEnd : sz * 0.3,
        color0: tmpC0,
        color1: tmpC1,
        alpha0: o.alpha ?? 1,
        alpha1: o.alphaEnd ?? 0,
        gravity: o.gravity ?? 0,
        drag: o.drag ?? 1,
      });
    }
  }

  // ---- presets --------------------------------------------------------

  hit(x: number, y: number, z: number, color = 0xfff2c0, strength = 1): void {
    this.emit(x, y, z, {
      count: 10 * strength, speed: 7 * strength, life: [0.12, 0.3], size: [0.12, 0.28], color, colorEnd: 0xff8a3d,
      drag: 6, bright: 2.5,
    });
    this.emit(x, y, z, { count: 2, speed: 0.1, life: [0.08, 0.12], size: [1.2 * strength, 1.8 * strength], sizeEnd: 1.4, color, bright: 2 });
  }

  dust(x: number, y: number, z: number, n = 8, color = 0xb8a88a): void {
    this.emit(x, y + 0.1, z, {
      count: n, speed: 2.5, dir: [0, 0.35, 0], spread: 1, life: [0.4, 0.9], size: [0.4, 0.8], sizeEnd: 2.2,
      color, alpha: 0.55, alphaEnd: 0, drag: 3, gravity: -0.4, additive: false, jitter: 0.3,
    });
  }

  smoke(x: number, y: number, z: number, n = 4, color = 0x3a3440): void {
    this.emit(x, y, z, {
      count: n, speed: 1, dir: [0, 1, 0], spread: 0.6, life: [0.6, 1.2], size: [0.5, 0.9], sizeEnd: 2.5,
      color, alpha: 0.45, drag: 1.5, gravity: -1, additive: false, jitter: 0.2,
    });
  }

  explosion(x: number, y: number, z: number, radius: number, color: number, colorEnd = 0x802010): void {
    this.emit(x, y, z, { count: 40, speed: radius * 5, life: [0.25, 0.55], size: [0.5, 1.1], sizeEnd: 0.2, color, colorEnd, drag: 4, bright: 2.2 });
    this.emit(x, y, z, { count: 3, speed: 0.2, life: [0.15, 0.2], size: [radius * 2.2, radius * 2.6], sizeEnd: 1.3, color, bright: 1.6 });
    this.smoke(x, y, z, 10, 0x2a2228);
    this.ring(x, y - 0.3, z, 0.3, radius * 1.4, color, 0.4);
    this.flash(x, y + 0.5, z, color, 6, radius * 5, 0.3);
  }

  shatter(x: number, y: number, z: number, color = 0xbff4ff): void {
    this.emit(x, y, z, {
      count: 26, speed: 8, dir: [0, 0.5, 0], spread: 1, life: [0.4, 0.9], size: [0.18, 0.4], sizeEnd: 0.6,
      color, colorEnd: 0x6ab8ff, gravity: 16, drag: 1, bright: 1.8,
    });
    this.emit(x, y, z, { count: 14, speed: 3, life: [0.3, 0.6], size: [0.4, 0.8], sizeEnd: 2, color: 0xffffff, alpha: 0.5, additive: false, drag: 3 });
    this.ring(x, y - 0.5, z, 0.3, 4, 0x9fe8ff, 0.35);
  }

  rocks(x: number, y: number, z: number, n = 12, color = 0x8a7a5a): void {
    this.emit(x, y, z, {
      count: n, speed: 6, dir: [0, 0.8, 0], spread: 0.9, life: [0.5, 1.0], size: [0.2, 0.45], sizeEnd: 0.9,
      color, gravity: 18, drag: 0.5, additive: false,
    });
    this.dust(x, y, z, n);
  }

  shadowPoof(x: number, y: number, z: number, scale = 1): void {
    this.emit(x, y, z, {
      count: 24 * scale, speed: 3 * scale, dir: [0, 0.6, 0], spread: 1, life: [0.5, 1.1], size: [0.5, 0.9], sizeEnd: 0.1,
      color: 0xb04cff, colorEnd: 0x1a0830, drag: 2, gravity: -2, bright: 1.6, jitter: 0.4 * scale,
    });
    this.emit(x, y, z, {
      count: 14 * scale, speed: 1.5, dir: [0, 1, 0], spread: 0.6, life: [0.8, 1.4], size: [0.8, 1.3], sizeEnd: 2,
      color: 0x120a1c, alpha: 0.6, additive: false, drag: 1.5, gravity: -1.5, jitter: 0.5 * scale,
    });
  }

  sparkle(x: number, y: number, z: number, color: number, n = 6): void {
    this.emit(x, y, z, { count: n, speed: 1.6, life: [0.3, 0.6], size: [0.1, 0.22], sizeEnd: 0, color, drag: 2, bright: 2.2, jitter: 0.15 });
  }

  motes(x: number, y: number, z: number, color: number, n = 10): void {
    this.emit(x, y, z, {
      count: n, speed: 1.2, dir: [0, 1.5, 0], spread: 0.8, life: [0.6, 1.2], size: [0.12, 0.25], sizeEnd: 0,
      color, drag: 1, gravity: -1.5, bright: 2, jitter: 0.4,
    });
  }

  splash(x: number, y: number, z: number, color = 0xcfefff): void {
    this.emit(x, y, z, {
      count: 30, speed: 6, dir: [0, 1.2, 0], spread: 0.7, life: [0.4, 0.9], size: [0.15, 0.35], sizeEnd: 0.5,
      color, gravity: 18, drag: 0.4, additive: false, alpha: 0.9,
    });
    this.ring(x, y + 0.05, z, 0.3, 3, 0xcfefff, 0.6);
  }

  ring(x: number, y: number, z: number, r0: number, r1: number, color: number, dur: number): void {
    const r = this.rings.find((q) => !q.active) ?? this.rings[0]!;
    r.active = true;
    r.t = 0;
    r.dur = dur;
    r.r0 = r0;
    r.r1 = r1;
    r.mat.color.setHex(color);
    r.mesh.position.set(x, y + 0.08, z);
    r.mesh.scale.setScalar(r0);
    r.mesh.visible = true;
  }

  /**
   * An attack trail: a glowing arc that fades in a few frames. `plane` 'h'
   * sweeps horizontally around the yaw; 'v' sweeps vertically in front.
   */
  swoosh(
    x: number, y: number, z: number, yaw: number, radius: number, arc: number,
    color: number, plane: 'h' | 'v' = 'h', tilt = 0, dur = 0.18, width = 0.45, start?: number,
  ): void {
    const s = this.swooshes.find((q) => !q.active) ?? this.swooshes[0]!;
    s.active = true;
    s.t = 0;
    s.dur = dur;
    s.mesh.geometry.dispose();
    const thetaStart = start ?? (plane === 'h' ? Math.PI / 2 - arc / 2 : -arc / 2);
    const g = new THREE.RingGeometry(Math.max(0.05, radius - width), radius, 24, 1, thetaStart, arc);
    const pos = g.getAttribute('position');
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const f = (i % 25) / 24;
      const k = Math.pow(f, 1.5);
      cols[i * 3] = k;
      cols[i * 3 + 1] = k;
      cols[i * 3 + 2] = k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    s.mesh.geometry = g;
    s.mat.color.setHex(color).multiplyScalar(1.6);
    s.mat.opacity = 1;
    s.root.position.set(x, y, z);
    s.root.rotation.set(0, yaw, 0);
    if (plane === 'h') s.mesh.rotation.set(Math.PI / 2, 0, 0);
    else s.mesh.rotation.set(0, -Math.PI / 2, 0);
    s.root.rotateZ(tilt);
    s.root.visible = true;
  }

  /** A jagged, camera-facing lightning ribbon between two points. */
  arc(from: THREE.Vector3, to: THREE.Vector3, color = 0xbfe8ff, width = 0.12, dur = 0.1, chaos = 0.3): void {
    const a = this.arcs.find((q) => !q.active) ?? this.arcs[0]!;
    a.active = true;
    a.t = 0;
    a.dur = dur;
    a.width = width;
    a.chaos = chaos;
    a.from.copy(from);
    a.to.copy(to);
    a.mat.color.setHex(color).multiplyScalar(2.2);
    a.rejit = 0;
    this.jitterArc(a);
    a.mesh.visible = true;
  }

  private jitterArc(a: Arc): void {
    const len = a.from.distanceTo(a.to);
    for (let k = 0; k < ARC_POINTS; k++) {
      const t = k / (ARC_POINTS - 1);
      const p = a.pts[k]!;
      p.lerpVectors(a.from, a.to, t);
      if (k > 0 && k < ARC_POINTS - 1) {
        const amp = len * a.chaos * Math.sin(t * Math.PI) * 0.35;
        p.x += rng.signed() * amp;
        p.y += rng.signed() * amp;
        p.z += rng.signed() * amp;
      }
    }
  }

  flash(x: number, y: number, z: number, color: number, intensity: number, distance: number, dur: number): void {
    let f = this.flashes[0]!;
    for (const q of this.flashes) if (q.t / q.dur > f.t / f.dur) f = q;
    f.light.color.setHex(color);
    f.light.position.set(x, y, z);
    f.light.distance = distance;
    f.peak = intensity;
    f.t = 0;
    f.dur = dur;
  }

  update(dt: number): void {
    this.add.update(dt);
    this.alpha.update(dt);
    for (const r of this.rings) {
      if (!r.active) continue;
      r.t += dt;
      const k = r.t / r.dur;
      if (k >= 1) {
        r.active = false;
        r.mesh.visible = false;
        continue;
      }
      const e = 1 - Math.pow(1 - k, 3);
      r.mesh.scale.setScalar(r.r0 + (r.r1 - r.r0) * e);
      r.mat.opacity = 1 - k;
    }
    for (const s of this.swooshes) {
      if (!s.active) continue;
      s.t += dt;
      const k = s.t / s.dur;
      if (k >= 1) {
        s.active = false;
        s.root.visible = false;
        continue;
      }
      s.mat.opacity = 1 - k * k;
    }
    const cam = this.camera.position;
    for (const a of this.arcs) {
      if (!a.active) continue;
      a.t += dt;
      if (a.t >= a.dur) {
        a.active = false;
        a.mesh.visible = false;
        continue;
      }
      a.rejit -= dt;
      if (a.rejit <= 0) {
        a.rejit = 0.035;
        this.jitterArc(a);
      }
      const pos = a.geo.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let k = 0; k < ARC_POINTS; k++) {
        const p = a.pts[k]!;
        const q = a.pts[Math.min(k + 1, ARC_POINTS - 1)]!;
        const pr = a.pts[Math.max(k - 1, 0)]!;
        tmpV.subVectors(q, pr).normalize();
        tmpV2.subVectors(cam, p).normalize();
        tmpV3.crossVectors(tmpV, tmpV2).normalize().multiplyScalar(a.width * (1 - Math.abs(k / (ARC_POINTS - 1) - 0.5) * 0.8));
        arr[k * 6] = p.x + tmpV3.x;
        arr[k * 6 + 1] = p.y + tmpV3.y;
        arr[k * 6 + 2] = p.z + tmpV3.z;
        arr[k * 6 + 3] = p.x - tmpV3.x;
        arr[k * 6 + 4] = p.y - tmpV3.y;
        arr[k * 6 + 5] = p.z - tmpV3.z;
      }
      pos.needsUpdate = true;
      a.mat.opacity = 1 - (a.t / a.dur) * 0.6;
    }
    for (const f of this.flashes) {
      if (f.t >= f.dur) {
        f.light.intensity = 0;
        continue;
      }
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      f.light.intensity = f.peak * (1 - k) * (1 - k);
    }
  }
}
