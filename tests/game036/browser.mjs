/**
 * Independent native-browser smoke for the intentionally unpublished Game036.
 *
 * Usage after npm ci and isolated build:
 *   GAME036_BUILD_DIR=<absolute output dir> GAME036_QA_OUT=<fresh output dir> node tests/game036/browser.mjs
 *
 * Uses only the isolated build output. Never posts scores, touches production,
 * changes the shared Vite config, or publishes a game.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';

const buildRoot = resolve(process.env.GAME036_BUILD_DIR || join(tmpdir(), 'game036-compiled'));
const qaRoot = resolve(process.env.GAME036_QA_OUT || join(tmpdir(), 'game036-pilot-browser-qa'));
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || undefined;
const checks = [];
const errors = [];
if (!existsSync(join(buildRoot, 'game036.html'))) {
  console.error('MISSING_BUILD: run the standalone Vite build before browser QA');
  process.exit(2);
}
mkdirSync(qaRoot, {recursive: true});

function record(name, okay, details = '') {
  checks.push({name, okay: !!okay, details: String(details).slice(0,500)});
  if (!okay) throw new Error(name + ': ' + details);
}
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png'};
const server = createServer((request, response) => {
  let candidate;
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    candidate = resolve(buildRoot, '.' + pathname);
    if (candidate !== buildRoot && !candidate.startsWith(buildRoot + sep)) throw Error('bad path');
    if (candidate === buildRoot) candidate = join(buildRoot,'game036.html');
    const bytes = readFileSync(candidate);
    response.writeHead(200, {'Content-Type':mime[extname(candidate)] || 'application/octet-stream','Cache-Control':'no-store'});
    response.end(bytes);
  } catch {
    response.writeHead(404); response.end('not found');
  }
});
await new Promise((ok,reject) => {server.once('error',reject);server.listen(0,'127.0.0.1',ok);});
const base = 'http://127.0.0.1:' + server.address().port;

async function runCase(browser, name, viewport, touch) {
  const context = await browser.newContext({viewport, hasTouch:touch, isMobile:touch, deviceScaleFactor:1});
  const page = await context.newPage();
  const writes = [], problems = [];
  page.on('pageerror', e => problems.push(String(e)));
  page.on('request', req => {if (req.method() !== 'GET') writes.push(req.method() + ' ' + req.url());});
  try {
    const response = await page.goto(base + '/game036.html', {waitUntil:'networkidle'});
    record(name + '.http', response?.status() === 200, response?.status());
    record(name + '.title', await page.locator('#app').getAttribute('data-screen') === 'title');
    record(name + '.game-link', await page.locator('a.arcade-portal-return').count() === 1);
    await page.locator('#play').click();
    record(name + '.start', await page.locator('#app').getAttribute('data-screen') === 'playing');
    const x1 = await page.locator('#marker').evaluate(e => parseFloat(e.style.left));
    await page.waitForTimeout(200);
    const x2 = await page.locator('#marker').evaluate(e => parseFloat(e.style.left));
    record(name + '.marker_moves', x2 > x1, x1 + ' -> ' + x2);
    await page.locator('#pause').click();
    record(name + '.pause', await page.locator('#app').getAttribute('data-screen') === 'paused');
    const paused = await page.locator('#marker').evaluate(e => parseFloat(e.style.left));
    await page.waitForTimeout(220);
    const frozen = await page.locator('#marker').evaluate(e => parseFloat(e.style.left));
    record(name + '.pause_freeze', Math.abs(paused-frozen) < .01);
    await page.locator('#resume').click();
    record(name + '.resume', await page.locator('#app').getAttribute('data-screen') === 'playing');
    await page.waitForTimeout(130);
    if (touch) await page.locator('#stage').tap();
    else await page.locator('#stage').press('Space');
    record(name + '.stop1', await page.locator('#app').getAttribute('data-screen') === 'round');
    record(name + '.result1', await page.locator('#results li').count() === 1);
    if (!touch) await page.locator('#stage').press('Space');
    record(name + '.no_duplicate', await page.locator('#results li').count() === 1);
    await page.locator('#next').click();
    record(name + '.round2', await page.locator('#round').innerText() === 'ROUND 2 / 3');
    if (touch) await page.locator('#stage').tap(); else await page.locator('#stage').click();
    await page.locator('#next').click();
    record(name + '.round3', await page.locator('#round').innerText() === 'ROUND 3 / 3');
    if (touch) await page.locator('#stage').tap(); else await page.locator('#stage').press('Space');
    record(name + '.finish', await page.locator('#app').getAttribute('data-screen') === 'result');
    record(name + '.three_scores', await page.locator('#results li').count() === 3);
    const score = Number(await page.locator('#score').innerText());
    record(name + '.score_bounds', Number.isInteger(score) && score >= 0 && score <= 3000, score);
    await page.screenshot({path:join(qaRoot, name + '-result.png'), fullPage:true});
    await page.locator('#retry').click();
    record(name + '.retry_reset', (await page.locator('#round').innerText()) === 'ROUND 1 / 3' &&
      (await page.locator('#score').innerText()) === '0' &&
      (await page.locator('#results li').count()) === 0 &&
      (await page.locator('#app').getAttribute('data-screen')) === 'playing');
    await page.evaluate(() => window.dispatchEvent(new Event('blur'))); // handler test; not a real tab switch
    record(name + '.blur_pauses', await page.locator('#app').getAttribute('data-screen') === 'paused');
    await page.locator('#title').click();
    await page.locator('#practice').click();
    if (touch) await page.locator('#stage').tap(); else await page.locator('#stage').press('Space');
    record(name + '.practice', await page.locator('#app').getAttribute('data-screen') === 'round' &&
      (await page.locator('#score').innerText()) === '0' &&
      (await page.locator('#results li').count()) === 0);
    record(name + '.no_runtime_errors', problems.length === 0, problems.join('; '));
    record(name + '.no_POST', writes.length === 0, writes.join('; '));
  } finally {
    await context.close();
  }
}

let exitCode = 0;
let browser;
try {
  browser = await chromium.launch({headless:true, executablePath, args:['--no-sandbox']});
  for (const [name,viewport,touch] of [
    ['desktop',{width:1280,height:720},false],
    ['phone',{width:390,height:844},true],
    ['narrow',{width:320,height:568},true],
    ['landscape',{width:844,height:390},true],
  ]) await runCase(browser, name, viewport, touch);
} catch (error) {
  errors.push(String(error));
  exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  const report = {
    source: 'isolated Vite build, native Playwright input',
    checkedAt: new Date().toISOString(),
    executablePath: executablePath || 'Playwright default',
    passed: checks.filter(c=>c.okay).length,
    total: checks.length,
    checks,
    errors,
    humanPlaytest: 'NOT_RUN',
    realMobileDevice: 'NOT_RUN',
    liveSite: 'NOT_DEPLOYED',
  };
  writeFileSync(join(qaRoot, 'REPORT.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,total:report.total,errors:report.errors,output:qaRoot}));
}
process.exitCode=exitCode;
