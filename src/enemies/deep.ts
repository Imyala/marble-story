import * as THREE from 'three';
import { Enemy, type AttackDef, type EnemyDef } from './enemy';
import type { Game } from '../game/game';
import type { Hit, HitResult, Hittable } from '../game/types';
import { makeHit } from '../game/types';
import type { Reaction } from '../combat/status';
import type { Level } from '../world/level';
import type { Prop } from '../entities/props';
import type { Projectile } from '../entities/projectile';
import { approachAngle, yawOf, lerp, smoothstep } from '../core/math';
import { rng } from '../core/rng';
import { mat } from '../render/materials';
import { bump } from '../game/feats';
import { spike } from '../render/shapes';
import { PuffcapModel, RootstalkerModel, ThornspitterModel, SPORE_GLOW, ROOT_VEIN, ROOT_HOT } from './models-deep';

/**
 * The Mycelium Deep's foes (Act II), and the spore hazards they share with
 * Mycora, the Spore Mother:
 *
 *   Sporeling     swarms; bursts into a stinging spore cloud when it dies, unless Fire (or a shatter) takes it
 *   Puffcap       lobs spore bombs, puffs a jumpable ring up close, grows new sporelings; its brood withers with it
 *   Rootstalker   burrows and erupts under the dragon (a ring warns first); Earth or a Ground Pound flips it out
 *   Thornspitter  a rooted turret; pulls itself underground when the dragon is close, weak as it re-emerges
 *
 *   SporeCloud / BlightPatch  lingering spores that sting (never lethal on their own); Fire burns them away
 *   GroundMark                a telegraph disc that fills as the blow it warns about arrives
 *
 * `ENEMY_CLASSES` tells Game.spawnEnemy which of these subclasses to build for an id.
 */

// ---------------------------------------------------------------------------
// Telegraphs
// ---------------------------------------------------------------------------

let markRingGeo: THREE.BufferGeometry | null = null;
let markDiscGeo: THREE.BufferGeometry | null = null;

/** Shared flat ring (inner 0.88, outer 1) and disc (radius 1) geometry, lying on the ground. */
function flatGeos(): { ring: THREE.BufferGeometry; disc: THREE.BufferGeometry } {
  if (!markRingGeo || !markDiscGeo) {
    markRingGeo = new THREE.RingGeometry(0.88, 1, 40, 1);
    markRingGeo.rotateX(-Math.PI / 2);
    markDiscGeo = new THREE.CircleGeometry(1, 32);
    markDiscGeo.rotateX(-Math.PI / 2);
  }
  return { ring: markRingGeo, disc: markDiscGeo };
}

/** A disc on the ground that fills in as the blow it warns about arrives. */
export class GroundMark {
  readonly root = new THREE.Group();
  private ringMat: THREE.MeshBasicMaterial;
  private fillMat: THREE.MeshBasicMaterial;
  private fill: THREE.Mesh;
  private ring: THREE.Mesh;
  private t = 0;
  private dur = 1;
  private r = 1;
  active = false;

  constructor(color = 0xff3a2a) {
    const geo = flatGeos();
    this.ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.fillMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(geo.ring, this.ringMat);
    this.fill = new THREE.Mesh(geo.disc, this.fillMat);
    this.ring.renderOrder = this.fill.renderOrder = 24;
    this.root.add(this.ring, this.fill);
    this.root.visible = false;
  }

  /** Shows the warning for `dur` seconds; with `fill` false, only the outer edge (for a wide sweep). */
  show(x: number, y: number, z: number, r: number, dur: number, color?: number, fill = true): void {
    this.active = true;
    this.t = 0;
    this.dur = Math.max(0.1, dur);
    this.r = r;
    if (color !== undefined) {
      this.ringMat.color.setHex(color);
      this.fillMat.color.setHex(color);
    }
    this.root.position.set(x, y + 0.07, z);
    this.ring.scale.setScalar(r);
    this.fill.scale.setScalar(0.01);
    this.fill.visible = fill;
    this.root.visible = true;
  }

  hide(): void {
    this.active = false;
    this.root.visible = false;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.t += dt;
    const k = Math.min(1, this.t / this.dur);
    this.fill.scale.setScalar(Math.max(0.01, this.r * k));
    this.ringMat.opacity = 0.55 + 0.4 * Math.abs(Math.sin(this.t * (8 + k * 10)));
    this.fillMat.opacity = 0.16 + k * 0.32;
    if (this.t >= this.dur + 0.12) this.hide();
  }

  dispose(): void {
    this.root.parent?.remove(this.root);
    this.ringMat.dispose();
    this.fillMat.dispose();
  }
}

// ---------------------------------------------------------------------------
// Spores
// ---------------------------------------------------------------------------

/** Once per save, Flick explains a new foe's trick the first time it matters. */
export function deepTip(g: Game, key: string, text: string, secs = 7): void {
  const k = `tip:deep:${key}`;
  if (g.save.found[k]) return;
  g.save.found[k] = true;
  g.hud.flick(text, secs);
}

/**
 * Spores in the lungs: a small, steady sting. Not a blow (no knockback, no
 * stagger, no lost style rank), and never the last straw: spores alone
 * leave Aster at 1 health at worst. A dodge's i-frames keep them out.
 */
export function sporeSting(g: Game, dmg: number): boolean {
  const p = g.player;
  if (!p.alive || p.invuln || p.power === 'invincible' || p.iframes > 0 || g.state !== 'play') return false;
  const d = Math.min(dmg * g.difficultyInfo.enemyDamage, p.hp - 1);
  if (d <= 0) return false;
  p.hp -= d;
  g.stats.damageTaken += d;
  g.hud.hurt((d / p.maxHp) * 0.5);
  g.sfx('cough', p.x, p.y, p.z, 0.9 + rng.next() * 0.2, 0.8);
  g.fx.emit(p.x + Math.sin(p.yaw) * 0.6, p.y + 1.0, p.z + Math.cos(p.yaw) * 0.6, {
    count: 5, speed: 1.4, dir: [0, 0.6, 0], spread: 0.8, life: [0.4, 0.7], size: [0.2, 0.35], sizeEnd: 0.9, color: 0xc8f070, alpha: 0.6, additive: false, drag: 2,
  });
  return true;
}

/** A spore thing burned away: flame, a little flash, and whatever stood in it gets singed. */
function sporeFlash(g: Game, x: number, y: number, z: number, r: number): void {
  g.fx.explosion(x, y + 0.6, z, r * 0.5, 0xffc050, 0x803010);
  g.fx.emit(x, y + 0.3, z, {
    count: 22, speed: 3, dir: [0, 1.4, 0], spread: 0.9, life: [0.35, 0.7], size: [0.35, 0.6], sizeEnd: 0.1, color: 0xffd060, colorEnd: 0xff3010, bright: 2, jitter: r * 0.6, gravity: -3,
  });
  g.fx.flash(x, y + 1, z, 0xffa040, 4, 10, 0.2);
  g.sfx('sporeFlash', x, y, z);
  for (const e of [...g.enemies]) {
    if (!e.alive || e.isBoss || Math.hypot(e.x - x, e.z - z) > r + e.radius + 0.5 || Math.abs(e.y - y) > 2.5) continue;
    const n = Math.hypot(e.x - x, e.z - z) || 1;
    e.takeHit(makeHit({ damage: 8, type: 'fire', buildup: 45, dirX: (e.x - x) / n, dirZ: (e.z - z) / n, knockback: 3, stagger: 20, source: 'reaction', move: 'sporeFlash', ox: x, oz: z }));
  }
  g.style.bonus(25);
  bump(g.save, 'sporesBurnt');
  g.checkFeats();
}

/**
 * A lingering cloud of spores on the ground, left by a sporeling that burst
 * or a spore bomb. Stings whoever breathes it in; Fire burns it off at once.
 * A Hittable (not an enemy): breath, bursts and explosions reach it.
 */
