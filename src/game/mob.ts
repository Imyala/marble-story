/**
 * Monster entity and AI.
 *
 * The AI is deliberately simple — monsters are terrain you fight through, not
 * opponents that outthink you. Complexity here would fight the genre: the
 * player's attention belongs on positioning and their own rotation.
 *
 * See docs/DESIGN.md §7.1.
 */
import type { Rng } from '../engine/rng';
import type { MobDef } from '../data/mobs';
import { Body, MoveIntent, Terrain, applyKnockback, createBody, stepBody } from '../physics/body';
import { fhYAt } from '../physics/foothold';

export type MobState = 'idle' | 'move' | 'chase' | 'stagger' | 'dying';

export interface MobTarget {
  x: number;
  y: number;
  alive: boolean;
}

let nextMobId = 1;

export function resetMobIds(value = 1): void {
  nextMobId = value;
}

export class Mob {
  readonly id = nextMobId++;
  readonly def: MobDef;
  readonly body: Body;
  /** Index of the spawn point that owns this monster. */
  readonly spawnIndex: number;

  hp: number;
  mp: number;
  state: MobState = 'idle';
  /** Seconds remaining in the current AI state. */
  stateTimer = 0;
  /** Counts down from 1 to 0 for the white hit-flash. */
  flash = 0;
  /** Death fade, 1 → 0. */
  fade = 1;
  /** Set once the death drop has been handed to the world. */
  dropsClaimed = false;
  /** Direction the AI currently wants to walk. */
  private moveDir = 0;
  /** Debounce so a jumping monster doesn't jump every tick. */
  private jumpCooldown = 0;
  /** Time since the monster last damaged the player, for touch-damage pacing. */
  touchCooldown = 0;

  constructor(def: MobDef, x: number, y: number, spawnIndex: number, rng: Rng) {
    this.def = def;
    this.spawnIndex = spawnIndex;
    this.hp = def.maxHp;
    this.mp = def.maxMp;
    this.body = createBody({
      x, y,
      width: def.width,
      height: def.height,
      flying: def.move === 'fly',
      speedStat: def.speed,
      jumpStat: 100,
    });
    this.body.facing = rng.sign();
    this.stateTimer = rng.range(0.4, 2.2);
  }

  get alive(): boolean {
    return this.state !== 'dying';
  }

  /** True once the death animation has finished and the mob can be removed. */
  get removable(): boolean {
    return this.state === 'dying' && this.fade <= 0;
  }

  update(dt: number, terrain: Terrain, target: MobTarget | null, rng: Rng): void {
    this.flash = Math.max(0, this.flash - dt * 6);
    this.touchCooldown = Math.max(0, this.touchCooldown - dt);
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);

    if (this.state === 'dying') {
      this.fade = Math.max(0, this.fade - dt * 2.2);
      this.body.vx *= 0.9;
      stepBody(this.body, { moveX: 0, moveY: 0, jump: false }, dt, terrain);
      return;
    }

    this.stateTimer -= dt;

    if (this.state === 'stagger') {
      if (this.body.staggerTime <= 0) this.state = this.def.aggro === 'aggressive' ? 'chase' : 'idle';
      stepBody(this.body, { moveX: 0, moveY: 0, jump: false }, dt, terrain);
      return;
    }

    const intent = this.think(dt, target, rng);
    stepBody(this.body, intent, dt, terrain);

