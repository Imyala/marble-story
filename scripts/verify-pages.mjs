/**
 * Verifies the site works under BOTH GitHub Pages sources, served at a project
 * subpath the way Pages does:
 *
 *   A. dist/         — published when the source is "GitHub Actions"
 *   B. the repo root — published (via Jekyll) when the source is
 *                      "deploy from a branch"
 *
 * Case B is the one that broke: Jekyll cannot build anything, so it published
 * the raw dev entry, whose <script> pointed at TypeScript source and 404'd.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};
const PREFIX = '/marble-story/';

function serve(root, port) {
  const server = createServer((req, res) => {
    let url = (req.url ?? '/').split('?')[0];
    if (!url.startsWith(PREFIX)) { res.writeHead(404).end('outside site root'); return; }
    url = url.slice(PREFIX.length - 1);
    let rel = normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[/\\])+/, '');
    let file = join(root, rel);
    // Directory URLs serve their index.html, as Pages does.
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const results = [];
const check = (label, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
};

async function probe(label, root, port) {
  const server = await serve(root, port);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });

  await page.goto(`http://localhost:${port}${PREFIX}`, { waitUntil: 'networkidle' }).catch(() => {});
  // Long enough to land after any redirect and boot the game.
  await page.waitForFunction(() => !!window.marbleApp, null, { timeout: 12000 }).catch(() => {});
  await page.evaluate(() => window.marbleApp?.quickStart('novice')).catch(() => {});
  await page.waitForFunction(() => !!window.marble, null, { timeout: 8000 }).catch(() => {});

  const state = await page.evaluate(() => ({
    booted: !!window.marble,
    map: window.marble?.mapId ?? null,
    url: location.pathname,
  }));

  check(`${label}: game boots`, state.booted, `at ${state.url}${problems.length ? ` | ${problems.slice(0, 2).join(' ')}` : ''}`);
  check(`${label}: starts in the town`, state.map === 'tidewatch', String(state.map));
  await page.screenshot({ path: `scripts/out/pages-${label}.png` });
  await page.close();
  server.close();
}

await probe('actions-source', 'dist', 4301);
await probe('branch-source', '.', 4302);

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
