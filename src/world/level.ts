import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CollisionWorld, Heightfield, makeBox, makeCyl, makeRamp, type Solid, type Surface } from './collision';
import { Shaper } from './shaper';
import { buildTerrainMesh, buildTerrainSkirt } from '../render/terrain';
import { Water } from '../render/water';
import { DecorBatch, GEO, type TreeKind } from '../render/decor';
import { mat, glow } from '../render/materials';
import type { SkyDef } from '../render/sky';
import type { Game } from '../game/game';
import type { Hittable, Element } from '../game/types';
import {
  Arena, BounceShroom, Collectible, CrumblePlatform, GemCluster, Gate, Hazard, MovingPlatform, Portal, PressurePlate,
  Switch, Talker, Torch, Trigger, Updraft, Wardstone, Geyser, ClimbWall, GlideCourse, type CollectKind, type GateKind, type Interactable, type Prop, type SpawnSpec,
} from '../entities/props';
import type { GemKind } from '../entities/gems';
import { Breakable, BreakableSet, Chest, type BreakKind } from '../entities/breakables';
import { WaterIce } from '../entities/waterice';
import {
  BoltTurret, Boulder, Conduit, Drawbridge, ElementLock, IceFloes, PuzzleHint, ReflectSwitch, Rope, SnapGate, SpinBlade, WeightPlate,
} from '../entities/puzzles';
import { DragonRig, defaultPose, type DragonLook, type DragonPose } from '../player/dragonRig';
import { rng } from '../core/rng';

export interface TerrainDef {
  x0: number;
  z0: number;
  sizeX: number;
  sizeZ: number;
  cell: number;
  shape(s: Shaper): void;
  color(x: number, z: number, h: number, slope: number, path: number): number;
  skirt?: { depth: number; color: number };
}

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  music: string;
  sky: SkyDef;
  terrain?: TerrainDef;
  water?: { level: number; deep: number; shallow: number; glint: number; opacity?: number };
  killY: number;
  spawn: [number, number, number];
  build(b: Builder): void;
  /** Runs after the player is placed. `fresh` is true on first entry this session. */
  onEnter?(g: Game, fresh: boolean): void;
}

export class Level {
  readonly def: LevelDef;
  readonly root = new THREE.Group();
  readonly col = new CollisionWorld();
  shaper: Shaper | null = null;
  readonly props: Prop[] = [];
  readonly hittables: Hittable[] = [];
  readonly interactables: Interactable[] = [];
  readonly updrafts: Updraft[] = [];
  readonly hazards: Hazard[] = [];
  readonly arenas: Arena[] = [];
  readonly wardstones = new Map<string, Wardstone>();
  readonly npcs: Npc[] = [];
  readonly climbWalls: ClimbWall[] = [];
  /** Every collectible the level places, found or not: the pause screen counts from this. */
  readonly secrets: { kind: CollectKind; id: string }[] = [];
  readonly conduits: Conduit[] = [];
  readonly reflectTargets: ReflectSwitch[] = [];
  readonly boulders: Boulder[] = [];
  private conduitGroups = new Map<string, { signal: string; done: boolean }>();
  waterLevel = -1e4;
  /** Floes frozen by ice breath (only in realms with water). */
  waterIce: WaterIce | null = null;
  killY: number;
  water: Water | null = null;
  private listeners = new Map<string, (() => void)[]>();
  private slamListeners: ((x: number, y: number, z: number, r: number) => void)[] = [];
  private torchGroups = new Map<string, { total: number; lit: number; signal: string; done: boolean }>();
  readonly fired = new Set<string>();

  constructor(def: LevelDef) {
    this.def = def;
    this.killY = def.killY;
  }

  on(signal: string, fn: () => void): void {
    let l = this.listeners.get(signal);
    if (!l) {
      l = [];
      this.listeners.set(signal, l);
    }
    l.push(fn);
  }

  emit(signal: string): void {
    this.fired.add(signal);
    for (const fn of this.listeners.get(signal) ?? []) fn();
  }

  onSlam(fn: (x: number, y: number, z: number, r: number) => void): void {
    this.slamListeners.push(fn);
  }

  slam(x: number, y: number, z: number, r: number): void {
    for (const fn of this.slamListeners) fn(x, y, z, r);
  }

  torchGroup(group: string, signal: string): void {
    const g = this.torchGroups.get(group) ?? { total: 0, lit: 0, signal, done: false };
    g.signal = signal;
    this.torchGroups.set(group, g);
  }

