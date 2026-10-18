/**
 * Execute the Game036's *standalone* Vite config during the normal PR unit suite.
 * This protects the handoff even when the reviewer has no Codex/Claude session.
 * The temporary dist is never published.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('Game036 pilot: standalone handoff build', () => {
  it('builds game036 and validates native Chromium input via the isolated HTTP server', () => {
    const syntax = spawnSync(process.execPath, ['--check', join(root, 'tests/game036/browser.mjs')], {cwd:root, encoding:'utf8', timeout:15000});
    expect(syntax.status, syntax.stderr).toBe(0);
    const temporary = mkdtempSync(join(tmpdir(), 'game036-pilot-vite-'));
    const output = join(temporary, 'dist');
    try {
      const run = spawnSync(
        process.execPath,
        [join(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'tests/game036/vite.config.mjs'],
        {cwd: root, env: {...process.env, GAME036_BUILD_DIR: output}, encoding: 'utf8', timeout: 60000},
      );
      expect(run.error?.message ?? '', run.stderr).toBe('');
      expect(run.status, [run.stdout, run.stderr].join('\n')).toBe(0);
      const html = join(output, 'game036.html');
      expect(existsSync(html)).toBe(true);
      const markup = readFileSync(html, 'utf8');
      expect(markup).toContain('TIMING PILOT');
      expect(markup).toContain('arcade-portal-return');
      expect(markup).toContain('arcade-navigation.css');
      const emitted = readdirSync(join(output, 'assets'));
      expect(emitted.some(name => name.endsWith('.js'))).toBe(true);
      expect(emitted.some(name => name.endsWith('.css'))).toBe(true);
      // Github-hosted Ubuntu runners have a system Chrome/Chromium. Use that
      // instead of downloading a browser or changing shared CI workflows.
      const browserPath = [
        process.env.CHROMIUM_EXECUTABLE_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
      ].find(path => path && existsSync(path));
      expect(browserPath, 'Native Chrome/Chromium required: do not mark browser QA as PASS if absent').toBeTruthy();
      const qaDir = join(temporary, 'browser-qa');
      const browserRun = spawnSync(
        process.execPath, [join(root, 'tests/game036/browser.mjs')],
        {
          cwd: root,
          env: {...process.env, CHROMIUM_EXECUTABLE_PATH: browserPath, GAME036_BUILD_DIR: output, GAME036_QA_OUT: qaDir},
          encoding: 'utf8',
          timeout: 120000,
        },
      );
      console.log('[Game036 native HTTP browser QA]', browserRun.stdout.trim());
      expect(browserRun.error?.message ?? '', browserRun.stderr).toBe('');
      expect(browserRun.status, [browserRun.stdout, browserRun.stderr].join('\\n')).toBe(0);
      const qa = JSON.parse(readFileSync(join(qaDir, 'REPORT.json'), 'utf8'));
      expect(qa.source).toBe('isolated Vite build, native Playwright input');
      expect(qa.errors).toEqual([]);
      expect(qa.total).toBe(84); // 21 real browser assertions x 4 viewports
      expect(qa.passed).toBe(qa.total);
      expect(qa.checks.every((item: {okay: boolean}) => item.okay)).toBe(true);
    } finally {
      rmSync(temporary, {recursive: true, force: true});
    }
  }, 160000);
});
