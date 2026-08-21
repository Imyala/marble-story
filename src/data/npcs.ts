/**
 * NPCs and their dialogue.
 *
 * Every NPC — shopkeeper, storage keeper, job instructor, quest giver — is the
 * same small state machine with a different script. Quest offers are injected
 * into the root node at runtime rather than hand-written into each script, so
 * adding a quest never means editing an NPC.
 *
 * See docs/DESIGN.md §9.1.
 */
import type { CharacterLook } from '../art/character';

export type DialogueAction =
  | { kind: 'shop' }
  | { kind: 'expand'; tab: 'equip' | 'use' | 'setup' | 'etc' | 'cash'; cost: number }
  | { kind: 'heal'; cost: number }
  | { kind: 'advance' }
  | { kind: 'quest'; questId: string }
  | { kind: 'warp'; mapId: string; portal: string; cost?: number }
  | { kind: 'close' };

export interface DialogueOption {
  label: string;
  /** Node to move to. Omitted means the action closes the conversation. */
  next?: string;
  action?: DialogueAction;
  /** Hide the option unless the player meets this. */
  requires?: { minLevel?: number; noJob?: boolean; hasJob?: boolean };
}

export interface DialogueNode {
  text: string;
  options?: DialogueOption[];
}

export interface NpcDef {
  id: string;
  name: string;
  title: string;
  look: Partial<CharacterLook>;
  /** Entry node id. */
  root: string;
  nodes: Record<string, DialogueNode>;
  /** Item ids sold here. */
  shop?: string[];
}

