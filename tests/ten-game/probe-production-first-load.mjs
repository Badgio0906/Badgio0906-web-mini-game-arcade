import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Run only after the final build and all exclusive candidate browser gates close.
// Fresh contexts measure first-load unique resources; functional reload budgets remain separate.
const baseURL = process.env.ARCADE_PRODUCTION_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
try {
  for (let number = 1; number <= 10; number++) {
    const gameId = `game${String(number).padStart(3, '0')}`;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = []; const bodyJobs = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => errors.push(`${request.url()} ${request.failure()?.errorText}`));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      // Phaser transfers images through XHR before decoding local blob URLs. Count HTTP bodies once.
      if (!/^https?:/.test(response.url())) return;
      const requestedKind = response.request().resourceType();
      const mime = response.headers()['content-type'] ?? '';
      const kind = requestedKind === 'script' ? 'script' :
        requestedKind === 'font' || /^font\//.test(mime) || /\.woff2?(?:\?|$)/.test(response.url()) ? 'font' :
        requestedKind === 'image' || /^image\//.test(mime) ? 'image' : null;
      if (!kind) return;
      bodyJobs.push((async () => {
        const body = await response.body();
        return { url: response.url(), kind, status: response.status(), bodyBytes: body.length,
          phaserEngine: kind === 'script' && /WebGLRenderer|__PHASER__|Phaser v|Phaser\.Game/.test(body.toString('utf8')) };
      })().catch(error => { errors.push(`${response.url()} body ${error}`); return null; }));
    });
    try {
      await page.goto(`${baseURL}/${number === 1 ? 'index.html' : `${gameId}.html`}`);
      await page.locator('#play-button').waitFor({ state: 'visible' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.complete ? Promise.resolve() :
          new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); })));
      });
      await page.waitForLoadState('networkidle');
      const state = await page.evaluate(() => ({
        hooks: '__arcadeDebug' in window || '__orbitDebug' in window,
        fonts: [...document.fonts].map(font => ({ family: font.family, status: font.status })),
        resources: performance.getEntriesByType('resource').map(entry => {
          const resource = entry;
          return { url: resource.name, initiatorType: resource.initiatorType,
            encodedBodySize: resource.encodedBodySize, decodedBodySize: resource.decodedBodySize, transferSize: resource.transferSize };
        }),
        images: [...document.images].map(image => ({ src: image.currentSrc, complete: image.complete,
          width: image.naturalWidth, height: image.naturalHeight })),
      }));
      const unique = [...new Map((await Promise.all(bodyJobs)).filter(Boolean).map(resource => [resource.url, resource])).values()];
      const totals = Object.fromEntries(['script', 'image', 'font'].map(kind => {
        const resources = unique.filter(resource => resource.kind === kind);
        const timing = state.resources.filter(resource => resources.some(body => body.url === resource.url));
        return [kind, { count: resources.length, bodyBytes: resources.reduce((sum, resource) => sum + resource.bodyBytes, 0),
          encodedBodyBytes: timing.reduce((sum, resource) => sum + resource.encodedBodySize, 0),
          decodedBodyBytes: timing.reduce((sum, resource) => sum + resource.decodedBodySize, 0),
          transferBytes: timing.reduce((sum, resource) => sum + resource.transferSize, 0) }];
      }));
      const phaserPage = [1, 2, 3, 6].includes(number);
      assert.equal(state.hooks, false, `${gameId}: production diagnostics`);
      assert.deepEqual(errors, [], `${gameId}: runtime / HTTP errors`);
      assert.ok(unique.filter(resource => resource.kind === 'script').length > 0);
      assert.ok(totals.script.bodyBytes <= (phaserPage ? 2_000_000 : 300_000), `${gameId}: first-load script budget`);
      if (!phaserPage) assert.equal(unique.some(resource => resource.phaserEngine), false, `${gameId}: native page loads Phaser`);
      else assert.equal(unique.some(resource => resource.phaserEngine), true, `${gameId}: actual Phaser script body is loaded`);
      assert.ok(state.images.every(image => image.complete && image.width > 0 && image.height > 0), `${gameId}: loaded HTML images`);
      if (number === 1) assert.equal(totals.font.count, 0, 'Game001 retains system font');
      else {
        assert.ok(unique.some(resource => resource.kind === 'font' && resource.url.endsWith('/fonts/arcade-rounded-jp.woff2')));
        assert.ok(state.fonts.some(font => font.family.replaceAll('"', '').replaceAll("'", '') === 'Arcade Rounded' && font.status === 'loaded'));
      }
      records.push({ gameId, route: number === 1 ? 'index.html' : `${gameId}.html`, phaserPage, totals, unique, ...state, errors });
      console.log(`${gameId}: ${totals.script.bodyBytes} script / ${totals.image.bodyBytes} image / ${totals.font.bodyBytes} font bytes; errors 0`);
    } finally { await context.close(); }
  }
  await mkdir('docs/ten-game/QA', { recursive: true });
  await writeFile('docs/ten-game/QA/PRODUCTION_FIRST_LOAD_AUDIT.json', `${JSON.stringify({ checkedUtc: new Date().toISOString(), baseURL, records }, null, 2)}\n`);
} finally { await browser.close(); }
