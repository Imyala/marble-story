/**
 * Procedurally drawn player avatar.
 *
 * The genre's signature silhouette is a big head on a small body, so the
 * proportions here are deliberately chibi: a 15px-radius head on a 20px torso.
 * Everything is immediate-mode canvas paths — no sprite sheets, no assets.
 */
import { rgba, shade } from './palette';
import { drawFlashed } from './flash';
import type { MoveState } from '../physics/body';

export type WeaponArt = 'none' | 'sword' | 'axe' | 'spear' | 'bow' | 'wand' | 'claw' | 'gun';

export interface CharacterLook {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'spiky' | 'ponytail';
  top: string;
  bottom: string;
  cape: string | null;
  weapon: WeaponArt;
  weaponColor: string;
}

export const DEFAULT_LOOK: CharacterLook = {
  skin: '#f4c9a0',
  hair: '#8b4a2f',
  hairStyle: 'short',
  top: '#4f7fd4',
  bottom: '#3b4560',
  cape: null,
  weapon: 'sword',
  weaponColor: '#c8d2e0',
};

export interface CharacterPose {
  state: MoveState;
  facing: 1 | -1;
  animTime: number;
  /** 0..1 while an attack animation plays, null otherwise. */
  attack: number | null;
  /** 0..1 white flash when damaged. */
  flash: number;
  /** Fades the whole avatar (used for i-frames). */
  alpha: number;
}

const HEAD_R = 15;
const HEAD_Y = -50;
const TORSO_TOP = -38;
const TORSO_BOTTOM = -17;
const TORSO_W = 21;

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  look: CharacterLook,
  pose: CharacterPose,
): void {
  drawFlashed(ctx, x, y, pose.flash, pose.alpha, (c) => {
    // Contact shadow grounds the character against the foothold.
    if (pose.state !== 'climb') {
      c.fillStyle = 'rgba(0,0,0,0.28)';
      c.beginPath();
      c.ellipse(0, 1, 15, 4.5, 0, 0, Math.PI * 2);
      c.fill();
    }

    c.save();
    c.scale(pose.facing, 1);
    switch (pose.state) {
      case 'prone': drawProne(c, look); break;
      case 'climb': drawClimb(c, look, pose); break;
      case 'jump':
      case 'fall':  drawAirborne(c, look, pose); break;
      case 'dead':  drawDead(c, look); break;
      default:      drawUpright(c, look, pose); break;
    }
    c.restore();
  });
}

/* ---------------------------------------------------------------- poses -- */

function drawUpright(ctx: CanvasRenderingContext2D, look: CharacterLook, pose: CharacterPose): void {
  const walking = pose.state === 'walk';
  const phase = pose.animTime * 9;
  const swing = walking ? Math.sin(phase) * 7 : 0;
  const bob = walking ? Math.abs(Math.cos(phase)) * 1.6 : Math.sin(pose.animTime * 2.2) * 0.7;

  ctx.save();
  ctx.translate(0, -bob);

  drawCape(ctx, look, swing * 0.4);
  drawLegs(ctx, look, swing);
  drawTorso(ctx, look);

  // Back arm first so it sits behind the torso.
  drawArm(ctx, look, -6, -swing * 0.7, true);

  const armAngle = pose.attack !== null ? attackArmAngle(pose.attack) : swing * 0.6;
  drawArm(ctx, look, 7, armAngle, false);
  drawWeapon(ctx, look, armAngle, pose.attack);

  drawHead(ctx, look, 0);
  ctx.restore();

  if (pose.attack !== null) drawSlash(ctx, look, pose.attack);
}

