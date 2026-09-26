import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MIGRATIONS, SAVE_VERSION, migrateSave } from '../src/game/migrate';
import { activeSlot, loadSave, newSave, setActiveSlot, skinUnlocked, startNewGamePlus, takeSetAsideSaves, writeSave } from '../src/game/progress';

/** A localStorage that lives in a Map, for saves in node. */
class MemoryStorage {
  private m = new Map<string, string>();
  get length(): number {
    return this.m.size;
  }
  key(i: number): string | null {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
  keys(): string[] {
    return [...this.m.keys()];
  }
}

const KEY = 'wyrmling.save.v1';
let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  (globalThis as { localStorage?: unknown }).localStorage = store;
  takeSetAsideSaves();
});

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

// --- fixtures: saves as older builds wrote them ---------------------------------------------

/** The first build (dc9b99a): the Fen done, in the Sanctum. */
const ROUND1 = {
  version: 1, level: 'sanctum', checkpoint: 'courtyard', elements: ['fire'], upgrades: { fireBreath: 1, fireBurst: 1, hornPower: 1 },
  gems: 240, heartShards: 1, manaShards: 0, found: { 'fen:egg-1': true, 'story:fen:intro': true }, levelsDone: { fen: true },
  unlocked: ['fen', 'sanctum'], difficulty: 'normal', stats: { kills: 31, bestCombo: 12, playTime: 1500, deaths: 1, reactions: 0 },
};

/** Before save slots (d27b47a): scales, "% explored", stored under the one original key. */
const PRE_SLOTS = {
  ...ROUND1, level: 'falls', checkpoint: null, elements: ['fire', 'lightning'], unlocked: ['fen', 'sanctum', 'falls', 'frostworks'],
  levelsDone: { fen: true, falls: true }, skin: 'ember', realmIds: { fen: ['fen:egg-1', 'fen:heart1'], falls: ['falls:egg-2'] },
  found: { ...ROUND1.found, 'fen:egg-2': true, 'fen:egg-3': true, 'fen:egg-4': true, 'fen:egg-5': true, 'ward:falls:mid': true },
};

/** Before Legend Runs (4612429): the story finished at the Keep, no `clears` counted. */
const PRE_NGPLUS = {
  ...PRE_SLOTS, level: 'sanctum', elements: ['fire', 'lightning', 'ice', 'earth'], unlocked: ['fen', 'sanctum', 'falls', 'frostworks', 'plains', 'keep'],
  levelsDone: { fen: true, falls: true, frostworks: true, plains: true, keep: true },
  stats: { ...ROUND1.stats, elites: 4, perfects: 12 },
};

/** Today's save: slots, a Legend Run, quests, best times, extra counters. */
const TODAY = {
  ...PRE_NGPLUS, level: 'hollow', checkpoint: 'camp', ngPlus: 1, clears: 2, bestTimes: { fen: 400, falls: 690 },
  quests: { 'hollow-oil': { step: 1, n: 2, tracked: true }, 'fen-lanterns': { step: 3, done: true } },
  found: { ...PRE_SLOTS.found, 'story:hollow:mossa': true, 'seen:grunt': true, 'feat:rift': true },
  unlocked: [...PRE_NGPLUS.unlocked, 'hollow'],
  stats: { ...PRE_NGPLUS.stats, riftBest: 9, partnerKills: 30, quests: 3 },
};

