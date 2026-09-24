import type { EnemyDef } from './enemy';
import { ImpModel, WispModel, GolemModel, CrawlerModel, TotemModel, DummyModel } from './models';

/**
 * The roster. Each enemy is built to ask a different question of the player:
 *   grunt        basic melee; learn the horn combo
 *   slinger      ranged; close the distance or break line of sight
 *   shieldbearer blocks from the front; circle, use Tail, Charge or Earth
 *   brute        super armor and jumpable shockwaves; launchers do not work
 *   wisp         flies; breath, bursts or air combos
 *   golem        ice or stone; element weaknesses matter
 *   crawler      armored shell; flip it with a heavy hit first
 *   knight       elite; guards, lunges, punishes button mashing
 *   totem        shields allies near it; destroy it first
 */

export const ENEMIES: Record<string, EnemyDef> = {
  grunt: {
    id: 'grunt', name: 'Gloomling', hp: 42, radius: 0.5, height: 1.3, speed: 4.6, turnRate: 7, mass: 1, poise: 0,
    resist: {}, statusResist: {}, aggroRange: 16, panics: true,
    gems: { blue: 6, red: 1 },
    attacks: [
      { id: 'club', pose: 'swing', range: 2.0, windup: 0.55, active: 0.2, recover: 0.55, cooldown: 1.2, weight: 3, kind: 'melee', damage: 9, knockback: 5, hitRange: 1.5, hitArc: 1.1, lunge: 4 },
      { id: 'leap', pose: 'charge', range: 5.5, minRange: 3.5, windup: 0.6, active: 0.35, recover: 0.7, cooldown: 4, weight: 1, kind: 'melee', damage: 11, knockback: 7, hitRange: 1.3, hitArc: 1.0, lunge: 13 },
    ],
    build: () => new ImpModel({ skin: 0x3a2856, belly: 0x5a4478, eye: 0xffd040, scale: 1, bulk: 0, ears: 'long', weapon: 'club', offhand: 'none' }),
    styleValue: 1,
  },
  slinger: {
    id: 'slinger', name: 'Gloom Slinger', hp: 34, radius: 0.5, height: 1.3, speed: 4.2, turnRate: 7, mass: 1, poise: 0,
    resist: {}, statusResist: {}, aggroRange: 22, keepAway: 10, panics: true,
    gems: { blue: 7, green: 1 },
    attacks: [
      { id: 'bolt', pose: 'throw', range: 16, windup: 0.7, active: 0.1, recover: 0.6, cooldown: 1.6, weight: 3, kind: 'projectile', damage: 8, knockback: 3,
        projectile: { speed: 13, radius: 0.35, damage: 8, type: 'shadow', color: 0xc050ff, life: 3, gravity: 0 } },
      { id: 'spread', pose: 'cast', range: 12, windup: 0.9, active: 0.1, recover: 0.8, cooldown: 5, weight: 1, kind: 'projectile', damage: 6, knockback: 3,
        projectile: { speed: 11, radius: 0.3, damage: 6, type: 'shadow', color: 0xe070ff, life: 2.5, gravity: 0, count: 3, spread: 0.35 } },
    ],
    build: () => new ImpModel({ skin: 0x2e2448, belly: 0x4a3c68, eye: 0xff7040, scale: 0.95, bulk: 0, ears: 'short', weapon: 'staff', offhand: 'none', hood: 0x241a30, weaponGlow: 0xc070ff }),
    styleValue: 1.1,
  },
  shieldbearer: {
    id: 'shieldbearer', name: 'Gloom Bulwark', hp: 60, radius: 0.6, height: 1.45, speed: 3.6, turnRate: 4.5, mass: 0.7, poise: 20,
    resist: {}, statusResist: {}, aggroRange: 16, shield: true,
    gems: { blue: 10, red: 1 },
    attacks: [
      { id: 'jab', pose: 'thrust', range: 2.8, windup: 0.6, active: 0.2, recover: 0.6, cooldown: 1.4, weight: 3, kind: 'melee', damage: 10, knockback: 6, hitRange: 2.2, hitArc: 0.6, lunge: 5 },
      { id: 'bash', pose: 'charge', range: 6, minRange: 3, windup: 0.7, active: 0.45, recover: 0.8, cooldown: 4.5, weight: 1, kind: 'melee', damage: 12, knockback: 10, hitRange: 1.2, hitArc: 0.8, lunge: 12 },
    ],
    build: () => new ImpModel({ skin: 0x40305a, belly: 0x5c4a78, eye: 0xffd040, scale: 1.08, bulk: 0.25, ears: 'horns', weapon: 'spear', offhand: 'shield', armor: 0x5a5a6e }),
    styleValue: 1.4,
  },
  brute: {
    id: 'brute', name: 'Gloom Brute', hp: 180, radius: 1.1, height: 2.6, speed: 3.2, turnRate: 3, mass: 0.12, poise: 90,
    resist: { fire: 1.35 }, statusResist: { lightning: 0.6, ice: 0.6 }, aggroRange: 18,
    gems: { blue: 30, red: 3, purple: 2 },
    attacks: [
      { id: 'pound', pose: 'slam', range: 3.4, windup: 1.0, active: 0.25, recover: 1.0, cooldown: 2.5, weight: 2, kind: 'slam', damage: 16, knockback: 9, hitRange: 2.2, hitArc: 1.2,
        shockwave: { radius: 8, speed: 10 }, telegraph: true },
      { id: 'swipe', pose: 'swing', range: 3.2, windup: 0.7, active: 0.25, recover: 0.7, cooldown: 1.6, weight: 3, kind: 'melee', damage: 14, knockback: 12, hitRange: 2.6, hitArc: 1.4 },
      { id: 'rush', pose: 'charge', range: 12, minRange: 6, windup: 0.9, active: 0.9, recover: 1.1, cooldown: 6, weight: 1, kind: 'melee', damage: 18, knockback: 14, hitRange: 1.8, hitArc: 0.9, lunge: 13 },
    ],
    build: () => new ImpModel({ skin: 0x2c2040, belly: 0x44335e, eye: 0xff4030, scale: 1.75, bulk: 1, ears: 'horns', weapon: 'none', offhand: 'none', cracks: 0xc050ff }),
    styleValue: 2.5,
  },
  wisp: {
    id: 'wisp', name: 'Shade Wisp', hp: 30, radius: 0.55, height: 1.4, speed: 5, turnRate: 5, mass: 1.1, poise: 0, flying: true, hover: 3.2,
    resist: { lightning: 1.3 }, statusResist: {}, aggroRange: 20, keepAway: 8,
    gems: { blue: 8, green: 2 },
    attacks: [
      { id: 'orb', pose: 'cast', range: 14, windup: 0.8, active: 0.1, recover: 0.8, cooldown: 1.8, weight: 3, kind: 'projectile', damage: 8, knockback: 3,
        projectile: { speed: 10, radius: 0.35, damage: 8, type: 'shadow', color: 0xd070ff, life: 3, gravity: 0, homing: 1.2 } },
      { id: 'dive', pose: 'dive', range: 9, minRange: 3, windup: 0.8, active: 0.6, recover: 0.9, cooldown: 4, weight: 1, kind: 'dive', damage: 10, knockback: 6, hitRange: 1.2, hitArc: 1.0, lunge: 12 },
    ],
    build: () => new WispModel(0xc050ff, 0x1a1028, 1),
    styleValue: 1.3,
  },
  stormWisp: {
    id: 'stormWisp', name: 'Storm Wisp', hp: 38, radius: 0.55, height: 1.4, speed: 5.5, turnRate: 5, mass: 1.1, poise: 0, flying: true, hover: 3.5,
    resist: { lightning: 0, earth: 1.4 }, statusResist: { lightning: 0 }, aggroRange: 22, keepAway: 9,
    gems: { blue: 10, green: 2 },
    attacks: [
      { id: 'zap', pose: 'cast', range: 15, windup: 0.7, active: 0.1, recover: 0.7, cooldown: 1.6, weight: 3, kind: 'projectile', damage: 9, knockback: 3,
        projectile: { speed: 16, radius: 0.3, damage: 9, type: 'lightning', color: 0xa8e6ff, life: 2, gravity: 0 } },
      { id: 'dive', pose: 'dive', range: 9, minRange: 3, windup: 0.7, active: 0.6, recover: 0.8, cooldown: 3.5, weight: 1, kind: 'dive', damage: 11, knockback: 6, hitRange: 1.2, hitArc: 1.0, lunge: 13 },
    ],
    build: () => new WispModel(0x9fe0ff, 0x1c2a40, 1),
    styleValue: 1.3,
  },
  frostGolem: {
    id: 'frostGolem', name: 'Rime Golem', hp: 150, radius: 1.0, height: 2.6, speed: 2.8, turnRate: 3, mass: 0.15, poise: 70,
    resist: { ice: 0, fire: 1.6, earth: 1.2 }, statusResist: { ice: 0, fire: 1.5 }, aggroRange: 16,
    gems: { blue: 26, red: 2, green: 2 },
    attacks: [
      { id: 'pound', pose: 'slam', range: 3.2, windup: 1.1, active: 0.25, recover: 1.0, cooldown: 3, weight: 2, kind: 'slam', damage: 15, knockback: 9, hitRange: 2.3, hitArc: 1.2,
        shockwave: { radius: 7, speed: 9 }, telegraph: true, type: 'ice' },
      { id: 'punch', pose: 'punch', range: 3.0, windup: 0.8, active: 0.25, recover: 0.8, cooldown: 1.6, weight: 3, kind: 'melee', damage: 13, knockback: 10, hitRange: 2.4, hitArc: 1.0, lunge: 3 },
      { id: 'shards', pose: 'throw', range: 14, minRange: 5, windup: 1.0, active: 0.1, recover: 0.9, cooldown: 4, weight: 1, kind: 'projectile', damage: 8, knockback: 4,
        projectile: { speed: 15, radius: 0.35, damage: 8, type: 'ice', color: 0xbff4ff, life: 2, gravity: 0, count: 5, spread: 0.3 } },
    ],
    build: () => new GolemModel(0xbfe8ff, 0x60d0ff, 1, true),
    styleValue: 2.2,
  },
  stoneGolem: {
    id: 'stoneGolem', name: 'Cairn Golem', hp: 170, radius: 1.0, height: 2.6, speed: 2.8, turnRate: 3, mass: 0.12, poise: 80,
    resist: { earth: 0.3, lightning: 0.7, ice: 1.4, physical: 0.8 }, statusResist: { lightning: 0.5 }, aggroRange: 16,
    gems: { blue: 30, red: 3 },
    attacks: [
      { id: 'pound', pose: 'slam', range: 3.2, windup: 1.0, active: 0.25, recover: 1.0, cooldown: 3, weight: 2, kind: 'slam', damage: 16, knockback: 10, hitRange: 2.3, hitArc: 1.2,
        shockwave: { radius: 8, speed: 9 }, telegraph: true },
      { id: 'punch', pose: 'punch', range: 3.0, windup: 0.8, active: 0.25, recover: 0.8, cooldown: 1.6, weight: 3, kind: 'melee', damage: 14, knockback: 11, hitRange: 2.4, hitArc: 1.0, lunge: 3 },
      { id: 'boulder', pose: 'throw', range: 16, minRange: 6, windup: 1.1, active: 0.1, recover: 1.0, cooldown: 5, weight: 1, kind: 'projectile', damage: 14, knockback: 9,
        projectile: { speed: 14, radius: 0.6, damage: 14, type: 'earth', color: 0x8a7a5a, life: 3, gravity: 14, explode: 2.5 } },
    ],
    build: () => new GolemModel(0x8a7d68, 0x9be06a, 1, false),
    styleValue: 2.2,
  },
  crawler: {
    id: 'crawler', name: 'Shellback', hp: 70, radius: 0.9, height: 1.2, speed: 4, turnRate: 4, mass: 0.5, poise: 0, armored: true,
    resist: {}, statusResist: { fire: 0.5 }, aggroRange: 15,
    gems: { blue: 14, red: 1 },
    attacks: [
      { id: 'bite', pose: 'bite', range: 2.4, windup: 0.5, active: 0.2, recover: 0.5, cooldown: 1.3, weight: 3, kind: 'melee', damage: 10, knockback: 6, hitRange: 1.6, hitArc: 0.9, lunge: 4 },
      { id: 'roll', pose: 'charge', range: 12, minRange: 4, windup: 0.8, active: 1.0, recover: 0.8, cooldown: 5, weight: 1, kind: 'melee', damage: 13, knockback: 11, hitRange: 1.2, hitArc: 1.2, lunge: 14 },
    ],
    build: () => new CrawlerModel(0x7a6a52, 0x4a3a2a, 0xffb030, 1),
    styleValue: 1.6,
  },
  knight: {
    id: 'knight', name: 'Shade Knight', hp: 140, radius: 0.65, height: 2.0, speed: 4.8, turnRate: 6, mass: 0.45, poise: 45, shield: true,
    resist: { shadow: 0 }, statusResist: { fire: 0.7, ice: 0.7, lightning: 0.7 }, aggroRange: 18,
    gems: { blue: 34, red: 2, purple: 2 },
    attacks: [
      { id: 'slash', pose: 'swing', range: 2.8, windup: 0.45, active: 0.2, recover: 0.45, cooldown: 1.0, weight: 3, kind: 'melee', damage: 13, knockback: 7, hitRange: 2.2, hitArc: 1.2, lunge: 5 },
      { id: 'lunge', pose: 'thrust', range: 7, minRange: 3, windup: 0.55, active: 0.35, recover: 0.7, cooldown: 3, weight: 2, kind: 'melee', damage: 15, knockback: 9, hitRange: 1.8, hitArc: 0.7, lunge: 16 },
      { id: 'wave', pose: 'cast', range: 14, minRange: 6, windup: 0.8, active: 0.1, recover: 0.8, cooldown: 5, weight: 1, kind: 'projectile', damage: 12, knockback: 6,
        projectile: { speed: 14, radius: 0.5, damage: 12, type: 'shadow', color: 0xe060ff, life: 2, gravity: 0, count: 3, spread: 0.2 } },
    ],
    build: () => new ImpModel({ skin: 0x221a30, belly: 0x2e2440, eye: 0xff3060, scale: 1.4, bulk: 0.35, ears: 'horns', weapon: 'sword', offhand: 'shield', armor: 0x3a3448, weaponGlow: 0xe060ff }),
    styleValue: 2.4,
  },
  totem: {
    id: 'totem', name: 'Gloom Totem', hp: 90, radius: 0.8, height: 2.6, speed: 0, turnRate: 0, mass: 0, poise: 999,
    resist: { shadow: 0 }, statusResist: { fire: 0, ice: 0, lightning: 0 }, aggroRange: 20,
    gems: { blue: 20, green: 3, purple: 1 },
    attacks: [
      { id: 'pulse', pose: 'cast', range: 14, windup: 1.2, active: 0.1, recover: 1.0, cooldown: 3, weight: 1, kind: 'projectile', damage: 7, knockback: 3,
        projectile: { speed: 9, radius: 0.35, damage: 7, type: 'shadow', color: 0xb04cff, life: 3, gravity: 0, homing: 0.8 } },
    ],
    build: () => new TotemModel(),
    styleValue: 1.5,
  },
  dummy: {
    id: 'dummy', name: 'Training Dummy', hp: 60, radius: 0.55, height: 2.2, speed: 0, turnRate: 0, mass: 0.05, poise: 0,
    resist: {}, statusResist: {}, aggroRange: 0,
    gems: { blue: 0 },
    attacks: [],
    build: () => new DummyModel(),
    styleValue: 0.3,
  },
};

/** Range within which a totem's ward protects its allies. */
export const TOTEM_WARD = 9;
