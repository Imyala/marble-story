/**
 * The movement state machine shared by the player and every mob.
 *
 * States: stand / walk / jump / fall / prone / climb / stagger / dead.
 * See docs/DESIGN.md §2.2 for the transition diagram.
 *
 * Positions are at the entity's FEET (bottom-centre), matching foothold y,
 * so `y` is directly comparable to the surface it stands on.
 */
import {
  AIR_ACCEL, AIR_DRAG, CLIMB_SPEED, COYOTE_TIME, DROP_THROUGH_TIME, GRAVITY,
  JUMP_CAP, JUMP_SPEED, KNOCKBACK_VX, KNOCKBACK_VY, ROPE_SPEED_SCALE, SPEED_CAP,
  SPEED_MIN, STAGGER_TIME, TERMINAL_VY, WALK_ACCEL, WALK_DRAG, WALK_SPEED,
} from './constants';
import { Foothold, FootholdSet, fhYAt } from './foothold';
import { LadderRope, ladderAt, ladderBelow } from './ladder';

export type MoveState = 'stand' | 'walk' | 'jump' | 'fall' | 'prone' | 'climb' | 'dead';

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Terrain {
  footholds: FootholdSet;
  ladders: readonly LadderRope[];
  bounds: Rect;
}

export interface MoveIntent {
  /** -1 left, 0 none, 1 right. */
  moveX: number;
  /** -1 up, 0 none, 1 down. */
  moveY: number;
  /** True only on the tick the jump key went down. */
  jump: boolean;
}

export const NO_INTENT: MoveIntent = { moveX: 0, moveY: 0, jump: false };

export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Previous position, for render interpolation. */
  px: number;
  py: number;
  facing: 1 | -1;
  state: MoveState;
  /** Foothold underfoot, null while airborne. */
  fh: Foothold | null;
  layer: number;
  ladder: LadderRope | null;
  width: number;
  height: number;
  speedStat: number;
  jumpStat: number;
  /** Flying entities ignore footholds entirely. */
  flying: boolean;
  /** Counts down after a knockback; movement input is ignored while > 0. */
  staggerTime: number;
  /** Counts down after taking damage; further hits are ignored while > 0. */
  iframe: number;
  /** Counts down after a down-jump; footholds are ignored while > 0. */
  dropTimer: number;
  /** Remaining coyote time after walking off a ledge. */
  coyote: number;
  /** True once the entity has fallen out of the bottom of the map. */
  fellOut: boolean;
  /** Accumulates while moving, drives animation frame selection. */
  animTime: number;
}

export interface BodyOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  layer?: number;
  flying?: boolean;
  speedStat?: number;
  jumpStat?: number;
}

export function createBody(o: BodyOptions): Body {
  return {
    x: o.x, y: o.y, vx: 0, vy: 0, px: o.x, py: o.y,
    facing: 1,
    state: 'fall',
    fh: null,
    layer: o.layer ?? 0,
    ladder: null,
    width: o.width ?? 26,
    height: o.height ?? 56,
    speedStat: o.speedStat ?? 100,
    jumpStat: o.jumpStat ?? 100,
    flying: o.flying ?? false,
    staggerTime: 0,
    iframe: 0,
    dropTimer: 0,
    coyote: 0,
    fellOut: false,
    animTime: 0,
  };
}

export function isGrounded(b: Body): boolean {
  return b.fh !== null && (b.state === 'stand' || b.state === 'walk' || b.state === 'prone');
}

export function walkSpeedOf(b: Body): number {
  return WALK_SPEED * (clamp(b.speedStat, SPEED_MIN, SPEED_CAP) / 100);
}

