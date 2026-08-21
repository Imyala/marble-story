/**
 * Procedural monster art.
 *
 * Each monster in the database references a shape and a two-colour scheme;
 * this module draws it. Keeping monsters to a small set of readable
 * silhouettes is deliberate — in a screen full of mobs, shape recognition
 * matters far more than detail.
 */
import { rgba, shade } from './palette';
import { drawFlashed } from './flash';
import { roundedRect } from './character';

export type MobShape =
  | 'slime' | 'snail' | 'mushroom' | 'boar' | 'bat'
  | 'golem' | 'plant' | 'spirit' | 'crab' | 'wolf';

export interface MobArt {
  shape: MobShape;
  body: string;
  accent: string;
  /** 1.0 is roughly a 44px-tall creature. */
  scale: number;
}

export interface MobPose {
  facing: 1 | -1;
  animTime: number;
  /** Bounce/idle amount, 0..1. */
  moving: boolean;
  /** 0..1 white flash on being hit. */
  flash: number;
  /** 0..1 death fade. */
  alpha: number;
}

export function drawMob(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  art: MobArt,
  pose: MobPose,
): void {
  drawFlashed(ctx, x, y, pose.flash, pose.alpha, (c) => {
    if (art.shape !== 'bat' && art.shape !== 'spirit') {
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.ellipse(0, 1, 16 * art.scale, 4.5 * art.scale, 0, 0, Math.PI * 2);
      c.fill();
    }

    c.save();
    c.scale(pose.facing * art.scale, art.scale);
    const t = pose.animTime;
    const bounce = pose.moving
      ? Math.abs(Math.sin(t * 7))
      : Math.abs(Math.sin(t * 2.4)) * 0.4;
    SHAPES[art.shape](c, art, t, bounce, pose);
    c.restore();
  });
}

type ShapeFn = (
  ctx: CanvasRenderingContext2D, art: MobArt,
  t: number, bounce: number, pose: MobPose,
) => void;

