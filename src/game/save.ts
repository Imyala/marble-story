/**
 * Save / load to localStorage.
 *
 * Equipment instances carry their own rolled stats and upgrade history, so the
 * inventory has to be serialised structurally rather than as a list of item
 * ids — a "+7 Iron Sword with 24 attack" is not recoverable from its id alone.
 */
import type { ItemTab } from '../data/items';
import { tryGetItem } from '../data/items';
import { EquipInstance, EquippedSlot, resetUidCounter } from './equipment';
import { Inventory, InvSlot, TABS } from './inventory';
import { Player } from './player';
import { QuestLog } from './quests';
import { emptyStats, StatBlock } from './stats';
import { trySkill } from '../data/skills';

export const SAVE_KEY = 'marble-story.save.v1';
export const SAVE_VERSION = 1;

interface SavedSlot {
  k: 'e' | 's';
  /** Equip instance, for k === 'e'. */
  inst?: EquipInstance;
  /** Item id and quantity, for k === 's'. */
  id?: string;
  q?: number;
}

export interface SaveData {
  version: number;
  savedAt: number;
  mapId: string;
  portalName: string;
  player: {
    name: string;
    level: number;
    exp: number;
    jobId: number;
    base: { str: number; dex: number; int: number; luk: number };
    ap: number;
    sp: number;
    fame: number;
    hp: number;
    mp: number;
    baseHp: number;
    baseMp: number;
    killCount: number;
    skills: [string, number][];
    look: Record<string, unknown>;
  };
  inventory: {
    mesos: number;
    tabs: Record<string, SavedSlot[]>;
    equipped: [string, EquipInstance][];
  };
  quests: { active: { id: string; kills: Record<string, number> }[]; completed: string[] };
  quickSlots: (string | null)[];
  /** Highest uid handed out, so reloaded instances never collide with new ones. */
  nextUid: number;
}

export function serialise(
  player: Player,
  quests: QuestLog,
  mapId: string,
  portalName: string,
  quickSlots: (string | null)[],
): SaveData {
  const tabs: Record<string, SavedSlot[]> = {};
  let maxUid = 0;

  for (const tab of TABS) {
    tabs[tab] = player.inventory.tabs[tab].map((slot): SavedSlot => {
      if (!slot) return { k: 's' };
      if (slot.kind === 'equip') {
        maxUid = Math.max(maxUid, slot.inst.uid);
        return { k: 'e', inst: slot.inst };
      }
      return { k: 's', id: slot.itemId, q: slot.qty };
    });
  }

  const equipped: [string, EquipInstance][] = [];
  for (const [slot, inst] of Object.entries(player.inventory.equipped)) {
    if (!inst) continue;
    maxUid = Math.max(maxUid, inst.uid);
    equipped.push([slot, inst]);
  }

  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    mapId,
    portalName,
    player: {
      name: player.name,
      level: player.level,
      exp: player.exp,
      jobId: player.jobId,
      base: { ...player.base },
      ap: player.ap,
      sp: player.sp,
      fame: player.fame,
      hp: player.hp,
      mp: player.mp,
      baseHp: player.baseHp,
      baseMp: player.baseMp,
      killCount: player.killCount,
      skills: [...player.skills.entries()],
      look: { ...player.look } as Record<string, unknown>,
    },
    inventory: {
      mesos: player.inventory.mesos,
      tabs,
      equipped,
    },
    quests: quests.toJSON(),
    quickSlots,
    nextUid: maxUid + 1,
  };
}

export function save(data: SaveData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // Private browsing or a full quota — the game must keep running.
    return false;
  }
}

export function loadRaw(): SaveData | null {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (!text) return null;
    const data = JSON.parse(text) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Nothing we can do, and nothing that should stop the game.
  }
}

export interface RestoredGame {
  player: Player;
  quests: QuestLog;
  mapId: string;
  portalName: string;
  quickSlots: (string | null)[];
}

/**
 * Rebuild a character from save data.
 *
 * Anything that no longer exists in the item or skill database is dropped
 * rather than throwing — content changes must never brick an existing save.
 */
export function restore(data: SaveData): RestoredGame {
  resetUidCounter(Math.max(1, data.nextUid ?? 1));

  const player = new Player(data.player.name);
  player.level = data.player.level;
  player.exp = data.player.exp;
  player.jobId = data.player.jobId;
  player.base = { ...data.player.base };
  player.ap = data.player.ap;
  player.sp = data.player.sp;
  player.fame = data.player.fame ?? 0;
  player.baseHp = data.player.baseHp;
  player.baseMp = data.player.baseMp;
  player.killCount = data.player.killCount ?? 0;
  Object.assign(player.look, data.player.look ?? {});

  for (const [id, level] of data.player.skills ?? []) {
    if (trySkill(id)) player.skills.set(id, level);
  }

  restoreInventory(player.inventory, data.inventory);

  player.recompute();
  player.hp = Math.min(data.player.hp, player.stats.maxHp);
  player.mp = Math.min(data.player.mp, player.stats.maxMp);

  return {
    player,
    quests: QuestLog.fromJSON(data.quests ?? { active: [], completed: [] }),
    mapId: data.mapId,
    portalName: data.portalName,
    quickSlots: normaliseQuickSlots(data.quickSlots),
  };
}

function restoreInventory(inv: Inventory, saved: SaveData['inventory']): void {
  inv.mesos = saved.mesos ?? 0;

  for (const tab of TABS) {
    const slots = saved.tabs?.[tab] ?? [];
    const target = inv.tabs[tab as ItemTab];
    for (let i = 0; i < target.length; i++) {
      target[i] = decodeSlot(slots[i]);
    }
  }

  for (const [slot, inst] of saved.equipped ?? []) {
    if (!inst || !tryGetItem(inst.itemId)) continue;
    inv.equipped[slot as EquippedSlot] = reviveInstance(inst);
  }
}

function decodeSlot(saved: SavedSlot | undefined): InvSlot {
  if (!saved) return null;
  if (saved.k === 'e') {
    if (!saved.inst || !tryGetItem(saved.inst.itemId)) return null;
    return { kind: 'equip', inst: reviveInstance(saved.inst) };
  }
  if (!saved.id || !saved.q || !tryGetItem(saved.id)) return null;
  return { kind: 'stack', itemId: saved.id, qty: saved.q };
}

/** Fill in any stat keys added since the save was written. */
function reviveInstance(inst: EquipInstance): EquipInstance {
  const stats: StatBlock = emptyStats();
  for (const key of Object.keys(stats) as (keyof StatBlock)[]) {
    stats[key] = inst.stats?.[key] ?? 0;
  }
  return { ...inst, stats };
}

function normaliseQuickSlots(slots: (string | null)[] | undefined): (string | null)[] {
  const out: (string | null)[] = [null, null, null, null, null, null, null, null];
  for (let i = 0; i < 8; i++) {
    const id = slots?.[i];
    if (id && trySkill(id)) out[i] = id;
  }
  return out;
}