export class SporeCloud implements Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly height = 0.5;
  private t = 0;
  private tick = 0.25;
  private puffT = 0;
  private edge: THREE.Mesh;
  private edgeMat: THREE.MeshBasicMaterial;
  private fillMat: THREE.MeshBasicMaterial;
  private fillM: THREE.Mesh;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly radius: number, private life: number, private dmg = 1.5) {
    const geo = flatGeos();
    this.edgeMat = new THREE.MeshBasicMaterial({ color: 0xb8f048, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.fillMat = new THREE.MeshBasicMaterial({ color: 0x5a7a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.edge = new THREE.Mesh(geo.ring, this.edgeMat);
    this.fillM = new THREE.Mesh(geo.disc, this.fillMat);
    this.edge.scale.setScalar(radius);
    this.fillM.scale.setScalar(radius);
    this.edge.position.set(x, y + 0.06, z);
    this.fillM.position.set(x, y + 0.05, z);
    this.edge.renderOrder = this.fillM.renderOrder = 23;
    game.level?.root.add(this.edge, this.fillM);
    game.fx.emit(x, y + 0.5, z, {
      count: 18, speed: 2.4, dir: [0, 0.5, 0], spread: 1, life: [0.5, 0.9], size: [0.4, 0.7], sizeEnd: 1.6, color: 0xb8e060, alpha: 0.55, additive: false, drag: 3, jitter: radius * 0.3,
    });
    game.sfx('sporePuff', x, y, z, 0.9 + rng.next() * 0.2);
  }

  /** Fire burns it away; nothing else touches it. */
  takeHit(hit: Hit): HitResult {
    if (!this.alive || hit.type !== 'fire' || !hit.fromPlayer) return 'none';
    this.burn();
    return 'none';
  }

  burn(): void {
    if (!this.alive) return;
    sporeFlash(this.game, this.x, this.y, this.z, this.radius);
    this.kill();
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.edge.parent?.remove(this.edge);
    this.fillM.parent?.remove(this.fillM);
    this.edgeMat.dispose();
    this.fillMat.dispose();
  }

  update(dt: number): void {
    if (!this.alive) return;
    const g = this.game;
    this.t += dt;
    const fade = Math.min(1, this.t / 0.25) * Math.min(1, (this.life - this.t) / 0.6);
    this.edgeMat.opacity = Math.max(0, fade) * (0.5 + 0.2 * Math.sin(this.t * 7));
    this.fillMat.opacity = Math.max(0, fade) * 0.35;
    this.puffT -= dt;
    if (this.puffT <= 0) {
      this.puffT = 0.07;
      const a = rng.next() * Math.PI * 2;
      const rr = Math.sqrt(rng.next()) * this.radius * 0.9;
      g.fx.emit(this.x + Math.sin(a) * rr, this.y + 0.2 + rng.next() * 1.2, this.z + Math.cos(a) * rr, {
        count: 1, speed: 0.4, dir: [0, 1, 0], spread: 0.6, life: [0.7, 1.2], size: [0.5, 0.8], sizeEnd: 1.4, color: 0x9ac850, alpha: 0.4 * Math.max(0.2, fade), additive: false, drag: 1, gravity: -0.3,
      });
      if (rng.chance(0.5)) g.fx.emit(this.x + Math.sin(a + 2) * rr, this.y + 0.3 + rng.next() * 1.4, this.z + Math.cos(a + 2) * rr, {
        count: 1, speed: 0.3, dir: [0, 1, 0], spread: 1, life: [0.8, 1.3], size: [0.08, 0.14], sizeEnd: 0.3, color: SPORE_GLOW, bright: 2, gravity: -0.2,
      });
    }
    this.tick -= dt;
    const p = g.player;
    if (this.tick <= 0 && Math.hypot(p.x - this.x, p.z - this.z) < this.radius && p.y < this.y + 2.4 && p.y > this.y - 1) {
      this.tick = 0.5;
      sporeSting(g, this.dmg);
      deepTip(g, 'cloud', 'Achoo! Those spores sting! Don\'t stand in them... or burn them away with Fire!', 6);
    }
    if (this.t >= this.life) this.kill();
  }
}

/**
 * Blight: a creeping carpet of spores that grows from a seed to full size,
 * stings whoever stands in it, and lingers until Fire burns it away.
 */
export class BlightPatch implements Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly height = 0.4;
  radius = 0.4;
  private t = 0;
  private tick = 0.4;
  private heat = 0;
  private fxT = 0;
  private burnT = -1;
  private readonly group = new THREE.Group();
  private fillMat: THREE.MeshBasicMaterial;
  private edgeMat: THREE.MeshBasicMaterial;
  private stalks: THREE.Mesh[] = [];

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly maxR: number, private life: number, private grow = 1.8, private dmg = 2.5) {
    const geo = flatGeos();
    this.fillMat = new THREE.MeshBasicMaterial({ color: 0x3a5a14, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
    this.edgeMat = new THREE.MeshBasicMaterial({ color: 0xc8ff4a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const fill = new THREE.Mesh(geo.disc, this.fillMat);
    fill.position.y = 0.04;
    const edge = new THREE.Mesh(geo.ring, this.edgeMat);
    edge.position.y = 0.05;
    fill.renderOrder = 22;
    edge.renderOrder = 23;
    this.group.add(fill, edge);
    // Little glowing stalks sprouting across it.
    const stalkM = mat(0xd4ff5a, { emissive: 0xb8ff40, emissiveIntensity: 0.9, rough: 0.6 });
    for (let i = 0; i < 9; i++) {
      const s = spike(0.05, 0.3 + (i % 3) * 0.12, stalkM, 4);
      const a = i * 2.4;
      const r = 0.25 + (i / 9) * 0.65;
      s.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
      s.userData.r = r;
      s.castShadow = false;
      this.group.add(s);
      this.stalks.push(s);
    }
    this.group.position.set(x, y, z);
    this.group.scale.setScalar(0.4);
    game.level?.root.add(this.group);
  }

  get burning(): boolean {
    return this.burnT >= 0;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.burning || hit.type !== 'fire' || !hit.fromPlayer) return 'none';
    // A flick of fire breath takes a moment; a fireball takes it at once.
    this.heat += hit.source === 'breath' ? hit.damage : hit.damage * 3;
    this.game.fx.emit(this.x, this.y + 0.3, this.z, { count: 3, speed: 1.5, dir: [0, 1.5, 0], life: [0.3, 0.5], size: [0.3, 0.5], sizeEnd: 0.1, color: 0xffa040, bright: 1.8, jitter: this.radius * 0.6, gravity: -2 });
    if (this.heat >= 7) this.burn();
    return 'none';
  }

  burn(): void {
    if (!this.alive || this.burning) return;
    this.burnT = 0;
    sporeFlash(this.game, this.x, this.y, this.z, this.radius);
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.group.parent?.remove(this.group);
    this.fillMat.dispose();
    this.edgeMat.dispose();
  }

  update(dt: number): void {
    if (!this.alive) return;
    const g = this.game;
    this.t += dt;
    if (this.burning) {
      // Charred: shrivels, darkens and goes.
      this.burnT += dt;
      this.fillMat.color.setHex(0x1a1410);
      this.edgeMat.opacity = Math.max(0, 0.8 - this.burnT * 2);
      this.fillMat.opacity = Math.max(0, 0.8 - this.burnT * 0.5);
      for (const s of this.stalks) s.scale.y = Math.max(0.01, 1 - this.burnT * 2);
      if (rng.chance(0.4)) g.fx.emit(this.x + rng.signed() * this.radius * 0.7, this.y + 0.2, this.z + rng.signed() * this.radius * 0.7, {
        count: 1, speed: 1, dir: [0, 1, 0], life: [0.6, 1], size: [0.3, 0.5], sizeEnd: 1.2, color: 0x2a2420, alpha: 0.5, additive: false, gravity: -1,
      });
      if (this.burnT > 1.6) this.kill();
      return;
    }
    const k = smoothstep(0, this.grow, this.t);
    this.radius = lerp(0.4, this.maxR, k);
    const fade = Math.min(1, (this.life - this.t) / 1.2);
    this.group.scale.setScalar(this.radius);
    for (const s of this.stalks) s.scale.set(1 / this.radius, Math.max(0.05, fade) / this.radius * (0.8 + 0.2 * Math.sin(this.t * 3 + s.position.x * 9)), 1 / this.radius);
    this.edgeMat.opacity = Math.max(0, fade) * (0.55 + 0.25 * Math.sin(this.t * 5));
    this.fillMat.opacity = Math.max(0, fade) * 0.75;
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.1;
      const a = rng.next() * Math.PI * 2;
      const rr = Math.sqrt(rng.next()) * this.radius;
      g.fx.emit(this.x + Math.sin(a) * rr, this.y + 0.15, this.z + Math.cos(a) * rr, {
        count: 1, speed: 0.6, dir: [0, 1, 0], spread: 0.4, life: [0.8, 1.4], size: [0.08, 0.14], sizeEnd: 0.3, color: SPORE_GLOW, bright: 1.8, gravity: -0.4,
      });
    }
    this.tick -= dt;
    const p = g.player;
    if (this.tick <= 0 && Math.hypot(p.x - this.x, p.z - this.z) < this.radius * 0.92 && p.y < this.y + 1.2 && p.y > this.y - 1) {
      this.tick = 0.5;
      sporeSting(g, this.dmg);
      deepTip(g, 'blight', 'The floor\'s gone all blighty! Burn the patches away with Fire, or keep off them!', 6);
    }
    if (this.t >= this.life) this.kill();
  }
}

interface PendingBomb {
  proj: Projectile;
  r: number;
  life: number;
}

/**
 * Keeps a realm's spore clouds, blight patches and the spore bombs in flight
 * (one per level, made on first use): updates them, lets Fire reach them
 * (through the level's hittables), and clears them away.
 */
export class SporeField implements Prop {
  readonly clouds: SporeCloud[] = [];
  readonly patches: BlightPatch[] = [];
  private pending: PendingBomb[] = [];
  private marks: GroundMark[] = [];

  constructor(private game: Game, private level: Level) {}

  cloud(x: number, y: number, z: number, r = 1.9, life = 3.2, dmg = 1.5): SporeCloud {
    const c = new SporeCloud(this.game, x, y, z, r, life, dmg);
    this.clouds.push(c);
    this.level.hittables.push(c);
    return c;
  }

  patch(x: number, y: number, z: number, r = 3.2, life = 14, grow = 1.8, dmg = 2.5): BlightPatch {
    const p = new BlightPatch(this.game, x, y, z, r, life, grow, dmg);
    this.patches.push(p);
    this.level.hittables.push(p);
    return p;
  }

  /** A red disc warning where something lands in `dur` seconds. */
  mark(x: number, y: number, z: number, r: number, dur: number, color = 0xff3a2a): void {
    let m = this.marks.find((q) => !q.active);
    if (!m) {
      m = new GroundMark(color);
      this.marks.push(m);
      this.level.root.add(m.root);
    }
    m.show(x, y, z, r, dur, color);
  }

  /** A spore bomb in flight: when it bursts, a cloud stays where it landed. */
  track(proj: Projectile, r: number, life: number): void {
    this.pending.push({ proj, r, life });
  }

  /** Everything spore-born within r of (x, z) burns (or everything, with no r). */
  burnAll(): void {
    for (const c of this.clouds) c.kill();
    for (const p of this.patches) p.kill();
    for (const m of this.marks) m.hide();
    this.pending = [];
  }

  update(dt: number): void {
    const g = this.game;
    for (const m of this.marks) m.update(dt);
    for (const b of this.pending) {
      if (b.proj.alive) continue;
      const gy = g.col.groundAt(b.proj.x, b.proj.z, b.proj.y + 1, 0.2).y;
      if (gy > -1e3 && b.proj.y - gy < 3) this.cloud(b.proj.x, gy, b.proj.z, b.r, b.life);
    }
    if (this.pending.some((b) => !b.proj.alive)) this.pending = this.pending.filter((b) => b.proj.alive);
    for (const c of this.clouds) c.update(dt);
    for (const p of this.patches) p.update(dt);
    if (this.clouds.some((c) => !c.alive) || this.patches.some((p) => !p.alive)) {
      const drop = (h: Hittable) => {
        const i = this.level.hittables.indexOf(h);
        if (i >= 0) this.level.hittables.splice(i, 1);
      };
      for (const c of this.clouds) if (!c.alive) drop(c);
      for (const p of this.patches) if (!p.alive) drop(p);
      const keepC = this.clouds.filter((c) => c.alive);
      const keepP = this.patches.filter((p) => p.alive);
      this.clouds.length = 0;
      this.clouds.push(...keepC);
      this.patches.length = 0;
      this.patches.push(...keepP);
    }
  }
}

const fields = new WeakMap<Level, SporeField>();

/** The current level's spore field (made the first time something needs it). */
export function sporeField(g: Game): SporeField | null {
  const lv = g.level;
  if (!lv) return null;
  let f = fields.get(lv);
  if (!f) {
    f = new SporeField(g, lv);
    fields.set(lv, f);
    lv.props.push(f);
  }
  return f;
}

/**
 * Lobs a spore bomb from (ox, oy, oz) to land on (tx, tz) after T seconds.
 * A red disc marks the spot; the bomb bursts there (a jump or a dodge
 * clears it) and leaves a spore cloud. A Horn swing bats it back.
 */
export function lobSpore(g: Game, ox: number, oy: number, oz: number, tx: number, tz: number, T: number,
  o: { damage: number; blast: number; cloud: number; cloudLife: number; radius?: number }): Projectile | null {
  const f = sporeField(g);
  if (!f) return null;
  const gy = g.col.groundAt(tx, tz, Math.max(oy, g.player.y) + 4, 0.1).y;
  const ly = (gy > -1e3 ? gy : g.player.y) + 0.3;
  const grav = 20;
  const vx = (tx - ox) / T;
  const vz = (tz - oz) / T;
  const vy = (ly - oy + 0.5 * grav * T * T) / T;
  const sp = Math.hypot(vx, vy, vz) || 1;
  const proj = g.spawnProjectile({
    x: ox, y: oy, z: oz, dx: vx / sp, dy: vy / sp, dz: vz / sp, speed: sp, radius: o.radius ?? 0.45, damage: o.damage,
    type: 'physical', color: SPORE_GLOW, life: T + 2, gravity: grav, fromPlayer: false, explode: o.blast, knockback: 6, launch: 4,
  });
  f.mark(tx, ly - 0.3, tz, o.blast, T);
  f.track(proj, o.cloud, o.cloudLife);
  return proj;
}

// ---------------------------------------------------------------------------
// Shared bits for the foes
// ---------------------------------------------------------------------------

/** A foe grown by another (a puffcap's brood, Mycora's children): it withers when its parent dies. */
export interface Brood {
  /** Set when its parent falls: it goes quietly, leaving no cloud. */
  withered: boolean;
}

/** Withers every living foe in `list` (a parent has fallen). */
export function witherAll(list: Enemy[]): void {
  for (const e of list) {
    if (!e.alive) continue;
    (e as Enemy & Partial<Brood>).withered = true;
    e.game.fx.emit(e.x, e.y + 0.5, e.z, { count: 10, speed: 1.5, dir: [0, 1, 0], spread: 0.8, life: [0.6, 1.1], size: [0.3, 0.5], sizeEnd: 1.2, color: 0x8a9a6a, alpha: 0.6, additive: false });
    e.die(null);
  }
}

/** Grows a sporeling out of the ground at (x, z), already awake. */
export function sproutSporeling(g: Game, x: number, z: number, yaw: number, nearY: number): Enemy {
  const gy = g.col.groundAt(x, z, nearY + 3, 0.3).y;
  const y = gy > -1e3 && Math.abs(gy - nearY) < 3 ? gy : nearY;
  const e = g.spawnEnemy('sporeling', x, y + 0.05, z, yaw, true);
  e.aggro = true;
  g.fx.emit(x, y + 0.2, z, { count: 14, speed: 3, dir: [0, 1.4, 0], spread: 0.7, life: [0.4, 0.8], size: [0.12, 0.2], sizeEnd: 0, color: SPORE_GLOW, bright: 2 });
  g.fx.dust(x, y, z, 6, 0x5a4a60);
  return e;
}

/** Open ground near height y at (x, z): no wall, drop, deep water or hazard in the way. */
const reach = (g: Game, x: number, z: number, y: number, tol = 1.3): boolean => {
  // Up to 6 m above: anything standing there taller than a step is a wall to go round.
  const gy = g.col.groundAt(x, z, y + 6, 0.3).y;
  return gy > -1e3 && Math.abs(gy - y) <= tol && !g.isDeepWater(x, z, gy) && !g.inHazard(x, gy + 0.1, z);
};

// ---------------------------------------------------------------------------
// Sporeling
// ---------------------------------------------------------------------------

/** Hops about in swarms; bursts into a spore cloud when it dies, unless Fire or ice takes it. */
export class Sporeling extends Enemy implements Brood {
  withered = false;

  override die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    const g = this.game;
    const b = this.body;
    // How it died decides what it leaves behind.
    const burnt = hit?.type === 'fire' || this.status.burn > 0 || reaction === 'overload';
    const iced = this.status.frozen > 0 || reaction === 'shatter';
    super.die(hit, reaction);
    if (this.withered) return;
    if (burnt) {
      g.fx.emit(b.x, b.y + 0.6, b.z, { count: 16, speed: 2.5, dir: [0, 1.5, 0], spread: 0.8, life: [0.3, 0.6], size: [0.3, 0.5], sizeEnd: 0.1, color: 0xffc050, colorEnd: 0xff3010, bright: 2, gravity: -3 });
      g.sfx('fireBurst', b.x, b.y, b.z, 1.5, 0.5);
      deepTip(g, 'burnt', 'Ha! Burnt to a crisp, spores and all. Fire stops them bursting!', 5);
      return;
    }
    if (iced) {
      g.fx.shatter(b.x, b.y + 0.5, b.z, 0xdff8ff);
      return;
    }
    g.sfx('squelch', b.x, b.y, b.z, 0.9 + rng.next() * 0.3);
    sporeField(g)?.cloud(b.x, b.y, b.z, 1.9, 3.2);
    deepTip(g, 'sporeling', 'Eww, it burst into spores! Burn sporelings with Fire, or freeze them, and they can\'t!', 6);
  }
}

// ---------------------------------------------------------------------------
// Puffcap
// ---------------------------------------------------------------------------

const BROOD_MAX = 3;

/** Lobs spore bombs, puffs a choking ring up close, and grows sporelings while it lives. */
export class Puffcap extends Enemy {
  private brood: Enemy[] = [];
  private growIn = 5 + rng.next() * 3;
  private readonly pm: PuffcapModel;

  constructor(game: Game, def: EnemyDef, x: number, y: number, z: number, yaw = 0) {
    super(game, def, x, y, z, yaw);
    this.pm = this.model as PuffcapModel;
  }

  /** Sporelings it has grown that still live. */
  get broodAlive(): number {
    this.brood = this.brood.filter((e) => e.alive);
    return this.brood.length;
  }

  protected override pickAttack(d: number): AttackDef | null {
    const a = super.pickAttack(d);
    if (a?.id === 'grow' && (this.growIn > 0 || this.broodAlive >= BROOD_MAX)) {
      // Not time to grow yet: pick again from the rest.
      this.cooldowns.set('grow', 0.5);
      return super.pickAttack(d);
    }
    return a;
  }

  override update(dt: number): void {
    if (this.alive && this.aggro) this.growIn -= dt;
    super.update(dt);
    const growing = this.state === 'windup' && this.attack?.id === 'grow' ? Math.min(1, this.stateT / this.attack.windup) : 0;
    this.pm.growing = growing > 0 ? growing : Math.max(0, this.pm.growing - dt * 3);
    if (growing > 0 && rng.chance(0.5)) {
      const b = this.body;
      const a = rng.next() * Math.PI * 2;
      this.game.fx.emit(b.x + Math.sin(a) * 2.2, b.y + 0.2, b.z + Math.cos(a) * 2.2, {
        count: 1, speed: 2.2, dir: [-Math.sin(a), 0.4, -Math.cos(a)], spread: 0.1, life: [0.6, 0.8], size: [0.1, 0.16], sizeEnd: 0, color: SPORE_GLOW, bright: 2,
      });
    }
  }

  protected override onActiveStart(a: AttackDef): void {
    const g = this.game;
    const b = this.body;
    const p = g.player.body;
    if (a.id === 'lob') {
      const tx = p.x + p.vx * 0.45;
      const tz = p.z + p.vz * 0.45;
      lobSpore(g, b.x, b.y + 2.7, b.z, tx, tz, 1.15, { damage: a.damage * this.eliteDmg, blast: 2.4, cloud: 1.7, cloudLife: 3 });
      g.sfx('sporePuff', b.x, b.y, b.z, 0.7);
      g.fx.emit(b.x, b.y + 2.7, b.z, { count: 10, speed: 2, dir: [0, 1, 0], spread: 0.6, life: [0.4, 0.8], size: [0.3, 0.5], sizeEnd: 1.2, color: 0xb8e060, alpha: 0.5, additive: false });
      return;
    }
    if (a.id === 'puff') {
      const r = a.shockwave?.radius ?? 5;
      g.spawnShockwave(b.x, b.y, b.z, r, a.shockwave?.speed ?? 8, a.damage * g.difficultyInfo.enemyDamage * this.eliteDmg, a.knockback, this);
      // A ring of spores racing out along the shockwave.
      for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * Math.PI * 2;
        g.fx.emit(b.x + Math.sin(ang) * 0.8, b.y + 0.35, b.z + Math.cos(ang) * 0.8, {
          count: 1, speed: a.shockwave?.speed ?? 8, dir: [Math.sin(ang), 0.05, Math.cos(ang)], spread: 0.04, life: [r / 8.5, r / 8], size: [0.5, 0.7], sizeEnd: 1.3, color: 0xa8d850, alpha: 0.55, additive: false,
        });
      }
      g.fx.emit(b.x, b.y + 2.8, b.z, { count: 16, speed: 4, dir: [0, 1.2, 0], spread: 0.5, life: [0.5, 0.9], size: [0.4, 0.7], sizeEnd: 1.6, color: 0xc8f070, alpha: 0.5, additive: false, drag: 1.5 });
      g.sfx('sporePuff', b.x, b.y, b.z, 0.55, 1.2);
      g.shake(0.15, 0.2);
      this.meleeCheck(a);
      return;
    }
    if (a.id === 'grow') {
      const n = Math.min(2, BROOD_MAX - this.broodAlive);
      for (let i = 0; i < n; i++) {
        const ang = this.yaw + (i === 0 ? 0.9 : -0.9) + rng.signed() * 0.3;
        let x = b.x + Math.sin(ang) * 2.2;
        let z = b.z + Math.cos(ang) * 2.2;
        if (!reach(g, x, z, b.y)) {
          x = b.x + Math.sin(ang + Math.PI) * 2.2;
          z = b.z + Math.cos(ang + Math.PI) * 2.2;
        }
        this.brood.push(sproutSporeling(g, x, z, ang, b.y));
      }
      this.growIn = 8 + rng.next() * 3;
      g.sfx('sporePuff', b.x, b.y, b.z, 1.3, 0.8);
      if (n > 0) deepTip(g, 'puffcap', 'That puffcap is growing more sporelings! Take it down first and its brood withers away!', 7);
      return;
    }
    super.onActiveStart(a);
  }

  override takeHit(hit: Hit): HitResult {
    // Lightning makes it seize up: it drops whatever it was winding up.
    const winding = this.state === 'windup' && this.attack !== null;
    const r = super.takeHit(hit);
    if (hit.type === 'lightning' && winding && r === 'hit' && this.state === 'windup') {
      this.attack = null;
      this.releaseToken();
      this.setState('hitstun');
      this.hitstunMax = 0.9;
      this.game.fx.arc(new THREE.Vector3(this.x, this.y + 1.8, this.z), new THREE.Vector3(this.x + rng.signed(), this.y + 0.5, this.z + rng.signed()), 0xcff0ff, 0.1, 0.2, 0.5);
      this.game.sfx('zap', this.x, this.y, this.z, 0.8);
    }
    return r;
  }

  override die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    super.die(hit, reaction);
    const b = this.body;
    const g = this.game;
    if (this.broodAlive > 0) {
      witherAll(this.brood);
      g.toast('Its brood withers away!', 'good');
    }
    g.fx.emit(b.x, b.y + 1.5, b.z, { count: 26, speed: 3, dir: [0, 1, 0], spread: 1, life: [0.6, 1.1], size: [0.5, 0.9], sizeEnd: 2, color: 0xb0d060, alpha: 0.5, additive: false, drag: 2 });
    g.sfx('sporePuff', b.x, b.y, b.z, 0.5, 1.1);
  }
}

