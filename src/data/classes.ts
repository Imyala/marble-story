/**
 * Selectable starting classes, as presented on the class-select screen.
 *
 * This is presentation data layered over the job tree in jobs.ts — the detail
 * panel needs a tagline, an origin, a traversal verb and a portrait, none of
 * which belong in the mechanical job definition.
 *
 * "Classic" is the original progression: start as a Novice with no class and
 * choose at level 10. The other cards start you in the class immediately.
 */
import type { Branch, StatName } from './jobs';
import type { CharacterLook, WeaponArt } from '../art/character';

export interface ClassOption {
  id: string;
  /** Job the character starts in. 0 is the Novice. */
  jobId: number;
  name: string;
  branch: Branch;
  /** Shown above the name, e.g. "Warrior". */
  category: string;
  /** The subtitle line, e.g. "Otherworldly Psychic". */
  title: string;
  description: string;
  /** Detail-panel rows, mirroring the reference layout. */
  origin: string;
  movement: string;
  mainStat: StatName | '—';
  /** Marks a newly added or reworked class in the grid. */
  badge?: 'new' | 'classic';
  /** Starting weapon item id. */
  weapon: string;
  /** Skills the character knows at creation. */
  skills: string[];
  /** Quick-slot layout at creation. */
  quickSlots: (string | null)[];
  /** Portrait and in-world appearance. */
  look: Partial<CharacterLook> & { weapon: WeaponArt };
  /** Card accent. */
  accent: string;
}

export const CLASS_OPTIONS: readonly ClassOption[] = [
  {
    id: 'warrior', jobId: 100, name: 'Warrior', branch: 'warrior',
    category: 'Warrior', title: 'The One Who Stays Standing',
    description:
      'Stands in front so nobody else has to. The most health, the heaviest ' +
      'weapons, and the shortest reach — a warrior solves a room by walking ' +
      'into it and not falling over.',
    origin: 'Mountain Hold', movement: 'Charge', mainStat: 'str',
    weapon: 'training_sword',
    skills: ['power_strike'],
    quickSlots: ['power_strike', null, null, null, null, null, null, null],
    look: { top: '#8a3a3a', bottom: '#3b2b2b', hair: '#2a2a2a', hairStyle: 'spiky', weapon: 'sword' },
    accent: '#e0555a',
  },
  {
    id: 'mage', jobId: 200, name: 'Mage', branch: 'mage',
    category: 'Magician', title: 'Fragile Until The Casting Starts',
    description:
      'Breaks rooms open at range and dies to a stiff breeze. Mages trade ' +
      'every point of survivability for reach and area, and spend the whole ' +
      'game managing that bargain.',
    origin: 'Verdant Vale', movement: 'Blink', mainStat: 'int',
    weapon: 'apprentice_wand',
    skills: ['energy_bolt', 'magic_guard'],
    quickSlots: ['energy_bolt', 'magic_guard', null, null, null, null, null, null],
    look: { top: '#6b4a8a', bottom: '#3a3350', hair: '#d8d8d8', hairStyle: 'long', weapon: 'wand' },
    accent: '#7d6bd0',
  },
  {
    id: 'archer', jobId: 300, name: 'Archer', branch: 'archer',
    category: 'Bowman', title: 'Win It Before It Arrives',
    description:
      'Ends fights at a distance and hates being touched. High accuracy, ' +
      'high critical rate, and a constant, deliberate retreat.',
    origin: 'Thorn Thicket', movement: 'Backstep', mainStat: 'dex',
    weapon: 'short_bow',
    skills: ['arrow_blow', 'critical_shot'],
    quickSlots: ['arrow_blow', null, null, null, null, null, null, null],
    look: { top: '#3f6b52', bottom: '#2b4638', hair: '#a8763f', hairStyle: 'ponytail', weapon: 'bow' },
    accent: '#8fd14f',
  },
  {
    id: 'rogue', jobId: 400, name: 'Rogue', branch: 'rogue',
    category: 'Thief', title: 'Never Where The Hit Lands',
    description:
      'Fast, evasive, and unreasonably lucky. Rogues stack avoidability and ' +
      'critical chance until being hit becomes somebody else\'s problem.',
    origin: 'Kerning Underside', movement: 'Dark Sight', mainStat: 'luk',
    weapon: 'rusty_dagger',
    skills: ['double_stab', 'nimble_body'],
    quickSlots: ['double_stab', null, null, null, null, null, null, null],
    look: { top: '#2f3350', bottom: '#1d2033', hair: '#4a3f66', hairStyle: 'short', cape: '#241f36', weapon: 'sword' },
    accent: '#8b93a8',
  },
  {
    id: 'corsair', jobId: 500, name: 'Corsair', branch: 'corsair',
    category: 'Pirate', title: 'Improvise, Loudly',
    description:
      'Fists or gunpowder, and a complete disregard for which one the ' +
      'situation called for. The most mobile class, and the least subtle.',
    origin: 'Tidewatch Harbour', movement: 'Dash', mainStat: 'str',
    weapon: 'worn_knuckle',
    skills: ['flash_fist', 'bullet_time'],
    quickSlots: ['flash_fist', null, null, null, null, null, null, null],
    look: { top: '#c9702f', bottom: '#3b3b50', hair: '#5b3a24', hairStyle: 'short', weapon: 'claw' },
    accent: '#e8933c',
  },
  {
    id: 'novice', jobId: 0, name: 'Novice', branch: 'novice',
    category: 'Beginner', title: 'Nothing In Particular, Yet',
    description:
      'The original way in. Start with no class at all, learn the game with ' +
      'a wooden sword, and choose your path from an instructor at level 10 — ' +
      'when you have some idea what you are choosing between.',
    origin: 'Marble Isle', movement: 'Walking', mainStat: '—',
    badge: 'classic',
    weapon: 'training_sword',
    skills: ['pebble_toss', 'nimble_feet', 'recovery'],
    quickSlots: ['pebble_toss', 'nimble_feet', 'recovery', null, null, null, null, null],
    look: { top: '#4f7fd4', bottom: '#3b4560', hair: '#8b4a2f', hairStyle: 'short', weapon: 'sword' },
    accent: '#7fd8e8',
  },
];

const BY_ID = new Map(CLASS_OPTIONS.map((c) => [c.id, c]));

export function getClassOption(id: string): ClassOption {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`unknown class option "${id}"`);
  return c;
}

export function tryClassOption(id: string): ClassOption | null {
  return BY_ID.get(id) ?? null;
}

export const DEFAULT_CLASS = 'warrior';
