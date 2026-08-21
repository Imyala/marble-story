/**
 * The permanent on-screen furniture: status bars, minimap, buff icons, and
 * the message log.
 */
import { VIEW_H, VIEW_W, outlinedText } from '../engine/renderer';
import { PAL, rgba, shade } from '../art/palette';
import { roundRect } from '../engine/renderer';
import { bar, rect, text, UiInput, hit, tooltip } from './imgui';
import type { Player } from '../game/player';
import type { World } from '../game/world';
import { getJob } from '../data/jobs';
import { MAX_LEVEL } from '../data/expTable';
import { fhLeft, fhRight, fhTop, isWall } from '../physics/foothold';
import { getItem } from '../data/items';
import { drawItemIcon } from '../art/itemicons';

export interface LogLine {
  text: string;
  color: string;
  /** Seconds remaining before it fades from the transient overlay. */
  life: number;
}

export const HUD_HEIGHT = 66;
/** Height of the full-width EXP strip along the very bottom edge. */
const EXP_STRIP = 13;

export interface HudState {
  log: LogLine[];
  minimapOpen: boolean;
  /** Quick-slot skill ids bound to keys 1..8. */
  quickSlots: (string | null)[];
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  ui: UiInput,
  player: Player,
  world: World,
  state: HudState,
  time: number,
): void {
  drawStatusBar(ctx, player, time);
  drawQuickSlots(ctx, ui, player, state);
  if (state.minimapOpen) drawMinimap(ctx, world, player);
  drawBuffs(ctx, ui, player);
  drawLog(ctx, state.log);
}

/* ---------------------------------------------------------- status bar -- */

