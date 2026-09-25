import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Builder } from '../world/level';
import type { Interactable, Prop, SpawnSpec } from '../entities/props';
import { Barrier } from '../entities/props';
import type { Enemy } from '../enemies/enemy';
import { mat, glow } from '../render/materials';
import { makeCyl } from '../world/collision';
import { writeSave } from '../game/progress';
import type { Element } from '../game/types';

/**
 * Dragon Trials: optional challenge fights on the Sanctum training grounds.
 * Each has an objective beyond "win", pays out gems (much more the first
 * time), and unlocks as Aster learns more elements.
 */

export interface TrialDef {
  id: string;
  name: string;
  desc: string;
  /** Elements the player must know. */
  needs: Element[];
  waves: SpawnSpec[][];
  time: number;
  goal: 'clear' | 'style' | 'reactions' | 'noHit';
  /** Style rank index or reaction count, for those goals. */
  target?: number;
  reward: number;
  repeat: number;
}

const R = 7;
const ring = (n: number, type: string, r = R * 0.75, phase = 0): SpawnSpec[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + phase;
    return { type, x: Math.sin(a) * r, z: Math.cos(a) * r, delay: i * 0.15 };
  });

export const TRIALS: TrialDef[] = [
  {
    id: 'rush', name: 'Gloom Rush', desc: 'Defeat three waves before the sand runs out.', needs: [], time: 75, goal: 'clear', reward: 60, repeat: 12,
    waves: [ring(3, 'grunt'), [...ring(2, 'grunt'), ...ring(2, 'slinger', R * 0.8, 1)], [...ring(3, 'grunt', R * 0.7, 0.5), { type: 'shieldbearer', x: 0, z: R * 0.6 }]],
  },
  {
    id: 'style', name: 'Trial of Style', desc: 'Reach the Wildfire (A) style rank. Vary your attacks: repetition earns nothing.', needs: [], time: 90, goal: 'style', target: 3, reward: 100, repeat: 15,
    waves: [ring(4, 'grunt'), ring(4, 'grunt', R * 0.7, 0.8), [...ring(3, 'grunt'), ...ring(2, 'wisp', R * 0.6, 1)], ring(5, 'grunt', R * 0.8, 0.3)],
  },
  {
    id: 'untouched', name: 'Trial of Grace', desc: 'Clear two waves without being hit once. Perfect dodges are your friend.', needs: ['fire'], time: 90, goal: 'noHit', reward: 140, repeat: 20,
    waves: [ring(3, 'grunt'), [...ring(2, 'grunt'), { type: 'brute', x: 0, z: R * 0.6 }]],
  },
  {
    id: 'reactions', name: 'Trial of Storms', desc: 'Set off three elemental reactions: Shatter, Overload or Steam Burst.', needs: ['fire', 'lightning'], time: 100, goal: 'reactions', target: 3, reward: 160, repeat: 20,
    waves: [ring(4, 'grunt'), [...ring(3, 'grunt'), ...ring(2, 'slinger', R * 0.8, 1)], ring(5, 'grunt', R * 0.7, 0.4), ring(5, 'shieldbearer')],
  },
  {
    id: 'guardian', name: 'Trial of the Wardens', desc: 'Survive the Sanctum\'s hardest drill: totems, brutes and a Shade Knight.', needs: ['fire', 'lightning', 'ice'], time: 150, goal: 'clear', reward: 300, repeat: 30,
    waves: [[{ type: 'totem', x: 0, z: 0 }, ...ring(3, 'grunt')], [{ type: 'brute', x: 3, z: 3 }, { type: 'brute', x: -3, z: -3 }, ...ring(2, 'slinger', R * 0.8)], [{ type: 'knight', x: 0, z: R * 0.5 }, ...ring(2, 'shieldbearer', R * 0.7, 1)]],
  },
  {
    id: 'legend', name: 'Trial of Legends', desc: 'Every element, every foe, and the Legendary style rank. For the truly fearless.', needs: ['fire', 'lightning', 'ice', 'earth'], time: 180, goal: 'style', target: 5, reward: 500, repeat: 40,
    waves: [[...ring(4, 'grunt'), { type: 'totem', x: 0, z: 0 }], [...ring(2, 'crawler'), ...ring(2, 'wisp', R * 0.6, 1)], [{ type: 'frostGolem', x: 3, z: 0 }, { type: 'stoneGolem', x: -3, z: 0 }], [{ type: 'knight', x: 2, z: 2 }, { type: 'knight', x: -2, z: -2 }, ...ring(3, 'grunt')]],
  },
];

