/**
 * Skill definitions.
 *
 * A skill is a table of per-level numbers, not a function. That is deliberate:
 * balance passes should be data edits, and a designer needs to be able to read
 * "level 12 costs 14 MP and deals 118%" without running the game.
 *
 * `damage` is a percentage where 100 = exactly a basic attack, so every skill
 * is directly comparable to swinging your weapon. See docs/DESIGN.md §4.2.
 */
import type { Element, WeaponType } from '../game/combat';
import type { StatBlock } from '../game/stats';

export type SkillType = 'passive' | 'attack' | 'buff' | 'heal' | 'movement';

export interface SkillLevel {
  mpCost: number;
  hpCost?: number;
  /** Percent of a basic attack, per hit. */
  damage?: number;
  /** Hits per target. */
  attackCount?: number;
  /** Maximum targets struck. */
  mobCount?: number;
  /** Buff duration in ms. */
  duration?: number;
  cooldown?: number;
  /** Stats granted by a buff or passive. */
  stats?: Partial<StatBlock>;
  /** Weapon mastery as a fraction — raises minimum damage. */
  mastery?: number;
  /** Percent of max HP healed. */
  healPercent?: number;
  /** Attack reach override in pixels. */
  range?: number;
  /** Fraction of damage redirected to MP (magic-guard style). */
  mpShield?: number;
  /** Multiplier on weapon attack delay — 0.75 means 25% faster swings. */
  attackSpeedScale?: number;
}

export interface SkillDef {
  id: string;
  name: string;
  /** Job that grants this skill. */
  jobId: number;
  type: SkillType;
  element: Element;
  maxLevel: number;
  /** Raised beyond maxLevel by a mastery book (4th job mechanic). */
  masterLevel?: number;
  desc: string;
  icon: { glyph: string; color: string };
  /** Weapons this skill can be used with; absent means any. */
  weapons?: WeaponType[];
  /** Prerequisite skills that must reach a level first. */
  requires?: { skillId: string; level: number }[];
  levels: SkillLevel[];
}

/** Build a per-level table from a function of the level number. */
function ramp(max: number, fn: (lv: number, t: number) => SkillLevel): SkillLevel[] {
  const out: SkillLevel[] = [];
  for (let lv = 1; lv <= max; lv++) out.push(fn(lv, max === 1 ? 1 : (lv - 1) / (max - 1)));
  return out;
}

