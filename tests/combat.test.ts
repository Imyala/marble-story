import { describe, expect, it } from 'vitest';
import { Status, reactionFor, computeDamage, consumeReaction, BUILDUP_MAX } from '../src/combat/status';
import { StyleMeter, RANKS } from '../src/combat/style';
import { makeHit } from '../src/game/types';

describe('status buildup', () => {
  it('triggers each element status at full buildup', () => {
    const s = new Status();
    expect(s.build('fire', BUILDUP_MAX - 1)).toBeNull();
    expect(s.build('fire', 5)).toBe('burn');
    expect(s.burn).toBeGreaterThan(0);
    expect(new Status().build('lightning', BUILDUP_MAX)).toBe('shock');
    const ice = new Status();
    expect(ice.build('ice', BUILDUP_MAX)).toBe('freeze');
    expect(ice.stunned).toBe(true);
  });

  it('respects resistances and immunities', () => {
    const golem = new Status({ ice: 0 });
    expect(golem.build('ice', 1000)).toBeNull();
    const weak = new Status({ fire: 2 });
    expect(weak.build('fire', BUILDUP_MAX / 2)).toBe('burn');
  });

  it('burning deals damage over time and wears off', () => {
    const s = new Status();
    s.build('fire', BUILDUP_MAX);
    let total = 0;
    for (let i = 0; i < 600; i++) total += s.update(1 / 60);
    expect(total).toBeGreaterThan(10);
    expect(s.burn).toBe(0);
  });

  it('fire thaws a frozen target instead of igniting it', () => {
    const s = new Status();
    s.build('ice', BUILDUP_MAX);
    expect(s.build('fire', BUILDUP_MAX)).toBeNull();
    expect(s.burn).toBe(0);
  });
});

describe('reactions', () => {
  it('shatters frozen targets on heavy or earth hits', () => {
    const s = new Status();
    s.build('ice', BUILDUP_MAX);
    expect(reactionFor(s, makeHit({ damage: 10 }))).toBeNull();
    expect(reactionFor(s, makeHit({ damage: 10, heavy: true }))).toBe('shatter');
    expect(reactionFor(s, makeHit({ damage: 10, type: 'earth' }))).toBe('shatter');
  });

  it('overloads on fire + shock either way round, steams on ice + burn', () => {
    const shocked = new Status();
    shocked.build('lightning', BUILDUP_MAX);
    expect(reactionFor(shocked, makeHit({ damage: 1, type: 'fire' }))).toBe('overload');
    const burning = new Status();
    burning.build('fire', BUILDUP_MAX);
    expect(reactionFor(burning, makeHit({ damage: 1, type: 'lightning' }))).toBe('overload');
    expect(reactionFor(burning, makeHit({ damage: 1, type: 'ice' }))).toBe('steam');
    consumeReaction(burning, 'steam');
    expect(burning.burn).toBe(0);
    expect(burning.steam).toBeGreaterThan(0);
  });

  it('computes damage with weakness, shock bonus and shatter', () => {
    const s = new Status();
    expect(computeDamage(10, 'fire', { fire: 1.5 }, s, null)).toBeCloseTo(15);
    expect(computeDamage(10, 'ice', { ice: 0 }, s, null)).toBe(0);
    s.build('lightning', BUILDUP_MAX);
    expect(computeDamage(10, 'physical', {}, s, null)).toBeCloseTo(12.5);
    const f = new Status();
    expect(computeDamage(10, 'physical', {}, f, 'shatter')).toBeGreaterThan(40);
  });
});

describe('style meter', () => {
  it('rewards variety over repetition', () => {
    const a = new StyleMeter();
    for (let i = 0; i < 6; i++) a.hit('horn1', 10);
    const b = new StyleMeter();
    const moves = ['horn1', 'horn2', 'horn3', 'uppercut', 'air1', 'air2'];
    for (const m of moves) b.hit(m, 10);
    expect(b.points).toBeGreaterThan(a.points * 1.5);
  });

  it('ranks up and drops a rank when hurt', () => {
    const s = new StyleMeter();
    s.bonus(RANKS[3]!.at + 10);
    expect(s.rank).toBe(3);
    s.hurt();
    expect(s.rank).toBeLessThan(3);
    expect(s.combo).toBe(0);
  });

  it('counts combos and resets them after a pause', () => {
    const s = new StyleMeter();
    s.hit('a', 1);
    s.hit('b', 1);
    expect(s.combo).toBe(2);
    s.update(StyleMeter.COMBO_WINDOW + 0.1, true);
    expect(s.combo).toBe(0);
    expect(s.bestCombo).toBe(2);
  });
});