// ---------------------------------------------------------------------------
// Rootstalker
// ---------------------------------------------------------------------------

type StalkMode = 'stalk' | 'dive' | 'tunnel' | 'mark' | 'erupt' | 'panic';

const RAKE: AttackDef = {
  id: 'rake', pose: 'rake', range: 2.6, windup: 0.6, active: 0.22, recover: 0.6, cooldown: 1.4, weight: 1, kind: 'melee', damage: 11, knockback: 6, hitRange: 1.5, hitArc: 1.0, lunge: 6,
};

/** Every level gets one slam listener that forwards Ground Pounds to its burrowed Rootstalkers. */
const slamWired = new WeakSet<Level>();

/**
 * A thorny root beast that burrows: it dives, a ripple of broken earth runs
 * at the dragon, a ring glows where it will come up, and it erupts. On the
 * surface its thorny back turns light blows; Earth or a Ground Pound on its
 * trail flips it onto its soft belly, and Fire drives it up in a panic.
 */
export class Rootstalker extends Enemy {
  mode: StalkMode = 'stalk';
  private modeT = 0;
  private burrowCd = 2 + rng.next() * 2;
  private trailYaw = 0;
  private markX = 0;
  private markZ = 0;
  private markDur = 0.8;
  private stuckT = 0;
  private fxT = 0;
  private rumbleT = 0;
  private struck = false;
  private idleT = 0;
  private holdT = 0;
  private readonly rm: RootstalkerModel;
  private readonly world = new THREE.Group();
  private readonly mound = new THREE.Group();
  private readonly mark = new GroundMark(0xff3a5a);
  private readonly trail: { m: THREE.Mesh; t: number }[] = [];
  private readonly moundGlow: THREE.MeshBasicMaterial;
  private trailI = 0;
  private lastTrail = new THREE.Vector2();
  /** Where the ripple has been lately, for Ground Pounds "on its trail". */
  private readonly path: THREE.Vector2[] = [];
  /** Times it has been forced up (tests read this). */
  pops = 0;

