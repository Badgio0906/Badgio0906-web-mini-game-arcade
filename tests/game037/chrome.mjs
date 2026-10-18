// Locate a Chromium for Game037 browser checks. Returns null when none is
// available so callers can report UNTESTED instead of a false PASS.
import {chromium} from '@playwright/test';
import fs from 'node:fs';

const candidates = [process.env.GAME037_CHROME, '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);

export async function launchChrome() {
  for (const executablePath of candidates) {
    if (!fs.existsSync(executablePath)) continue;
    try { return {browser: await chromium.launch({executablePath, headless: true, args: ['--no-sandbox']}), executablePath}; } catch { /* try next */ }
  }
  try { return {browser: await chromium.launch({headless: true}), executablePath: 'playwright-default'}; } catch { return null; }
}
