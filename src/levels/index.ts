import type { LevelDef } from '../world/level';

/**
 * Every realm, fetched on demand. Each realm module (and the bosses only it
 * uses) is built into a chunk of its own, so the game starts without
 * downloading all of them; `Game.loadLevel` waits for a realm's chunk (under
 * the fade, or a small loading veil) before building it.
 *
 * Adding a realm is one line here: its id and `() => import('./<file>')`.
 * The module must export its LevelDef (under any name) with that `id`.
 */
const LOADERS: Record<string, () => Promise<Record<string, unknown>>> = {
  fen: () => import('./fen'),
  sanctum: () => import('./sanctum'),
  falls: () => import('./falls'),
  frostworks: () => import('./frostworks'),
  plains: () => import('./plains'),
  keep: () => import('./keep'),
  // Act II.
  hollow: () => import('./hollow'),
};

/** Realms already loaded, by id (filled in as their chunks arrive). */
export const LEVELS: Record<string, LevelDef> = {};

/** Loads in flight, so asking twice fetches once. */
const pending = new Map<string, Promise<LevelDef>>();

/** Every realm id the game knows, loaded or not. */
export const LEVEL_IDS: readonly string[] = Object.keys(LOADERS);

/** True for a realm id the game knows (whether or not it is loaded yet). */
export function hasLevel(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(LOADERS, id);
}

/** A realm's definition if its chunk has already arrived, else undefined. */
export function levelDef(id: string): LevelDef | undefined {
  return LEVELS[id];
}

/** The realm's LevelDef among a module's exports: the one whose id matches. */
function pick(id: string, mod: Record<string, unknown>): LevelDef {
  for (const v of Object.values(mod)) {
    const d = v as Partial<LevelDef> | null;
    if (d && typeof d === 'object' && d.id === id && typeof d.build === 'function') return d as LevelDef;
  }
  throw new Error(`realm module for "${id}" exports no LevelDef with that id`);
}

/**
 * Resolves with the realm's definition, fetching its chunk if needed. A failed
 * fetch (offline, or a stale deploy whose files are gone) rejects, and is
 * forgotten so that asking again tries again.
 */
export function ensureLevel(id: string): Promise<LevelDef> {
  const have = LEVELS[id];
  if (have) return Promise.resolve(have);
  const load = LOADERS[id];
  if (!load) return Promise.reject(new Error(`unknown realm "${id}"`));
  let p = pending.get(id);
  if (!p) {
    p = load().then(
      (mod) => {
        const def = pick(id, mod);
        LEVELS[id] = def;
        pending.delete(id);
        return def;
      },
      (err: unknown) => {
        pending.delete(id);
        throw err;
      },
    );
    pending.set(id, p);
  }
  return p;
}

/** Starts fetching realms in the background (unknown ids and failures are ignored). */
export function prefetchLevels(ids: Iterable<string>): Promise<void> {
  const list = [...new Set(ids)].filter((id) => hasLevel(id) && !LEVELS[id]);
  return Promise.all(list.map((id) => ensureLevel(id).catch(() => undefined))).then(() => undefined);
}
