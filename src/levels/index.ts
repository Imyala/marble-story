import type { LevelDef } from '../world/level';
import { fen } from './fen';
import { sanctum } from './sanctum';

export const LEVELS: Record<string, LevelDef> = {
  fen,
  sanctum,
};
