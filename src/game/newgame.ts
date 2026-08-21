/**
 * New character setup.
 *
 * A fresh character starts with the clothes on their back, a training sword,
 * a handful of potions, and the novice skills unlocked — enough to walk out
 * of town and hit something without a tutorial explaining how.
 */
import type { Rng } from '../engine/rng';
import { Player } from './player';
import { createInstance } from './equipment';

export interface StarterCharacter {
  player: Player;
  quickSlots: (string | null)[];
}

const STARTER_NAMES = [
  'Wren', 'Ash', 'Rook', 'Vale', 'Fen', 'Bryn', 'Cass', 'Orin', 'Sable', 'Quill',
];

export function createStarterCharacter(rng: Rng, name?: string): StarterCharacter {
  const player = new Player(name ?? rng.pick(STARTER_NAMES));

  // Starting kit.
  player.inventory.addMesos(500);
  const sword = createInstance('training_sword', rng, { perfect: true });
  const top = createInstance('cloth_top', rng, { perfect: true });
  const bottom = createInstance('cloth_bottom', rng, { perfect: true });
  player.inventory.equipped.weapon = sword;
  player.inventory.equipped.top = top;
  player.inventory.equipped.bottom = bottom;

  player.inventory.addStack('red_potion', 15);
  player.inventory.addStack('blue_potion', 8);
  player.inventory.addStack('town_scroll', 2);

  // The novice skills are free — they exist to teach that skills exist.
  player.skills.set('pebble_toss', 1);
  player.skills.set('nimble_feet', 1);
  player.skills.set('recovery', 1);

  player.recompute();
  player.hp = player.stats.maxHp;
  player.mp = player.stats.maxMp;

  return {
    player,
    quickSlots: ['pebble_toss', 'nimble_feet', 'recovery', null, null, null, null, null],
  };
}
