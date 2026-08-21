import { describe, expect, it } from 'vitest';
import { Rng } from '../src/engine/rng';
import {
  AttackerProfile, BASIC_ATTACK, DefenderProfile, damageLevelModifier,
  damageRange, elementModifier, hitChance, resolveAttack, resolveHit,
  resolveIncoming, totalDamage,
} from '../src/game/combat';
import { expLevelModifier, expToNext, EXP_TABLE, MAX_LEVEL } from '../src/data/expTable';

function attacker(over: Partial<AttackerProfile> = {}): AttackerProfile {
  return {
    level: 30, primary: 80, secondary: 25, weapon: 'oneHandSword',
    watk: 45, matk: 0, mastery: 0.1, accuracy: 60,
    critRate: 0, critDamage: 1.4, ignoreDef: 0, bossDamage: 1,
    ...over,
  };
}

function defender(over: Partial<DefenderProfile> = {}): DefenderProfile {
  return { level: 30, wdef: 40, mdef: 20, avoid: 6, resist: {}, isBoss: false, ...over };
}

describe('damage range', () => {
  it('scales with weapon attack and the primary stat', () => {
    const base = damageRange(attacker());
    const stronger = damageRange(attacker({ watk: 90 }));
    expect(stronger.max).toBeCloseTo(base.max * 2, 5);

    const buffed = damageRange(attacker({ primary: 160 }));
    expect(buffed.max).toBeGreaterThan(base.max);
  });

  it('raises minimum damage with mastery but never the maximum', () => {
    const low = damageRange(attacker({ mastery: 0.1 }));
    const high = damageRange(attacker({ mastery: 0.9 }));
    expect(high.max).toBeCloseTo(low.max, 6);
    expect(high.min).toBeGreaterThan(low.min);
    expect(high.min / high.max).toBeGreaterThan(0.7);
  });

  it('gives two-handed weapons a higher ceiling than one-handed', () => {
    const oneHand = damageRange(attacker({ weapon: 'oneHandSword' }));
    const twoHand = damageRange(attacker({ weapon: 'twoHandSword' }));
    const polearm = damageRange(attacker({ weapon: 'polearm' }));
    expect(twoHand.max).toBeGreaterThan(oneHand.max);
    expect(polearm.max).toBeGreaterThan(twoHand.max);
  });

  it('uses magic attack for wands and staves', () => {
    const noMatk = damageRange(attacker({ weapon: 'wand', watk: 200, matk: 0 }));
    const withMatk = damageRange(attacker({ weapon: 'wand', watk: 0, matk: 60 }));
    expect(noMatk.max).toBe(1);
    expect(withMatk.max).toBeGreaterThan(1);
  });
});

describe('elements', () => {
  it('applies resistance tiers', () => {
    expect(elementModifier('fire', { fire: 'immune' })).toBe(0);
    expect(elementModifier('fire', { fire: 'strong' })).toBe(0.5);
    expect(elementModifier('fire', { fire: 'weak' })).toBe(1.5);
    expect(elementModifier('fire', {})).toBe(1);
    expect(elementModifier('neutral', { fire: 'immune' })).toBe(1);
  });

  it('deals zero against an immunity, and it is not a miss', () => {
    const rng = new Rng(7);
    const r = resolveHit(
      attacker({ accuracy: 9999 }),
      defender({ resist: { fire: 'immune' } }),
      { damagePercent: 200, element: 'fire' },
      rng,
    );
    expect(r.damage).toBe(0);
    expect(r.miss).toBe(false);
  });
});

describe('hit chance', () => {
  it('is certain against a low-avoid target on level', () => {
    expect(hitChance(attacker(), defender({ avoid: 4 }))).toBe(1);
  });

  it('falls off against higher-level, evasive targets', () => {
    const easy = hitChance(attacker(), defender({ avoid: 10, level: 30 }));
    const hard = hitChance(attacker(), defender({ avoid: 30, level: 50 }));
    expect(hard).toBeLessThan(easy);
    expect(hard).toBeGreaterThanOrEqual(0.05);
  });

  it('never drops below the 5% floor', () => {
    const hopeless = hitChance(attacker({ accuracy: 1, level: 1 }), defender({ avoid: 400, level: 200 }));
    expect(hopeless).toBe(0.05);
  });
});

describe('level difference', () => {
  it('reduces damage against higher-level targets only', () => {
    expect(damageLevelModifier(50, 40)).toBe(1);
    expect(damageLevelModifier(50, 50)).toBe(1);
    expect(damageLevelModifier(50, 60)).toBeCloseTo(0.7, 5);
    expect(damageLevelModifier(10, 200)).toBe(0.25);
  });

  it('cuts EXP sharply once you outlevel a monster', () => {
    expect(expLevelModifier(30, 30)).toBe(1);
    expect(expLevelModifier(30, 33)).toBe(1);
    expect(expLevelModifier(30, 25)).toBeLessThan(1);
    expect(expLevelModifier(60, 30)).toBe(0.05);
    expect(expLevelModifier(30, 40)).toBe(1.2);
  });
});

