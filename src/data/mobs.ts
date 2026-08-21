/**
 * Monster database.
 *
 * Monsters are terrain more than they are opponents — the AI is deliberately
 * simple and the interesting decisions live in stat and drop tuning. Each
 * entry is pure data; nothing here reaches into game logic.
 *
 * See docs/DESIGN.md §7.
 */
import type { Element, Resistance } from '../game/combat';
import type { MobArt } from '../art/mobart';

export type AggroType = 'passive' | 'aggressive';
export type MoveType = 'stationary' | 'walk' | 'jump' | 'fly';

export interface DropEntry {
  /** Item id, or 'meso' for currency. */
  item: string;
  /** 0..1 independent roll. */
  chance: number;
  min?: number;
  max?: number;
}

export interface MobDef {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  maxMp: number;
  exp: number;
  /** Physical attack — also the touch-damage value. */
  pad: number;
  mad: number;
  pdef: number;
  mdef: number;
  acc: number;
  avoid: number;
  /** Movement speed stat, 100 = player base. */
  speed: number;
  element: Element;
  resist: Partial<Record<Element, Resistance>>;
  aggro: AggroType;
  /** How far away an aggressive monster notices the player. */
  aggroRange: number;
  move: MoveType;
  /** Does simply touching it hurt? Almost always yes. */
  bodyAttack: boolean;
  /** Damage in a single hit needed to stagger it. */
  knockbackHp: number;
  boss: boolean;
  respawnMs: number;
  width: number;
  height: number;
  art: MobArt;
  drops: DropEntry[];
}

const MESO = (chance: number, min: number, max: number): DropEntry =>
  ({ item: 'meso', chance, min, max });