/** Two dots with highlights — the cheapest way to make a shape feel alive. */
function eyes(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, r = 2.6): void {
  ctx.fillStyle = '#1a1d28';
  ctx.beginPath();
  ctx.ellipse(x1, y, r, r * 1.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x2, y, r, r * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x1 + r * 0.35, y - r * 0.5, r * 0.32, 0, Math.PI * 2);
  ctx.arc(x2 + r * 0.35, y - r * 0.5, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

const SHAPES: Record<MobShape, ShapeFn> = {
  slime: (ctx, art, _t, bounce) => {
    const squash = 1 - bounce * 0.14;
    const h = 26 * squash;
    const w = 22 / squash;
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(-w, -h * 1.55, 0, -h * 1.55);
    ctx.quadraticCurveTo(w, -h * 1.55, w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.3);
    ctx.beginPath();
    ctx.ellipse(-w * 0.35, -h * 1.05, w * 0.22, h * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    eyes(ctx, 2, 11, -h * 0.85);
    ctx.strokeStyle = '#1a1d28';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(7, -h * 0.5, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  },

  snail: (ctx, art, t, bounce) => {
    ctx.fillStyle = art.accent;
    roundedRect(ctx, -16, -13, 24, 13, 6);
    ctx.fillStyle = art.accent;
    ctx.beginPath();
    ctx.ellipse(10, -9, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shell with a spiral.
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.arc(-4, -18 - bounce, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shade(art.body, -0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.4; a += 0.25) {
      const r = 1.6 + a * 1.9;
      const px = -4 + Math.cos(a) * r;
      const py = -18 - bounce + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Eye stalks.
    ctx.strokeStyle = art.accent;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const wob = Math.sin(t * 3) * 1.6;
    for (const sx of [11, 15]) {
      ctx.beginPath();
      ctx.moveTo(sx, -14);
      ctx.lineTo(sx + 2 + wob, -23);
      ctx.stroke();
    }
    eyes(ctx, 13 + wob, 17 + wob, -24, 1.8);
  },

  mushroom: (ctx, art, _t, bounce) => {
    ctx.fillStyle = art.accent;
    roundedRect(ctx, -11, -22, 22, 22, 7);
    eyes(ctx, -1, 8, -14);
    ctx.strokeStyle = '#1a1d28';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(4, -8, 4, 0.1, Math.PI - 0.1);
    ctx.stroke();
    // Cap.
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.ellipse(0, -24 - bounce, 22, 15, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-22, -25 - bounce, 44, 3);
    ctx.fillStyle = rgba('#ffffff', 0.35);
    for (const [sx, sr] of [[-11, 4], [4, 5.5], [14, 3]] as const) {
      ctx.beginPath();
      ctx.ellipse(sx, -29 - bounce, sr, sr * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  boar: (ctx, art, _t, bounce) => {
    ctx.fillStyle = art.body;
    roundedRect(ctx, -22, -28 + bounce * 0.5, 40, 24, 11);
    // Legs.
    ctx.fillStyle = shade(art.body, -0.3);
    for (const lx of [-16, -6, 6, 13]) ctx.fillRect(lx, -6, 5, 6);
    // Head.
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.ellipse(20, -18 + bounce * 0.5, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = art.accent;
    ctx.beginPath();
    ctx.ellipse(29, -15 + bounce * 0.5, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tusks.
    ctx.strokeStyle = '#e8e4d8';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(28, -12 + bounce * 0.5);
    ctx.lineTo(32, -19 + bounce * 0.5);
    ctx.stroke();
    eyes(ctx, 19, 25, -22 + bounce * 0.5, 2);
  },

  bat: (ctx, art, t) => {
    const flap = Math.sin(t * 16);
    ctx.fillStyle = art.body;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.quadraticCurveTo(dir * 20, -24 + flap * 9, dir * 26, -12 + flap * 7);
      ctx.quadraticCurveTo(dir * 16, -12, dir * 4, -10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = art.accent;
    ctx.beginPath();
    ctx.ellipse(0, -16, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ears.
    ctx.fillStyle = art.accent;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 3, -25);
      ctx.lineTo(dir * 8, -34);
      ctx.lineTo(dir * 9, -23);
      ctx.closePath();
      ctx.fill();
    }
    eyes(ctx, -3.5, 4.5, -17, 2.2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-2, -12); ctx.lineTo(-0.5, -9); ctx.lineTo(1, -12);
    ctx.closePath();
    ctx.fill();
  },

  golem: (ctx, art, _t, bounce) => {
    ctx.fillStyle = art.body;
    roundedRect(ctx, -20, -46 + bounce * 0.4, 40, 42, 6);
    ctx.fillStyle = shade(art.body, -0.25);
    roundedRect(ctx, -26, -40 + bounce * 0.4, 9, 22, 4);
    roundedRect(ctx, 17, -40 + bounce * 0.4, 9, 22, 4);
    // Cracks / veins.
    ctx.strokeStyle = art.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -42 + bounce * 0.4);
    ctx.lineTo(-4, -30 + bounce * 0.4);
    ctx.lineTo(-11, -22 + bounce * 0.4);
    ctx.moveTo(9, -38 + bounce * 0.4);
    ctx.lineTo(4, -28 + bounce * 0.4);
    ctx.stroke();
    ctx.fillStyle = art.accent;
    ctx.beginPath();
    ctx.arc(-4, -36 + bounce * 0.4, 3.2, 0, Math.PI * 2);
    ctx.arc(8, -36 + bounce * 0.4, 3.2, 0, Math.PI * 2);
    ctx.fill();
  },

  plant: (ctx, art, t) => {
    const sway = Math.sin(t * 2.4) * 4;
    ctx.strokeStyle = art.accent;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 0.5, -16, sway, -28);
    ctx.stroke();
    // Leaves.
    ctx.fillStyle = shade(art.accent, -0.15);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(dir * 9, -16, 9, 4, dir * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Head/bud.
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.ellipse(sway, -36, 14, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(art.body, -0.35);
    ctx.beginPath();
    ctx.ellipse(sway + 3, -33, 9, 6, 0.2, 0, Math.PI);
    ctx.fill();
    eyes(ctx, sway - 2, sway + 7, -40, 2.2);
  },

  spirit: (ctx, art, t) => {
    const float = Math.sin(t * 2.6) * 4;
    ctx.globalAlpha *= 0.85;
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.moveTo(-15, -22 + float);
    ctx.quadraticCurveTo(-15, -44 + float, 0, -44 + float);
    ctx.quadraticCurveTo(15, -44 + float, 15, -22 + float);
    // Ragged hem.
    for (let i = 0; i <= 4; i++) {
      const px = 15 - i * 7.5;
      ctx.quadraticCurveTo(px - 3.75, -14 + float + (i % 2 === 0 ? 5 : -2), px - 7.5, -20 + float);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = art.accent;
    ctx.beginPath();
    ctx.ellipse(-4, -33 + float, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -33 + float, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  crab: (ctx, art, t, bounce) => {
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.ellipse(0, -16 + bounce * 0.4, 20, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(art.body, -0.3);
    for (const lx of [-14, -5, 5, 14]) {
      ctx.beginPath();
      ctx.moveTo(lx, -8);
      ctx.lineTo(lx + 2, 0);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = shade(art.body, -0.3);
      ctx.stroke();
    }
    // Claws.
    const pinch = Math.abs(Math.sin(t * 4)) * 4;
    ctx.fillStyle = art.accent;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * 22, -18 + bounce * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dir * 11, -6 - pinch);
      ctx.lineTo(dir * 11, -1);
      ctx.lineTo(dir * 4, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    eyes(ctx, -5, 5, -26 + bounce * 0.4, 2.4);
  },

  wolf: (ctx, art, _t, bounce) => {
    ctx.fillStyle = art.body;
    roundedRect(ctx, -20, -26 + bounce * 0.4, 36, 18, 9);
    ctx.fillStyle = shade(art.body, -0.28);
    for (const lx of [-15, -6, 5, 11]) ctx.fillRect(lx, -10, 4.5, 10);
    // Tail.
    ctx.strokeStyle = art.body;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-19, -22 + bounce * 0.4);
    ctx.quadraticCurveTo(-30, -26, -28, -34);
    ctx.stroke();
    // Head + snout + ears.
    ctx.fillStyle = art.body;
    ctx.beginPath();
    ctx.ellipse(18, -26 + bounce * 0.4, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = art.accent;
    roundedRect(ctx, 24, -24 + bounce * 0.4, 10, 7, 3);
    ctx.fillStyle = art.body;
    for (const ex of [13, 22]) {
      ctx.beginPath();
      ctx.moveTo(ex, -34 + bounce * 0.4);
      ctx.lineTo(ex + 3, -42 + bounce * 0.4);
      ctx.lineTo(ex + 7, -33 + bounce * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    eyes(ctx, 17, 24, -28 + bounce * 0.4, 2);
  },
};
