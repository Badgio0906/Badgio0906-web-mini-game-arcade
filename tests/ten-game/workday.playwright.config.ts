import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

/** Frozen per-candidate DEV snapshot: source edits for another game cannot hot-reload long milestone runs. */
export default defineConfig({
  ...base,
  testDir: '../e2e',
  testMatch: ['game002.spec.ts'],
  webServer: undefined,
  use: { ...base.use, baseURL: 'http://127.0.0.1:5174' },
});