  constructor(game: Game, def: EnemyDef, x: number, y: number, z: number, yaw = 0) {
    super(game, def, x, y, z, yaw);
    this.scripted = true;
    this.rm = this.model as RootstalkerModel;
    // The travelling hump of earth, with thorns poking through.
    const dirt = mat(0x2a2030, { rough: 1, flat: true });
    const thorn = mat(0x3a2a44, { rough: 0.8 });
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), dirt);
    hump.scale.set(1, 0.4, 1.3);
    this.mound.add(hump);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + (i % 2) * 0.1, 0), dirt);
      c.position.set(Math.sin(a) * 0.95, 0.05, Math.cos(a) * 1.1);
      this.mound.add(c);
      const th = spike(0.06, 0.45, thorn, 4);
      th.position.set(Math.sin(a) * 0.35, 0.2, Math.cos(a) * 0.45);
      th.rotation.set(Math.cos(a) * 0.5 - 0.3, 0, -Math.sin(a) * 0.5);
      this.mound.add(th);
    }
    const vein = new THREE.MeshBasicMaterial({ color: ROOT_VEIN });
    for (const sx of [-1, 0, 1]) {
      const v = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), vein);
      v.scale.set(0.07, 0.07, 0.6);
      v.position.set(sx * 0.3, 0.33 + (sx ? 0 : 0.04), 0);
      this.mound.add(v);
    }
    // A glow in the earth round it, so the ripple reads on a dark floor.
    this.moundGlow = new THREE.MeshBasicMaterial({ color: 0xb050ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(1.6, 20), this.moundGlow);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.14;
    halo.renderOrder = 22;
    this.mound.add(halo);
    this.mound.visible = false;
    this.world.add(this.mound, this.mark.root);
    // Broken earth left along the trail, still glowing faintly where the root went through.
    const clod = new THREE.DodecahedronGeometry(0.28, 0);
    const clodM = mat(0x3a2a48, { rough: 1, flat: true, emissive: 0x6a2aa0, emissiveIntensity: 0.55 });
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(clod, clodM);
      m.visible = false;
      this.world.add(m);
      this.trail.push({ m, t: 99 });
    }
    game.scene.add(this.world);
    const lv = game.level;
    if (lv && !slamWired.has(lv)) {
      slamWired.add(lv);
      lv.onSlam((sx, sy, sz) => {
        for (const e of game.enemies) if (e instanceof Rootstalker) e.onGroundPound(sx, sy, sz);
      });
    }
  }

  /** Under the ground (the model hidden, a ripple showing where it is). */
  get underground(): boolean {
    return this.alive && (this.mode === 'tunnel' || this.mode === 'mark');
  }

  override get radius(): number {
    return this.underground ? 0.05 : this.def.radius;
  }

  override get height(): number {
    return this.underground ? 0.6 : this.def.height;
  }

  private setMode(m: StalkMode): void {
    this.mode = m;
    this.modeT = 0;
  }

  // --- hits -------------------------------------------------------------------------

  override takeHit(hit: Hit): HitResult {
    if (!this.alive || this.state === 'spawn') return 'none';
    const g = this.game;
    const b = this.body;
    // Belly up it stays belly up: blows land in full (and then some) but do not knock it over again.
    const pinned = (h: Hit): Hit => ({ ...h, damage: h.damage * 1.35, stagger: 0, knockback: 0, launch: 0 });
    if (this.mode === 'dive' || this.underground) {
      if (hit.type === 'earth' || hit.move === 'slam') {
        this.popUp(true);
        return super.takeHit(pinned(hit));
      }
      if (hit.type === 'fire' && hit.fromPlayer) {
        this.popUp(false);
        return super.takeHit(hit);
      }
      if (this.underground) {
        // Too deep for claws and horns: a spray of dirt, and a hint.
        g.fx.dust(b.x, b.y, b.z, 5, 0x4a3a50);
        if (hit.fromPlayer && hit.source !== 'enemy') deepTip(g, 'dig', 'It\'s under the ground! Ground Pound on its trail (jump, then Tail) or hit it with Earth to flip it out!', 7);
        return 'immune';
      }
    }
    if (this.flipped <= 0 && this.state !== 'down') {
      if (hit.type === 'earth' || (hit.move === 'slam' && hit.heavy)) {
        this.flipOver();
        return super.takeHit(pinned(hit));
      }
      // The thorny back: light blows glance off (a quarter gets through).
      if (!hit.heavy && hit.type !== 'fire' && hit.type !== 'lightning' && hit.source !== 'reaction') {
        g.fx.hit(b.x, b.y + 1, b.z, 0xd8b8ff, 0.5);
        g.sfx('shieldBlock', b.x, b.y, b.z, 0.7, 0.6);
        if (hit.fromPlayer && hit.source === 'melee' && !hit.move.startsWith('nyxa:')) {
          deepTip(g, 'thorns', 'Its thorny back shrugs off light hits! Heavy Tail blows get through, and Earth flips it onto its soft belly!', 7);
        }
        return super.takeHit({ ...hit, damage: hit.damage * 0.3, stagger: hit.stagger * 0.4, knockback: hit.knockback * 0.5, launch: 0 });
      }
    }
    // Belly up, the soft glowing heart takes double.
    if (this.flipped > 0) return super.takeHit(pinned(hit));
    return super.takeHit(hit);
  }

  /** Earth or a pound: over it goes, belly up, for a few seconds. */
  private flipOver(): void {
    const g = this.game;
    this.attack = null;
    this.releaseToken();
    this.flipped = 4.5;
    this.state = 'down';
    this.stateT = 0;
    this.body.vy = 7;
    this.pops++;
    g.sfx('hitHeavy', this.x, this.y, this.z, 0.7);
    g.toast('Flipped!', 'good');
    this.game.fx.rocks(this.x, this.y + 0.3, this.z, 10, 0x4a3a50);
  }

  /** Forced up from under the ground: flipped by Earth or a pound, or fleeing Fire. */
  private popUp(flip: boolean): void {
    const g = this.game;
    const b = this.body;
    this.mark.hide();
    this.mound.visible = false;
    this.rm.burrow = 0;
    this.rm.rear = 0;
    this.model.root.visible = true;
    this.setMode('stalk');
    this.burrowCd = 4 + rng.next() * 2;
    g.fx.rocks(b.x, b.y + 0.3, b.z, 18, 0x4a3a50);
    g.fx.dust(b.x, b.y, b.z, 16, 0x5a4a60);
    g.shake(0.3, 0.25);
    g.sfx('erupt', b.x, b.y, b.z, 1.2, 0.8);
    if (flip) {
      this.flipOver();
      g.toast('Shaken out of the ground!', 'good');
    } else {
      this.pops++;
      this.releaseToken();
      this.attack = null;
      this.setMode('panic');
      this.state = 'chase';
      this.body.vy = 5;
      g.toast('It bolts out of the ground!', 'good');
    }
  }

  /** A Ground Pound landed at (x, y, z): on (or right beside) the trail, it shakes this one loose. */
  onGroundPound(x: number, y: number, z: number): void {
    if (!this.underground || Math.abs(y - this.body.y) > 2.5) return;
    const near = Math.hypot(x - this.x, z - this.z) < 4 || this.path.some((q) => Math.hypot(q.x - x, q.y - z) < 2.2);
    if (near) this.popUp(true);
  }

  // --- the brain --------------------------------------------------------------------

  protected override think(dt: number): void {
    const g = this.game;
    const p = g.player;
    const b = this.body;
    // On its back it can only kick (until it rights itself).
    if (this.flipped > 0.2) {
      this.state = 'down';
      return;
    }
    this.modeT += dt;
    const d = this.distToPlayer();
    const toP = this.yawToPlayer();
    if (!this.aggro) {
      if (this.underground) this.popQuietly();
      if (p.alive && !p.hidden && d < this.def.aggroRange && Math.abs(p.body.y - b.y) < 6) {
        this.aggro = true;
        this.alertAllies();
        g.noticeEnemy(this);
        g.sfx('enemyAlert', b.x, b.y, b.z, 0.7);
        g.fx.emit(b.x, b.y + this.def.height + 0.4, b.z, { count: 6, speed: 2, life: [0.3, 0.5], size: [0.2, 0.3], color: 0xff5050, bright: 2 });
      } else {
        this.idle(dt);
        return;
      }
    }
    if (!p.alive || p.hidden) {
      if (this.underground) this.popQuietly();
      this.idle(dt);
      return;
    }
    switch (this.mode) {
      case 'stalk': this.stalk(dt, d, toP); break;
      case 'panic': this.panic(dt, toP); break;
      case 'dive': this.doDive(dt); break;
      case 'tunnel': this.tunnel(dt); break;
      case 'mark': this.doMark(dt); break;
      case 'erupt': this.erupt(); break;
    }
  }

  private idle(dt: number): void {
    this.idleT += dt;
    this.state = 'idle';
    this.yaw += Math.sin(this.idleT * 0.7 + this.homeX) * dt * 0.6;
    this.moveDir(this.yaw, Math.max(0, Math.sin(this.idleT * 0.5)) * 1.2, dt, false);
  }

  /** Lost the dragon while underground: come back up where it is. */
  private popQuietly(): void {
    this.mark.hide();
    this.mound.visible = false;
    this.rm.burrow = 0;
    this.model.root.visible = true;
    this.releaseToken();
    this.setMode('stalk');
  }

  private stalk(dt: number, d: number, toP: number): void {
    const g = this.game;
    if (this.state === 'windup' || this.state === 'active' || this.state === 'recover') {
      if (this.attack) {
        this.runAttack(dt, d, toP);
        return;
      }
      this.state = 'chase';
    }
    // Burning: no digging, just running.
    if (this.status.burn > 0) {
      this.setMode('panic');
      return;
    }
    this.burrowCd -= dt;
    if (!this.hasToken && this.globalCd <= 0) {
      this.hasToken = g.director.request(this, false);
      this.holdT = 0;
    }
    if (this.hasToken && (this.holdT += dt) > 4) {
      // Could not get at the dragon: let another have a turn.
      this.releaseToken();
      this.globalCd = 1;
    }
    if (this.hasToken) {
      if (this.burrowCd <= 0 && d > 3.2) {
        this.startDive();
        return;
      }
      if (d < RAKE.range && (this.cooldowns.get(RAKE.id) ?? 0) <= 0) {
        this.startAttack(RAKE);
        return;
      }
      this.moveDir(toP, this.def.speed, dt);
      this.state = 'chase';
      return;
    }
    // Waiting its turn: circle at a distance, dig in now and then anyway.
    if (this.burrowCd <= -3 && d > 4 && g.director.request(this, false)) {
      this.hasToken = true;
      this.startDive();
      return;
    }
    const ring = 5;
    const side = toP + Math.PI + this.strafeDir * 1.1;
    const sx = g.player.x + Math.sin(side) * ring;
    const sz = g.player.z + Math.cos(side) * ring;
    this.moveDir(yawOf(sx - this.x, sz - this.z), this.def.speed * 0.6, dt, false);
    this.yaw = approachAngle(this.yaw, toP, this.def.turnRate * dt);
    this.state = 'strafe';
  }

  private panic(dt: number, toP: number): void {
    const g = this.game;
    this.moveDir(toP + Math.PI + Math.sin(g.time * 3) * 0.7, this.def.speed * 1.25, dt);
    this.state = 'chase';
    if (this.modeT > 1.8 && this.status.burn <= 0) {
      this.setMode('stalk');
      this.burrowCd = 1.5;
    }
  }

  private startDive(): void {
    const g = this.game;
    const b = this.body;
    this.setMode('dive');
    this.attack = null;
    this.state = 'recover';
    g.sfx('burrow', b.x, b.y, b.z);
    g.fx.dust(b.x, b.y, b.z, 12, 0x5a4a60);
    g.fx.rocks(b.x, b.y + 0.2, b.z, 8, 0x4a3a50);
  }

  private doDive(dt: number): void {
    const g = this.game;
    const b = this.body;
    const T = 0.55;
    this.rm.burrow = Math.min(1, this.modeT / T);
    b.vx *= 0.8;
    b.vz *= 0.8;
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.06;
      g.fx.dust(b.x + rng.signed() * 0.6, b.y, b.z + rng.signed() * 0.6, 3, 0x5a4a60);
    }
    if (this.modeT >= T) {
      this.setMode('tunnel');
      this.trailYaw = this.yawToPlayer();
      this.model.root.visible = false;
      this.mound.visible = true;
      this.path.length = 0;
      this.stuckT = 0;
      this.lastTrail.set(b.x, b.z);
      deepTip(g, 'burrow', 'It dug in! Keep moving, and jump clear when the ring lights up under you!', 6);
    }
  }

  private tunnel(dt: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player.body;
    this.state = 'chase';
    const speed = 7.2 * Math.sqrt(g.difficultyInfo.aggression);
    this.trailYaw = approachAngle(this.trailYaw, yawOf(p.x - b.x, p.z - b.z), 3.4 * dt);
    const nx = b.x + Math.sin(this.trailYaw) * speed * dt;
    const nz = b.z + Math.cos(this.trailYaw) * speed * dt;
    if (reach(g, nx, nz, b.y)) {
      b.x = nx;
      b.z = nz;
      const gy = g.col.groundAt(nx, nz, b.y + 1.5, 0.3).y;
      if (gy > -1e3) b.y = gy;
    } else this.stuckT += dt;
    b.vx = b.vz = 0;
    b.vy = 0;
    this.yaw = this.trailYaw;
    this.trailFx(dt);
    const d = Math.hypot(p.x - b.x, p.z - b.z);
    if (d < 1.2 || this.modeT > 2.8 || this.stuckT > 0.6) {
      // The last stretch: it lunges under wherever the dragon stands (if it can get there).
      const [mx, mz] = d < 5 && reach(g, p.x, p.z, b.y, 1.6) ? [p.x, p.z] : [b.x, b.z];
      this.startMark(mx, mz);
    }
  }

  private trailFx(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.mound.position.set(b.x, b.y + Math.sin(g.time * 18) * 0.06, b.z);
    this.mound.rotation.y = this.trailYaw;
    this.moundGlow.opacity = 0.45 + 0.25 * Math.sin(g.time * 9);
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.05;
      g.fx.dust(b.x + rng.signed() * 0.7, b.y, b.z + rng.signed() * 0.7, 2, 0x5a4a60);
      if (rng.chance(0.3)) g.fx.rocks(b.x, b.y + 0.2, b.z, 2, 0x3a2e40);
      if (rng.chance(0.25)) g.fx.emit(b.x, b.y + 0.3, b.z, { count: 1, speed: 1, dir: [0, 1, 0], life: [0.3, 0.5], size: [0.12, 0.18], sizeEnd: 0, color: ROOT_VEIN, bright: 2 });
    }
    if (Math.hypot(b.x - this.lastTrail.x, b.z - this.lastTrail.y) > 0.6) {
      this.lastTrail.set(b.x, b.z);
      const t = this.trail[this.trailI++ % this.trail.length]!;
      t.t = 0;
      t.m.visible = true;
      t.m.position.set(b.x + rng.signed() * 0.35, b.y + 0.05, b.z + rng.signed() * 0.35);
      t.m.rotation.set(rng.next() * 3, rng.next() * 3, 0);
      this.path.push(new THREE.Vector2(b.x, b.z));
      if (this.path.length > 12) this.path.shift();
    }
    this.rumbleT -= dt;
    if (this.rumbleT <= 0) {
      this.rumbleT = 0.4;
      g.sfx('burrow', b.x, b.y, b.z, 0.8 + rng.next() * 0.2, 0.6);
      if (this.distToPlayer() < 7) g.shake(0.08, 0.2);
    }
  }

  private startMark(x: number, z: number): void {
    const g = this.game;
    const b = this.body;
    const gy = g.col.groundAt(x, z, b.y + 1.6, 0.3).y;
    this.setMode('mark');
    this.markX = b.x = x;
    this.markZ = b.z = z;
    if (gy > -1e3) b.y = gy;
    this.markDur = Math.max(0.55, 0.85 / g.difficultyInfo.aggression);
    this.mark.show(x, b.y, z, 1.9, this.markDur);
    this.state = 'windup';
    g.hud.threat(this);
    g.sfx('rumble', x, b.y, z, 0.9, 0.9);
    g.sfx('cue', x, b.y, z, 0.8, 0.6);
  }

  private doMark(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.state = 'windup';
    this.mound.position.set(b.x, b.y + Math.sin(g.time * 30) * 0.1, b.z);
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.05;
      const a = rng.next() * Math.PI * 2;
      const r = rng.next() * 1.7;
      g.fx.emit(this.markX + Math.sin(a) * r, b.y + 0.1, this.markZ + Math.cos(a) * r, { count: 1, speed: 3, dir: [0, 1, 0], spread: 0.3, life: [0.2, 0.4], size: [0.1, 0.18], sizeEnd: 0, color: ROOT_HOT, bright: 2 });
      g.fx.dust(this.markX + Math.sin(a) * r, b.y, this.markZ + Math.cos(a) * r, 1, 0x5a4a60);
    }
    if (this.modeT >= this.markDur) {
      this.setMode('erupt');
      this.struck = false;
    }
  }

  private erupt(): void {
    const g = this.game;
    const b = this.body;
    if (!this.struck) {
      this.struck = true;
      this.mound.visible = false;
      this.model.root.visible = true;
      this.rm.burrow = 0;
      this.rm.rear = 1;
      this.state = 'active';
      this.yaw = this.yawToPlayer();
      g.fx.rocks(b.x, b.y + 0.3, b.z, 22, 0x4a3a50);
      g.fx.dust(b.x, b.y, b.z, 22, 0x5a4a60);
      g.fx.emit(b.x, b.y + 0.8, b.z, { count: 18, speed: 7, dir: [0, 1, 0], spread: 0.7, life: [0.25, 0.45], size: [0.12, 0.2], sizeEnd: 0, color: ROOT_HOT, bright: 2.2 });
      g.fx.ring(b.x, b.y, b.z, 0.4, 3, 0xff6aa0, 0.35);
      g.shake(0.35, 0.3);
      g.sfx('erupt', b.x, b.y, b.z);
      const pl = g.player;
      const pb = pl.body;
      const dd = Math.hypot(pb.x - b.x, pb.z - b.z);
      if (pl.alive && dd < 1.9 + pb.radius && pb.y < b.y + 2.2) {
        const n = dd || 1;
        pl.takeHit(makeHit({
          damage: 12 * g.difficultyInfo.enemyDamage * this.eliteDmg, dirX: dd > 0.05 ? (pb.x - b.x) / n : Math.sin(this.yaw), dirZ: dd > 0.05 ? (pb.z - b.z) / n : Math.cos(this.yaw),
          knockback: 6, launch: 10, source: 'enemy', move: 'erupt', fromPlayer: false, ox: b.x, oz: b.z,
        }), this);
      }
    }
    this.rm.rear = Math.max(0, 1 - this.modeT / 0.7);
    if (this.modeT > 0.3) this.state = 'recover';
    if (this.modeT >= 1.1) {
      this.releaseToken();
      this.globalCd = 0.6 + rng.next() * 0.6;
      this.burrowCd = 3.5 + rng.next() * 2.5;
      this.setMode('stalk');
      this.state = 'chase';
    }
  }

  override update(dt: number): void {
    super.update(dt);
    for (const t of this.trail) {
      if (t.t > 90) continue;
      t.t += dt;
      const k = t.t < 2.2 ? 1 : Math.max(0, 1 - (t.t - 2.2) / 0.8);
      t.m.scale.set(k, k * 0.5, k);
      if (k <= 0) {
        t.m.visible = false;
        t.t = 99;
      }
    }
    this.mark.update(dt);
    // A surfaced model is hidden only by being under the ground.
    if (this.underground) this.model.root.visible = false;
    if (!this.alive) {
      this.mound.visible = false;
      this.mark.hide();
    }
  }

  override die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    if (this.underground) this.popQuietly();
    super.die(hit, reaction);
  }

  override dispose(): void {
    super.dispose();
    this.game.scene.remove(this.world);
    this.mark.dispose();
    this.moundGlow.dispose();
  }
}

