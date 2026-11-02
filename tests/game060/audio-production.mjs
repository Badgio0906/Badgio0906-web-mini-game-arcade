import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const origin = 'https://game100garage.com';
const entry = `${origin}/games/thunder_booking/index.html`;
const out = 'docs/game060/gaps-se-20261102/QA';
const bank = JSON.parse(readFileSync('public/assets/game060/gaps-20261102/manifest.json', 'utf8'));
const report = { entry, verifiedAt: new Date().toISOString(), files: [], errors: [], external: [] };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const get = async url => { const r = await fetch(url, { cache: 'no-store' }); assert.equal(r.status, 200, url); return Buffer.from(await r.arrayBuffer()); };
let browser;
try {
  const html = (await get(entry)).toString('utf8');
  const localHtml = readFileSync('dist/games/thunder_booking/index.html', 'utf8');
  for (const pattern of [/src="([^"]+\.js)"/g, /href="([^"]+\.css)"/g]) {
    const paths = [...html.matchAll(pattern)].map(m => m[1]);
    for (const path of paths) {
      assert(localHtml.includes(path), `published entry uses expected bundle ${path}`);
      const remote = await get(new URL(path, entry));
      const local = readFileSync('dist/games/thunder_booking/'+path.replace(/^\.\//, ''));
      assert.equal(sha(remote), sha(local));
      if (path.endsWith('.js')) {
        assert(!remote.includes(Buffer.from('__TEST_SFX__')));
        assert(!remote.includes(Buffer.from('__AUDIO_PROBE__')));
        report.bundle = path;
      }
      report.files.push({ file: path, sha256: sha(remote), bytes: remote.length });
    }
  }
  for (const [cue, sound] of Object.entries(bank.sounds)) {
    const bytes = await get(new URL(`./assets/gaps-20261102/${sound.file}`, entry));
    assert.equal(sha(bytes), sound.sha256, cue);
    report.files.push({ cue, file: sound.file, sha256: sha(bytes), bytes: bytes.length });
  }
  const manifest = JSON.parse((await get(new URL('./assets/gaps-20261102/manifest.json', entry))).toString('utf8'));
  assert.deepEqual(manifest, bank);
  const trials = JSON.parse((await get(`${origin}/games/trial-build.json`)).toString('utf8'));
  assert.equal(trials.trialCount, 22);
  report.trialCount = trials.trialCount;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1280 ? 720 : 844 }, hasTouch: width === 390, isMobile: width === 390 });
    try {
      const page = await context.newPage();
      await page.addInitScript(({ expected }) => {
        const names = new WeakMap(), played = [], live = new Set(); let decoded = 0;
        const AC = AudioContext, decode = AC.prototype.decodeAudioData, create = AC.prototype.createBufferSource;
        AC.prototype.decodeAudioData = function(data) {
          const hash = crypto.subtle.digest('SHA-256', data.slice(0));
          return decode.call(this, data).then(async buffer => {
            const key = [...new Uint8Array(await hash)].map(v => v.toString(16).padStart(2, '0')).join('');
            names.set(buffer, expected[key] || 'unknown'); decoded++; return buffer;
          });
        };
        AC.prototype.createBufferSource = function() {
          const source = create.call(this), start = source.start, stop = source.stop;
          source.start = function(...args) { played.push(names.get(source.buffer) || 'fallback'); live.add(source); source.addEventListener('ended', () => live.delete(source)); return start.apply(this, args); };
          source.stop = function(...args) { if (!args.length) live.delete(source); return stop.apply(this, args); };
          return source;
        };
        Object.defineProperty(window, '__LIVE_AUDIO__', { get: () => ({ decoded, played: [...played], active: live.size }) });
      }, { expected: Object.fromEntries(Object.entries(bank.sounds).map(([cue, s]) => [s.sha256, cue])) });
      page.on('pageerror', error => report.errors.push(error.message));
      page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
      await context.route('**/*', route => {
        if (new URL(route.request().url()).hostname !== 'game100garage.com') { report.external.push(route.request().url()); return route.abort(); }
        return route.continue();
      });
      await page.goto(entry);
      assert.equal(await page.evaluate(() => typeof window.__GAME__), 'undefined');
      await page.locator('#btn-practice').click();
      await page.waitForFunction(() => window.__LIVE_AUDIO__.decoded === 13);
      // Touch begins the game on a phone-sized context; the next touch books a strike.
      const box = await page.locator('#stage').boundingBox();
      const tap = async (x, y) => width === 390 ? page.touchscreen.tap(box.x+x*box.width/480, box.y+y*box.height/480) : page.mouse.click(box.x+x*box.width/480, box.y+y*box.height/480);
      await tap(240, 230); await tap(228, 160);
      await page.waitForFunction(() => window.__LIVE_AUDIO__.played.includes('thunderSix'));
      await page.screenshot({ path: `${out}/published-${width}.jpg`, type: 'jpeg', quality: 85 });
      await page.locator('#btn-pause').click(); await page.waitForTimeout(50);
      const audio = await page.evaluate(() => window.__LIVE_AUDIO__);
      assert(audio.played.includes('reserve') && audio.played.includes('thunderSix'));
      assert.equal(audio.active, 0);
      report[width] = { audio, interaction: width === 390 ? 'real touchscreen tap' : 'mouse click', paused: true };
    } finally { await context.close(); }
  }
  assert.equal(report.errors.length, 0); assert.equal(report.external.length, 0);
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser?.close();
  writeFileSync(`${out}/publication.json`, JSON.stringify(report, null, 2));
  console.log(report.status, report.error || `${report.files.length} verified files; desktop and touchscreen playback`);
}
