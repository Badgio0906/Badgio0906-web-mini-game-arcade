// Standalone build for the C23 staging package. Not part of the root MPA build.
// BUILD_MODE=preview (default) → launcher playtest; BUILD_MODE=native → for later integration by Codex.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const mode = process.env.BUILD_MODE === 'native' ? 'native' : 'preview';

export default defineConfig({
  root,
  base: './',
  define: { __BUILD_MODE__: JSON.stringify(mode) },
  build: {
    outDir: `dist/${mode}`,
    emptyOutDir: true,
    assetsDir: 'assets/warp_rescue',
    assetsInlineLimit: 0,
    sourcemap: false,
    modulePreload: { polyfill: false },
  },
  test: { root, include: ['tests/**/*.test.ts'], environment: 'node' },
});