export class TrialGround implements Prop, Interactable {
  readonly range = 3;
  label = 'Read the Trial Stone';
  enabled = true;
  private barrier: Barrier;
  private active: TrialDef | null = null;
  private wave = -1;
  private alive: Enemy[] = [];
  private timeLeft = 0;
  private gap = 0;
  private startReactions = 0;
  private hit = false;
  private hpAtStart = 0;
  private hud: HTMLDivElement;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly cx: number, readonly cz: number) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.5), mat(0x6e6a78, { rough: 0.9, flat: true }));
    stone.position.set(x, y + 1.1, z);
    stone.castShadow = true;
    game.level!.root.add(stone);
    const rune = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 20), glow(0xf5c46b));
    rune.position.set(x, y + 1.4, z + 0.27);
    game.level!.root.add(rune);
    game.col.add(makeCyl(x, z, 0.8, y, y + 2.2));
    this.barrier = new Barrier(game, cx, game.col.groundAt(cx, cz, 1e4, 0.2).y, cz, R + 1.5, 0xf5c46b);
    this.hud = document.createElement('div');
    this.hud.className = 'toast good';
    this.hud.style.cssText = 'position:absolute;left:50%;top:7%;transform:translateX(-50%);font-size:16px;display:none;';
    game.hud.root.appendChild(this.hud);
  }

  get running(): boolean {
    return this.active !== null;
  }

  dispose(): void {
    this.hud.remove();
  }

  interact(): void {
    if (this.active) return;
    this.game.menus.showTrials(this);
  }

  start(t: TrialDef): void {
    const g = this.game;
    this.active = t;
    this.wave = -1;
    this.alive = [];
    this.timeLeft = t.time;
    this.gap = 0;
    this.hit = false;
    this.startReactions = g.save.stats.reactions;
    this.hpAtStart = g.player.hp;
    g.style.reset();
    this.barrier.set(true);
    const gy = g.col.groundAt(this.cx, this.cz, 1e4, 0.2).y;
    g.player.place(this.cx, gy + 0.1, this.cz - 2, 0);
    g.cam.snapBehind(0);
    g.hud.levelTitle(t.name, t.desc);
    g.sfx('door');
    this.enabled = false;
    g.level!.emit('trial-start');
    this.nextWave();
  }

  private nextWave(): void {
    const t = this.active!;
    this.wave++;
    if (this.wave >= t.waves.length) {
      if (t.goal === 'clear' || t.goal === 'noHit') this.finish(true);
      else {
        // Objective not met yet: keep the pressure on with a fresh wave.
        this.wave = t.waves.length - 2;
        this.nextWave();
      }
      return;
    }
    const g = this.game;
    for (const s of t.waves[this.wave]!) {
      const x = this.cx + s.x;
      const z = this.cz + s.z;
      const gy = g.col.groundAt(x, z, 1e4, 0.2).y;
      const e = g.spawnEnemy(s.type, x, gy + 0.05, z, Math.atan2(this.cx - x, this.cz - z), true);
      e.spawnDelay = s.delay ?? 0;
      e.aggro = true;
      this.alive.push(e);
    }
  }

  private objectiveText(t: TrialDef): string {
    const g = this.game;
    const time = `${Math.ceil(this.timeLeft)}s`;
    switch (t.goal) {
      case 'clear': return `${t.name}: wave ${this.wave + 1}/${t.waves.length} &middot; ${time}`;
      case 'noHit': return `${t.name}: wave ${this.wave + 1}/${t.waves.length} &middot; untouched &middot; ${time}`;
      case 'style': return `${t.name}: rank ${['D', 'C', 'B', 'A', 'S', 'SS'][g.style.rank]} of ${['D', 'C', 'B', 'A', 'S', 'SS'][t.target!]} &middot; ${time}`;
      case 'reactions': return `${t.name}: reactions ${g.save.stats.reactions - this.startReactions}/${t.target} &middot; ${time}`;
    }
  }

  private finish(won: boolean): void {
    const g = this.game;
    const t = this.active!;
    this.active = null;
    this.barrier.set(false);
    this.enabled = true;
    this.hud.style.display = 'none';
    // Leftover foes vanish without paying out, so failing is not a gem farm.
    for (const e of this.alive) {
      if (!e.alive) continue;
      e.alive = false;
      e.releaseToken();
      e.state = 'dead';
      e.deadT = 0.3;
      g.fx.shadowPoof(e.x, e.y + e.height * 0.5, e.z, 1);
    }
    this.alive = [];
    g.level!.emit('trial-end');
    if (won) {
      const key = `trial:${t.id}`;
      const first = !g.save.found[key];
      g.save.found[key] = true;
      const reward = first ? t.reward : t.repeat;
      g.spawnGems(this.cx, g.player.y + 1, this.cz, { blue: reward, red: 3, green: 3 }, true);
      g.hud.bigText('TRIAL COMPLETE', 0xf5c46b);
      g.audio.play('unlock');
      g.toast(first ? `First clear! +${reward} spirit gems` : `+${reward} spirit gems`, 'good');
      writeSave(g.save);
    } else {
      g.hud.bigText('TRIAL FAILED', 0xff7a6a);
      g.audio.play('uiBack');
    }
  }

  update(dt: number): void {
    this.barrier.update(dt);
    const t = this.active;
    if (!t) return;
    const g = this.game;
    this.timeLeft -= dt;
    if (g.player.hp < this.hpAtStart - 0.01) this.hit = true;
    this.hpAtStart = Math.max(this.hpAtStart, g.player.hp);
    this.hud.style.display = 'block';
    this.hud.innerHTML = this.objectiveText(t);
    if (!g.player.alive || this.timeLeft <= 0 || (t.goal === 'noHit' && this.hit)) {
      this.finish(false);
      return;
    }
    if (t.goal === 'style' && g.style.rank >= t.target!) {
      this.finish(true);
      return;
    }
    if (t.goal === 'reactions' && g.save.stats.reactions - this.startReactions >= t.target!) {
      this.finish(true);
      return;
    }
    this.alive = this.alive.filter((e) => e.alive);
    if (this.alive.length === 0) {
      this.gap += dt;
      if (this.gap > 1.2) {
        this.gap = 0;
        this.nextWave();
      }
    }
  }

  /** The player died: end quietly (the respawn handles the rest). */
  abort(): void {
    if (this.active) this.finish(false);
  }
}

export function trialGround(b: Builder, x: number, z: number, cx: number, cz: number): TrialGround {
  const t = new TrialGround(b.game, x, b.y(x, z), z, cx, cz);
  b.level.props.push(t);
  b.level.interactables.push(t);
  b.level.on('boss-reset', () => t.abort());
  return t;
}
