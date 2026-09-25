/**
 * Skill Points: optional challenges, a couple per realm, for players who want
 * to show off. Each pays a small hoard of spirit gems the first time, and the
 * Journal keeps the list (with a hint for the ones not yet earned).
 */

export interface SkillDef {
  id: string;
  level: string;
  name: string;
  desc: string;
}

export const SKILL_REWARD = 50;

export const SKILLS: SkillDef[] = [
  { id: 'fen:butterflies', level: 'fen', name: 'Butterfly Net', desc: 'Free 5 butterflies for Flick in a single visit to the Fen.' },
  { id: 'fen:boss', level: 'fen', name: 'Untouched by the Bogmaw', desc: 'Defeat the Bogmaw without taking a single hit.' },
  { id: 'sanctum:combo', level: 'sanctum', name: 'Warm-Up', desc: 'Land a 20-hit combo in the Sanctum.' },
  { id: 'sanctum:ring', level: 'sanctum', name: 'Rune Runner', desc: 'Charge over every rune in the Sanctum\'s rune ring without stopping.' },
  { id: 'falls:superflame', level: 'falls', name: 'Hot Headed', desc: 'Defeat 5 foes while Superflame burns, in the Falls.' },
  { id: 'falls:boss', level: 'falls', name: 'Out of Reach', desc: 'Defeat Skrieka without taking a single hit.' },
  { id: 'frostworks:shatter', level: 'frostworks', name: 'Shatterer', desc: 'Set off 4 Shatter reactions in a single visit to the Frostworks.' },
  { id: 'frostworks:boss', level: 'frostworks', name: 'Cold Shoulder', desc: 'Defeat Grolm without taking a single hit.' },
  { id: 'plains:bowl', level: 'plains', name: 'Bowled Over', desc: 'Ram 3 foes in one supercharged charge, on the Plains.' },
  { id: 'plains:boss', level: 'plains', name: 'Unbitten', desc: 'Defeat Graveljaw without taking a single hit.' },
  { id: 'keep:star', level: 'keep', name: 'Star Power', desc: 'Defeat 6 foes just by touching them while Invincible, in the Keep.' },
  { id: 'keep:boss', level: 'keep', name: 'Flawless', desc: 'Defeat Nyxa without taking a single hit.' },
];

export const skillKey = (id: string): string => `skill:${id}`;

export function skillsEarned(found: Record<string, boolean>): number {
  return SKILLS.filter((s) => found[skillKey(s.id)]).length;
}
