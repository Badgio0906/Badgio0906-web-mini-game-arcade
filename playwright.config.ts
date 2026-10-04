import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const containerChromium = '/usr/bin/chromium';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['arcade.spec.ts', 'game002.spec.ts', 'game003.spec.ts', 'game004.spec.ts', 'game005.spec.ts', 'game005-tutorial.spec.ts', 'game006.spec.ts', 'game007.spec.ts', 'game008.spec.ts', 'game009.spec.ts', 'game010.spec.ts'],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    launchOptions: {
      executablePath: chromiumPath ?? (existsSync(containerChromium) ? containerChromium : undefined),
      args: ['--no-sandbox'],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
    { name: 'mobile-portrait', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-landscape', use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
  ],
});
