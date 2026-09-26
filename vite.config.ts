import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    // The dev entry lives at dev.html so the repo root stays free for the
    // published landing page — see the comment in index.html.
    rollupOptions: {
      input: 'dev.html',
      output: {
        // three.js gets a chunk of its own, so a game update does not make
        // players download it again (unless the game starts using parts of
        // three.js it did not before). Each realm (src/levels/index.ts loads
        // them on demand) lands in its own chunk automatically.
        manualChunks(id) {
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'three';
          return undefined;
        },
      },
    },
    // three.js alone is ~600 kB minified, and the game needs all of it
    // before the first frame anyway: a big chunk is the right shape for it.
    chunkSizeWarningLimit: 2000,
  },
  // strictPort keeps the dev URL predictable, which the root index.html
  // relies on to route developers to the live entry.
  server: { port: 5173, strictPort: true, host: true, open: '/dev.html' },
});
