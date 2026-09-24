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

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SaveData;
    if (s.version !== 1 || typeof s.level !== 'string') return null;
    // Fill anything a newer build added.
    return { ...newSave(s.difficulty), ...s, stats: { ...newSave().stats, ...s.stats } };
  } catch {
    return null;
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: the game still plays, it just cannot resume */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
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
}

export function defaultOptions(): Options {
  return {
    volume: 0.8, music: 0.55, sfx: 0.9, sensitivity: 1, invertY: false, quality: 'high', shake: 1,
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