export const MOBS: readonly MobDef[] = [
  /* ---------------------------------------------- starter island (1-10) -- */
  {
    id: 'snail', name: 'Garden Snail', level: 1,
    maxHp: 12, maxMp: 0, exp: 3,
    pad: 8, mad: 0, pdef: 0, mdef: 0, acc: 8, avoid: 0, speed: 38,
    element: 'neutral', resist: {},
    aggro: 'passive', aggroRange: 0, move: 'walk', bodyAttack: true,
    knockbackHp: 1, boss: false, respawnMs: 7000,
    width: 30, height: 30,
    art: { shape: 'snail', body: '#8c6ac4', accent: '#e0d7f5', scale: 0.75 },
    drops: [MESO(0.55, 1, 6), { item: 'snail_shell', chance: 0.4 }],
  },
  {
    id: 'blue_snail', name: 'Blue Snail', level: 3,
    maxHp: 24, maxMp: 0, exp: 5,
    pad: 12, mad: 0, pdef: 2, mdef: 0, acc: 12, avoid: 1, speed: 40,
    element: 'neutral', resist: {},
    aggro: 'passive', aggroRange: 0, move: 'walk', bodyAttack: true,
    knockbackHp: 1, boss: false, respawnMs: 7000,
    width: 32, height: 32,
    art: { shape: 'snail', body: '#4a7fd0', accent: '#d7e6f7', scale: 0.8 },
    drops: [MESO(0.6, 3, 12), { item: 'blue_shell', chance: 0.38 }, { item: 'wooden_sword', chance: 0.008 }],
  },
  {
    id: 'green_slime', name: 'Green Slime', level: 5,
    maxHp: 40, maxMp: 0, exp: 9,
    pad: 18, mad: 0, pdef: 4, mdef: 8, acc: 16, avoid: 2, speed: 45,
    element: 'neutral', resist: {},
    aggro: 'passive', aggroRange: 0, move: 'jump', bodyAttack: true,
    knockbackHp: 4, boss: false, respawnMs: 7000,
    width: 34, height: 32,
    art: { shape: 'slime', body: '#5fbf6a', accent: '#a8e6ad', scale: 0.85 },
    drops: [MESO(0.65, 5, 18), { item: 'slime_jelly', chance: 0.4 }, { item: 'red_potion', chance: 0.09 }],
  },
  {
    id: 'orange_mushroom', name: 'Orange Mushroom', level: 8,
    maxHp: 70, maxMp: 10, exp: 15,
    pad: 26, mad: 0, pdef: 8, mdef: 10, acc: 22, avoid: 3, speed: 42,
    element: 'neutral', resist: {},
    aggro: 'passive', aggroRange: 0, move: 'walk', bodyAttack: true,
    knockbackHp: 8, boss: false, respawnMs: 8000,
    width: 40, height: 40,
    art: { shape: 'mushroom', body: '#e08b3c', accent: '#f0d9b8', scale: 0.9 },
    drops: [
      MESO(0.7, 8, 26),
      { item: 'mushroom_cap', chance: 0.42 },
      { item: 'red_potion', chance: 0.12 },
      { item: 'leather_cap', chance: 0.02 },
    ],
  },

  /* ----------------------------------------------- grassland fields (10-25) */
  {
    id: 'horned_slime', name: 'Horned Slime', level: 12,
    maxHp: 130, maxMp: 20, exp: 26,
    pad: 38, mad: 0, pdef: 14, mdef: 18, acc: 32, avoid: 5, speed: 50,
    element: 'neutral', resist: {},
    aggro: 'passive', aggroRange: 0, move: 'jump', bodyAttack: true,
    knockbackHp: 14, boss: false, respawnMs: 8000,
    width: 38, height: 36,
    art: { shape: 'slime', body: '#c25fbf', accent: '#efb8ee', scale: 0.95 },
    drops: [
      MESO(0.72, 14, 44),
      { item: 'slime_jelly', chance: 0.4 },
      { item: 'orange_potion', chance: 0.1 },
      { item: 'wooden_shield', chance: 0.015 },
    ],
  },
  {
    id: 'field_boar', name: 'Field Boar', level: 16,
    maxHp: 230, maxMp: 30, exp: 42,
    pad: 55, mad: 0, pdef: 22, mdef: 14, acc: 42, avoid: 7, speed: 68,
    element: 'neutral', resist: {},
    aggro: 'aggressive', aggroRange: 210, move: 'walk', bodyAttack: true,
    knockbackHp: 22, boss: false, respawnMs: 9000,
    width: 58, height: 40,
    art: { shape: 'boar', body: '#9b6b45', accent: '#e8c9a8', scale: 0.95 },
    drops: [
      MESO(0.75, 22, 70),
      { item: 'boar_tusk', chance: 0.35 },
      { item: 'orange_potion', chance: 0.12 },
      { item: 'iron_sword', chance: 0.012 },
      { item: 'leather_top', chance: 0.02 },
    ],
  },
  {
    id: 'thorn_bloom', name: 'Thorn Bloom', level: 19,
    maxHp: 300, maxMp: 60, exp: 52,
    pad: 62, mad: 40, pdef: 30, mdef: 40, acc: 50, avoid: 4, speed: 0,
    element: 'poison', resist: { poison: 'immune', fire: 'weak' },
    aggro: 'aggressive', aggroRange: 150, move: 'stationary', bodyAttack: true,
    knockbackHp: 30, boss: false, respawnMs: 11000,
    width: 40, height: 52,
    art: { shape: 'plant', body: '#d4577f', accent: '#4f8f3d', scale: 1 },
    drops: [
      MESO(0.7, 26, 82),
      { item: 'thorn_petal', chance: 0.38 },
      { item: 'green_potion', chance: 0.1 },
      { item: 'oak_wand', chance: 0.012 },
    ],
  },

  /* ---------------------------------------------------- cave / dark (20-35) */
  {
    id: 'cave_bat', name: 'Cave Bat', level: 22,
    maxHp: 340, maxMp: 40, exp: 60,
    pad: 70, mad: 0, pdef: 26, mdef: 30, acc: 70, avoid: 22, speed: 95,
    element: 'dark', resist: { dark: 'strong', holy: 'weak' },
    aggro: 'aggressive', aggroRange: 260, move: 'fly', bodyAttack: true,
    knockbackHp: 24, boss: false, respawnMs: 9000,
    width: 46, height: 36,
    art: { shape: 'bat', body: '#4a3f66', accent: '#6d5f91', scale: 0.9 },
    drops: [
      MESO(0.72, 30, 95),
      { item: 'bat_wing', chance: 0.36 },
      { item: 'orange_potion', chance: 0.14 },
      { item: 'steel_dagger', chance: 0.011 },
    ],
  },
  {
    id: 'rock_golem', name: 'Rock Golem', level: 28,
    maxHp: 720, maxMp: 60, exp: 105,
    pad: 105, mad: 20, pdef: 90, mdef: 40, acc: 78, avoid: 5, speed: 45,
    element: 'neutral', resist: { lightning: 'weak', poison: 'immune' },
    aggro: 'aggressive', aggroRange: 200, move: 'walk', bodyAttack: true,
    knockbackHp: 90, boss: false, respawnMs: 13000,
    width: 62, height: 60,
    art: { shape: 'golem', body: '#6b7280', accent: '#e0b04a', scale: 1.05 },
    drops: [
      MESO(0.8, 60, 180),
      { item: 'golem_core', chance: 0.3 },
      { item: 'white_potion', chance: 0.1 },
      { item: 'steel_greatsword', chance: 0.01 },
      { item: 'iron_helm', chance: 0.016 },
    ],
  },
  {
    id: 'grave_wisp', name: 'Grave Wisp', level: 31,
    maxHp: 850, maxMp: 200, exp: 128,
    pad: 115, mad: 130, pdef: 40, mdef: 110, acc: 96, avoid: 30, speed: 80,
    element: 'dark', resist: { dark: 'immune', holy: 'weak', ice: 'strong' },
    aggro: 'aggressive', aggroRange: 280, move: 'fly', bodyAttack: true,
    knockbackHp: 60, boss: false, respawnMs: 12000,
    width: 40, height: 52,
    art: { shape: 'spirit', body: '#7d6bb0', accent: '#d8ecff', scale: 1 },
    drops: [
      MESO(0.78, 70, 210),
      { item: 'pale_ember', chance: 0.32 },
      { item: 'white_potion', chance: 0.12 },
      { item: 'mana_elixir', chance: 0.07 },
    ],
  },

  /* --------------------------------------------------------- shore (14-24) */
  {
    id: 'sand_crab', name: 'Sand Crab', level: 14,
    maxHp: 175, maxMp: 20, exp: 34,
    pad: 46, mad: 0, pdef: 40, mdef: 10, acc: 36, avoid: 6, speed: 52,
    element: 'ice', resist: { ice: 'strong', fire: 'weak' },
    aggro: 'passive', aggroRange: 0, move: 'walk', bodyAttack: true,
    knockbackHp: 26, boss: false, respawnMs: 8500,
    width: 52, height: 34,
    art: { shape: 'crab', body: '#d97a4a', accent: '#f0b98c', scale: 0.9 },
    drops: [
      MESO(0.74, 18, 58),
      { item: 'crab_shell', chance: 0.36 },
      { item: 'red_potion', chance: 0.14 },
      { item: 'leather_boots', chance: 0.02 },
    ],
  },
  {
    id: 'dune_wolf', name: 'Dune Wolf', level: 25,
    maxHp: 520, maxMp: 40, exp: 88,
    pad: 92, mad: 0, pdef: 44, mdef: 30, acc: 86, avoid: 20, speed: 105,
    element: 'neutral', resist: {},
    aggro: 'aggressive', aggroRange: 300, move: 'jump', bodyAttack: true,
    knockbackHp: 42, boss: false, respawnMs: 10000,
    width: 56, height: 40,
    art: { shape: 'wolf', body: '#b09468', accent: '#e8dcc0', scale: 1 },
    drops: [
      MESO(0.78, 48, 150),
      { item: 'wolf_fang', chance: 0.34 },
      { item: 'white_potion', chance: 0.1 },
      { item: 'hunters_bow', chance: 0.012 },
    ],
  },

  /* -------------------------------------------------------------- bosses -- */
  {
    id: 'king_slime', name: 'King Slime', level: 20,
    maxHp: 4200, maxMp: 300, exp: 950,
    pad: 105, mad: 60, pdef: 45, mdef: 55, acc: 80, avoid: 6, speed: 55,
    element: 'neutral', resist: { poison: 'strong' },
    aggro: 'aggressive', aggroRange: 420, move: 'jump', bodyAttack: true,
    knockbackHp: 400, boss: true, respawnMs: 300000,
    width: 96, height: 88,
    art: { shape: 'slime', body: '#4fd08a', accent: '#c8f5dd', scale: 2.3 },
    drops: [
      MESO(1, 900, 2400),
      { item: 'slime_jelly', chance: 1, min: 4, max: 9 },
      { item: 'crown_fragment', chance: 0.6 },
      { item: 'white_potion', chance: 0.8, min: 3, max: 6 },
      { item: 'slime_crown', chance: 0.12 },
      { item: 'steel_greatsword', chance: 0.08 },
    ],
  },
  {
    id: 'stone_warden', name: 'Stone Warden', level: 35,
    maxHp: 12000, maxMp: 800, exp: 3400,
    pad: 175, mad: 90, pdef: 140, mdef: 90, acc: 130, avoid: 10, speed: 50,
    element: 'neutral', resist: { lightning: 'weak', poison: 'immune', neutral: 'normal' },
    aggro: 'aggressive', aggroRange: 460, move: 'walk', bodyAttack: true,
    knockbackHp: 900, boss: true, respawnMs: 600000,
    width: 120, height: 118,
    art: { shape: 'golem', body: '#57607a', accent: '#7fd8e8', scale: 2.4 },
    drops: [
      MESO(1, 3000, 7000),
      { item: 'golem_core', chance: 1, min: 3, max: 7 },
      { item: 'warden_heart', chance: 0.5 },
      { item: 'mana_elixir', chance: 0.8, min: 2, max: 5 },
      { item: 'warden_plate', chance: 0.1 },
      { item: 'runed_staff', chance: 0.08 },
    ],
  },
];

const BY_ID = new Map(MOBS.map((m) => [m.id, m]));

export function getMob(id: string): MobDef {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`unknown mob id "${id}"`);
  return m;
}

export function allMobs(): readonly MobDef[] {
  return MOBS;
}
