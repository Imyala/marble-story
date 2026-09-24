import type { DragonLook } from '../player/dragonRig';

/**
 * Wyrmling's world and cast. All original, written as a tribute to the
 * shape of the classic "young dragon raised by others learns who he is"
 * adventure.
 */

export const SPEAKERS: Record<string, { name: string; color: string }> = {
  aster: { name: 'Aster', color: '#c9a2ff' },
  flick: { name: 'Flick', color: '#ffe070' },
  glimmer: { name: 'Mother Glimmer', color: '#fff0a0' },
  emberhold: { name: 'Emberhold', color: '#ff8a50' },
  stormcrest: { name: 'Stormcrest', color: '#7ac8ff' },
  frostfang: { name: 'Frostfang', color: '#bff4ff' },
  stonehide: { name: 'Stonehide', color: '#9be06a' },
  nyxa: { name: 'Nyxa', color: '#e060ff' },
  hollow: { name: 'The Hollow King', color: '#b04cff' },
  gloom: { name: 'Gloomling', color: '#c090ff' },
  bogmaw: { name: 'Bogmaw', color: '#9ab060' },
  skrieka: { name: 'Skrieka', color: '#7ac8ff' },
  grolm: { name: 'Forgemaster Grolm', color: '#bfe8ff' },
  graveljaw: { name: 'Graveljaw', color: '#c8a878' },
};

export const PROLOGUE = [
  'In the age of the Twin Moons, the dragons of Veyra kept their eggs in the Warden Sanctum, guarded by the four masters of breath.',
  'Then came the night the moons swallowed the sun. The Hollow King\'s shadow host poured out of the dark, and the Sanctum burned.',
  'The eggs were lost. All but one.',
  'Old Emberhold set a single violet egg adrift on the river, and prayed it would find a gentler home.',
  'It came to rest among the fireflies of Marshlight Fen.',
  'Twelve summers later...',
];

export const EMBERHOLD: DragonLook = {
  body: 0xc8452a, belly: 0xf2b35a, horn: 0xe8d8b0, membrane: 0xf0902a, eye: 0xffd040, spikes: 0xe8d8b0,
  scale: 1.9, hornStyle: 'curled', tailStyle: 'fan', slender: 0.3, beard: true,
};
export const STORMCREST: DragonLook = {
  body: 0xe8c848, belly: 0x6a8ad8, horn: 0x3a4a8a, membrane: 0x5a8ae8, eye: 0x7ac8ff, spikes: 0x3a4a8a,
  scale: 1.6, hornStyle: 'crown', tailStyle: 'arrow', slender: 0.65,
};
export const FROSTFANG: DragonLook = {
  body: 0x9ac8e8, belly: 0xe8f4ff, horn: 0xffffff, membrane: 0xbfe8ff, eye: 0x60d0ff, spikes: 0xffffff,
  scale: 1.8, hornStyle: 'blade', tailStyle: 'fan', slender: 0.85,
};
export const STONEHIDE: DragonLook = {
  body: 0x5a8a3a, belly: 0xc8b070, horn: 0x8a7a5a, membrane: 0x9ab060, eye: 0xffb030, spikes: 0x8a7a5a,
  scale: 2.3, hornStyle: 'curled', tailStyle: 'club', slender: 0, beard: true,
};
export const NYXA: DragonLook = {
  body: 0x1e1628, belly: 0x8a2a6a, horn: 0xd0d0e0, membrane: 0x8a1a5a, eye: 0xff3080, spikes: 0xd0d0e0,
  scale: 1.35, hornStyle: 'blade', tailStyle: 'scythe', slender: 0.95, glowEyes: true,
};

/** Nyxa once the Gloom has let go of her. */
export const NYXA_FREED: DragonLook = { ...NYXA, eye: 0x8ad8ff, glowEyes: false };

export interface LevelInfo {
  name: string;
  blurb: string;
  collectibles: number;
}

