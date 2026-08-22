/**
 * Post-build step.
 *
 * 1. Vite's entry is dev.html, so the emitted page is dist/dev.html. A web
 *    server needs it called index.html.
 * 2. Mirrors the built site into play/, which is committed.
 *
 * docs/ exists because GitHub Pages has two possible sources and this repo
 * must work under either. With the "GitHub Actions" source the workflow serves
 * dist/ directly. With the older "deploy from a branch" source GitHub instead
 * publishes the repo root through Jekyll, which cannot build anything — so the
 * root index.html forwards to play/, a copy that is already built.
 */
import { cpSync, existsSync, readdirSync, renameSync, rmSync } from 'node:fs';

/**
 * Everything this script is allowed to have put in the publish directory.
 * It is wiped and rewritten on every build, so refuse outright if it holds
 * anything else — an earlier version of this script pointed at docs/ and
 * deleted the design document that lived there.
 */
const GENERATED = new Set(['index.html', 'assets', 'marble-story.html', '.nojekyll']);
const PUBLISH_DIR = 'play';

if (existsSync('dist/dev.html')) {
  if (existsSync('dist/index.html')) rmSync('dist/index.html');
  renameSync('dist/dev.html', 'dist/index.html');
}

if (!existsSync('dist/index.html')) {
  throw new Error('dist/index.html missing — did the build emit a page?');
}

if (existsSync(PUBLISH_DIR)) {
  const unexpected = readdirSync(PUBLISH_DIR).filter((f) => !GENERATED.has(f));
  if (unexpected.length > 0) {
    throw new Error(
      `refusing to wipe ${PUBLISH_DIR}/ — it holds files this build did not generate: ` +
      `${unexpected.join(', ')}`,
    );
  }
  rmSync(PUBLISH_DIR, { recursive: true, force: true });
}
cpSync('dist', PUBLISH_DIR, { recursive: true });
console.log(`build finished: dist/index.html, mirrored to ${PUBLISH_DIR}/`);
