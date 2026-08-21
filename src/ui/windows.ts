/**
 * Inventory, equipment, stats, skills, and quest windows.
 *
 * Every window is redrawn from game state each frame and reports interaction
 * through UiHooks — see src/ui/state.ts.
 */
import { VIEW_H, VIEW_W } from '../engine/renderer';
import { PAL, rgba } from '../art/palette';
import { roundRect } from '../engine/renderer';
import { button, closeButton, hit, panel, rect, Rect, text, tinyButton, tooltip, UiInput, wrapText } from './imgui';
import type { UiHooks, UiState } from './state';
import type { Player } from '../game/player';
import type { QuestLog } from '../game/quests';
import { EQUIPPED_SLOTS, EquipInstance, EquippedSlot, instanceName } from '../game/equipment';
import { ItemTab, getItem, sellPrice } from '../data/items';
import { drawItemIcon } from '../art/itemicons';
import { TABS } from '../game/inventory';
import { getJob } from '../data/jobs';
import { getMob } from '../data/mobs';
import { getQuest } from '../data/quests';
import type { StatBlock } from '../game/stats';
import { skillLevel } from '../data/skills';

const SLOT = 38;
const SLOT_GAP = 4;
const COLS = 6;

/* ------------------------------------------------------------ inventory -- */

export function drawInventory(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState, player: Player, hooks: UiHooks,
): void {
  const w = COLS * (SLOT + SLOT_GAP) + 28;
  const rows = Math.ceil(player.inventory.capacityOf(state.invTab) / COLS);
  const h = 32 + 34 + rows * (SLOT + SLOT_GAP) + 62;
  const r = rect(VIEW_W - w - 20, 96, w, h);

  panel(ctx, r, 'Inventory');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('inventory');
    return;
  }

  // Tabs.
  const tabW = (r.w - 24) / TABS.length;
  TABS.forEach((tab, i) => {
    const tr = rect(r.x + 12 + i * tabW, r.y + 38, tabW - 3, 22);
    const active = state.invTab === tab;
    const hovered = hit(tr, ui.mx, ui.my);
    ctx.fillStyle = active ? PAL.panelLight : hovered ? rgba(PAL.panelLight, 0.6) : 'rgba(20,26,43,0.7)';
    roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 4);
    ctx.fill();
    if (active) {
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(tr.x + 4, tr.y + tr.h - 2, tr.w - 8, 2);
    }
    text(ctx, tab.toUpperCase(), tr.x + tr.w / 2, tr.y + 15, {
      color: active ? PAL.text : PAL.textDim,
      font: '600 10px ui-monospace, monospace', align: 'center',
    });
    if (hovered && ui.clicked) {
      ui.consume();
      state.invTab = tab;
      state.invSelected = -1;
    }
  });

  // Slots.
  const slots = player.inventory.tabs[state.invTab];
  const gridY = r.y + 68;
  let hovering: TooltipLine[] | null = null;

  slots.forEach((slot, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const sr = rect(r.x + 14 + col * (SLOT + SLOT_GAP), gridY + row * (SLOT + SLOT_GAP), SLOT, SLOT);
    const hovered = hit(sr, ui.mx, ui.my);
    const selected = state.invSelected === i;

    ctx.fillStyle = selected ? '#2f4b6b' : hovered ? PAL.panelLight : 'rgba(15,20,34,0.85)';
    roundRect(ctx, sr.x, sr.y, sr.w, sr.h, 4);
    ctx.fill();
    ctx.strokeStyle = selected ? PAL.gold : PAL.border;
    ctx.lineWidth = selected ? 1.6 : 1;
    roundRect(ctx, sr.x + 0.5, sr.y + 0.5, sr.w - 1, sr.h - 1, 4);
    ctx.stroke();

    if (slot) {
      const itemId = slot.kind === 'equip' ? slot.inst.itemId : slot.itemId;
      const def = getItem(itemId);
      drawItemIcon(ctx, def.icon, sr.x + SLOT / 2, sr.y + SLOT / 2, 26);
      if (slot.kind === 'stack' && slot.qty > 1) {
        text(ctx, String(slot.qty), sr.x + SLOT - 3, sr.y + SLOT - 3, {
          color: '#ffffff', font: '700 10px ui-monospace, monospace', align: 'right',
        });
      }
      if (slot.kind === 'equip' && slot.inst.upgrades > 0) {
        text(ctx, `+${slot.inst.upgrades}`, sr.x + 3, sr.y + 11, {
          color: PAL.gold, font: '700 9px ui-monospace, monospace',
        });
      }
      if (hovered) hovering = itemTooltip(slot.kind === 'equip' ? slot.inst : itemId, player);
    }

    if (hovered && ui.clicked) {
      ui.consume();
      state.invSelected = i;
    }
    if (hovered && ui.doubleClicked && slot) {
      ui.consume();
      if (state.invTab === 'equip') hooks.equipItem(i);
      else hooks.useItem(state.invTab, i);
    }
  });

  // Footer.
  const footY = gridY + rows * (SLOT + SLOT_GAP) + 8;
  const sel = state.invSelected >= 0 ? slots[state.invSelected] : null;
  const bw = (r.w - 34) / 3;

  const primaryLabel = state.invTab === 'equip' ? 'Equip' : 'Use';
  if (button(ctx, ui, rect(r.x + 14, footY, bw, 24), primaryLabel, { disabled: !sel })) {
    if (state.invTab === 'equip') hooks.equipItem(state.invSelected);
    else hooks.useItem(state.invTab, state.invSelected);
  }
  if (button(ctx, ui, rect(r.x + 19 + bw, footY, bw, 24), 'Drop', { disabled: !sel, tone: 'danger' })) {
    hooks.dropItem(state.invTab, state.invSelected);
    state.invSelected = -1;
  }
  if (button(ctx, ui, rect(r.x + 24 + bw * 2, footY, bw, 24), 'Sort')) {
    hooks.sortTab(state.invTab);
    state.invSelected = -1;
  }

  text(ctx, `${player.inventory.mesos.toLocaleString()} mesos`, r.x + 14, footY + 44, {
    color: PAL.gold, font: '600 12px ui-monospace, monospace',
  });
  text(
    ctx,
    `${player.inventory.capacityOf(state.invTab) - player.inventory.freeSlots(state.invTab)}/${player.inventory.capacityOf(state.invTab)}`,
    r.x + r.w - 14, footY + 44,
    { color: PAL.textDim, font: '11px ui-monospace, monospace', align: 'right' },
  );

  if (hovering) tooltip(ctx, ui.mx, ui.my, hovering, VIEW_W, VIEW_H);
}