  addTorch(group: string, lit: boolean): void {
    const g = this.torchGroups.get(group) ?? { total: 0, lit: 0, signal: '', done: false };
    g.total++;
    if (lit) g.lit++;
    this.torchGroups.set(group, g);
  }

  torchLit(group: string): void {
    const g = this.torchGroups.get(group);
    if (!g || g.done) return;
    g.lit++;
    if (g.lit >= g.total) {
      g.done = true;
      if (g.signal) this.emit(g.signal);
    }
  }

  torchOut(group: string): void {
    const g = this.torchGroups.get(group);
    if (g && !g.done) g.lit = Math.max(0, g.lit - 1);
  }

  conduitGroup(group: string, signal: string): void {
    this.conduitGroups.set(group, { signal, done: false });
  }

  /** A conduit lit or went dark: the group's signal fires once all of it is lit at the same time. */
  conduitChanged(group: string): void {
    const cg = this.conduitGroups.get(group);
    if (!cg || cg.done) return;
    const set = this.conduits.filter((c) => c.group === group);
    if (set.length > 0 && set.every((c) => c.charged)) {
      cg.done = true;
      this.emit(cg.signal);
    }
  }

  groupDone(group: string): boolean {
    return this.torchGroups.get(group)?.done ?? false;
  }

  update(dt: number): void {
    for (const p of this.props) p.update(dt);
    for (const n of this.npcs) n.update(dt);
  }

  dispose(scene: THREE.Scene): void {
    for (const p of this.props) p.dispose?.();
    scene.remove(this.root);
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry && !(m as unknown as THREE.InstancedMesh).isInstancedMesh) {
        // Shared geometries are cached; only dispose the terrain-sized ones.
        if (m.geometry.getAttribute('position')?.count > 5000) m.geometry.dispose();
      }
    });
  }
}

/** A dragon NPC standing in the world. */
export class Npc {
  readonly rig: DragonRig;
  readonly pose: DragonPose = defaultPose();
  talking = false;
  private yaw: number;
  constructor(private game: Game, readonly id: string, look: DragonLook, readonly x: number, readonly y: number, readonly z: number, yaw: number) {
    this.rig = new DragonRig(look);
    this.yaw = yaw;
    this.rig.root.position.set(x, y, z);
    this.rig.root.rotation.y = yaw;
    game.level!.root.add(this.rig.root);
  }
  update(dt: number): void {
    const p = this.game.player.body;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (d < 9) {
      const want = Math.atan2(p.x - this.x, p.z - this.z);
      let diff = want - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 2);
    }
    this.rig.root.rotation.y = this.yaw;
    this.pose.talk = this.game.dialogueSpeaker === this.id;
    this.rig.update(dt, this.pose);
  }
}

// ---------------------------------------------------------------------------

export interface BoxOpts {
  yaw?: number;
  surface?: Surface;
  flat?: boolean;
  trim?: number;
  cast?: boolean;
  noMesh?: boolean;
}

/**
 * Level construction API. Level files read like a list of what is where;
 * the builder turns each call into meshes, colliders and props.
 */
export class Builder {
  readonly decor: DecorBatch;
  readonly level: Level;
  readonly game: Game;

  readonly breakableSet = new BreakableSet();

  constructor(game: Game, level: Level) {
    this.game = game;
    this.level = level;
    this.decor = new DecorBatch(level.def.id.length * 97 + 13);
    level.props.push(this.breakableSet);
  }

  get col(): CollisionWorld {
    return this.level.col;
  }

  /** Highest ground (terrain or solid) at x, z. */
  y(x: number, z: number): number {
    const g = this.col.groundAt(x, z, 1e4, 0.05).y;
    return g > -1e3 ? g : 0;
  }

  // --- terrain and water ----------------------------------------------------------

  terrain(t: TerrainDef): void {
    const s = new Shaper();
    t.shape(s);
    this.level.shaper = s;
    const hf = Heightfield.fromFunction(t.x0, t.z0, t.sizeX, t.sizeZ, t.cell, (x, z) => s.height(x, z));
    this.col.terrain = hf;
    const mesh = buildTerrainMesh(hf, (x, z, h, slope) => t.color(x, z, h, slope, s.pathMask(x, z)));
    this.level.root.add(mesh);
    if (t.skirt) {
      const sk = buildTerrainSkirt(hf, t.skirt.depth, t.skirt.color);
      if (sk) this.level.root.add(sk);
    }
  }

  water(w: NonNullable<LevelDef['water']>): void {
    this.level.waterLevel = w.level;
    const water = new Water(w.level, 420, w.deep, w.shallow, w.glint, w.opacity ?? 0.82);
    this.level.water = water;
    this.level.root.add(water.mesh);
    // Ice breath can freeze any of it.
    this.level.waterIce = new WaterIce(this.game);
    this.level.props.push(this.level.waterIce);
  }

