/**
 * Stat model: four base stats, everything else derived.
 *
 * A character's effective stats are base (AP-allocated) + equipment + buffs.
 * Keeping that as three separate additive layers means a buff expiring or a
 * weapon being unequipped is a recompute, never a stateful undo.
 *
 * See docs/DESIGN.md §3.
 */
import { getJob, StatName } from '../data/jobs';

/** Every stat an item, buff, or passive can contribute. */
export interface StatBlock {
  str: number;
  dex: number;
  int: number;
  luk: number;
  /** Flat max-HP / max-MP bonus. */
  hp: number;
  mp: number;
  watk: number;
  matk: number;
  wdef: number;
  mdef: number;
  acc: number;
  avoid: number;
  speed: number;
  jump: number;
  /** 0..1 chance of a critical hit. */
  critRate: number;
  /** Multiplier applied on a critical, e.g. 1.4 = +40%. */
  critDamage: number;
  /** 0..1 fraction of the target's defense ignored. */
  ignoreDef: number;
  /** Multiplier against bosses. */
  bossDamage: number;
}

export function emptyStats(): StatBlock {
  return {
    str: 0, dex: 0, int: 0, luk: 0,
    hp: 0, mp: 0,
    watk: 0, matk: 0, wdef: 0, mdef: 0,
    acc: 0, avoid: 0, speed: 0, jump: 0,
    critRate: 0, critDamage: 0, ignoreDef: 0, bossDamage: 0,
  };
}

export function addStats(into: StatBlock, from: Partial<StatBlock>): StatBlock {
  for (const k of Object.keys(into) as (keyof StatBlock)[]) {
    into[k] += from[k] ?? 0;
  }
  return into;
}

export function sumStats(blocks: Iterable<Partial<StatBlock>>): StatBlock {
  const total = emptyStats();
  for (const b of blocks) addStats(total, b);
  return total;
}

/** Base AP-allocated stats. Every character starts here. */
export interface BaseStats {
  str: number;
  dex: number;
  int: number;
  luk: number;
}

export const STARTING_STATS: BaseStats = { str: 12, dex: 5, int: 4, luk: 4 };

/** The four base stats a level-1 character starts with, plus AP each level. */
export const MIN_STAT = 1;
export const MAX_STAT = 999;

/**
 * Accuracy from stats. DEX dominates, LUK contributes half.
 * Accuracy is the stat that gates players out of maps more harshly than
 * damage does — missing feels far worse than hitting for a little.
 */
export function accuracyFrom(dex: number, luk: number): number {
  return Math.floor(dex * 0.8 + luk * 0.5);
}

/** Avoidability from stats. LUK dominates. */
export function avoidFrom(luk: number, dex: number): number {
  return Math.floor(luk * 0.5 + dex * 0.25);
}

export interface DerivedStats {
  maxHp: number;
  maxMp: number;
  str: number;
  dex: number;
  int: number;
  luk: number;
  watk: number;
  matk: number;
  wdef: number;
  mdef: number;
  accuracy: number;
  avoid: number;
  speed: number;
  jump: number;
  critRate: number;
  critDamage: number;
  ignoreDef: number;
  bossDamage: number;
}

export interface DeriveInput {
  level: number;
  jobId: number;
  base: BaseStats;
  /** Sum of equipment stats. */
  equip: StatBlock;
  /** Sum of active buff stats. */
  buffs: StatBlock;
  /** HP/MP pools accumulated from levelling, before flat bonuses. */
  baseHp: number;
  baseMp: number;
}

export function deriveStats(input: DeriveInput): DerivedStats {
  const { base, equip, buffs } = input;
  const str = base.str + equip.str + buffs.str;
  const dex = base.dex + equip.dex + buffs.dex;
  const int = base.int + equip.int + buffs.int;
  const luk = base.luk + equip.luk + buffs.luk;

  // INT contributes to the MP pool, which is why mages build INT for both
  // damage and resource at once.
  const intMp = Math.floor(int * 0.6);

  return {
    maxHp: Math.max(1, input.baseHp + equip.hp + buffs.hp),
    maxMp: Math.max(1, input.baseMp + intMp + equip.mp + buffs.mp),
    str, dex, int, luk,
    watk: equip.watk + buffs.watk,
    matk: equip.matk + buffs.matk,
    wdef: equip.wdef + buffs.wdef,
    mdef: equip.mdef + buffs.mdef,
    accuracy: accuracyFrom(dex, luk) + equip.acc + buffs.acc,
    avoid: avoidFrom(luk, dex) + equip.avoid + buffs.avoid,
    speed: 100 + equip.speed + buffs.speed,
    jump: 100 + equip.jump + buffs.jump,
    critRate: equip.critRate + buffs.critRate,
    critDamage: 1.4 + equip.critDamage + buffs.critDamage,
    ignoreDef: Math.min(0.9, equip.ignoreDef + buffs.ignoreDef),
    bossDamage: 1 + equip.bossDamage + buffs.bossDamage,
  };
}

/** Value of the stat a job's weapons scale from. */
export function statValue(stats: DerivedStats, which: StatName): number {
  return stats[which];
}

/** Average HP gained per level for a job — used for projections and the UI. */
export function averageHpGain(jobId: number): number {
  const j = getJob(jobId);
  return (j.hpGain[0] + j.hpGain[1]) / 2;
}

export function averageMpGain(jobId: number): number {
  const j = getJob(jobId);
  return (j.mpGain[0] + j.mpGain[1]) / 2;
}