export interface TooltipLine {
  text: string;
  color?: string;
  font?: string;
}

/** Tooltip lines for an item id or a specific equipment instance. */
function itemTooltip(target: string | EquipInstance, player: Player): TooltipLine[] {
  const isInstance = typeof target !== 'string';
  const itemId = isInstance ? target.itemId : target;
  const def = getItem(itemId);
  const lines: TooltipLine[] = [];

  lines.push({
    text: isInstance ? instanceName(target) : def.name,
    color: isInstance && target.upgrades > 0 ? PAL.gold : PAL.text,
    font: '700 13px ui-monospace, monospace',
  });

  if (def.equip) {
    const wearable = player.canWear(itemId);
    lines.push({
      text: `${def.equip.slot.toUpperCase()}   Lv.${def.equip.reqLevel}`,
      color: wearable ? PAL.textDim : PAL.hp,
    });
    const reqs: string[] = [];
    if (def.equip.reqStr) reqs.push(`STR ${def.equip.reqStr}`);
    if (def.equip.reqDex) reqs.push(`DEX ${def.equip.reqDex}`);
    if (def.equip.reqInt) reqs.push(`INT ${def.equip.reqInt}`);
    if (def.equip.reqLuk) reqs.push(`LUK ${def.equip.reqLuk}`);
    if (def.equip.reqBranch) reqs.push(def.equip.reqBranch.join('/'));
    if (reqs.length) lines.push({ text: reqs.join('  '), color: wearable ? PAL.textDim : PAL.hp });

    const stats: Partial<StatBlock> = isInstance ? target.stats : def.equip.base;
    for (const [key, value] of Object.entries(stats) as [string, number][]) {
      if (!value) continue;
      const shown = value % 1 !== 0 ? value.toFixed(2) : String(value);
      lines.push({
        text: `${statLabel(key)} ${value > 0 ? '+' : ''}${shown}`,
        color: value > 0 ? PAL.exp : PAL.hp,
      });
    }
    if (isInstance) {
      lines.push({
        text: `Upgrades available: ${target.slotsTotal - target.slotsUsed}`,
        color: PAL.textDim,
      });
    }
  }

  if (def.use) {
    if (def.use.hp) lines.push({ text: `Restores ${def.use.hp} HP`, color: PAL.hp });
    if (def.use.mp) lines.push({ text: `Restores ${def.use.mp} MP`, color: PAL.mp });
    if (def.use.hpPercent) lines.push({ text: `Restores ${def.use.hpPercent * 100}% HP`, color: PAL.hp });
    if (def.use.mpPercent) lines.push({ text: `Restores ${def.use.mpPercent * 100}% MP`, color: PAL.mp });
    if (def.use.townScroll) lines.push({ text: 'Returns you to town', color: PAL.exp });
    if (def.use.scroll) {
      lines.push({
        text: `${Math.round(def.use.scroll.successRate * 100)}% success`,
        color: PAL.gold,
      });
    }
  }

  lines.push({ text: def.desc, color: PAL.textFaint, font: 'italic 11px ui-monospace, monospace' });
  lines.push({ text: `Sells for ${sellPrice(def).toLocaleString()} mesos`, color: PAL.textFaint });
  return lines;
}

