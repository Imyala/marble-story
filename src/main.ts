import './ui/style.css';
import { Game } from './game/game';
import { reseed } from './core/rng';
import { MOVES } from './player/moves';
import { ensureLevel, hasLevel, levelDef, LEVEL_IDS } from './levels';

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
// Handles for automated tests and tinkering from the console (window.wyrm
// appears below, once the first realm is built).
(window as unknown as { wyrmDebug: unknown }).wyrmDebug = {
  MOVES,
  // Which realms exist and which have been fetched (realms load on demand).
  levels: { ids: LEVEL_IDS, has: hasLevel, loaded: (id: string) => !!levelDef(id), ensure: ensureLevel },
};

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
let first: Promise<void>;
if (level) {
  game.input.wantPointerLock = true;
  first = game.loadLevel(level, { checkpoint: params.get('cp') });
} else {
  first = game.showTitle();
}

// The first realm's code arrives on its own (realms load on demand): the boot
// screen stays up until it is built. A failure shows the loading veil's retry.
// Scripts wait for window.wyrm, so it too appears only once the game is playable.
const booted = () => {
  window.wyrm = game;
  document.getElementById('boot')?.classList.add('hidden');
};
void first.then(booted);
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
