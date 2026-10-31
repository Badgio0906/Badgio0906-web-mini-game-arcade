// Compiled root + repository-subpath content/navigation checks, with real UI clicks.
// No gameplay state/score/clock injection. No remote writes or ad requests.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { gameCatalog } from '../../src/data/gameCatalog.ts';
const base = process.env.QA_BASE || 'http://127.0.0.1:4922/';
const out = process.env.QA_OUT;
if (!out) throw new Error('QA_OUT must name a new evidence directory');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const report = { base, at: new Date().toISOString(), pages: [], checks: [], errors: [], blocked: [] };
const check = (value, name) => { report.checks.push({ name, pass: Boolean(value) }); assert(value, name); };
try {
  if (!process.argv.includes('--navigation-only')) {
  // Static guides remain useful without JS; all local links and fragments must resolve.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const links = new Set();
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const path of ['guide.html', ...gameCatalog.map(game => `guides/${game.id}.html`)]) {
      const response = await page.goto(new URL(path, base).href);
      check(response.status() === 200, `${path} ${width} HTTP200`);
      const view = await page.evaluate(() => ({
        overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth,
        h1: document.querySelectorAll('h1').length,
        body: document.body.innerText,
        links: [...document.querySelectorAll('a[href]')].map(a => a.href),
        brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
        primary: document.querySelector('.play-link')?.getBoundingClientRect().toJSON(),
      }));
      check(view.overflow <= 1 && view.h1 === 1 && !view.brokenImages.length, `${path} ${width} readable static content and image`);
      if (view.primary) check(view.primary.height >= 44 && view.primary.width >= 44 && view.primary.x >= 0 && view.primary.right <= width + 1, `${path} ${width} primary target`);
      for (const href of view.links) links.add(href);
      report.pages.push({ path, width, overflow: view.overflow, h1: view.h1 });
      if (['guide.html', 'guides/game015.html', 'guides/game038.html'].includes(path) && [1440, 390, 320].includes(width)) await page.screenshot({ path: `${out}/${path.replace(/[/.]/g, '-')}-${width}.png`, fullPage: true });
    }
  }
  for (const href of links) {
    const url = new URL(href);
    if (url.origin !== new URL(base).origin) continue;
    const response = await page.request.get(url.href);
    check(response.ok(), `${url.pathname} linked target exists`);
    if (url.hash) {
      await page.goto(url.href);
      check(await page.locator(`[id="${url.hash.slice(1)}"]`).count() === 1, `${url.pathname}${url.hash} fragment exists`);
    }
  }
  check((await page.request.get(new URL('guides/game031.html', base).href)).status() === 404, 'on-hold guide is absent');
  for (const id of ['026', '028', '029', '030', '031']) check((await page.request.get(new URL(`game${id}.html`, base).href)).status() === 404, `game${id} stays unpublished`);
  await context.close();
  }

  for (const prefix of ['', 'phase1/']) {
    const urlBase = new URL(prefix, base).href;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    // Consent is a test fixture only; all external requests remain blocked.
    await context.addInitScript(() => localStorage.setItem('game100garage:analytics-consent:v1', 'granted'));
    await context.route('**/*', route => {
      const request = route.request();
      if (new URL(request.url()).origin !== new URL(base).origin || !['GET', 'HEAD'].includes(request.method())) {
        report.blocked.push({ method: request.method(), url: request.url() });
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    const names = () => page.evaluate(() => JSON.parse(localStorage.getItem('web-mini-game-arcade:telemetry:v1') || '[]').map(event => event.name));
    await page.goto(new URL('index.html', urlBase).href);
    await page.locator('.game-guide-link').first().waitFor();
    check(await page.locator('.game-guide-link').count() === gameCatalog.length, `${prefix} every card has a guide`);
    await page.screenshot({ path: `${out}/portal-${prefix ? 'subpath' : 'root'}-390.png` });
    check(!(await names()).includes('game_launch'), `${prefix} no initial launch`);
    await page.locator('[data-game-id="game001"] .game-guide-link').tap();
    await page.waitForURL('**/guides/game001.html');
    check(!(await names()).includes('game_launch'), `${prefix} reading guide does not count as game launch`);
    await page.locator('.play-link').tap();
    await page.waitForURL('**/game001.html');
    await page.locator('#play-button').waitFor();
    check(await page.locator('#play-button').isVisible(), `${prefix} guide CTA reaches real game title`);
    await page.goto(new URL('index.html', urlBase).href);
    await page.locator('[data-game-id="game001"] .game-play').tap();
    await page.waitForURL('**/game001.html');
    check((await names()).filter(name => name === 'game_launch').length === 1, `${prefix} direct PLAY retains exactly one launch`);
    check((await names()).filter(name => name === 'game_card_click').length === 1, `${prefix} direct PLAY retains exactly one card click`);
    await context.close();
  }
  check(!report.errors.length, 'no page errors in the navigation flows');
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`${out}/BROWSER.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pages: report.pages.length, checks: report.checks.length, failed: report.checks.filter(check => !check.pass), errors: report.errors, failure: report.failure }));
}