const STAT_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK',
  hp: 'MaxHP', mp: 'MaxMP', watk: 'W.Atk', matk: 'M.Atk',
  wdef: 'W.Def', mdef: 'M.Def', acc: 'Accuracy', avoid: 'Avoid',
  speed: 'Speed', jump: 'Jump', critRate: 'Crit Rate',
  critDamage: 'Crit Dmg', ignoreDef: 'Ignore Def', bossDamage: 'Boss Dmg',
};

function statLabel(key: string): string {
  return STAT_LABELS[key] ?? key;
}

/* ------------------------------------------------------------ equipment -- */

/** Where each slot sits in the paper-doll layout, in grid cells. */
const DOLL_LAYOUT: [EquippedSlot, number, number][] = [
  ['hat', 1, 0], ['face', 1, 1], ['eye', 0, 1], ['earring', 2, 1],
  ['top', 1, 2], ['overall', 0, 2], ['bottom', 1, 3],
  ['shoes', 1, 4], ['gloves', 0, 3], ['cape', 2, 2],
  ['weapon', 0, 0], ['shield', 2, 0], ['pendant', 2, 3],
  ['belt', 2, 4], ['medal', 0, 4],
  ['ring1', 3, 0], ['ring2', 3, 1], ['ring3', 3, 2], ['ring4', 3, 3],
];

export function drawEquipment(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState, player: Player, hooks: UiHooks,
): void {
  const w = 4 * (SLOT + SLOT_GAP) + 28;
  const h = 5 * (SLOT + SLOT_GAP) + 74;
  const r = rect(VIEW_W - w - 20 - 280, 96, w, h);

  panel(ctx, r, 'Equipment');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('equip');
    return;
  }

  let hovering: TooltipLine[] | null = null;

  for (const [slot, col, row] of DOLL_LAYOUT) {
    const sr = rect(r.x + 14 + col * (SLOT + SLOT_GAP), r.y + 44 + row * (SLOT + SLOT_GAP), SLOT, SLOT);
    const inst = player.inventory.equipped[slot];
    const hovered = hit(sr, ui.mx, ui.my);

    ctx.fillStyle = hovered ? PAL.panelLight : 'rgba(15,20,34,0.85)';
    roundRect(ctx, sr.x, sr.y, sr.w, sr.h, 4);
    ctx.fill();
    ctx.strokeStyle = inst ? PAL.borderLit : rgba(PAL.border, 0.7);
    ctx.lineWidth = 1;
    roundRect(ctx, sr.x + 0.5, sr.y + 0.5, sr.w - 1, sr.h - 1, 4);
    ctx.stroke();

    if (inst) {
      drawItemIcon(ctx, getItem(inst.itemId).icon, sr.x + SLOT / 2, sr.y + SLOT / 2, 26);
      if (inst.upgrades > 0) {
        text(ctx, `+${inst.upgrades}`, sr.x + 3, sr.y + 11, {
          color: PAL.gold, font: '700 9px ui-monospace, monospace',
        });
      }
      if (hovered) hovering = itemTooltip(inst, player);
      if (hovered && (ui.clicked || ui.doubleClicked)) {
        ui.consume();
        hooks.unequipSlot(slot);
      }
    } else {
      text(ctx, slotGlyph(slot), sr.x + SLOT / 2, sr.y + SLOT / 2 + 4, {
        color: rgba(PAL.textFaint, 0.6), font: '11px ui-monospace, monospace', align: 'center',
      });
    }
  }

  text(ctx, 'Click an item to remove it.', r.x + 14, r.y + h - 14, {
    color: PAL.textFaint, font: '10px ui-monospace, monospace',
  });

  if (hovering) tooltip(ctx, ui.mx, ui.my, hovering, VIEW_W, VIEW_H);
}

