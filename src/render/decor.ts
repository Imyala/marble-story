import * as THREE from 'three';
import { mat, glow, windy } from './materials';
import { taperedTube } from './shapes';
import { Rng } from '../core/rng';

/**
 * Scenery is drawn with instancing: every (geometry, material) pair becomes
 * one InstancedMesh no matter how many trees or rocks a level scatters.
 */

const G: Record<string, THREE.BufferGeometry> = {};
function geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = G[key];
  if (!g) {
    g = make();
    G[key] = g;
  }
  return g;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const GEO = {
  trunk: () => geo('trunk', () => {
    const g = new THREE.CylinderGeometry(0.22, 0.34, 1, 7, 1);
    g.translate(0, 0.5, 0);
    return g;
  }),
  blob: () => geo('blob', () => new THREE.IcosahedronGeometry(1, 1)),
  blobLow: () => geo('blobLow', () => new THREE.IcosahedronGeometry(1, 0)),
  cone: () => geo('cone', () => {
    const g = new THREE.ConeGeometry(1, 1, 8, 1);
    g.translate(0, 0.5, 0);
    return g;
  }),
  rock: () => geo('rock', () => new THREE.DodecahedronGeometry(1, 0)),
  cyl: () => geo('cyl', () => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
    g.translate(0, 0.5, 0);
    return g;
  }),
  cyl6: () => geo('cyl6', () => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 6, 1);
    g.translate(0, 0.5, 0);
    return g;
  }),
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  cap: () => geo('cap', () => {
    const g = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    return g;
  }),
  blade: () => geo('blade', () => {
    const g = new THREE.ConeGeometry(0.05, 1, 3, 1);
    g.translate(0, 0.5, 0);
    return g;
  }),
  disc: () => geo('disc', () => {
    const g = new THREE.CircleGeometry(1, 12, 0.3, Math.PI * 2 - 0.6);
    g.rotateX(-Math.PI / 2);
    return g;
  }),
  octa: () => geo('octa', () => new THREE.OctahedronGeometry(1, 0)),
  willowTrunk: () => geo('willowTrunk', () => taperedTube([V(0, 0, 0), V(0.3, 1.2, 0.1), V(-0.1, 2.4, 0.2), V(0.2, 3.4, -0.1)], 0.35, 0.14, 10, 7, false)),
  deadTrunk: () => geo('deadTrunk', () => {
    const a = taperedTube([V(0, 0, 0), V(0.1, 1.5, 0), V(-0.2, 3, 0.1)], 0.28, 0.06, 8, 6);
    return a;
  }),
  branch: () => geo('branch', () => taperedTube([V(0, 0, 0), V(0.5, 0.4, 0), V(1.1, 0.9, 0.1)], 0.1, 0.02, 6, 5)),
  strand: () => geo('strand', () => {
    const g = new THREE.CylinderGeometry(0.04, 0.01, 1, 4, 1);
    g.translate(0, -0.5, 0);
    return g;
  }),
};

interface Batch {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  mats: THREE.Matrix4[];
  cast: boolean;
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const p = new THREE.Vector3();
const s = new THREE.Vector3();

export class DecorBatch {
  private batches = new Map<string, Batch>();
  readonly rng: Rng;

  constructor(seed = 7) {
    this.rng = new Rng(seed);
  }

  add(geoKey: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number,
    sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0, cast = true): void {
    const key = `${geoKey.uuid}|${material.uuid}`;
    let b = this.batches.get(key);
    if (!b) {
      b = { geo: geoKey, mat: material, mats: [], cast };
      this.batches.set(key, b);
    }
    e.set(rx, ry, rz);
    q.setFromEuler(e);
    p.set(x, y, z);
    s.set(sx, sy, sz);
    b.mats.push(new THREE.Matrix4().compose(p, q, s));
  }

  build(parent: THREE.Object3D): void {
    for (const b of this.batches.values()) {
      const im = new THREE.InstancedMesh(b.geo, b.mat, b.mats.length);
      b.mats.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = b.cast;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      parent.add(im);
    }
    this.batches.clear();
    void m4;
  }

  // ---- scenery pieces -------------------------------------------------------