// ---------------------------------------------------------------------------
// Thornspitter
// ---------------------------------------------------------------------------

type SpitMode = 'up' | 'sink' | 'hidden' | 'rise' | 'dazed';

let thornGeo: THREE.BufferGeometry | null = null;
let thornMat: THREE.MeshBasicMaterial | null = null;

/**
 * A rooted turret of thorny vine: fans of thorns and aimed bursts, each with
 * a clear wind-up. Come close and it pulls itself down into its mound
 * (untouchable) and comes back up with a ring of thorns, then hangs dazed:
 * that is the moment. A thorn batted back with the Horn dazes it too, and
 * burning vines can't pull themselves in.
 */
export class Thornspitter extends Enemy {
  mode: SpitMode = 'up';
  private modeT = 0;
  private retractCd = 0;
  private hideFor = 1.5;
  private shots = 0;
  private struck = false;
  private readonly tm: ThornspitterModel;
  private readonly mark = new GroundMark(0xff3a5a);
  /** Times it has pulled itself in (tests read this). */
  retracts = 0;

  constructor(game: Game, def: EnemyDef, x: number, y: number, z: number, yaw = 0) {
    super(game, def, x, y, z, yaw);
    this.scripted = true;
    this.tm = this.model as ThornspitterModel;
    // The mound stays in the world while the rest of it hides inside.
    this.tm.mound.position.set(x, y, z);
    game.scene.add(this.mark.root, this.tm.mound);
    if (!thornGeo) {
      thornGeo = new THREE.ConeGeometry(0.42, 3.4, 5);
      thornGeo.rotateX(Math.PI / 2);
      thornMat = new THREE.MeshBasicMaterial({ color: 0xffd6ec });
    }
  }

