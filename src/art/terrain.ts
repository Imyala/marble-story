/**
 * Terrain and background rendering.
 *
 * Footholds are abstract line segments; this module is what turns them into
 * something that looks like ground. Backgrounds are generated procedurally
 * from the map's seed so no image assets are needed.
 */
import { PAL, rgba, shade } from './palette';
import type { Camera } from '../engine/camera';
import { FootholdSet, Foothold, isWall } from '../physics/foothold';
import type { LadderRope } from '../physics/ladder';
import { VIEW_H, VIEW_W } from '../engine/renderer';

export type TerrainTheme = 'grass' | 'stone' | 'wood' | 'snow' | 'sand' | 'dark';

export interface ThemeColors {
  top: string;
  topLit: string;
  body: string;
  bodyDark: string;
}

export const THEMES: Record<TerrainTheme, ThemeColors> = {
  grass: { top: PAL.grass, topLit: shade(PAL.grass, 0.25), body: PAL.dirt, bodyDark: PAL.dirtDark },
  stone: { top: '#7b8598', topLit: '#98a2b4', body: PAL.stone, bodyDark: PAL.stoneDark },
  wood:  { top: '#a8763f', topLit: '#c08f52', body: PAL.wood, bodyDark: '#5e3f22' },
  snow:  { top: '#e8f0fa', topLit: '#ffffff', body: '#8fa2bd', bodyDark: '#5f7291' },
  sand:  { top: '#e3c37a', topLit: '#f2d894', body: '#b8945a', bodyDark: '#8a6d3f' },
  dark:  { top: '#4b4260', topLit: '#655a80', body: '#2e2840', bodyDark: '#1d1a2b' },
};

/** How far the solid ground extends below a foothold line. */
const GROUND_DEPTH = 300;
const CAP_HEIGHT = 7;

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  footholds: FootholdSet,
  cam: Camera,
  theme: TerrainTheme,
): void {
  const c = THEMES[theme];
  const ox = cam.offsetX();
  const oy = cam.offsetY();

  for (const fh of footholds.floors) {
    if (!segmentVisible(fh, cam)) continue;
    const x1 = fh.x1 + ox;
    const y1 = fh.y1 + oy;
    const x2 = fh.x2 + ox;
    const y2 = fh.y2 + oy;

    // Solid mass below the surface, fading out so a raised platform does not
    // end in a hard floating edge.
    const top = Math.min(y1, y2);
    const grad = ctx.createLinearGradient(0, top, 0, top + GROUND_DEPTH);
    grad.addColorStop(0, c.body);
    grad.addColorStop(0.68, c.body);
    grad.addColorStop(1, rgba(c.bodyDark, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 + GROUND_DEPTH);
    ctx.lineTo(x1, y1 + GROUND_DEPTH);
    ctx.closePath();
    ctx.fill();

    // Darker band under the cap gives the surface some depth.
    ctx.fillStyle = c.bodyDark;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + CAP_HEIGHT);
    ctx.lineTo(x2, y2 + CAP_HEIGHT);
    ctx.lineTo(x2, y2 + CAP_HEIGHT + 6);
    ctx.lineTo(x1, y1 + CAP_HEIGHT + 6);
    ctx.closePath();
    ctx.fill();

    // Surface cap.
    ctx.fillStyle = c.top;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 + CAP_HEIGHT);
    ctx.lineTo(x1, y1 + CAP_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Highlight along the very top edge.
    ctx.strokeStyle = c.topLit;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 1);
    ctx.lineTo(x2, y2 + 1);
    ctx.stroke();
  }

  // Walls read as stone edges so the player can see what is blocking them.
  ctx.fillStyle = rgba(c.bodyDark, 0.55);
  for (const fh of footholds.walls) {
    if (!segmentVisible(fh, cam)) continue;
    const x = fh.x1 + ox;
    const yTop = Math.min(fh.y1, fh.y2) + oy;
    const yBot = Math.max(fh.y1, fh.y2) + oy;
    ctx.fillRect(x - 3, yTop, 6, yBot - yTop);
  }
}

function segmentVisible(fh: Foothold, cam: Camera): boolean {
  const left = Math.min(fh.x1, fh.x2);
  const right = Math.max(fh.x1, fh.x2);
  const top = Math.min(fh.y1, fh.y2);
  const bottom = Math.max(fh.y1, fh.y2) + (isWall(fh) ? 0 : GROUND_DEPTH);
  return (
    right > cam.x - 40 && left < cam.x + cam.viewW + 40 &&
    bottom > cam.y - 40 && top < cam.y + cam.viewH + 40
  );
}

