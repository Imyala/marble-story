import type { Game } from '../game/game';
import type { Builder } from '../world/level';
import type { Prop } from '../entities/props';
import { rng } from '../core/rng';
import { lerp } from '../core/math';
import * as THREE from 'three';
import { mergeStatic } from '../render/shapes';

/** Floating motes around the player: fireflies, snow, embers, pollen. */
export class Ambient implements Prop {
  private t = 0;
  constructor(private game: Game, private kind: 'firefly' | 'snow' | 'ember' | 'pollen' | 'shadow', private rate = 20) {}
  update(dt: number): void {
    this.t += dt * this.rate;
    const g = this.game;
    const p = g.player;
    while (this.t >= 1) {
      this.t -= 1;
      const a = rng.next() * Math.PI * 2;
      const r = 4 + rng.next() * 22;
      const x = p.x + Math.sin(a) * r;
      const z = p.z + Math.cos(a) * r;
      const gy = g.col.terrainAt(x, z);
      const base = Math.max(gy > -1e3 ? gy : p.y, g.waterLevel > -1e3 ? g.waterLevel : -1e9);
      switch (this.kind) {
        case 'firefly':
          g.fx.emit(x, base + 0.5 + rng.next() * 3, z, { count: 1, speed: 0.4, life: [2, 4], size: [0.1, 0.16], sizeEnd: 0.5, color: rng.chance(0.5) ? 0xf0ff80 : 0xa0ff90, bright: 2.2, drag: 0.3, gravity: -0.05 });
          break;
        case 'snow':
          g.fx.emit(x, p.y + 8 + rng.next() * 4, z, { count: 1, speed: 0.6, dir: [0.3, -1, 0.1], spread: 0.4, life: [4, 6], size: [0.08, 0.14], sizeEnd: 1, color: 0xffffff, alpha: 0.9, additive: false, drag: 0.2 });
          break;
        case 'ember':
          g.fx.emit(x, base + rng.next() * 2, z, { count: 1, speed: 0.8, dir: [0, 1, 0], spread: 0.5, life: [2, 3.5], size: [0.06, 0.12], sizeEnd: 0.2, color: 0xff9040, bright: 2, gravity: -0.3 });
          break;
        case 'pollen':
          g.fx.emit(x, base + 0.5 + rng.next() * 4, z, { count: 1, speed: 0.4, dir: [1, 0.1, 0.3], spread: 0.5, life: [3, 5], size: [0.06, 0.1], sizeEnd: 1, color: 0xfff0b0, bright: 1.2, drag: 0.2 });
          break;
        case 'shadow':
          g.fx.emit(x, base + rng.next() * 2, z, { count: 1, speed: 0.5, dir: [0, 1, 0], spread: 0.4, life: [2, 4], size: [0.15, 0.3], sizeEnd: 0.1, color: 0xb04cff, bright: 1.4, gravity: -0.2 });
          break;
      }
    }
  }
}

export function ambient(b: Builder, kind: 'firefly' | 'snow' | 'ember' | 'pollen' | 'shadow', rate = 20): void {
  b.level.props.push(new Ambient(b.game, kind, rate));
}

/** Blends two hex colors. */
export function mix(a: number, b: number, t: number): number {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, Math.max(0, Math.min(1, t))).getHex();
}

/** Standard grass/rock/dirt terrain colorer with a per-level palette. */
export function paint(p: {
  under: number; shore: number; grass: number; grass2: number; rock: number; path: number; high?: number; highAt?: number; water?: number;
}) {
  return (x: number, z: number, h: number, slope: number, path: number): number => {
    const wl = p.water ?? 0;
    let c: number;
    if (h < wl - 0.3) c = p.under;
    else if (h < wl + 0.5) c = mix(p.under, p.shore, (h - (wl - 0.3)) / 0.8);
    else {
      const n = Math.sin(x * 0.31 + z * 0.17) * 0.5 + Math.sin(x * 0.07 - z * 0.13) * 0.5;
      c = mix(p.grass, p.grass2, n * 0.5 + 0.5);
      if (p.high !== undefined && p.highAt !== undefined) c = mix(c, p.high, (h - p.highAt) / 4);
    }
    if (slope > 0.6) c = mix(c, p.rock, (slope - 0.6) * 2.5);
    if (path > 0) c = mix(c, p.path, path * 0.85);
    void lerp;
    return c;
  };
}

/** Deterministic pseudo-random helper for level scattering. */
export function jitter(i: number, s = 1): number {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
}