function slotGlyph(slot: EquippedSlot): string {
  if (slot.startsWith('ring')) return 'ring';
  return slot;
}

/* ---------------------------------------------------------------- stats -- */

export function drawStats(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState, player: Player, hooks: UiHooks,
): void {
  const r = rect(20, 88, 268, 500);
  panel(ctx, r, 'Character');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('stats');
    return;
  }

  const job = getJob(player.jobId);
  let y = r.y + 54;
  text(ctx, player.name, r.x + 16, y, { color: PAL.text, font: '700 15px ui-monospace, monospace' });
  y += 17;
  text(ctx, `${job.name}   Level ${player.level}`, r.x + 16, y, {
    color: PAL.textDim, font: '11px ui-monospace, monospace',
  });
  y += 22;

  // Base stats with AP spending.
  const apLeft = player.ap;
  text(ctx, `Ability Points: ${apLeft}`, r.x + 16, y, {
    color: apLeft > 0 ? PAL.gold : PAL.textDim, font: '600 12px ui-monospace, monospace',
  });
  y += 14;

  for (const stat of ['str', 'dex', 'int', 'luk'] as const) {
    y += 22;
    const total = player.stats[stat];
    const base = player.base[stat];
    const bonus = total - base;
    text(ctx, stat.toUpperCase(), r.x + 18, y, {
      color: job.primary === stat ? PAL.gold : PAL.textDim,
      font: '700 12px ui-monospace, monospace',
    });
    text(
      ctx,
      bonus > 0 ? `${base} (+${bonus})` : String(base),
      r.x + 92, y,
      { color: PAL.text, font: '12px ui-monospace, monospace' },
    );
    if (tinyButton(ctx, ui, rect(r.x + r.w - 40, y - 12, 18, 16), '+', apLeft < 1)) {
      hooks.allocateAp(stat);
    }
  }

  y += 26;
  divider(ctx, r, y);
  y += 6;

  const rows: [string, string][] = [
    ['HP', `${Math.ceil(player.hp)} / ${player.stats.maxHp}`],
    ['MP', `${Math.ceil(player.mp)} / ${player.stats.maxMp}`],
    ['Attack', `${player.stats.watk}`],
    ['Magic', `${player.stats.matk}`],
    ['Defense', `${player.stats.wdef} / ${player.stats.mdef}`],
    ['Accuracy', `${player.stats.accuracy}`],
    ['Avoid', `${player.stats.avoid}`],
    ['Speed', `${player.stats.speed}%`],
    ['Jump', `${player.stats.jump}%`],
    ['Crit', `${(player.stats.critRate * 100).toFixed(0)}%  x${player.stats.critDamage.toFixed(2)}`],
    ['Kills', player.killCount.toLocaleString()],
    ['Fame', String(player.fame)],
  ];
  for (const [label, value] of rows) {
    y += 18;
    text(ctx, label, r.x + 18, y, { color: PAL.textDim, font: '11px ui-monospace, monospace' });
    text(ctx, value, r.x + r.w - 18, y, {
      color: PAL.text, font: '11px ui-monospace, monospace', align: 'right',
    });
  }

  // Job advancement prompt when eligible.
  const options = player.advancementOptions().filter((j) => player.canAdvanceTo(j.id).ok);
  if (options.length > 0) {
    y += 22;
    if (button(ctx, ui, rect(r.x + 16, y - 12, r.w - 32, 26), 'Job Advancement Available', { tone: 'primary' })) {
      state.open.add('advance');
    }
  }
}

function divider(ctx: CanvasRenderingContext2D, r: Rect, y: number): void {
  ctx.strokeStyle = rgba(PAL.border, 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r.x + 14, y + 0.5);
  ctx.lineTo(r.x + r.w - 14, y + 0.5);
  ctx.stroke();
}

/* --------------------------------------------------------------- skills -- */

