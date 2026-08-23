/**
 * Entry point. Boots the application shell and wires the dev shortcuts.
 */
import { App } from './app';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('#game canvas not found');

const app = new App(canvas);
app.start();

// `?quickstart` skips the front-end screens and drops straight into a new
// character — the same affordance the headless tests use.
const params = new URLSearchParams(location.search);
if (params.has('quickstart')) {
  app.quickStart(params.get('quickstart') || undefined, params.get('world') || undefined);
}

// The game is up, so cancel the "failed to start" message.
clearTimeout((window as unknown as { __marbleBootTimer?: number }).__marbleBootTimer);
document.getElementById('boot')?.classList.add('hidden');
canvas.focus();

// Save on the way out so a closed tab never costs progress.
window.addEventListener('beforeunload', () => app.saveNow());

window.addEventListener('keydown', (e) => {
  // Ctrl+S saves, Ctrl+Shift+R wipes every character and starts over.
  if (e.key.toLowerCase() === 's' && e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    app.saveNow();
  }
  if (e.key.toLowerCase() === 'r' && e.ctrlKey && e.shiftKey) {
    e.preventDefault();
    if (confirm('Delete every character and start over?')) app.resetAll();
  }
});

// Exposed for poking at the game from the browser console during development.
declare global {
  interface Window {
    marble?: import('./game/game').Game | null;
    marbleApp?: App;
  }
}
window.marbleApp = app;
