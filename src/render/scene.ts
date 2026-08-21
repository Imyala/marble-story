/**
 * World rendering.
 *
 * Draw order is back to front: backdrop, terrain, scenery, ladders, portals,
 * drops, NPCs, monsters, the player, then effects on top. Everything is culled
 * against the camera before it reaches the canvas.
 */
import { Camera } from '../engine/camera';
import { VIEW_H, VIEW_W, outlinedText } from '../engine/renderer';
import { PAL, rgba, shade } from '../art/palette';
import { drawBackdrop, drawLadders, drawTerrain } from '../art/terrain';
import { drawDecoration } from '../art/decor';
import { drawCharacter, CharacterLook, DEFAULT_LOOK } from '../art/character';
import { drawMob } from '../art/mobart';
import { drawItemIcon } from '../art/itemicons';
import type { World } from '../game/world';
import type { Player } from '../game/player';
import type { Portal } from '../game/types';
import { getItem } from '../data/items';
import { getNpc } from '../data/npcs';
import { INTERACT_RANGE } from '../game/world';

export interface SceneContext {
  ctx: CanvasRenderingContext2D;
  cam: Camera;
  world: World;
  player: Player;
  /** Seconds since start, for idle animation. */
  time: number;
  /** Interpolation alpha between physics ticks. */
  alpha: number;
}

export function drawScene(s: SceneContext): void {
  const { ctx, cam, world } = s;

  drawBackdrop(ctx, world.map.backdrop, cam);
  drawTerrain(ctx, world.map.footholds, cam, world.map.theme);
  drawScenery(s);
  drawLadders(ctx, world.map.ladders, cam);
  drawPortals(s);
  drawDrops(s);
  drawNpcs(s);
  drawMobs(s);
  drawPlayer(s);
  drawEffects(s);
  drawInteractionHint(s);
}

/* -------------------------------------------------------------- scenery -- */

function drawScenery(s: SceneContext): void {
  const { ctx, cam, world, time } = s;
  for (const d of world.map.decorations) {
    if (!cam.isVisible(d.x, d.y, 220)) continue;
    drawDecoration(ctx, d, cam.screenX(d.x), cam.screenY(d.y), time);
  }
}

/* -------------------------------------------------------------- portals -- */

function drawPortals(s: SceneContext): void {
  const { ctx, cam, world, time } = s;
  for (const p of world.map.portals) {
    if (p.type === 'spawn' || p.type === 'hidden') continue;
    if (!cam.isVisible(p.x, p.y, 120)) continue;
    const x = cam.screenX(p.x);
    const y = cam.screenY(p.y);
    const bob = Math.sin(time * 2.6 + p.x * 0.01) * 4;
    const locked = p.type === 'scripted';

    // A soft pillar of light marks the doorway.
    const grad = ctx.createLinearGradient(0, y - 96, 0, y);
    const tint = locked ? '#f2c14e' : '#8fd14f';
    grad.addColorStop(0, rgba(tint, 0));
    grad.addColorStop(1, rgba(tint, 0.32));
    ctx.fillStyle = grad;
    ctx.fillRect(x - 22, y - 96, 44, 96);

    ctx.fillStyle = rgba(tint, 0.85);
    ctx.beginPath();
    ctx.moveTo(x, y - 62 + bob);
    ctx.lineTo(x + 11, y - 46 + bob);
    ctx.lineTo(x + 4, y - 46 + bob);
    ctx.lineTo(x + 4, y - 34 + bob);
    ctx.lineTo(x - 4, y - 34 + bob);
    ctx.lineTo(x - 4, y - 46 + bob);
    ctx.lineTo(x - 11, y - 46 + bob);
    ctx.closePath();
    ctx.fill();
  }
}

/* ---------------------------------------------------------------- drops -- */

function drawDrops(s: SceneContext): void {
  const { ctx, cam, world, time } = s;
  for (const d of world.drops) {
    if (!cam.isVisible(d.x, d.y, 80)) continue;
    const x = cam.screenX(d.x);
    const bob = d.landed ? Math.sin(time * 3.4 + d.phase) * 2.4 : 0;
    const y = cam.screenY(d.y) - 12 + bob;

    // Drops blink out in their final seconds so nothing vanishes unannounced.
    const remaining = 120 - d.age;
    if (remaining < 8 && Math.floor(time * 6) % 2 === 0) continue;

    if (d.landed) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x, cam.screenY(d.y), 10, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (d.kind === 'meso') {
      drawItemIcon(ctx, { shape: 'coin', color: PAL.gold, accent: '#fff0c2' }, x, y, mesoSize(d.qty));
    } else {
      drawItemIcon(ctx, getItem(d.itemId).icon, x, y, 24);
    }
  }
}

