/**
 * Dev helper: screenshots one or more game URLs in headless Chromium.
 *   node scripts/shot.mjs "<query>" out-name [waitMs] ...
 * Assumes a server on GAME_URL (default the Vite dev server).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.GAME_URL ?? 'http://localhost:5173/dev.html';
const OUT = 'scripts/out';
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 600) } });
page.on('pageerror', (e) => console.log('pageerror:', e.message, e.stack));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`console.${m.type()}:`, m.text()); });
for (let i = 0; i < args.length; i += 3) {
  const q = args[i];
  const name = args[i + 1];
  const wait = Number(args[i + 2] ?? 1500);
  await page.goto(`${BASE}${q}`, { waitUntil: 'load' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}
await browser.close();
