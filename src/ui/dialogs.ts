/**
 * Modal windows: NPC dialogue, shops, job advancement, the world map, and help.
 */
import { VIEW_H, VIEW_W, roundRect } from '../engine/renderer';
import { PAL, rgba } from '../art/palette';
import { button, closeButton, hit, panel, rect, text, tooltip, UiInput, wrapLines, wrapText } from './imgui';
import type { UiHooks, UiState } from './state';
import type { Player } from '../game/player';
import { drawCharacter, CharacterLook, DEFAULT_LOOK } from '../art/character';
import { drawItemIcon } from '../art/itemicons';
import { getItem, sellPrice } from '../data/items';
import { TABS } from '../game/inventory';
import { JOBS, getJob } from '../data/jobs';
import { allMaps } from '../data/maps';
import type { GameMap } from '../game/types';
import { DEFAULT_BINDINGS } from '../engine/input';

/* ------------------------------------------------------------- dialogue -- */

export interface DialogueView {
  npcName: string;
  npcTitle: string;
  look: Partial<CharacterLook>;
  body: string;
  options: { label: string; enabled: boolean }[];
}

/** Minimum height; the panel grows to fit its text and options. */
const DIALOGUE_MIN_H = 176;
const DIALOGUE_LINE = 16;
const DIALOGUE_OPTION = 25;

export function drawDialogue(
  ctx: CanvasRenderingContext2D, ui: UiInput, view: DialogueView, hooks: UiHooks, time: number,
): void {
  // Size the panel to its content so long dialogue never overflows it.
  const bodyWidth = VIEW_W - 128 - 150;
  const lineCount = wrapLines(ctx, view.body, bodyWidth).length;
  const h = Math.max(
    DIALOGUE_MIN_H,
    76 + lineCount * DIALOGUE_LINE + view.options.length * DIALOGUE_OPTION + 26,
  );
  const r = rect(64, VIEW_H - h - 84, VIEW_W - 128, h);
  panel(ctx, r);

  // Portrait.
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, r.x + 12, r.y + 12, 96, 110, 6);
  ctx.clip();
  ctx.fillStyle = 'rgba(10,14,23,0.9)';
  ctx.fillRect(r.x + 12, r.y + 12, 96, 110);
  drawCharacter(ctx, r.x + 60, r.y + 118, { ...DEFAULT_LOOK, ...view.look }, {
    state: 'stand', facing: 1, animTime: time, attack: null, flash: 0, alpha: 1,
  });
  ctx.restore();
  ctx.strokeStyle = PAL.border;
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 12.5, r.y + 12.5, 95, 109, 6);
  ctx.stroke();

  text(ctx, view.npcName, r.x + 124, r.y + 30, {
    color: PAL.gold, font: '700 15px ui-monospace, monospace',
  });
  text(ctx, view.npcTitle, r.x + 124, r.y + 46, {
    color: PAL.textDim, font: '11px ui-monospace, monospace',
  });

  const bodyLines = wrapText(ctx, view.body, r.x + 124, r.y + 70, r.w - 150, 16, {
    color: PAL.text, font: '12px ui-monospace, monospace',
  });

  // Options.
  let y = r.y + 76 + bodyLines * 16;
  view.options.forEach((opt, i) => {
    const or = rect(r.x + 124, y, r.w - 150, 22);
    const hovered = hit(or, ui.mx, ui.my) && opt.enabled;
    ctx.fillStyle = hovered ? PAL.panelLight : 'rgba(15,20,34,0.5)';
    roundRect(ctx, or.x, or.y, or.w, or.h, 4);
    ctx.fill();
    text(ctx, `${i + 1}.`, or.x + 8, or.y + 15, {
      color: opt.enabled ? PAL.gold : PAL.textFaint, font: '600 11px ui-monospace, monospace',
    });
    text(ctx, opt.label, or.x + 28, or.y + 15, {
      color: opt.enabled ? PAL.text : rgba(PAL.textDim, 0.5),
      font: '12px ui-monospace, monospace',
    });
    if (hovered && ui.clicked) {
      ui.consume();
      hooks.dialogueOption(i);
    }
    y += 25;
  });

  text(ctx, 'Press the number keys, or Esc to leave.', r.x + 124, r.y + r.h - 10, {
    color: PAL.textFaint, font: '10px ui-monospace, monospace',
  });
}

