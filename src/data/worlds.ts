/**
 * Worlds.
 *
 * The genre presents a list of parallel servers grouped by ruleset before you
 * ever see a character. Here they are save namespaces rather than servers —
 * each world holds its own set of character slots — but the shape is the same,
 * and it is what makes "which world are you on?" a meaningful question later.
 */

export type WorldTier = 'heroic' | 'interactive';

export interface WorldDef {
  id: string;
  name: string;
  tier: WorldTier;
  /** One line shown under the name on the select screen. */
  blurb: string;
  /** Accent colour for the world's badge. */
  accent: string;
  /** Character slots available in this world. */
  slots: number;
  /** Limited-run worlds are marked and explained. */
  seasonal?: boolean;
}

export const WORLD_TIERS: { tier: WorldTier; label: string; note: string }[] = [
  {
    tier: 'heroic',
    label: 'Heroic',
    note: 'No trading. Everything you wear, you earned.',
  },
  {
    tier: 'interactive',
    label: 'Interactive',
    note: 'Trading and a shared economy between players.',
  },
];

export const WORLDS: readonly WorldDef[] = [
  {
    id: 'solace', name: 'Solace', tier: 'heroic',
    blurb: 'The default. Self-found, no market, no shortcuts.',
    accent: '#f2c14e', slots: 8,
  },
  {
    id: 'ember', name: 'Ember', tier: 'heroic',
    blurb: 'Harder monsters, faster levels. A world with an end date.',
    accent: '#e0555a', slots: 4, seasonal: true,
  },
  {
    id: 'luna', name: 'Luna', tier: 'interactive',
    blurb: 'Trade freely. Prices are whatever people will pay.',
    accent: '#7fd8e8', slots: 8,
  },
  {
    id: 'tide', name: 'Tide', tier: 'interactive',
    blurb: 'A quieter market and a slower climb.',
    accent: '#8fd14f', slots: 6,
  },
];

const BY_ID = new Map(WORLDS.map((w) => [w.id, w]));

export function getWorld(id: string): WorldDef {
  const w = BY_ID.get(id);
  if (!w) throw new Error(`unknown world id "${id}"`);
  return w;
}

export function tryWorld(id: string): WorldDef | null {
  return BY_ID.get(id) ?? null;
}

export function worldsIn(tier: WorldTier): WorldDef[] {
  return WORLDS.filter((w) => w.tier === tier);
}

export const DEFAULT_WORLD = 'solace';