describe('save migrations', () => {
  it('ends at SAVE_VERSION, one step at a time', () => {
    expect(MIGRATIONS.map((m) => m.to)).toEqual(Array.from({ length: SAVE_VERSION }, (_, i) => i + 1));
  });

  it('brings a round-1 save up to date, keeping everything in it', () => {
    const m = migrateSave(ROUND1);
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.from).toBe(1);
    expect(m.save.version).toBe(SAVE_VERSION);
    expect(m.save).toMatchObject({ ...ROUND1, version: SAVE_VERSION });
    // Not finished: no Legend Run to offer.
    expect(m.save.clears).toBeUndefined();
  });

  it('takes a save with no version at all as the first shape', () => {
    const { version: _v, ...old } = ROUND1;
    void _v;
    const m = migrateSave(old);
    expect(m.ok && m.from === 0 && m.save.version === SAVE_VERSION && m.save.level === 'sanctum').toBe(true);
  });

  it('counts a story finished before Legend Runs existed, so New Game+ and Ascendant open', () => {
    const m = migrateSave(PRE_NGPLUS);
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.save.clears).toBe(1);
    expect(skinUnlocked(m.save, 'ascendant')).toBe(true);
    // Its extra counters and "% explored" notes survive.
    expect((m.save.stats as unknown as Record<string, number>).perfects).toBe(12);
    expect(m.save.realmIds?.falls).toEqual(['falls:egg-2']);
  });

  it('leaves today\'s save as it was, but for the version', () => {
    const m = migrateSave(TODAY);
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.save).toEqual({ ...TODAY, version: SAVE_VERSION });
    expect(m.save.clears).toBe(2);
  });

  it('puts fields of the wrong type back to their defaults', () => {
    const m = migrateSave({ ...ROUND1, found: null, unlocked: 'sanctum', gems: 'lots', elements: ['fire', 7], difficulty: 'nightmare', checkpoint: 3 });
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.save.found).toEqual({});
    expect(m.save.unlocked).toEqual(['fen']);
    expect(m.save.gems).toBe(0);
    expect(m.save.elements).toEqual(['fire']);
    expect(m.save.difficulty).toBe('normal');
    expect(m.save.checkpoint).toBeNull();
  });

  it('keeps a newer build\'s save and its unknown fields as they are', () => {
    const future = { ...TODAY, version: SAVE_VERSION + 5, talismans: ['ember'], stats: { ...TODAY.stats, spiritSeen: 4 } };
    const m = migrateSave(future);
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    expect(m.save.version).toBe(SAVE_VERSION + 5);
    expect((m.save as unknown as { talismans: string[] }).talismans).toEqual(['ember']);
  });

  it('refuses what is not a save, and never changes its input', () => {
    for (const bad of [null, 42, 'save', [], {}, { version: 1 }, { version: 'two', level: 'fen' }, { version: -1, level: 'fen' }]) {
      expect(migrateSave(bad).ok).toBe(false);
    }
    const copy = structuredClone(PRE_NGPLUS);
    migrateSave(copy);
    expect(copy).toEqual(PRE_NGPLUS);
  });

  it('reports a migration that throws instead of throwing', () => {
    const r = migrateSave(ROUND1, [...MIGRATIONS, { to: SAVE_VERSION + 1, what: 'broken', run: () => { throw new Error('boom'); } }]);
    expect(r.ok).toBe(false);
  });
});

describe('loading saves from storage', () => {
  it('loads a pre-slots save from the original key as slot 1', () => {
    store.setItem(KEY, JSON.stringify(PRE_SLOTS));
    expect(activeSlot()).toBe(1);
    const s = loadSave();
    expect(s?.level).toBe('falls');
    expect(s?.skin).toBe('ember');
    expect(s?.version).toBe(SAVE_VERSION);
  });

  it('migrates every slot, and fills in fields added since', () => {
    store.setItem(`${KEY}.slot2`, JSON.stringify(ROUND1));
    store.setItem(`${KEY}.slot3`, JSON.stringify(PRE_NGPLUS));
    const two = loadSave(2)!;
    expect(two.version).toBe(SAVE_VERSION);
    expect(two.stats).toEqual(ROUND1.stats);
    expect(loadSave(3)!.clears).toBe(1);
    expect(loadSave(1)).toBeNull();
  });

  it('round-trips a save, unknown fields and all', () => {
    const future = { ...TODAY, talismans: ['ember'], stats: { ...TODAY.stats, spiritSeen: 4 } };
    store.setItem(KEY, JSON.stringify(future));
    const s = loadSave()!;
    writeSave(s);
    const again = JSON.parse(store.getItem(KEY)!);
    expect(again.talismans).toEqual(['ember']);
    expect(again.stats.spiritSeen).toBe(4);
    expect(again.quests).toEqual(TODAY.quests);
    expect(again.version).toBe(SAVE_VERSION);
  });

  it('sets a corrupt save aside instead of failing, and the slot reads empty', () => {
    setActiveSlot(2);
    store.setItem(`${KEY}.slot2`, '{"version":1,"level":"fen","found":{');
    expect(() => loadSave()).not.toThrow();
    expect(store.getItem(`${KEY}.slot2`)).toBeNull();
    expect(store.getItem(`${KEY}.slot2.corrupt`)).toBe('{"version":1,"level":"fen","found":{');
    expect(takeSetAsideSaves()).toEqual([{ slot: 2, key: `${KEY}.slot2.corrupt` }]);
    // Said once.
    expect(takeSetAsideSaves()).toEqual([]);
    // A second bad save in the same slot gets a backup of its own.
    store.setItem(`${KEY}.slot2`, 'null');
    expect(loadSave()).toBeNull();
    expect(store.getItem(`${KEY}.slot2.corrupt`)).toBe('{"version":1,"level":"fen","found":{');
    expect(store.getItem(`${KEY}.slot2.corrupt2`)).toBe('null');
    // And a fresh journey saves into the slot as normal.
    writeSave(newSave());
    expect(loadSave()?.level).toBe('fen');
  });

  it('a Legend Run clears an opened realm gate with the rest of the run', () => {
    const s = loadSaveOf({ ...TODAY, found: { ...TODAY.found, 'gate:mycelium': true, 'hollow:egg-grotto': true } });
    startNewGamePlus(s);
    expect(s.found['gate:mycelium']).toBeUndefined();
    expect(s.found['hollow:egg-grotto']).toBe(true);
  });
});

function loadSaveOf(raw: object) {
  store.setItem(KEY, JSON.stringify(raw));
  return loadSave()!;
}
