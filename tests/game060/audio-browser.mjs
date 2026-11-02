// Instrumentation belongs to the test page only; the production build exposes no audio controls.
import { chromium } from '@playwright/test';
import { serve } from '../game040/gaps-integration/serve.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = 'docs/game060/gaps-se-20261102/QA';
mkdirSync(output, { recursive: true });
const bank = JSON.parse(readFileSync('public/assets/game060/gaps-20261102/manifest.json', 'utf8'));
const shas = Object.fromEntries(Object.entries(bank.sounds).map(([cue, s]) => [s.sha256, cue]));
const taps = JSON.parse(readFileSync(`${output}/plan-predictive.json`, 'utf8'));
const server = await serve(resolve('dist'), 8486);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { cases: [], errors: [], external: [], scope: 'actual production build; mouse and keyboard across desktop/mobile viewports; audio instrumentation only in test' };

async function probe({ shas }) {
  const contexts = [], records = [], buffers = new WeakMap(), live = new Set(), meters = [];
  let decoded = 0, peakVoices = 0;
  const AC = window.AudioContext;
  const decode = AC.prototype.decodeAudioData;
  AC.prototype.decodeAudioData = function(bytes) {
    const digest = crypto.subtle.digest('SHA-256', bytes.slice(0));
    return decode.call(this, bytes).then(async buffer => {
      const hash = [...new Uint8Array(await digest)].map(v => v.toString(16).padStart(2, '0')).join('');
      buffers.set(buffer, shas[hash] || 'unknown'); decoded++; return buffer;
    });
  };
  const create = AC.prototype.createBufferSource;
  AC.prototype.createBufferSource = function() {
    if (!contexts.includes(this)) contexts.push(this);
    const source = create.call(this), start = source.start, stop = source.stop;
    source.start = function(...args) {
      const row = { cue: buffers.get(source.buffer) || 'fallback', duration: source.buffer?.duration, at: performance.now(), ended: false };
      records.push(row); live.add(source); peakVoices = Math.max(peakVoices, live.size);
      source.addEventListener('ended', () => { live.delete(source); row.ended = true; });
      return start.apply(this, args);
    };
    source.stop = function(...args) {
      if (!args.length || args[0] <= this.context.currentTime) live.delete(source);
      return stop.apply(this, args);
    };
    return source;
  };
  const compress = AC.prototype.createDynamicsCompressor;
  AC.prototype.createDynamicsCompressor = function() {
    const comp = compress.call(this), meter = this.createAnalyser();
    meter.fftSize = 1024; comp.connect(meter); meters.push(meter); return comp;
  };
  let signalPeak = 0;
  const sample = () => {
    for (const meter of meters) {
      const data = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(data);
      for (const v of data) signalPeak = Math.max(signalPeak, Math.abs(v));
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  Object.defineProperty(window, '__AUDIO_PROBE__', { get: () => ({ decoded, records: structuredClone(records), active: live.size, peakVoices, signalPeak, states: contexts.map(c => c.state) }) });
}

async function context(width, height, prefix = '', failed = false) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1000, isMobile: width < 600 });
  await ctx.addInitScript(probe, { shas });
  const page = await ctx.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
  await ctx.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') { report.external.push(url.href); return route.abort(); }
    if (failed && url.pathname.endsWith('.wav')) return route.abort();
    return route.continue();
  });
  await page.goto(`http://127.0.0.1:8486/${prefix}games/thunder_booking/index.html`);
  await page.locator('body[data-ready="1"]').waitFor();
  return { ctx, page };
}

async function tapLogical(page, x, y) {
  const box = await page.locator('#stage').boundingBox();
  await page.mouse.click(box.x + x*box.width/480, box.y + y*box.height/480);
}

