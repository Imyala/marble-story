import type { DragonLook } from '../player/dragonRig';
import type { Element } from './types';

/**
 * Upgrades are bought with spirit gems (blue) at any Wardstone or from the
 * pause menu. Every upgrade has one cost per level.
 */

export type UpgradeTree = 'horn' | 'tail' | 'wings' | 'spirit' | Element;

export interface UpgradeDef {
  id: string;
  tree: UpgradeTree;
  name: string;
  desc: string[];
  costs: number[];
  /** Needs this element learned before it can be bought. */
  element?: Element;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'hornPower', tree: 'horn', name: 'Horn Strength', costs: [120, 320, 650],
    desc: ['Melee damage +15%.', 'Melee damage +30%.', 'Melee damage +45%.'] },
  { id: 'hornFinisher', tree: 'horn', name: 'Horn Cyclone', costs: [220],
    desc: ['A fourth Horn press ends the combo in a spinning strike that hits all around you.'] },
  { id: 'counter', tree: 'horn', name: 'Riposte', costs: [260],
    desc: ['Perfect dodges slow time for longer, and Counter strikes deal 50% more damage.'] },
  { id: 'tailSpin', tree: 'tail', name: 'Tail Cyclone', costs: [200],
    desc: ['Hold Tail on the ground to spin like a top, striking everything nearby.'] },
  { id: 'slamWave', tree: 'tail', name: 'Quake Pound', costs: [240],
    desc: ['Ground Pound releases a shockwave that launches enemies into the air.'] },
  { id: 'ramBreaker', tree: 'tail', name: 'Battering Ram', costs: [180],
    desc: ['Charging deals double damage and smashes through shields.'] },
  { id: 'airMastery', tree: 'wings', name: 'Aerial Artist', costs: [250],
    desc: ['Air combos keep you aloft twice as long, and the air finisher hits harder.'] },
  { id: 'swiftWings', tree: 'wings', name: 'Swift Wings', costs: [200],
    desc: ['A third wing flap, and gliding is 20% faster.'] },
  { id: 'dragonTime', tree: 'wings', name: 'Dragon Time', costs: [160, 380],
    desc: ['Dragon Time lasts 40% longer.', 'Dragon Time lasts 80% longer and refills faster.'] },
  { id: 'magnet', tree: 'spirit', name: 'Gem Lure', costs: [90, 220],
    desc: ['Gems fly to you from farther away.', 'Gems fly to you from much farther away.'] },
  { id: 'furyHeart', tree: 'spirit', name: 'Fury Heart', costs: [260],
    desc: ['Fury builds 35% faster.'] },
  { id: 'manaFlow', tree: 'spirit', name: 'Mana Flow', costs: [200, 450],
    desc: ['Mana regenerates twice as fast.', 'Mana regenerates three times as fast.'] },
];

for (const e of ['fire', 'lightning', 'ice', 'earth'] as const) {
  const names: Record<Element, [string, string]> = {
    fire: ['Flame Breath', 'Fireball'],
    lightning: ['Arc Breath', 'Storm Orb'],
    ice: ['Frost Breath', 'Frost Nova'],
    earth: ['Quake Breath', 'Boulder'],
  };
  const [breath, burst] = names[e];
  UPGRADES.push({
    id: `${e}Breath`, tree: e, element: e, name: breath, costs: [0, 260, 560],
    desc: ['Learned from the Warden.', 'Longer reach and 35% more damage.', 'Longest reach, 70% more damage, cheaper to sustain.'],
  });
  UPGRADES.push({
    id: `${e}Burst`, tree: e, element: e, name: burst, costs: [0, 320, 680],
    desc: burstDescs(e),
  });
}

function burstDescs(e: Element): string[] {
  switch (e) {
    case 'fire': return ['Hurl an exploding fireball.', 'Three fireballs in a fan.', 'Bigger explosions that leave the ground burning.'];
    case 'lightning': return ['A slow orb that zaps everything near it.', 'The orb lives longer and zaps faster.', 'Two orbs, and each chains between targets.'];
    case 'ice': return ['A ring of frost that chills everything around you.', 'Wider ring, freezes faster.', 'Ice spikes erupt from the ring.'];
    case 'earth': return ['Launch a boulder that smashes on impact.', 'Heavier boulder, bigger impact.', 'The boulder splits into three on impact.'];
  }
}

