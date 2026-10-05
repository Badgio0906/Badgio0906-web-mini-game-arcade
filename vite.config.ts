import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Physical HTML entries also work on refresh under a GitHub Pages repository path.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: Object.fromEntries(readdirSync(process.cwd())
        .filter(file => /^(index|game00[1-9]|game01[0156])\.html$/.test(file))
        .map(file => [file.replace('.html', ''), resolve(process.cwd(), file)])),
    },
  },
});
