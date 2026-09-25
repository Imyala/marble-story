import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Game } from '../game/game';
import type { Hit, HitResult, Hittable } from '../game/types';
import type { Prop } from './props';
import type { GemKind } from './gems';
import { makeBox, makeCyl, type Solid } from '../world/collision';
import { mat } from '../render/materials';
import { rng } from '../core/rng';
import type { Sfx } from '../core/audio';
import { bump } from '../game/feats';

/**
 * Things to smash: crates, barrels, urns, powder kegs, Gloom pods, and
 * treasure chests. Every kind is one instanced, vertex-coloured mesh, so a
 * level can scatter dozens for the price of a single draw call each.
 */

export type BreakKind = 'crate' | 'barrel' | 'urn' | 'keg' | 'pod' | 'basket';

interface KindDef {
  /** Hits to break with ordinary blows (heavy hits count double). */
  hp: number;
  radius: number;
  height: number;
  box: boolean;
  debris: number;
  sfx: Sfx;
  /** Blue gems dropped, [min, max]. */
  blue: [number, number];
  /** Chance of a red or green gem. */
  extra: number;
  /** Fire and explosions set it off. */
  explodes?: boolean;
  /** Purple fury gems instead of health. */
  purple?: boolean;
}

const KINDS: Record<BreakKind, KindDef> = {
  crate: { hp: 2, radius: 0.62, height: 1.2, box: true, debris: 0x9a7448, sfx: 'woodBreak', blue: [2, 5], extra: 0.25 },
  barrel: { hp: 2, radius: 0.55, height: 1.3, box: false, debris: 0x8a6440, sfx: 'woodBreak', blue: [3, 6], extra: 0.3 },
  urn: { hp: 1, radius: 0.45, height: 1.1, box: false, debris: 0xb87a52, sfx: 'potBreak', blue: [1, 4], extra: 0.35 },
  basket: { hp: 1, radius: 0.5, height: 0.8, box: false, debris: 0xc8a46a, sfx: 'woodBreak', blue: [1, 3], extra: 0.45 },
  keg: { hp: 1, radius: 0.5, height: 1.1, box: false, debris: 0x6a3a28, sfx: 'woodBreak', blue: [1, 2], extra: 0, explodes: true },
  pod: { hp: 1, radius: 0.6, height: 1.3, box: false, debris: 0x7a3ab0, sfx: 'potBreak', blue: [2, 5], extra: 0.4, purple: true },
};

// --- geometry: vertex-coloured, merged per kind -----------------------------------

function paint(g: THREE.BufferGeometry, color: number): THREE.BufferGeometry {
  const out = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(color);
  const n = out.getAttribute('position').count;
  const cols = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // A touch of per-vertex variation so wood and clay do not read as plastic.
    const k = 0.9 + Math.random() * 0.2;
    cols[i * 3] = c.r * k;
    cols[i * 3 + 1] = c.g * k;
    cols[i * 3 + 2] = c.b * k;
  }
  out.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  for (const name of Object.keys(out.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'color') out.deleteAttribute(name);
  return out;
}