export function upgradeDef(id: string): UpgradeDef {
  const d = UPGRADES.find((u) => u.id === id);
  if (!d) throw new Error(`unknown upgrade ${id}`);
  return d;
}

export type Difficulty = 'story' | 'normal' | 'hard';

export const DIFFICULTY: Record<Difficulty, { enemyDamage: number; enemyHp: number; label: string; aggression: number }> = {
  story: { enemyDamage: 0.5, enemyHp: 0.75, label: 'Story', aggression: 0.7 },
  normal: { enemyDamage: 1, enemyHp: 1, label: 'Adventurer', aggression: 1 },
  hard: { enemyDamage: 1.5, enemyHp: 1.3, label: 'Legend', aggression: 1.35 },
};

export interface SaveData {
  version: 1;
  level: string;
  checkpoint: string | null;
  elements: Element[];
  upgrades: Record<string, number>;
  gems: number;
  heartShards: number;
  manaShards: number;
  /** Collectibles and one-time events by id. */
  found: Record<string, true>;
  levelsDone: Record<string, true>;
  unlocked: string[];
  difficulty: Difficulty;
  stats: { kills: number; bestCombo: number; playTime: number; deaths: number; reactions: number };
  /** Aster's chosen scales (see SKINS). */
  skin?: string;
  /** Every secret and chest id a realm holds, noted when it is visited (for "% explored"). */
  realmIds?: Record<string, string[]>;
  /** Which Legend Run this is: 0 for the first journey, 1+ for New Game+. */
  ngPlus?: number;
  /** How many times the story has been finished (the Keep's finale). */
  clears?: number;
  /** Fastest time through each realm, in seconds (first finish of a run). */
  bestTimes?: Record<string, number>;
}

/**
 * Scales Aster can wear, unlocked by returning lost dragon eggs. Hidden eggs:
 * Fen 5, Sanctum 3, Falls 5, Frostworks 5, Plains 5, Keep 5 (28 in all), plus one
 * carried off by an egg thief in most realms.
 */
export interface SkinDef {
  id: string;
  name: string;
  eggs: number;
  /** Story finishes needed (Legend scales), instead of eggs. */
  clears?: number;
  look: Partial<DragonLook>;
}

export const SKINS: SkinDef[] = [
  { id: 'violet', name: 'Twilight Violet', eggs: 0, look: {} },
  { id: 'ember', name: 'Emberscale', eggs: 5, look: { body: 0xc8452a, belly: 0xf2c060, horn: 0xf0e0b0, membrane: 0xffa040, spikes: 0xf0e0b0, eye: 0xffd040 } },
  { id: 'storm', name: 'Stormgold', eggs: 10, look: { body: 0xe0b83a, belly: 0x5a7ad0, horn: 0x2a3a7a, membrane: 0x5a9ae8, spikes: 0x2a3a7a, eye: 0x7ac8ff } },
  { id: 'rime', name: 'Rimefrost', eggs: 15, look: { body: 0x8ac0e8, belly: 0xf0f8ff, horn: 0xffffff, membrane: 0xbfe8ff, spikes: 0xffffff, eye: 0x40c0ff } },
  { id: 'moss', name: 'Mossback', eggs: 20, look: { body: 0x4a8a3a, belly: 0xd0b870, horn: 0x8a6a4a, membrane: 0xa0c060, spikes: 0x8a6a4a, eye: 0xffb030 } },
  { id: 'eclipse', name: 'Eclipse', eggs: 28, look: { body: 0x1a1428, belly: 0xc070ff, horn: 0xe8e0ff, membrane: 0x7a30c0, spikes: 0xe8e0ff, eye: 0xff80e0, glowEyes: true } },
  // Legend scales: earned by finishing the story, then again on New Game+.
  { id: 'ascendant', name: 'Ascendant', eggs: 0, clears: 1, look: { body: 0xf4ecd8, belly: 0xe8b84a, horn: 0xffd870, membrane: 0xffe6a0, spikes: 0xffd870, eye: 0x60e0ff, glowEyes: true } },
  { id: 'voidfire', name: 'Voidfire', eggs: 0, clears: 2, look: { body: 0x0c0a12, belly: 0x2a1a3a, horn: 0xff6a20, membrane: 0xff4a10, spikes: 0xff8a30, eye: 0xffa020, glowEyes: true } },
];