function drawStatusBar(ctx: CanvasRenderingContext2D, player: Player, time: number): void {
  const y = VIEW_H - HUD_HEIGHT;

  ctx.fillStyle = 'rgba(10,14,23,0.92)';
  ctx.fillRect(0, y, VIEW_W, HUD_HEIGHT);
  ctx.strokeStyle = rgba(PAL.borderLit, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(VIEW_W, y + 0.5);
  ctx.stroke();

  // Level badge.
  const job = getJob(player.jobId);
  ctx.fillStyle = PAL.panelLight;
  roundRect(ctx, 12, y + 10, 62, 42, 6);
  ctx.fill();
  ctx.strokeStyle = PAL.border;
  roundRect(ctx, 12.5, y + 10.5, 61, 41, 6);
  ctx.stroke();
  text(ctx, 'LV', 43, y + 25, { color: PAL.textDim, font: '9px ui-monospace, monospace', align: 'center' });
  text(ctx, String(player.level), 43, y + 44, {
    color: PAL.gold, font: '700 20px ui-monospace, monospace', align: 'center',
  });

  // Name and job.
  text(ctx, player.name, 86, y + 22, { color: PAL.text, font: '700 13px ui-monospace, monospace' });
  text(ctx, job.name, 86, y + 36, { color: PAL.textDim, font: '11px ui-monospace, monospace' });
  text(ctx, `${player.inventory.mesos.toLocaleString()} mesos`, 86, y + 50, {
    color: PAL.gold, font: '11px ui-monospace, monospace',
  });

  // HP / MP.
  const barX = 262;
  const barW = 236;
  bar(ctx, rect(barX, y + 12, barW, 14), player.hp / player.stats.maxHp, PAL.hp, PAL.hpDark,
      `${Math.ceil(player.hp)} / ${player.stats.maxHp}`);
  bar(ctx, rect(barX, y + 34, barW, 14), player.mp / player.stats.maxMp, PAL.mp, PAL.mpDark,
      `${Math.ceil(player.mp)} / ${player.stats.maxMp}`);
  text(ctx, 'HP', barX - 24, y + 23, { color: PAL.hp, font: '700 11px ui-monospace, monospace' });
  text(ctx, 'MP', barX - 24, y + 45, { color: PAL.mp, font: '700 11px ui-monospace, monospace' });

  // EXP runs full width along the very bottom edge, clear of everything else.
  const stripY = VIEW_H - EXP_STRIP;
  const frac = player.expFraction();
  ctx.fillStyle = PAL.expDark;
  ctx.fillRect(0, stripY, VIEW_W, EXP_STRIP);
  if (frac > 0) {
    const grad = ctx.createLinearGradient(0, stripY, 0, VIEW_H);
    grad.addColorStop(0, shade(PAL.exp, 0.3));
    grad.addColorStop(1, shade(PAL.exp, -0.25));
    ctx.fillStyle = grad;
    ctx.fillRect(0, stripY, VIEW_W * frac, EXP_STRIP);
  }
  const expLabel = player.level >= MAX_LEVEL
    ? 'MAX LEVEL'
    : `EXP  ${player.exp.toLocaleString()} / ${player.expToNextLevel().toLocaleString()}   ${(frac * 100).toFixed(2)}%`;
  ctx.font = '600 10px ui-monospace, monospace';
  ctx.textAlign = 'center';
  outlinedText(ctx, expLabel, VIEW_W / 2, stripY + 10, '#ffffff', 'rgba(0,0,0,0.85)', 3);

  // Unspent points nag — a quiet pulse rather than a modal.
  if (player.ap > 0 || player.sp > 0) {
    const pulse = 0.6 + Math.sin(time * 4) * 0.4;
    const parts: string[] = [];
    if (player.ap > 0) parts.push(`${player.ap} AP`);
    if (player.sp > 0) parts.push(`${player.sp} SP`);
    ctx.save();
    ctx.globalAlpha = pulse;
    text(ctx, `${parts.join('  ')} unspent`, 604, y + 30, {
      color: PAL.gold, font: '700 12px ui-monospace, monospace', align: 'center',
    });
    text(ctx, 'press A / S to spend', 604, y + 46, {
      color: PAL.textDim, font: '10px ui-monospace, monospace', align: 'center',
    });
    ctx.restore();
  }
}

/* --------------------------------------------------------- quick slots -- */

function drawQuickSlots(
  ctx: CanvasRenderingContext2D, ui: UiInput, player: Player, state: HudState,
): void {
  const y = VIEW_H - HUD_HEIGHT + 10;
  const startX = VIEW_W - 8 - 8 * 38;

  for (let i = 0; i < 8; i++) {
    const r = rect(startX + i * 38, y, 34, 36);
    const skillId = state.quickSlots[i];
    const hovered = hit(r, ui.mx, ui.my);

    ctx.fillStyle = hovered ? PAL.panelLight : 'rgba(20,26,43,0.9)';
    roundRect(ctx, r.x, r.y, r.w, r.h, 4);
    ctx.fill();
    ctx.strokeStyle = PAL.border;
    ctx.lineWidth = 1;
    roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 4);
    ctx.stroke();

    text(ctx, String(i + 1), r.x + 4, r.y + 11, {
      color: PAL.textFaint, font: '9px ui-monospace, monospace',
    });

    if (!skillId) continue;
    const lv = player.skillLevelOf(skillId);
    const def = player.availableSkills().find((s) => s.id === skillId);
    if (!def) continue;

    text(ctx, def.icon.glyph, r.x + r.w / 2, r.y + 24, {
      color: lv > 0 ? def.icon.color : PAL.textFaint,
      font: '700 16px ui-monospace, monospace', align: 'center',
    });
    text(ctx, String(lv), r.x + r.w - 4, r.y + r.h - 4, {
      color: PAL.textDim, font: '9px ui-monospace, monospace', align: 'right',
    });

    // Cooldown sweep.
    const cd = player.skillCooldowns.get(skillId);
    if (cd !== undefined) {
      const total = (def.levels[Math.max(0, lv - 1)]?.cooldown ?? 1000) / 1000;
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, (r.h - 2) * Math.min(1, cd / total));
    }
  }
}

/* -------------------------------------------------------------- buffs -- */

