/**
 * Procedural item icons.
 *
 * One function draws every icon from a shape name and a colour, which means a
 * new item needs no art — just a shape that already exists, or a small case
 * added here.
 */
import { rgba, shade } from './palette';
import { roundedRect } from './character';
import type { IconShape, ItemIcon } from '../data/items';

/** Draw an icon centred on (x, y) at roughly `size` pixels. */
export function drawItemIcon(
  ctx: CanvasRenderingContext2D,
  icon: ItemIcon,
  x: number, y: number,
  size = 28,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 28, size / 28);
  const c = icon.color;
  const a = icon.accent ?? shade(c, 0.35);
  SHAPES[icon.shape](ctx, c, a);
  ctx.restore();
}

type IconFn = (ctx: CanvasRenderingContext2D, c: string, a: string) => void;

function glassHighlight(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.beginPath();
  ctx.ellipse(-3.5, -2, 1.6, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

const SHAPES: Record<IconShape, IconFn> = {
  potion: (ctx, c) => {
    ctx.fillStyle = '#5a6376';
    roundedRect(ctx, -3, -13, 6, 5, 1.5);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.quadraticCurveTo(-9, -2, -8, 5);
    ctx.quadraticCurveTo(-7, 12, 0, 12);
    ctx.quadraticCurveTo(7, 12, 8, 5);
    ctx.quadraticCurveTo(9, -2, 4, -9);
    ctx.closePath();
    ctx.fill();
    glassHighlight(ctx);
  },
  elixir: (ctx, c, a) => {
    ctx.fillStyle = '#8a5f38';
    roundedRect(ctx, -2.5, -14, 5, 5, 1.5);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-3, -10);
    ctx.lineTo(3, -10);
    ctx.lineTo(9, 9);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(a, 0.8);
    ctx.beginPath();
    ctx.arc(0, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    glassHighlight(ctx);
  },
  scroll: (ctx, c, a) => {
    ctx.fillStyle = c;
    roundedRect(ctx, -9, -11, 18, 22, 2);
    ctx.fillStyle = shade(c, -0.25);
    ctx.fillRect(-11, -12, 22, 3);
    ctx.fillRect(-11, 9, 22, 3);
    ctx.strokeStyle = a;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(-5, -5 + i * 4);
      ctx.lineTo(5, -5 + i * 4);
    }
    ctx.stroke();
  },
  shell: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = a;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let ang = 0; ang < Math.PI * 3; ang += 0.2) {
      const r = 1 + ang * 1.4;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (ang === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  },
  ore: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-10, 4); ctx.lineTo(-6, -8); ctx.lineTo(4, -10);
    ctx.lineTo(10, -1); ctx.lineTo(6, 9); ctx.lineTo(-5, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(a, 0.75);
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(3, -7); ctx.lineTo(1, 1);
    ctx.closePath();
    ctx.fill();
  },
  fang: (ctx, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-5, -11); ctx.lineTo(5, -9);
    ctx.quadraticCurveTo(4, 6, -1, 11);
    ctx.quadraticCurveTo(-5, 4, -5, -11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(-2, -8, 2, 12);
  },
  petal: (ctx, c, a) => {
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -6, 3.6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  },
  wing: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-9, -9);
    ctx.quadraticCurveTo(9, -12, 10, 4);
    ctx.quadraticCurveTo(2, 0, -4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = a;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -7); ctx.lineTo(6, 2);
    ctx.moveTo(-6, -3); ctx.lineTo(3, 4);
    ctx.stroke();
  },
  jelly: (ctx, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.quadraticCurveTo(-11, -9, 0, -9);
    ctx.quadraticCurveTo(11, -9, 10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.beginPath();
    ctx.ellipse(-3.5, -3, 2.4, 3.4, -0.4, 0, Math.PI * 2);
    ctx.fill();
  },
  cap: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 9, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-12, 1, 24, 3);
    ctx.fillStyle = rgba(a, 0.8);
    ctx.beginPath();
    ctx.arc(-5, -3, 2.4, 0, Math.PI * 2);
    ctx.arc(3, -5, 3, 0, Math.PI * 2);
    ctx.fill();
  },
  gem: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(9, -3); ctx.lineTo(5, 10);
    ctx.lineTo(-5, 10); ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(a, 0.7);
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(-9, -3); ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.fill();
  },
  coin: (ctx, c, a) => {
    ctx.fillStyle = shade(c, -0.25);
    ctx.beginPath();
    ctx.arc(0, 1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
  },
  sword: (ctx, c) => {
    ctx.fillStyle = '#4a3826';
    roundedRect(ctx, -1.8, 5, 3.6, 8, 1.6);
    ctx.fillStyle = shade(c, -0.3);
    roundedRect(ctx, -6, 3, 12, 2.6, 1.2);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-3, 3); ctx.lineTo(3, 3); ctx.lineTo(2, -10);
    ctx.lineTo(0, -13); ctx.lineTo(-2, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.45);
    ctx.fillRect(-0.7, -9, 1.2, 11);
  },
  greatsword: (ctx, c, a) => {
    ctx.fillStyle = '#4a3826';
    roundedRect(ctx, -2.2, 5, 4.4, 9, 1.8);
    ctx.fillStyle = a;
    roundedRect(ctx, -8, 2.4, 16, 3, 1.4);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-4.2, 2.4); ctx.lineTo(4.2, 2.4); ctx.lineTo(3, -11);
    ctx.lineTo(0, -14); ctx.lineTo(-3, -11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.4);
    ctx.fillRect(-1, -10, 1.8, 12);
  },
  axe: (ctx, c, a) => {
    ctx.fillStyle = a;
    roundedRect(ctx, -1.8, -12, 3.6, 25, 1.6);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(1, -12);
    ctx.quadraticCurveTo(13, -9, 10, 2);
    ctx.quadraticCurveTo(5, -2, 1, -2);
    ctx.closePath();
    ctx.fill();
  },
  spear: (ctx, c, a) => {
    ctx.fillStyle = a;
    roundedRect(ctx, -1.6, -6, 3.2, 20, 1.4);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(4, -5); ctx.lineTo(0, -3); ctx.lineTo(-4, -5);
    ctx.closePath();
    ctx.fill();
  },
  dagger: (ctx, c) => {
    ctx.fillStyle = '#4a3826';
    roundedRect(ctx, -1.6, 5, 3.2, 7, 1.4);
    ctx.fillStyle = shade(c, -0.3);
    roundedRect(ctx, -4.5, 3.4, 9, 2, 1);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-2.4, 3.4); ctx.lineTo(2.4, 3.4); ctx.lineTo(0, -11);
    ctx.closePath();
    ctx.fill();
  },
  bow: (ctx, c, a) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(3, 0, 11, Math.PI * 0.62, Math.PI * 1.38);
    ctx.stroke();
    ctx.strokeStyle = a;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3.5, -10); ctx.lineTo(-3.5, 10);
    ctx.stroke();
  },
  wand: (ctx, c, a) => {
    ctx.fillStyle = c;
    roundedRect(ctx, -1.6, -4, 3.2, 17, 1.4);
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(0, -8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.6);
    ctx.beginPath();
    ctx.arc(-1.6, -9.4, 1.6, 0, Math.PI * 2);
    ctx.fill();
  },
  staff: (ctx, c, a) => {
    ctx.fillStyle = shade(c, -0.2);
    roundedRect(ctx, -1.8, -5, 3.6, 19, 1.6);
    ctx.strokeStyle = a;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -9, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(0, -9, 2.4, 0, Math.PI * 2);
    ctx.fill();
  },
  knuckle: (ctx, c, a) => {
    ctx.fillStyle = c;
    roundedRect(ctx, -10, -5, 20, 9, 4);
    ctx.fillStyle = shade(a, -0.3);
    for (const hx of [-6, -1, 4]) {
      ctx.beginPath();
      ctx.arc(hx + 1.5, -1, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  gun: (ctx, c, a) => {
    ctx.fillStyle = c;
    roundedRect(ctx, -10, -5, 20, 5, 2);
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-2, 0); ctx.lineTo(-5, 10); ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
  },
  claw: (ctx, c, a) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    for (const off of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(off * 0.4, 8);
      ctx.lineTo(off, -8);
      ctx.stroke();
    }
    ctx.fillStyle = a;
    roundedRect(ctx, -8, 7, 16, 4, 2);
  },
  helm: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 1, 11, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-11, 0, 22, 6);
    ctx.fillStyle = shade(a, -0.2);
    ctx.fillRect(-11, 4, 22, 3);
    ctx.fillStyle = rgba('#000000', 0.35);
    ctx.fillRect(-5, -2, 10, 3);
  },
  armour: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(12, -5);
    ctx.lineTo(9, 11); ctx.lineTo(-9, 11); ctx.lineTo(-12, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(a, 0.6);
    ctx.fillRect(-2, -10, 4, 21);
  },
  pants: (ctx, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(8, 11);
    ctx.lineTo(2, 11); ctx.lineTo(0, -1); ctx.lineTo(-2, 11); ctx.lineTo(-8, 11);
    ctx.closePath();
    ctx.fill();
  },
  boots: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-7, -10); ctx.lineTo(1, -10); ctx.lineTo(2, 4);
    ctx.lineTo(10, 5); ctx.lineTo(10, 11); ctx.lineTo(-7, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(a, -0.35);
    ctx.fillRect(-7, 8, 17, 3);
  },
  glove: (ctx, c) => {
    ctx.fillStyle = c;
    roundedRect(ctx, -8, -6, 13, 15, 3);
    roundedRect(ctx, 4, -3, 6, 6, 3);
    ctx.fillStyle = shade(c, -0.3);
    ctx.fillRect(-8, 5, 13, 3);
  },
  cape: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-8, -11); ctx.lineTo(8, -11);
    ctx.quadraticCurveTo(12, 4, 6, 12);
    ctx.lineTo(-6, 12);
    ctx.quadraticCurveTo(-12, 4, -8, -11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = a;
    ctx.fillRect(-9, -12, 18, 3);
  },
  shield: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(10, -8); ctx.lineTo(9, 4);
    ctx.quadraticCurveTo(5, 11, 0, 13);
    ctx.quadraticCurveTo(-5, 11, -9, 4); ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(a, 0.75);
    ctx.fillRect(-1.6, -8, 3.2, 16);
    ctx.fillRect(-7, -2, 14, 3);
  },
  ring: (ctx, c, a) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 3, 7.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(0, -11); ctx.lineTo(4, -6); ctx.lineTo(0, -2); ctx.lineTo(-4, -6);
    ctx.closePath();
    ctx.fill();
  },
  pendant: (ctx, c, a) => {
    ctx.strokeStyle = shade(a, -0.2);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -3, 9, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, -2); ctx.lineTo(6, 4); ctx.lineTo(0, 12); ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();
  },
  crown: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-11, 8); ctx.lineTo(-11, -4); ctx.lineTo(-5, 2);
    ctx.lineTo(0, -9); ctx.lineTo(5, 2); ctx.lineTo(11, -4); ctx.lineTo(11, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(0, 4, 2.4, 0, Math.PI * 2);
    ctx.arc(-7, 4, 1.8, 0, Math.PI * 2);
    ctx.arc(7, 4, 1.8, 0, Math.PI * 2);
    ctx.fill();
  },
  heart: (ctx, c, a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.bezierCurveTo(-14, 1, -8, -11, 0, -4);
    ctx.bezierCurveTo(8, -11, 14, 1, 0, 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(a, 0.55);
    ctx.beginPath();
    ctx.ellipse(-4, -2, 2.6, 3.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
  },
};
