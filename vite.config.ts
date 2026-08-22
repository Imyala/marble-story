import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
  build: { target: 'es2022', outDir: 'dist' },
  // Emit \uXXXX escapes instead of raw UTF-8. The single-file artifact build
  // ships a document fragment with no <head>, so it cannot declare a charset;
  // ASCII-only output renders correctly whatever encoding the host assumes.
  esbuild: { charset: 'ascii' },
});
