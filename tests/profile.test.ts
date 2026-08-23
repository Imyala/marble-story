/**
 * The account store. Migration is the risky part: a v1 save is somebody's
 * playtime, and a schema change must not eat it.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  LEGACY_KEY, PROFILE_KEY, characterCount, deleteCharacter, emptyProfile,
  firstFreeSlot, isWorldFull, loadProfile, putCharacter, saveProfile,
  summarise, totalCharacters, worldSlots,
} from '../src/game/profile';
import { WORLDS, getWorld } from '../src/data/worlds';
import type { SaveData } from '../src/game/save';
import { validateName } from '../src/ui/screens';
import { CLASS_OPTIONS, getClassOption } from '../src/data/classes';
import { getJob } from '../src/data/jobs';
import { getItem } from '../src/data/items';

/** Minimal localStorage so the store can be exercised outside a browser. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string): string | null { return this.map.get(k) ?? null; }
  setItem(k: string, v: string): void { this.map.set(k, v); }
  removeItem(k: string): void { this.map.delete(k); }
  clear(): void { this.map.clear(); }
}

function fakeSave(name: string, level = 7, jobId = 0): SaveData {
  return {
    version: 1, savedAt: 0, mapId: 'tidewatch', portalName: 'spawn',
    player: {
      name, level, exp: 0, jobId, base: { str: 12, dex: 5, int: 4, luk: 4 },
      ap: 0, sp: 0, fame: 0, hp: 50, mp: 20, baseHp: 50, baseMp: 20,
      killCount: 0, skills: [], look: {},
    },
    inventory: { mesos: 0, tabs: {}, equipped: [] },
    quests: { active: [], completed: [] },
    quickSlots: [], nextUid: 1,
  } as SaveData;
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

describe('profile store', () => {
  it('starts empty with a slot array per world', () => {
    const profile = loadProfile();
    for (const world of WORLDS) {
      expect(worldSlots(profile, world.id), world.id).toHaveLength(world.slots);
      expect(characterCount(profile, world.id)).toBe(0);
    }
    expect(totalCharacters(profile)).toBe(0);
  });

  it('stores and reads back a character', () => {
    const profile = loadProfile();
    putCharacter(profile, 'solace', 2, fakeSave('Wren', 14, 100));
    expect(characterCount(profile, 'solace')).toBe(1);
    expect(profile.lastWorld).toBe('solace');
    expect(profile.lastSlot).toBe(2);

    const summaries = summarise(profile, 'solace');
    expect(summaries[0]).toBeNull();
    expect(summaries[2]).toMatchObject({ name: 'Wren', level: 14, jobId: 100, slot: 2 });
    expect(summaries[2]?.jobName).toBe(getJob(100).name);
  });

  it('keeps worlds separate', () => {
    const profile = loadProfile();
    putCharacter(profile, 'solace', 0, fakeSave('A'));
    putCharacter(profile, 'luna', 0, fakeSave('B'));
    expect(characterCount(profile, 'solace')).toBe(1);
    expect(characterCount(profile, 'luna')).toBe(1);
    expect(characterCount(profile, 'tide')).toBe(0);
    expect(totalCharacters(profile)).toBe(2);
  });

  it('reports free slots and fullness', () => {
    const profile = loadProfile();
    const world = getWorld('ember');
    expect(firstFreeSlot(profile, 'ember')).toBe(0);
    for (let i = 0; i < world.slots; i++) putCharacter(profile, 'ember', i, fakeSave(`C${i}`));
    expect(isWorldFull(profile, 'ember')).toBe(true);
    expect(firstFreeSlot(profile, 'ember')).toBe(-1);
  });

  it('deletes a character and leaves the slot empty', () => {
    const profile = loadProfile();
    putCharacter(profile, 'solace', 1, fakeSave('Gone'));
    expect(deleteCharacter(profile, 'solace', 1)).toBe(true);
    expect(characterCount(profile, 'solace')).toBe(0);
    expect(deleteCharacter(profile, 'solace', 1)).toBe(false);
  });

  it('round-trips through storage', () => {
    const profile = loadProfile();
    putCharacter(profile, 'luna', 3, fakeSave('Keep', 42, 210));
    expect(saveProfile(profile)).toBe(true);

    const reloaded = loadProfile();
    const summaries = summarise(reloaded, 'luna');
    expect(summaries[3]).toMatchObject({ name: 'Keep', level: 42 });
    expect(reloaded.lastWorld).toBe('luna');
  });

  it('migrates a pre-worlds save instead of discarding it', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(fakeSave('Veteran', 31, 110)));

    const profile = loadProfile();
    const summaries = summarise(profile, 'solace');
    expect(summaries[0]).toMatchObject({ name: 'Veteran', level: 31, jobId: 110 });
    expect(profile.lastWorld).toBe('solace');
    // The old key is cleared so the same character cannot be imported twice.
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();

    const again = loadProfile();
    expect(characterCount(again, 'solace')).toBe(1);
  });

  it('discards an unreadable legacy save without failing to start', () => {
    localStorage.setItem(LEGACY_KEY, '{not json');
    const profile = loadProfile();
    expect(totalCharacters(profile)).toBe(0);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('recovers from a corrupt profile rather than refusing to load', () => {
    localStorage.setItem(PROFILE_KEY, 'garbage');
    const profile = loadProfile();
    expect(totalCharacters(profile)).toBe(0);
    expect(worldSlots(profile, 'solace').length).toBeGreaterThan(0);
  });

  it('grows a world that gained slots between versions', () => {
    const stale = emptyProfile();
    stale.worlds.solace = { slots: [null, null] };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(stale));

    const profile = loadProfile();
    expect(worldSlots(profile, 'solace')).toHaveLength(getWorld('solace').slots);
  });
});

describe('character names', () => {
  it('accepts reasonable names', () => {
    for (const name of ['Ash', 'Wren12', 'ABCDEFGHIJKL']) {
      expect(validateName(name), name).toBeNull();
    }
  });

  it('rejects blank, short, long, and punctuated names', () => {
    for (const name of ['', ' ', 'a', 'ABCDEFGHIJKLM', 'bad name', 'oops!', 'a-b']) {
      expect(validateName(name), name).not.toBeNull();
    }
  });
});

describe('class options', () => {
  it('has unique ids and real jobs, weapons, and skills', () => {
    const ids = CLASS_OPTIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const option of CLASS_OPTIONS) {
      expect(() => getJob(option.jobId), option.id).not.toThrow();
      const weapon = getItem(option.weapon);
      expect(weapon.equip?.slot, option.id).toBe('weapon');
      // A brand-new character must actually be able to hold their weapon.
      expect(weapon.equip?.reqLevel, `${option.id} weapon level`).toBe(1);
      expect(option.quickSlots, option.id).toHaveLength(8);
    }
  });

  it('gives every class a starting skill it could use', () => {
    for (const option of CLASS_OPTIONS) {
      expect(option.skills.length, option.id).toBeGreaterThan(0);
    }
  });

  it('keeps the classic option class-less', () => {
    const novice = getClassOption('novice');
    expect(novice.jobId).toBe(0);
    expect(novice.mainStat).toBe('—');
  });
});
