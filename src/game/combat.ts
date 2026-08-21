/**
 * The damage formula.
 *
 * Everything in the game is balanced against this file, so it is written to
 * be readable and is unit-tested against a fixed RNG seed.
 *
 * The pipeline for a single hit (docs/DESIGN.md §5):
 *
 *   1. roll a base damage in [min, max]
 *   2. scale by the skill's damage percent
 *   3. subtract defense (reduced by ignore-defense)
 *   4. apply the elemental modifier
 *   5. apply critical multiplier
 *   6. apply the level-difference penalty
 *   7. floor, clamp to at least 1
 */
import type { Rng } from '../engine/rng';

export type Element = 'neutral' | 'fire' | 'ice' | 'lightning' | 'poison' | 'holy' | 'dark';
export type Resistance = 'immune' | 'strong' | 'normal' | 'weak';

export type WeaponType =
  | 'none'
  | 'oneHandSword' | 'oneHandAxe' | 'oneHandBlunt'
  | 'twoHandSword' | 'twoHandAxe' | 'twoHandBlunt'
  | 'spear' | 'polearm'
  | 'dagger' | 'claw'
  | 'bow' | 'crossbow'
  | 'knuckle' | 'gun'
  | 'wand' | 'staff';

/**
 * Weapon class multipliers applied to the primary stat.
 *
 * Two-handed weapons hit harder per swing; bows and claws multiply lower
 * because they attack faster and at range. Bare hands are the floor.
 */
export const WEAPON_MULTIPLIER: Record<WeaponType, number> = {
  none: 3.0,
  oneHandSword: 4.0, oneHandAxe: 4.4, oneHandBlunt: 4.4,
  twoHandSword: 4.6, twoHandAxe: 4.8, twoHandBlunt: 4.8,
  spear: 4.9, polearm: 5.0,
  dagger: 4.0, claw: 3.6,
  bow: 3.4, crossbow: 3.6,
  knuckle: 4.8, gun: 3.6,
  wand: 3.6, staff: 3.6,
};

export const MAGIC_WEAPONS: ReadonlySet<WeaponType> = new Set<WeaponType>(['wand', 'staff']);

export interface AttackerProfile {
  level: number;
  /** Value of the weapon's primary scaling stat. */
  primary: number;
  /** Value of the weapon's secondary scaling stat. */
  secondary: number;
  weapon: WeaponType;
  watk: number;
  matk: number;
  /**
   * Weapon mastery as a fraction, 0.1 (untrained) .. 0.95.
   * Mastery raises MIN damage only — it never raises your ceiling. This is
   * why mastery skills feel so good: your damage stops being a coin flip.
   */
  mastery: number;
  accuracy: number;
  critRate: number;
  critDamage: number;
  ignoreDef: number;
  bossDamage: number;
}

export interface DefenderProfile {
  level: number;
  wdef: number;
  mdef: number;
  avoid: number;
  resist: Partial<Record<Element, Resistance>>;
  isBoss: boolean;
}

export interface SkillHit {
  /** 100 = exactly a basic attack. */
  damagePercent: number;
  element: Element;
  /** Extra defense ignore from the skill itself, 0..1. */
  ignoreDef?: number;
  /** Skills with a built-in accuracy bonus (or malus). */
  accuracyBonus?: number;
}

export const BASIC_ATTACK: SkillHit = { damagePercent: 100, element: 'neutral' };

export interface DamageRange {
  min: number;
  max: number;
}

/**
 * Base damage range before any skill, defense, or element is applied.
 *
 * The mastery term multiplies only the primary-stat portion of the minimum,
 * matching the genre's behaviour where mastery tightens the spread from the
 * bottom up.
 */
export function damageRange(a: AttackerProfile): DamageRange {
  const isMagic = MAGIC_WEAPONS.has(a.weapon);
  const attack = isMagic ? a.matk : a.watk;
  const mult = WEAPON_MULTIPLIER[a.weapon];
  const mastery = clamp(a.mastery, 0.1, 0.95);

  const max = ((a.primary * mult + a.secondary) * attack) / 100;
  const min = ((a.primary * mult * 0.9 * mastery + a.secondary) * attack) / 100;
  return { min: Math.max(1, min), max: Math.max(1, max) };
}

/** Elemental modifier applied to damage. */
export function elementModifier(element: Element, resist: Partial<Record<Element, Resistance>>): number {
  if (element === 'neutral') return 1;
  switch (resist[element]) {
    case 'immune': return 0;
    case 'strong': return 0.5;
    case 'weak': return 1.5;
    default: return 1;
  }
}