  tree(x: number, y: number, z: number, scale: number, kind: TreeKind, palette?: { leaf?: number; bark?: number }): void {
    const r = this.rng;
    const sc = scale * (0.85 + r.next() * 0.3);
    const ry = r.next() * Math.PI * 2;
    const bark = mat(palette?.bark ?? 0x5a3e2a, { rough: 0.95 });
    switch (kind) {
      case 'round':
      case 'autumn': {
        const lc = palette?.leaf ?? (kind === 'autumn' ? 0xd87a2a : 0x5a9a42);
        const leaf = windy(mat(lc, { rough: 0.9, flat: true, emissive: lc, emissiveIntensity: 0.12 }), 0.05);
        const th = 2.4 * sc;
        this.add(GEO.trunk(), bark, x, y, z, sc, th, sc, 0, ry, 0);
        this.add(GEO.blob(), leaf, x, y + th + 1.0 * sc, z, 1.9 * sc, 1.6 * sc, 1.9 * sc, 0, ry, 0);
        this.add(GEO.blob(), leaf, x + 0.9 * sc, y + th + 0.4 * sc, z + 0.3 * sc, 1.2 * sc, 1.0 * sc, 1.2 * sc, 0, ry, 0);
        this.add(GEO.blob(), leaf, x - 0.7 * sc, y + th + 0.6 * sc, z - 0.5 * sc, 1.3 * sc, 1.1 * sc, 1.3 * sc, 0, ry, 0);
        break;
      }
      case 'willow': {
        const lc = palette?.leaf ?? 0x4a7a40;
        const leaf = windy(mat(lc, { rough: 0.9, flat: true, emissive: lc, emissiveIntensity: 0.12 }), 0.04);
        const strand = windy(mat(lc, { rough: 0.9, emissive: lc, emissiveIntensity: 0.15 }), 0.14, true);
        this.add(GEO.willowTrunk(), bark, x, y, z, sc, sc, sc, 0, ry, 0);
        const top = y + 3.4 * sc;
        this.add(GEO.blob(), leaf, x + 0.2 * sc, top, z, 2.4 * sc, 1.2 * sc, 2.4 * sc, 0, ry, 0);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + r.next() * 0.3;
          const rr = 1.8 * sc + r.next() * 0.4;
          this.add(GEO.strand(), strand, x + Math.sin(a) * rr, top - 0.2, z + Math.cos(a) * rr, sc * 1.5, (1.5 + r.next() * 1.5) * sc, sc * 1.5, 0, 0, 0, false);
        }
        break;
      }
      case 'pine':
      case 'snowPine': {
        const lc = palette?.leaf ?? 0x2f5a3a;
        const leaf = windy(mat(lc, { rough: 0.9, flat: true, emissive: lc, emissiveIntensity: 0.1 }), 0.025);
        const snow = mat(0xf2f7ff, { rough: 0.8, flat: true });
        this.add(GEO.trunk(), bark, x, y, z, sc * 0.7, 1.4 * sc, sc * 0.7, 0, ry, 0);
        for (let i = 0; i < 3; i++) {
          const w = (1.9 - i * 0.5) * sc;
          const yy = y + (1.0 + i * 1.1) * sc;
          this.add(GEO.cone(), leaf, x, yy, z, w, 1.8 * sc, w, 0, ry + i, 0);
          if (kind === 'snowPine') this.add(GEO.cone(), snow, x, yy + 0.9 * sc, z, w * 0.55, 0.9 * sc, w * 0.55, 0, ry + i, 0, false);
        }
        break;
      }
      case 'dead': {
        const b2 = mat(palette?.bark ?? 0x4a3a30, { rough: 1 });
        this.add(GEO.deadTrunk(), b2, x, y, z, sc, sc, sc, 0, ry, 0);
        for (let i = 0; i < 3; i++) this.add(GEO.branch(), b2, x, y + (1.4 + i * 0.6) * sc, z, sc, sc, sc, 0, ry + i * 2.1, 0);
        break;
      }
      case 'crystal': {
        const c = palette?.leaf ?? 0x9fe0ff;
        const m = mat(c, { rough: 0.15, metal: 0.1, emissive: c, emissiveIntensity: 0.35, flat: true });
        this.add(GEO.octa(), m, x, y + 1.6 * sc, z, 0.6 * sc, 2.0 * sc, 0.6 * sc, 0.1, ry, 0.1);
        this.add(GEO.octa(), m, x + 0.6 * sc, y + 0.9 * sc, z, 0.4 * sc, 1.2 * sc, 0.4 * sc, 0, ry, -0.4);
        this.add(GEO.octa(), m, x - 0.5 * sc, y + 0.7 * sc, z + 0.3 * sc, 0.35 * sc, 1.0 * sc, 0.35 * sc, 0.3, ry, 0.4);
        break;
      }
    }
  }

  mushroom(x: number, y: number, z: number, scale: number, cap: number, glowing = false): void {
    const r = this.rng;
    const sc = scale * (0.8 + r.next() * 0.4);
    const stalk = mat(0xe8dcc0, { rough: 0.9 });
    const capM = glowing ? mat(cap, { rough: 0.6, emissive: cap, emissiveIntensity: 0.55 }) : mat(cap, { rough: 0.7 });
    const h = 1.2 * sc;
    const tilt = r.signed() * 0.15;
    this.add(GEO.cyl(), stalk, x, y, z, 0.18 * sc, h, 0.18 * sc, tilt, 0, tilt);
    this.add(GEO.cap(), capM, x + Math.sin(tilt) * h * 0.2, y + h, z, 0.8 * sc, 0.5 * sc, 0.8 * sc, 0, r.next() * 6, 0);
    const spot = mat(0xfff4dc, { rough: 0.8, emissive: glowing ? 0xfff0c0 : 0, emissiveIntensity: 0.3 });
    for (let i = 0; i < 4; i++) {
      const a = r.next() * Math.PI * 2;
      const rr = 0.45 * sc;
      this.add(GEO.blobLow(), spot, x + Math.sin(a) * rr, y + h + 0.3 * sc, z + Math.cos(a) * rr, 0.09 * sc, 0.05 * sc, 0.09 * sc, 0, 0, 0, false);
    }
  }

