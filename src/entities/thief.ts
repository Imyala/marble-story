import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Hit, HitResult, Hittable } from '../game/types';
import type { Prop } from './props';
import { Collectible } from './props';
import { ImpModel, type EnemyPose } from '../enemies/models';
import { angleDiff, clamp } from '../core/math';

/**
 * An egg thief: a gloomling with a stolen dragon egg on its back. It waits
 * near its den, bolts when the dragon comes close, and runs in bursts
 * (a little slower than a running dragon, much slower than a Charge),
 * dodging ledges, walls and water and circling back toward its den. Any blow
 * catches it and the egg drops. Lose it and it slinks back home.
 */
export class EggThief implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.6;
  readonly height = 1.2;
  x: number;
  y: number;
  z: number;
  private yaw = 0;
  private model = new ImpModel({ skin: 0x4a5a3a, belly: 0x76844e, eye: 0xfff080, scale: 0.82, bulk: 0, ears: 'long', weapon: 'none', offhand: 'none', pack: 'egg' });
  private pose: EnemyPose = { state: 'idle', t: 0, speed: 0, attack: null, windup: 0, frozen: false, shocked: false, dead: false, deadT: 0, airborne: false, guard: false, flipped: false };
  mode: 'wait' | 'flee' | 'rest' | 'gone' = 'wait';
  private t = 0;
  private burstT = 0;
  private lostT = 0;
  private tauntT = 2;
  private seed = Math.random() * 10;
  private spotted = false;

  constructor(private game: Game, readonly id: string, private homeX: number, private homeZ: number, private leash = 24) {
    this.x = homeX;
    this.z = homeZ;
    this.y = game.col.groundAt(homeX, homeZ, 1e4, 0.2).y;
    this.model.root.position.set(this.x, this.y, this.z);
    game.level!.root.add(this.model.root);
    this.model.root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  }

  /** Can it run this way? Checks for a wall, a drop, a climb, water and hazards. */
  private clear(yaw: number): boolean {
    const g = this.game;
    const dx = Math.sin(yaw);
    const dz = Math.cos(yaw);
    if (g.col.raycast(this.x, this.y + 0.6, this.z, dx, 0, dz, 1.6, true).t < 1.6) return false;
    for (const d of [1.1, 2.2]) {
      const ax = this.x + dx * d;
      const az = this.z + dz * d;
      const gy = g.col.groundAt(ax, az, this.y + 0.9, 0.1).y;
      if (gy < this.y - 0.9 || gy > this.y + 0.6) return false;
      if (g.isDeepWater(ax, az, gy) || g.inHazard(ax, gy + 0.1, az)) return false;
    }
    return true;
  }

  private poof(): void {
    this.game.fx.shadowPoof(this.x, this.y + 0.7, this.z, 1.2);
  }

  takeHit(_hit: Hit): HitResult {
    if (!this.alive || this.mode === 'gone') return 'none';
    const g = this.game;
    this.alive = false;
    this.mode = 'gone';
    this.poof();
    g.sfx('enemyDie', this.x, this.y, this.z, 1.6, 0.8);
    g.level!.root.remove(this.model.root);
    this.model.dispose();
    // The egg tumbles free where the thief was caught.
    const c = new Collectible(g, this.id, 'egg', this.x, this.y, this.z);
    g.level!.props.push(c);
    g.fx.motes(this.x, this.y + 1, this.z, 0xd0a0ff, 18);
    g.style.bonus(30);
    g.hud.flick('Got it! Grab the egg before something else does!', 4, true);
    return 'hit';
  }

  update(dt: number): void {
    if (this.mode === 'gone') return;
    const g = this.game;
    const p = g.player.body;
    this.t += dt;
    const pd = Math.hypot(p.x - this.x, p.z - this.z);
    let speed = 0;
    if (this.mode === 'wait') {
      // Fidgets near its den, peering about.
      this.yaw += Math.sin(this.t * 0.7 + this.seed) * dt * 0.8;
      if (pd < 12 && Math.abs(p.y - this.y) < 5) {
        this.mode = 'flee';
        this.burstT = 4 + Math.random() * 1.5;
        g.sfx('enemyAlert', this.x, this.y, this.z, 1.7, 0.9);
        if (!this.spotted) {
          this.spotted = true;
          g.hud.flick('An egg thief! After him, Aster! A Charge will catch him!', 4, true);
        }
      }
    } else if (this.mode === 'rest') {
      // Out of breath: a chance to close in.
      this.burstT -= dt;
      if (this.burstT <= 0 || pd < 3) {
        this.mode = 'flee';
        this.burstT = 3.5 + Math.random() * 2;
      }
    } else {
      this.burstT -= dt;
      if (this.burstT <= 0) {
        this.mode = 'rest';
        this.burstT = 0.9 + Math.random() * 0.4;
      }
      speed = pd < 6 ? 8.6 : 7.8;
      // Away from the dragon, bent back toward home when it strays, with a wobble.
      let ax = (this.x - p.x) / (pd || 1);
      let az = (this.z - p.z) / (pd || 1);
      const hx = this.homeX - this.x;
      const hz = this.homeZ - this.z;
      const hd = Math.hypot(hx, hz);
      if (hd > this.leash * 0.5) {
        const w = clamp((hd - this.leash * 0.5) / (this.leash * 0.5), 0, 1.6) * 1.5;
        ax += (hx / hd) * w;
        az += (hz / hd) * w;
      }
      const want = Math.atan2(ax, az) + Math.sin(this.t * 1.4 + this.seed) * 0.35;
      let chosen: number | null = null;
      for (const off of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.0, -2.0, 2.6, -2.6, Math.PI]) {
        // Prefer turning the way it is already heading.
        const o = angleDiff(this.yaw, want) < 0 ? -off : off;
        if (this.clear(want + o)) { chosen = want + o; break; }
      }
      if (chosen === null) speed = 0;
      else this.yaw += angleDiff(this.yaw, chosen) * (1 - Math.exp(-9 * dt));
      this.tauntT -= dt;
      if (this.tauntT <= 0) {
        this.tauntT = 2.5 + Math.random() * 2;
        g.sfx('talk', this.x, this.y, this.z, 1.9, 0.6);
      }
      // Lost it: slink home and wait.
      this.lostT = pd > 42 ? this.lostT + dt : 0;
      if (this.lostT > 3) {
        this.poof();
        this.x = this.homeX;
        this.z = this.homeZ;
        this.y = g.col.groundAt(this.x, this.z, 1e4, 0.2).y;
        this.mode = 'wait';
        this.lostT = 0;
        this.poof();
      }
    }
    if (speed > 0) {
      const nx = this.x + Math.sin(this.yaw) * speed * dt;
      const nz = this.z + Math.cos(this.yaw) * speed * dt;
      const gy = g.col.groundAt(nx, nz, this.y + 0.9, 0.1).y;
      if (gy > this.y - 1.2 && gy < this.y + 0.7) {
        this.x = nx;
        this.z = nz;
        this.y += (gy - this.y) * Math.min(1, dt * 20);
      }
    }
    // A Charge or a dodge straight through it also catches it.
    if (pd < 1.3 && Math.abs(p.y - this.y) < 1.5 && (g.player.state === 'charge' || g.player.state === 'dodge')) {
      this.takeHit(null as unknown as Hit);
      return;
    }
    this.pose.state = speed > 0 ? 'chase' : 'idle';
    this.pose.speed = speed > 0 ? Math.min(1.3, speed / 6) : 0;
    this.model.root.position.set(this.x, this.y, this.z);
    this.model.root.rotation.y = this.yaw;
    this.model.update(dt, this.pose);
    if (Math.random() < 0.25) g.fx.sparkle(this.x - Math.sin(this.yaw) * 0.35, this.y + 1.1, this.z - Math.cos(this.yaw) * 0.35, 0xd0a0ff, 1);
  }
}
