/**
 * Post-build step.
 *
 * 1. Vite's entry is dev.html, so the emitted page is dist/dev.html. A web
 *    server needs it called index.html.
 * 2. Mirrors the built site into play/, which is committed. GitHub Pages has
 *    two possible sources and this repo must work under either: with the
 *    "GitHub Actions" source the workflow serves dist/ directly; with the
 *    older "deploy from a branch" source GitHub publishes the repo root, whose
 *    index.html forwards to play/.
 */
import { cpSync, existsSync, readdirSync, renameSync, rmSync } from 'node:fs';

// Everything this script may have put in the publish directory. It is wiped
// on every build, so refuse if it holds anything else.
const GENERATED = new Set(['index.html', 'assets', '.nojekyll']);
const PUBLISH_DIR = 'play';

if (existsSync('dist/dev.html')) {
  if (existsSync('dist/index.html')) rmSync('dist/index.html');
  renameSync('dist/dev.html', 'dist/index.html');
}
if (!existsSync('dist/index.html')) {
  throw new Error('dist/index.html missing: did the build emit a page?');
}

if (existsSync(PUBLISH_DIR)) {
  const unexpected = readdirSync(PUBLISH_DIR).filter((f) => !GENERATED.has(f));
  if (unexpected.length > 0) {
    throw new Error(`refusing to wipe ${PUBLISH_DIR}/: it holds files this build did not generate: ${unexpected.join(', ')}`);
  }
  rmSync(PUBLISH_DIR, { recursive: true, force: true });
}
cpSync('dist', PUBLISH_DIR, { recursive: true });
console.log(`build finished: dist/index.html, mirrored to ${PUBLISH_DIR}/`);