function drawAirborne(ctx: CanvasRenderingContext2D, look: CharacterLook, pose: CharacterPose): void {
  const rising = pose.state === 'jump';
  ctx.save();
  drawCape(ctx, look, rising ? -10 : 10);

  // Legs tucked on the way up, trailing on the way down.
  const tuck = rising ? 6 : 2;
  drawLeg(ctx, look, -5, tuck, rising ? -22 : 12);
  drawLeg(ctx, look, 5, tuck, rising ? -8 : 24);

  drawTorso(ctx, look);
  drawArm(ctx, look, -6, rising ? -50 : -20, true);
  const armAngle = pose.attack !== null ? attackArmAngle(pose.attack) : (rising ? -46 : -14);
  drawArm(ctx, look, 7, armAngle, false);
  drawWeapon(ctx, look, armAngle, pose.attack);
  drawHead(ctx, look, 0);
  ctx.restore();

  if (pose.attack !== null) drawSlash(ctx, look, pose.attack);
}

function drawProne(ctx: CanvasRenderingContext2D, look: CharacterLook): void {
  ctx.save();
  ctx.translate(-4, 0);
  // Body flattened along the ground.
  ctx.fillStyle = look.bottom;
  roundedRect(ctx, -4, -13, 22, 12, 5);
  ctx.fillStyle = look.top;
  roundedRect(ctx, -20, -15, 20, 14, 5);
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(-24, -20, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.arc(-25, -23, 12, Math.PI, Math.PI * 2.15);
  ctx.fill();
  ctx.restore();
}

function drawClimb(ctx: CanvasRenderingContext2D, look: CharacterLook, pose: CharacterPose): void {
  // Seen from behind: no face, arms alternate overhead.
  const phase = Math.sin(pose.animTime * 7);
  ctx.save();
  drawLeg(ctx, look, -5, 0, phase * 9);
  drawLeg(ctx, look, 5, 0, -phase * 9);
  drawTorso(ctx, look);

  ctx.strokeStyle = look.skin;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const [side, dir] of [[-8, 1], [8, -1]] as const) {
    ctx.beginPath();
    ctx.moveTo(side, TORSO_TOP + 3);
    ctx.lineTo(side * 0.7, TORSO_TOP - 16 + dir * phase * 5);
    ctx.stroke();
  }

  // Back of the head — hair only.
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(0, HEAD_Y, HEAD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.arc(0, HEAD_Y, HEAD_R + 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDead(ctx: CanvasRenderingContext2D, look: CharacterLook): void {
  ctx.save();
  ctx.globalAlpha *= 0.8;
  ctx.rotate(Math.PI * 0.5);
  ctx.translate(-14, -6);
  drawLegs(ctx, look, 0);
  drawTorso(ctx, look);
  drawHead(ctx, look, 0, true);
  ctx.restore();
}

/* ---------------------------------------------------------------- parts -- */

function drawHead(ctx: CanvasRenderingContext2D, look: CharacterLook, dy: number, dead = false): void {
  const cy = HEAD_Y + dy;

  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(0, cy, HEAD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#000000', 0.06);
  ctx.beginPath();
  ctx.arc(-3, cy + 2, HEAD_R, Math.PI * 0.6, Math.PI * 1.35);
  ctx.fill();

  // Eyes — two dots and a highlight is all it takes to read as a face.
  if (dead) {
    ctx.strokeStyle = '#2a2f3d';
    ctx.lineWidth = 1.6;
    for (const ex of [2, 9]) {
      ctx.beginPath();
      ctx.moveTo(ex - 2, cy - 3);
      ctx.lineTo(ex + 2, cy + 1);
      ctx.moveTo(ex + 2, cy - 3);
      ctx.lineTo(ex - 2, cy + 1);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#2a2f3d';
    ctx.beginPath();
    ctx.ellipse(3, cy - 1, 1.9, 2.7, 0, 0, Math.PI * 2);
    ctx.ellipse(9.5, cy - 1, 1.9, 2.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.7, cy - 2, 0.7, 0, Math.PI * 2);
    ctx.arc(10.2, cy - 2, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHair(ctx, look, cy);
}

/**
 * Hairline angles. The fill closes on the chord between the arc's endpoints,
 * so an arc that ends below the eyes paints straight over them — which is
 * exactly what these used to do. Keep the chord above the eye line.
 */
const HAIR_START = Math.PI * 1.12;
const HAIR_END = Math.PI * 1.88;

function drawHair(ctx: CanvasRenderingContext2D, look: CharacterLook, cy: number): void {
  ctx.fillStyle = look.hair;
  switch (look.hairStyle) {
    case 'long':
      ctx.beginPath();
      // The long style keeps a fall of hair down one side, drawn as a separate
      // shape so the face itself stays clear.
      ctx.arc(0, cy, HEAD_R + 1, HAIR_START, HAIR_END);
      ctx.lineTo(-HEAD_R - 1, cy + 16);
      ctx.lineTo(-HEAD_R + 5, cy + 16);
      ctx.closePath();
      ctx.fill();
      break;
    case 'spiky':
      ctx.beginPath();
      ctx.moveTo(-HEAD_R + 1, cy - 5);
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const px = -HEAD_R + t * HEAD_R * 2;
        ctx.lineTo(px, cy - HEAD_R - (i % 2 === 0 ? 7 : 1));
        ctx.lineTo(px + 3, cy - HEAD_R + 2);
      }
      ctx.lineTo(HEAD_R - 1, cy - 5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'ponytail':
      ctx.beginPath();
      ctx.arc(0, cy, HEAD_R + 1, HAIR_START, HAIR_END);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-HEAD_R - 3, cy + 4, 5, 11, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, cy, HEAD_R + 1, HAIR_START, HAIR_END);
      ctx.fill();
      // A swept fringe across the brow, kept above the eyes.
      ctx.beginPath();
      ctx.ellipse(5, cy - HEAD_R + 4, 9, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

function drawTorso(ctx: CanvasRenderingContext2D, look: CharacterLook): void {
  ctx.fillStyle = look.top;
  roundedRect(ctx, -TORSO_W / 2, TORSO_TOP, TORSO_W, TORSO_BOTTOM - TORSO_TOP, 5);
  ctx.fillStyle = rgba('#ffffff', 0.12);
  roundedRect(ctx, -TORSO_W / 2 + 2, TORSO_TOP + 2, 4, TORSO_BOTTOM - TORSO_TOP - 5, 2);
}

function drawLegs(ctx: CanvasRenderingContext2D, look: CharacterLook, swing: number): void {
  drawLeg(ctx, look, -5, 0, swing);
  drawLeg(ctx, look, 5, 0, -swing);
}

function drawLeg(
  ctx: CanvasRenderingContext2D, look: CharacterLook,
  offsetX: number, lift: number, swing: number,
): void {
  ctx.save();
  ctx.translate(offsetX, TORSO_BOTTOM);
  ctx.rotate((swing * Math.PI) / 180);
  ctx.fillStyle = look.bottom;
  roundedRect(ctx, -3.5, 0, 7, 17 - lift, 3);
  ctx.fillStyle = shade(look.bottom, -0.4);
  roundedRect(ctx, -4.5, 13 - lift, 9, 4, 2);
  ctx.restore();
}

function drawArm(
  ctx: CanvasRenderingContext2D, look: CharacterLook,
  offsetX: number, angleDeg: number, back: boolean,
): void {
  ctx.save();
  ctx.translate(offsetX, TORSO_TOP + 5);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.fillStyle = back ? shade(look.top, -0.22) : look.top;
  roundedRect(ctx, -3, 0, 6, 12, 3);
  ctx.fillStyle = back ? shade(look.skin, -0.18) : look.skin;
  ctx.beginPath();
  ctx.arc(0, 13, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCape(ctx: CanvasRenderingContext2D, look: CharacterLook, sway: number): void {
  if (!look.cape) return;
  ctx.save();
  ctx.fillStyle = look.cape;
  ctx.beginPath();
  ctx.moveTo(-9, TORSO_TOP + 1);
  ctx.lineTo(9, TORSO_TOP + 1);
  ctx.quadraticCurveTo(11 + sway, TORSO_BOTTOM + 8, 3 + sway * 1.6, TORSO_BOTTOM + 14);
  ctx.lineTo(-6 + sway * 1.6, TORSO_BOTTOM + 12);
  ctx.quadraticCurveTo(-11 + sway, TORSO_BOTTOM, -9, TORSO_TOP + 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* -------------------------------------------------------------- weapons -- */

/** Arm sweep for an attack: wind up behind, snap forward, settle. */
function attackArmAngle(t: number): number {
  if (t < 0.28) return -60 - (t / 0.28) * 55;      // wind up
  if (t < 0.55) return -115 + ((t - 0.28) / 0.27) * 175; // swing through
  return 60 - ((t - 0.55) / 0.45) * 55;             // recover
}

function drawWeapon(
  ctx: CanvasRenderingContext2D, look: CharacterLook,
  angleDeg: number, attack: number | null,
): void {
  if (look.weapon === 'none') return;
  ctx.save();
  ctx.translate(7, TORSO_TOP + 5);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.translate(0, 13);

  const c = look.weaponColor;
  switch (look.weapon) {
    case 'sword':
      ctx.fillStyle = '#4a3826';
      roundedRect(ctx, -2, -2, 4, 9, 2);
      ctx.fillStyle = shade(c, -0.3);
      roundedRect(ctx, -6, -4, 12, 3, 1.5);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-3, -4);
      ctx.lineTo(3, -4);
      ctx.lineTo(1.5, -40);
      ctx.lineTo(0, -45);
      ctx.lineTo(-1.5, -40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.45);
      ctx.fillRect(-0.8, -38, 1.4, 32);
      break;
    case 'axe':
      ctx.fillStyle = '#4a3826';
      roundedRect(ctx, -2, -34, 4, 42, 2);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(1, -34);
      ctx.quadraticCurveTo(18, -30, 14, -12);
      ctx.quadraticCurveTo(8, -16, 1, -16);
      ctx.closePath();
      ctx.fill();
      break;
    case 'spear':
      ctx.fillStyle = '#5b4227';
      roundedRect(ctx, -1.8, -52, 3.6, 62, 2);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -64);
      ctx.lineTo(4.5, -50);
      ctx.lineTo(0, -46);
      ctx.lineTo(-4.5, -50);
      ctx.closePath();
      ctx.fill();
      break;
    case 'bow':
      ctx.strokeStyle = '#6b4a24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(2, -14, 18, Math.PI * 0.62, Math.PI * 1.38);
      ctx.stroke();
      ctx.strokeStyle = rgba('#ffffff', 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8.5, -30);
      ctx.lineTo(attack !== null && attack < 0.5 ? -14 : -8.5, -14);
      ctx.lineTo(-8.5, 2);
      ctx.stroke();
      break;
    case 'wand':
      ctx.fillStyle = '#5b4227';
      roundedRect(ctx, -1.8, -30, 3.6, 38, 2);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, -33, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.6);
      ctx.beginPath();
      ctx.arc(-1.5, -34.5, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'claw':
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const off of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(off * 0.4, 0);
        ctx.lineTo(off, -13);
        ctx.stroke();
      }
      break;
    case 'gun':
      ctx.fillStyle = shade(c, -0.35);
      roundedRect(ctx, -2, -2, 20, 6, 2);
      ctx.fillStyle = '#4a3826';
      roundedRect(ctx, -3, 1, 6, 9, 2);
      break;
  }
  ctx.restore();
}

/** The arc that sells the swing — a fading crescent through the strike. */
function drawSlash(ctx: CanvasRenderingContext2D, look: CharacterLook, t: number): void {
  if (t < 0.24 || t > 0.62) return;
  if (look.weapon === 'bow' || look.weapon === 'gun' || look.weapon === 'wand') return;
  const p = (t - 0.24) / 0.38;
  ctx.save();
  ctx.globalAlpha = (1 - p) * 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5 * (1 - p * 0.5);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(6, -34, 38, -Math.PI * 0.75 + p * Math.PI * 0.9, -Math.PI * 0.2 + p * Math.PI * 0.9);
  ctx.stroke();
  ctx.restore();
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const rad = Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fill();
}
