/**
 * Colour system. All art in this project is generated from code, so the
 * palette is the closest thing we have to an art direction document.
 */
export const PAL = {
  // UI chrome
  ink: '#0b0e17',
  panel: '#141a2b',
  panelLight: '#1e2740',
  border: '#3a4766',
  borderLit: '#596b9c',
  text: '#dbe4f5',
  textDim: '#8f9dc0',
  textFaint: '#5d6f88',
  gold: '#f2c14e',
  hp: '#e0555a',
  hpDark: '#7d2327',
  mp: '#4aa3e8',
  mpDark: '#1d4b78',
  exp: '#8fd14f',
  expDark: '#3f6b23',

  // Damage numbers
  dmg: '#ffe9a8',
  dmgCrit: '#ff8a3d',
  dmgTaken: '#ff5d6c',
  heal: '#7ee081',
  miss: '#c9d3e8',

  // World
  sky: '#0f1626',
  grass: '#5fa845',
  grassDark: '#3d7a2c',
  dirt: '#6b4a33',
  dirtDark: '#4a3122',
  stone: '#5a6376',
  stoneDark: '#3c4354',
  wood: '#8a5f38',
  rope: '#c9a35e',
} as const;

/** Lighten (amount > 0) or darken (amount < 0) a hex colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')}`;
}

export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
