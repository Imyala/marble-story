/**
 * The account store: worlds, character slots, and which character was last
 * played.
 *
 * The game used to keep exactly one character under a single key. Character
 * slots per world need a container around that, so v1 saves are migrated into
 * slot 0 of the default world rather than discarded — a save is someone's
 * playtime and must survive a schema change.
 */
import { SaveData, SAVE_VERSION as CHARACTER_VERSION } from './save';
import { DEFAULT_WORLD, getWorld, tryWorld, WORLDS } from '../data/worlds';
import { getJob } from '../data/jobs';

export const PROFILE_KEY = 'marble-story.profile.v2';
export const LEGACY_KEY = 'marble-story.save.v1';
export const PROFILE_VERSION = 2;

export interface WorldSlots {
  /** Fixed-length array; null is an empty slot. */
  slots: (SaveData | null)[];
}

export interface Profile {
  version: number;
  worlds: Record<string, WorldSlots>;
  lastWorld: string | null;
  lastSlot: number | null;
}

/** What the character-select screen needs to draw a slot. */
export interface CharacterSummary {
  slot: number;
  name: string;
  level: number;
  jobId: number;
  jobName: string;
  mapId: string;
  look: Record<string, unknown>;
}

export function emptyProfile(): Profile {
  return { version: PROFILE_VERSION, worlds: {}, lastWorld: null, lastSlot: null };
}

function blankWorld(worldId: string): WorldSlots {
  const world = tryWorld(worldId);
  const count = world?.slots ?? 8;
  return { slots: new Array<SaveData | null>(count).fill(null) };
}

/** Read the store, migrating a single-character v1 save if one is present. */
export function loadProfile(): Profile {
  let profile: Profile | null = null;
  try {
    const text = localStorage.getItem(PROFILE_KEY);
    if (text) {
      const parsed = JSON.parse(text) as Profile;
      if (parsed && parsed.version === PROFILE_VERSION && parsed.worlds) profile = parsed;
    }
  } catch {
    // Corrupt or unreadable storage: fall through to a fresh profile rather
    // than refusing to start.
  }

  if (!profile) profile = emptyProfile();
  ensureWorlds(profile);

  migrateLegacy(profile);
  return profile;
}

/** Make sure every known world has a correctly sized slot array. */
function ensureWorlds(profile: Profile): void {
  for (const world of WORLDS) {
    const existing = profile.worlds[world.id];
    if (!existing) {
      profile.worlds[world.id] = blankWorld(world.id);
      continue;
    }
    // A world's slot count can grow between versions.
    while (existing.slots.length < world.slots) existing.slots.push(null);
    existing.slots.length = Math.max(existing.slots.length, world.slots);
  }
}

/** Move a pre-worlds save into the default world's first slot, once. */
function migrateLegacy(profile: Profile): void {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  try {
    const data = JSON.parse(raw) as SaveData;
    if (data?.version === CHARACTER_VERSION) {
      const world = profile.worlds[DEFAULT_WORLD];
      const free = world.slots.indexOf(null);
      if (free >= 0) {
        world.slots[free] = data;
        profile.lastWorld = DEFAULT_WORLD;
        profile.lastSlot = free;
        saveProfile(profile);
      }
    }
    // Remove it either way: a migrated save must not be imported twice, and an
    // unreadable one will never become readable.
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Nothing further to do.
    }
  }
}

export function saveProfile(profile: Profile): boolean {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    // Private browsing or a full quota — never stop the game for this.
    return false;
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Nothing we can do.
  }
}

export function worldSlots(profile: Profile, worldId: string): (SaveData | null)[] {
  if (!profile.worlds[worldId]) profile.worlds[worldId] = blankWorld(worldId);
  return profile.worlds[worldId].slots;
}

export function characterCount(profile: Profile, worldId: string): number {
  return worldSlots(profile, worldId).filter((s) => s !== null).length;
}

/** Summaries for every occupied slot in a world, for the select screen. */
export function summarise(profile: Profile, worldId: string): (CharacterSummary | null)[] {
  return worldSlots(profile, worldId).map((save, slot) => {
    if (!save) return null;
    let jobName = 'Novice';
    try {
      jobName = getJob(save.player.jobId).name;
    } catch {
      // A save referencing a job that no longer exists still lists.
    }
    return {
      slot,
      name: save.player.name,
      level: save.player.level,
      jobId: save.player.jobId,
      jobName,
      mapId: save.mapId,
      look: save.player.look ?? {},
    };
  });
}

export function putCharacter(
  profile: Profile, worldId: string, slot: number, data: SaveData,
): void {
  const slots = worldSlots(profile, worldId);
  if (slot < 0 || slot >= slots.length) return;
  slots[slot] = data;
  profile.lastWorld = worldId;
  profile.lastSlot = slot;
}

export function deleteCharacter(profile: Profile, worldId: string, slot: number): boolean {
  const slots = worldSlots(profile, worldId);
  if (slot < 0 || slot >= slots.length || !slots[slot]) return false;
  slots[slot] = null;
  if (profile.lastWorld === worldId && profile.lastSlot === slot) {
    profile.lastSlot = null;
  }
  return true;
}

export function firstFreeSlot(profile: Profile, worldId: string): number {
  return worldSlots(profile, worldId).indexOf(null);
}

export function isWorldFull(profile: Profile, worldId: string): boolean {
  return firstFreeSlot(profile, worldId) < 0;
}

/** Total characters across every world — shown on the world select screen. */
export function totalCharacters(profile: Profile): number {
  return WORLDS.reduce((n, w) => n + characterCount(profile, w.id), 0);
}

export { getWorld };