    // A monster that somehow left the map is returned to its spawn height.
    if (this.body.fellOut) {
      this.body.fellOut = false;
      this.body.y = terrain.bounds.top + 40;
      this.body.vy = 0;
    }
  }

  private think(dt: number, target: MobTarget | null, rng: Rng): MoveIntent {
    const def = this.def;

    // Aggressive monsters lock on when the player comes close enough.
    if (def.aggro === 'aggressive' && target?.alive && def.move !== 'stationary') {
      const dx = target.x - this.body.x;
      const dy = target.y - this.body.y;
      if (Math.abs(dx) < def.aggroRange && Math.abs(dy) < def.aggroRange * 0.8) {
        this.state = 'chase';
        const moveX = Math.abs(dx) < 12 ? 0 : Math.sign(dx);
        const moveY = def.move === 'fly' ? clampSign(dy, 14) : 0;
        let jump = false;
        // Jumpers hop toward a target above them.
        if (def.move === 'jump' && dy < -30 && this.jumpCooldown <= 0 && this.body.fh) {
          jump = true;
          this.jumpCooldown = 1.4;
        }
        return { moveX, moveY, jump };
      }
      if (this.state === 'chase') {
        this.state = 'idle';
        this.stateTimer = rng.range(0.5, 1.5);
      }
    }

    if (def.move === 'stationary') {
      // Stationary monsters only turn to face their target.
      if (target?.alive) this.body.facing = target.x < this.body.x ? -1 : 1;
      return { moveX: 0, moveY: 0, jump: false };
    }

    if (this.stateTimer <= 0) {
      if (this.state === 'move') {
        this.state = 'idle';
        this.stateTimer = rng.range(0.8, 2.6);
        this.moveDir = 0;
      } else {
        this.state = 'move';
        this.stateTimer = rng.range(1.2, 3.4);
        this.moveDir = rng.sign();
      }
    }

    if (def.move === 'fly') {
      // Flyers bob rather than walk, and drift within the map.
      const bob = Math.sin((this.body.animTime + this.id) * 1.6);
      return { moveX: this.moveDir, moveY: bob * 0.5, jump: false };
    }

    // Turn around at the end of the foothold chain instead of walking off.
    if (this.moveDir !== 0 && this.body.fh) {
      const fh = this.body.fh;
      const edge = this.moveDir > 0 ? Math.max(fh.x1, fh.x2) : Math.min(fh.x1, fh.x2);
      const linked = this.moveDir > 0 ? fh.next : fh.prev;
      if (linked === 0 && Math.abs(this.body.x - edge) < 14) {
        this.moveDir *= -1;
      }
    }

    let jump = false;
    if (def.move === 'jump' && this.moveDir !== 0 && this.jumpCooldown <= 0 && this.body.fh) {
      if (rng.chance(dt * 0.8)) {
        jump = true;
        this.jumpCooldown = 1.2;
      }
    }
    return { moveX: this.moveDir, moveY: 0, jump };
  }

  /**
   * Apply damage. Returns true if this hit killed the monster.
   *
   * Staggering only happens when a single hit is big enough — which is why
   * weak, fast attacks let a monster keep walking into you while a heavy blow
   * buys you space.
   */
  takeDamage(amount: number, fromX: number): boolean {
    if (this.state === 'dying') return false;
    this.hp -= amount;
    this.flash = 1;

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dying';
      this.body.state = 'dead';
      this.body.vx = (this.body.x < fromX ? -1 : 1) * 60;
      this.body.vy = -140;
      this.body.fh = null;
      return true;
    }

    if (amount >= this.def.knockbackHp && !this.def.boss) {
      applyKnockback(this.body, fromX, 0.55);
      this.state = 'stagger';
      this.stateTimer = 0.4;
    } else if (this.def.aggro === 'aggressive' || this.def.move !== 'stationary') {
      // Even passive monsters turn on you once you hit them.
      this.state = 'chase';
    }
    return false;
  }

  /** Axis-aligned bounds used for attack and touch collision. */
  bounds(): { left: number; right: number; top: number; bottom: number } {
    const hw = this.def.width * 0.5;
    return {
      left: this.body.x - hw,
      right: this.body.x + hw,
      top: this.body.y - this.def.height,
      bottom: this.body.y,
    };
  }

  /** Where a floating HP bar or damage number should appear. */
  headY(): number {
    return this.body.y - this.def.height - 10;
  }
}

/** Place a monster exactly on the foothold under its spawn point. */
export function snapToGround(mob: Mob, terrain: Terrain): void {
  const fh = terrain.footholds.groundBelow(mob.body.x, mob.body.y - 40, mob.body.layer);
  if (fh && !mob.body.flying) {
    mob.body.fh = fh;
    mob.body.y = fhYAt(fh, mob.body.x);
    mob.body.state = 'stand';
  }
}

function clampSign(v: number, deadzone: number): number {
  if (Math.abs(v) < deadzone) return 0;
  return Math.sign(v);
}