  get retracted(): boolean {
    return this.mode === 'sink' || this.mode === 'hidden';
  }

  override get height(): number {
    return this.retracted ? 0.8 : this.def.height;
  }

  private setMode(m: SpitMode): void {
    this.mode = m;
    this.modeT = 0;
  }

  override takeHit(hit: Hit): HitResult {
    if (!this.alive || this.state === 'spawn') return 'none';
    const g = this.game;
    if (this.retracted) {
      g.fx.dust(this.x, this.y + 0.4, this.z, 4, 0x4a3a50);
      g.fx.sparkle(this.x, this.y + 0.6, this.z, 0xd8b8ff, 3);
      if (hit.fromPlayer && hit.source === 'melee') g.sfx('shieldBlock', this.x, this.y, this.z, 0.6, 0.5);
      return 'immune';
    }
    // Dazed, its throat is open: everything bites deeper.
    const r = super.takeHit(this.mode === 'dazed' ? { ...hit, damage: hit.damage * 1.5 } : hit);
    if (hit.move === 'reflected' && this.alive && this.mode !== 'dazed') {
      this.daze(2.2);
      g.toast('Stung by its own thorn!', 'good');
    }
    return r;
  }

  private daze(t: number): void {
    this.attack = null;
    this.releaseToken();
    this.setMode('dazed');
    this.hideFor = t;
    this.tm.dazed = true;
    this.tm.open = 0;
    this.state = 'recover';
  }