/* ------------------------------------------------------------------ shop -- */

export function drawShop(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState,
  player: Player, stock: readonly string[], hooks: UiHooks,
): void {
  const r = rect(VIEW_W / 2 - 340, 70, 680, 470);
  panel(ctx, r, 'Shop');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('shop');
    state.shopNpc = null;
    return;
  }

  text(ctx, `${player.inventory.mesos.toLocaleString()} mesos`, r.x + r.w - 40, r.y + 20, {
    color: PAL.gold, font: '600 12px ui-monospace, monospace', align: 'right',
  });

  const half = (r.w - 36) / 2;

  /* -- buy column -- */
  text(ctx, 'BUY', r.x + 16, r.y + 52, { color: PAL.textDim, font: '700 11px ui-monospace, monospace' });
  const listTop = r.y + 62;
  const listH = r.h - 62 - 20;
  const rowH = 40;
  const maxScroll = Math.max(0, stock.length * rowH - listH);
  if (hit(rect(r.x + 12, listTop, half, listH), ui.mx, ui.my) && ui.wheel !== 0) {
    state.scroll.shopBuy = Math.max(0, Math.min(maxScroll, (state.scroll.shopBuy ?? 0) + ui.wheel));
  }
  const scrollBuy = state.scroll.shopBuy ?? 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x + 12, listTop, half, listH);
  ctx.clip();
  stock.forEach((itemId, i) => {
    const y = listTop + i * rowH - scrollBuy;
    if (y + rowH < listTop || y > listTop + listH) return;
    const def = getItem(itemId);
    const row = rect(r.x + 14, y, half - 4, rowH - 4);
    const hovered = hit(row, ui.mx, ui.my);
    const affordable = player.inventory.mesos >= def.price;

    ctx.fillStyle = hovered ? PAL.panelLight : 'rgba(15,20,34,0.6)';
    roundRect(ctx, row.x, row.y, row.w, row.h, 4);
    ctx.fill();
    drawItemIcon(ctx, def.icon, row.x + 22, row.y + 18, 24);
    text(ctx, def.name, row.x + 42, row.y + 16, {
      color: PAL.text, font: '600 11px ui-monospace, monospace',
    });
    text(ctx, `${def.price.toLocaleString()} mesos`, row.x + 42, row.y + 29, {
      color: affordable ? PAL.gold : PAL.hp, font: '10px ui-monospace, monospace',
    });

    if (button(ctx, ui, rect(row.x + row.w - 76, row.y + 8, 32, 20), 'x1', { disabled: !affordable })) {
      hooks.buy(itemId, 1);
    }
    if (button(ctx, ui, rect(row.x + row.w - 40, row.y + 8, 34, 20), 'x10', {
      disabled: player.inventory.mesos < def.price * 10 || !!def.equip,
    })) {
      hooks.buy(itemId, 10);
    }
    if (hovered) {
      tooltip(ctx, ui.mx, ui.my, [
        { text: def.name, color: PAL.text, font: '700 12px ui-monospace, monospace' },
        { text: def.desc, color: PAL.textDim },
      ], VIEW_W, VIEW_H);
    }
  });
  ctx.restore();

  /* -- sell column -- */
  const sx = r.x + 24 + half;
  text(ctx, 'SELL', sx, r.y + 52, { color: PAL.textDim, font: '700 11px ui-monospace, monospace' });

  // Tab strip for the sell side.
  const tabW = (half - 8) / TABS.length;
  TABS.forEach((tab, i) => {
    const tr = rect(sx + i * tabW, r.y + 60, tabW - 3, 20);
    const active = state.invTab === tab;
    ctx.fillStyle = active ? PAL.panelLight : 'rgba(20,26,43,0.7)';
    roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 4);
    ctx.fill();
    text(ctx, tab.toUpperCase(), tr.x + tr.w / 2, tr.y + 14, {
      color: active ? PAL.text : PAL.textDim,
      font: '600 9px ui-monospace, monospace', align: 'center',
    });
    if (hit(tr, ui.mx, ui.my) && ui.clicked) {
      ui.consume();
      state.invTab = tab;
    }
  });

  const slots = player.inventory.tabs[state.invTab];
  const sellTop = r.y + 86;
  const sellH = r.h - 86 - 20;
  const maxSellScroll = Math.max(0, slots.length * 32 - sellH);
  if (hit(rect(sx, sellTop, half, sellH), ui.mx, ui.my) && ui.wheel !== 0) {
    state.scroll.shopSell = Math.max(0, Math.min(maxSellScroll, (state.scroll.shopSell ?? 0) + ui.wheel));
  }
  const scrollSell = state.scroll.shopSell ?? 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, sellTop, half, sellH);
  ctx.clip();
  slots.forEach((slot, i) => {
    if (!slot) return;
    const y = sellTop + i * 32 - scrollSell;
    if (y + 32 < sellTop || y > sellTop + sellH) return;
    const itemId = slot.kind === 'equip' ? slot.inst.itemId : slot.itemId;
    const def = getItem(itemId);
    const qty = slot.kind === 'stack' ? slot.qty : 1;
    const row = rect(sx, y, half - 4, 28);
    const hovered = hit(row, ui.mx, ui.my);

    ctx.fillStyle = hovered ? PAL.panelLight : 'rgba(15,20,34,0.6)';
    roundRect(ctx, row.x, row.y, row.w, row.h, 4);
    ctx.fill();
    drawItemIcon(ctx, def.icon, row.x + 18, row.y + 14, 20);
    text(ctx, qty > 1 ? `${def.name} x${qty}` : def.name, row.x + 34, row.y + 18, {
      color: PAL.text, font: '11px ui-monospace, monospace',
    });
    if (button(ctx, ui, rect(row.x + row.w - 78, row.y + 4, 72, 20),
               `${(sellPrice(def) * qty).toLocaleString()}`, { tone: 'ghost' })) {
      hooks.sell(state.invTab, i);
    }
  });
  ctx.restore();
}

