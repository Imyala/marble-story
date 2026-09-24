/**
 * Builds the game, serves dist/ on a throwaway static server, drives the
 * real build through scripts/scenarios/smoke.mjs, and shuts down.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const ROOT = 'dist';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

if (!process.argv.includes('--no-build')) await run('npm', ['run', 'build']);

const server = createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  const rel = normalize(url === '/' ? '/index.html' : url).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, rel);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`serving ${ROOT} on http://localhost:${PORT}`);

let code = 0;
try {
  await run('node', ['scripts/play.mjs', 'smoke', `http://localhost:${PORT}/index.html`], { W: '800', H: '500' });
} catch {
  code = 1;
}
server.close();
process.exit(code);
