import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

/** Game002 is separately proven against5174; remaining existing routes use the next immutable DEV snapshot. */
export default defineConfig({
  ...base,
  testDir: '../e2e',
  testMatch: ['arcade.spec.ts', 'game003.spec.ts', 'game004.spec.ts', 'game005.spec.ts', 'game005-tutorial.spec.ts'],
  webServer: undefined,
  use: { ...base.use, baseURL: 'http://127.0.0.1:5175' },
});
