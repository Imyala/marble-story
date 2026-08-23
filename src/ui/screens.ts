/**
 * Front-end screens: world select, character select, class select.
 *
 * These sit in front of the game the way the genre's do — you pick a world,
 * then a character slot, then (for a new character) a class, and only then
 * does the world load. Everything is drawn with the same immediate-mode
 * toolkit as the in-game windows.
 */
import { VIEW_H, VIEW_W, outlinedText, roundRect } from '../engine/renderer';
import { PAL, rgba, shade } from '../art/palette';
import { button, hit, rect, Rect, text, UiInput, wrapText } from './imgui';
import { drawCharacter, CharacterLook, DEFAULT_LOOK } from '../art/character';
import { CLASS_OPTIONS, ClassOption, getClassOption } from '../data/classes';
import { WORLD_TIERS, WorldDef, WORLDS, getWorld } from '../data/worlds';
import { CharacterSummary, Profile, characterCount, summarise } from '../game/profile';

export type Screen = 'world' | 'characters' | 'class';

export interface MenuContext {
  ctx: CanvasRenderingContext2D;
  ui: UiInput;
  time: number;
  profile: Profile;
  worldId: string | null;
  slot: number | null;
  classId: string;
  nameDraft: string;
  nameError: string | null;
  page: number;
}

export type MenuAction =
  | { kind: 'selectWorld'; worldId: string }
  | { kind: 'backToWorlds' }
  | { kind: 'play'; slot: number }
  | { kind: 'createAt'; slot: number }
  | { kind: 'deleteAt'; slot: number }
  | { kind: 'pickClass'; classId: string }
  | { kind: 'confirmCreate' }
  | { kind: 'backToCharacters' }
  | { kind: 'setPage'; page: number }
  | null;

/* ------------------------------------------------------------- backdrop -- */