/** Share of a visited realm's secrets and chests found, 0..1, or null if never visited. */
export function explored(s: SaveData, lvl: string): number | null {
  const ids = s.realmIds?.[lvl];
  if (!ids || ids.length === 0) return null;
  return ids.filter((id) => s.found[id]).length / ids.length;
}

export function eggsFound(s: SaveData): number {
  return Object.keys(s.found).filter((k) => k.includes(':egg-')).length;
}

export function skinUnlocked(s: SaveData, id: string): boolean {
  const d = SKINS.find((k) => k.id === id);
  return !!d && eggsFound(s) >= d.eggs && (s.clears ?? 0) >= (d.clears ?? 0);
}

/** Target times through each realm (seconds): beat them for the Swift Wings feat. */
export const PAR_TIMES: Record<string, number> = { fen: 8 * 60, falls: 12 * 60, frostworks: 12 * 60, plains: 13 * 60, keep: 14 * 60 };

export const clock = (secs: number): string => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

/** Notes a finished run through a realm; returns whether it set a new best. */
export function recordTime(s: SaveData, lvl: string, secs: number): boolean {
  const t = (s.bestTimes ??= {});
  if (t[lvl] !== undefined && t[lvl]! <= secs) return false;
  t[lvl] = secs;
  return true;
}

/** Realms finished inside their par time, at best. */
export function parsBeaten(s: SaveData): number {
  return Object.entries(PAR_TIMES).filter(([k, par]) => (s.bestTimes?.[k] ?? Infinity) <= par).length;
}

/**
 * How much harder (and richer) a Legend Run is: every New Game+ cycle makes
 * the Gloom tougher, fiercer and more often elite, and pays more gems.
 */
export function ngScale(s: SaveData): { hp: number; dmg: number; aggro: number; elite: number; gems: number } {
  const n = Math.max(0, s.ngPlus ?? 0);
  return { hp: 1 + 0.45 * n, dmg: 1 + 0.3 * n, aggro: Math.min(1.6, 1 + 0.12 * n), elite: 1 + n, gems: 1 + 0.25 * n };
}

/** Found-keys that belong to one run of the story, cleared for New Game+. */
const RUN_KEY = /^(story|arena|ward):|:chest:|:rings:/;

/**
 * Starts a Legend Run: the story, realms, fights and treasure chests begin
 * again, while everything Aster has earned stays (upgrades, health and spirit
 * shards, gems, relics, letters, eggs and scales, feats, Skill Points, medals,
 * the Bestiary, best times).
 */
export function startNewGamePlus(s: SaveData): void {
  s.ngPlus = (s.ngPlus ?? 0) + 1;
  for (const k of Object.keys(s.found)) if (RUN_KEY.test(k)) delete s.found[k];
  s.levelsDone = {};
  s.unlocked = ['fen'];
  s.level = 'fen';
  s.checkpoint = null;
  // Elements are relearned from the Wardens as the story unfolds; their upgrades wait.
  s.elements = [];
}

export function newSave(difficulty: Difficulty = 'normal'): SaveData {
  return {
    version: 1,
    level: 'fen',
    checkpoint: null,
    elements: [],
    upgrades: {},
    gems: 0,
    heartShards: 0,
    manaShards: 0,
    found: {},
    levelsDone: {},
    unlocked: ['fen'],
    difficulty,
    stats: { kills: 0, bestCombo: 0, playTime: 0, deaths: 0, reactions: 0 },
  };
}

export function upgradeLevel(s: SaveData, id: string): number {
  return s.upgrades[id] ?? 0;
}