// ---------------------------------------------------------------------------
// Shared story machinery: boss fights and Warden rescues.
// ---------------------------------------------------------------------------

import { Barrier } from '../entities/props';
import { Npc } from '../world/level';
import type { Boss } from '../enemies/boss';
import type { Line } from '../ui/dialogue';
import type { DragonLook } from '../player/dragonRig';
import type { Element } from '../game/types';
import { THEMES } from '../core/audio';
import { mat as matS, glow as glowS } from '../render/materials';
import type { Interactable } from '../entities/props';
import { skillKey } from '../game/skills';

export interface BossFightOpts {
  /** Unique id within the level; the intro plays once per save. */
  id: string;
  /** Arena center and barrier radius. */
  x: number;
  z: number;
  r: number;
  /** Where the player must step to start the fight, and how close. */
  triggerX: number;
  triggerZ: number;
  triggerR: number;
  spawn(g: Game): Boss;
  /** What the rematch stone calls the boss. */
  name?: string;
  intro: Line[];
  /** Runs once the boss is dead and the barrier is down. */
  onDefeated(g: Game): void;
}

/** A standing stone by a beaten boss's arena that offers a rematch. */
class RematchStone implements Prop, Interactable {
  readonly range = 2.6;
  label: string;
  enabled = true;
  private rune: THREE.MeshBasicMaterial;
  private t = 0;
  constructor(game: Game, readonly x: number, readonly y: number, readonly z: number, name: string, private fn: () => void) {
    this.label = `Challenge ${name} again (Skill Point: take no hits)`;
    const root = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 2.2, 5), matS(0x4a4458, { rough: 0.9, flat: true }));
    stone.position.y = 1.1;
    stone.castShadow = true;
    root.add(stone);
    this.rune = new THREE.MeshBasicMaterial({ color: 0xffe070 });
    const r = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), this.rune);
    r.position.set(0, 1.5, 0.42);
    root.add(r);
    root.position.set(x, y, z);
    game.level!.root.add(root);
  }
  interact(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.fn();
  }
  update(dt: number): void {
    this.t += dt;
    this.rune.color.setHex(this.enabled ? 0xffe070 : 0x5a5060).multiplyScalar(this.enabled ? 0.7 + 0.3 * Math.sin(this.t * 3) : 1);
  }
}

/**
 * Wires a boss arena: a trigger that spawns the boss and raises a barrier,
 * the intro conversation (first time only), boss music, and a rematch when
 * the player dies or reloads mid-fight. Once the realm is done, a standing
 * stone offers a rematch instead, until the boss's no-hit Skill Point is won.
 */
export function bossFight(b: Builder, o: BossFightOpts): void {
  const g = b.game;
  const lvl = b.level.def.id;
  const done = !!g.save.levelsDone[lvl];
  const skill = `${lvl}:boss`;
  if (done && g.save.found[skillKey(skill)]) return;
  const barrier = new Barrier(g, o.x, b.y(o.x, o.z), o.z, o.r);
  b.level.props.push(barrier);
  let defeated = false;
  let stone: RematchStone | null = null;
  if (!done) b.level.goals.push({ x: o.triggerX, y: b.y(o.triggerX, o.triggerZ), z: o.triggerZ, label: 'boss', done: () => defeated || !!g.save.levelsDone[lvl] });
  // The outro waits two seconds of game time (not wall time, which slow frames would outrun).
  let outroT = -1;
  b.level.props.push({
    update: (dt: number) => {
      if (outroT < 0) return;
      outroT -= dt;
      if (outroT < 0 && g.level?.def.id === lvl) o.onDefeated(g);
    },
  });
  const start = () => {
    if ((defeated && !done) || (g.boss && g.boss.alive)) return;
    const boss = o.spawn(g);
    g.addBoss(boss);
    barrier.set(true);
    const hits0 = g.visit.hits;
    const begin = () => {
      boss.awake = true;
      g.audio.setMusic(THEMES.boss!);
    };
    boss.onDefeated = () => {
      defeated = true;
      barrier.set(false);
      if (g.visit.hits === hits0) g.skill(skill);
      if (done) {
        // A rematch: no story, just the music back and (maybe) another go.
        g.audio.setMusic(THEMES[b.level.def.music] ?? null);
        if (stone) stone.enabled = !g.save.found[skillKey(skill)];
        return;
      }
      g.audio.setMusic(null);
      outroT = 2;
    };
    const key = `story:${lvl}:${o.id}`;
    if (done) {
      g.hud.flick('Round two! Not a scratch this time, Aster, and it\'s a Skill Point!', 4);
      begin();
    } else if (g.save.found[key]) begin();
    else {
      g.save.found[key] = true;
      g.say(o.intro, begin);
    }
  };
  if (done) {
    const sx = o.triggerX + 3;
    const sz = o.triggerZ;
    const name = o.name ?? 'the boss';
    stone = new RematchStone(g, sx, b.y(sx, sz), sz, name, start);
    b.level.props.push(stone);
    b.level.interactables.push(stone);
  } else {
    // Re-arms after a death: the trigger fires again whenever no boss is alive.
    b.trigger(o.triggerX, o.triggerZ, o.triggerR, () => {
      if (!defeated && (!g.boss || !g.boss.alive)) start();
    }, false);
  }
  // Dying mid-fight despawns the boss; drop the barrier so the player can return.
  b.level.on('boss-reset', () => {
    barrier.set(false);
    if (stone) stone.enabled = true;
  });
}

