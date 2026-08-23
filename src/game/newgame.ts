/**
 * New character setup.
 *
 * A character is created from a class option (see data/classes.ts) plus a
 * name. Picking a class starts you in it; picking Novice starts you with no
 * class at all, the way the original progression works — the instructor at
 * level 10 then matters.
 */
import type { Rng } from '../engine/rng';
import { Player } from './player';
import { createInstance } from './equipment';
import { ClassOption, DEFAULT_CLASS, getClassOption } from '../data/classes';
import { getJob } from '../data/jobs';
import type { BaseStats } from './stats';
import { DEFAULT_LOOK } from '../art/character';

export interface StarterCharacter {
  player: Player;
  quickSlots: (string | null)[];
}

const STARTER_NAMES = [
  'Wren', 'Ash', 'Rook', 'Vale', 'Fen', 'Bryn', 'Cass', 'Orin', 'Sable', 'Quill',
];

export function randomName(rng: Rng): string {
  return rng.pick(STARTER_NAMES);
}

/** Starting stat spread: the class's main stat gets the weight. */
function startingStats(option: ClassOption): BaseStats {
  const base: BaseStats = { str: 4, dex: 4, int: 4, luk: 4 };
  if (option.mainStat === '—') {
    // A Novice has no main stat yet, so spread the points evenly and let the
    // player commit once they pick a path.
    base.str = 12;
    base.dex = 5;
    return base;
  }
  base[option.mainStat] += 8;
  return base;
}

export function createStarterCharacter(
  rng: Rng,
  name?: string,
  classId: string = DEFAULT_CLASS,
): StarterCharacter {
  const option = getClassOption(classId);
  const player = new Player(name?.trim() || randomName(rng));

  player.base = startingStats(option);
  Object.assign(player.look, DEFAULT_LOOK, option.look);

  // Starting in a class grants that job's one-time HP/MP bonus, the same as
  // advancing into it would.
  if (option.jobId !== 0) {
    const job = getJob(option.jobId);
    player.jobId = job.id;
    player.baseHp += job.hpBonus;
    player.baseMp += job.mpBonus;
  }

  player.inventory.addMesos(500);
  player.inventory.equipped.weapon = createInstance(option.weapon, rng, { perfect: true });
  player.inventory.equipped.top = createInstance('cloth_top', rng, { perfect: true });
  player.inventory.equipped.bottom = createInstance('cloth_bottom', rng, { perfect: true });

  player.inventory.addStack('red_potion', 15);
  player.inventory.addStack('blue_potion', 8);
  player.inventory.addStack('town_scroll', 2);

  // The starting skills are granted outright — they exist to teach that skills
  // exist, not to cost the player their first points.
  for (const id of option.skills) player.skills.set(id, 1);

  player.recompute();
  player.hp = player.stats.maxHp;
  player.mp = player.stats.maxMp;

  return { player, quickSlots: [...option.quickSlots] };
}