/** Shared dark ground with a slow drifting glow, so screens feel continuous. */
function menuBackdrop(ctx: CanvasRenderingContext2D, time: number, accent: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0d1220');
  g.addColorStop(1, '#070a12');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Two slow orbs of colour, well below the content in contrast.
  for (const [i, scale] of [[0, 1], [1, 0.7]] as const) {
    const x = VIEW_W * (0.3 + 0.4 * Math.sin(time * 0.08 + i * 2.1));
    const y = VIEW_H * (0.4 + 0.25 * Math.cos(time * 0.06 + i * 1.4));
    const r = 380 * scale;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, rgba(accent, 0.13));
    glow.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function wordmark(ctx: CanvasRenderingContext2D, x: number, y: number, sub: string): void {
  ctx.textAlign = 'center';
  ctx.font = '700 46px ui-monospace, monospace';
  outlinedText(ctx, 'MARBLE STORY', x, y, PAL.gold, 'rgba(0,0,0,0.85)', 7);
  ctx.font = '13px ui-monospace, monospace';
  outlinedText(ctx, sub, x, y + 26, PAL.textDim, 'rgba(0,0,0,0.8)', 4);
}

/** A small header used above each panel section. */
function sectionLabel(ctx: CanvasRenderingContext2D, label: string, r: Rect, colour: string): void {
  ctx.fillStyle = colour;
  roundRect(ctx, r.x, r.y, r.w, 20, 4);
  ctx.fill();
  text(ctx, label.toUpperCase(), r.x + 10, r.y + 14, {
    color: '#141a2b', font: '700 11px ui-monospace, monospace',
  });
}

/* --------------------------------------------------------- world select -- */

export function drawWorldSelect(c: MenuContext): MenuAction {
  const { ctx, ui } = c;
  menuBackdrop(ctx, c.time, PAL.gold);
  wordmark(ctx, VIEW_W * 0.42, VIEW_H * 0.42, 'Choose a world to begin.');

  let action: MenuAction = null;

  // Explanation panel, mirroring the genre's habit of explaining rulesets up
  // front rather than burying them in a wiki.
  const info = rect(60, VIEW_H - 190, VIEW_W * 0.42, 150);
  ctx.fillStyle = 'rgba(10,14,23,0.72)';
  roundRect(ctx, info.x, info.y, info.w, info.h, 8);
  ctx.fill();
  ctx.strokeStyle = rgba(PAL.border, 0.9);
  ctx.lineWidth = 1;
  roundRect(ctx, info.x + 0.5, info.y + 0.5, info.w - 1, info.h - 1, 8);
  ctx.stroke();

  let iy = info.y + 26;
  for (const tier of WORLD_TIERS) {
    text(ctx, tier.label.toUpperCase(), info.x + 16, iy, {
      color: tier.tier === 'heroic' ? PAL.gold : '#7fd8e8',
      font: '700 12px ui-monospace, monospace',
    });
    iy += 16;
    iy += wrapText(ctx, tier.note, info.x + 16, iy, info.w - 32, 15, {
      color: PAL.textDim, font: '11px ui-monospace, monospace',
    }) * 15 + 12;
  }

  // World list.
  const panel = rect(VIEW_W - 330, 40, 290, VIEW_H - 140);
  ctx.fillStyle = 'rgba(14,19,32,0.9)';
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 10);
  ctx.fill();
  ctx.strokeStyle = rgba(PAL.borderLit, 0.8);
  ctx.lineWidth = 1.5;
  roundRect(ctx, panel.x + 0.5, panel.y + 0.5, panel.w - 1, panel.h - 1, 10);
  ctx.stroke();

  let y = panel.y + 16;
  for (const tier of WORLD_TIERS) {
    sectionLabel(ctx, tier.label, rect(panel.x + 14, y, panel.w - 28, 20),
                 tier.tier === 'heroic' ? PAL.gold : '#7fd8e8');
    y += 28;

    for (const world of WORLDS.filter((w) => w.tier === tier.tier)) {
      const row = rect(panel.x + 14, y, panel.w - 28, 52);
      const hovered = hit(row, ui.mx, ui.my);
      const count = characterCount(c.profile, world.id);

      ctx.fillStyle = hovered ? PAL.panelLight : 'rgba(20,26,43,0.85)';
      roundRect(ctx, row.x, row.y, row.w, row.h, 6);
      ctx.fill();
      ctx.strokeStyle = hovered ? world.accent : rgba(PAL.border, 0.9);
      ctx.lineWidth = hovered ? 1.6 : 1;
      roundRect(ctx, row.x + 0.5, row.y + 0.5, row.w - 1, row.h - 1, 6);
      ctx.stroke();

      // World badge.
      ctx.fillStyle = world.accent;
      ctx.beginPath();
      ctx.arc(row.x + 24, row.y + 26, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0e17';
      text(ctx, world.name[0], row.x + 24, row.y + 31, {
        color: '#0b0e17', font: '700 13px ui-monospace, monospace', align: 'center',
      });

      text(ctx, world.name, row.x + 44, row.y + 22, {
        color: PAL.text, font: '700 13px ui-monospace, monospace',
      });
      text(ctx, world.seasonal ? 'Limited run' : world.blurb, row.x + 44, row.y + 38, {
        color: world.seasonal ? PAL.dmgCrit : PAL.textFaint,
        font: '10px ui-monospace, monospace',
      });
      if (count > 0) {
        text(ctx, `${count}`, row.x + row.w - 14, row.y + 31, {
          color: PAL.exp, font: '700 13px ui-monospace, monospace', align: 'right',
        });
      }

      if (hovered && ui.clicked) {
        ui.consume();
        action = { kind: 'selectWorld', worldId: world.id };
      }
      y += 58;
    }
    y += 6;
  }

  text(ctx, `Ver. 0.1.0`, 20, VIEW_H - 18, {
    color: PAL.textFaint, font: '10px ui-monospace, monospace',
  });
  return action;
}

/* ----------------------------------------------------- character select -- */

const SLOTS_PER_PAGE = 4;

export function drawCharacterSelect(c: MenuContext): MenuAction {
  const { ctx, ui } = c;
  const world = getWorld(c.worldId ?? WORLDS[0].id);
  menuBackdrop(ctx, c.time, world.accent);

  let action: MenuAction = null;
  const summaries = summarise(c.profile, world.id);
  const pages = Math.max(1, Math.ceil(summaries.length / SLOTS_PER_PAGE));
  const page = Math.min(c.page, pages - 1);

  // World header, right.
  const head = rect(VIEW_W - 250, 30, 210, 64);
  ctx.fillStyle = 'rgba(14,19,32,0.9)';
  roundRect(ctx, head.x, head.y, head.w, head.h, 8);
  ctx.fill();
  ctx.strokeStyle = rgba(world.accent, 0.8);
  ctx.lineWidth = 1.4;
  roundRect(ctx, head.x + 0.5, head.y + 0.5, head.w - 1, head.h - 1, 8);
  ctx.stroke();
  ctx.fillStyle = world.accent;
  ctx.beginPath();
  ctx.arc(head.x + 28, head.y + 32, 14, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, world.name[0], head.x + 28, head.y + 38, {
    color: '#0b0e17', font: '700 16px ui-monospace, monospace', align: 'center',
  });
  text(ctx, world.name, head.x + 52, head.y + 28, {
    color: PAL.text, font: '700 15px ui-monospace, monospace',
  });
  text(ctx, `Characters ${characterCount(c.profile, world.id)}/${world.slots}`,
       head.x + 52, head.y + 46, {
         color: PAL.textDim, font: '11px ui-monospace, monospace',
       });

  // Slot cards.
  const cardW = 170;
  const cardH = 250;
  const gap = 22;
  const start = page * SLOTS_PER_PAGE;
  const shown = summaries.slice(start, start + SLOTS_PER_PAGE);
  const totalW = shown.length * cardW + (shown.length - 1) * gap;
  const originX = (VIEW_W - totalW) / 2;
  const originY = VIEW_H / 2 - cardH / 2 - 20;

  shown.forEach((summary, i) => {
    const slot = start + i;
    const card = rect(originX + i * (cardW + gap), originY, cardW, cardH);
    const hovered = hit(card, ui.mx, ui.my);
    const selected = c.slot === slot;

    ctx.fillStyle = selected ? 'rgba(47,75,107,0.85)' : hovered ? 'rgba(30,39,64,0.85)' : 'rgba(14,19,32,0.75)';
    roundRect(ctx, card.x, card.y, card.w, card.h, 10);
    ctx.fill();
    ctx.strokeStyle = selected ? PAL.gold : hovered ? PAL.borderLit : rgba(PAL.border, 0.8);
    ctx.lineWidth = selected ? 2 : 1;
    roundRect(ctx, card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1, 10);
    ctx.stroke();

    if (summary) {
      drawSlotCharacter(ctx, card, summary, c.time + i);
      if (hovered && ui.clicked) {
        ui.consume();
        action = { kind: 'play', slot };
      }
    } else {
      drawEmptySlot(ctx, card, c.time + i);
      if (hovered && ui.clicked) {
        ui.consume();
        action = { kind: 'createAt', slot };
      }
    }
  });

  // Paging.
  if (pages > 1) {
    const py = originY + cardH + 22;
    const totalDots = pages * 26;
    let dx = (VIEW_W - totalDots) / 2;
    for (let p = 0; p < pages; p++) {
      const dot = rect(dx, py, 20, 20);
      const active = p === page;
      const hovered = hit(dot, ui.mx, ui.my);
      ctx.fillStyle = active ? PAL.gold : hovered ? PAL.panelLight : 'rgba(20,26,43,0.8)';
      roundRect(ctx, dot.x, dot.y, dot.w, dot.h, 4);
      ctx.fill();
      text(ctx, String(p + 1), dot.x + 10, dot.y + 14, {
        color: active ? '#141a2b' : PAL.textDim,
        font: '700 11px ui-monospace, monospace', align: 'center',
      });
      if (hovered && ui.clicked) {
        ui.consume();
        action = { kind: 'setPage', page: p };
      }
      dx += 26;
    }
  }

  // Footer controls.
  const selected = c.slot !== null ? summaries[c.slot] : null;
  const by = VIEW_H - 62;
  if (button(ctx, ui, rect(VIEW_W / 2 - 190, by, 170, 34), 'Create Character', {
    tone: 'primary',
    disabled: characterCount(c.profile, world.id) >= world.slots,
  })) {
    const free = summaries.findIndex((s) => s === null);
    if (free >= 0) action = { kind: 'createAt', slot: free };
  }
  if (button(ctx, ui, rect(VIEW_W / 2 + 20, by, 170, 34), 'Delete Character', {
    tone: 'danger', disabled: !selected,
  })) {
    if (c.slot !== null) action = { kind: 'deleteAt', slot: c.slot };
  }
  if (button(ctx, ui, rect(30, by, 130, 34), '‹  World Select', { tone: 'ghost' })) {
    action = { kind: 'backToWorlds' };
  }

  text(ctx, 'Click a character to play. Click an empty slot to make one.',
       VIEW_W / 2, VIEW_H - 16, {
         color: PAL.textFaint, font: '11px ui-monospace, monospace', align: 'center',
       });
  return action;
}

function drawSlotCharacter(
  ctx: CanvasRenderingContext2D, card: Rect, summary: CharacterSummary, time: number,
): void {
  const look: CharacterLook = { ...DEFAULT_LOOK, ...(summary.look as Partial<CharacterLook>) };
  // A soft pedestal so the figure does not float in the card.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(card.x + card.w / 2, card.y + 150, 40, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  drawCharacter(ctx, card.x + card.w / 2, card.y + 150, look, {
    state: 'stand', facing: 1, animTime: time, attack: null, flash: 0, alpha: 1,
  });

  text(ctx, summary.name, card.x + card.w / 2, card.y + 186, {
    color: PAL.text, font: '700 15px ui-monospace, monospace', align: 'center',
  });
  text(ctx, `Lv. ${summary.level}`, card.x + card.w / 2, card.y + 208, {
    color: PAL.gold, font: '700 13px ui-monospace, monospace', align: 'center',
  });
  text(ctx, summary.jobName, card.x + card.w / 2, card.y + 228, {
    color: PAL.textDim, font: '11px ui-monospace, monospace', align: 'center',
  });
}