/** Bigger piles of mesos read as bigger coins. */
function mesoSize(qty: number): number {
  if (qty >= 1000) return 26;
  if (qty >= 200) return 22;
  return 18;
}

/* ----------------------------------------------------------------- npcs -- */

function drawNpcs(s: SceneContext): void {
  const { ctx, cam, world, time, player } = s;
  for (const placement of world.map.npcs) {
    if (!cam.isVisible(placement.x, placement.y, 120)) continue;
    const def = getNpc(placement.npcId);
    const x = cam.screenX(placement.x);
    const y = cam.screenY(placement.y);
    const look: CharacterLook = { ...DEFAULT_LOOK, ...def.look };

    drawCharacter(ctx, x, y, look, {
      state: 'stand',
      facing: placement.facing ?? 1,
      animTime: time + placement.x * 0.01,
      attack: null,
      flash: 0,
      alpha: 1,
    });

    ctx.font = '600 12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    outlinedText(ctx, def.name, x, y + 16, '#ffe9a8');
    ctx.font = '11px ui-monospace, monospace';
    outlinedText(ctx, def.title, x, y + 29, PAL.textDim);

    // A marker when this NPC has something for the player right now.
    const near = Math.abs(placement.x - player.body.x) < INTERACT_RANGE * 2;
    if (near) {
      const bob = Math.sin(time * 4) * 3;
      ctx.font = '700 20px ui-monospace, monospace';
      outlinedText(ctx, '▾', x, y - 84 + bob, '#8fd14f');
    }
  }
}

/* --------------------------------------------------------------- mobs -- */

function drawMobs(s: SceneContext): void {
  const { ctx, cam, world } = s;
  for (const mob of world.livingMobs()) {
    const bx = interp(mob.body.px, mob.body.x, s.alpha);
    const by = interp(mob.body.py, mob.body.y, s.alpha);
    if (!cam.isVisible(bx, by, 160)) continue;
    const x = cam.screenX(bx);
    const y = cam.screenY(by);

    drawMob(ctx, x, y, mob.def.art, {
      facing: mob.body.facing,
      animTime: mob.body.animTime + mob.id,
      moving: mob.state === 'move' || mob.state === 'chase',
      flash: mob.flash,
      alpha: mob.fade,
    });

    if (!mob.alive) continue;

    // HP bar only once damaged — an untouched map stays visually quiet.
    if (mob.hp < mob.def.maxHp) {
      drawMobHealth(ctx, x, cam.screenY(by) - mob.def.height - 16, mob.hp / mob.def.maxHp, mob.def.boss);
    }
    if (mob.def.boss) {
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      outlinedText(ctx, mob.def.name, x, cam.screenY(by) - mob.def.height - 24, '#ff8a3d');
    }
  }
}

function drawMobHealth(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, fraction: number, boss: boolean,
): void {
  const w = boss ? 90 : 42;
  const h = boss ? 7 : 5;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = PAL.hpDark;
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = boss ? '#ff8a3d' : PAL.hp;
  ctx.fillRect(x - w / 2, y, w * Math.max(0, fraction), h);
}

/* -------------------------------------------------------------- player -- */

function drawPlayer(s: SceneContext): void {
  const { ctx, cam, player } = s;
  const bx = interp(player.body.px, player.body.x, s.alpha);
  const by = interp(player.body.py, player.body.y, s.alpha);
  const x = cam.screenX(bx);
  const y = cam.screenY(by);

  // Flicker during invulnerability so the state is legible.
  const flicker = player.body.iframe > 0 && Math.floor(s.time * 18) % 2 === 0 ? 0.4 : 1;

  drawCharacter(ctx, x, y, player.look, {
    state: player.body.state,
    facing: player.body.facing,
    animTime: player.body.animTime,
    attack: player.attackAnim,
    flash: player.flash,
    alpha: player.dead ? 0.65 : flicker,
  });

  ctx.font = '600 12px ui-monospace, monospace';
  ctx.textAlign = 'center';
  outlinedText(ctx, player.name, x, y + 17, '#ffffff');
}

