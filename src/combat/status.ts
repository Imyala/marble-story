import type { DamageType, Element, Hit } from '../game/types';

export type Reaction = 'shatter' | 'overload' | 'steam';

export const BUILDUP_MAX = 100;

export const STATUS_DURATION = {
  burn: 4,
  shock: 1.6,
  freeze: 3.2,
  steam: 1.8,
} as const;

/** Per-second burn damage as a fraction of the hit that ignited it, floored. */
export const BURN_DPS = 6;

/**
 * Elemental state on a target: buildup meters that fill as hits land and
 * trigger a status when full, plus the timers of active statuses.
 *
 *   fire      -> Burning   damage over time, some enemies panic
 *   lightning -> Shocked   stunned, takes +25% damage
 *   ice       -> Frozen    immobile; a heavy hit shatters it
 *   earth     -> no status, but huge stagger (handled by poise)
 */
export class Status {
  heat = 0;
  charge = 0;
  chill = 0;
  burn = 0;
  shock = 0;
  frozen = 0;
  steam = 0;
  /** Multipliers on buildup per element; 0 = immune. */
  resist: Record<Element, number>;
  private burnTick = 0;

  constructor(resist: Partial<Record<Element, number>> = {}) {
    this.resist = { fire: 1, lightning: 1, ice: 1, earth: 1, ...resist };
  }

  get stunned(): boolean {
    return this.shock > 0 || this.frozen > 0 || this.steam > 0;
  }

  /** Adds buildup; returns the status that triggered, if any. */
  build(el: DamageType, amount: number): 'burn' | 'shock' | 'freeze' | null {
    if (el === 'physical' || el === 'shadow' || el === 'earth') return null;
    const r = this.resist[el];
    if (r <= 0) return null;
    const a = amount * r;
    if (el === 'fire') {
      if (this.frozen > 0) {
        // Fire thaws ice rather than igniting it.
        this.frozen = Math.max(0, this.frozen - a * 0.05);
        return null;
      }
      this.heat += a;
      if (this.heat >= BUILDUP_MAX) {
        this.heat = 0;
        this.burn = STATUS_DURATION.burn;
        return 'burn';
      }
    } else if (el === 'lightning') {
      this.charge += a;
      if (this.charge >= BUILDUP_MAX) {
        this.charge = 0;
        this.shock = STATUS_DURATION.shock;
        return 'shock';
      }
    } else if (el === 'ice') {
      this.chill += a;
      if (this.chill >= BUILDUP_MAX) {
        this.chill = 0;
        this.frozen = STATUS_DURATION.freeze;
        this.burn = 0;
        return 'freeze';
      }
    }
    return null;
  }

  /** Advances timers; returns burn damage dealt this step. */
  update(dt: number): number {
    const decay = 18 * dt;
    this.heat = Math.max(0, this.heat - decay);
    this.charge = Math.max(0, this.charge - decay);
    this.chill = Math.max(0, this.chill - decay * (this.frozen > 0 ? 0 : 1));
    this.shock = Math.max(0, this.shock - dt);
    this.frozen = Math.max(0, this.frozen - dt);
    this.steam = Math.max(0, this.steam - dt);
    let dmg = 0;
    if (this.burn > 0) {
      this.burn = Math.max(0, this.burn - dt);
      this.burnTick += dt;
      while (this.burnTick >= 0.5) {
        this.burnTick -= 0.5;
        dmg += BURN_DPS * 0.5;
      }
    } else this.burnTick = 0;
    return dmg;
  }

  clear(): void {
    this.heat = this.charge = this.chill = 0;
    this.burn = this.shock = this.frozen = this.steam = 0;
  }
}

/** Which elemental reaction, if any, this hit sets off on this target. */
export function reactionFor(s: Status, hit: Hit): Reaction | null {
  if (s.frozen > 0 && (hit.heavy || hit.type === 'earth')) return 'shatter';
  if (s.shock > 0 && hit.type === 'fire') return 'overload';
  if (s.burn > 0 && hit.type === 'lightning') return 'overload';
  if (s.burn > 0 && hit.type === 'ice') return 'steam';
  return null;
}

/** Consumes the statuses a reaction uses up. */
export function consumeReaction(s: Status, r: Reaction): void {
  if (r === 'shatter') {
    s.frozen = 0;
    s.chill = 0;
  } else if (r === 'overload') {
    s.shock = 0;
    s.burn = 0;
    s.charge = 0;
  } else {
    s.burn = 0;
    s.heat = 0;
    s.steam = STATUS_DURATION.steam;
  }
}

export const REACTION_INFO: Record<Reaction, { name: string; color: number; radius: number; damage: number }> = {
  shatter: { name: 'SHATTER', color: 0xbff4ff, radius: 0, damage: 30 },
  overload: { name: 'OVERLOAD', color: 0xffd36a, radius: 3.5, damage: 28 },
  steam: { name: 'STEAM BURST', color: 0xe8f4ff, radius: 4, damage: 12 },
};

/**
 * Final damage for a hit. `resist` holds per-type multipliers (weakness > 1,
 * resistance < 1, immunity 0). Shocked targets take 25% more.
 */
export function computeDamage(
  base: number, type: DamageType, resist: Partial<Record<DamageType, number>>, s: Status | null,
  reaction: Reaction | null,
): number {
  let d = base * (resist[type] ?? 1);
  if (s && s.shock > 0) d *= 1.25;
  if (reaction === 'shatter') d = d * 2 + REACTION_INFO.shatter.damage;
  return Math.max(0, d);
}