export function drawLadders(
  ctx: CanvasRenderingContext2D,
  ladders: readonly LadderRope[],
  cam: Camera,
): void {
  const ox = cam.offsetX();
  const oy = cam.offsetY();
  for (const l of ladders) {
    const x = l.x + ox;
    const y1 = l.y1 + oy;
    const y2 = l.y2 + oy;
    if (x < -40 || x > VIEW_W + 40 || y2 < -40 || y1 > VIEW_H + 40) continue;

    if (l.isLadder) {
      ctx.strokeStyle = PAL.wood;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 8, y1); ctx.lineTo(x - 8, y2);
      ctx.moveTo(x + 8, y1); ctx.lineTo(x + 8, y2);
      ctx.stroke();
      ctx.strokeStyle = shade(PAL.wood, 0.2);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let y = y1 + 10; y < y2; y += 16) {
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
      }
      ctx.stroke();
    } else {
      // A rope drawn as a gentle zig-zag so it reads as twisted fibre.
      ctx.strokeStyle = PAL.rope;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      for (let y = y1; y < y2; y += 9) {
        ctx.lineTo(x + (Math.floor((y - y1) / 9) % 2 === 0 ? 2.2 : -2.2), y + 9);
      }
      ctx.stroke();
      ctx.fillStyle = shade(PAL.rope, -0.3);
      ctx.beginPath();
      ctx.arc(x, y1, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* --------------------------------------------------------- backgrounds -- */

export type BackdropKind = 'stars' | 'hills' | 'mountains' | 'forest' | 'skyline' | 'cave' | 'clouds';

export interface BackdropLayer {
  kind: BackdropKind;
  color: string;
  /** 0 = pinned to the camera, 1 = moves with the world. */
  parallax: number;
  /** World y of the layer's base line. */
  baseY: number;
  height: number;
}

export interface Backdrop {
  sky: [string, string];
  layers: BackdropLayer[];
}

/** Deterministic value noise so backgrounds are stable frame to frame. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, bd: Backdrop, cam: Camera): void {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, bd.sky[0]);
  grad.addColorStop(1, bd.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (const layer of bd.layers) {
    const ox = cam.offsetX(layer.parallax);
    const oy = cam.offsetY(layer.parallax);
    const baseY = layer.baseY + oy;
    if (baseY < -layer.height - 200 || baseY - layer.height > VIEW_H + 200) continue;
    drawLayer(ctx, layer, ox, baseY);
  }
}

function drawLayer(ctx: CanvasRenderingContext2D, layer: BackdropLayer, ox: number, baseY: number): void {
  ctx.fillStyle = layer.color;
  switch (layer.kind) {
    case 'stars': {
      // Stars are placed in a repeating world-space band.
      const span = 2400;
      const start = Math.floor(-ox / span) - 1;
      for (let tile = start; tile < start + 3; tile++) {
        for (let i = 0; i < 90; i++) {
          const sx = tile * span + hash(i * 3.7) * span + ox;
          const sy = baseY - hash(i * 9.1) * layer.height;
          if (sx < -10 || sx > VIEW_W + 10) continue;
          const r = hash(i * 5.3) * 1.3 + 0.4;
          ctx.globalAlpha = 0.35 + hash(i * 2.1) * 0.65;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'hills':
    case 'mountains': {
      const peaky = layer.kind === 'mountains';
      const step = peaky ? 180 : 120;
      const start = Math.floor((-ox - VIEW_W) / step) - 1;
      const end = start + Math.ceil((VIEW_W * 2) / step) + 3;
      ctx.beginPath();
      ctx.moveTo(start * step + ox, baseY + 400);
      for (let i = start; i <= end; i++) {
        const x = i * step + ox;
        const h = layer.height * (0.45 + hash(i * 1.37) * 0.55);
        if (peaky) {
          ctx.lineTo(x, baseY);
          ctx.lineTo(x + step * 0.5, baseY - h);
        } else {
          ctx.quadraticCurveTo(x + step * 0.5, baseY - h, x + step, baseY - h * 0.35);
        }
      }
      ctx.lineTo(end * step + ox, baseY + 400);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'forest': {
      const step = 74;
      const start = Math.floor(-ox / step) - 1;
      const end = start + Math.ceil(VIEW_W / step) + 2;
      for (let i = start; i <= end; i++) {
        const x = i * step + ox + hash(i * 7.7) * 26;
        const h = layer.height * (0.6 + hash(i * 3.3) * 0.4);
        const w = h * 0.42;
        ctx.beginPath();
        ctx.moveTo(x, baseY - h);
        ctx.lineTo(x + w, baseY);
        ctx.lineTo(x - w, baseY);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'skyline': {
      const step = 92;
      const start = Math.floor(-ox / step) - 1;
      const end = start + Math.ceil(VIEW_W / step) + 2;
      for (let i = start; i <= end; i++) {
        const x = i * step + ox;
        const h = layer.height * (0.35 + hash(i * 4.9) * 0.65);
        const w = step * (0.55 + hash(i * 8.2) * 0.3);
        ctx.fillRect(x, baseY - h, w, h);
        // Lit windows.
        ctx.fillStyle = rgba('#ffe9a8', 0.16);
        for (let wy = baseY - h + 12; wy < baseY - 8; wy += 16) {
          for (let wx = x + 7; wx < x + w - 7; wx += 15) {
            if (hash(wx * 0.7 + wy * 1.3) > 0.55) ctx.fillRect(wx, wy, 6, 8);
          }
        }
        ctx.fillStyle = layer.color;
      }
      break;
    }
    case 'cave': {
      const step = 130;
      const start = Math.floor(-ox / step) - 1;
      const end = start + Math.ceil(VIEW_W / step) + 2;
      ctx.beginPath();
      ctx.moveTo(start * step + ox, baseY - 400);
      for (let i = start; i <= end; i++) {
        const x = i * step + ox;
        ctx.lineTo(x, baseY - 400);
        ctx.lineTo(x + step * 0.5, baseY - 400 + layer.height * (0.4 + hash(i * 2.9) * 0.6));
      }
      ctx.lineTo(end * step + ox, baseY - 400);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'clouds': {
      const span = 620;
      const start = Math.floor(-ox / span) - 1;
      for (let tile = start; tile < start + 4; tile++) {
        for (let i = 0; i < 4; i++) {
          const cx = tile * span + hash(i * 11.3) * span + ox;
          const cy = baseY - hash(i * 5.9) * layer.height;
          if (cx < -180 || cx > VIEW_W + 180) continue;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 62, 20, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 40, cy + 6, 44, 15, 0, 0, Math.PI * 2);
          ctx.ellipse(cx - 38, cy + 8, 38, 13, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }
  }
}
