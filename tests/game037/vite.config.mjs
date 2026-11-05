// Isolated Game037 build/preview. Does not touch the shared vite.config.ts.
// Only public/assets/game037/** and the read-only shared navbar files are
// staged as the public dir (copied, never edited), so the full public/ tree is not shipped.
//   build:   npx vite build --config tests/game037/vite.config.mjs
//   preview: npx vite preview --config tests/game037/vite.config.mjs --port 4937 --strictPort
//   dev:     npx vite --config tests/game037/vite.config.mjs --port 4937
import {defineConfig} from 'vite';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import fs from 'node:fs';

const root = process.cwd();
const outDir = process.env.GAME037_BUILD_DIR || join(tmpdir(), 'game037-dist');
const staged = process.env.GAME037_PUBLIC_DIR || join(tmpdir(), 'game037-public');

fs.rmSync(staged, {recursive: true, force: true});
fs.mkdirSync(join(staged, 'assets'), {recursive: true});
fs.cpSync(resolve(root, 'public/assets/game037'), join(staged, 'assets/game037'), {recursive: true});
for (const f of ['arcade-navigation.css', 'arcade-navigation.js']) fs.copyFileSync(resolve(root, 'public', f), join(staged, f));

export default defineConfig({
  base: './',
  publicDir: staged,
  server: {host: '127.0.0.1'},
  preview: {host: '127.0.0.1'},
  build: {outDir, emptyOutDir: true, rollupOptions: {input: {game037: resolve(root, 'game037.html')}}},
});
