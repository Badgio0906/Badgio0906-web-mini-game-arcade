import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({ ...base, use: { ...base.use, baseURL: process.env.BASE_URL ?? base.use?.baseURL }, webServer: process.env.BASE_URL ? undefined : base.webServer, testMatch: ['start-choices.spec.ts'], outputDir: 'test-results/start-choices', projects: [
  { name: 'choices-desktop', use: { viewport: { width: 1440, height: 900 } } },
  { name: 'choices-mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
] });
