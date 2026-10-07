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
        next();
      });
    },
  }],
  build: {
    rollupOptions: {
      input: {
        ...Object.fromEntries(readdirSync(process.cwd())
          .filter(file => /^(index|privacy|analytics-admin|game00[1-9]|game01[0156789]|game02[0-2])\.html$/.test(file))
          .map(file => [file.replace('.html', ''), resolve(process.cwd(), file)])),
        'analytics-legacy': resolve(process.cwd(), 'src/analytics/legacy.ts'),
      },
      output: { entryFileNames: chunk => chunk.name === 'analytics-legacy' ? 'analytics-legacy.js' : 'assets/[name]-[hash].js' },
    },
  },
});