  protected override onActiveStart(a: AttackDef): void {
    if (a.id === 'fan') {
      for (let i = 0; i < 5; i++) this.fire((i / 4 - 0.5) * 0.9, 12.5, 0);
      this.game.sfx('thornVolley', this.x, this.y, this.z, 0.9);
    } else if (a.id === 'burst') {
      this.shots = 0;
    }
  }

  /** One thorn, `off` radians off the aim at the dragon. */
  private fire(off: number, speed: number, lead: number): void {
    const g = this.game;
    const p = g.player.body;
    const hy = this.y + 2.05;
    const ox = this.x + Math.sin(this.yaw) * 0.5;
    const oz = this.z + Math.cos(this.yaw) * 0.5;
    const tx = p.x + p.vx * lead;
    const tz = p.z + p.vz * lead;
    const ty = p.y + 0.8;
    const yaw = yawOf(tx - ox, tz - oz) + off;
    const pitch = Math.atan2(ty - hy, Math.hypot(tx - ox, tz - oz));
    const pr = g.spawnProjectile({
      x: ox, y: hy, z: oz, dx: Math.sin(yaw) * Math.cos(pitch), dy: Math.sin(pitch), dz: Math.cos(yaw) * Math.cos(pitch),
      speed, radius: 0.3, damage: (this.attack?.damage ?? 8) * this.eliteDmg, type: 'physical', color: ROOT_HOT, life: 2.2, gravity: 0,
      fromPlayer: false, kind: 'bolt', knockback: 4,
    });
    // A thorn, not an orb: a pale spike in a hot pink glow.
    pr.mesh.geometry = thornGeo!;
    pr.mesh.material = thornMat!;
    g.fx.emit(ox, hy, oz, { count: 3, speed: 2, dir: [Math.sin(yaw), 0.2, Math.cos(yaw)], spread: 0.4, life: [0.15, 0.3], size: [0.15, 0.25], sizeEnd: 0, color: ROOT_HOT, bright: 2 });
  }

