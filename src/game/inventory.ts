/**
 * Five-tab inventory with slot pressure.
 *
 * Limited slots are a real resource: the ETC tab filling with monster junk is
 * a constant low-grade nuisance, and that nuisance is what sends players back
 * to town. Removing the limit would remove a whole gameplay rhythm.
 *
 * See docs/DESIGN.md §8.
 */
import type { Rng } from '../engine/rng';
import { ItemTab, getItem, tryGetItem } from '../data/items';
import {
  EQUIPPED_SLOTS, EquipInstance, EquippedSlot, candidateSlots, createInstance,
} from './equipment';
import { addStats, emptyStats, StatBlock } from './stats';

export type InvSlot =
  | { kind: 'equip'; inst: EquipInstance }
  | { kind: 'stack'; itemId: string; qty: number }
  | null;

export const TABS: readonly ItemTab[] = ['equip', 'use', 'setup', 'etc', 'cash'];
export const DEFAULT_CAPACITY = 24;
export const MAX_CAPACITY = 96;
export const MAX_MESOS = 9_999_999_999;

export type EquipResult =
  | { ok: true; swapped: EquipInstance[] }
  | { ok: false; reason: 'not-equip' | 'no-space' | 'requirements' };

export class Inventory {
  readonly tabs: Record<ItemTab, InvSlot[]>;
  readonly equipped: Partial<Record<EquippedSlot, EquipInstance>> = {};
  mesos = 0;

  constructor(capacity = DEFAULT_CAPACITY) {
    this.tabs = {
      equip: newTab(capacity),
      use: newTab(capacity),
      setup: newTab(capacity),
      etc: newTab(capacity),
      cash: newTab(capacity),
    };
  }

  capacityOf(tab: ItemTab): number {
    return this.tabs[tab].length;
  }

  expand(tab: ItemTab, by: number): boolean {
    const next = Math.min(MAX_CAPACITY, this.tabs[tab].length + by);
    if (next === this.tabs[tab].length) return false;
    while (this.tabs[tab].length < next) this.tabs[tab].push(null);
    return true;
  }

  freeSlots(tab: ItemTab): number {
    return this.tabs[tab].reduce((n, s) => (s === null ? n + 1 : n), 0);
  }

  private firstFree(tab: ItemTab): number {
    return this.tabs[tab].indexOf(null);
  }

  /* ------------------------------------------------------------ adding -- */

  /**
   * Add items by id. Equipment creates one instance per unit; everything else
   * stacks. Returns the quantity that did NOT fit.
   */
  addItem(itemId: string, qty: number, rng: Rng): number {
    const def = tryGetItem(itemId);
    if (!def) return qty;

    if (def.equip) {
      let remaining = qty;
      while (remaining > 0) {
        if (!this.addEquip(createInstance(def, rng))) break;
        remaining--;
      }
      return remaining;
    }
    return this.addStack(itemId, qty);
  }

  addEquip(inst: EquipInstance): boolean {
    const idx = this.firstFree('equip');
    if (idx < 0) return false;
    this.tabs.equip[idx] = { kind: 'equip', inst };
    return true;
  }

  /** Fills existing stacks first, then opens new slots. Returns the leftover. */
  addStack(itemId: string, qty: number): number {
    const def = tryGetItem(itemId);
    if (!def || def.equip) return qty;
    const tab = def.tab;
    const max = def.maxStack ?? 1;
    let left = qty;

    for (const slot of this.tabs[tab]) {
      if (left <= 0) break;
      if (slot?.kind === 'stack' && slot.itemId === itemId && slot.qty < max) {
        const room = max - slot.qty;
        const put = Math.min(room, left);
        slot.qty += put;
        left -= put;
      }
    }
    while (left > 0) {
      const idx = this.firstFree(tab);
      if (idx < 0) break;
      const put = Math.min(max, left);
      this.tabs[tab][idx] = { kind: 'stack', itemId, qty: put };
      left -= put;
    }
    return left;
  }

  addMesos(amount: number): void {
    this.mesos = Math.min(MAX_MESOS, Math.max(0, this.mesos + amount));
  }

  spendMesos(amount: number): boolean {
    if (amount > this.mesos) return false;
    this.mesos -= amount;
    return true;
  }

  /* ---------------------------------------------------------- removing -- */

  countOf(itemId: string): number {
    let total = 0;
    for (const tab of TABS) {
      for (const slot of this.tabs[tab]) {
        if (slot?.kind === 'stack' && slot.itemId === itemId) total += slot.qty;
        else if (slot?.kind === 'equip' && slot.inst.itemId === itemId) total += 1;
      }
    }
    return total;
  }

