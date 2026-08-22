/**
 * Packages the game into one self-contained HTML file.
 *
 * The Artifact host serves a single page with a strict CSP and no external
 * hosts, so the JS bundle has to be inlined rather than linked. The output is
 * a document fragment — no <html>/<head>/<body> — because the host supplies
 * that skeleton at publish time.
 */
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist/marble-story.html';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

await run('npx', ['vite', 'build']);

const assets = readdirSync('dist/assets');
const jsName = assets.find((f) => f.endsWith('.js'));
const cssName = assets.find((f) => f.endsWith('.css'));
if (!jsName) throw new Error('no JS bundle found in dist/assets');

// A literal </script> inside the bundle would close the inline tag early.
const js = readFileSync(join('dist/assets', jsName), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = cssName ? readFileSync(join('dist/assets', cssName), 'utf8') : '';

let html = readFileSync('scripts/artifact-shell.html', 'utf8');
html = html.replace('/*BUNDLE*/', () => js);
if (css) html = html.replace('</style>', `${css}\n</style>`);

// The fragment has no <head>, so it cannot declare a charset. Emitting pure
// ASCII means the page renders correctly whatever encoding the host assumes —
// otherwise arrows and dashes arrive as mojibake.
html = html.replace(/[\u0080-\uffff]/g, (ch) => `&#${ch.codePointAt(0)};`);

const nonAscii = html.match(/[^\x00-\x7f]/);
if (nonAscii) throw new Error(`output is not ASCII-only, found ${JSON.stringify(nonAscii[0])}`);

writeFileSync(OUT, html, 'ascii');
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`wrote ${OUT} (${kb} KB, self-contained, ASCII-only)`);