export function drawSkills(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState, player: Player, hooks: UiHooks,
): void {
  const r = rect(300, 96, 340, 448);
  panel(ctx, r, 'Skills');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('skills');
    return;
  }

  text(ctx, `Skill Points: ${player.sp}`, r.x + 16, r.y + 52, {
    color: player.sp > 0 ? PAL.gold : PAL.textDim, font: '600 12px ui-monospace, monospace',
  });

  const skills = player.availableSkills();
  const listTop = r.y + 66;
  const listH = r.h - 66 - 96;
  const rowH = 40;
  const maxScroll = Math.max(0, skills.length * rowH - listH);
  const key = 'skills';
  if (hit(rect(r.x, listTop, r.w, listH), ui.mx, ui.my) && ui.wheel !== 0) {
    state.scroll[key] = Math.max(0, Math.min(maxScroll, (state.scroll[key] ?? 0) + ui.wheel));
  }
  const scroll = state.scroll[key] ?? 0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x + 8, listTop, r.w - 16, listH);
  ctx.clip();

  skills.forEach((def, i) => {
    const y = listTop + i * rowH - scroll;
    if (y + rowH < listTop || y > listTop + listH) return;
    const row = rect(r.x + 12, y, r.w - 24, rowH - 4);
    const lv = player.skillLevelOf(def.id);
    const selected = state.selectedSkill === def.id;
    const hovered = hit(row, ui.mx, ui.my);

    ctx.fillStyle = selected ? '#2f4b6b' : hovered ? PAL.panelLight : 'rgba(15,20,34,0.6)';
    roundRect(ctx, row.x, row.y, row.w, row.h, 4);
    ctx.fill();

    text(ctx, def.icon.glyph, row.x + 18, row.y + 24, {
      color: lv > 0 ? def.icon.color : rgba(def.icon.color, 0.35),
      font: '700 17px ui-monospace, monospace', align: 'center',
    });
    text(ctx, def.name, row.x + 36, row.y + 16, {
      color: lv > 0 ? PAL.text : PAL.textDim, font: '600 12px ui-monospace, monospace',
    });
    text(ctx, `${getJob(def.jobId).name} · ${def.type}`, row.x + 36, row.y + 29, {
      color: PAL.textFaint, font: '10px ui-monospace, monospace',
    });

    const cap = def.masterLevel ?? def.maxLevel;
    text(ctx, `${lv}/${cap}`, row.x + row.w - 44, row.y + 23, {
      color: lv >= cap ? PAL.gold : PAL.textDim,
      font: '11px ui-monospace, monospace', align: 'right',
    });

    if (tinyButton(ctx, ui, rect(row.x + row.w - 32, row.y + 8, 20, 20), '+', !player.canLearn(def.id))) {
      hooks.learnSkill(def.id);
    }
    if (hovered && ui.clicked) {
      ui.consume();
      state.selectedSkill = def.id;
    }
  });
  ctx.restore();

  // Detail panel for the selected skill.
  const detailY = listTop + listH + 8;
  divider(ctx, r, detailY - 6);
  const sel = state.selectedSkill ? skills.find((s) => s.id === state.selectedSkill) : null;
  if (!sel) {
    text(ctx, 'Select a skill to see its numbers.', r.x + 16, detailY + 16, {
      color: PAL.textFaint, font: '11px ui-monospace, monospace',
    });
    return;
  }

  const lv = player.skillLevelOf(sel.id);
  const stats = skillLevel(sel, Math.max(1, lv));
  wrapText(ctx, sel.desc, r.x + 16, detailY + 14, r.w - 32, 14, {
    color: PAL.textDim, font: '11px ui-monospace, monospace',
  });

  if (stats) {
    const parts: string[] = [];
    if (stats.mpCost) parts.push(`${stats.mpCost} MP`);
    if (stats.damage) parts.push(`${stats.damage}% dmg`);
    if (stats.attackCount && stats.attackCount > 1) parts.push(`x${stats.attackCount} hits`);
    if (stats.mobCount && stats.mobCount > 1) parts.push(`${stats.mobCount} targets`);
    if (stats.duration) parts.push(`${Math.round(stats.duration / 1000)}s`);
    if (stats.mastery) parts.push(`mastery ${Math.round(stats.mastery * 100)}%`);
    text(ctx, parts.join('   '), r.x + 16, detailY + 48, {
      color: lv > 0 ? PAL.gold : PAL.textFaint, font: '11px ui-monospace, monospace',
    });
  }

  // Quick-slot binding.
  text(ctx, 'Bind to quick slot:', r.x + 16, detailY + 70, {
    color: PAL.textDim, font: '10px ui-monospace, monospace',
  });
  for (let i = 0; i < 8; i++) {
    const br = rect(r.x + 122 + i * 24, detailY + 58, 20, 18);
    const bound = state.quickSlots[i] === sel.id;
    if (tinyButton(ctx, ui, br, String(i + 1), lv < 1 && !bound)) {
      hooks.bindQuickSlot(i, bound ? null : sel.id);
    }
    if (bound) {
      ctx.fillStyle = PAL.gold;
      ctx.fillRect(br.x + 3, br.y + br.h - 2, br.w - 6, 2);
    }
  }
}

