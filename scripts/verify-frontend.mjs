/**
 * Drives the front-end screens: world select -> character select -> class
 * select -> a live character, and back again. Checks the flow, the validation,
 * and that characters actually persist into their slots.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const PORT = 4310;

const server = createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  const rel = normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[/\\])+/, '');
  const file = join('dist', rel);
  if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const results = [];
const check = (label, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
};
const screen = () => page.evaluate(() => window.marbleApp.currentScreen);
const shot = (n) => page.screenshot({ path: `scripts/out/frontend-${n}.png` });

await page.goto(`http://localhost:${PORT}/?seed=4242`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.marbleApp, null, { timeout: 10000 });
await page.waitForTimeout(400);

check('boots to world select, not into the game', await screen() === 'world');
check('no game instance exists yet', await page.evaluate(() => !window.marble));
await shot('01-world-select');

/* -- clicking a world really works, not just the API ---------------------- */
const clickView = async (vx, vy) => {
  const box = await page.evaluate(() => {
    const c = document.getElementById('game').getBoundingClientRect();
    return { x: c.x, y: c.y, w: c.width, h: c.height };
  });
  // The canvas renders at a fixed internal size and is scaled to fit.
  await page.mouse.move(box.x + (vx / 1024) * box.w, box.y + (vy / 700) * box.h);
  await page.waitForTimeout(60);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(160);
};
// First world row in the right-hand panel.
await clickView(838, 110);
check('clicking a world opens character select', await screen() === 'characters',
      `screen=${await screen()}`);
await shot('02-character-select');

/* -- creation flow -------------------------------------------------------- */
await page.evaluate(() => window.marbleApp.beginCreate(0));
await page.waitForTimeout(200);
check('empty slot opens class select', await screen() === 'class');

const classes = await page.evaluate(() => {
  const app = window.marbleApp;
  app.chooseClass('mage');
  const picked = app.selectedClass;
  app.chooseClass('archer');
  return { picked, then: app.selectedClass };
});
check('class cards change the selection',
      classes.picked === 'mage' && classes.then === 'archer', JSON.stringify(classes));
await shot('03-class-select');

const rejected = await page.evaluate(() => {
  const app = window.marbleApp;
  const out = [];
  for (const bad of ['', 'a', 'thisnameiswaytoolong', 'bad name!']) {
    app.setName(bad);
    out.push({ bad, created: app.createCharacter(), error: app.nameFieldError });
  }
  return out;
});
check('rejects invalid names', rejected.every((r) => !r.created && r.error),
      rejected.map((r) => `"${r.bad}"`).join(' '));

const created = await page.evaluate(() => {
  const app = window.marbleApp;
  app.chooseClass('archer');
  app.setName('Fletcher');
  const ok = app.createCharacter();
  return {
    ok,
    screen: app.currentScreen,
    name: window.marble?.player.name,
    job: window.marble?.player.jobId,
    map: window.marble?.mapId,
    weapon: window.marble?.player.weaponType(),
  };
});
check('creating a character enters the world',
      created.ok && created.screen === 'playing' && created.map === 'tidewatch',
      JSON.stringify(created));
check('the chosen class is applied',
      created.name === 'Fletcher' && created.job === 300 && created.weapon === 'bow',
      JSON.stringify(created));
await shot('04-in-game');

/* -- duplicate names ------------------------------------------------------ */
await page.evaluate(() => window.marbleApp.exitToMenu());
await page.waitForTimeout(200);
check('exiting the game returns to character select', await screen() === 'characters');

const dupe = await page.evaluate(() => {
  const app = window.marbleApp;
  app.beginCreate(1);
  app.chooseClass('warrior');
  app.setName('Fletcher');
  return { created: app.createCharacter(), error: app.nameFieldError };
});
check('rejects a duplicate name in the same world',
      !dupe.created && !!dupe.error, JSON.stringify(dupe));

/* -- persistence ---------------------------------------------------------- */
await page.evaluate(() => window.marbleApp.selectWorld('solace'));
await page.waitForTimeout(150);
await shot('05-with-character');

await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.marbleApp, null, { timeout: 10000 });
await page.waitForTimeout(400);

const persisted = await page.evaluate(() => {
  const p = window.marbleApp;
  return { screen: p.currentScreen, world: p.world?.id ?? null };
});
check('reopens on the last world played',
      persisted.screen === 'characters' && persisted.world === 'solace',
      JSON.stringify(persisted));

const reentered = await page.evaluate(() => {
  window.marbleApp.play(0);
  return { name: window.marble?.player.name, job: window.marble?.player.jobId };
});
check('the saved character is still there and playable',
      reentered.name === 'Fletcher' && reentered.job === 300, JSON.stringify(reentered));

/* -- deletion ------------------------------------------------------------- */
await page.evaluate(() => window.marbleApp.exitToMenu());
await page.waitForTimeout(150);
page.on('dialog', (d) => d.accept());
const deleted = await page.evaluate(() => {
  window.marbleApp.deleteAt(0);
  return true;
});
void deleted;
await page.waitForTimeout(200);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.marbleApp, null, { timeout: 10000 });
await page.waitForTimeout(300);
const afterDelete = await page.evaluate(() => {
  window.marbleApp.selectWorld('solace');
  window.marbleApp.play(0);
  return !!window.marble;
});
check('a deleted character is gone after reload', afterDelete === false);

check('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
server.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