function at(g: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): THREE.BufferGeometry {
  g.rotateX(rx);
  g.rotateY(ry);
  g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

const GEOS: Partial<Record<BreakKind, THREE.BufferGeometry>> = {};

function kindGeo(kind: BreakKind): THREE.BufferGeometry {
  const cached = GEOS[kind];
  if (cached) return cached;
  const parts: THREE.BufferGeometry[] = [];
  switch (kind) {
    case 'crate': {
      const wood = 0xa27a4a;
      const dark = 0x6a4a2a;
      parts.push(paint(at(new THREE.BoxGeometry(1.1, 1.1, 1.1), 0, 0.55, 0), wood));
      // Framing on every face.
      for (const [x, z, ry] of [[0, 0.56, 0], [0, -0.56, 0], [0.56, 0, Math.PI / 2], [-0.56, 0, Math.PI / 2]] as const) {
        parts.push(paint(at(new THREE.BoxGeometry(1.16, 0.14, 0.06), x, 0.08, z, 0, ry), dark));
        parts.push(paint(at(new THREE.BoxGeometry(1.16, 0.14, 0.06), x, 1.02, z, 0, ry), dark));
        parts.push(paint(at(new THREE.BoxGeometry(1.42, 0.12, 0.05), x, 0.55, z, 0, ry, Math.PI / 4), dark));
      }
      parts.push(paint(at(new THREE.BoxGeometry(1.14, 0.06, 0.14), 0, 1.12, 0), dark));
      break;
    }
    case 'barrel': {
      parts.push(paint(at(new THREE.CylinderGeometry(0.46, 0.4, 1.25, 12, 1), 0, 0.625, 0), 0x8a5e36));
      parts.push(paint(at(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12, 1), 0, 0.3, 0), 0x3a3a42));
      parts.push(paint(at(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12, 1), 0, 0.95, 0), 0x3a3a42));
      parts.push(paint(at(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 12, 1), 0, 1.26, 0), 0x6a4626));
      break;
    }
    case 'keg': {
      parts.push(paint(at(new THREE.CylinderGeometry(0.44, 0.38, 1.05, 12, 1), 0, 0.525, 0), 0x6a2a20));
      parts.push(paint(at(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 12, 1), 0, 0.22, 0), 0x2a2a30));
      parts.push(paint(at(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 12, 1), 0, 0.84, 0), 0x2a2a30));
      // A painted flame warns what is inside.
      parts.push(paint(at(new THREE.ConeGeometry(0.16, 0.34, 5), 0, 0.55, 0.44, Math.PI / 2 - 0.2, 0, 0), 0xffb030));
      parts.push(paint(at(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), 0, 1.15, 0), 0xd8c8a0));
      break;
    }
    case 'urn': {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const r = 0.18 + Math.sin(t * Math.PI) * 0.26 + (t > 0.85 ? (t - 0.85) * 1.2 : 0);
        pts.push(new THREE.Vector2(r, t * 1.05));
      }
      parts.push(paint(new THREE.LatheGeometry(pts, 12), 0xb8764a));
      parts.push(paint(at(new THREE.TorusGeometry(0.4, 0.04, 5, 14), 0, 0.5, 0, Math.PI / 2), 0xe0c070));
      parts.push(paint(at(new THREE.TorusGeometry(0.3, 0.03, 5, 12), 0, 0.78, 0, Math.PI / 2), 0x6a3a28));
      break;
    }
    case 'basket': {
      parts.push(paint(at(new THREE.CylinderGeometry(0.5, 0.38, 0.62, 10, 2, true), 0, 0.31, 0), 0xc8a060));
      parts.push(paint(at(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 10, 1), 0, 0.03, 0), 0xa88048));
      parts.push(paint(at(new THREE.TorusGeometry(0.5, 0.05, 5, 14), 0, 0.62, 0, Math.PI / 2), 0x8a6a38));
      // Something good inside.
      parts.push(paint(at(new THREE.IcosahedronGeometry(0.34, 0), 0, 0.6, 0), 0xd84a3a));
      break;
    }
    case 'pod': {
      parts.push(paint(at(new THREE.IcosahedronGeometry(0.62, 1), 0, 0.72, 0), 0x3a1a4a));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        parts.push(paint(at(new THREE.ConeGeometry(0.12, 0.6, 4), Math.sin(a) * 0.45, 0.35, Math.cos(a) * 0.45, Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6), 0x2a1236));
      }
      parts.push(paint(at(new THREE.OctahedronGeometry(0.24, 0), 0, 1.25, 0), 0xc070ff));
      break;
    }
  }
  const g = mergeGeometries(parts, false)!;
  g.computeBoundingSphere();
  GEOS[kind] = g;
  return g;
}

const MATS: Partial<Record<BreakKind, THREE.Material>> = {};
function kindMat(kind: BreakKind): THREE.Material {
  let m = MATS[kind];
  if (!m) {
    m = kind === 'pod'
      ? mat(0xffffff, { vertexColors: true, rough: 0.35, emissive: 0x401060, emissiveIntensity: 0.5, flat: true })
      : kind === 'urn'
        ? mat(0xffffff, { vertexColors: true, rough: 0.55, flat: true })
        : mat(0xffffff, { vertexColors: true, rough: 0.9, flat: true });
    MATS[kind] = m;
  }
  return m;
}