  /** Remove `qty` of a stackable item across slots. Fails atomically. */
  consume(itemId: string, qty = 1): boolean {
    if (this.countOf(itemId) < qty) return false;
    const def = tryGetItem(itemId);
    if (!def) return false;
    let left = qty;
    const list = this.tabs[def.tab];
    for (let i = 0; i < list.length && left > 0; i++) {
      const slot = list[i];
      if (slot?.kind === 'stack' && slot.itemId === itemId) {
        const take = Math.min(slot.qty, left);
        slot.qty -= take;
        left -= take;
        if (slot.qty <= 0) list[i] = null;
      } else if (slot?.kind === 'equip' && slot.inst.itemId === itemId) {
        list[i] = null;
        left -= 1;
      }
    }
    return left === 0;
  }

  removeAt(tab: ItemTab, index: number, qty = 1): boolean {
    const slot = this.tabs[tab][index];
    if (!slot) return false;
    if (slot.kind === 'equip') {
      this.tabs[tab][index] = null;
      return true;
    }
    slot.qty -= qty;
    if (slot.qty <= 0) this.tabs[tab][index] = null;
    return true;
  }

  /** Move a slot's contents, swapping if the destination is occupied. */
  move(tab: ItemTab, from: number, to: number): void {
    const list = this.tabs[tab];
    if (from === to || !list[from]) return;
    const a = list[from];
    const b = list[to];
    // Merge partial stacks of the same item rather than swapping them.
    if (a?.kind === 'stack' && b?.kind === 'stack' && a.itemId === b.itemId) {
      const max = getItem(a.itemId).maxStack ?? 1;
      const move = Math.min(a.qty, max - b.qty);
      b.qty += move;
      a.qty -= move;
      if (a.qty <= 0) list[from] = null;
      return;
    }
    list[to] = a;
    list[from] = b;
  }

  /* ---------------------------------------------------------- equipping -- */

  /**
   * Equip the instance in an equip-tab slot. Anything it displaces goes back
   * into the inventory, which can fail for lack of space.
   */
  equip(index: number, canWear?: (itemId: string) => boolean): EquipResult {
    const slot = this.tabs.equip[index];
    if (slot?.kind !== 'equip') return { ok: false, reason: 'not-equip' };
    const inst = slot.inst;
    const def = getItem(inst.itemId);
    if (!def.equip) return { ok: false, reason: 'not-equip' };
    if (canWear && !canWear(inst.itemId)) return { ok: false, reason: 'requirements' };

    const targets = candidateSlots(def.equip.slot);
    const target = targets.find((t) => !this.equipped[t]) ?? targets[0];

    const conflicts = new Set<EquippedSlot>([target]);
    if (def.equip.slot === 'overall') {
      conflicts.add('top');
      conflicts.add('bottom');
    }
    if (def.equip.slot === 'top' || def.equip.slot === 'bottom') conflicts.add('overall');
    if (def.equip.twoHanded) conflicts.add('shield');
    if (def.equip.slot === 'shield') {
      const weapon = this.equipped.weapon;
      if (weapon && getItem(weapon.itemId).equip?.twoHanded) conflicts.add('weapon');
    }

    const displaced = [...conflicts]
      .map((s) => this.equipped[s])
      .filter((v): v is EquipInstance => v !== undefined);

    // The equipping item vacates its own slot, so we get one for free.
    if (displaced.length > this.freeSlots('equip') + 1) {
      return { ok: false, reason: 'no-space' };
    }

    this.tabs.equip[index] = null;
    for (const s of conflicts) delete this.equipped[s];
    for (const d of displaced) this.addEquip(d);
    this.equipped[target] = inst;
    return { ok: true, swapped: displaced };
  }

  unequip(slot: EquippedSlot): boolean {
    const inst = this.equipped[slot];
    if (!inst) return false;
    if (this.freeSlots('equip') === 0) return false;
    delete this.equipped[slot];
    this.addEquip(inst);
    return true;
  }

  /** Sum of every equipped instance's stats. */
  equippedStats(): StatBlock {
    const total = emptyStats();
    for (const s of EQUIPPED_SLOTS) {
      const inst = this.equipped[s];
      if (inst) addStats(total, inst.stats);
    }
    return total;
  }

  equippedWeapon(): EquipInstance | null {
    return this.equipped.weapon ?? null;
  }

  /* ------------------------------------------------------------ sorting -- */

  /** Compact a tab, then order by item id so the layout is stable. */
  sort(tab: ItemTab): void {
    const items = this.tabs[tab].filter((s): s is NonNullable<InvSlot> => s !== null);
    items.sort((a, b) => {
      const ida = a.kind === 'equip' ? a.inst.itemId : a.itemId;
      const idb = b.kind === 'equip' ? b.inst.itemId : b.itemId;
      return ida.localeCompare(idb);
    });
    const list = this.tabs[tab];
    for (let i = 0; i < list.length; i++) list[i] = items[i] ?? null;
  }
}

function newTab(capacity: number): InvSlot[] {
  return new Array<InvSlot>(capacity).fill(null);
}