/* --------------------------------------------------------------- quests -- */

export function drawQuests(
  ctx: CanvasRenderingContext2D, ui: UiInput, state: UiState,
  player: Player, quests: QuestLog, hooks: UiHooks,
): void {
  const r = rect(VIEW_W / 2 - 200, 96, 400, 400);
  panel(ctx, r, 'Quest Log');
  if (closeButton(ctx, ui, r)) {
    state.open.delete('quests');
    return;
  }

  const active = quests.activeQuests();
  text(ctx, `Active: ${active.length}    Completed: ${quests.completed.size}`, r.x + 16, r.y + 52, {
    color: PAL.textDim, font: '11px ui-monospace, monospace',
  });

  if (active.length === 0) {
    text(ctx, 'No active quests.', r.x + 16, r.y + 84, {
      color: PAL.textFaint, font: '12px ui-monospace, monospace',
    });
    text(ctx, 'Look for the ▾ marker above an NPC.', r.x + 16, r.y + 104, {
      color: PAL.textFaint, font: '11px ui-monospace, monospace',
    });
    return;
  }

  let y = r.y + 74;
  for (const def of active) {
    const ready = quests.stateOf(def.id, player, player.inventory) === 'ready';
    ctx.fillStyle = 'rgba(15,20,34,0.6)';
    const lines = quests.progressLines(def.id, player.inventory);
    const boxH = 42 + lines.length * 15;
    roundRect(ctx, r.x + 12, y - 14, r.w - 24, boxH, 5);
    ctx.fill();

    text(ctx, def.name, r.x + 22, y, {
      color: ready ? PAL.exp : PAL.text, font: '700 12px ui-monospace, monospace',
    });
    if (ready) {
      text(ctx, 'READY', r.x + r.w - 22, y, {
        color: PAL.exp, font: '700 10px ui-monospace, monospace', align: 'right',
      });
    }
    y += 15;
    text(ctx, def.summary, r.x + 22, y, {
      color: PAL.textFaint, font: 'italic 10px ui-monospace, monospace',
    });
    y += 6;

    for (const line of lines) {
      y += 15;
      const done = line.have >= line.need;
      text(ctx, `  ${objectiveLabel(line.label)}`, r.x + 22, y, {
        color: done ? PAL.exp : PAL.textDim, font: '11px ui-monospace, monospace',
      });
      text(ctx, `${Math.min(line.have, line.need)} / ${line.need}`, r.x + r.w - 22, y, {
        color: done ? PAL.exp : PAL.textDim, font: '11px ui-monospace, monospace', align: 'right',
      });
    }

    y += 22;
    if (button(ctx, ui, rect(r.x + r.w - 96, y - 14, 74, 20), 'Abandon', { tone: 'ghost' })) {
      hooks.abandonQuest(def.id);
    }
    y += 22;
  }
}

/** Objective ids are mob or item ids; show their display names. */
function objectiveLabel(id: string): string {
  try {
    return getMob(id).name;
  } catch {
    try {
      return getItem(id).name;
    } catch {
      return id;
    }
  }
}

/** Quest reward summary, shared by the dialogue window. */
export function rewardLines(questId: string): string[] {
  const q = getQuest(questId);
  const out: string[] = [];
  if (q.rewards.exp) out.push(`${q.rewards.exp.toLocaleString()} EXP`);
  if (q.rewards.meso) out.push(`${q.rewards.meso.toLocaleString()} mesos`);
  for (const item of q.rewards.items ?? []) {
    const def = getItem(item.id);
    out.push(item.qty > 1 ? `${def.name} x${item.qty}` : def.name);
  }
  if (q.rewards.sp) out.push(`${q.rewards.sp} SP`);
  if (q.rewards.fame) out.push(`${q.rewards.fame} fame`);
  return out;
}

export { EQUIPPED_SLOTS };
export type { ItemTab };