describe('resolving hits', () => {
  it('always deals at least 1 damage when it connects', () => {
    const rng = new Rng(3);
    for (let i = 0; i < 200; i++) {
      const r = resolveHit(
        attacker({ watk: 1, primary: 1, secondary: 0, accuracy: 9999 }),
        defender({ wdef: 5000 }),
        BASIC_ATTACK, rng,
      );
      if (!r.miss) expect(r.damage).toBeGreaterThanOrEqual(1);
    }
  });

  it('scales with the skill damage percent', () => {
    const seed = 12345;
    const basic = resolveHit(attacker({ accuracy: 9999 }), defender({ wdef: 0 }), BASIC_ATTACK, new Rng(seed));
    const strong = resolveHit(
      attacker({ accuracy: 9999 }), defender({ wdef: 0 }),
      { damagePercent: 300, element: 'neutral' }, new Rng(seed),
    );
    expect(strong.damage).toBeGreaterThan(basic.damage * 2.5);
  });

  it('ignore-defense recovers damage lost to armour', () => {
    const seed = 99;
    const plain = resolveHit(attacker({ accuracy: 9999 }), defender({ wdef: 300 }), BASIC_ATTACK, new Rng(seed));
    const piercing = resolveHit(
      attacker({ accuracy: 9999, ignoreDef: 0.9 }), defender({ wdef: 300 }), BASIC_ATTACK, new Rng(seed),
    );
    expect(piercing.damage).toBeGreaterThan(plain.damage);
  });

  it('multi-hit skills roll each hit independently', () => {
    const rng = new Rng(555);
    const hits = resolveAttack(
      attacker({ accuracy: 9999, mastery: 0.1 }), defender({ wdef: 0 }),
      { damagePercent: 100, element: 'neutral' }, 6, rng,
    );
    expect(hits).toHaveLength(6);
    expect(new Set(hits.map((h) => h.damage)).size).toBeGreaterThan(1);
    expect(totalDamage(hits)).toBeGreaterThan(0);
  });

  it('is deterministic for a fixed seed', () => {
    const a = resolveAttack(attacker(), defender(), BASIC_ATTACK, 5, new Rng(2024));
    const b = resolveAttack(attacker(), defender(), BASIC_ATTACK, 5, new Rng(2024));
    expect(a).toEqual(b);
  });

  it('criticals multiply damage', () => {
    const seed = 41;
    const normal = resolveHit(attacker({ accuracy: 9999, critRate: 0 }), defender({ wdef: 0 }), BASIC_ATTACK, new Rng(seed));
    const crit = resolveHit(
      attacker({ accuracy: 9999, critRate: 1, critDamage: 2 }), defender({ wdef: 0 }), BASIC_ATTACK, new Rng(seed),
    );
    expect(crit.crit).toBe(true);
    expect(crit.damage).toBeGreaterThan(normal.damage);
  });
});

describe('incoming damage', () => {
  it('is reduced by defense but never below 1', () => {
    const rng = new Rng(8);
    const r = resolveIncoming(
      { attack: 40, magic: false, level: 20 },
      { level: 20, wdef: 100000, mdef: 0, avoid: 0 },
      rng,
    );
    expect(r.damage).toBe(1);
  });

  it('hurts more when you are under-levelled', () => {
    const onLevel = resolveIncoming(
      { attack: 200, magic: false, level: 40 },
      { level: 40, wdef: 0, mdef: 0, avoid: 0 }, new Rng(5),
    );
    const outmatched = resolveIncoming(
      { attack: 200, magic: false, level: 80 },
      { level: 40, wdef: 0, mdef: 0, avoid: 0 }, new Rng(5),
    );
    expect(outmatched.damage).toBeGreaterThan(onLevel.damage);
  });

  it('lets high-avoid characters dodge sometimes', () => {
    const rng = new Rng(17);
    let misses = 0;
    for (let i = 0; i < 500; i++) {
      const r = resolveIncoming(
        { attack: 50, magic: false, level: 30 },
        { level: 30, wdef: 0, mdef: 0, avoid: 60 }, rng,
      );
      if (r.miss) misses++;
    }
    expect(misses).toBeGreaterThan(50);
    expect(misses).toBeLessThan(400);
  });
});

describe('exp table', () => {
  it('is monotonically increasing up to the last level', () => {
    for (let lv = 1; lv < MAX_LEVEL - 1; lv++) {
      expect(EXP_TABLE[lv + 1]).toBeGreaterThanOrEqual(EXP_TABLE[lv]);
    }
  });

  it('has walls at the job advancement levels', () => {
    // The curve should steepen noticeably approaching 30 / 70 / 120.
    for (const wall of [30, 70, 120]) {
      const before = expToNext(wall - 5);
      const after = expToNext(wall + 5);
      expect(after / before).toBeGreaterThan(1.3);
    }
  });

  it('returns 0 at max level', () => {
    expect(expToNext(MAX_LEVEL)).toBe(0);
    expect(expToNext(MAX_LEVEL + 10)).toBe(0);
  });
});
