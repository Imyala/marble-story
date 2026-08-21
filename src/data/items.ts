/**
 * Item database.
 *
 * Equipment entries describe the *base* item. Every dropped instance
 * randomises around these numbers and carries its own upgrade slots, so two
 * copies of the same sword are rarely equal — see src/game/equipment.ts and
 * docs/DESIGN.md §8.3.
 */
import type { StatBlock } from '../game/stats';
import type { WeaponType } from '../game/combat';
import type { Branch } from './jobs';

export type ItemTab = 'equip' | 'use' | 'setup' | 'etc' | 'cash';

export type EquipSlot =
  | 'hat' | 'face' | 'eye' | 'earring'
  | 'top' | 'bottom' | 'overall' | 'shoes' | 'gloves' | 'cape'
  | 'shield' | 'weapon' | 'pendant' | 'belt' | 'ring' | 'medal';

/** Shape hint for the procedural item icon renderer. */
export type IconShape =
  | 'potion' | 'elixir' | 'scroll' | 'shell' | 'ore' | 'fang' | 'petal'
  | 'wing' | 'jelly' | 'cap' | 'gem' | 'coin'
  | 'sword' | 'greatsword' | 'axe' | 'spear' | 'dagger' | 'bow' | 'wand'
  | 'staff' | 'knuckle' | 'gun' | 'claw'
  | 'helm' | 'armour' | 'pants' | 'boots' | 'glove' | 'cape' | 'shield'
  | 'ring' | 'pendant' | 'crown' | 'heart';

export interface ItemIcon {
  shape: IconShape;
  color: string;
  accent?: string;
}

export interface EquipInfo {
  slot: EquipSlot;
  weaponType?: WeaponType;
  reqLevel: number;
  reqStr?: number;
  reqDex?: number;
  reqInt?: number;
  reqLuk?: number;
  /** Restrict to certain branches; absent means anyone may wear it. */
  reqBranch?: Branch[];
  /** Base stats before per-instance randomisation. */
  base: Partial<StatBlock>;
  /** Upgrade (scroll) slots. More slots = more valuable base item. */
  slots: number;
  twoHanded?: boolean;
  /** Milliseconds between swings. Lower is faster. */
  attackDelay?: number;
  /** Attack reach in pixels for melee weapons. */
  range?: number;
}

export interface ScrollInfo {
  /** Slot the scroll can be applied to, or 'any'. */
  target: EquipSlot | 'any';
  /** 0..1 chance the scroll succeeds. */
  successRate: number;
  /** Stats granted on success. */
  stats: Partial<StatBlock>;
  /** 0..1 chance the item is destroyed on failure. */
  destroyRate?: number;
}

export interface UseInfo {
  hp?: number;
  mp?: number;
  hpPercent?: number;
  mpPercent?: number;
  /** Timed stat buff. */
  buff?: { name: string; stats: Partial<StatBlock>; durationMs: number };
  /** Warps the player to the map's return map. */
  townScroll?: boolean;
  cooldownMs?: number;
  scroll?: ScrollInfo;
}

export interface ItemDef {
  id: string;
  name: string;
  tab: ItemTab;
  desc: string;
  /** Shop purchase price in mesos. Sell price is a fraction of this. */
  price: number;
  icon: ItemIcon;
  maxStack?: number;
  equip?: EquipInfo;
  use?: UseInfo;
}

/** Shops buy back at this fraction of the list price. */
export const SELL_RATE = 0.2;

const STACK = 200;