/** Linear interpolation rounded to an integer — the usual shape of these tables. */
function lerpI(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export const SKILLS: readonly SkillDef[] = [
  /* ------------------------------------------------------------- novice -- */
  {
    id: 'nimble_feet', name: 'Nimble Feet', jobId: 0, type: 'buff', element: 'neutral',
    maxLevel: 3, desc: 'Briefly increases movement speed.',
    icon: { glyph: '»', color: '#8fd14f' },
    levels: ramp(3, (lv, t) => ({
      mpCost: 6 + lv, duration: 10000 + lv * 5000,
      stats: { speed: lerpI(8, 18, t), jump: lerpI(2, 6, t) },
    })),
  },
  {
    id: 'recovery', name: 'Recovery', jobId: 0, type: 'buff', element: 'neutral',
    maxLevel: 3, desc: 'Recovers HP steadily for a short time.',
    icon: { glyph: '+', color: '#e0555a' },
    levels: ramp(3, (_lv, t) => ({ mpCost: 8, duration: 30000, healPercent: lerpI(6, 14, t) / 100 })),
  },
  {
    id: 'pebble_toss', name: 'Pebble Toss', jobId: 0, type: 'attack', element: 'neutral',
    maxLevel: 3, desc: 'Throws a shell. Better than nothing.',
    icon: { glyph: '•', color: '#c9a35e' },
    levels: ramp(3, (lv, t) => ({
      mpCost: 3 + lv, damage: lerpI(48, 78, t), attackCount: 1, mobCount: 1, range: 260,
    })),
  },

  /* ------------------------------------------------------ warrior (100) -- */
  {
    id: 'improved_hp', name: 'Improved HP', jobId: 100, type: 'passive', element: 'neutral',
    maxLevel: 10, desc: 'Permanently increases maximum HP.',
    icon: { glyph: '♥', color: '#e0555a' },
    levels: ramp(10, (_lv, t) => ({ mpCost: 0, stats: { hp: lerpI(15, 150, t) } })),
  },
  {
    id: 'endure', name: 'Endure', jobId: 100, type: 'passive', element: 'neutral',
    maxLevel: 10, desc: 'Reduces damage taken and steadies your footing.',
    icon: { glyph: '▣', color: '#9aa4b4' },
    levels: ramp(10, (_lv, t) => ({ mpCost: 0, stats: { wdef: lerpI(3, 30, t), mdef: lerpI(2, 20, t) } })),
  },
  {
    id: 'power_strike', name: 'Power Strike', jobId: 100, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'A heavy single-target blow.',
    icon: { glyph: '↯', color: '#f2c14e' },
    levels: ramp(20, (lv, t) => ({
      mpCost: 6 + Math.floor(lv / 4), damage: lerpI(78, 190, t), attackCount: 1, mobCount: 1,
    })),
  },
  {
    id: 'slash_blast', name: 'Slash Blast', jobId: 100, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'A wide sweep that strikes several enemies.',
    icon: { glyph: '≫', color: '#e8933c' },
    requires: [{ skillId: 'power_strike', level: 1 }],
    levels: ramp(20, (lv, t) => ({
      mpCost: 8 + Math.floor(lv / 3), damage: lerpI(52, 122, t), attackCount: 1,
      mobCount: 3 + Math.floor(t * 3), range: 96,
    })),
  },
  {
    id: 'iron_body', name: 'Iron Body', jobId: 100, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Hardens your guard for a time.',
    icon: { glyph: '⛨', color: '#7d8ba3' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 14, duration: 60000 + t * 120000, stats: { wdef: lerpI(6, 70, t) },
    })),
  },

  /* --------------------------------------------------- blademaster (110) -- */
  {
    id: 'sword_mastery', name: 'Sword Mastery', jobId: 110, type: 'passive', element: 'neutral',
    maxLevel: 20, masterLevel: 30, desc: 'Raises minimum damage with swords and accuracy.',
    icon: { glyph: '⚔', color: '#c3ccd9' },
    weapons: ['oneHandSword', 'twoHandSword'],
    levels: ramp(20, (_lv, t) => ({ mpCost: 0, mastery: 0.15 + t * 0.45, stats: { acc: lerpI(2, 30, t) } })),
  },
  {
    id: 'weapon_booster', name: 'Weapon Booster', jobId: 110, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Speeds up your attacks.',
    icon: { glyph: '≡', color: '#8fd14f' },
    requires: [{ skillId: 'sword_mastery', level: 5 }],
    levels: ramp(20, (_lv, t) => ({
      mpCost: 22, hpCost: 12, duration: 30000 + t * 150000,
      attackSpeedScale: 0.85 - t * 0.15, stats: { speed: lerpI(2, 8, t) },
    })),
  },
  {
    id: 'rage', name: 'Rage', jobId: 110, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Trades defense for a large attack increase.',
    icon: { glyph: '▲', color: '#e0555a' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 26, duration: 60000 + t * 120000,
      stats: { watk: lerpI(4, 24, t), wdef: -lerpI(2, 12, t) },
    })),
  },
  {
    id: 'whirlwind', name: 'Whirlwind', jobId: 110, type: 'attack', element: 'neutral',
    maxLevel: 30, desc: 'Spins through everything within reach.',
    icon: { glyph: '✳', color: '#f2c14e' },
    requires: [{ skillId: 'sword_mastery', level: 3 }],
    levels: ramp(30, (lv, t) => ({
      mpCost: 14 + Math.floor(lv / 3), damage: lerpI(64, 132, t), attackCount: 2,
      mobCount: 4 + Math.floor(t * 2), range: 108,
    })),
  },

  /* --------------------------------------------------------- mage (200) -- */
  {
    id: 'improved_mp', name: 'Improved MP', jobId: 200, type: 'passive', element: 'neutral',
    maxLevel: 10, desc: 'Permanently increases maximum MP.',
    icon: { glyph: '◆', color: '#4aa3e8' },
    levels: ramp(10, (_lv, t) => ({ mpCost: 0, stats: { mp: lerpI(20, 200, t) } })),
  },
  {
    id: 'magic_guard', name: 'Magic Guard', jobId: 200, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Redirects most incoming damage to MP.',
    icon: { glyph: '◈', color: '#7d6bd0' },
    levels: ramp(20, (_lv, t) => ({ mpCost: 6, duration: 60000 + t * 240000, mpShield: 0.3 + t * 0.55 })),
  },
  {
    id: 'magic_armour', name: 'Magic Armour', jobId: 200, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'A shell of force that blunts physical blows.',
    icon: { glyph: '⛊', color: '#4aa3e8' },
    requires: [{ skillId: 'magic_guard', level: 3 }],
    levels: ramp(20, (_lv, t) => ({
      mpCost: 12, duration: 60000 + t * 180000, stats: { wdef: lerpI(6, 60, t) },
    })),
  },
  {
    id: 'energy_bolt', name: 'Energy Bolt', jobId: 200, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'A focused bolt of raw force.',
    icon: { glyph: '✦', color: '#b3dcff' },
    weapons: ['wand', 'staff'],
    levels: ramp(20, (lv, t) => ({
      mpCost: 5 + Math.floor(lv / 3), damage: lerpI(72, 176, t), attackCount: 1, mobCount: 1, range: 330,
    })),
  },
  {
    id: 'mana_claw', name: 'Mana Claw', jobId: 200, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'Two quick lashes of shaped mana.',
    icon: { glyph: '✧', color: '#d8b0ff' },
    weapons: ['wand', 'staff'],
    requires: [{ skillId: 'energy_bolt', level: 1 }],
    levels: ramp(20, (lv, t) => ({
      mpCost: 8 + Math.floor(lv / 2), damage: lerpI(46, 108, t), attackCount: 2, mobCount: 1, range: 330,
    })),
  },

  /* --------------------------------------------------- pyromancer (210) -- */
  {
    id: 'fire_arrow', name: 'Fire Arrow', jobId: 210, type: 'attack', element: 'fire',
    maxLevel: 30, desc: 'A lance of flame. Devastating against the cold-blooded.',
    icon: { glyph: '✹', color: '#e8933c' },
    weapons: ['wand', 'staff'],
    levels: ramp(30, (lv, t) => ({
      mpCost: 12 + Math.floor(lv / 2), damage: lerpI(82, 200, t), attackCount: 1, mobCount: 1, range: 360,
    })),
  },
  {
    id: 'flame_burst', name: 'Flame Burst', jobId: 210, type: 'attack', element: 'fire',
    maxLevel: 30, desc: 'Detonates a wave of fire across several enemies.',
    icon: { glyph: '❋', color: '#ff8a3d' },
    weapons: ['wand', 'staff'],
    requires: [{ skillId: 'fire_arrow', level: 5 }],
    levels: ramp(30, (lv, t) => ({
      mpCost: 22 + Math.floor(lv / 2), damage: lerpI(58, 138, t), attackCount: 1,
      mobCount: 3 + Math.floor(t * 3), range: 300,
    })),
  },
  {
    id: 'meditation', name: 'Meditation', jobId: 210, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Sharpens magical focus.',
    icon: { glyph: '◇', color: '#d8b0ff' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 20, duration: 60000 + t * 180000, stats: { matk: lerpI(4, 30, t) },
    })),
  },

  /* ------------------------------------------------------- archer (300) -- */
  {
    id: 'the_eye', name: 'The Eye', jobId: 300, type: 'passive', element: 'neutral',
    maxLevel: 20, desc: 'Permanently improves accuracy.',
    icon: { glyph: '◉', color: '#8fd14f' },
    levels: ramp(20, (_lv, t) => ({ mpCost: 0, stats: { acc: lerpI(4, 50, t) } })),
  },
  {
    id: 'critical_shot', name: 'Critical Shot', jobId: 300, type: 'passive', element: 'neutral',
    maxLevel: 20, desc: 'Chance to land critical hits with a bow.',
    icon: { glyph: '✱', color: '#ff8a3d' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 0, stats: { critRate: 0.02 + t * 0.28, critDamage: t * 0.2 },
    })),
  },
  {
    id: 'arrow_blow', name: 'Arrow Blow', jobId: 300, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'A single heavy shot.',
    icon: { glyph: '↣', color: '#f2c14e' },
    weapons: ['bow', 'crossbow'],
    levels: ramp(20, (lv, t) => ({
      mpCost: 5 + Math.floor(lv / 4), damage: lerpI(80, 186, t), attackCount: 1, mobCount: 1, range: 440,
    })),
  },
  {
    id: 'double_shot', name: 'Double Shot', jobId: 300, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'Two arrows in the time of one.',
    icon: { glyph: '⇉', color: '#8fd14f' },
    weapons: ['bow', 'crossbow'],
    requires: [{ skillId: 'arrow_blow', level: 1 }],
    levels: ramp(20, (lv, t) => ({
      mpCost: 9 + Math.floor(lv / 3), damage: lerpI(44, 102, t), attackCount: 2, mobCount: 1, range: 440,
    })),
  },
  {
    id: 'focus', name: 'Focus', jobId: 300, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Steadies your aim and your feet.',
    icon: { glyph: '◎', color: '#4aa3e8' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 15, duration: 60000 + t * 120000,
      stats: { acc: lerpI(6, 40, t), avoid: lerpI(6, 40, t) },
    })),
  },

  /* -------------------------------------------------------- rogue (400) -- */
  {
    id: 'nimble_body', name: 'Nimble Body', jobId: 400, type: 'passive', element: 'neutral',
    maxLevel: 20, desc: 'Permanently improves accuracy and avoidability.',
    icon: { glyph: '≋', color: '#8fd14f' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 0, stats: { acc: lerpI(3, 30, t), avoid: lerpI(3, 30, t) },
    })),
  },
  {
    id: 'keen_edge', name: 'Keen Edge', jobId: 400, type: 'passive', element: 'neutral',
    maxLevel: 20, desc: 'Chance to strike a vital point.',
    icon: { glyph: '✧', color: '#ff8a3d' },
    levels: ramp(20, (_lv, t) => ({ mpCost: 0, stats: { critRate: 0.02 + t * 0.22 } })),
  },
  {
    id: 'lucky_strike', name: 'Lucky Strike', jobId: 400, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'Two thrown blades that favour the fortunate.',
    icon: { glyph: '✷', color: '#f2c14e' },
    weapons: ['claw', 'dagger'],
    levels: ramp(20, (lv, t) => ({
      mpCost: 8 + Math.floor(lv / 3), damage: lerpI(42, 100, t), attackCount: 2, mobCount: 1, range: 360,
    })),
  },
  {
    id: 'double_stab', name: 'Double Stab', jobId: 400, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'Two fast thrusts at close range.',
    icon: { glyph: '⇶', color: '#c9d2e0' },
    weapons: ['dagger'],
    levels: ramp(20, (lv, t) => ({
      mpCost: 7 + Math.floor(lv / 3), damage: lerpI(48, 112, t), attackCount: 2, mobCount: 1, range: 60,
    })),
  },
  {
    id: 'dark_sight', name: 'Dark Sight', jobId: 400, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'Slip out of sight. Monsters lose track of you.',
    icon: { glyph: '◐', color: '#7d6bd0' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 14, duration: 20000 + t * 100000, stats: { avoid: lerpI(20, 120, t), speed: lerpI(-20, 0, t) },
    })),
  },

  /* ------------------------------------------------------ corsair (500) -- */
  {
    id: 'bullet_time', name: 'Bullet Time', jobId: 500, type: 'passive', element: 'neutral',
    maxLevel: 20, desc: 'Permanently improves movement and jump.',
    icon: { glyph: '⏱', color: '#8fd14f' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 0, stats: { speed: lerpI(2, 20, t), jump: lerpI(1, 12, t) },
    })),
  },
  {
    id: 'flash_fist', name: 'Flash Fist', jobId: 500, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'A straight punch with everything behind it.',
    icon: { glyph: '✥', color: '#f2c14e' },
    weapons: ['knuckle', 'none'],
    levels: ramp(20, (lv, t) => ({
      mpCost: 6 + Math.floor(lv / 4), damage: lerpI(76, 180, t), attackCount: 1, mobCount: 1, range: 62,
    })),
  },
  {
    id: 'somersault', name: 'Somersault Kick', jobId: 500, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'A spinning kick that catches a crowd.',
    icon: { glyph: '↻', color: '#e8933c' },
    weapons: ['knuckle', 'none'],
    requires: [{ skillId: 'flash_fist', level: 1 }],
    levels: ramp(20, (lv, t) => ({
      mpCost: 10 + Math.floor(lv / 3), damage: lerpI(50, 118, t), attackCount: 1,
      mobCount: 3 + Math.floor(t * 3), range: 100,
    })),
  },
  {
    id: 'double_fire', name: 'Double Fire', jobId: 500, type: 'attack', element: 'neutral',
    maxLevel: 20, desc: 'Two shots, one trigger pull.',
    icon: { glyph: '⁑', color: '#c9d2e0' },
    weapons: ['gun'],
    levels: ramp(20, (lv, t) => ({
      mpCost: 8 + Math.floor(lv / 3), damage: lerpI(46, 106, t), attackCount: 2, mobCount: 1, range: 420,
    })),
  },
  {
    id: 'dash', name: 'Dash', jobId: 500, type: 'buff', element: 'neutral',
    maxLevel: 20, desc: 'A burst of speed you can keep up.',
    icon: { glyph: '»', color: '#4aa3e8' },
    levels: ramp(20, (_lv, t) => ({
      mpCost: 12, duration: 20000 + t * 40000,
      stats: { speed: lerpI(10, 40, t), jump: lerpI(2, 10, t) },
    })),
  },
];

const BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): SkillDef {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`unknown skill id "${id}"`);
  return s;
}

export function trySkill(id: string): SkillDef | null {
  return BY_ID.get(id) ?? null;
}

/** All skills granted by a job. */
export function skillsForJob(jobId: number): SkillDef[] {
  return SKILLS.filter((s) => s.jobId === jobId);
}

/** Stats for a skill at a given level (1-based). Null if not learned. */
export function skillLevel(def: SkillDef, level: number): SkillLevel | null {
  if (level < 1) return null;
  return def.levels[Math.min(level, def.levels.length) - 1] ?? null;
}