/* ------------------------------------------------------- job advancement -- */

export function drawAdvancement(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState, player: Player, hooks: UiHooks,
): void {
  const options = player.advancementOptions();
  const r = rect(VIEW_W / 2 - 280, 110, 560, 380);
  panel(ctx, r, 'Job Advancement');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('advance');
    return;
  }

  text(ctx, `Currently: ${getJob(player.jobId).name}`, r.x + 18, r.y + 54, {
    color: PAL.textDim, font: '12px ui-monospace, monospace',
  });

  if (options.length === 0) {
    text(ctx, 'There is nothing further along this path yet.', r.x + 18, r.y + 88, {
      color: PAL.textFaint, font: '12px ui-monospace, monospace',
    });
    return;
  }

  let y = r.y + 78;
  for (const job of options) {
    const check = player.canAdvanceTo(job.id);
    const boxH = 74;
    ctx.fillStyle = 'rgba(15,20,34,0.6)';
    roundRect(ctx, r.x + 16, y, r.w - 32, boxH, 5);
    ctx.fill();
    ctx.strokeStyle = check.ok ? PAL.exp : rgba(PAL.border, 0.8);
    ctx.lineWidth = 1;
    roundRect(ctx, r.x + 16.5, y + 0.5, r.w - 33, boxH - 1, 5);
    ctx.stroke();

    text(ctx, job.name, r.x + 30, y + 22, {
      color: check.ok ? PAL.text : PAL.textDim, font: '700 14px ui-monospace, monospace',
    });
    text(ctx, job.blurb, r.x + 30, y + 39, {
      color: PAL.textFaint, font: 'italic 11px ui-monospace, monospace',
    });

    const reqColour = check.ok ? PAL.exp : PAL.hp;
    text(ctx, `Requires Level ${job.reqLevel} and ${job.primary.toUpperCase()} ${job.reqStat}`,
         r.x + 30, y + 58, { color: reqColour, font: '11px ui-monospace, monospace' });
    text(ctx, `You: Level ${player.level}, ${job.primary.toUpperCase()} ${player.base[job.primary]}`,
         r.x + r.w - 30, y + 58, {
           color: PAL.textDim, font: '11px ui-monospace, monospace', align: 'right',
         });

    if (button(ctx, ui, rect(r.x + r.w - 130, y + 12, 100, 26), 'Advance', {
      disabled: !check.ok, tone: 'primary',
    })) {
      hooks.advanceJob(job.id);
    }
    y += boxH + 10;
  }

  text(ctx, 'This choice is permanent.', r.x + 18, r.y + r.h - 16, {
    color: PAL.textFaint, font: '11px ui-monospace, monospace',
  });
}

/* -------------------------------------------------------------- world map -- */

