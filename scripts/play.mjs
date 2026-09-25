/**
 * Dev playtest runner: drives the game in headless Chromium through a
 * scenario in scripts/scenarios/<name>.mjs and screenshots along the way.
 *   node scripts/play.mjs <scenario>[:<export>] [url]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const name = process.argv[2] ?? 'fen';
const BASE = process.argv[3] ?? process.env.GAME_URL ?? 'http://localhost:5173/dev.html';
const OUT = 'scripts/out';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 600) } });
const errors = [];
page.on('pageerror', (e) => { errors.push(e.message); console.log('pageerror:', e.message, e.stack); });
page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('console.error:', m.text()); } });

/**
 * Waits `ms` of game time rather than wall time (headless frames are slow and
 * vary with machine load), up to 12x as long on the wall clock. WALL=1 keeps
 * plain wall-clock waits.
 */
async function gameWait(ms) {
  const now = () => page.evaluate(() => window.wyrm?.realTime ?? null).catch(() => null);
  const t0 = process.env.WALL ? null : await now();
  if (t0 === null) return page.waitForTimeout(ms);
  const start = Date.now();
  const deadline = start + ms * 12;
  for (;;) {
    await page.waitForTimeout(Math.min(40, ms));
    const t = await now();
    if (t === null || (t - t0) * 1000 >= ms || Date.now() > deadline) return;
    // Frames stepped by the scenario itself (game time frozen between steps): plain wall wait.
    if (t === t0 && Date.now() - start >= ms) return;
  }
}

const h = {
  base: BASE,
  async go(q, wait = 2000) {
    await page.goto(`${BASE}${q}`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.wyrm, null, { timeout: 20000 });
    await page.waitForTimeout(wait);
  },
  wait: (ms) => gameWait(ms),
  async hold(key, ms) { await page.keyboard.down(key); await gameWait(ms); await page.keyboard.up(key); },
  async tap(key, n = 1, gap = 120) { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await gameWait(gap); } },
  eval: (fn, arg) => page.evaluate(fn, arg),
  /** Presses Esc only while a conversation is open. */
  async skipDialogue(maxWait = 3000) {
    const t0 = Date.now();
    let pressed = false;
    while (Date.now() - t0 < maxWait) {
      const st = await page.evaluate(() => window.wyrm.state);
      if (st === 'dialogue') { await page.keyboard.press('Escape'); pressed = true; await page.waitForTimeout(250); continue; }
      // A realm's results card waits for Continue.
      if (st === 'pause' && await page.evaluate(() => { const b = document.querySelector('.panel.results button'); b?.click(); return !!b; })) { await page.waitForTimeout(250); continue; }
      if (st === 'transition') { await page.waitForTimeout(200); continue; }
      break;
    }
    // An Esc that landed just after the conversation closed pauses the game: undo that.
    if (pressed) await page.evaluate(() => { if (window.wyrm.state === 'pause') window.wyrm.resume(); });
  },
  async shot(n) { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('shot', n); },
  state: () => page.evaluate(() => {
    const g = window.wyrm; const p = g.player;
    return { state: g.state, ps: p.state, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), hp: Math.round(p.hp), mana: Math.round(p.mana),
      gems: g.save.gems, enemies: g.enemies.filter((e) => e.alive).length, level: g.level?.def.id, fury: Math.round(p.fury), combo: g.style.combo };
  }),
  check(label, ok, detail = '') { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  -- ' + detail : ''}`); if (!ok) h.failed = true; },
  failed: false,
  page,
};
// `file:part` runs a named export of the scenario file instead of its default.
const [file, part = 'default'] = name.split(':');
const mod = await import(`./scenarios/${file}.mjs`);
try {
  await mod[part](h);
} catch (e) {
  console.log('scenario threw:', e);
  h.failed = true;
}
console.log(errors.length ? `ERRORS: ${errors.length}` : 'no page errors');
await browser.close();
process.exit(h.failed || errors.length ? 1 : 0);