/**
 * Damage penalty for attacking above your level. Attacking below your level
 * carries no damage bonus — the reward for over-levelling is safety, not
 * output (and the EXP modifier takes the reward back).
 */
export function damageLevelModifier(attackerLevel: number, defenderLevel: number): number {
  const gap = defenderLevel - attackerLevel;
  if (gap <= 0) return 1;
  return Math.max(0.25, 1 - gap * 0.03);
}

/**
 * Chance for an attack to connect at all.
 *
 * Being under-levelled costs accuracy on top of damage, which is what makes
 * a too-hard map feel impossible rather than merely slow.
 */
export function hitChance(a: AttackerProfile, d: DefenderProfile, bonus = 0): number {
  const levelDelta = Math.max(0, d.level - a.level);
  const raw = (a.accuracy + bonus) / (d.avoid * 1.84 + 1) - levelDelta * 0.05;
  return clamp(raw, 0.05, 1);
}

export interface HitResult {
  damage: number;
  crit: boolean;
  miss: boolean;
}

export const MISS: HitResult = { damage: 0, crit: false, miss: true };

/** Resolve one hit of one attack. Multi-hit skills call this per hit. */
export function resolveHit(
  a: AttackerProfile,
  d: DefenderProfile,
  skill: SkillHit,
  rng: Rng,
): HitResult {
  if (!rng.chance(hitChance(a, d, skill.accuracyBonus ?? 0))) return MISS;

  const range = damageRange(a);
  let dmg = rng.range(range.min, range.max);

  dmg *= skill.damagePercent / 100;

  const isMagic = MAGIC_WEAPONS.has(a.weapon);
  const def = isMagic ? d.mdef : d.wdef;
  const ignore = clamp(a.ignoreDef + (skill.ignoreDef ?? 0), 0, 0.95);
  dmg -= def * 0.5 * (1 - ignore);

  dmg *= elementModifier(skill.element, d.resist);

  const crit = rng.chance(a.critRate);
  if (crit) dmg *= a.critDamage;

  if (d.isBoss) dmg *= a.bossDamage;

  dmg *= damageLevelModifier(a.level, d.level);

  // An elemental immunity is the one case where a hit truly does nothing.
  if (elementModifier(skill.element, d.resist) === 0) {
    return { damage: 0, crit: false, miss: false };
  }

  return { damage: Math.max(1, Math.floor(dmg)), crit, miss: false };
}

/** Resolve a full attack: `attackCount` hits against one target. */
export function resolveAttack(
  a: AttackerProfile,
  d: DefenderProfile,
  skill: SkillHit,
  attackCount: number,
  rng: Rng,
): HitResult[] {
  const hits: HitResult[] = [];
  for (let i = 0; i < attackCount; i++) hits.push(resolveHit(a, d, skill, rng));
  return hits;
}

export function totalDamage(hits: readonly HitResult[]): number {
  let sum = 0;
  for (const h of hits) sum += h.damage;
  return sum;
}

/* ---------------------------------------------------- damage to players -- */

export interface IncomingAttack {
  /** Monster's physical or magic attack stat. */
  attack: number;
  magic: boolean;
  level: number;
  element?: Element;
  /** Multiplier for a special attack; touch damage is 1. */
  multiplier?: number;
}

export interface PlayerDefense {
  level: number;
  wdef: number;
  mdef: number;
  avoid: number;
  /** Fraction of damage reduced by buffs/passives, 0..1. */
  damageReduction?: number;
}

/**
 * Damage a monster deals to the player.
 *
 * Touch damage — simply walking into a monster — is the dominant source of
 * incoming damage in this genre, so this path matters as much as the outgoing
 * one. Being under-levelled increases what you take, which is the other half
 * of the level leash.
 */
export function resolveIncoming(
  atk: IncomingAttack,
  def: PlayerDefense,
  rng: Rng,
): HitResult {
  // Player avoidance. Higher-level monsters are harder to dodge.
  const levelDelta = Math.max(0, atk.level - def.level);
  const dodge = clamp(def.avoid / (def.avoid + 40 + levelDelta * 6), 0, 0.6);
  if (rng.chance(dodge)) return MISS;

  const base = atk.attack * rng.range(0.85, 1.15) * (atk.multiplier ?? 1);
  const armour = atk.magic ? def.mdef * 0.6 : def.wdef * 0.5;
  let dmg = base - armour;

  // Under-levelled players take a surcharge.
  dmg *= 1 + levelDelta * 0.02;
  dmg *= 1 - clamp(def.damageReduction ?? 0, 0, 0.9);

  return { damage: Math.max(1, Math.floor(dmg)), crit: false, miss: false };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
