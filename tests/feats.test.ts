import { describe, expect, it } from 'vitest';
import { newSave, eggsFound } from '../src/game/progress';
import { FEATS, BESTIARY, bump, extra, featKey, newlyDone } from '../src/game/feats';
import { ENEMIES } from '../src/enemies/defs';
import { LETTERS } from '../src/game/letters';

describe('feats', () => {
  it('have unique ids, positive goals and rewards', () => {
    const ids = new Set(FEATS.map((f) => f.id));
    expect(ids.size).toBe(FEATS.length);
    for (const f of FEATS) {
      expect(f.goal).toBeGreaterThan(0);
      expect(f.reward).toBeGreaterThan(0);
    }
  });

  it('count up from old saves that lack the extra stats', () => {
    const s = newSave();
    expect(extra(s).breaks).toBeUndefined();
    bump(s, 'breaks');
    bump(s, 'breaks', 4);
    expect(extra(s).breaks).toBe(5);
  });

  it('complete once: done feats are not reported again after being marked', () => {
    const s = newSave();
    s.stats.kills = 50;
    const first = newlyDone(s).map((f) => f.id);
    expect(first).toContain('kills1');
    expect(first).not.toContain('kills2');
    for (const id of first) s.found[featKey(id)] = true;
    expect(newlyDone(s)).toHaveLength(0);
  });

  it('count eggs, including thief eggs, and gold medals from found keys', () => {
    const s = newSave();
    s.found['fen:egg-hollow'] = true;
    s.found['fen:egg-thief'] = true;
    expect(eggsFound(s)).toBe(2);
    const gold = FEATS.find((f) => f.id === 'gold')!;
    s.found['medal:fen:1'] = true;
    s.found['medal:fen:2'] = true;
    s.found['medal:fen:3'] = true;
    s.found['medal:falls:2'] = true;
    expect(gold.progress(s)).toBe(1);
  });

  it('the Archivist feat is reachable with the letters that exist', () => {
    const total = Object.values(LETTERS).reduce((n, l) => n + l.length, 0);
    const archivist = FEATS.find((f) => f.id === 'letters')!;
    expect(total).toBeGreaterThanOrEqual(archivist.goal);
  });
});

describe('bestiary', () => {
  it('every entry names a real foe, with advice', () => {
    for (const [id, b] of Object.entries(BESTIARY)) {
      expect(ENEMIES[id], id).toBeDefined();
      expect(b.blurb.length).toBeGreaterThan(10);
      expect(b.tip.length).toBeGreaterThan(10);
    }
  });
});