export const ITEMS: readonly ItemDef[] = [
  /* ------------------------------------------------------------ potions -- */
  {
    id: 'red_potion', name: 'Red Potion', tab: 'use', price: 50, maxStack: STACK,
    desc: 'Restores 50 HP.',
    icon: { shape: 'potion', color: '#e0555a', accent: '#ffb3b6' },
    use: { hp: 50, cooldownMs: 300 },
  },
  {
    id: 'blue_potion', name: 'Blue Potion', tab: 'use', price: 60, maxStack: STACK,
    desc: 'Restores 40 MP.',
    icon: { shape: 'potion', color: '#4aa3e8', accent: '#b3dcff' },
    use: { mp: 40, cooldownMs: 300 },
  },
  {
    id: 'orange_potion', name: 'Orange Potion', tab: 'use', price: 140, maxStack: STACK,
    desc: 'Restores 150 HP.',
    icon: { shape: 'potion', color: '#e8933c', accent: '#ffd39b' },
    use: { hp: 150, cooldownMs: 300 },
  },
  {
    id: 'green_potion', name: 'Green Potion', tab: 'use', price: 160, maxStack: STACK,
    desc: 'Restores 120 MP.',
    icon: { shape: 'potion', color: '#5fbf6a', accent: '#b8e8bd' },
    use: { mp: 120, cooldownMs: 300 },
  },
  {
    id: 'white_potion', name: 'White Potion', tab: 'use', price: 420, maxStack: STACK,
    desc: 'Restores 400 HP.',
    icon: { shape: 'potion', color: '#eef2f8', accent: '#ffffff' },
    use: { hp: 400, cooldownMs: 300 },
  },
  {
    id: 'mana_elixir', name: 'Mana Elixir', tab: 'use', price: 640, maxStack: STACK,
    desc: 'Restores 300 MP.',
    icon: { shape: 'elixir', color: '#7d6bd0', accent: '#cdc2ff' },
    use: { mp: 300, cooldownMs: 300 },
  },
  {
    id: 'elixir', name: 'Elixir', tab: 'use', price: 1400, maxStack: STACK,
    desc: 'Restores 50% of HP and MP.',
    icon: { shape: 'elixir', color: '#f2c14e', accent: '#fff0c2' },
    use: { hpPercent: 0.5, mpPercent: 0.5, cooldownMs: 1000 },
  },
  {
    id: 'town_scroll', name: 'Return Scroll', tab: 'use', price: 300, maxStack: 20,
    desc: 'Returns you to the nearest town.',
    icon: { shape: 'scroll', color: '#e8dcc0', accent: '#b04a4a' },
    use: { townScroll: true, cooldownMs: 2000 },
  },

  /* -------------------------------------------------------- stat scrolls -- */
  {
    id: 'scroll_weapon_atk', name: 'Scroll for Weapon (ATK)', tab: 'use', price: 900, maxStack: 100,
    desc: '70% chance to add 2 weapon attack. Consumes one upgrade slot.',
    icon: { shape: 'scroll', color: '#e8dcc0', accent: '#c98b3a' },
    use: { scroll: { target: 'weapon', successRate: 0.7, stats: { watk: 2 } } },
  },
  {
    id: 'scroll_weapon_atk_30', name: 'Scroll for Weapon (ATK) 30%', tab: 'use', price: 3200, maxStack: 100,
    desc: '30% chance to add 5 weapon attack. Consumes one upgrade slot.',
    icon: { shape: 'scroll', color: '#e8dcc0', accent: '#8b3ac9' },
    use: { scroll: { target: 'weapon', successRate: 0.3, stats: { watk: 5 } } },
  },
  {
    id: 'scroll_armour_def', name: 'Scroll for Armour (DEF)', tab: 'use', price: 700, maxStack: 100,
    desc: '70% chance to add 3 defense. Consumes one upgrade slot.',
    icon: { shape: 'scroll', color: '#e8dcc0', accent: '#3a7fc9' },
    use: { scroll: { target: 'any', successRate: 0.7, stats: { wdef: 3, mdef: 1 } } },
  },
  {
    id: 'scroll_chaos', name: 'Chaos Scroll', tab: 'use', price: 12000, maxStack: 50,
    desc: 'Randomises the item\'s stats. 20% chance to destroy it outright.',
    icon: { shape: 'scroll', color: '#2a2340', accent: '#d04a9b' },
    use: { scroll: { target: 'any', successRate: 0.6, stats: {}, destroyRate: 0.2 } },
  },

  /* ------------------------------------------------------------ weapons -- */
  {
    id: 'training_sword', name: 'Training Sword', tab: 'equip', price: 120,
    desc: 'Blunt, heavy, and technically a sword.',
    icon: { shape: 'sword', color: '#9aa4b4' },
    equip: {
      slot: 'weapon', weaponType: 'oneHandSword', reqLevel: 1,
      base: { watk: 12 }, slots: 5, attackDelay: 560, range: 62,
    },
  },
  {
    id: 'wooden_sword', name: 'Wooden Sword', tab: 'equip', price: 300,
    desc: 'A carved practice blade. Surprisingly effective.',
    icon: { shape: 'sword', color: '#b98a4f' },
    equip: {
      slot: 'weapon', weaponType: 'oneHandSword', reqLevel: 5, reqStr: 20,
      base: { watk: 19 }, slots: 6, attackDelay: 540, range: 64,
    },
  },
  {
    id: 'iron_sword', name: 'Iron Sword', tab: 'equip', price: 1800,
    desc: 'Standard issue. Reliable.',
    icon: { shape: 'sword', color: '#c3ccd9' },
    equip: {
      slot: 'weapon', weaponType: 'oneHandSword', reqLevel: 15, reqStr: 45,
      base: { watk: 32, acc: 3 }, slots: 7, attackDelay: 540, range: 66,
    },
  },
  {
    id: 'steel_greatsword', name: 'Steel Greatsword', tab: 'equip', price: 9000,
    desc: 'Two hands, one commitment.',
    icon: { shape: 'greatsword', color: '#dbe4f5', accent: '#7d8ba3' },
    equip: {
      slot: 'weapon', weaponType: 'twoHandSword', reqLevel: 28, reqStr: 80,
      base: { watk: 62, str: 2 }, slots: 7, twoHanded: true, attackDelay: 680, range: 78,
    },
  },
  {
    id: 'war_axe', name: 'War Axe', tab: 'equip', price: 7200,
    desc: 'Wide arc, poor manners.',
    icon: { shape: 'axe', color: '#c9d2e0', accent: '#7a5230' },
    equip: {
      slot: 'weapon', weaponType: 'oneHandAxe', reqLevel: 24, reqStr: 70,
      base: { watk: 52 }, slots: 7, attackDelay: 620, range: 68,
    },
  },
  {
    id: 'iron_spear', name: 'Iron Spear', tab: 'equip', price: 8400,
    desc: 'Reach is its own kind of armour.',
    icon: { shape: 'spear', color: '#c9d2e0', accent: '#6b4a24' },
    equip: {
      slot: 'weapon', weaponType: 'spear', reqLevel: 26, reqStr: 75,
      base: { watk: 58 }, slots: 7, twoHanded: true, attackDelay: 700, range: 96,
    },
  },
  {
    id: 'steel_dagger', name: 'Steel Dagger', tab: 'equip', price: 2600,
    desc: 'Fast, quiet, close.',
    icon: { shape: 'dagger', color: '#cfd8e6' },
    equip: {
      slot: 'weapon', weaponType: 'dagger', reqLevel: 18, reqLuk: 40, reqDex: 25,
      base: { watk: 30, luk: 1 }, slots: 7, attackDelay: 420, range: 56,
    },
  },
  {
    id: 'shadow_claw', name: 'Shadow Claw', tab: 'equip', price: 6800,
    desc: 'Throws stars. Never runs out, somehow.',
    icon: { shape: 'claw', color: '#8b93a8', accent: '#3a4766' },
    equip: {
      slot: 'weapon', weaponType: 'claw', reqLevel: 25, reqLuk: 75, reqDex: 35,
      base: { watk: 42, luk: 2 }, slots: 6, attackDelay: 380, range: 340,
    },
  },
  {
    id: 'hunters_bow', name: "Hunter's Bow", tab: 'equip', price: 5600,
    desc: 'Win the fight before it reaches you.',
    icon: { shape: 'bow', color: '#a8763f', accent: '#e8dcc0' },
    equip: {
      slot: 'weapon', weaponType: 'bow', reqLevel: 22, reqDex: 65,
      base: { watk: 46, acc: 6 }, slots: 7, twoHanded: true, attackDelay: 560, range: 420,
    },
  },
  {
    id: 'oak_wand', name: 'Oak Wand', tab: 'equip', price: 1600,
    desc: 'A focus for beginners.',
    icon: { shape: 'wand', color: '#8a5f38', accent: '#7dd8f0' },
    equip: {
      slot: 'weapon', weaponType: 'wand', reqLevel: 12, reqInt: 40,
      base: { matk: 28, int: 1, mp: 30 }, slots: 7, attackDelay: 520, range: 300,
    },
  },
  {
    id: 'runed_staff', name: 'Runed Staff', tab: 'equip', price: 11000,
    desc: 'The runes are load-bearing.',
    icon: { shape: 'staff', color: '#6b4a8a', accent: '#d8b0ff' },
    equip: {
      slot: 'weapon', weaponType: 'staff', reqLevel: 30, reqInt: 85,
      base: { matk: 58, int: 3, mp: 120 }, slots: 7, twoHanded: true, attackDelay: 580, range: 340,
    },
  },
  {
    id: 'brass_knuckle', name: 'Brass Knuckle', tab: 'equip', price: 4200,
    desc: 'Range is a state of mind.',
    icon: { shape: 'knuckle', color: '#d4a44a' },
    equip: {
      slot: 'weapon', weaponType: 'knuckle', reqLevel: 20, reqStr: 60,
      base: { watk: 40 }, slots: 6, attackDelay: 440, range: 54,
    },
  },
  {
    id: 'flintlock', name: 'Flintlock', tab: 'equip', price: 5200,
    desc: 'Loud, slow to reload, worth it.',
    icon: { shape: 'gun', color: '#5a6376', accent: '#8a5f38' },
    equip: {
      slot: 'weapon', weaponType: 'gun', reqLevel: 22, reqDex: 60,
      base: { watk: 44, acc: 4 }, slots: 6, attackDelay: 520, range: 400,
    },
  },

  /* ------------------------------------------------------------- armour -- */
  {
    id: 'cloth_top', name: 'Cloth Shirt', tab: 'equip', price: 60,
    desc: 'Barely counts as armour.',
    icon: { shape: 'armour', color: '#4f7fd4' },
    equip: { slot: 'top', reqLevel: 1, base: { wdef: 4 }, slots: 5 },
  },
  {
    id: 'cloth_bottom', name: 'Cloth Trousers', tab: 'equip', price: 60,
    desc: 'Comfortable, at least.',
    icon: { shape: 'pants', color: '#3b4560' },
    equip: { slot: 'bottom', reqLevel: 1, base: { wdef: 4 }, slots: 5 },
  },
  {
    id: 'leather_top', name: 'Leather Vest', tab: 'equip', price: 800,
    desc: 'Cheap, and it holds together.',
    icon: { shape: 'armour', color: '#8a5f38' },
    equip: { slot: 'top', reqLevel: 12, base: { wdef: 16, hp: 20 }, slots: 7 },
  },
  {
    id: 'leather_bottom', name: 'Leather Leggings', tab: 'equip', price: 800,
    desc: 'Reinforced at the knees.',
    icon: { shape: 'pants', color: '#6b4a33' },
    equip: { slot: 'bottom', reqLevel: 12, base: { wdef: 14 }, slots: 7 },
  },
  {
    id: 'iron_plate', name: 'Iron Plate', tab: 'equip', price: 6500,
    desc: 'Heavy. That is the point.',
    icon: { shape: 'armour', color: '#9aa4b4', accent: '#5a6376' },
    equip: {
      slot: 'overall', reqLevel: 25, reqStr: 60, reqBranch: ['warrior'],
      base: { wdef: 52, mdef: 12, hp: 60, speed: -3 }, slots: 7,
    },
  },
  {
    id: 'warden_plate', name: 'Warden Plate', tab: 'equip', price: 42000,
    desc: 'Cut from something that used to walk.',
    icon: { shape: 'armour', color: '#57607a', accent: '#7fd8e8' },
    equip: {
      slot: 'overall', reqLevel: 35, reqStr: 90, reqBranch: ['warrior'],
      base: { wdef: 88, mdef: 32, hp: 180, str: 4 }, slots: 7,
    },
  },
  {
    id: 'mage_robe', name: 'Apprentice Robe', tab: 'equip', price: 2200,
    desc: 'Deep pockets for reagents.',
    icon: { shape: 'armour', color: '#6b4a8a', accent: '#d8b0ff' },
    equip: {
      slot: 'overall', reqLevel: 18, reqInt: 45, reqBranch: ['mage'],
      base: { wdef: 18, mdef: 34, mp: 80, int: 2 }, slots: 7,
    },
  },
  {
    id: 'leather_cap', name: 'Leather Cap', tab: 'equip', price: 400,
    desc: 'Keeps the sun and the snails off.',
    icon: { shape: 'helm', color: '#8a5f38' },
    equip: { slot: 'hat', reqLevel: 8, base: { wdef: 10 }, slots: 7 },
  },
  {
    id: 'iron_helm', name: 'Iron Helm', tab: 'equip', price: 3200,
    desc: 'Restricts vision. Improves survival.',
    icon: { shape: 'helm', color: '#9aa4b4', accent: '#5a6376' },
    equip: { slot: 'hat', reqLevel: 22, reqStr: 45, base: { wdef: 28, hp: 30 }, slots: 7 },
  },
  {
    id: 'leather_boots', name: 'Leather Boots', tab: 'equip', price: 350,
    desc: 'Worn in, not worn out.',
    icon: { shape: 'boots', color: '#6b4a33' },
    equip: { slot: 'shoes', reqLevel: 10, base: { wdef: 8, speed: 2 }, slots: 7 },
  },
  {
    id: 'swift_boots', name: 'Swift Boots', tab: 'equip', price: 4800,
    desc: 'Light enough to forget you are wearing them.',
    icon: { shape: 'boots', color: '#4a8f6b', accent: '#a8e6c4' },
    equip: { slot: 'shoes', reqLevel: 25, reqDex: 40, base: { wdef: 18, speed: 8, jump: 5, avoid: 6 }, slots: 5 },
  },
  {
    id: 'work_gloves', name: 'Work Gloves', tab: 'equip', price: 300,
    desc: 'Grip you can rely on.',
    icon: { shape: 'glove', color: '#8a5f38' },
    equip: { slot: 'gloves', reqLevel: 10, base: { wdef: 6, acc: 4 }, slots: 7 },
  },
  {
    id: 'wooden_shield', name: 'Wooden Shield', tab: 'equip', price: 500,
    desc: 'It has stopped a lot of teeth.',
    icon: { shape: 'shield', color: '#8a5f38', accent: '#c9a35e' },
    equip: { slot: 'shield', reqLevel: 10, base: { wdef: 14 }, slots: 5 },
  },
  {
    id: 'traveller_cape', name: "Traveller's Cape", tab: 'equip', price: 2400,
    desc: 'Faded from real weather.',
    icon: { shape: 'cape', color: '#8f3a4a', accent: '#d47a86' },
    equip: { slot: 'cape', reqLevel: 20, base: { wdef: 12, mdef: 12, speed: 3 }, slots: 5 },
  },
  {
    id: 'slime_crown', name: 'Slime Crown', tab: 'equip', price: 30000,
    desc: 'Sticky. Regal. Both at once.',
    icon: { shape: 'crown', color: '#4fd08a', accent: '#f2c14e' },
    equip: {
      slot: 'hat', reqLevel: 20,
      base: { wdef: 26, mdef: 26, hp: 80, mp: 80, str: 3, dex: 3, int: 3, luk: 3 }, slots: 3,
    },
  },
  {
    id: 'copper_ring', name: 'Copper Ring', tab: 'equip', price: 900,
    desc: 'Turns your finger green. Worth it.',
    icon: { shape: 'ring', color: '#c98b3a' },
    equip: { slot: 'ring', reqLevel: 15, base: { str: 1, dex: 1, int: 1, luk: 1 }, slots: 1 },
  },
  {
    id: 'warden_heart', name: 'Warden Heart Pendant', tab: 'equip', price: 55000,
    desc: 'Still faintly warm.',
    icon: { shape: 'pendant', color: '#7fd8e8', accent: '#57607a' },
    equip: {
      slot: 'pendant', reqLevel: 35,
      base: { wdef: 20, mdef: 20, hp: 120, str: 5, dex: 5, int: 5, luk: 5, watk: 6, matk: 6 }, slots: 2,
    },
  },

  /* --------------------------------------------------------- etc / junk -- */
  etc('snail_shell', 'Snail Shell', 8, 'shell', '#8c6ac4', 'Smooth and empty.'),
  etc('blue_shell', 'Blue Shell', 14, 'shell', '#4a7fd0', 'A prettier empty shell.'),
  etc('slime_jelly', 'Slime Jelly', 22, 'jelly', '#5fbf6a', 'Wobbles when you look at it.'),
  etc('mushroom_cap', 'Mushroom Cap', 30, 'cap', '#e08b3c', 'Definitely not for eating.'),
  etc('boar_tusk', 'Boar Tusk', 70, 'fang', '#e8dcc0', 'Chipped at the tip.'),
  etc('thorn_petal', 'Thorn Petal', 90, 'petal', '#d4577f', 'Sharper than it looks.'),
  etc('crab_shell', 'Crab Shell', 60, 'shell', '#d97a4a', 'Cracked down one side.'),
  etc('bat_wing', 'Bat Wing', 110, 'wing', '#4a3f66', 'Thin as paper.'),
  etc('wolf_fang', 'Wolf Fang', 160, 'fang', '#e8dcc0', 'Still sharp.'),
  etc('golem_core', 'Golem Core', 320, 'ore', '#e0b04a', 'Warm to the touch.'),
  etc('pale_ember', 'Pale Ember', 380, 'gem', '#d8ecff', 'Gives off cold light.'),
  etc('crown_fragment', 'Crown Fragment', 1200, 'gem', '#4fd08a', 'Part of something larger.'),
];

/** Helper for the long tail of stackable monster junk. */
function etc(
  id: string, name: string, price: number,
  shape: IconShape, color: string, desc: string,
): ItemDef {
  return { id, name, tab: 'etc', price, desc, icon: { shape, color }, maxStack: STACK };
}

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): ItemDef {
  const item = BY_ID.get(id);
  if (!item) throw new Error(`unknown item id "${id}"`);
  return item;
}

export function tryGetItem(id: string): ItemDef | null {
  return BY_ID.get(id) ?? null;
}

export function allItems(): readonly ItemDef[] {
  return ITEMS;
}

export function sellPrice(def: ItemDef): number {
  return Math.max(1, Math.floor(def.price * SELL_RATE));
}

/** Slots that a two-handed weapon blocks. */
export function blockedSlots(def: ItemDef): EquipSlot[] {
  if (!def.equip) return [];
  if (def.equip.twoHanded) return ['shield'];
  if (def.equip.slot === 'overall') return ['top', 'bottom'];
  return [];
}
