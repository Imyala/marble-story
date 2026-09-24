import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    // The dev entry lives at dev.html so the repo root stays free for the
    // published landing page — see the comment in index.html.
    rollupOptions: { input: 'dev.html' },
    // three.js alone is ~600 kB minified; one chunk is the right shape for a
    // game that needs all of it before the first frame anyway.
    chunkSizeWarningLimit: 2000,
  },
  // strictPort keeps the dev URL predictable, which the root index.html
  // relies on to route developers to the live entry.
  server: { port: 5173, strictPort: true, host: true, open: '/dev.html' },
});