export function drawWorldMap(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState, currentMapId: string,
): void {
  const r = rect(VIEW_W / 2 - 330, 70, 660, 500);
  panel(ctx, r, 'World Map');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('worldmap');
    return;
  }

  const maps = allMaps();
  const regions = [...new Set(maps.map((m) => m.region))];
  let y = r.y + 56;

  for (const region of regions) {
    text(ctx, region.toUpperCase(), r.x + 20, y, {
      color: PAL.gold, font: '700 12px ui-monospace, monospace',
    });
    y += 8;
    ctx.strokeStyle = rgba(PAL.border, 0.8);
    ctx.beginPath();
    ctx.moveTo(r.x + 20, y + 0.5);
    ctx.lineTo(r.x + r.w - 20, y + 0.5);
    ctx.stroke();
    y += 14;

    const inRegion = maps.filter((m) => m.region === region);
    for (const map of inRegion) {
      const row = rect(r.x + 22, y - 12, r.w - 44, 26);
      const current = map.id === currentMapId;
      const hovered = hit(row, ui.mx, ui.my);
      if (current || hovered) {
        ctx.fillStyle = current ? 'rgba(143,209,79,0.14)' : rgba(PAL.panelLight, 0.6);
        roundRect(ctx, row.x, row.y, row.w, row.h, 4);
        ctx.fill();
      }

      text(ctx, current ? `▸ ${map.name}` : `  ${map.name}`, r.x + 30, y + 4, {
        color: current ? PAL.exp : map.town ? '#7fd8e8' : PAL.text,
        font: current ? '700 12px ui-monospace, monospace' : '12px ui-monospace, monospace',
      });
      text(ctx, map.town ? 'Town' : `Lv. ${map.levelRange[0]} – ${map.levelRange[1]}`,
           r.x + r.w - 150, y + 4, { color: PAL.textDim, font: '11px ui-monospace, monospace' });
      text(ctx, connectionSummary(map), r.x + r.w - 30, y + 4, {
        color: PAL.textFaint, font: '10px ui-monospace, monospace', align: 'right',
      });
      y += 24;
    }
    y += 14;
  }
}

function connectionSummary(map: GameMap): string {
  const exits = map.portals.filter((p) => p.toMap).length;
  return exits === 1 ? '1 exit' : `${exits} exits`;
}

/* ------------------------------------------------------------------ help -- */

const HELP_ROWS: [string, string][] = [
  ['Move', 'Left / Right'],
  ['Jump', 'Alt  (or Space)'],
  ['Down-jump', 'Down + Alt'],
  ['Climb', 'Up / Down on a rope or ladder'],
  ['Prone', 'Down'],
  ['Attack', 'Ctrl'],
  ['Skills', '1 – 8  (bind them in the Skill window)'],
  ['Pick up', 'Z'],
  ['Use HP / MP potion', 'X / C'],
  ['Enter portal, talk to NPC', 'Up'],
  ['Character', 'A'],
  ['Inventory', 'I'],
  ['Equipment', 'E'],
  ['Skills window', 'S'],
  ['Quest log', 'Q'],
  ['World map', 'M'],
  ['Minimap toggle', 'M (hold Shift)'],
  ['Close window', 'Esc'],
  ['This help', 'F1'],
];

export function drawHelp(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState,
): void {
  const r = rect(VIEW_W / 2 - 240, 90, 480, 468);
  panel(ctx, r, 'Controls');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('help');
    return;
  }

  let y = r.y + 58;
  for (const [action, keys] of HELP_ROWS) {
    text(ctx, action, r.x + 22, y, { color: PAL.textDim, font: '12px ui-monospace, monospace' });
    text(ctx, keys, r.x + r.w - 22, y, {
      color: PAL.text, font: '12px ui-monospace, monospace', align: 'right',
    });
    y += 21;
  }

  y += 8;
  text(ctx, 'Damage falls off sharply against higher-level monsters,', r.x + 22, y, {
    color: PAL.textFaint, font: 'italic 11px ui-monospace, monospace',
  });
  text(ctx, 'and EXP falls off against lower-level ones. Keep moving.', r.x + 22, y + 15, {
    color: PAL.textFaint, font: 'italic 11px ui-monospace, monospace',
  });
}

/** Exported so the settings screen can show the raw key codes. */
export { DEFAULT_BINDINGS, JOBS };
