/**
 * Entry point. Boots the game onto the canvas and wires the dev shortcuts.
 */
import { Game } from './game/game';

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('#game canvas not found');

const game = new Game(canvas);
game.start();

// The game is up, so cancel the "failed to start" message.
clearTimeout((window as unknown as { __marbleBootTimer?: number }).__marbleBootTimer);
document.getElementById('boot')?.classList.add('hidden');
canvas.focus();

// Save on the way out so a closed tab never costs progress.
window.addEventListener('beforeunload', () => game.saveGame(false));

window.addEventListener('keydown', (e) => {
  // Ctrl+S saves, Ctrl+Shift+R wipes the save and starts over.
  if (e.key.toLowerCase() === 's' && e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    game.saveGame(true);
  }
  if (e.key.toLowerCase() === 'r' && e.ctrlKey && e.shiftKey) {
    e.preventDefault();
    if (confirm('Delete your save and start a new character?')) game.resetSave();
  }
});

// Exposed for poking at the game from the browser console during development.
declare global {
  interface Window {
    marble?: Game;
  }
}
window.marble = game;