export const LEVEL_INFO: Record<string, LevelInfo> = {
  fen: { name: 'Marshlight Fen', blurb: 'The firefly marsh where Aster grew up.', collectibles: 7 },
  sanctum: { name: 'Warden Sanctum', blurb: 'The ruined temple of the Wardens.', collectibles: 5 },
  falls: { name: 'Stormspire Falls', blurb: 'Cliffs, waterfalls and a spire struck by endless lightning.', collectibles: 7 },
  frostworks: { name: 'The Frostworks', blurb: 'An ice forge hammering out chains for the Hollow King.', collectibles: 7 },
  plains: { name: 'Stonewild Plains', blurb: 'Tall grass over stone older than dragons.', collectibles: 7 },
  keep: { name: 'Eclipse Keep', blurb: 'Nyxa\'s fortress beneath the darkened moons.', collectibles: 5 },
};

export const RELICS: Record<string, { title: string; text: string; level: string }> = {
  fen1: { level: 'fen', title: 'The Drifting Egg', text: 'Here the river slows and the fireflies gather. A reed raft washed ashore on the night of the Eclipse, bearing a single egg that glowed like dusk.' },
  fen2: { level: 'fen', title: 'Firefly Custom', text: 'Fireflies name their young for the first light they see. The hatchling from the raft saw only the violet of his own shell, so they called him Aster, after the marsh flower of that color.' },
  fen3: { level: 'fen', title: 'Marsh Warning', text: 'Carved on the old stone: when the twin moons darken, the Gloom crawls up from the roots of the world. Keep the lanterns lit.' },
  sanc1: { level: 'sanctum', title: 'The Four Wardens', text: 'Fire to kindle, Lightning to quicken, Ice to preserve, Earth to endure. Four Wardens keep the four breaths, and teach them to each hatchling in turn.' },
  sanc2: { level: 'sanctum', title: 'The Violet Line', text: 'Once in an age a dragon hatches who can learn every breath. The last such dragon grew hungry for a fifth, and the hunger hollowed him out.' },
  falls1: { level: 'falls', title: 'Stormspire', text: 'Lightning strikes the spire nine hundred times a year. Stormcrest claims to have counted every one. Nobody has checked.' },
  falls2: { level: 'falls', title: 'The Last Roc', text: 'The storm rocs once carried the Wardens\' messages. The Gloom twisted the last of them into something that only screams.' },
  falls3: { level: 'falls', title: 'Rain Bell', text: 'Ring once for rain, twice for thunder. Never three times.' },
  frost1: { level: 'frostworks', title: 'The Frostworks', text: 'Built to keep the Sanctum\'s harvest through the long winters, the ice forges now hammer out chains of rime for the Hollow King.' },
  frost2: { level: 'frostworks', title: 'Frostfang\'s Verse', text: 'Cold is not cruel. Cold is patient. Cold remembers the shape of everything it holds.' },
  frost3: { level: 'frostworks', title: 'Golem Plans', text: 'A golem needs a core. A core needs a heart that will not stop. The Forgemaster found one.' },
  plains1: { level: 'plains', title: 'The Stonewild', text: 'Grass as tall as a Warden, and under it stone older than dragons. Stonehide says the plains are only resting.' },
  plains2: { level: 'plains', title: 'Burrow Signs', text: 'When the ground hums, stand still. When it stops humming, run.' },
  plains3: { level: 'plains', title: 'The Standing Stones', text: 'Each stone marks a Warden who fell defending the Sanctum. There are more stones every age.' },
  keep1: { level: 'keep', title: 'Nyxa', text: 'She was taken from the Sanctum as an egg on the same Eclipse night. The shadow raised her. The shadow is all she remembers.' },
  keep2: { level: 'keep', title: 'The Hollow King', text: 'He does not sleep, he does not eat, he does not age. He only waits for the moons to align again.' },
  keep3: { level: 'keep', title: 'The Last Page', text: 'If a violet dragon rises again, they will stand where I stood, and choose what I could not. (Torn from a Warden\'s journal.)' },
};

export const ENDING = [
  'The shadow broke like a fever, and Nyxa fell silent in the rubble of the keep.',
  'When she woke, her eyes were no longer red. She did not remember the Hollow King\'s voice. She remembered the smell of the Sanctum\'s hatchery, and a violet egg that hummed beside hers.',
  'Far below Veyra, something hollow laughed.',
  'The twin moons are drifting apart. They will meet again.',
  'But the Wardens are free, the breaths are taught, and the Sanctum has two young dragons again.',
  '<b style="font-style:normal;letter-spacing:.3em;color:#f5c46b">THE END</b><br><small>of the first flight</small>',
];
