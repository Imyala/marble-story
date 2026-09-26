import { FEN_LETTERS } from '../levels/letters/fen';
import { SANCTUM_LETTERS } from '../levels/letters/sanctum';
import { FALLS_LETTERS } from '../levels/letters/falls';
import { FROSTWORKS_LETTERS } from '../levels/letters/frostworks';
import { PLAINS_LETTERS } from '../levels/letters/plains';
import { KEEP_LETTERS } from '../levels/letters/keep';
import { HOLLOW_LETTERS } from '../levels/letters/hollow';
import { MYCELIUM_LETTERS } from '../levels/letters/mycelium';

/**
 * Lore letters: notes, diaries and orders left around the realms. Each realm
 * keeps its own list in src/levels/letters/<realm>.ts (plain data, no imports),
 * and a level places one with `b.letter(id, x, z)`.
 */
export interface LetterDef {
  id: string;
  title: string;
  /** Who wrote it, shown as a signature. */
  from: string;
  text: string;
}

export const LETTERS: Record<string, LetterDef[]> = {
  fen: FEN_LETTERS,
  sanctum: SANCTUM_LETTERS,
  falls: FALLS_LETTERS,
  frostworks: FROSTWORKS_LETTERS,
  plains: PLAINS_LETTERS,
  keep: KEEP_LETTERS,
  hollow: HOLLOW_LETTERS,
  mycelium: MYCELIUM_LETTERS,
};

export function findLetter(level: string, id: string): LetterDef | undefined {
  return LETTERS[level]?.find((l) => l.id === id);
}

/** Save key for a read letter. */
export const letterKey = (level: string, id: string): string => `letter:${level}:${id}`;