function drawEmptySlot(ctx: CanvasRenderingContext2D, card: Rect, time: number): void {
  const bob = Math.sin(time * 1.6) * 3;
  ctx.save();
  ctx.globalAlpha = 0.22;
  drawCharacter(ctx, card.x + card.w / 2, card.y + 150 + bob, DEFAULT_LOOK, {
    state: 'stand', facing: 1, animTime: time, attack: null, flash: 0, alpha: 1,
  });
  ctx.restore();

  ctx.strokeStyle = rgba(PAL.borderLit, 0.5);
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  roundRect(ctx, card.x + 16, card.y + 16, card.w - 32, card.h - 32, 8);
  ctx.stroke();
  ctx.setLineDash([]);

  text(ctx, '+  Create', card.x + card.w / 2, card.y + 200, {
    color: PAL.textDim, font: '600 13px ui-monospace, monospace', align: 'center',
  });
  text(ctx, 'Empty slot', card.x + card.w / 2, card.y + 220, {
    color: PAL.textFaint, font: '10px ui-monospace, monospace', align: 'center',
  });
}

/* --------------------------------------------------------- class select -- */

export function drawClassSelect(c: MenuContext): MenuAction {
  const { ctx, ui } = c;
  const option = getClassOption(c.classId);
  menuBackdrop(ctx, c.time, option.accent);

  let action: MenuAction = null;

  drawClassDetail(ctx, option, c.time);
  const gridAction = drawClassGrid(c);
  if (gridAction) action = gridAction;

  // Name entry.
  const field = rect(60, VIEW_H - 148, 400, 40);
  text(ctx, 'CHARACTER NAME', field.x, field.y - 10, {
    color: PAL.textDim, font: '700 10px ui-monospace, monospace',
  });
  ctx.fillStyle = 'rgba(10,14,23,0.9)';
  roundRect(ctx, field.x, field.y, field.w, field.h, 6);
  ctx.fill();
  ctx.strokeStyle = c.nameError ? PAL.hp : PAL.borderLit;
  ctx.lineWidth = 1.4;
  roundRect(ctx, field.x + 0.5, field.y + 0.5, field.w - 1, field.h - 1, 6);
  ctx.stroke();

  const caret = Math.floor(c.time * 2) % 2 === 0 ? '_' : ' ';
  text(ctx, c.nameDraft + caret, field.x + 14, field.y + 26, {
    color: c.nameDraft ? PAL.text : PAL.textFaint,
    font: '600 16px ui-monospace, monospace',
  });
  text(ctx, c.nameError ?? 'Letters and numbers, 2–12 characters.',
       field.x, field.y + 58, {
         color: c.nameError ? PAL.hp : PAL.textFaint,
         font: '11px ui-monospace, monospace',
       });

  if (button(ctx, ui, rect(30, VIEW_H - 62, 130, 34), '‹  Characters', { tone: 'ghost' })) {
    action = { kind: 'backToCharacters' };
  }
  if (button(ctx, ui, rect(VIEW_W - 210, VIEW_H - 66, 170, 40), 'Create  ›', {
    tone: 'primary', font: '700 14px ui-monospace, monospace',
  })) {
    action = { kind: 'confirmCreate' };
  }
  return action;
}

