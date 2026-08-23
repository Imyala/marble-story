/**
 * Loads the packaged single-file build in a real browser and checks that it
 * boots, sizes itself to its container, and runs without errors — the things
 * that break when a game is moved from its own page into an embedded one.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/marble-story.html', 'utf8');
const server = createServer((_req, res) => {
  // Deliberately no charset: the artifact host supplies its own <head>, so
  // the file must render correctly without one. This is what caught the
  // mojibake the first time.
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});
await new Promise((r) => server.listen(4199, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 820 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (m.text().includes('Failed to load resource') && m.location()?.url?.includes('fonts.g')) return;
  errors.push(`console: ${m.text()} @ ${m.location()?.url ?? '?'}`);
});
// Google Fonts is the one external host the Artifact CSP allows; anything else
// failing here would fail there too.
page.on('requestfailed', (r) => {
  // Google Fonts is the one external host the Artifact CSP allows. This
  // sandbox cannot reach it, so a failure here is environmental, not a bug.
  if (r.url().includes('fonts.g')) {
    console.log(`note: font request blocked in this sandbox (${r.url().slice(0, 60)}…)`);
    return;
  }
  errors.push(`request failed: ${r.url()}`);
});

await page.goto('http://localhost:4199/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.marbleApp, null, { timeout: 10000 });
// The shell opens on world select; drop into a character for the checks below.
await page.evaluate(() => window.marbleApp.quickStart('novice'));
await page.waitForFunction(() => !!window.marble, null, { timeout: 10000 });
await page.waitForTimeout(800);

const results = [];
const asciiOnly = !/[^\x00-\x7f]/.test(html);
const check = (label, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
};

const info = await page.evaluate(() => {
  const c = document.getElementById('game');
  const stage = document.getElementById('stage');
  const g = window.marble;
  return {
    map: g.mapId,
    level: g.player.level,
    canvasW: c.getBoundingClientRect().width,
    canvasH: c.getBoundingClientRect().height,
    stageW: stage.clientWidth,
    stageH: stage.clientHeight,
    docH: document.documentElement.scrollHeight,
    winH: window.innerHeight,
    veilVisible: !document.getElementById('veil').hidden,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});

check('packaged file is ASCII-only', asciiOnly,
      asciiOnly ? '' : JSON.stringify(html.match(/[^\x00-\x7f]/g)?.slice(0, 6)));
check('boots inside the packaged page', info.map === 'tidewatch' && info.level === 1, JSON.stringify(info));
check('canvas fits its container',
      info.canvasW > 200 && info.canvasW <= info.stageW && info.canvasH <= info.stageH,
      `canvas ${Math.round(info.canvasW)}x${Math.round(info.canvasH)} in stage ${info.stageW}x${info.stageH}`);
check('page does not scroll', info.docH <= info.winH + 2, `doc ${info.docH} vs window ${info.winH}`);
check('body paints its own background', info.bodyBg === 'rgb(11, 14, 23)', info.bodyBg);

// The veil must clear once the page has focus, or the game looks frozen.
await page.locator('#stage').click({ position: { x: 20, y: 20 } });
await page.waitForTimeout(200);
const veilGone = await page.evaluate(() => document.getElementById('veil').hidden);
check('focus veil clears on click', veilGone === true);

// Input must actually reach the game from inside the page.
const before = await page.evaluate(() => Math.round(window.marble.player.body.x));
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(700);
await page.keyboard.up('ArrowRight');
const after = await page.evaluate(() => Math.round(window.marble.player.body.x));
check('keyboard reaches the game', after > before + 60, `x ${before} -> ${after}`);

// Text must render as real glyphs, not mojibake, with no charset declared.
const glyphs = await page.evaluate(() => {
  const legend = document.querySelector('.legend')?.textContent ?? '';
  return { legend, hasArrow: legend.includes('\u2190'), hasMojibake: /\u00e2\u0080|\u00c3/.test(legend) };
});
check('shell text renders without mojibake',
      glyphs.hasArrow && !glyphs.hasMojibake, glyphs.legend.slice(0, 60));

// Same for text the game itself draws — its glyphs live in the JS bundle.
const inGame = await page.evaluate(() => {
  const g = window.marble;
  const line = g.world.map.name;
  return { name: line, skill: g.player.availableSkills().map((s) => s.icon.glyph).join('') };
});
check('in-game glyphs survive the bundle',
      !/\u00e2\u0080|\u00c3/.test(inGame.skill + inGame.name), JSON.stringify(inGame));

// Narrow viewport: the canvas must shrink rather than overflow.
await page.setViewportSize({ width: 700, height: 560 });
await page.waitForTimeout(400);
const small = await page.evaluate(() => {
  const c = document.getElementById('game').getBoundingClientRect();
  const s = document.getElementById('stage');
  return { w: c.width, h: c.height, sw: s.clientWidth, sh: s.clientHeight,
           docW: document.documentElement.scrollWidth, winW: window.innerWidth };
});
check('rescales on a small viewport',
      small.w <= small.sw && small.h <= small.sh && small.docW <= small.winW + 2,
      JSON.stringify(small));

await page.setViewportSize({ width: 1200, height: 820 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'scripts/out/artifact.png' });

check('no runtime errors', errors.length === 0, errors.slice(0, 4).join(' | '));

await browser.close();
server.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