  protected override think(dt: number): void {
    const g = this.game;
    const p = g.player;
    this.modeT += dt;
    this.retractCd -= dt;
    const d = this.distToPlayer();
    const toP = this.yawToPlayer();
    if (!this.aggro) {
      if (p.alive && !p.hidden && d < this.def.aggroRange && Math.abs(p.body.y - this.y) < 8) {
        this.aggro = true;
        this.alertAllies();
        g.noticeEnemy(this);
        g.sfx('enemyAlert', this.x, this.y, this.z, 0.8);
      } else {
        this.state = 'idle';
        this.tm.open = 0;
        return;
      }
    }
    if (!p.alive || p.hidden) {
      this.state = 'idle';
      return;
    }
    switch (this.mode) {
      case 'up': this.up(dt, d, toP); break;
      case 'sink': this.sink(); break;
      case 'hidden': this.hidden(); break;
      case 'rise': this.rise(); break;
      case 'dazed': this.dazed(); break;
    }
  }

  private up(dt: number, d: number, toP: number): void {
    const g = this.game;
    // Too close: in it goes (unless its vines are on fire).
    if (d < 3.1 && this.retractCd <= 0 && this.status.burn <= 0 && this.state !== 'active') {
      this.attack = null;
      this.releaseToken();
      this.setMode('sink');
      this.retracts++;
      g.sfx('burrow', this.x, this.y, this.z, 1.3, 0.8);
      return;
    }
    if (d < 3.1 && this.status.burn > 0 && this.retractCd <= 0) deepTip(g, 'burning', 'Its vines are burning, so it can\'t pull them in! Get stuck in!', 5);
    if ((this.state === 'windup' || this.state === 'active' || this.state === 'recover') && !this.attack) this.state = 'strafe';
    if (this.state === 'windup' || this.state === 'active' || this.state === 'recover') {
      this.tm.open = this.state === 'windup' ? Math.min(1, this.stateT / (this.attack?.windup ?? 1)) : this.state === 'active' ? 1 : 0.3;
      if (this.state === 'active' && this.attack?.id === 'burst') {
        const want = Math.min(3, Math.floor(this.stateT / 0.17) + 1);
        while (this.shots < want) {
          this.shots++;
          this.fire(0, 16, 0.35);
          g.sfx('thornVolley', this.x, this.y, this.z, 1.3, 0.6);
        }
      }
      this.runAttack(dt, d, toP);
      return;
    }
    this.tm.open = 0;
    this.yaw = approachAngle(this.yaw, toP, this.def.turnRate * dt);
    this.state = 'strafe';
    if (!this.hasToken && this.globalCd <= 0) this.hasToken = g.director.request(this, true);
    if (this.hasToken) {
      const a = this.pickAttack(d);
      if (a) this.startAttack(a);
    }
  }

  private sink(): void {
    this.tm.retract = 1;
    this.tm.open = 0;
    this.state = 'recover';
    if (this.modeT > 0.25) {
      this.setMode('hidden');
      this.hideFor = 1.3 + rng.next() * 0.6;
      deepTip(this.game, 'retract', 'It pulled itself in! Step back from the ring when it comes up, then hit it while it\'s dazed. Or bat its thorns back with your Horn!', 8);
    }
  }

  private hidden(): void {
    const g = this.game;
    this.state = 'recover';
    if (rng.chance(0.15)) g.fx.dust(this.x + rng.signed() * 0.6, this.y + 0.3, this.z + rng.signed() * 0.6, 1, 0x4a3a50);
    if (this.modeT >= this.hideFor) {
      this.setMode('rise');
      this.struck = false;
      const dur = Math.max(0.55, 0.75 / g.difficultyInfo.aggression);
      this.hideFor = dur;
      this.mark.show(this.x, this.y, this.z, 2.4, dur);
      this.state = 'windup';
      g.hud.threat(this);
      g.sfx('rumble', this.x, this.y, this.z, 1.3, 0.7);
    }
  }

  private rise(): void {
    const g = this.game;
    this.state = 'windup';
    this.tm.retract = 0.85;
    if (rng.chance(0.3)) g.fx.emit(this.x + rng.signed() * 1.8, this.y + 0.1, this.z + rng.signed() * 1.8, { count: 1, speed: 3, dir: [0, 1, 0], life: [0.2, 0.35], size: [0.1, 0.16], sizeEnd: 0, color: ROOT_HOT, bright: 2 });
    if (this.modeT >= this.hideFor && !this.struck) {
      this.struck = true;
      this.tm.retract = 0;
      g.fx.rocks(this.x, this.y + 0.3, this.z, 14, 0x4a3a50);
      g.fx.ring(this.x, this.y, this.z, 0.5, 2.8, 0xff6aa0, 0.35);
      g.fx.emit(this.x, this.y + 1, this.z, { count: 24, speed: 8, dir: [0, 0.3, 0], spread: 1, life: [0.2, 0.35], size: [0.1, 0.18], sizeEnd: 0, color: ROOT_HOT, bright: 2.2 });
      g.sfx('erupt', this.x, this.y, this.z, 1.3, 0.8);
      g.shake(0.2, 0.2);
      const pl = g.player;
      const pb = pl.body;
      const dd = Math.hypot(pb.x - this.x, pb.z - this.z);
      if (pl.alive && dd < 2.4 + pb.radius && pb.y < this.y + 1.8) {
        const n = dd || 1;
        pl.takeHit(makeHit({ damage: 9 * g.difficultyInfo.enemyDamage * this.eliteDmg, dirX: (pb.x - this.x) / n, dirZ: (pb.z - this.z) / n, knockback: 8, launch: 5, source: 'enemy', move: 'thornRing', fromPlayer: false, ox: this.x, oz: this.z }), this);
      }
      // Coming up takes it out of itself: a moment to hit back.
      this.daze(1.8);
    }
  }

  private dazed(): void {
    this.state = 'recover';
    if (rng.chance(0.2)) this.game.fx.sparkle(this.x, this.y + 2.4, this.z, 0xfff0a0, 1);
    if (this.modeT >= this.hideFor) {
      this.tm.dazed = false;
      this.retractCd = 3.8;
      this.globalCd = 0.5;
      this.setMode('up');
      this.state = 'strafe';
    }
  }

  override update(dt: number): void {
    // Frozen or shocked while coming up: it starts over, so the ring always shows first.
    if (this.mode === 'rise' && !this.struck && this.status.stunned) {
      this.mark.hide();
      this.setMode('hidden');
      this.hideFor = 0.3;
    }
    super.update(dt);
    this.mark.update(dt);
    const b = this.body;
    const m = this.tm.mound;
    m.position.set(b.x, b.y, b.z);
    m.scale.copy(this.model.root.scale);
    m.visible = this.alive || this.deadT < 0.6;
    // Pulled all the way in: only the mound shows (and Nyxa leaves it be).
    if (this.mode === 'hidden' && this.alive) this.model.root.visible = false;
    if (!this.alive) this.mark.hide();
  }

  override dispose(): void {
    super.dispose();
    this.game.scene.remove(this.tm.mound);
    this.mark.dispose();
  }
}

// ---------------------------------------------------------------------------

export type EnemyCtor = new (game: Game, def: EnemyDef, x: number, y: number, z: number, yaw?: number) => Enemy;

/** Foes with a brain (or a rule) of their own: Game.spawnEnemy builds these classes for these ids. */
export const ENEMY_CLASSES: Record<string, EnemyCtor> = {
  sporeling: Sporeling,
  puffcap: Puffcap,
  rootstalker: Rootstalker,
  thornspitter: Thornspitter,
};
