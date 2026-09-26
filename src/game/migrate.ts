import type { SaveData } from './progress';

/**
 * Save versions. Every save carries `version`; when the save's shape or
 * meaning changes, SAVE_VERSION goes up by one and a migration is added to
 * MIGRATIONS that brings a save of the previous version up to date. Loading
 * runs, in order, every migration newer than the save (`loadSave` in
 * progress.ts, for every slot), then fills in any field a newer build added
 * with its default.
 *
 * Fields this build does not know (written by a newer build) are left alone,
 * so they survive a load and a save. A save from a newer build than this one
 * is loaded as it is and keeps its version.
 *
 * Shapes the save has had (see `git log -p src/game/progress.ts`):
 *   - none:  no `version` field (before saves were versioned).
 *   - v1:    the first build: level, checkpoint, elements, upgrades, gems,
 *            shards, found, levelsDone, unlocked, difficulty, stats. Later v1
 *            builds added, each optional: skin; realmIds; ngPlus, clears and
 *            bestTimes (Legend Runs); quests. Three slots arrived without a
 *            change of shape (slot 1 kept the original key).
 *   - v2:    this round: every field has its proper type, and `clears` counts
 *            a story finished before Legend Runs existed.
 */
export const SAVE_VERSION = 2;

/** A save as parsed from storage, before it is trusted. */
export type RawSave = Record<string, unknown>;

export interface Migration {
  /** The version this migration produces (it runs on saves older than that). */
  to: number;
  /** What it changes, for whoever reads this next. */
  what: string;
  run(s: RawSave): void;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export const MIGRATIONS: Migration[] = [
  {
    to: 1,
    what: 'A save from before saves carried a version: it already has the first shape.',
    run: () => {},
  },
  {
    to: 2,
    what: 'Fields of the wrong type (a hand-edited or half-written save) go back to their defaults, and a story finished before Legend Runs existed counts as one finish.',
    run: (s) => {
      for (const k of ['found', 'levelsDone', 'upgrades'] as const) if (!isObj(s[k])) s[k] = {};
      if (!isObj(s.stats)) s.stats = {};
      for (const k of ['elements', 'unlocked'] as const) {
        const v = s[k];
        s[k] = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
      }
      const unlocked = s.unlocked as string[];
      if (!unlocked.includes('fen')) unlocked.unshift('fen');
      if (s.checkpoint !== null && typeof s.checkpoint !== 'string') s.checkpoint = null;
      for (const k of ['gems', 'heartShards', 'manaShards'] as const) s[k] = Math.max(0, num(s[k], 0));
      if (s.difficulty !== 'story' && s.difficulty !== 'normal' && s.difficulty !== 'hard') s.difficulty = 'normal';
      // Legend Runs arrived after some journeys had already ended at the Keep:
      // those saves never counted the finish, so New Game+ and the Ascendant
      // scales stayed out of reach.
      const done = s.levelsDone as Record<string, unknown>;
      if (done.keep && s.clears === undefined) s.clears = 1;
    },
  },
];

export type MigrateResult =
  | { ok: true; save: SaveData; from: number }
  | { ok: false; reason: string };

/**
 * Brings a parsed save up to SAVE_VERSION. Refuses (`ok: false`) anything
 * that is not a save at all, so the caller can set it aside. The input is
 * not modified.
 */
export function migrateSave(input: unknown, migrations: Migration[] = MIGRATIONS): MigrateResult {
  if (!isObj(input)) return { ok: false, reason: 'not an object' };
  const s: RawSave = structuredClone(input);
  if (s.version !== undefined && (typeof s.version !== 'number' || !Number.isInteger(s.version) || s.version < 0)) {
    return { ok: false, reason: `bad version ${JSON.stringify(s.version)}` };
  }
  if (typeof s.level !== 'string' || s.level === '') return { ok: false, reason: 'no realm' };
  const from = (s.version as number | undefined) ?? 0;
  try {
    for (const m of migrations) {
      if (m.to <= from) continue;
      m.run(s);
      s.version = m.to;
    }
  } catch (e) {
    return { ok: false, reason: `migration failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  // A newer build's save ran no migration here and keeps its version.
  return { ok: true, save: s as unknown as SaveData, from };
}