/** Cost of the next level of an upgrade, or null if maxed or locked. */
export function nextCost(s: SaveData, id: string): number | null {
  const d = upgradeDef(id);
  const lvl = upgradeLevel(s, id);
  if (lvl >= d.costs.length) return null;
  if (d.element && !s.elements.includes(d.element)) return null;
  return d.costs[lvl]!;
}

export function buyUpgrade(s: SaveData, id: string): boolean {
  const c = nextCost(s, id);
  if (c === null || s.gems < c) return false;
  s.gems -= c;
  s.upgrades[id] = upgradeLevel(s, id) + 1;
  return true;
}

export function learnElement(s: SaveData, e: Element): void {
  if (!s.elements.includes(e)) s.elements.push(e);
  s.upgrades[`${e}Breath`] = Math.max(1, upgradeLevel(s, `${e}Breath`));
  s.upgrades[`${e}Burst`] = Math.max(1, upgradeLevel(s, `${e}Burst`));
}

export const SHARDS_PER_UPGRADE = 4;
export const BASE_HP = 100;
export const BASE_MANA = 100;

export function maxHp(s: SaveData): number {
  return BASE_HP + Math.floor(s.heartShards / SHARDS_PER_UPGRADE) * 25;
}

export function maxMana(s: SaveData): number {
  return BASE_MANA + Math.floor(s.manaShards / SHARDS_PER_UPGRADE) * 25;
}

const SAVE_KEY = 'wyrmling.save.v1';
const OPT_KEY = 'wyrmling.options.v1';
const SLOT_KEY = 'wyrmling.slot';

/** Save slots: slot 1 keeps the original key, so saves from before slots carry over. */
export const SLOTS = 3;
const slotKey = (n: number): string => (n <= 1 ? SAVE_KEY : `${SAVE_KEY}.slot${n}`);

export function activeSlot(): number {
  try {
    const n = Number(localStorage.getItem(SLOT_KEY) ?? 1);
    return n >= 1 && n <= SLOTS ? Math.floor(n) : 1;
  } catch {
    return 1;
  }
}

export function setActiveSlot(n: number): void {
  try {
    localStorage.setItem(SLOT_KEY, String(Math.max(1, Math.min(SLOTS, Math.floor(n)))));
  } catch {
    /* ignore */
  }
}

export function loadSave(slot = activeSlot()): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    const s = JSON.parse(raw) as SaveData;
    if (s.version !== 1 || typeof s.level !== 'string') return null;
    // Fill anything a newer build added.
    return { ...newSave(s.difficulty), ...s, stats: { ...newSave().stats, ...s.stats } };
  } catch {
    return null;
  }
}

export function writeSave(s: SaveData, slot = activeSlot()): void {
  try {
    localStorage.setItem(slotKey(slot), JSON.stringify(s));
  } catch {
    /* storage full or blocked: the game still plays, it just cannot resume */
  }
}

export function clearSave(slot = activeSlot()): void {
  try {
    localStorage.removeItem(slotKey(slot));
  } catch {
    /* ignore */
  }
}

export interface Options {
  volume: number;
  music: number;
  sfx: number;
  sensitivity: number;
  invertY: boolean;
  quality: 'low' | 'medium' | 'high';
  shake: number;
  damageNumbers: boolean;
  autoCamera: boolean;
  /** Tones down lightning flashes, lens ripples, edge glows and strong hit flashes. */
  reduceFlashing?: boolean;
}

/** Phones and tablets start on a lighter setting; everything else on the full look. */
function defaultQuality(): Options['quality'] {
  try {
    if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches) return 'medium';
  } catch {
    /* ignore */
  }
  return 'high';
}

export function defaultOptions(): Options {
  return {
    volume: 0.8, music: 0.55, sfx: 0.9, sensitivity: 1, invertY: false, quality: defaultQuality(), shake: 1,
    damageNumbers: true, autoCamera: true,
  };
}

export function loadOptions(): Options {
  try {
    const raw = localStorage.getItem(OPT_KEY);
    if (raw) return { ...defaultOptions(), ...(JSON.parse(raw) as Partial<Options>) };
  } catch {
    /* ignore */
  }
  return defaultOptions();
}

export function writeOptions(o: Options): void {
  try {
    localStorage.setItem(OPT_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}
