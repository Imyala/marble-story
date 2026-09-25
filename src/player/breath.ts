import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Player } from './player';
import { makeHit, type Element, type Hittable } from '../game/types';
import { upgradeLevel } from '../game/progress';
import { rng } from '../core/rng';

/** Mana per second while breathing. */
export const BREATH_COST: Record<Element, number> = { fire: 15, lightning: 17, ice: 14, earth: 19 };
/** Mana per burst. */
export const BURST_COST: Record<Element, number> = { fire: 22, lightning: 30, ice: 28, earth: 30 };

const LOOP_KIND: Record<Element, 'fire' | 'lightning' | 'ice' | 'earth'> = { fire: 'fire', lightning: 'lightning', ice: 'ice', earth: 'earth' };

const mouth = new THREE.Vector3();
const aim = new THREE.Vector3();
const to = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

/**
 * Each element plays differently:
 *   Fire       a short cone that ignites; best against groups and frost foes
 *   Lightning  locks onto targets and chains between them; stuns
 *   Ice        a spray of shards that builds up to a freeze
 *   Earth      a point-blank blast of grit with huge knockback and stagger
 */
export class BreathController {
  private game: Game;
  private player: Player;
  private active: Element | null = null;
  private tick = 0;
  private spawn = 0;
  private freezeT = 0;
  private arcT = 0;
  private sfxT = 0;
  aimPitch = 0;
  private furyTick = 0;
  private furyCount = 0;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.player = player;
  }

  private level(el: Element): number {
    return Math.max(1, upgradeLevel(this.game.save, `${el}Breath`));
  }
  private burstLevel(el: Element): number {
    return Math.max(1, upgradeLevel(this.game.save, `${el}Burst`));
  }
  get costMul(): number {
    return this.active && this.level(this.active) >= 3 ? 0.75 : 1;
  }

  start(el: Element): void {
    if (this.active === el) return;
    this.stop();
    this.active = el;
    this.tick = 0;
    this.spawn = 0;
    this.game.audio.startLoop('breath', LOOP_KIND[el]);
  }

  stop(): void {
    if (!this.active) return;
    this.active = null;
    this.game.audio.stopLoop('breath');
    this.aimPitch = 0;
  }

  /** Aim from the mouth: at the lock/soft target if there is one. */
  private computeAim(range: number): Hittable | null {
    const p = this.player;
    p.mouth(mouth);
    const t = p.lock ?? p.findTarget(range + 2, false);
    if (t) {
      to.set(t.x, t.y + t.height * 0.5, t.z).sub(mouth);
      const horiz = Math.hypot(to.x, to.z);
      const pitch = Math.max(-0.7, Math.min(0.9, Math.atan2(to.y, horiz)));
      this.aimPitch += (pitch - this.aimPitch) * 0.3;
    } else this.aimPitch += (-0.08 - this.aimPitch) * 0.3;
    const cp = Math.cos(this.aimPitch);
    aim.set(Math.sin(p.yaw) * cp, Math.sin(this.aimPitch), Math.cos(p.yaw) * cp).normalize();
    return t;
  }

  update(dt: number): void {
    const el = this.active;
    if (!el) return;
    const g = this.game;
    const lvl = this.level(el);
    const sf = this.player.power === 'superflame';
    const mul = (lvl === 1 ? 1 : lvl === 2 ? 1.35 : 1.7) * (sf ? 2.5 : 1);
    this.tick -= dt;
    this.spawn -= dt;
    this.sfxT -= dt;
    switch (el) {
      case 'fire': {
        const range = 5.5 + (lvl - 1) * 1.4;
        this.computeAim(range);
        g.fx.emit(mouth.x, mouth.y, mouth.z, {
          count: 5, speed: range * 2.6, speedJitter: 0.25, dir: [aim.x, aim.y, aim.z], spread: 0.13, life: [0.28, 0.4],
          size: [0.25, 0.4], sizeEnd: sf ? 6 : 5, color: sf ? 0xf0f8ff : 0xffe28a, colorEnd: sf ? 0x3a80ff : 0xff3a08, bright: sf ? 2.6 : 2, drag: 1.2, gravity: -2,
        });
        if (rng.chance(0.25)) g.fx.emit(mouth.x + aim.x * range * 0.7, mouth.y + aim.y * range * 0.7 + 0.5, mouth.z + aim.z * range * 0.7, {
          count: 1, speed: 1, dir: [0, 1, 0], life: [0.5, 0.9], size: [0.8, 1.2], sizeEnd: 2.5, color: 0x3a3030, alpha: 0.35, additive: false, gravity: -2,
        });
        g.fx.flash(mouth.x + aim.x, mouth.y, mouth.z + aim.z, sf ? 0x9ad8ff : 0xff8a30, 3 + rng.next(), 9, 0.12);
        if (this.tick <= 0) {
          this.tick = 0.1;
          this.coneHits(range, 0.42, { damage: 2.4 * mul, type: 'fire', buildup: 9, knockback: 0.8, stagger: 3, move: 'fireBreath' });
        }
        break;
      }
      case 'lightning': {
        const range = 9 + (lvl - 1) * 1.5;
        this.computeAim(range);
        const maxTargets = 1 + lvl;
        this.arcT -= dt;
        if (this.tick <= 0 || this.arcT <= 0) {
          const doHit = this.tick <= 0;
          if (doHit) this.tick = 0.12;
          this.arcT = 0.05;
          const targets = this.coneTargets(range, 0.55, maxTargets);
          let from = tmpA.copy(mouth);
          if (targets.length === 0) {
            const end = tmpB.copy(mouth).addScaledVector(aim, range * (0.7 + rng.next() * 0.3));
            end.x += rng.signed() * 0.8;
            end.y += rng.signed() * 0.5;
            end.z += rng.signed() * 0.8;
            const hit = g.col.raycast(mouth.x, mouth.y, mouth.z, aim.x, aim.y, aim.z, range);
            if (hit.t < range) end.copy(mouth).addScaledVector(aim, hit.t);
            g.fx.arc(mouth, end, 0xbfe8ff, 0.08, 0.07, 0.45);
            if (hit.t < range) g.fx.sparkle(end.x, end.y, end.z, 0xbfe8ff, 3);
          }
          for (const h of targets) {
            const c = new THREE.Vector3(h.x, h.y + h.height * 0.55, h.z);
            g.fx.arc(from, c, 0xcff0ff, 0.12, 0.07, 0.35);
            g.fx.arc(from, c, 0x7ac8ff, 0.05, 0.07, 0.6);
            if (doHit) {
              const dx = h.x - this.player.x;
              const dz = h.z - this.player.z;
              const n = Math.hypot(dx, dz) || 1;
              const r = h.takeHit(makeHit({
                damage: 3 * mul, type: 'lightning', buildup: 12, dirX: dx / n, dirZ: dz / n, knockback: 0.4, stagger: 4,
                source: 'breath', move: 'arcBreath', ox: this.player.x, oz: this.player.z,
              }));
              this.player.onDealt(r, h, 3 * mul, 'arcBreath', 3);
              g.fx.sparkle(c.x, c.y, c.z, 0xcff0ff, 3);
            }
            from = c;
          }
          g.fx.flash(mouth.x, mouth.y, mouth.z, 0x9fd8ff, 3, 10, 0.08);
          if (this.sfxT <= 0) {
            this.sfxT = 0.09;
            g.sfx('zap', mouth.x, mouth.y, mouth.z, 0.8 + rng.next() * 0.5, 0.6);
          }
        }
        break;
      }
      case 'ice': {
        const range = 9 + (lvl - 1) * 1.5;
        this.computeAim(range);
        // Open water in the stream's path freezes over into floes.
        this.freezeT -= dt;
        const wi = g.level?.waterIce;
        if (wi && this.freezeT <= 0 && Math.abs(mouth.y - g.waterLevel) < 5) {
          this.freezeT = 0.14;
          wi.freezeAlong(mouth.x, mouth.z, aim.x, aim.z, range * 0.75);
        }
        if (this.spawn <= 0) {
          this.spawn = 0.065;
          const sx = aim.x + rng.signed() * 0.07;
          const sy = aim.y + rng.signed() * 0.05;
          const sz = aim.z + rng.signed() * 0.07;
          g.spawnProjectile({
            x: mouth.x, y: mouth.y, z: mouth.z, dx: sx, dy: sy, dz: sz, speed: 24, radius: 0.28, damage: 3 * mul, type: 'ice',
            color: 0xcff6ff, life: range / 24, gravity: 0, fromPlayer: true, kind: 'shard', buildup: 11, knockback: 0.6, stagger: 3, move: 'frostBreath',
          });
        }
        g.fx.emit(mouth.x, mouth.y, mouth.z, {
          count: 3, speed: 9, dir: [aim.x, aim.y, aim.z], spread: 0.18, life: [0.3, 0.5], size: [0.3, 0.5], sizeEnd: 3.5,
          color: 0xe8fbff, colorEnd: 0x8fd8ff, alpha: 0.35, additive: false, drag: 2,
        });
        g.fx.emit(mouth.x, mouth.y, mouth.z, { count: 2, speed: 12, dir: [aim.x, aim.y, aim.z], spread: 0.15, life: [0.2, 0.4], size: [0.08, 0.15], color: 0xffffff, bright: 1.5 });
        break;
      }
      case 'earth': {
        const range = 4.6 + (lvl - 1) * 1.0;
        this.computeAim(range);
        g.fx.emit(mouth.x, mouth.y, mouth.z, {
          count: 4, speed: range * 3, dir: [aim.x, aim.y, aim.z], spread: 0.2, life: [0.2, 0.35], size: [0.14, 0.28], sizeEnd: 0.8,
          color: 0x9a8662, colorEnd: 0x6a5a3a, additive: false, gravity: 10, drag: 1,
        });
        g.fx.emit(mouth.x, mouth.y, mouth.z, {
          count: 2, speed: range * 2, dir: [aim.x, aim.y, aim.z], spread: 0.25, life: [0.3, 0.5], size: [0.5, 0.8], sizeEnd: 3,
          color: 0xc8b890, alpha: 0.4, additive: false, drag: 2.5,
        });
        g.fx.emit(mouth.x, mouth.y, mouth.z, { count: 2, speed: range * 2.5, dir: [aim.x, aim.y, aim.z], spread: 0.2, life: [0.15, 0.3], size: [0.15, 0.25], color: 0xb8f07a, bright: 1.5 });
        if (this.tick <= 0) {
          this.tick = 0.12;
          this.coneHits(range, 0.5, { damage: 3.4 * mul, type: 'earth', buildup: 0, knockback: 3, stagger: 13, move: 'quakeBreath' });
          g.shake(0.05, 0.1);
        }
        break;
      }
    }
  }

  private coneTargets(range: number, halfAngle: number, max: number): Hittable[] {
    const out: { h: Hittable; d: number }[] = [];
    const p = this.player;
    for (const h of this.game.hittables()) {
      if (!h.alive) continue;
      to.set(h.x, h.y + h.height * 0.5, h.z).sub(mouth);
      const d = to.length();
      const ang = aim.angleTo(to);
      const slack = Math.atan2(h.radius + h.height * 0.3, Math.max(0.5, d));
      if (d <= range + h.radius && ang <= halfAngle + slack) {
        out.push({ h, d });
        continue;
      }
      // Point-blank: the mouth sits well ahead of the body, so a target
      // pressed up against the snout would otherwise fall behind the cone.
      const bx = h.x - p.x;
      const bz = h.z - p.z;
      const bd = Math.hypot(bx, bz);
      if (bd < h.radius + 1.9 && h.y < p.y + 2.5 && h.y + h.height > p.y - 0.5) {
        let a = Math.atan2(bx, bz) - p.yaw;
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        // Ranked by distance from the body, so the target straight ahead still comes first.
        if (Math.abs(a) < 1.1) out.push({ h, d: bd * 0.5 + Math.abs(a) });
      }
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, max).map((o) => o.h);
  }

  private coneHits(range: number, halfAngle: number, o: { damage: number; type: Element; buildup: number; knockback: number; stagger: number; move: string }): void {
    const p = this.player;
    for (const h of this.coneTargets(range, halfAngle, 12)) {
      // Walls block breath.
      to.set(h.x, h.y + h.height * 0.5, h.z).sub(mouth);
      const d = to.length();
      to.normalize();
      const block = this.game.col.raycast(mouth.x, mouth.y, mouth.z, to.x, to.y, to.z, Math.max(0, d - h.radius - 0.3), true);
      if (block.t < d - h.radius - 0.3) continue;
      const dx = h.x - p.x;
      const dz = h.z - p.z;
      const n = Math.hypot(dx, dz) || 1;
      const r = h.takeHit(makeHit({
        damage: o.damage, type: o.type, buildup: o.buildup, dirX: dx / n, dirZ: dz / n, knockback: o.knockback, stagger: o.stagger,
        source: 'breath', move: o.move, ox: p.x, oz: p.z,
      }));
      p.onDealt(r, h, o.damage, o.move, 3);
    }
  }

  // --- bursts ------------------------------------------------------------------

  burst(el: Element, target: Hittable | null): void {
    const g = this.game;
    const p = this.player;
    const lvl = this.burstLevel(el);
    p.mouth(mouth);
    const baseYaw = p.yaw;
    let pitch = 0.02;
    if (target) {
      const horiz = Math.hypot(target.x - mouth.x, target.z - mouth.z);
      pitch = Math.atan2(target.y + target.height * 0.5 - mouth.y, horiz);
    }
    const dir = (yaw: number, pt = pitch) => ({ dx: Math.sin(yaw) * Math.cos(pt), dy: Math.sin(pt), dz: Math.cos(yaw) * Math.cos(pt) });
    switch (el) {
      case 'fire': {
        const n = lvl >= 2 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const yaw = baseYaw + (n === 1 ? 0 : (i - 1) * 0.22);
          g.spawnProjectile({
            x: mouth.x, y: mouth.y, z: mouth.z, ...dir(yaw), speed: 24, radius: 0.5, damage: 26, type: 'fire', color: 0xff8a30,
            life: 1.6, gravity: 0, fromPlayer: true, kind: 'fireball', explode: lvl >= 3 ? 4 : 3, buildup: 60, knockback: 9, launch: 4,
            stagger: 30, move: 'fireball', burnGround: lvl >= 3, homing: target ? 1.5 : 0,
          });
        }
        g.sfx('fireBurst', mouth.x, mouth.y, mouth.z);
        g.fx.flash(mouth.x, mouth.y, mouth.z, 0xff8a30, 8, 12, 0.25);
        break;
      }
      case 'lightning': {
        const n = lvl >= 3 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const yaw = baseYaw + (n === 1 ? 0 : (i - 0.5) * 0.5);
          g.spawnProjectile({
            x: mouth.x, y: mouth.y + 0.2, z: mouth.z, ...dir(yaw, Math.max(pitch, 0)), speed: 6, radius: 0.55, damage: 12, type: 'lightning',
            color: 0x9fe0ff, life: lvl >= 2 ? 5 : 3.5, gravity: 0, fromPlayer: true, kind: 'stormOrb', pierce: true, buildup: 30,
            knockback: 2, stagger: 10, move: 'stormOrb', explode: 3,
            zap: { radius: 4.5, interval: lvl >= 2 ? 0.2 : 0.3, damage: 6, buildup: 22, chains: lvl >= 3 ? 5 : 3 },
          });
        }
        g.sfx('zap', mouth.x, mouth.y, mouth.z, 0.6);
        break;
      }
      case 'ice': {
        const r = lvl >= 2 ? 6.5 : 4.8;
        const bx = p.x;
        const by = p.y;
        const bz = p.z;
        // A frost nova freezes the water all around.
        const wi = g.level?.waterIce;
        if (wi && Math.abs(by - g.waterLevel) < 4) {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            wi.freeze(bx + Math.sin(a) * r * 0.55, bz + Math.cos(a) * r * 0.55);
          }
        }
        for (const h of g.hittables()) {
          if (!h.alive) continue;
          const dx = h.x - bx;
          const dz = h.z - bz;
          const d = Math.hypot(dx, dz);
          if (d - h.radius > r || Math.abs(h.y - by) > 3) continue;
          const n = d || 1;
          const dmg = lvl >= 3 ? 24 : 14;
          const res = h.takeHit(makeHit({
            damage: dmg, type: 'ice', buildup: lvl >= 2 ? 100 : 70, dirX: dx / n, dirZ: dz / n, knockback: 4, stagger: 20,
            source: 'burst', move: 'frostNova', ox: bx, oz: bz,
          }));
          p.onDealt(res, h, dmg, 'frostNova', 10);
        }
        g.fx.ring(bx, by, bz, 0.5, r, 0xbff4ff, 0.45);
        g.fx.ring(bx, by + 0.4, bz, 0.3, r * 0.8, 0xffffff, 0.35);
        g.fx.emit(bx, by + 0.5, bz, { count: 60, speed: r * 2.2, dir: [0, 0.15, 0], spread: 1, life: [0.35, 0.6], size: [0.3, 0.6], sizeEnd: 2, color: 0xe8fbff, colorEnd: 0x8fd8ff, alpha: 0.6, additive: false, drag: 3 });
        g.fx.emit(bx, by + 0.3, bz, { count: 30, speed: r * 2, dir: [0, 0.3, 0], spread: 1, life: [0.3, 0.6], size: [0.1, 0.2], color: 0xffffff, bright: 2, drag: 2 });
        if (lvl >= 3) g.spawnIceSpikes(bx, by, bz, r);
        g.sfx('iceCrack', bx, by, bz, 0.8);
        g.sfx('shatter', bx, by, bz, 1.4, 0.4);
        g.shake(0.2, 0.2);
        break;
      }
      case 'earth': {
        g.spawnProjectile({
          x: mouth.x, y: mouth.y + 0.2, z: mouth.z, ...dir(baseYaw, Math.max(pitch + 0.12, 0.1)), speed: 19, radius: lvl >= 2 ? 0.75 : 0.6,
          damage: lvl >= 2 ? 44 : 34, type: 'earth', color: 0x9a8662, life: 2.2, gravity: 13, fromPlayer: true, kind: 'boulder',
          explode: lvl >= 2 ? 4 : 3.2, heavy: true, stagger: 90, knockback: 12, launch: 7, move: 'boulder', split: lvl >= 3 ? 3 : 0,
        });
        g.sfx('rumble', mouth.x, mouth.y, mouth.z, 1.3, 0.6);
        break;
      }
    }
  }

  // --- fury ---------------------------------------------------------------------

  furyStart(el: Element): void {
    const g = this.game;
    this.furyTick = 0;
    this.furyCount = 0;
    g.slowmo(0.4, 2.6);
    g.cam.furyZoom(2.7);
    g.renderer.impact(1);
    const p = this.player;
    const color = el === 'fire' ? 0xff7020 : el === 'lightning' ? 0xa8e6ff : el === 'ice' ? 0xbff4ff : 0x9be06a;
    g.fx.ring(p.x, p.y, p.z, 0.5, 6, color, 0.8);
    g.fx.motes(p.x, p.y + 1, p.z, color, 40);
  }

  furyUpdate(el: Element, t: number, dt: number): void {
    const g = this.game;
    const p = this.player;
    const px = p.x;
    const py = p.y;
    const pz = p.z;
    this.furyTick -= dt;
    const color = el === 'fire' ? 0xff7020 : el === 'lightning' ? 0xa8e6ff : el === 'ice' ? 0xbff4ff : 0x9be06a;
    if (t < 0.6) {
      g.fx.emit(px, py + 1, pz, { count: 4, speed: 5, life: [0.3, 0.6], size: [0.3, 0.5], color, bright: 2, drag: 1, jitter: 1.5 });
      return;
    }
    const aoe = (radius: number, damage: number, buildup: number, launch: number, knock: number, move: string) => {
      for (const h of g.hittables()) {
        if (!h.alive) continue;
        const dx = h.x - px;
        const dz = h.z - pz;
        const d = Math.hypot(dx, dz);
        if (d > radius + h.radius || Math.abs(h.y - py) > 8) continue;
        const n = d || 1;
        const r = h.takeHit(makeHit({
          damage, type: el, buildup, dirX: dx / n, dirZ: dz / n, knockback: knock, launch, stagger: 80, heavy: true,
          source: 'fury', move, ox: px, oz: pz,
        }));
        p.onDealt(r, h, damage, move, 5);
      }
    };
    switch (el) {
      case 'fire':
        if (this.furyTick <= 0 && this.furyCount < 4) {
          this.furyTick = 0.42;
          this.furyCount++;
          const r = 5 + this.furyCount * 3;
          aoe(r, 40, 100, 5, 8, 'inferno');
          g.fx.ring(px, py, pz, 1, r, 0xff7020, 0.5);
          g.fx.explosion(px, py + 1, pz, 3, 0xffa040);
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            g.fx.emit(px + Math.sin(a) * r * 0.6, py + 0.5, pz + Math.cos(a) * r * 0.6, {
              count: 3, speed: 6, dir: [Math.sin(a), 0.4, Math.cos(a)], spread: 0.3, life: [0.4, 0.7], size: [0.8, 1.2], sizeEnd: 0.3,
              color: 0xffc060, colorEnd: 0xff2000, bright: 2,
            });
          }
          g.sfx('explosion', px, py, pz, 0.9);
          g.shake(0.5, 0.35);
        }
        break;
      case 'lightning':
        if (this.furyTick <= 0 && t < 2.4) {
          this.furyTick = 0.13;
          const targets = g.enemies.filter((e) => e.alive && Math.hypot(e.x - px, e.z - pz) < 20);
          let tx: number;
          let ty: number;
          let tz: number;
          const tgt = targets.length ? targets[Math.floor(rng.next() * targets.length)]! : null;
          if (tgt) {
            tx = tgt.x;
            ty = tgt.y + tgt.height * 0.5;
            tz = tgt.z;
          } else {
            const a = rng.next() * Math.PI * 2;
            const rr = 3 + rng.next() * 12;
            tx = px + Math.sin(a) * rr;
            tz = pz + Math.cos(a) * rr;
            ty = g.col.groundAt(tx, tz, py + 5, 0.1).y;
          }
          const top = new THREE.Vector3(tx + rng.signed() * 2, ty + 18, tz + rng.signed() * 2);
          const bot = new THREE.Vector3(tx, ty, tz);
          g.fx.arc(top, bot, 0xe0f6ff, 0.35, 0.18, 0.25);
          g.fx.arc(top, bot, 0x7ac8ff, 0.15, 0.2, 0.4);
          g.fx.flash(tx, ty + 2, tz, 0xbfe8ff, 10, 16, 0.2);
          g.fx.ring(tx, ty, tz, 0.3, 3, 0xbfe8ff, 0.3);
          g.sfx('zap', tx, ty, tz, 0.5, 1);
          if (tgt) {
            const dx = tgt.x - px;
            const dz = tgt.z - pz;
            const n = Math.hypot(dx, dz) || 1;
            const r = tgt.takeHit(makeHit({
              damage: 26, type: 'lightning', buildup: 60, dirX: dx / n, dirZ: dz / n, knockback: 2, stagger: 40, source: 'fury', move: 'tempest', ox: px, oz: pz,
            }));
            p.onDealt(r, tgt, 26, 'tempest', 5);
          }
        }
        break;
      case 'ice':
        g.fx.emit(px, py + 3, pz, { count: 10, speed: 12, dir: [0, -0.2, 0], spread: 1, life: [0.8, 1.4], size: [0.15, 0.3], sizeEnd: 1, color: 0xffffff, alpha: 0.9, additive: false, jitter: 8, drag: 0.5 });
        g.fx.emit(px, py + 1, pz, { count: 4, speed: 8, dir: [0, 0.1, 0], spread: 1, life: [0.6, 1], size: [1, 2], sizeEnd: 3, color: 0xe8fbff, alpha: 0.25, additive: false, jitter: 6 });
        if (this.furyTick <= 0 && this.furyCount < 4) {
          this.furyTick = 0.45;
          this.furyCount++;
          aoe(16, 22, this.furyCount >= 3 ? 200 : 45, 0, 2, 'blizzard');
          g.fx.ring(px, py, pz, 1, 16, 0xbff4ff, 0.6);
          g.sfx('iceCrack', px, py, pz, 0.7);
        }
        break;
      case 'earth':
        if (this.furyTick <= 0 && this.furyCount < 4) {
          this.furyTick = 0.45;
          this.furyCount++;
          aoe(15, 36, 0, 9, 10, 'cataclysm');
          g.fx.ring(px, py, pz, 1, 15, 0xc8b890, 0.5);
          for (let i = 0; i < 14; i++) {
            const a = rng.next() * Math.PI * 2;
            const r = 2 + rng.next() * 12;
            const x = px + Math.sin(a) * r;
            const z = pz + Math.cos(a) * r;
            g.fx.rocks(x, g.col.groundAt(x, z, py + 5, 0.1).y + 0.2, z, 6);
          }
          g.sfx('rumble', px, py, pz, 0.7, 1);
          g.sfx('pound', px, py, pz);
          g.shake(0.7, 0.4);
        }
        break;
    }
  }
}
