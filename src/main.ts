import './ui/style.css';
import { Game } from './game/game';
import { reseed } from './core/rng';

declare global {
  interface Window {
    wyrm?: Game;
    __bootTimer?: number;
  }
}

const params = new URLSearchParams(location.search);
const seed = params.get('seed');
if (seed) reseed(Number(seed));

const root = document.getElementById('game-root')!;
const game = new Game(root);
window.wyrm = game;

// Automated tests run on slow software rendering; let them keep real time.
const maxdt = Number(params.get('maxdt'));
if (maxdt > 0) game.maxDt = maxdt;

const q = params.get('quality');
if (q === 'low' || q === 'medium' || q === 'high') {
  game.options.quality = q;
  game.applyOptions();
}

// ?level=<id> skips the title screen (development and automated tests).
const level = params.get('level');
if (level) {
  game.input.wantPointerLock = true;
  game.loadLevel(level, { checkpoint: params.get('cp') });
} else {
  game.showTitle();
}

document.getElementById('boot')?.classList.add('hidden');
if (window.__bootTimer) clearTimeout(window.__bootTimer);

let last = performance.now();
function frame(now: number): void {
  const dt = (now - last) / 1000;
  last = now;
  try {
    game.frame(dt);
  } catch (e) {
    console.error(e);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
