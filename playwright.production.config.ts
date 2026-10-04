import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  outputDir: 'production-test-results',
  testMatch: ['production.spec.ts', 'game002.production.spec.ts', 'game003.production.spec.ts', 'game004.production.spec.ts', 'game005.production.spec.ts', 'game006.production.spec.ts', 'game007.production.spec.ts', 'game008.production.spec.ts', 'game009.production.spec.ts', 'game010.production.spec.ts'],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4173' },
  projects: [{ name: 'production', use: { viewport: { width: 1366, height: 900 } } }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