  // --- solids -------------------------------------------------------------------------

  /** Box from y0 up h, centered on x, z. */
  box(x: number, y0: number, z: number, w: number, h: number, d: number, color: number, o: BoxOpts = {}): Solid {
    const s = makeBox(x, z, w / 2, d / 2, y0, y0 + h, o.yaw ?? 0);
    s.surface = o.surface ?? 'stone';
    this.col.add(s);
    if (!o.noMesh) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { rough: 0.9, flat: o.flat ?? true }));
      m.position.set(x, y0 + h / 2, z);
      m.rotation.y = o.yaw ?? 0;
      m.castShadow = o.cast ?? true;
      m.receiveShadow = true;
      this.addStatic(m);
      if (o.trim !== undefined) {
        // Sits a hair below the top face so the two never fight for the same pixels.
        const t = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.14, d + 0.12), mat(o.trim, { rough: 0.6 }));
        t.position.set(x, y0 + h - 0.1, z);
        t.rotation.y = o.yaw ?? 0;
        this.addStatic(t);
      }
    }
    return s;
  }

  /** A slab whose top is at `top`. */
  platform(x: number, top: number, z: number, w: number, d: number, color = 0x9a8f7a, thick = 1, o: BoxOpts = {}): Solid {
    return this.box(x, top - thick, z, w, thick, d, color, { trim: o.trim ?? 0xb8ad98, ...o });
  }

  /** A stone pillar you can stand on. */
  pillar(x: number, z: number, r: number, y0: number, top: number, color = 0xa89e8a): Solid {
    const s = makeCyl(x, z, r, y0, top);
    this.col.add(s);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, top - y0, 8), mat(color, { rough: 0.9, flat: true }));
    m.position.set(x, (y0 + top) / 2, z);
    m.castShadow = m.receiveShadow = true;
    this.addStatic(m);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.12, 0.25, 8), mat(0xc8bda6, { rough: 0.8, flat: true }));
    cap.position.set(x, top - 0.12, z);
    cap.receiveShadow = true;
    this.addStatic(cap);
    return s;
  }

  /** A floating rock island: flat grassy top, rocky cone below. */
  islet(x: number, top: number, z: number, r: number, grass = 0x5a9a4a, rock = 0x7a6e5e): Solid {
    const s = makeCyl(x, z, r, top - 1.5, top);
    s.surface = 'grass';
    this.col.add(s);
    const topM = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.95, 0.6, 14), mat(grass, { rough: 1, flat: true }));
    topM.position.set(x, top - 0.3, z);
    topM.receiveShadow = true;
    this.addStatic(topM);
    const under = new THREE.Mesh(new THREE.ConeGeometry(r * 0.95, r * 1.8, 10, 2), mat(rock, { rough: 1, flat: true }));
    under.rotation.x = Math.PI;
    under.position.set(x, top - 0.6 - r * 0.9, z);
    under.castShadow = true;
    this.addStatic(under);
    return s;
  }

  ramp(x: number, z: number, w: number, len: number, yaw: number, yLow: number, yHigh: number, color = 0x9a8f7a, thick = 0.6): Solid {
    const s = makeRamp(x, z, w / 2, len / 2, Math.min(yLow, yHigh) - thick, yLow, yHigh, yaw);
    this.col.add(s);
    const rise = yHigh - yLow;
    const slopeLen = Math.hypot(len, rise);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, thick, slopeLen), mat(color, { rough: 0.9, flat: true }));
    m.position.set(x, (yLow + yHigh) / 2 - thick / 2, z);
    m.rotation.order = 'YXZ';
    m.rotation.y = yaw;
    m.rotation.x = -Math.atan2(rise, len);
    m.castShadow = m.receiveShadow = true;
    this.addStatic(m);
    return s;
  }

  /** Straight stairs rising along yaw from (x, z). */
  stairs(x: number, z: number, w: number, yaw: number, fromY: number, toY: number, steps: number, color = 0xa89e8a): void {
    const rise = (toY - fromY) / steps;
    const depth = 0.7;
    for (let i = 0; i < steps; i++) {
      const cx = x + Math.sin(yaw) * depth * (i + 0.5);
      const cz = z + Math.cos(yaw) * depth * (i + 0.5);
      this.box(cx, fromY - 0.5, cz, w, rise * (i + 1) + 0.5, depth, color, { yaw });
    }
  }

  /** A plank bridge between two points. */
  bridge(ax: number, az: number, ay: number, bx: number, bz: number, by: number, width = 3): void {
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = Math.atan2(bx - ax, bz - az);
    const cx = (ax + bx) / 2;
    const cz = (az + bz) / 2;
    const s = makeRamp(cx, cz, width / 2, len / 2, Math.min(ay, by) - 0.4, ay, by, yaw);
    s.surface = 'wood';
    this.col.add(s);
    const wood = mat(0x8a6a44, { rough: 0.95 });
    const dark = mat(0x5a4028, { rough: 0.95 });
    const n = Math.max(2, Math.round(len / 0.6));
    // Short planks follow the slope by position alone, like steps.
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      this.decor.add(GEO.box(), i % 3 === 0 ? dark : wood, ax + (bx - ax) * t, ay + (by - ay) * t - 0.08, az + (bz - az) * t,
        width, 0.15, 0.5, 0, yaw, (rng.next() - 0.5) * 0.04);
    }
    for (const side of [-1, 1]) {
      const ox = Math.cos(yaw) * side * (width / 2);
      const oz = -Math.sin(yaw) * side * (width / 2);
      for (let i = 0; i <= Math.ceil(len / 3); i++) {
        const t = i / Math.ceil(len / 3);
        this.decor.add(GEO.cyl6(), dark, ax + (bx - ax) * t + ox, ay + (by - ay) * t - 0.1, az + (bz - az) * t + oz, 0.075, 1.1, 0.075);
      }
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Math.hypot(len, by - ay), 4), mat(0xc8b080));
      rope.position.set(cx + ox, (ay + by) / 2 + 0.95, cz + oz);
      rope.rotation.order = 'YXZ';
      rope.rotation.y = yaw;
      rope.rotation.x = Math.PI / 2 - Math.atan2(by - ay, len);
      this.addStatic(rope);
    }
  }

  /** A wall segment between two points. */
  wall(x1: number, z1: number, x2: number, z2: number, y0: number, h: number, thick = 1, color = 0x8a8272): Solid {
    const len = Math.hypot(x2 - x1, z2 - z1);
    return this.box((x1 + x2) / 2, y0, (z1 + z2) / 2, thick, h, len, color, { yaw: Math.atan2(x2 - x1, z2 - z1) });
  }

  /** Invisible level boundary. */
  bound(x1: number, z1: number, x2: number, z2: number): void {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const s = makeBox((x1 + x2) / 2, (z1 + z2) / 2, 0.5, len / 2, -200, 300, Math.atan2(x2 - x1, z2 - z1));
    s.wallOnly = true;
    this.col.add(s);
  }

  /** A ring of invisible walls. */
  boundCircle(x: number, z: number, r: number, n = 32): void {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      this.bound(x + Math.sin(a0) * r, z + Math.cos(a0) * r, x + Math.sin(a1) * r, z + Math.cos(a1) * r);
    }
  }

  arch(x: number, z: number, yaw: number, w: number, h: number, color = 0xb8ad98): void {
    const y0 = this.y(x, z);
    for (const side of [-1, 1]) {
      const px = x + Math.cos(yaw) * side * w * 0.5;
      const pz = z - Math.sin(yaw) * side * w * 0.5;
      this.pillar(px, pz, 0.55, y0 - 0.5, y0 + h, color);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.8, 1.2), mat(color, { rough: 0.9, flat: true }));
    lintel.position.set(x, y0 + h + 0.4, z);
    lintel.rotation.y = yaw;
    lintel.castShadow = true;
    this.addStatic(lintel);
  }

  // --- scenery --------------------------------------------------------------------------

  tree(x: number, z: number, scale: number, kind: TreeKind, palette?: { leaf?: number; bark?: number }, collide = true): void {
    const y = this.y(x, z);
    this.decor.tree(x, y, z, scale, kind, palette);
    if (collide && kind !== 'crystal') this.col.add(makeCyl(x, z, 0.35 * scale, y - 1, y + 3 * scale));
    // Keep the camera out of leafy canopies.
    const canopy: Partial<Record<TreeKind, [number, number, number]>> = {
      round: [1.9, 2.3, 4.6], autumn: [1.9, 2.3, 4.6], willow: [2.3, 2.6, 4.4], pine: [1.5, 1.2, 4.8], snowPine: [1.5, 1.2, 4.8],
    };
    const c = canopy[kind];
    if (c) {
      const s = makeCyl(x, z, c[0] * scale, y + c[1] * scale, y + c[2] * scale);
      s.cameraOnly = true;
      this.col.add(s);
    }
  }

  rock(x: number, z: number, scale: number, color = 0x7d7466, collide = scale > 0.9): void {
    const y = this.y(x, z);
    this.decor.rock(x, y - scale * 0.15, z, scale, color);
    if (collide) this.col.add(makeCyl(x, z, scale * 0.8, y - 1, y + scale * 0.7));
  }

  mushroom(x: number, z: number, scale: number, color: number, glowing = false): void {
    const y = this.y(x, z);
    this.decor.mushroom(x, y, z, scale, color, glowing);
    if (scale > 1.2) this.col.add(makeCyl(x, z, 0.2 * scale, y - 1, y + 1.2 * scale));
  }

  /**
   * Scatters scenery over the terrain inside a circle, skipping water,
   * steep ground and anything `keep` rejects.
   */
  scatter(count: number, cx: number, cz: number, r: number, place: (x: number, z: number, y: number) => void,
    keep?: (x: number, z: number, y: number) => boolean): void {
    let placed = 0;
    for (let tries = 0; tries < count * 6 && placed < count; tries++) {
      const a = this.decor.rng.next() * Math.PI * 2;
      const d = Math.sqrt(this.decor.rng.next()) * r;
      const x = cx + Math.sin(a) * d;
      const z = cz + Math.cos(a) * d;
      const y = this.col.terrainAt(x, z);
      if (y < -1e3) continue;
      if (y < this.level.waterLevel + 0.15) continue;
      // Bare ground only: never on (or jammed against) structures already built.
      if (this.col.groundAt(x, z, 1e4, 0.6).y > y + 0.3) continue;
      if (this.level.shaper && this.level.shaper.pathMask(x, z) > 0.3) continue;
      if (keep && !keep(x, z, y)) continue;
      place(x, z, y);
      placed++;
    }
  }

  // --- gameplay -------------------------------------------------------------------------

  private addProp<T extends Prop>(p: T): T {
    this.level.props.push(p);
    return p;
  }

  enemy(type: string, x: number, z: number, yaw = 0, y?: number): void {
    const gy = y ?? this.y(x, z);
    this.game.pendingSpawns.push({ type, x, y: gy + 0.05, z, yaw });
  }

  arena(id: string, x: number, z: number, r: number, waves: SpawnSpec[][], reward = 40): Arena {
    const a = this.addProp(new Arena(this.game, id, x, this.y(x, z), z, r, waves, reward));
    this.level.arenas.push(a);
    return a;
  }

  gems(x: number, z: number, kind: GemKind, n: number, radius = 1.5, y?: number): void {
    const gy = y ?? this.y(x, z);
    if (n === 1) {
      this.game.placeGem(kind, 1, x, gy + 0.5, z);
      return;
    }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.game.placeGem(kind, 1, x + Math.sin(a) * radius, gy + 0.5, z + Math.cos(a) * radius);
    }
  }

  gemLine(points: [number, number][], kind: GemKind = 'blue', spacing = 1.6): void {
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, az] = points[i]!;
      const [bx, bz] = points[i + 1]!;
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.floor(len / spacing));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        this.game.placeGem(kind, 1, x, this.y(x, z) + 0.5, z);
      }
    }
  }

  crystal(x: number, z: number, kind: GemKind | 'mixed', value: number, big = false, y?: number): void {
    const c = this.addProp(new GemCluster(this.game, x, y ?? this.y(x, z), z, kind, value, big));
    this.level.hittables.push(c);
  }

  checkpoint(id: string, x: number, z: number, yaw = 0): Wardstone {
    const w = this.addProp(new Wardstone(this.game, id, x, this.y(x, z), z, yaw));
    this.level.wardstones.set(id, w);
    this.level.interactables.push(w);
    return w;
  }

  collectible(id: string, kind: CollectKind, x: number, z: number, y?: number, relicId = ''): void {
    const fullId = `${this.level.def.id}:${id}`;
    this.level.secrets.push({ kind, id: fullId });
    if (this.game.save.found[fullId]) return;
    this.addProp(new Collectible(this.game, fullId, kind, x, y ?? this.y(x, z), z, relicId));
  }

  torch(x: number, z: number, group: string, lit = false, burnTime = 0, y?: number): Torch {
    const t = this.addProp(new Torch(this.game, x, y ?? this.y(x, z), z, group, lit, burnTime));
    this.level.hittables.push(t);
    this.level.addTorch(group, lit);
    return t;
  }

  torchGroup(group: string, signal: string): void {
    this.level.torchGroup(group, signal);
  }

  gate(x: number, z: number, w: number, h: number, yaw: number, kind: GateKind, signal = '', y?: number): Gate {
    const g = this.addProp(new Gate(this.game, x, y ?? this.y(x, z), z, w, h, yaw, kind, signal));
    this.level.hittables.push(g);
    return g;
  }

  switchCrystal(x: number, z: number, kind: Element | 'strike', signal: string, y?: number): Switch {
    const s = this.addProp(new Switch(this.game, x, y ?? this.y(x, z), z, kind, signal));
    this.level.hittables.push(s);
    return s;
  }

  plate(x: number, z: number, signal: string, y?: number): PressurePlate {
    return this.addProp(new PressurePlate(this.game, x, y ?? this.y(x, z), z, signal));
  }

  mover(pts: [number, number, number][], w: number, d: number, speed: number, color = 0x9a8f7a, spin = 0, signal = '', pause = 0.6): MovingPlatform {
    return this.addProp(new MovingPlatform(this.game, pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)), w, d, speed, color, spin, signal, pause));
  }

  /** A water jet that throws the dragon up; Ice turns it into a climbable pillar. */
  geyser(x: number, z: number, r: number, h: number, permanent = false, signal = '', y?: number): Geyser {
    const gz = this.addProp(new Geyser(this.game, x, y ?? this.y(x, z), z, r, h, permanent, signal));
    this.level.hittables.push(gz);
    return gz;
  }

  /**
   * A vine wall you can claw-climb. `yaw` is the direction the climbable face
   * looks toward; with `solid`, a rock slab is built behind the vines.
   */
  climbWall(x: number, z: number, yaw: number, w: number, y0: number, y1: number, solid = true): ClimbWall {
    const c = this.addProp(new ClimbWall(this.game, x, z, yaw, w, y0, y1, solid));
    this.level.climbWalls.push(c);
    return c;
  }

  /** Rings to glide through in order within `limit` seconds. Points are [x, y, z, yaw]. */
  glideRings(id: string, pts: [number, number, number, number][], limit: number, reward = 40): GlideCourse {
    return this.addProp(new GlideCourse(this.game, `${this.level.def.id}:rings:${id}`, pts, limit, reward));
  }

  // --- puzzles ------------------------------------------------------------------------

  /** A lightning conduit; it stays charged for `hold` seconds. */
  conduit(x: number, z: number, group: string, hold = 6, y?: number): Conduit {
    const c = this.addProp(new Conduit(this.game, x, y ?? this.y(x, z), z, group, hold));
    this.level.conduits.push(c);
    this.level.hittables.push(c);
    return c;
  }

  /** Fires `signal` once every conduit in `group` is charged at the same moment. */
  conduitGroup(group: string, signal: string): void {
    this.level.conduitGroup(group, signal);
  }

  /** Answers only to a bolt batted back into it. */
  reflectSwitch(x: number, z: number, signal: string, y?: number): ReflectSwitch {
    const r = this.addProp(new ReflectSwitch(this.game, x, y ?? this.y(x, z), z, signal));
    this.level.hittables.push(r);
    return r;
  }

  /** A Gloom eye that shoots bolts at the dragon; `until` puts it out, `facing` limits what it watches. */
  boltTurret(x: number, z: number, range = 18, interval = 2.6, y?: number, until = '', facing: number | null = null): BoltTurret {
    return this.addProp(new BoltTurret(this.game, x, y ?? this.y(x, z), z, range, interval, until, facing));
  }

  boulder(x: number, z: number, y?: number): Boulder {
    const b = this.addProp(new Boulder(this.game, x, (y ?? this.y(x, z)) + 0.1, z));
    this.level.hittables.push(b);
    return b;
  }

  /** Pressed only by something heavy: a boulder, a frozen enemy or a brute. Emits `signal` and `signal:off`. */
  weightPlate(x: number, z: number, signal: string, y?: number): WeightPlate {
    return this.addProp(new WeightPlate(this.game, x, y ?? this.y(x, z), z, signal));
  }

  /** A gate held open only while `signal` is on (it closes again on `signal:off`). */
  holdGate(x: number, z: number, w: number, h: number, yaw: number, signal: string, y?: number): Gate {
    const g = this.gate(x, z, w, h, yaw, 'stone', '', y);
    this.level.on(signal, () => g.open());
    this.level.on(`${signal}:off`, () => g.shut());
    return g;
  }

  /** Spots on the water that Ice freezes into floes for `life` seconds. */
  iceFloes(pts: [number, number][], life = 14): IceFloes {
    return this.addProp(new IceFloes(this.game, pts, this.level.waterLevel, life));
  }

  rope(x: number, z: number, len: number, signal: string, y?: number): Rope {
    const r = this.addProp(new Rope(this.game, x, y ?? this.y(x, z), z, len, signal));
    this.level.hittables.push(r);
    return r;
  }

  /** A bridge hinged at (x, y, z) that falls along `yaw` when `signal` fires. */
  drawbridge(x: number, y: number, z: number, yaw: number, len: number, w: number, signal: string): Drawbridge {
    return this.addProp(new Drawbridge(this.game, x, y, z, yaw, len, w, signal));
  }

  /** A door open only for the last `open` seconds of every `cycle`. */
  snapGate(x: number, z: number, w: number, h: number, yaw: number, open: number, cycle: number, phase = 0, y?: number): SnapGate {
    return this.addProp(new SnapGate(this.game, x, y ?? this.y(x, z), z, w, h, yaw, open, cycle, phase));
  }

  spinBlade(x: number, z: number, r: number, speed: number, arms = 2, y?: number): SpinBlade {
    return this.addProp(new SpinBlade(this.game, x, y ?? this.y(x, z), z, r, speed, arms));
  }

  /** Sockets struck with elements in `order`; `slots` places them along the slab out of order. */
  elementLock(x: number, z: number, yaw: number, order: Element[], signal: string, slots?: number[], y?: number): ElementLock {
    return this.addProp(new ElementLock(this.game, x, y ?? this.y(x, z), z, yaw, order, signal, slots));
  }

  /** Flick hints, stronger the longer the player lingers near an unsolved puzzle. */
  puzzleHint(x: number, z: number, r: number, hints: string[], solvedSignal: string, first = 30, step = 35): PuzzleHint {
    return this.addProp(new PuzzleHint(this.game, x, z, r, hints, solvedSignal, first, step));
  }

  crumble(x: number, top: number, z: number, w: number, d: number): CrumblePlatform {
    return this.addProp(new CrumblePlatform(this.game, x, top, z, w, d));
  }

  updraft(x: number, z: number, r: number, y0: number, y1: number, strength = 34): Updraft {
    const u = this.addProp(new Updraft(this.game, x, y0, z, r, y1, strength));
    this.level.updrafts.push(u);
    return u;
  }

  shroom(x: number, z: number, power = 18, color = 0xff5a9a, y?: number): BounceShroom {
    return this.addProp(new BounceShroom(this.game, x, y ?? this.y(x, z), z, power, color));
  }

  hazard(x: number, z: number, hx: number, hz: number, damage: number, kind: 'thorns' | 'shadow' | 'lava' | 'spikes', h = 1, y?: number): Hazard {
    const hz2 = this.addProp(new Hazard(this.game, x, y ?? this.y(x, z), z, hx, hz, h, damage, kind));
    this.level.hazards.push(hz2);
    return hz2;
  }

  trigger(x: number, z: number, r: number, fn: () => void, once = true, y?: number): Trigger {
    return this.addProp(new Trigger(this.game, x, y ?? this.y(x, z), z, r, fn, once));
  }

  /** A trigger that fires only once per save. */
  story(id: string, x: number, z: number, r: number, fn: () => void): void {
    const key = `story:${this.level.def.id}:${id}`;
    if (this.game.save.found[key]) return;
    this.trigger(x, z, r, () => {
      this.game.save.found[key] = true;
      fn();
    });
  }

  portal(x: number, z: number, yaw: number, target: string, label: string, color = 0xc9a2ff, action: (() => void) | null = null): Portal {
    const p = this.addProp(new Portal(this.game, x, this.y(x, z), z, yaw, target, label, color, action));
    this.level.interactables.push(p);
    return p;
  }

  npc(id: string, look: DragonLook, x: number, z: number, yaw: number, label: string, fn: () => void): Npc {
    const n = new Npc(this.game, id, look, x, this.y(x, z), z, yaw);
    this.level.npcs.push(n);
    this.col.add(makeCyl(x, z, 0.9 * look.scale, this.y(x, z), this.y(x, z) + 1.5 * look.scale));
    const t = new Talker(this.game, x, this.y(x, z), z, label, fn);
    this.level.interactables.push(t);
    return n;
  }

  /** Something glowing to look at; no light source, just emissive. */
  beacon(x: number, y: number, z: number, color: number, scale = 1): void {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5 * scale, 0), glow(color));
    m.position.set(x, y, z);
    this.level.root.add(m);
  }

  /** A lore letter from src/levels/letters/<realm>.ts, found at (x, z). */
  letter(id: string, x: number, z: number, y?: number): void {
    this.collectible(`letter-${id}`, 'letter', x, z, y, id);
  }

  /** A lost dragon egg. Each realm hides a fixed number (see SKINS in progress.ts). */
  egg(id: string, x: number, z: number, y?: number): void {
    this.collectible(`egg-${id}`, 'egg', x, z, y);
  }

  /**
   * An egg thief with a stolen egg, waiting near (x, z). It bolts when the
   * dragon comes close and circles within `leash` of home: give it open
   * ground to run on. Counts as one of the realm's eggs.
   */
  eggThief(id: string, x: number, z: number, leash = 24): void {
    const fullId = `${this.level.def.id}:egg-${id}`;
    this.level.secrets.push({ kind: 'egg', id: fullId });
    this.game.addEggThief(fullId, x, z, leash);
  }

  // --- breakables -------------------------------------------------------------------

  /**
   * A smashable crate, barrel, urn, basket, powder keg or Gloom pod. They
   * stack: one placed where another stands sits on top of it.
   */
  breakable(x: number, z: number, kind: BreakKind, o: { yaw?: number; scale?: number; y?: number; loot?: Partial<Record<GemKind, number>> } = {}): Breakable {
    const bk = new Breakable(this.game, kind, x, o.y ?? this.y(x, z), z, o.yaw ?? jit(x * 3.1 + z) * Math.PI, o.scale ?? 0.92 + (jit(x + z * 7) + 1) * 0.08, o.loot ?? null);
    this.breakableSet.add(bk);
    this.level.hittables.push(bk);
    return bk;
  }

  breakables(kind: BreakKind, pts: [number, number][], o: { scale?: number; y?: number } = {}): void {
    for (const [x, z] of pts) this.breakable(x, z, kind, o);
  }

  /** A loose cluster of n breakables around (x, z), kinds picked in turn. */
  pile(x: number, z: number, r: number, n: number, kinds: BreakKind[]): void {
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + jit(x + i) * 0.5;
      const d = r * Math.sqrt((i + 0.5) / n);
      this.breakable(x + Math.sin(a) * d, z + Math.cos(a) * d, kinds[i % kinds.length]!);
    }
  }

  /** A treasure chest that opens once per save. */
  chest(id: string, x: number, z: number, yaw: number, loot: Partial<Record<GemKind, number>>, y?: number): Chest {
    const c = this.addProp(new Chest(this.game, `${this.level.def.id}:chest:${id}`, x, y ?? this.y(x, z), z, yaw, loot));
    this.level.hittables.push(c);
    return c;
  }

  /**
   * Adds a mesh that never moves again. At the end of the build these are
   * merged by material in 24 m chunks: a walled courtyard becomes a few draws
   * instead of hundreds, while culling and the camera's see-through fade still
   * work chunk by chunk. Level code may use it for its own static scenery too.
   */
  addStatic(m: THREE.Mesh): THREE.Mesh {
    m.userData.static = true;
    this.level.root.add(m);
    return m;
  }

  private mergeStatics(): void {
    const root = this.level.root;
    const groups = new Map<string, THREE.Mesh[]>();
    for (const c of root.children) {
      const m = c as THREE.Mesh;
      if (!m.isMesh || !m.userData.static || Array.isArray(m.material) || (m as unknown as THREE.InstancedMesh).isInstancedMesh) continue;
      const key = `${(m.material as THREE.Material).uuid}|${Math.floor(m.position.x / 24)},${Math.floor(m.position.z / 24)}|${m.castShadow ? 1 : 0}`;
      const list = groups.get(key) ?? [];
      list.push(m);
      groups.set(key, list);
    }
    for (const list of groups.values()) {
      if (list.length < 2) {
        list[0]!.userData.cull = true;
        continue;
      }
      const geos: THREE.BufferGeometry[] = [];
      for (const m of list) {
        m.updateMatrix();
        let g = m.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
        if (g.index) g = g.toNonIndexed();
        g.applyMatrix4(m.matrix);
        geos.push(g);
      }
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      const out = new THREE.Mesh(merged, list[0]!.material);
      out.castShadow = list[0]!.castShadow;
      out.receiveShadow = list.some((m) => m.receiveShadow);
      // Sources are dropped, not disposed: a shared shape (GEO.*) may still draw elsewhere.
      for (const m of list) root.remove(m);
      out.userData.cull = true;
      root.add(out);
    }
  }

  finish(): void {
    this.decor.build(this.level.root);
    this.breakableSet.build(this.level.root);
    this.mergeStatics();
  }
}

/** Deterministic -1..1 noise for placement variety. */
function jit(v: number): number {
  const s = Math.sin(v * 12.9898 + 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}
