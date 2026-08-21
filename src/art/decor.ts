/**
 * Scenery. Non-colliding props that give a map somewhere to look.
 * Placement is map data; the drawing is here.
 */
import { PAL, rgba, shade } from './palette';
import { roundedRect } from './character';
import type { Decoration } from '../game/types';

export function drawDecoration(
  ctx: CanvasRenderingContext2D,
  d: Decoration,
  x: number, y: number,
  time: number,
): void {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const s = d.scale ?? 1;
  ctx.scale(s, s);
  DECOR[d.kind](ctx, d.color ?? '', time);
  ctx.restore();
}

type DecorFn = (ctx: CanvasRenderingContext2D, color: string, time: number) => void;

const DECOR: Record<Decoration['kind'], DecorFn> = {
  tree: (ctx, color, time) => {
    const sway = Math.sin(time * 0.7) * 2.5;
    ctx.fillStyle = '#6b4a33';
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.quadraticCurveTo(-5, -40, -4 + sway * 0.4, -66);
    ctx.lineTo(4 + sway * 0.4, -66);
    ctx.quadraticCurveTo(5, -40, 9, 0);
    ctx.closePath();
    ctx.fill();
    const leaf = color || '#4a7f4c';
    for (const [ox, oy, r] of [[0, -96, 34], [-26, -78, 24], [26, -78, 24], [-12, -108, 22], [14, -106, 20]] as const) {
      ctx.fillStyle = shade(leaf, oy < -100 ? 0.12 : 0);
      ctx.beginPath();
      ctx.arc(ox + sway, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  bush: (ctx, color) => {
    const c = color || '#3f6b3f';
    for (const [ox, oy, r] of [[-13, -8, 13], [0, -14, 17], [13, -8, 13]] as const) {
      ctx.fillStyle = shade(c, oy < -12 ? 0.1 : -0.05);
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  rock: (ctx, color) => {
    const c = color || PAL.stone;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(-14, -16); ctx.lineTo(-2, -22);
    ctx.lineTo(12, -17); ctx.lineTo(19, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(c, 0.16);
    ctx.beginPath();
    ctx.moveTo(-14, -16); ctx.lineTo(-2, -22); ctx.lineTo(-3, -12);
    ctx.closePath();
    ctx.fill();
  },

  flower: (ctx, color, time) => {
    const sway = Math.sin(time * 1.6) * 1.8;
    ctx.strokeStyle = '#4a7f4c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 0.5, -8, sway, -16);
    ctx.stroke();
    const c = color || '#e8935c';
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.translate(sway, -19);
      ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -4, 2.4, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = PAL.gold;
    ctx.beginPath();
    ctx.arc(sway, -19, 2.2, 0, Math.PI * 2);
    ctx.fill();
  },

  lamp: (ctx, _color, time) => {
    const flicker = 0.85 + Math.sin(time * 6) * 0.06 + Math.sin(time * 11.3) * 0.04;
    ctx.fillStyle = '#3c4354';
    roundedRect(ctx, -3, -54, 6, 54, 2);
    ctx.fillStyle = '#2b3140';
    roundedRect(ctx, -9, -2, 18, 4, 2);
    // Glow first, so the housing draws over it.
    const glow = ctx.createRadialGradient(0, -62, 2, 0, -62, 46);
    glow.addColorStop(0, rgba(PAL.gold, 0.42 * flicker));
    glow.addColorStop(1, rgba(PAL.gold, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-46, -108, 92, 92);
    ctx.fillStyle = rgba('#ffe9a8', flicker);
    ctx.beginPath();
    ctx.arc(0, -62, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c4354';
    ctx.beginPath();
    ctx.moveTo(-10, -68); ctx.lineTo(10, -68); ctx.lineTo(6, -76); ctx.lineTo(-6, -76);
    ctx.closePath();
    ctx.fill();
  },

  crate: (ctx, color) => {
    const c = color || PAL.wood;
    ctx.fillStyle = c;
    roundedRect(ctx, -17, -34, 34, 34, 2);
    ctx.strokeStyle = shade(c, -0.32);
    ctx.lineWidth = 2.4;
    ctx.strokeRect(-16, -33, 32, 32);
    ctx.beginPath();
    ctx.moveTo(-16, -33); ctx.lineTo(16, -1);
    ctx.moveTo(16, -33); ctx.lineTo(-16, -1);
    ctx.stroke();
  },

  sign: (ctx, color) => {
    ctx.fillStyle = '#6b4a33';
    roundedRect(ctx, -2.5, -26, 5, 26, 2);
    const c = color || PAL.wood;
    ctx.fillStyle = c;
    roundedRect(ctx, -20, -48, 40, 24, 3);
    ctx.strokeStyle = shade(c, -0.35);
    ctx.lineWidth = 2;
    ctx.strokeRect(-19, -47, 38, 22);
    ctx.fillStyle = shade(c, -0.4);
    for (let i = 0; i < 3; i++) ctx.fillRect(-13, -42 + i * 6, 26 - i * 5, 2.4);
  },

  banner: (ctx, color, time) => {
    const wave = Math.sin(time * 1.4) * 3;
    const c = color || '#8f3a4a';
    ctx.fillStyle = '#3c4354';
    ctx.fillRect(-22, -76, 44, 4);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-16, -74);
    ctx.lineTo(16, -74);
    ctx.lineTo(16 + wave, -22);
    ctx.lineTo(0 + wave, -32);
    ctx.lineTo(-16 + wave, -22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(PAL.gold, 0.8);
    ctx.beginPath();
    ctx.arc(wave * 0.5, -52, 7, 0, Math.PI * 2);
    ctx.fill();
  },
};