function drawBuffs(ctx: CanvasRenderingContext2D, ui: UiInput, player: Player): void {
  let x = VIEW_W - 40;
  const y = 12;
  for (const buff of player.buffs) {
    const r = rect(x, y, 30, 30);
    ctx.fillStyle = 'rgba(20,26,43,0.9)';
    roundRect(ctx, r.x, r.y, r.w, r.h, 5);
    ctx.fill();
    ctx.strokeStyle = rgba(buff.icon.color, 0.8);
    ctx.lineWidth = 1.4;
    roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 5);
    ctx.stroke();

    text(ctx, buff.icon.glyph, r.x + 15, r.y + 21, {
      color: buff.icon.color, font: '700 15px ui-monospace, monospace', align: 'center',
    });

    // Remaining-time drain from the bottom.
    const frac = buff.durationSec > 0 ? buff.remaining / buff.durationSec : 1;
    ctx.fillStyle = rgba(buff.icon.color, 0.75);
    ctx.fillRect(r.x + 2, r.y + r.h - 3, (r.w - 4) * Math.max(0, frac), 2);

    if (hit(r, ui.mx, ui.my)) {
      tooltip(ctx, ui.mx, ui.my, [
        { text: buff.name, color: buff.icon.color, font: '700 12px ui-monospace, monospace' },
        { text: `${Math.ceil(buff.remaining)}s remaining`, color: PAL.textDim },
      ], VIEW_W, VIEW_H);
    }
    x -= 34;
  }
}

/* ------------------------------------------------------------ minimap -- */

const MINIMAP_W = 208;
const MINIMAP_H = 132;