/* ------------------------------------------------------------- effects -- */

function drawEffects(s: SceneContext): void {
  const { ctx, cam, world } = s;
  const fx = world.effects;

  for (const p of fx.projectiles) {
    const x = cam.screenX(p.x);
    const y = cam.screenY(p.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.angle);
    switch (p.style) {
      case 'arrow':
        ctx.fillStyle = '#c9a35e';
        ctx.fillRect(-14, -1, 22, 2);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(12, 0); ctx.lineTo(4, -3.5); ctx.lineTo(4, 3.5);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        ctx.rotate(p.life * 40);
        ctx.fillStyle = p.color;
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(7, -2.4); ctx.lineTo(7, 2.4);
          ctx.closePath();
          ctx.fill();
        }
        break;
      case 'orb': {
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
        grad.addColorStop(0, rgba('#ffffff', 0.95));
        grad.addColorStop(0.4, rgba(p.color, 0.85));
        grad.addColorStop(1, rgba(p.color, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(-14, -14, 28, 28);
        break;
      }
      default:
        ctx.fillStyle = rgba(p.color, 0.9);
        ctx.fillRect(-16, -1.6, 24, 3.2);
        break;
    }
    ctx.restore();
  }

  for (const sp of fx.sparks) {
    const t = sp.life / sp.maxLife;
    const x = cam.screenX(sp.x);
    const y = cam.screenY(sp.y);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    const r = sp.size * (1.4 - t * 0.6);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + sp.maxLife;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.textAlign = 'center';
  for (const f of fx.floats) {
    if (f.delay > 0) continue;
    const t = f.life / f.maxLife;
    const x = cam.screenX(f.x);
    const y = cam.screenY(f.y);
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2.5);
    const style = FLOAT_STYLE[f.kind];
    ctx.font = `700 ${style.size}px ui-monospace, monospace`;
    // Damage numbers pop: they scale up briefly on spawn.
    const pop = 1 + Math.max(0, (t - 0.8) * 1.6);
    ctx.translate(x, y);
    ctx.scale(pop, pop);
    outlinedText(ctx, f.text, 0, 0, style.color, 'rgba(0,0,0,0.9)', 4);
    ctx.restore();
  }
}

const FLOAT_STYLE: Record<string, { color: string; size: number }> = {
  damage: { color: PAL.dmg, size: 19 },
  crit: { color: PAL.dmgCrit, size: 25 },
  taken: { color: PAL.dmgTaken, size: 19 },
  miss: { color: PAL.miss, size: 16 },
  heal: { color: PAL.heal, size: 17 },
  exp: { color: '#b3dcff', size: 13 },
  notice: { color: '#ffe9a8', size: 13 },
};

/* ---------------------------------------------------------------- hints -- */

/** Prompt shown when standing on a portal or next to an NPC. */
function drawInteractionHint(s: SceneContext): void {
  const { ctx, world, player } = s;
  if (player.dead) return;

  const portal = world.portalNear(player.body.x, player.body.y, false);
  const npc = world.npcNear(player.body.x, player.body.y);
  const label = portal
    ? portal.label ?? 'Enter'
    : npc
      ? `Talk to ${getNpc(npc.npcId).name}`
      : null;
  if (!label) return;

  const text = `▲  ${label}`;
  ctx.font = '600 13px ui-monospace, monospace';
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 26;
  const x = VIEW_W / 2;
  const y = VIEW_H - 132;

  ctx.fillStyle = 'rgba(10,14,23,0.82)';
  ctx.fillRect(x - w / 2, y - 17, w, 26);
  ctx.strokeStyle = rgba(PAL.borderLit, 0.9);
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 + 0.5, y - 16.5, w - 1, 25);
  outlinedText(ctx, text, x, y, PAL.text);
}

/** Portals the minimap should mark. */
export function visiblePortals(world: World): Portal[] {
  return world.map.portals.filter((p) => p.type !== 'spawn' && p.type !== 'hidden');
}

function interp(prev: number, next: number, alpha: number): number {
  return prev + (next - prev) * alpha;
}

/** Tint the whole view — used for the death overlay and map transitions. */
export function drawVignette(ctx: CanvasRenderingContext2D, color: string, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

export { shade };
