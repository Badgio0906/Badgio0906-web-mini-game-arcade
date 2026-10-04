import { defineConfig } from '@playwright/test';
import base from '../../playwright.config';

// Candidate server/snapshot is supplied only after global freeze and exclusive review handoff.
export default defineConfig({
  ...base,
  testDir: '../e2e',
  testMatch: ['arcade-onboarding.spec.ts', 'arcade-unlimited.spec.ts', 'arcade-portal.spec.ts', 'arcade-revised-ux.spec.ts', 'game011.spec.ts'],
  outputDir: '../../artifacts/eleven-game-development',
  webServer: undefined,
  use: { ...base.use, baseURL: process.env.ELEVEN_ARCADE_URL ?? 'http://127.0.0.1:5173' },
});