function drawMinimap(ctx: CanvasRenderingContext2D, world: World, player: Player): void {
  const map = world.map;
  const r = rect(12, 12, MINIMAP_W, MINIMAP_H);

  ctx.fillStyle = 'rgba(10,14,23,0.82)';
  roundRect(ctx, r.x, r.y, r.w, r.h, 6);
  ctx.fill();
  ctx.strokeStyle = rgba(PAL.borderLit, 0.7);
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 6);
  ctx.stroke();

  text(ctx, map.name, r.x + 9, r.y + 16, {
    color: PAL.text, font: '700 11px ui-monospace, monospace',
  });
  text(ctx, `Lv.${map.levelRange[0]}-${map.levelRange[1]}`, r.x + r.w - 9, r.y + 16, {
    color: PAL.textDim, font: '10px ui-monospace, monospace', align: 'right',
  });

  const pad = 8;
  const inner = rect(r.x + pad, r.y + 24, r.w - pad * 2, r.h - 32);
  const mw = map.bounds.right - map.bounds.left;
  const mh = map.bounds.bottom - map.bounds.top;
  const scale = Math.min(inner.w / mw, inner.h / mh);
  const offX = inner.x + (inner.w - mw * scale) / 2;
  const offY = inner.y + (inner.h - mh * scale) / 2;
  const px = (wx: number) => offX + (wx - map.bounds.left) * scale;
  const py = (wy: number) => offY + (wy - map.bounds.top) * scale;

  // Platforms.
  ctx.strokeStyle = rgba(PAL.textDim, 0.75);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const fh of map.footholds.floors) {
    ctx.moveTo(px(fhLeft(fh)), py(fh.x1 <= fh.x2 ? fh.y1 : fh.y2));
    ctx.lineTo(px(fhRight(fh)), py(fh.x1 <= fh.x2 ? fh.y2 : fh.y1));
  }
  ctx.stroke();

  // Ladders.
  ctx.strokeStyle = rgba(PAL.wood, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const l of map.ladders) {
    ctx.moveTo(px(l.x), py(l.y1));
    ctx.lineTo(px(l.x), py(l.y2));
  }
  ctx.stroke();

  // Portals.
  for (const p of map.portals) {
    if (p.type === 'spawn' || p.type === 'hidden') continue;
    ctx.fillStyle = p.type === 'scripted' ? PAL.gold : PAL.exp;
    ctx.beginPath();
    ctx.arc(px(p.x), py(p.y) - 2, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // NPCs.
  ctx.fillStyle = '#7fd8e8';
  for (const npc of map.npcs) {
    ctx.beginPath();
    ctx.arc(px(npc.x), py(npc.y) - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Monsters.
  ctx.fillStyle = rgba(PAL.hp, 0.8);
  for (const mob of world.livingMobs()) {
    if (!mob.alive) continue;
    ctx.fillRect(px(mob.body.x) - 1, py(mob.body.y) - 3, 2, 2);
  }

  // Player.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px(player.body.x), py(player.body.y) - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/* ---------------------------------------------------------------- log -- */

const LOG_LINES = 6;

function drawLog(ctx: CanvasRenderingContext2D, log: LogLine[]): void {
  const visible = log.slice(-LOG_LINES);
  const baseY = VIEW_H - HUD_HEIGHT - 16;
  ctx.textAlign = 'left';
  visible.forEach((line, i) => {
    const y = baseY - (visible.length - 1 - i) * 15;
    const fade = Math.min(1, line.life / 1.2);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.font = '11px ui-monospace, monospace';
    outlinedText(ctx, line.text, 14, y, line.color, 'rgba(0,0,0,0.85)', 3);
    ctx.restore();
  });
}

/* -------------------------------------------------------------- death -- */

export function drawDeathOverlay(
  ctx: CanvasRenderingContext2D, ui: UiInput, player: Player,
): { revive: boolean; town: boolean } {
  ctx.fillStyle = 'rgba(20,4,8,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const w = 340;
  const h = 176;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2 - 30;

  ctx.fillStyle = PAL.panel;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = PAL.hp;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 10);
  ctx.stroke();

  text(ctx, 'YOU DIED', x + w / 2, y + 44, {
    color: PAL.hp, font: '700 24px ui-monospace, monospace', align: 'center',
  });
  text(ctx, 'Revive here, or return to town.', x + w / 2, y + 70, {
    color: PAL.textDim, font: '12px ui-monospace, monospace', align: 'center',
  });

  // A short delay stops a panicked keypress from skipping the moment.
  const ready = player.deadTime > 0.9;
  const bw = 130;
  const revive = buttonLike(ctx, ui, rect(x + 24, y + 100, bw, 34), 'Revive Here', !ready);
  const town = buttonLike(ctx, ui, rect(x + w - 24 - bw, y + 100, bw, 34), 'Return to Town', !ready);

  return { revive, town };
}

function buttonLike(
  ctx: CanvasRenderingContext2D, ui: UiInput, r: ReturnType<typeof rect>,
  label: string, disabled: boolean,
): boolean {
  const hovered = !disabled && hit(r, ui.mx, ui.my);
  ctx.fillStyle = disabled ? rgba(PAL.panelLight, 0.4) : hovered ? shade(PAL.panelLight, 0.2) : PAL.panelLight;
  roundRect(ctx, r.x, r.y, r.w, r.h, 6);
  ctx.fill();
  ctx.strokeStyle = disabled ? rgba(PAL.border, 0.5) : PAL.borderLit;
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 6);
  ctx.stroke();
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 4, {
    color: disabled ? rgba(PAL.textDim, 0.5) : PAL.text,
    font: '600 12px ui-monospace, monospace', align: 'center',
  });
  if (hovered && ui.clicked) {
    ui.consume();
    return true;
  }
  return false;
}

/* ------------------------------------------------------- level up flash -- */

export function drawLevelUp(ctx: CanvasRenderingContext2D, player: Player, t: number): void {
  if (t <= 0) return;
  const alpha = Math.min(1, t * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  const y = VIEW_H * 0.32 - (1 - t) * 30;
  ctx.font = '700 34px ui-monospace, monospace';
  ctx.textAlign = 'center';
  outlinedText(ctx, 'LEVEL UP', VIEW_W / 2, y, PAL.gold, 'rgba(0,0,0,0.9)', 6);
  ctx.font = '700 16px ui-monospace, monospace';
  outlinedText(ctx, `Level ${player.level}`, VIEW_W / 2, y + 26, '#ffffff', 'rgba(0,0,0,0.9)', 4);
  ctx.restore();
}

/* --------------------------------------------------------- pickup toast -- */

export function drawPickupToast(
  ctx: CanvasRenderingContext2D, entries: { itemId: string; qty: number; life: number }[],
): void {
  let y = VIEW_H - HUD_HEIGHT - 120;
  for (const e of entries.slice(-4)) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, e.life);
    const def = getItem(e.itemId);
    drawItemIcon(ctx, def.icon, VIEW_W - 148, y, 20);
    text(ctx, e.qty > 1 ? `${def.name} x${e.qty}` : def.name, VIEW_W - 132, y + 4, {
      color: PAL.text, font: '11px ui-monospace, monospace',
    });
    ctx.restore();
    y -= 24;
  }
}

/** Walls are not drawn on the minimap; exported for the world map screen. */
export { isWall, fhTop };
