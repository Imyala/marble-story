import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    // The dev entry lives at dev.html so the repo root stays free for the
    // published page — see the comment in index.html.
    rollupOptions: { input: 'dev.html' },
  },
  // strictPort keeps the dev URL predictable, which the root
  // index.html relies on to route developers to the live entry.
  server: { port: 5173, strictPort: true, host: true, open: '/dev.html' },
  // Emit \uXXXX escapes instead of raw UTF-8. The single-file artifact build
  // ships a document fragment with no <head>, so it cannot declare a charset;
  // ASCII-only output renders correctly whatever encoding the host assumes.
  esbuild: { charset: 'ascii' },
});