export const NPCS: readonly NpcDef[] = [
  {
    id: 'guide_mira',
    name: 'Mira',
    title: 'Island Guide',
    look: { top: '#4fa8c4', bottom: '#2f5f70', hair: '#3a2a20', hairStyle: 'ponytail', weapon: 'none' },
    root: 'root',
    nodes: {
      root: {
        text:
          'You look new. Everyone does, on their first day.\n\n' +
          'Arrow keys to walk, Alt to jump, Ctrl to swing whatever you are holding. ' +
          'Down and Alt together drops you through a platform. That is most of it.',
        options: [
          { label: 'How do I get stronger?', next: 'levels' },
          { label: 'Where should I go?', next: 'where' },
          { label: 'Nothing, thanks.', action: { kind: 'close' } },
        ],
      },
      levels: {
        text:
          'Kill things, collect the experience, level up. Every level gives you five ability ' +
          'points — press A and spend them on whatever your weapon likes.\n\n' +
          'At ten, Hale will talk to you about a job. That is when the game actually starts.',
        options: [{ label: 'Back', next: 'root' }],
      },
      where: {
        text:
          'East, through the meadow. Snails first, then the hollow past it. ' +
          'When the things you are hitting stop dying quickly, turn around and come back — ' +
          'that is the map telling you it is not your map yet.',
        options: [{ label: 'Back', next: 'root' }],
      },
    },
  },

  {
    id: 'shop_pell',
    name: 'Pell',
    title: 'General Goods',
    look: { top: '#a8763f', bottom: '#5e3f22', hair: '#6b6b6b', hairStyle: 'short', weapon: 'none' },
    root: 'root',
    shop: [
      'red_potion', 'blue_potion', 'orange_potion', 'green_potion', 'white_potion',
      'mana_elixir', 'town_scroll', 'training_sword', 'cloth_top', 'cloth_bottom',
      'leather_cap', 'leather_boots', 'work_gloves', 'wooden_shield',
      'scroll_weapon_atk', 'scroll_armour_def',
    ],
    nodes: {
      root: {
        text: 'Potions, rope, and the occasional thing I should not be selling. What do you need?',
        options: [
          { label: 'Show me your goods.', action: { kind: 'shop' } },
          { label: 'Just looking.', action: { kind: 'close' } },
        ],
      },
    },
  },

  {
    id: 'storage_bern',
    name: 'Bern',
    title: 'Pack Fitter',
    look: { top: '#6b5f8a', bottom: '#3a3350', hair: '#d8d8d8', hairStyle: 'short', weapon: 'none' },
    root: 'root',
    nodes: {
      root: {
        text:
          'You are carrying too much. Everyone is carrying too much.\n\n' +
          'I can let out a pack — eight more slots at a time. It is not cheap and it is not magic, ' +
          'it is just more room.',
        options: [
          { label: 'Expand EQUIP (+8 slots)', action: { kind: 'expand', tab: 'equip', cost: 6000 } },
          { label: 'Expand USE (+8 slots)', action: { kind: 'expand', tab: 'use', cost: 6000 } },
          { label: 'Expand ETC (+8 slots)', action: { kind: 'expand', tab: 'etc', cost: 4000 } },
          { label: 'Later.', action: { kind: 'close' } },
        ],
      },
    },
  },

  {
    id: 'instructor_hale',
    name: 'Hale',
    title: 'Job Instructor',
    look: { top: '#8a3a3a', bottom: '#3b2b2b', hair: '#2a2a2a', hairStyle: 'spiky', cape: '#5a2020', weapon: 'sword' },
    root: 'root',
    nodes: {
      root: {
        text:
          'Everyone starts as nothing in particular. Then they pick.\n\n' +
          'Warrior, mage, archer, rogue, corsair. It is not a personality test — it is a question ' +
          'about how you want to solve a room full of things trying to kill you.',
        options: [
          { label: 'I want to choose a path.', action: { kind: 'advance' }, requires: { minLevel: 8 } },
          { label: 'Tell me about the paths.', next: 'paths' },
          { label: 'Not yet.', action: { kind: 'close' } },
        ],
      },
      paths: {
        text:
          'Warriors stand in front and stay standing. Mages break rooms open but die to a stiff breeze. ' +
          'Archers win fights before they arrive. Rogues are never where the hit lands. ' +
          'Corsairs improvise, loudly.\n\n' +
          'Come back at level ten with the right stat and we will make it official.',
        options: [{ label: 'Back', next: 'root' }],
      },
    },
  },

  {
    id: 'quest_dagny',
    name: 'Dagny',
    title: 'Vale Warden',
    look: { top: '#3f6b52', bottom: '#2b4638', hair: '#a8763f', hairStyle: 'long', weapon: 'bow' },
    root: 'root',
    nodes: {
      root: {
        text:
          'I keep the roads open and the council off my back. Usually in that order.\n\n' +
          'If you are looking for work, I have more than I can do myself.',
        options: [
          { label: 'What is out there?', next: 'lore' },
          { label: 'Nothing right now.', action: { kind: 'close' } },
        ],
      },
      lore: {
        text:
          'Downs to the east, boars and a bad temper between them. Thicket to the north, ' +
          'which is worse than it looks. And past the shore there is a cavern I would rather ' +
          'you did not go into until you are ready.',
        options: [{ label: 'Back', next: 'root' }],
      },
    },
  },

  {
    id: 'healer_orin',
    name: 'Orin',
    title: 'Healer',
    look: { top: '#e8e2d0', bottom: '#c9bfa0', hair: '#8a5f38', hairStyle: 'short', weapon: 'wand' },
    root: 'root',
    nodes: {
      root: {
        text: 'Sit. You are bleeding on the floor of a town square and nobody has said anything.',
        options: [
          { label: 'Heal me. (200 mesos)', action: { kind: 'heal', cost: 200 } },
          { label: 'I am fine.', action: { kind: 'close' } },
        ],
      },
    },
  },
];

const BY_ID = new Map(NPCS.map((n) => [n.id, n]));

export function getNpc(id: string): NpcDef {
  const n = BY_ID.get(id);
  if (!n) throw new Error(`unknown npc id "${id}"`);
  return n;
}

export function allNpcs(): readonly NpcDef[] {
  return NPCS;
}