  rock(x: number, y: number, z: number, scale: number, color = 0x7d7466): void {
    const r = this.rng;
    const m = mat(color, { rough: 0.95, flat: true });
    this.add(GEO.rock(), m, x, y + scale * 0.35, z, scale * (0.8 + r.next() * 0.5), scale * (0.5 + r.next() * 0.4), scale * (0.8 + r.next() * 0.5),
      r.next(), r.next() * 6, r.next());
  }

  grass(x: number, y: number, z: number, scale: number, color = 0x6aa84a): void {
    const r = this.rng;
    const m = windy(mat(color, { rough: 1, emissive: color, emissiveIntensity: 0.18 }), 0.3);
    const n = 5 + r.int(0, 4);
    for (let i = 0; i < n; i++) {
      this.add(GEO.blade(), m, x + r.signed() * 0.3 * scale, y - 0.02, z + r.signed() * 0.3 * scale, scale * 1.6, scale * (0.28 + r.next() * 0.3), scale * 1.6,
        r.signed() * 0.5, r.next() * 6, r.signed() * 0.5, false);
    }
  }

  reeds(x: number, y: number, z: number, scale: number): void {
    const r = this.rng;
    const stem = mat(0x7a8a4a, { rough: 1 });
    const head = mat(0x6a4a2a, { rough: 1 });
    const n = 3 + r.int(0, 3);
    for (let i = 0; i < n; i++) {
      const ox = x + r.signed() * 0.4 * scale;
      const oz = z + r.signed() * 0.4 * scale;
      const h = (1.2 + r.next() * 0.8) * scale;
      const lean = r.signed() * 0.12;
      this.add(GEO.cyl6(), stem, ox, y, oz, 0.025, h, 0.025, lean, 0, lean, false);
      this.add(GEO.cyl6(), head, ox + Math.sin(lean) * h, y + h * 0.95, oz, 0.06, 0.3 * scale, 0.06, lean, 0, lean, false);
    }
  }

  flower(x: number, y: number, z: number, color: number): void {
    const r = this.rng;
    const stem = mat(0x5a8a3a, { rough: 1 });
    const pet = mat(color, { rough: 0.8, emissive: color, emissiveIntensity: 0.1 });
    const h = 0.3 + r.next() * 0.25;
    this.add(GEO.cyl6(), stem, x, y, z, 0.015, h, 0.015, 0, 0, 0, false);
    this.add(GEO.blobLow(), pet, x, y + h, z, 0.09, 0.06, 0.09, 0, r.next() * 6, 0, false);
  }

  lilypad(x: number, y: number, z: number, scale: number): void {
    this.add(GEO.disc(), mat(0x4a8a3a, { rough: 0.8, side: THREE.DoubleSide }), x, y + 0.02, z, scale, 1, scale, 0, this.rng.next() * 6, 0, false);
  }

  glowCrystal(x: number, y: number, z: number, scale: number, color: number): void {
    const r = this.rng;
    const m = glow(color);
    for (let i = 0; i < 3; i++) {
      this.add(GEO.octa(), m, x + r.signed() * 0.3 * scale, y + 0.3 * scale, z + r.signed() * 0.3 * scale,
        0.15 * scale, (0.4 + r.next() * 0.4) * scale, 0.15 * scale, r.signed() * 0.4, r.next() * 6, r.signed() * 0.4, false);
    }
  }

  pillar(x: number, y: number, z: number, r: number, h: number, color = 0xb8ad98, broken = false): void {
    const m = mat(color, { rough: 0.9, flat: true });
    this.add(GEO.cyl6(), m, x, y, z, r * 1.25, 0.4, r * 1.25, 0, 0.3, 0);
    this.add(GEO.cyl6(), m, x, y + 0.4, z, r, h - (broken ? 0.4 : 0.8), r, 0, 0, 0);
    if (!broken) this.add(GEO.cyl6(), m, x, y + h - 0.4, z, r * 1.25, 0.4, r * 1.25, 0, 0.3, 0);
    else this.add(GEO.rock(), m, x + r, y + 0.2, z + r * 0.6, r * 0.6, r * 0.4, r * 0.5, 0.3, 0.2, 0.1);
  }

  lantern(x: number, y: number, z: number, color = 0xffc070): void {
    const post = mat(0x3a2e24, { rough: 0.9 });
    this.add(GEO.cyl6(), post, x, y, z, 0.07, 2.2, 0.07);
    this.add(GEO.box(), post, x + 0.25, y + 2.15, z, 0.55, 0.06, 0.06);
    this.add(GEO.blobLow(), glow(color), x + 0.45, y + 1.9, z, 0.14, 0.2, 0.14, 0, 0, 0, false);
  }
}

export type TreeKind = 'round' | 'autumn' | 'willow' | 'pine' | 'snowPine' | 'dead' | 'crystal';