export function jumpSpeedOf(b: Body): number {
  return JUMP_SPEED * (clamp(b.jumpStat, 50, JUMP_CAP) / 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function approach(current: number, target: number, rate: number): number {
  if (current < target) return Math.min(current + rate, target);
  if (current > target) return Math.max(current - rate, target);
  return current;
}

/** Knock an entity away from an attacker. The main cause of death in the genre. */
export function applyKnockback(b: Body, fromX: number, strength = 1): void {
  if (b.state === 'dead') return;
  const dir = b.x < fromX ? -1 : 1;
  detachLadder(b);
  b.vx = KNOCKBACK_VX * strength * dir;
  b.vy = KNOCKBACK_VY * strength;
  b.fh = null;
  b.state = 'jump';
  b.staggerTime = STAGGER_TIME;
}

export function detachLadder(b: Body): void {
  if (b.ladder) {
    b.ladder = null;
    if (b.state === 'climb') b.state = 'fall';
  }
}

export function attachLadder(b: Body, ladder: LadderRope): void {
  b.ladder = ladder;
  b.state = 'climb';
  b.x = ladder.x;
  b.vx = 0;
  b.vy = 0;
  b.fh = null;
  b.y = clamp(b.y, ladder.y1, ladder.y2);
}

/** Advance one physics tick. */
export function stepBody(b: Body, intentIn: MoveIntent, dt: number, t: Terrain): void {
  b.px = b.x;
  b.py = b.y;
  b.iframe = Math.max(0, b.iframe - dt);
  b.dropTimer = Math.max(0, b.dropTimer - dt);
  b.staggerTime = Math.max(0, b.staggerTime - dt);

  const controllable = b.staggerTime <= 0 && b.state !== 'dead';
  const intent = controllable ? intentIn : NO_INTENT;

  if (b.state === 'dead') {
    stepAir(b, NO_INTENT, dt, t);
    clampToBounds(b, t);
    return;
  }

  if (b.state === 'climb' && b.ladder) {
    stepClimb(b, intent, dt, t);
    clampToBounds(b, t);
    return;
  }

  if (b.flying) {
    stepFly(b, intent, dt, t);
    clampToBounds(b, t);
    return;
  }

  if (intent.moveX !== 0) b.facing = intent.moveX > 0 ? 1 : -1;

  if (b.fh) stepGround(b, intent, dt, t);
  else stepAir(b, intent, dt, t);

  clampToBounds(b, t);
}

function stepGround(b: Body, intent: MoveIntent, dt: number, t: Terrain): void {
  b.coyote = COYOTE_TIME;

  // Grab a ladder that overlaps us, or step down onto one just below our feet.
  if (intent.moveY < 0) {
    const l = ladderAt(t.ladders, b.x, b.y, b.layer);
    if (l) { attachLadder(b, l); return; }
  } else if (intent.moveY > 0) {
    const l = ladderBelow(t.ladders, b.x, b.y, b.layer);
    if (l) { attachLadder(b, l); b.y = l.y1 + 6; return; }
  }

  // Down + Jump drops through the platform. The timer stops us instantly
  // re-landing on the foothold we just left.
  if (intent.jump && intent.moveY > 0) {
    b.fh = null;
    b.state = 'fall';
    b.y += 4;
    b.vy = 60;
    b.dropTimer = DROP_THROUGH_TIME;
    return;
  }

  if (intent.jump) {
    b.vy = -jumpSpeedOf(b);
    b.fh = null;
    b.state = 'jump';
    return;
  }

  const proning = intent.moveY > 0 && intent.moveX === 0;
  const target = proning ? 0 : intent.moveX * walkSpeedOf(b);
  const rate = (target === 0 ? WALK_DRAG : WALK_ACCEL) * dt;
  b.vx = approach(b.vx, target, rate);

  const nextX = t.footholds.clampHorizontal(
    b.x, b.x + b.vx * dt, b.y - b.height * 0.5, b.layer, b.width * 0.5,
  );
  if (nextX !== b.x + b.vx * dt) b.vx = 0;

  const result = t.footholds.walk(b.fh!, nextX);
  b.x = result.x;
  if (result.blocked) b.vx = 0;

  if (!result.fh) {
    // Ran off the end of the chain.
    b.fh = null;
    b.state = 'fall';
    b.vy = 0;
    return;
  }

  b.fh = result.fh;
  b.y = fhYAt(result.fh, b.x);
  b.state = proning ? 'prone' : Math.abs(b.vx) > 4 ? 'walk' : 'stand';
  if (b.state === 'walk') b.animTime += dt;
}

function stepAir(b: Body, intent: MoveIntent, dt: number, t: Terrain): void {
  b.coyote = Math.max(0, b.coyote - dt);

  // Ropes and ladders can be grabbed mid-air.
  if (intent.moveY < 0 && b.state !== 'dead') {
    const l = ladderAt(t.ladders, b.x, b.y, b.layer);
    if (l) { attachLadder(b, l); return; }
  }

  b.vy = Math.min(b.vy + GRAVITY * dt, TERMINAL_VY);

  if (intent.moveX !== 0) {
    b.vx = approach(b.vx, intent.moveX * walkSpeedOf(b), AIR_ACCEL * dt);
  } else {
    b.vx = approach(b.vx, 0, AIR_DRAG * dt);
  }

  const desiredX = b.x + b.vx * dt;
  const nextX = t.footholds.clampHorizontal(
    b.x, desiredX, b.y - b.height * 0.5, b.layer, b.width * 0.5,
  );
  if (nextX !== desiredX) b.vx = 0;
  b.x = nextX;

  const y0 = b.y;
  b.y += b.vy * dt;

  if (b.vy > 0 && b.dropTimer <= 0) {
    const landed = t.footholds.findLanding(b.x, y0, b.y, b.layer);
    if (landed) {
      b.fh = landed;
      b.y = fhYAt(landed, b.x);
      b.vy = 0;
      b.state = b.state === 'dead' ? 'dead' : 'stand';
      b.coyote = COYOTE_TIME;
      return;
    }
  }

  if (b.state !== 'dead') b.state = b.vy < 0 ? 'jump' : 'fall';
}

function stepClimb(b: Body, intent: MoveIntent, dt: number, t: Terrain): void {
  const l = b.ladder!;
  b.x = l.x;
  b.vx = 0;
  b.vy = 0;

  // Jumping off with a direction held launches you sideways; without one you
  // simply let go.
  if (intent.jump) {
    detachLadder(b);
    if (intent.moveX !== 0) {
      b.facing = intent.moveX > 0 ? 1 : -1;
      b.vx = intent.moveX * walkSpeedOf(b) * 0.95;
      b.vy = -jumpSpeedOf(b) * 0.78;
      b.state = 'jump';
    } else {
      b.state = 'fall';
    }
    return;
  }

  if (intent.moveY !== 0) {
    const speed = CLIMB_SPEED * (l.isLadder ? 1 : ROPE_SPEED_SCALE);
    b.y += intent.moveY * speed * dt;
    b.animTime += dt;
  }

  // Off the top: step onto the platform above.
  if (b.y <= l.y1) {
    b.y = l.y1;
    detachLadder(b);
    const fh = t.footholds.groundBelow(b.x, l.y1 - 2, b.layer);
    if (fh) {
      b.fh = fh;
      b.y = fhYAt(fh, b.x);
      b.state = 'stand';
    } else {
      b.state = 'fall';
    }
    return;
  }

  // Off the bottom: let go.
  if (b.y >= l.y2) {
    b.y = l.y2;
    detachLadder(b);
    const fh = t.footholds.groundBelow(b.x, b.y - 2, b.layer);
    if (fh && Math.abs(fhYAt(fh, b.x) - b.y) < 8) {
      b.fh = fh;
      b.y = fhYAt(fh, b.x);
      b.state = 'stand';
    } else {
      b.state = 'fall';
    }
  }
}

/** Flying mobs ignore footholds and drift inside the map bounds. */
function stepFly(b: Body, intent: MoveIntent, dt: number, t: Terrain): void {
  const speed = walkSpeedOf(b);
  b.vx = approach(b.vx, intent.moveX * speed, AIR_ACCEL * dt);
  b.vy = approach(b.vy, intent.moveY * speed * 0.7, AIR_ACCEL * dt);
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (intent.moveX !== 0) b.facing = intent.moveX > 0 ? 1 : -1;
  b.state = Math.abs(b.vx) > 4 || Math.abs(b.vy) > 4 ? 'walk' : 'stand';
  b.animTime += dt;
  b.y = clamp(b.y, t.bounds.top + 40, t.bounds.bottom - 20);
}

function clampToBounds(b: Body, t: Terrain): void {
  const half = b.width * 0.5;
  b.x = clamp(b.x, t.bounds.left + half, t.bounds.right - half);
  if (b.y > t.bounds.bottom + 260) b.fellOut = true;
}
