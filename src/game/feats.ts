import type { SaveData } from './progress';
import { eggsFound } from './progress';

/**
 * Feats: long-term goals across the whole adventure, each paying spirit gems
 * once. Progress reads from the save, so they also count what was done before.
 * Plus the Bestiary: what Flick knows about every foe you have met.
 */

/** Extra counters kept alongside the base stats (all optional, for old saves). */
export interface ExtraStats {
  breaks?: number;
  kegs?: number;
  perfects?: number;
  elites?: number;
  bestRank?: number;
  chests?: number;
}

export function extra(s: SaveData): ExtraStats {
  return s.stats as unknown as ExtraStats;
}

export function bump(s: SaveData, key: keyof ExtraStats, by = 1): void {
  const e = extra(s);
  e[key] = (e[key] ?? 0) + by;
}

export interface FeatDef {
  id: string;
  name: string;
  desc: string;
  goal: number;
  reward: number;
  progress(s: SaveData): number;
}

const letters = (s: SaveData) => Object.keys(s.found).filter((k) => k.startsWith('letter:')).length;

export const FEATS: FeatDef[] = [
  { id: 'kills1', name: 'Gloombane', desc: 'Defeat 50 foes.', goal: 50, reward: 60, progress: (s) => s.stats.kills },
  { id: 'kills2', name: 'Scourge of Shadows', desc: 'Defeat 300 foes.', goal: 300, reward: 200, progress: (s) => s.stats.kills },
  { id: 'elites', name: 'Gilded Hunter', desc: 'Defeat 8 gold-lit elite foes.', goal: 8, reward: 120, progress: (s) => extra(s).elites ?? 0 },
  { id: 'react1', name: 'Elementalist', desc: 'Set off 10 elemental reactions.', goal: 10, reward: 60, progress: (s) => s.stats.reactions },
  { id: 'react2', name: 'Storm Weaver', desc: 'Set off 60 elemental reactions.', goal: 60, reward: 180, progress: (s) => s.stats.reactions },
  { id: 'combo', name: 'Unbroken', desc: 'Land a 30-hit combo.', goal: 30, reward: 120, progress: (s) => s.stats.bestCombo },
  { id: 'rank', name: 'Legend in the Making', desc: 'Reach the Legendary style rank.', goal: 5, reward: 150, progress: (s) => extra(s).bestRank ?? 0 },
  { id: 'dodge', name: 'Untouchable', desc: 'Pull off 25 perfect dodges.', goal: 25, reward: 100, progress: (s) => extra(s).perfects ?? 0 },
  { id: 'smash', name: 'Demolitionist', desc: 'Smash 120 crates, barrels, urns and pods.', goal: 120, reward: 90, progress: (s) => extra(s).breaks ?? 0 },
  { id: 'kegs', name: 'Powder Monkey', desc: 'Blow up 25 powder kegs.', goal: 25, reward: 90, progress: (s) => extra(s).kegs ?? 0 },
  { id: 'chests', name: 'Treasure Seeker', desc: 'Open 8 treasure chests.', goal: 8, reward: 120, progress: (s) => extra(s).chests ?? 0 },
  { id: 'eggs', name: 'Egg Warden', desc: 'Return 14 lost dragon eggs.', goal: 14, reward: 150, progress: (s) => eggsFound(s) },
  { id: 'letters', name: 'Archivist', desc: 'Read 16 lore letters.', goal: 16, reward: 150, progress: (s) => letters(s) },
];

export const featKey = (id: string): string => `feat:${id}`;

/** Feats newly completed by the current save (not yet paid). */
export function newlyDone(s: SaveData): FeatDef[] {
  return FEATS.filter((f) => !s.found[featKey(f.id)] && f.progress(s) >= f.goal);
}

// --- bestiary ---------------------------------------------------------------------

export const BESTIARY: Record<string, { blurb: string; tip: string }> = {
  grunt: { blurb: 'The Gloom\'s foot soldiers: shadow given teeth and a club, and a fondness for numbers.', tip: 'Mix Horn and Tail for style. They panic when they burn.' },
  slinger: { blurb: 'Hooded casters who keep their distance and throw bolts of shadow.', tip: 'Close in fast, or bat their bolts straight back with a well-timed Horn.' },
  sapper: { blurb: 'Gloomlings who never go anywhere without a powder keg. They throw them, too.', tip: 'Watch for the red ring where a keg will land. Fire on the keg on its back sets it off among its friends.' },
  shieldbearer: { blurb: 'A wall of iron and stubbornness. The shield turns aside anything from the front.', tip: 'Get behind it, or break the guard with Tail, a Charge or Earth.' },
  brute: { blurb: 'Big, slow, and not bothered by being hit. Its slam sends out a shockwave.', tip: 'Jump the shockwave, then punish. Launchers will not lift it.' },
  wisp: { blurb: 'Drifting shades that dive from above.', tip: 'Breath, bursts and air combos reach them. Lightning hits hard.' },
  stormWisp: { blurb: 'A wisp full of stolen storm. Lightning passes straight through it.', tip: 'Earth breaks it apart; fire and ice work too.' },
  frostGolem: { blurb: 'Rime packed into a giant. Ice only makes it stronger.', tip: 'Melt it with fire. Earth cracks it too.' },
  stoneGolem: { blurb: 'A cairn that got up and walked. Shrugs off earth and horns alike.', tip: 'Freeze it and Shatter it with a heavy blow.' },
  crawler: { blurb: 'A Shellback: armored on top, soft underneath.', tip: 'Flip it with a heavy hit (Tail or Ground Pound), then strike the belly.' },
  knight: { blurb: 'Nyxa\'s elite guard. Patient, precise, and it punishes button mashing.', tip: 'Break its guard with heavy hits or get behind it; dodge its lunge.' },
  totem: { blurb: 'A shard of the Gloom planted in the ground, shielding every foe near it.', tip: 'Smash the totem first and the others lose their ward.' },
};