// --- the props --------------------------------------------------------------------

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class Breakable implements Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  readonly height: number;
  private hp: number;
  private solid: Solid;
  /** Index into the kind's instanced mesh, set when the level finishes building. */
  index = -1;
  mesh: THREE.InstancedMesh | null = null;
  wobble = 0;
  private hintT = 0;

  constructor(private game: Game, readonly kind: BreakKind, readonly x: number, readonly y: number, readonly z: number, readonly yaw: number,
    readonly scale: number, private loot: Partial<Record<GemKind, number>> | null) {
    const d = KINDS[kind];
    this.radius = d.radius * scale;
    this.height = d.height * scale;
    this.hp = d.hp;
    this.solid = d.box ? makeBox(x, z, 0.55 * scale, 0.55 * scale, y, y + this.height, yaw) : makeCyl(x, z, this.radius * 0.92, y, y + this.height);
    this.solid.surface = kind === 'urn' ? 'stone' : 'wood';
    game.col.add(this.solid);
  }

  matrix(out: THREE.Matrix4, wob = 0): THREE.Matrix4 {
    tmpQ.setFromAxisAngle(UP, this.yaw);
    if (wob > 0) {
      const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(wob * 40) * wob * 0.5);
      tmpQ.multiply(tilt);
    }
    return out.compose(tmpV.set(this.x, this.y, this.z), tmpQ, tmpS.setScalar(this.scale));
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    const d = KINDS[this.kind];
    if (hit.type === 'shadow') return 'none';
    if (d.explodes && (hit.type === 'fire' || hit.source === 'reaction' || hit.move === 'explosion' || hit.move === 'keg')) {
      this.shatter(hit);
      return 'hit';
    }
    this.hp -= hit.heavy || hit.source === 'charge' || hit.source === 'burst' ? 2 : hit.source === 'breath' ? 0.35 : 1;
    if (this.hp <= 0) {
      this.shatter(hit);
      return 'hit';
    }
    this.wobble = 0.3;
    this.game.sfx(d.sfx === 'woodBreak' ? 'hit' : 'potBreak', this.x, this.y, this.z, 1.3, 0.4);
    if (d.explodes && this.hintT <= 0) {
      this.hintT = 8;
      this.game.toast('A powder keg. Fire would set it off!', 'hint');
    }
    return 'hit';
  }

  private shatter(hit: Hit | null): void {
    const g = this.game;
    const d = KINDS[this.kind];
    this.alive = false;
    this.solid.enabled = false;
    if (this.mesh) {
      this.mesh.setMatrixAt(this.index, tmpM.makeScale(0, 0, 0));
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    const cy = this.y + this.height * 0.5;
    bump(g.save, d.explodes ? 'kegs' : 'breaks');
    g.checkFeats();
    g.fx.rocks(this.x, cy, this.z, 10 + Math.round(this.scale * 6), d.debris);
    g.fx.dust(this.x, this.y, this.z, 6);
    g.sfx(d.sfx, this.x, cy, this.z, 0.9 + rng.next() * 0.25);
    if (hit?.fromPlayer !== false) g.style.bonus(4);
    if (d.explodes) {
      g.explode(this.x, cy, this.z, 3.6, 38, 'fire', true, {
        buildup: 60, knockback: 10, launch: 6, stagger: 70, heavy: true, move: 'keg', color: 0xffa040, burnGround: true,
      });
      g.shake(0.35, 0.35);
      g.sfx('explosion', this.x, cy, this.z);
    }
    if (this.kind === 'pod') g.fx.shadowPoof(this.x, cy, this.z, 1.2);
    // Loot: what the level asked for, or the kind's usual spill.
    const loot: Partial<Record<GemKind, number>> = this.loot ?? { blue: d.blue[0] + Math.floor(rng.next() * (d.blue[1] - d.blue[0] + 1)) };
    if (!this.loot && rng.chance(d.extra)) {
      if (d.purple) loot.purple = 1;
      else loot[rng.chance(0.5) ? 'red' : 'green'] = 1;
    }
    g.spawnGems(this.x, cy, this.z, loot, false);
  }

  update(dt: number): void {
    this.hintT -= dt;
    if (this.wobble <= 0 || !this.mesh || !this.alive) return;
    this.wobble = Math.max(0, this.wobble - dt);
    this.mesh.setMatrixAt(this.index, this.matrix(tmpM, this.wobble));
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** Collects a level's breakables during the build, then draws each kind as one instanced mesh. */
export class BreakableSet implements Prop {
  readonly items: Breakable[] = [];
  private wobbling: Breakable[] = [];

  add(b: Breakable): void {
    this.items.push(b);
  }

  build(root: THREE.Object3D): void {
    const byKind = new Map<BreakKind, Breakable[]>();
    for (const b of this.items) {
      const l = byKind.get(b.kind) ?? [];
      l.push(b);
      byKind.set(b.kind, l);
    }
    for (const [kind, list] of byKind) {
      const im = new THREE.InstancedMesh(kindGeo(kind), kindMat(kind), list.length);
      im.castShadow = true;
      im.receiveShadow = true;
      list.forEach((b, i) => {
        b.index = i;
        b.mesh = im;
        im.setMatrixAt(i, b.matrix(tmpM));
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      root.add(im);
    }
  }

  update(dt: number): void {
    // Only the few that were just struck need their matrices touched.
    this.wobbling = this.items.filter((b) => b.wobble > 0);
    for (const b of this.wobbling) b.update(dt);
  }
}

// --- treasure chests ------------------------------------------------------------------

/** A chest that opens with any blow, once per save, and spills a generous hoard. */
export class Chest implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.8;
  readonly height = 1.1;
  private lid = new THREE.Group();
  private openT = -1;
  private solid: Solid;

  constructor(private game: Game, readonly id: string, readonly x: number, readonly y: number, readonly z: number, yaw: number,
    private loot: Partial<Record<GemKind, number>>) {
    const root = new THREE.Group();
    const wood = mat(0x7a4a2a, { rough: 0.8, flat: true });
    const gold = mat(0xe0b050, { rough: 0.3, metal: 0.8, flat: true });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.85), wood);
    box.position.y = 0.35;
    box.castShadow = true;
    root.add(box);
    for (const sx of [-0.5, 0.5]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.74, 0.9), gold);
      band.position.set(sx, 0.36, 0);
      root.add(band);
    }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 10, 1, false, 0, Math.PI), wood);
    top.rotation.z = Math.PI / 2;
    top.castShadow = true;
    this.lid.add(top);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.08), gold);
    lock.position.set(0, -0.02, 0.44);
    this.lid.add(lock);
    // The lid hinges along the back edge.
    this.lid.position.set(0, 0.7, -0.42);
    top.position.z = 0.42;
    lock.position.z += 0.42;
    root.add(this.lid);
    root.position.set(x, y, z);
    root.rotation.y = yaw;
    game.level!.root.add(root);
    this.solid = makeBox(x, z, 0.65, 0.43, y, y + 1.0, yaw);
    game.col.add(this.solid);
    if (game.save.found[id]) {
      this.alive = false;
      this.openT = 1;
      this.lid.rotation.x = -1.9;
    }
  }

  takeHit(): HitResult {
    if (!this.alive) return 'none';
    const g = this.game;
    this.alive = false;
    this.openT = 0;
    g.save.found[this.id] = true;
    bump(g.save, 'chests');
    g.checkFeats();
    g.sfx('chest', this.x, this.y, this.z);
    g.fx.motes(this.x, this.y + 0.8, this.z, 0xffe090, 24);
    g.spawnGems(this.x, this.y + 1, this.z, this.loot, false);
    g.style.bonus(20);
    return 'hit';
  }

  update(dt: number): void {
    if (this.openT < 0 || this.openT >= 1) return;
    this.openT = Math.min(1, this.openT + dt * 2.2);
    const e = 1 - Math.pow(1 - this.openT, 3);
    this.lid.rotation.x = -1.9 * e;
    if (rng.chance(0.4)) this.game.fx.sparkle(this.x, this.y + 0.9, this.z, 0xffe090, 2);
  }
}
