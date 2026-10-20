import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { distributedGameCatalog } from './src/data/gameCatalog';

const htmlEntries = new Set(['index', 'about', 'privacy', 'analytics-admin',
  // Existing public preview of Game017; no publication change in this task.
  'game017-revision03', ...distributedGameCatalog.map(game => game.id)]);

// Physical HTML entries also work on refresh under a GitHub Pages repository path.
export default defineConfig({
  base: './',
  plugins: [{
    name: 'legacy-analytics-dev-entry',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url?.split('?')[0].endsWith('/analytics-legacy.js')) request.url = '/src/analytics/legacy.ts';
        if (request.url?.split('?')[0].endsWith('/legacy-records.js')) request.url = '/src/records/legacyEntry.ts';
        next();
      });
    },
  }],
  build: {
    rollupOptions: {
      input: {
        ...Object.fromEntries(readdirSync(process.cwd())
          .filter(file => file.endsWith('.html') && htmlEntries.has(file.slice(0, -5)))
          .map(file => [file.replace('.html', ''), resolve(process.cwd(), file)])),
        'legacy-records': resolve(process.cwd(), 'src/records/legacyEntry.ts'),
        'analytics-legacy': resolve(process.cwd(), 'src/analytics/legacy.ts'),
      },
      output: { entryFileNames: chunk => ['analytics-legacy','legacy-records'].includes(chunk.name) ? `${chunk.name}.js` : 'assets/[name]-[hash].js' },
    },
  },
});
