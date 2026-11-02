// Exercise every cue on the real compiled audio class; hooks are appended only to the test response.
import { chromium } from '@playwright/test';
import { serve } from '../game040/gaps-integration/serve.mjs';
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const out = 'docs/game060/gaps-se-20261102/QA';
const bank = JSON.parse(readFileSync('public/assets/game060/gaps-20261102/manifest.json', 'utf8'));
const shas = Object.fromEntries(Object.entries(bank.sounds).map(([cue, s]) => [s.sha256, cue]));
const server = await serve(resolve('dist'), 8487);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { scope: 'compiled-class test fixture, separate from normal gameplay acceptance', cases: [] };
try {
  for (const corrupt of [false, true]) {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.addInitScript(({ shas }) => {
        const sources = new Set(), cues = [], buffers = new WeakMap();
        let peak = 0, decoded = 0;
        const AC = AudioContext, decode = AC.prototype.decodeAudioData, create = AC.prototype.createBufferSource;
        AC.prototype.decodeAudioData = function(data) {
          const hash = crypto.subtle.digest('SHA-256', data.slice(0));
          return decode.call(this, data).then(async buffer => {
            buffers.set(buffer, shas[[...new Uint8Array(await hash)].map(v => v.toString(16).padStart(2, '0')).join('')]);
            decoded++; return buffer;
          });
        };
        AC.prototype.createBufferSource = function() {
          const source = create.call(this), start = source.start, stop = source.stop;
          source.start = function(...args) {
            cues.push(buffers.get(source.buffer) || 'fallback'); sources.add(source); peak = Math.max(peak, sources.size);
            source.addEventListener('ended', () => sources.delete(source)); return start.apply(this, args);
          };
          source.stop = function(...args) { if (!args.length) sources.delete(source); return stop.apply(this, args); };
          return source;
        };
        const oscillator = AC.prototype.createOscillator;
        AC.prototype.createOscillator = function() {
          const source = oscillator.call(this), start = source.start, stop = source.stop;
          source.start = function(...args) {
            cues.push('fallback'); sources.add(source); peak = Math.max(peak, sources.size);
            source.addEventListener('ended', () => sources.delete(source)); return start.apply(this, args);
          };
          source.stop = function(...args) { if (!args.length) sources.delete(source); return stop.apply(this, args); };
          return source;
        };
        Object.defineProperty(window, '__CUES__', { get: () => ({ cues: [...cues], decoded, active: sources.size, peak }) });
      }, { shas });
      if (corrupt) await page.route('**/reserve-*.wav', route => route.fulfill({ body: 'invalid WAV', contentType: 'audio/wav' }));
      await page.route('**/assets/game060-*.js', async route => {
        const response = await route.fetch(), body = await response.text();
        const source = ts.createSourceFile('compiled.js', body, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        let audioClass, variable;
        function findClass(node) {
          if (ts.isClassDeclaration(node) && node.members.some(m => m.name?.getText(source) === 'thunder')) audioClass = node.name.text;
          ts.forEachChild(node, findClass);
        }
        function findVariable(node) {
          if (ts.isVariableDeclaration(node) && node.initializer && ts.isNewExpression(node.initializer) && node.initializer.expression.getText(source) === audioClass) variable = node.name.getText(source);
          ts.forEachChild(node, findVariable);
        }
        findClass(source); findVariable(source); assert(variable, 'compiled Sfx instance');
        await route.fulfill({ response, body: `${body}\nwindow.__TEST_SFX__=${variable};` });
      });
      await page.goto('http://127.0.0.1:8487/games/thunder_booking/index.html');
      await page.locator('#btn-play').click();
      await page.waitForFunction(n => window.__CUES__.decoded === n, corrupt ? 12 : 13);
      if (corrupt) {
        await page.evaluate(() => window.__TEST_SFX__.reserve());
        assert.equal((await page.evaluate(() => window.__CUES__)).cues.at(-1), 'fallback');
        await page.evaluate(() => window.__TEST_SFX__.suspend());
        await page.waitForTimeout(30);
        assert.equal((await page.evaluate(() => window.__CUES__)).active, 0);
        report.cases.push({ corruptSample: true, originalFallback: true, stopped: true });
      } else {
        for (const [method, args] of [['reserve', []], ['reject', []], ['slotReady', []], ['thunder', [1]], ['thunder', [2]], ['thunder', [3]], ['thunder', [4]], ['thunder', [6]], ['miss', []], ['shield', []], ['bossHit', []], ['fanfare', []], ['fail', []]]) {
          await page.evaluate(({ method, args }) => window.__TEST_SFX__[method](...args), { method, args });
          await page.waitForTimeout(100);
        }
        let probe = await page.evaluate(() => window.__CUES__);
        for (const cue of Object.keys(bank.sounds)) assert(probe.cues.includes(cue), cue);
        await page.evaluate(() => window.__TEST_SFX__.stop());
        for (let i = 0; i < 40; i++) {
          await page.evaluate(() => window.__TEST_SFX__.thunder(6)); await page.waitForTimeout(18);
        }
        probe = await page.evaluate(() => window.__CUES__);
        assert(probe.peak <= 10);
        await page.evaluate(() => { window.__TEST_SFX__.muted = true; });
        assert.equal((await page.evaluate(() => window.__CUES__)).active, 0);
        await page.evaluate(() => { window.__TEST_SFX__.muted = false; window.__TEST_SFX__.thunder(6); window.__TEST_SFX__.close(); });
        assert.equal((await page.evaluate(() => window.__CUES__)).active, 0);
        report.cases.push({ all13Cues: true, played: [...new Set(probe.cues)], peakVoices: probe.peak, muteAndCloseStop: true });
      }
    } finally { await ctx.close(); }
  }
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
  writeFileSync(`${out}/all-cues.json`, JSON.stringify(report, null, 2)); console.log(report.status, report.error || report.cases.length);
}