/** A shadow-crystal cage around a captured Warden. */
export class Cage {
  private root = new THREE.Group();
  constructor(private b: Builder, readonly x: number, readonly z: number, radius = 2.6, height = 5) {
    const y = b.y(x, z);
    const crystal = new THREE.MeshStandardMaterial({ color: 0x3a1a5a, emissive: 0xb04cff, emissiveIntensity: 0.6, roughness: 0.2, flatShading: true, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), crystal);
      c.scale.set(0.6, height * 0.9, 0.6);
      c.position.set(x + Math.sin(a) * radius, y + height * 0.35, z + Math.cos(a) * radius);
      c.rotation.set(Math.cos(a) * -0.25, a, Math.sin(a) * 0.25);
      this.root.add(c);
    }
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.6, radius + 0.9, 0.4, 12), matS(0x2a2432, { rough: 0.9, flat: true }));
    base.position.set(x, y + 0.2, z);
    this.root.add(base);
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.08, 6, 30), glowS(0xb04cff));
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.set(x, y + height * 0.7, z);
    this.root.add(glowRing);
    mergeStatic(this.root);
    b.level.root.add(this.root);
  }
  shatter(g: Game): void {
    const y = g.col.groundAt(this.x, this.z, 1e4, 0.2).y;
    g.fx.shatter(this.x, y + 2, this.z, 0xd090ff);
    g.fx.shadowPoof(this.x, y + 2, this.z, 2.5);
    g.sfx('shatter', this.x, y, this.z);
    this.b.level.root.remove(this.root);
  }
}

export interface RescueOpts {
  warden: string;
  look: DragonLook;
  x: number;
  z: number;
  yaw: number;
  element: Element;
  lines: Line[];
  /** Level id unlocked by this rescue. */
  unlocks: string;
  cage?: Cage;
}

/**
 * The end of a realm: the cage breaks, the Warden speaks, Aster learns the
 * element, the next realm unlocks, and everyone goes home to the Sanctum.
 */
export function rescueWarden(g: Game, o: RescueOpts): void {
  const level = g.level;
  if (!level) return;
  o.cage?.shatter(g);
  const y = g.col.groundAt(o.x, o.z, 1e4, 0.2).y;
  let npc = level.npcs.find((n) => n.id === o.warden);
  if (!npc) {
    npc = new Npc(g, o.warden, o.look, o.x, y, o.z, o.yaw);
    level.npcs.push(npc);
  }
  const lines: Line[] = [
    ...o.lines,
    {
      who: o.warden, text: '', action: () => {
        g.learnElement(o.element);
        g.audio.play('unlock');
        g.fx.motes(g.player.x, g.player.y + 1, g.player.z, 0xffffff, 40);
        g.toast(`You learned ${o.element.charAt(0).toUpperCase() + o.element.slice(1)}! Press ${({ fire: 1, lightning: 2, ice: 3, earth: 4 } as const)[o.element]} to select it.`, 'good');
      },
    },
  ];
  // The empty line is only there to run the action; drop its text box.
  lines[lines.length - 1]!.text = '...';
  g.say(lines, () => {
    g.save.levelsDone[level.def.id] = true;
    if (o.unlocks && !g.save.unlocked.includes(o.unlocks)) g.save.unlocked.push(o.unlocks);
    g.saveNow();
    g.travel('sanctum');
  });
}
