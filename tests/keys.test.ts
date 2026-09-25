import { describe, expect, it } from 'vitest';
import { forInput } from '../src/ui/keys';
import type { Input } from '../src/core/input';

const as = (usingTouch: boolean, usingPad: boolean) => ({ usingTouch, usingPad }) as unknown as Input;

describe('tutorial wording follows the controls in hand', () => {
  const line = 'Hold Right Mouse to breathe fire, Q for a fireball! Hold Shift to charge, Space to jump.';
  it('keeps keyboard text as written', () => {
    expect(forInput(line, as(false, false))).toBe(line);
  });
  it('names the on-screen buttons on touch', () => {
    expect(forInput(line, as(true, false))).toBe('Hold Breath to breathe fire, Burst for a fireball! Hold Dodge to charge, Jump to jump.');
    expect(forInput('WASD to move, mouse to look.', as(true, false))).toBe('Left thumb to move, drag the right side to look.');
  });
  it('names gamepad buttons with a pad', () => {
    expect(forInput(line, as(false, true))).toBe('Hold RT to breathe fire, LB for a fireball! Hold B to charge, A to jump.');
  });
});
