/**
 * Map registry.
 *
 * Maps are built lazily on first visit and cached — a map's foothold set is
 * immutable, so one instance can back every visit.
 */
import type { GameMap } from '../../game/types';
import { slimeHollow, slimeThrone, snailMeadow, tidewatch } from './isle';
import { boarDowns, greyCavern, sunShore, thornThicket, verdantCross, wardenHall } from './vale';

type MapFactory = () => GameMap;

const FACTORIES: Record<string, MapFactory> = {
  tidewatch,
  snail_meadow: snailMeadow,
  slime_hollow: slimeHollow,
  slime_throne: slimeThrone,
  verdant_cross: verdantCross,
  boar_downs: boarDowns,
  sun_shore: sunShore,
  thorn_thicket: thornThicket,
  grey_cavern: greyCavern,
  warden_hall: wardenHall,
};

export const STARTING_MAP = 'tidewatch';

const cache = new Map<string, GameMap>();

export function loadMap(id: string): GameMap {
  const cached = cache.get(id);
  if (cached) return cached;
  const factory = FACTORIES[id];
  if (!factory) throw new Error(`unknown map id "${id}"`);
  const map = factory();
  cache.set(id, map);
  return map;
}

export function mapIds(): string[] {
  return Object.keys(FACTORIES);
}

/** Every map, built. Used by the world map screen and by data validation. */
export function allMaps(): GameMap[] {
  return mapIds().map(loadMap);
}
