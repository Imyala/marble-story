/**
 * Dropped items on the ground.
 *
 * Drops are physical objects that arc out of the corpse, land on a foothold,
 * and must be walked over and picked up. That friction is deliberate: it turns
 * clearing a map into a two-pass activity and gives the loot a moment of
 * presence instead of silently appearing in a log.
 *
 * See docs/DESIGN.md §7.2.
 */
import type { Rng } from '../engine/rng';
import type { MobDef } from '../data/mobs';
import { getItem, tryGetItem } from '../data/items';
import { EquipInstance, createInstance } from './equipment';
import { FootholdSet, fhYAt } from '../physics/foothold';
import { GRAVITY } from '../physics/constants';

/** How long a drop stays on the ground before vanishing. */
export const DROP_LIFETIME = 120;
/** Distance within which the player can pick a drop up. */
export const PICKUP_RANGE = 34;

export interface GroundItem {
  id: number;
  kind: 'meso' | 'stack' | 'equip';
  /** Item id for 'stack' and 'equip' drops. */
  itemId: string;
  /** Meso amount, or stack quantity. */
  qty: number;
  inst: EquipInstance | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  landed: boolean;
  /** Seconds since the drop spawned. */
  age: number;
  /** Bob phase so a pile of drops doesn't pulse in lockstep. */
  phase: number;
}

let nextDropId = 1;

export function resetDropIds(value = 1): void {
  nextDropId = value;
}

export interface RolledDrop {
  kind: 'meso' | 'stack' | 'equip';
  itemId: string;
  qty: number;
}

/**
 * Roll a monster's drop table. Every entry is an independent roll, so a lucky
 * kill can yield several rares at once — rare, and memorable when it happens.
 */
export function rollDrops(mob: MobDef, rng: Rng, dropRate = 1, mesoRate = 1): RolledDrop[] {
  const out: RolledDrop[] = [];
  for (const entry of mob.drops) {
    const isMeso = entry.item === 'meso';
    const chance = Math.min(1, entry.chance * (isMeso ? mesoRate : dropRate));
    if (!rng.chance(chance)) continue;

    const qty = entry.min !== undefined && entry.max !== undefined
      ? rng.int(entry.min, entry.max)
      : 1;

    if (isMeso) {
      out.push({ kind: 'meso', itemId: 'meso', qty: Math.max(1, qty) });
      continue;
    }
    const def = tryGetItem(entry.item);
    if (!def) continue;
    if (def.equip) {
      // Each equip unit is its own instance with its own rolled stats.
      for (let i = 0; i < qty; i++) out.push({ kind: 'equip', itemId: entry.item, qty: 1 });
    } else {
      out.push({ kind: 'stack', itemId: entry.item, qty: Math.max(1, qty) });
    }
  }
  return out;
}

/** Spawn ground items for a set of rolled drops, spread around the death spot. */
export function spawnDrops(
  rolls: readonly RolledDrop[],
  x: number, y: number,
  rng: Rng,
): GroundItem[] {
  const items: GroundItem[] = [];
  const n = rolls.length;
  rolls.forEach((roll, i) => {
    // Fan the drops out so overlapping items stay individually clickable.
    const spread = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
    items.push({
      id: nextDropId++,
      kind: roll.kind,
      itemId: roll.itemId,
      qty: roll.qty,
      inst: roll.kind === 'equip' ? createInstance(roll.itemId, rng) : null,
      x,
      y: y - 12,
      vx: spread * rng.range(50, 90) + rng.range(-14, 14),
      vy: rng.range(-260, -190),
      landed: false,
      age: 0,
      phase: rng.range(0, Math.PI * 2),
    });
  });
  return items;
}

/** Advance a drop's arc until it lands on a foothold. */
export function stepDrop(d: GroundItem, dt: number, footholds: FootholdSet, layer = 0): void {
  d.age += dt;
  if (d.landed) return;

  d.vy += GRAVITY * 0.55 * dt;
  d.x += d.vx * dt;
  const y0 = d.y;
  d.y += d.vy * dt;

  if (d.vy > 0) {
    const fh = footholds.findLanding(d.x, y0, d.y, layer);
    if (fh) {
      d.y = fhYAt(fh, d.x);
      d.landed = true;
      d.vx = 0;
      d.vy = 0;
    }
  }
}

export function isExpired(d: GroundItem): boolean {
  return d.age > DROP_LIFETIME;
}

export function dropLabel(d: GroundItem): string {
  if (d.kind === 'meso') return `${d.qty} mesos`;
  const def = getItem(d.itemId);
  return d.qty > 1 ? `${def.name} x${d.qty}` : def.name;
}
