import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
          .filter(file => /^(index|privacy|analytics-admin|game00[1-9]|game01[0156789]|game02[0-9]|game03[012])\.html$/.test(file))
          .map(file => [file.replace('.html', ''), resolve(process.cwd(), file)])),
        'legacy-records': resolve(process.cwd(), 'src/records/legacyEntry.ts'),
        'analytics-legacy': resolve(process.cwd(), 'src/analytics/legacy.ts'),
      },
      output: { entryFileNames: chunk => ['analytics-legacy','legacy-records'].includes(chunk.name) ? `${chunk.name}.js` : 'assets/[name]-[hash].js' },
    },
  },
});
