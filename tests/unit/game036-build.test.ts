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
  it('builds game036 with isolated Vite input and no shared config changes', () => {
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
    } finally {
      rmSync(temporary, {recursive: true, force: true});
    }
  }, 70000);
});
