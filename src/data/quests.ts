/**
 * Quests.
 *
 * Most quests are "kill 20 of X" on purpose. The quest system's real job is
 * not narrative — it is to point players at the right map for their level and
 * to convert the ETC-tab junk piling up in their inventory into a reason to
 * keep grinding. Story lives in a small number of hand-written lines on top.
 *
 * See docs/DESIGN.md §9.2.
 */

export interface QuestRequirements {
  minLevel?: number;
  maxLevel?: number;
  /** Job ids that may take the quest; absent means anyone. */
  jobs?: number[];
  /** Quests that must be complete first. */
  quests?: string[];
}

export interface QuestObjectives {
  /** mobId → kills required. */
  kills?: Record<string, number>;
  /** itemId → quantity required (consumed on turn-in). */
  items?: Record<string, number>;
}

export interface QuestRewards {
  exp?: number;
  meso?: number;
  items?: { id: string; qty: number }[];
  sp?: number;
  fame?: number;
}

export interface QuestDef {
  id: string;
  name: string;
  summary: string;
  npcStart: string;
  npcEnd: string;
  requires: QuestRequirements;
  objectives: QuestObjectives;
  rewards: QuestRewards;
  /** Lines shown when offering, while in progress, and on completion. */
  offerText: string;
  progressText: string;
  completeText: string;
}

export const QUESTS: readonly QuestDef[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    summary: 'Mira wants you to thin out the snails in the meadow.',
    npcStart: 'guide_mira', npcEnd: 'guide_mira',
    requires: { minLevel: 1 },
    objectives: { kills: { snail: 8 } },
    rewards: { exp: 40, meso: 120, items: [{ id: 'red_potion', qty: 5 }] },
    offerText:
      'The snails have got into the meadow again. Eight of them and the path is walkable. ' +
      'Press Ctrl to swing, and mind the ones behind you.',
    progressText: 'Still snails out there. Keep at it.',
    completeText: 'That is the path clear. Here — potions, and something for your trouble.',
  },
  {
    id: 'shells_for_pell',
    name: 'Shells for Pell',
    summary: 'Pell buys snail shells. He is not saying what for.',
    npcStart: 'shop_pell', npcEnd: 'shop_pell',
    requires: { minLevel: 2, quests: ['first_steps'] },
    objectives: { items: { snail_shell: 10 } },
    rewards: { exp: 90, meso: 400, items: [{ id: 'red_potion', qty: 8 }] },
    offerText:
      'Ten snail shells, clean ones. Do not ask what for. I pay better than the shells are worth, ' +
      'which should tell you something.',
    progressText: 'Ten shells. I will know if you shake them.',
    completeText: 'Good weight on these. Pleasure doing business.',
  },
  {
    id: 'proving_ground',
    name: 'Proving Ground',
    summary: 'Hale will not talk about jobs until you have fought something that fights back.',
    npcStart: 'instructor_hale', npcEnd: 'instructor_hale',
    requires: { minLevel: 6 },
    objectives: { kills: { green_slime: 12, orange_mushroom: 6 } },
    rewards: { exp: 320, meso: 900, items: [{ id: 'orange_potion', qty: 5 }] },
    offerText:
      'Anyone can hit a snail. Go to Slime Hollow. Twelve slimes, six mushrooms. ' +
      'Come back and we will talk about what you are going to be.',
    progressText: 'Hollow is east of the meadow. You will hear them before you see them.',
    completeText:
      'You came back standing. That is the whole test, really. ' +
      'Talk to me again when you hit level ten and we will make it official.',
  },
  {
    id: 'boar_trouble',
    name: 'Boar Trouble',
    summary: 'Dagny needs the downs cleared before the harvest carts go through.',
    npcStart: 'quest_dagny', npcEnd: 'quest_dagny',
    requires: { minLevel: 14 },
    objectives: { kills: { field_boar: 20 }, items: { boar_tusk: 8 } },
    rewards: { exp: 2200, meso: 4200, items: [{ id: 'leather_top', qty: 1 }, { id: 'orange_potion', qty: 12 }] },
    offerText:
      'Boars on the downs, and the carts come through in a week. Twenty of them, and bring me ' +
      'eight tusks so I can show the council I am not making it up.',
    progressText: 'Twenty boars, eight tusks. They charge — do not stand still.',
    completeText: 'That will do it. Take the vest, you have earned better than what you are wearing.',
  },
  {
    id: 'thicket_survey',
    name: 'Thicket Survey',
    summary: 'Something is spreading in the thicket. Dagny wants samples.',
    npcStart: 'quest_dagny', npcEnd: 'quest_dagny',
    requires: { minLevel: 18, quests: ['boar_trouble'] },
    objectives: { items: { thorn_petal: 15 } },
    rewards: { exp: 5200, meso: 8000, items: [{ id: 'traveller_cape', qty: 1 }] },
    offerText:
      'The blooms in the thicket are not native and they are not stopping. Fifteen petals. ' +
      'Wear something with sleeves — they are poisonous, and they do not miss.',
    progressText: 'Fifteen petals. Fire works well on them, if you have any.',
    completeText: 'These are worse than I thought. Take the cape. You are going to keep going out there.',
  },
  {
    id: 'the_warden',
    name: 'The Warden',
    summary: 'Something old is awake at the bottom of the Grey Cavern.',
    npcStart: 'quest_dagny', npcEnd: 'quest_dagny',
    requires: { minLevel: 28, quests: ['thicket_survey'] },
    objectives: { items: { golem_core: 12 } },
    rewards: { exp: 42000, meso: 32000, items: [{ id: 'white_potion', qty: 20 }], sp: 1, fame: 1 },
    offerText:
      'The golems in the cavern all turned the same direction three nights ago. ' +
      'Bring me twelve cores. Whatever is down there is waking up, and I want to know what it is made of.',
    progressText: 'Twelve golem cores. They are warm when you pull them out — that is the part that worries me.',
    completeText:
      'Warm. All twelve. There is a hall past the deep shaft and I am not going to pretend ' +
      'I can stop you going in. Level thirty, and not a day before.',
  },
];

const BY_ID = new Map(QUESTS.map((q) => [q.id, q]));

export function getQuest(id: string): QuestDef {
  const q = BY_ID.get(id);
  if (!q) throw new Error(`unknown quest id "${id}"`);
  return q;
}

export function tryQuest(id: string): QuestDef | null {
  return BY_ID.get(id) ?? null;
}

export function questsForNpc(npcId: string): QuestDef[] {
  return QUESTS.filter((q) => q.npcStart === npcId || q.npcEnd === npcId);
}

export function allQuests(): readonly QuestDef[] {
  return QUESTS;
}
