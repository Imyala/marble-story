/**
 * Equipment instances.
 *
 * A dropped weapon is not just an item id — it is a unique instance with its
 * own rolled stats and its own upgrade slots. Without this, equipment is a
 * linear power number and the entire item game evaporates: there is no reason
 * to compare two of the same sword, no reason to scroll, and no economy.
 *
 * See docs/DESIGN.md §8.3.
 */
import type { Rng } from '../engine/rng';
import { emptyStats, StatBlock } from './stats';
import { EquipSlot, ItemDef, ScrollInfo, getItem } from '../data/items';
import type { Branch } from '../data/jobs';

export interface EquipInstance {
  /** Unique per instance, assigned on creation. */
  uid: number;
  itemId: string;
  /** This instance's own stats, already including any successful scrolls. */
  stats: StatBlock;
  /** Upgrade slots the item was created with. */
  slotsTotal: number;
  /** Slots consumed by scrolls, successful or not. */
  slotsUsed: number;
  /** Number of scrolls that actually succeeded — shown as "+N" on the name. */
  upgrades: number;
}

let nextUid = 1;

export function resetUidCounter(value = 1): void {
  nextUid = value;
}

/** How far a dropped instance's stats may vary from the base item. */
export const STAT_VARIANCE = 0.1;

/**
 * Create an instance of an equip item.
 *
 * Stats are randomised around the base by ±10%, which is what makes a "clean"
 * drop worth inspecting rather than auto-selling.
 */
export function createInstance(
  itemIdOrDef: string | ItemDef,
  rng: Rng,
  opts: { perfect?: boolean } = {},
): EquipInstance {
  const def = typeof itemIdOrDef === 'string' ? getItem(itemIdOrDef) : itemIdOrDef;
  if (!def.equip) throw new Error(`item "${def.id}" is not equipment`);

  const stats = emptyStats();
  for (const [key, value] of Object.entries(def.equip.base) as [keyof StatBlock, number][]) {
    if (opts.perfect || value === 0) {
      stats[key] = value;
      continue;
    }
    // Fractional stats (crit rate, ignore def) must not be rounded to zero.
    const varied = value * rng.variance(STAT_VARIANCE);
    stats[key] = Math.abs(value) >= 1 ? Math.round(varied) : varied;
  }

  return {
    uid: nextUid++,
    itemId: def.id,
    stats,
    slotsTotal: def.equip.slots,
    slotsUsed: 0,
    upgrades: 0,
  };
}

export type ScrollResult = 'success' | 'fail' | 'destroyed' | 'no-slots' | 'wrong-slot';

/**
 * Apply a scroll. On failure the slot is consumed anyway — that is the whole
 * gamble, and it is where the economy actually lives.
 */
export function applyScroll(inst: EquipInstance, scroll: ScrollInfo, rng: Rng): ScrollResult {
  const def = getItem(inst.itemId);
  if (!def.equip) return 'wrong-slot';
  if (scroll.target !== 'any' && scroll.target !== def.equip.slot) return 'wrong-slot';
  if (inst.slotsUsed >= inst.slotsTotal) return 'no-slots';

  inst.slotsUsed++;

  if (rng.chance(scroll.successRate)) {
    for (const [key, value] of Object.entries(scroll.stats) as [keyof StatBlock, number][]) {
      inst.stats[key] += value;
    }
    // A chaos-style scroll carries no fixed stats and rerolls instead.
    if (Object.keys(scroll.stats).length === 0) chaosReroll(inst, rng);
    inst.upgrades++;
    return 'success';
  }

  if (scroll.destroyRate && rng.chance(scroll.destroyRate)) return 'destroyed';
  return 'fail';
}

/** Nudge every non-zero stat up or down — high variance, high stakes. */
function chaosReroll(inst: EquipInstance, rng: Rng): void {
  for (const key of Object.keys(inst.stats) as (keyof StatBlock)[]) {
    if (inst.stats[key] === 0) continue;
    const swing = rng.int(-5, 5);
    inst.stats[key] = Math.max(0, inst.stats[key] + swing);
  }
}

/** Display name including the upgrade count, e.g. "Iron Sword +4". */
export function instanceName(inst: EquipInstance): string {
  const def = getItem(inst.itemId);
  return inst.upgrades > 0 ? `${def.name} +${inst.upgrades}` : def.name;
}

export interface RequirementCheck {
  ok: boolean;
  /** Human-readable list of unmet requirements. */
  missing: string[];
}

export interface WearerProfile {
  level: number;
  str: number;
  dex: number;
  int: number;
  luk: number;
  branch: Branch;
}

/**
 * Requirements are checked against BASE stats in the real game (so you can't
 * wear an item only because the item itself grants the stat). We follow that:
 * callers pass base + non-this-item equipment.
 */
export function checkRequirements(itemId: string, wearer: WearerProfile): RequirementCheck {
  const def = getItem(itemId);
  const e = def.equip;
  const missing: string[] = [];
  if (!e) return { ok: false, missing: ['not equipment'] };

  if (wearer.level < e.reqLevel) missing.push(`Level ${e.reqLevel}`);
  if (e.reqStr && wearer.str < e.reqStr) missing.push(`STR ${e.reqStr}`);
  if (e.reqDex && wearer.dex < e.reqDex) missing.push(`DEX ${e.reqDex}`);
  if (e.reqInt && wearer.int < e.reqInt) missing.push(`INT ${e.reqInt}`);
  if (e.reqLuk && wearer.luk < e.reqLuk) missing.push(`LUK ${e.reqLuk}`);
  if (e.reqBranch && !e.reqBranch.includes(wearer.branch)) {
    missing.push(e.reqBranch.map(capitalise).join(' / ') + ' only');
  }
  return { ok: missing.length === 0, missing };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The physical equipment slots a character has.
 * Four ring slots, matching the genre's convention.
 */
export const EQUIPPED_SLOTS = [
  'hat', 'face', 'eye', 'earring',
  'overall', 'top', 'bottom', 'shoes', 'gloves', 'cape',
  'weapon', 'shield', 'pendant', 'belt', 'medal',
  'ring1', 'ring2', 'ring3', 'ring4',
] as const;

export type EquippedSlot = (typeof EQUIPPED_SLOTS)[number];

/** Which physical slot(s) an item's declared slot can occupy. */
export function candidateSlots(slot: EquipSlot): EquippedSlot[] {
  if (slot === 'ring') return ['ring1', 'ring2', 'ring3', 'ring4'];
  return [slot as EquippedSlot];
}
