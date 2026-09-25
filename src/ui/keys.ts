import type { Input } from '../core/input';

/**
 * Tutorial text is written for mouse and keyboard. On touch screens and
 * gamepads, the key names are swapped for the buttons actually in hand.
 */

type Rule = [RegExp, string, string];

// [pattern, touch wording, gamepad wording]
const RULES: Rule[] = [
  [/WASD to move, mouse to look/g, 'Left thumb to move, drag the right side to look', 'Left stick to move, right stick to look'],
  // Swimming (the touch buttons read Dive, Leap and Stroke while in the water).
  [/\bWASD to paddle\b/g, 'Left thumb to paddle', 'Left stick to paddle'],
  [/\bSpace to leap out\b/g, 'Leap to jump out', 'A to leap out'],
  [/\bHold Shift to dive\b/g, 'Hold Dive to go under', 'Hold B to dive'],
  [/\bSpace to rise\b/g, 'Leap to rise', 'A to rise'],
  [/\bLeft Mouse for a strong stroke\b/g, 'Stroke to surge ahead', 'X for a strong stroke'],
  [/\bHorn gives a strong stroke\b/g, 'Stroke gives a burst of speed', 'X gives a strong stroke'],
  [/Space \/ Click/g, 'Tap', 'A'],
  [/Esc to skip/g, 'Pause to skip', 'Start to skip'],
  [/Hold Right Mouse/g, 'Hold Breath', 'Hold RT'],
  [/\bRight Mouse\b/g, 'Breath', 'RT'],
  [/\bLeft Mouse\b/g, 'Horn', 'X'],
  [/\bHold RMB\b/g, 'Hold Breath', 'Hold RT'],
  [/\bRMB\b/g, 'Breath', 'RT'],
  [/\bLMB\b/g, 'Horn', 'X'],
  [/\bHold Space\b/g, 'Hold Jump', 'Hold A'],
  [/\bHOLD Space\b/g, 'HOLD Jump', 'HOLD A'],
  [/\bSpace\b/g, 'Jump', 'A'],
  [/\bHold Shift\b/g, 'Hold Dodge', 'Hold B'],
  [/\bTap Shift\b/g, 'Tap Dodge', 'Tap B'],
  [/\bShift\b/g, 'Dodge', 'B'],
  [/\bPress F\b/g, 'Tap Use', 'Press L3'],
  [/\bPress H\b/g, 'Tap Flick', 'Press R3'],
  [/\bPress X\b/g, 'Tap Fury', 'Press Back'],
  [/\bX to release\b/g, 'Fury to release', 'Back to release'],
  [/\bHold C\b/g, 'Hold Time', 'Hold LT'],
  [/\(C\)/g, '(Time)', '(LT)'],
  [/\(Q\)/g, '(Burst)', '(LB)'],
  [/\bwith Q\b/g, 'with Burst', 'with LB'],
  [/\bQ for\b/g, 'Burst for', 'LB for'],
  [/\bQ: Burst\b/g, 'Burst', 'LB: Burst'],
  [/\(E\)/g, '(Tail)', '(Y)'],
  [/\bPress E\b/g, 'Tap Tail', 'Press Y'],
  [/\bPress ([1-4]) to select it\b/g, 'Tap Element to select it', 'Press the D-pad to select it'],
  // Nyxa's command (G): on a pad it shares L3 with Use.
  [/\b([Hh])old G\b/g, '$1old Nyxa', '$1old L3'],
  [/\b([Tt])ap G\b/g, '$1ap Nyxa', '$1ap L3'],
  [/\b([Pp])ress G\b/g, 'Tap Nyxa', '$1ress L3'],
];

export function forInput(text: string, input: Input): string {
  if (!input.usingTouch && !input.usingPad) return text;
  const k = input.usingTouch ? 1 : 2;
  let out = text;
  for (const r of RULES) out = out.replace(r[0], r[k]!);
  return out;
}
