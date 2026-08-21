/**
 * The job tree.
 *
 * Five branches, four tiers, with advancement gated on level plus a stat
 * threshold plus an instructor conversation. Each advancement grants SP, a
 * one-time HP/MP bonus, and — the part that actually matters — a new skill
 * tree containing a movement or attack verb that changes how the game plays.
 *
 * See docs/DESIGN.md §4. Class names here are original to this project.
 */

export type Branch = 'novice' | 'warrior' | 'mage' | 'archer' | 'rogue' | 'corsair';
export type StatName = 'str' | 'dex' | 'int' | 'luk';

export interface JobDef {
  id: number;
  name: string;
  branch: Branch;
  /** 0 = novice, 1..4 = job advancements. */
  tier: number;
  /** Job id this advances from, or null for the novice. */
  from: number | null;
  /** Stat the branch's weapons scale from. */
  primary: StatName;
  secondary: StatName;
  /** HP gained per level-up, [min, max]. */
  hpGain: [number, number];
  mpGain: [number, number];
  /** One-time bonus granted on taking this advancement. */
  hpBonus: number;
  mpBonus: number;
  /** Requirements to advance into this job. */
  reqLevel: number;
  reqStat: number;
  /** Flavour shown by the instructor. */
  blurb: string;
}

/** Novice + the five 1st-job classes + their 2nd/3rd/4th tier branches. */
export const JOBS: readonly JobDef[] = [
  {
    id: 0, name: 'Novice', branch: 'novice', tier: 0, from: null,
    primary: 'str', secondary: 'dex',
    hpGain: [12, 16], mpGain: [10, 12], hpBonus: 0, mpBonus: 0,
    reqLevel: 1, reqStat: 0,
    blurb: 'Everyone starts here.',
  },

  /* ------------------------------------------------------------ warrior -- */
  {
    id: 100, name: 'Warrior', branch: 'warrior', tier: 1, from: 0,
    primary: 'str', secondary: 'dex',
    hpGain: [24, 28], mpGain: [4, 6], hpBonus: 320, mpBonus: 20,
    reqLevel: 10, reqStat: 35,
    blurb: 'Stand in front. Stay standing.',
  },
  {
    id: 110, name: 'Blademaster', branch: 'warrior', tier: 2, from: 100,
    primary: 'str', secondary: 'dex',
    hpGain: [24, 28], mpGain: [4, 6], hpBonus: 380, mpBonus: 30,
    reqLevel: 30, reqStat: 70,
    blurb: 'Speed over weight. Cut before you are cut.',
  },
  { id: 111, name: 'Warblade', branch: 'warrior', tier: 3, from: 110,
    primary: 'str', secondary: 'dex', hpGain: [24, 28], mpGain: [4, 6],
    hpBonus: 420, mpBonus: 40, reqLevel: 70, reqStat: 120,
    blurb: 'A blade that never leaves the swing.' },
  { id: 112, name: 'Warlord', branch: 'warrior', tier: 4, from: 111,
    primary: 'str', secondary: 'dex', hpGain: [24, 28], mpGain: [4, 6],
    hpBonus: 460, mpBonus: 50, reqLevel: 120, reqStat: 160,
    blurb: 'The line does not break where you stand.' },

  { id: 120, name: 'Shieldbearer', branch: 'warrior', tier: 2, from: 100,
    primary: 'str', secondary: 'dex', hpGain: [26, 30], mpGain: [4, 6],
    hpBonus: 420, mpBonus: 30, reqLevel: 30, reqStat: 70,
    blurb: 'Damage you never take is damage you never heal.' },
  { id: 121, name: 'Aegis', branch: 'warrior', tier: 3, from: 120,
    primary: 'str', secondary: 'dex', hpGain: [26, 30], mpGain: [4, 6],
    hpBonus: 460, mpBonus: 40, reqLevel: 70, reqStat: 120,
    blurb: 'A wall that answers back.' },
  { id: 122, name: 'Paladin', branch: 'warrior', tier: 4, from: 121,
    primary: 'str', secondary: 'dex', hpGain: [26, 30], mpGain: [4, 6],
    hpBonus: 500, mpBonus: 50, reqLevel: 120, reqStat: 160,
    blurb: 'Unmoved, and unmoving.' },

  { id: 130, name: 'Halberdier', branch: 'warrior', tier: 2, from: 100,
    primary: 'str', secondary: 'dex', hpGain: [24, 28], mpGain: [4, 6],
    hpBonus: 380, mpBonus: 30, reqLevel: 30, reqStat: 70,
    blurb: 'Reach is its own kind of armour.' },
  { id: 131, name: 'Dragoon', branch: 'warrior', tier: 3, from: 130,
    primary: 'str', secondary: 'dex', hpGain: [24, 28], mpGain: [4, 6],
    hpBonus: 420, mpBonus: 40, reqLevel: 70, reqStat: 120,
    blurb: 'Strike from above and keep moving.' },
  { id: 132, name: 'Dragon Lord', branch: 'warrior', tier: 4, from: 131,
    primary: 'str', secondary: 'dex', hpGain: [24, 28], mpGain: [4, 6],
    hpBonus: 460, mpBonus: 50, reqLevel: 120, reqStat: 160,
    blurb: 'The sky is a flanking position.' },

  /* --------------------------------------------------------------- mage -- */
  {
    id: 200, name: 'Mage', branch: 'mage', tier: 1, from: 0,
    primary: 'int', secondary: 'luk',
    hpGain: [10, 14], mpGain: [22, 24], hpBonus: 100, mpBonus: 250,
    reqLevel: 8, reqStat: 20,
    blurb: 'Fragile, until the casting starts.',
  },
  { id: 210, name: 'Pyromancer', branch: 'mage', tier: 2, from: 200,
    primary: 'int', secondary: 'luk', hpGain: [10, 14], mpGain: [22, 24],
    hpBonus: 120, mpBonus: 300, reqLevel: 30, reqStat: 70,
    blurb: 'Burning things is a legitimate strategy.' },
  { id: 211, name: 'Flamecaller', branch: 'mage', tier: 3, from: 210,
    primary: 'int', secondary: 'luk', hpGain: [10, 14], mpGain: [22, 24],
    hpBonus: 140, mpBonus: 350, reqLevel: 70, reqStat: 120,
    blurb: 'The fire answers by name now.' },
  { id: 212, name: 'Infernal', branch: 'mage', tier: 4, from: 211,
    primary: 'int', secondary: 'luk', hpGain: [10, 14], mpGain: [22, 24],
    hpBonus: 160, mpBonus: 400, reqLevel: 120, reqStat: 160,
    blurb: 'Nothing left standing, nothing left to burn.' },

  { id: 220, name: 'Cryomancer', branch: 'mage', tier: 2, from: 200,
    primary: 'int', secondary: 'luk', hpGain: [10, 14], mpGain: [22, 24],
    hpBonus: 120, mpBonus: 300, reqLevel: 30, reqStat: 70,
    blurb: 'A frozen enemy is a solved enemy.' },
  { id: 221, name: 'Frostcaller', branch: 'mage', tier: 3, from: 220,
    primary: 'int', secondary: 'luk', hpGain: [10, 14], mpGain: [22, 24],
    hpBonus: 140, mpBonus: 350, reqLevel: 70, reqStat: 120,
    blurb: 'Control first. Damage follows.' },
  { id: 222, name: 'Glacian', branch: 'mage', tier: 4, from: 221,
    primary: 'int', secondary: 'luk', hpGain: [10, 14], mpGain: [22, 24],
    hpBonus: 160, mpBonus: 400, reqLevel: 120, reqStat: 160,
    blurb: 'The room stops moving when you enter it.' },

  { id: 230, name: 'Acolyte', branch: 'mage', tier: 2, from: 200,
    primary: 'int', secondary: 'luk', hpGain: [12, 16], mpGain: [20, 22],
    hpBonus: 160, mpBonus: 280, reqLevel: 30, reqStat: 70,
    blurb: 'Keeping people alive is the harder skill.' },
  { id: 231, name: 'Priest', branch: 'mage', tier: 3, from: 230,
    primary: 'int', secondary: 'luk', hpGain: [12, 16], mpGain: [20, 22],
    hpBonus: 180, mpBonus: 330, reqLevel: 70, reqStat: 120,
    blurb: 'Light that mends and light that burns.' },
  { id: 232, name: 'Bishop', branch: 'mage', tier: 4, from: 231,
    primary: 'int', secondary: 'luk', hpGain: [12, 16], mpGain: [20, 22],
    hpBonus: 200, mpBonus: 380, reqLevel: 120, reqStat: 160,
    blurb: 'No party falls while you are watching.' },

  /* ------------------------------------------------------------- archer -- */
  {
    id: 300, name: 'Archer', branch: 'archer', tier: 1, from: 0,
    primary: 'dex', secondary: 'str',
    hpGain: [20, 24], mpGain: [14, 16], hpBonus: 220, mpBonus: 150,
    reqLevel: 10, reqStat: 25,
    blurb: 'Win the fight before it reaches you.',
  },
  { id: 310, name: 'Stalker', branch: 'archer', tier: 2, from: 300,
    primary: 'dex', secondary: 'str', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 260, mpBonus: 180, reqLevel: 30, reqStat: 70,
    blurb: 'Fast bow, faster feet.' },
  { id: 311, name: 'Pathfinder', branch: 'archer', tier: 3, from: 310,
    primary: 'dex', secondary: 'str', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 300, mpBonus: 210, reqLevel: 70, reqStat: 120,
    blurb: 'Every arrow finds a second target.' },
  { id: 312, name: 'Stormarcher', branch: 'archer', tier: 4, from: 311,
    primary: 'dex', secondary: 'str', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 340, mpBonus: 240, reqLevel: 120, reqStat: 160,
    blurb: 'A volley that does not stop.' },

  { id: 320, name: 'Bolter', branch: 'archer', tier: 2, from: 300,
    primary: 'dex', secondary: 'str', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 260, mpBonus: 180, reqLevel: 30, reqStat: 70,
    blurb: 'Slow, heavy, and it only takes one.' },
  { id: 321, name: 'Sharpshot', branch: 'archer', tier: 3, from: 320,
    primary: 'dex', secondary: 'str', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 300, mpBonus: 210, reqLevel: 70, reqStat: 120,
    blurb: 'Patience, then a hole.' },
  { id: 322, name: 'Deadeye', branch: 'archer', tier: 4, from: 321,
    primary: 'dex', secondary: 'str', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 340, mpBonus: 240, reqLevel: 120, reqStat: 160,
    blurb: 'The shot was over before it was fired.' },

  /* -------------------------------------------------------------- rogue -- */
  {
    id: 400, name: 'Rogue', branch: 'rogue', tier: 1, from: 0,
    primary: 'luk', secondary: 'dex',
    hpGain: [20, 24], mpGain: [14, 16], hpBonus: 220, mpBonus: 150,
    reqLevel: 10, reqStat: 25,
    blurb: 'Nothing you do should be seen twice.',
  },
  { id: 410, name: 'Shadowblade', branch: 'rogue', tier: 2, from: 400,
    primary: 'luk', secondary: 'dex', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 260, mpBonus: 180, reqLevel: 30, reqStat: 70,
    blurb: 'Range, from a class nobody expects to have it.' },
  { id: 411, name: 'Nightstalker', branch: 'rogue', tier: 3, from: 410,
    primary: 'luk', secondary: 'dex', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 300, mpBonus: 210, reqLevel: 70, reqStat: 120,
    blurb: 'Gone before the first one lands.' },
  { id: 412, name: 'Shadowlord', branch: 'rogue', tier: 4, from: 411,
    primary: 'luk', secondary: 'dex', hpGain: [20, 24], mpGain: [14, 16],
    hpBonus: 340, mpBonus: 240, reqLevel: 120, reqStat: 160,
    blurb: 'The room empties and no one saw why.' },

  { id: 420, name: 'Cutpurse', branch: 'rogue', tier: 2, from: 400,
    primary: 'luk', secondary: 'str', hpGain: [22, 26], mpGain: [14, 16],
    hpBonus: 280, mpBonus: 180, reqLevel: 30, reqStat: 70,
    blurb: 'Up close, where the real money is.' },
  { id: 421, name: 'Bladedancer', branch: 'rogue', tier: 3, from: 420,
    primary: 'luk', secondary: 'str', hpGain: [22, 26], mpGain: [14, 16],
    hpBonus: 320, mpBonus: 210, reqLevel: 70, reqStat: 120,
    blurb: 'Every step is part of the attack.' },
  { id: 422, name: 'Phantom', branch: 'rogue', tier: 4, from: 421,
    primary: 'luk', secondary: 'str', hpGain: [22, 26], mpGain: [14, 16],
    hpBonus: 360, mpBonus: 240, reqLevel: 120, reqStat: 160,
    blurb: 'You were never actually there.' },

  /* ------------------------------------------------------------ corsair -- */
  {
    id: 500, name: 'Corsair', branch: 'corsair', tier: 1, from: 0,
    primary: 'str', secondary: 'dex',
    hpGain: [22, 28], mpGain: [18, 20], hpBonus: 260, mpBonus: 180,
    reqLevel: 10, reqStat: 20,
    blurb: 'Improvise. Loudly.',
  },
  { id: 510, name: 'Brawler', branch: 'corsair', tier: 2, from: 500,
    primary: 'str', secondary: 'dex', hpGain: [24, 30], mpGain: [18, 20],
    hpBonus: 320, mpBonus: 200, reqLevel: 30, reqStat: 70,
    blurb: 'Fists, and a complete disregard for range.' },
  { id: 511, name: 'Ironfist', branch: 'corsair', tier: 3, from: 510,
    primary: 'str', secondary: 'dex', hpGain: [24, 30], mpGain: [18, 20],
    hpBonus: 360, mpBonus: 230, reqLevel: 70, reqStat: 120,
    blurb: 'Momentum is a weapon you can carry.' },
  { id: 512, name: 'Titanfist', branch: 'corsair', tier: 4, from: 511,
    primary: 'str', secondary: 'dex', hpGain: [24, 30], mpGain: [18, 20],
    hpBonus: 400, mpBonus: 260, reqLevel: 120, reqStat: 160,
    blurb: 'The floor moves when you land.' },

  { id: 520, name: 'Gunner', branch: 'corsair', tier: 2, from: 500,
    primary: 'dex', secondary: 'str', hpGain: [22, 26], mpGain: [18, 20],
    hpBonus: 280, mpBonus: 200, reqLevel: 30, reqStat: 70,
    blurb: 'Keep the distance, keep the trigger down.' },
  { id: 521, name: 'Privateer', branch: 'corsair', tier: 3, from: 520,
    primary: 'dex', secondary: 'str', hpGain: [22, 26], mpGain: [18, 20],
    hpBonus: 320, mpBonus: 230, reqLevel: 70, reqStat: 120,
    blurb: 'Bring friends. Yours are made of gunpowder.' },
  { id: 522, name: 'Dreadnought', branch: 'corsair', tier: 4, from: 521,
    primary: 'dex', secondary: 'str', hpGain: [22, 26], mpGain: [18, 20],
    hpBonus: 360, mpBonus: 260, reqLevel: 120, reqStat: 160,
    blurb: 'A one-person broadside.' },
];

const BY_ID = new Map(JOBS.map((j) => [j.id, j]));

export function getJob(id: number): JobDef {
  const job = BY_ID.get(id);
  if (!job) throw new Error(`unknown job id ${id}`);
  return job;
}

/** Jobs that can be advanced into from the given job. */
export function advancementsFrom(jobId: number): JobDef[] {
  if (jobId === 0) return JOBS.filter((j) => j.tier === 1);
  return JOBS.filter((j) => j.from === jobId);
}

export const BRANCH_LABEL: Record<Branch, string> = {
  novice: 'Novice',
  warrior: 'Warrior',
  mage: 'Mage',
  archer: 'Archer',
  rogue: 'Rogue',
  corsair: 'Corsair',
};

/** SP granted per level once you have a job. */
export const SP_PER_LEVEL = 3;
/** AP granted per level, always. */
export const AP_PER_LEVEL = 5;
/** Bonus SP granted on each advancement. */
export const SP_ON_ADVANCE = 1;