try {
  for (const [width, height, prefix] of [[1280, 720, ''], [390, 844, ''], [320, 568, 'trial/'], [844, 390, '']]) {
    const { ctx, page } = await context(width, height, prefix);
    try {
      assert.equal(await page.evaluate(() => typeof window.__GAME__), 'undefined');
      await page.screenshot({ path: `${output}/${width}-title.jpg`, type: 'jpeg', quality: 80 });
      await page.locator('#btn-practice').click();
      await page.waitForFunction(() => window.__AUDIO_PROBE__.decoded === 13);
      await page.keyboard.press('Space');
      await tapLogical(page, 228, 160);
      await page.waitForTimeout(1000);
      await page.waitForFunction(() => window.__AUDIO_PROBE__.records.some(r => r.cue === 'thunderSix'));
      await page.screenshot({ path: `${output}/${width}-play.jpg`, type: 'jpeg', quality: 80 });
      // Pause cuts all audio. Resuming cannot replay the old impact tail.
      await page.keyboard.press('p');
      await page.waitForTimeout(80);
      assert.equal((await page.evaluate(() => window.__AUDIO_PROBE__)).active, 0);
      const before = (await page.evaluate(() => window.__AUDIO_PROBE__)).records.length;
      await page.locator('#btn-resume').click();
      await page.waitForTimeout(200);
      assert.equal((await page.evaluate(() => window.__AUDIO_PROBE__)).records.length, before);
      await page.keyboard.press('p'); await page.locator('#btn-quit').click();
      await page.locator('#btn-mute').click();
      await page.locator('#btn-practice').click();
      await page.keyboard.press('Space'); await tapLogical(page, 228, 160);
      await page.waitForTimeout(1100);
      assert.equal((await page.evaluate(() => window.__AUDIO_PROBE__)).records.length, before);
      await page.keyboard.press('p'); await page.locator('#btn-quit').click();
      await page.reload();
      assert.equal(await page.locator('#btn-mute').getAttribute('aria-pressed'), 'true');
      await page.locator('#btn-mute').click();
      await page.locator('#btn-practice').click();
      await page.waitForFunction(() => window.__AUDIO_PROBE__.decoded === 13);
      await page.keyboard.press('Space'); await tapLogical(page, 30, 390);
      await page.waitForFunction(() => window.__AUDIO_PROBE__.records.some(r => r.cue === 'miss'));
      const audio = await page.evaluate(() => window.__AUDIO_PROBE__);
      assert(audio.signalPeak > .005 && audio.signalPeak < 1);
      assert(audio.peakVoices <= 10);
      assert(!audio.records.some(r => ['unknown', 'fallback'].includes(r.cue)));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.keyboard.press('p'); await page.locator('#btn-quit').click();
      const link = page.locator('#title .portal-return'); await link.click();
      await page.waitForURL(`http://127.0.0.1:8486/${prefix}`);
      report.cases.push({ width, height, prefix, decoded: audio.decoded, signalPeak: audio.signalPeak, peakVoices: audio.peakVoices, reserveAndSix: true, pauseAndMute: true, mutePersisted: true, miss: true, return: true });
    } finally { await ctx.close(); }
  }
  // An actual 47-second run uses normal mouse input against the analytic plan.
  {
    const { ctx, page } = await context(1280, 720);
    try {
      await page.locator('#btn-play').click();
      await page.waitForFunction(() => window.__AUDIO_PROBE__.decoded === 13);
      await page.keyboard.press('Space'); const started = Date.now();
      for (const tap of taps) {
        const delay = tap.t - (Date.now() - started);
        if (delay > 0) await page.waitForTimeout(delay);
        await tapLogical(page, tap.x, tap.y);
      }
      await page.locator('#result:not([hidden])').waitFor({ timeout: 5000 });
      await page.waitForTimeout(1000);
      const audio = await page.evaluate(() => window.__AUDIO_PROBE__);
      assert.match(await page.locator('#result-title').innerText(), /定刻どおり/);
      for (const cue of ['reserve', 'thunderSix', 'slotReady', 'bossHit', 'fanfare']) assert(audio.records.some(r => r.cue === cue), cue);
      assert.equal(await page.locator('#result-rank').innerText(), 'S');
      await page.screenshot({ path: `${output}/full-run-result.jpg`, type: 'jpeg', quality: 85 });
      report.cases.push({ fullRun: true, rank: 'S', result: await page.locator('#result-body').innerText(), audio });
    } finally { await ctx.close(); }
  }
  {
    const { ctx, page } = await context(390, 844, '', true);
    try {
      await page.locator('#btn-practice').click(); await page.keyboard.press('Space');
      await tapLogical(page, 228, 160); await page.waitForTimeout(1100);
      assert((await page.evaluate(() => window.__AUDIO_PROBE__)).records.some(r => r.cue === 'fallback'));
      await page.keyboard.press('p'); await page.waitForTimeout(80);
      assert.equal((await page.evaluate(() => window.__AUDIO_PROBE__)).active, 0);
      report.cases.push({ offlineSamples: true, originalSynthesisWorks: true, pauseStopsFallback: true });
    } finally { await ctx.close(); }
  }
  assert.equal(report.errors.length, 0); assert.equal(report.external.length, 0);
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser.close(); await new Promise(resolve => server.close(resolve));
  writeFileSync(`${output}/browser.json`, JSON.stringify(report, null, 2));
  console.log(report.status, report.error || `${report.cases.length} cases`);
}