function drawClassDetail(ctx: CanvasRenderingContext2D, option: ClassOption, time: number): void {
  // Oversized portrait, sitting in the gap between the text column and the
  // class list rather than underneath the copy.
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.translate(486, VIEW_H * 0.74);
  ctx.scale(3.5, 3.5);
  drawCharacter(ctx, 0, 0, { ...DEFAULT_LOOK, ...option.look }, {
    state: 'stand', facing: 1, animTime: time, attack: null, flash: 0, alpha: 1,
  });
  ctx.restore();

  text(ctx, option.category.toUpperCase(), 60, 60, {
    color: option.accent, font: '700 11px ui-monospace, monospace',
  });
  ctx.font = '700 40px ui-monospace, monospace';
  ctx.textAlign = 'left';
  outlinedText(ctx, option.name, 60, 102, PAL.text, 'rgba(0,0,0,0.85)', 6);
  text(ctx, option.title, 60, 126, {
    color: PAL.textDim, font: 'italic 14px ui-monospace, monospace',
  });

  const lines = wrapText(ctx, option.description, 60, 160, 330, 17, {
    color: PAL.textDim, font: '12px ui-monospace, monospace',
  });

  // Stat table, as in the reference: label column, value column.
  let y = 160 + lines * 17 + 20;
  const rows: [string, string][] = [
    ['Origin', option.origin],
    ['Movement', option.movement],
    ['Main Stat', option.mainStat === '—' ? '—' : option.mainStat.toUpperCase()],
  ];
  ctx.fillStyle = 'rgba(10,14,23,0.6)';
  roundRect(ctx, 56, y - 18, 336, rows.length * 26 + 14, 6);
  ctx.fill();
  for (const [label, value] of rows) {
    text(ctx, label, 72, y, { color: PAL.textFaint, font: '11px ui-monospace, monospace' });
    text(ctx, value, 376, y, {
      color: PAL.text, font: '600 12px ui-monospace, monospace', align: 'right',
    });
    y += 26;
  }
}

