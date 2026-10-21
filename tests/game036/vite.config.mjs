// Standalone build for the unregistered Game036 pilot (root vite.config.ts is a shared file and is not touched).
// Run from the repository root:
//   GAME036_BUILD_DIR=/tmp/game036-compiled npx vite build --config tests/game036/vite.config.mjs
import {defineConfig} from 'vite';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';

export default defineConfig({
  base: './',
  build: {
    outDir: process.env.GAME036_BUILD_DIR || join(tmpdir(), 'game036-compiled'),
    emptyOutDir: true,
    rollupOptions: {input: {game036: resolve(process.cwd(), 'game036.html')}},
  },
});