function drawClassGrid(c: MenuContext): MenuAction {
  const { ctx, ui } = c;
  let action: MenuAction = null;

  const rows = Math.ceil(CLASS_OPTIONS.length / 2);
  const panel = rect(VIEW_W - 430, 30, 390, 88 + rows * 104);
  ctx.fillStyle = 'rgba(14,19,32,0.92)';
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 10);
  ctx.fill();
  ctx.strokeStyle = rgba(PAL.borderLit, 0.8);
  ctx.lineWidth = 1.5;
  roundRect(ctx, panel.x + 0.5, panel.y + 0.5, panel.w - 1, panel.h - 1, 10);
  ctx.stroke();

  text(ctx, `There are ${CLASS_OPTIONS.length} classes to choose from.`,
       panel.x + panel.w / 2, panel.y + 26, {
         color: PAL.textDim, font: '11px ui-monospace, monospace', align: 'center',
       });
  sectionLabel(ctx, 'Class Select', rect(panel.x + 16, panel.y + 38, panel.w - 32, 20), PAL.gold);

  const cardW = (panel.w - 46) / 2;
  const cardH = 92;
  CLASS_OPTIONS.forEach((option, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const card = rect(panel.x + 16 + col * (cardW + 14), panel.y + 72 + row * (cardH + 12), cardW, cardH);
    const hovered = hit(card, ui.mx, ui.my);
    const selected = option.id === c.classId;

    ctx.fillStyle = selected ? rgba(option.accent, 0.22) : hovered ? PAL.panelLight : 'rgba(20,26,43,0.8)';
    roundRect(ctx, card.x, card.y, card.w, card.h, 8);
    ctx.fill();
    ctx.strokeStyle = selected ? option.accent : hovered ? PAL.borderLit : rgba(PAL.border, 0.8);
    ctx.lineWidth = selected ? 2 : 1;
    roundRect(ctx, card.x + 0.5, card.y + 0.5, card.w - 1, card.h - 1, 8);
    ctx.stroke();

    // Portrait, clipped into the card's left side.
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, card.x + 1, card.y + 1, card.w - 2, card.h - 2, 7);
    ctx.clip();
    ctx.globalAlpha = selected ? 1 : 0.85;
    drawCharacter(ctx, card.x + 44, card.y + card.h - 6, { ...DEFAULT_LOOK, ...option.look }, {
      state: 'stand', facing: 1, animTime: c.time + i, attack: null, flash: 0, alpha: 1,
    });
    ctx.restore();

    text(ctx, option.name, card.x + 82, card.y + 32, {
      color: selected ? PAL.text : PAL.textDim, font: '700 13px ui-monospace, monospace',
    });
    text(ctx, option.category, card.x + 82, card.y + 50, {
      color: PAL.textFaint, font: '10px ui-monospace, monospace',
    });
    text(ctx, option.mainStat === '—' ? '—' : option.mainStat.toUpperCase(),
         card.x + 82, card.y + 70, {
           color: option.accent, font: '700 11px ui-monospace, monospace',
         });

    if (option.badge) {
      const label = option.badge === 'new' ? 'NEW' : 'CLASSIC';
      ctx.font = '700 9px ui-monospace, monospace';
      const w = ctx.measureText(label).width + 12;
      ctx.fillStyle = option.badge === 'new' ? PAL.exp : shade(option.accent, -0.1);
      roundRect(ctx, card.x + card.w - w - 6, card.y + 6, w, 15, 3);
      ctx.fill();
      text(ctx, label, card.x + card.w - w / 2 - 6, card.y + 17, {
        color: '#0b0e17', font: '700 9px ui-monospace, monospace', align: 'center',
      });
    }

    if (hovered && ui.clicked) {
      ui.consume();
      action = { kind: 'pickClass', classId: option.id };
    }
  });
  return action;
}

/** Names must be printable, short, and not blank. */
export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 12) return 'Name must be 12 characters or fewer.';
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) return 'Letters and numbers only.';
  return null;
}

export type { WorldDef };
