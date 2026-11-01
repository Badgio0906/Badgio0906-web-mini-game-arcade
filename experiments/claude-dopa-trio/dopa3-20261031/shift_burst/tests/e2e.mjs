// Browser QA on a built/extracted package via plain static HTTP, using real pointer/keyboard/touch
// events and Playwright's fake clock (deterministic game time). Not a Windows launcher test.
// usage: node tests/e2e.mjs <servedDir> <outDir> [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const [dirArg, outArg, portArg = '4870'] = process.argv.slice(2);
const root = resolve(dirArg); const out = resolve(outArg); mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const file = normalize(join(root, rel));
  try { const b = await readFile(file); res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); }
}).listen(Number(portArg), '127.0.0.1');
const url = `http://127.0.0.1:${portArg}/`;
const plan = JSON.parse(readFileSync(new URL('../qa/plan-optimal.json', import.meta.url), 'utf8'));
const report = { url, scope: 'static HTTP + Chromium headless + fake clock; NOT launcher/Windows/real device', checks: [] };
const check = (name, passed, detail) => { report.checks.push({ name, passed: !!passed, detail }); console.log(passed ? 'PASS' : 'FAIL', name, detail ?? ''); };
const BX = 60, BY = 62, CELL = 72, ROW_H = 62;

const browser = await chromium.launch();
async function open(viewport, touch = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.install();
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  // freeze natural time flow: game time advances only through clock.runFor
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
  const cdp = touch ? await ctx.newCDPSession(page) : null;
  return { ctx, page, errors, cdp };
}
async function toClient(page, x, y) { const b = await page.locator('#stage').boundingBox(); return { x: b.x + (x / 480) * b.width, y: b.y + (y / 480) * b.height }; }
async function mouseDrag(page, row, cells) {
  const a = await toClient(page, BX + 2.5 * CELL, BY + row * ROW_H + ROW_H / 2);
  const b = await toClient(page, BX + (2.5 + cells) * CELL, BY + row * ROW_H + ROW_H / 2);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 4 }); await page.mouse.up();
}
async function touchDrag(page, cdp, row, cells, cancel = false) {
  const a = await toClient(page, BX + 2.5 * CELL, BY + row * ROW_H + ROW_H / 2);
  const b = await toClient(page, BX + (2.5 + cells) * CELL, BY + row * ROW_H + ROW_H / 2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  for (let i = 1; i <= 4; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + ((b.x - a.x) * i) / 4, y: a.y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
}
const text = (page, sel) => page.locator(sel).innerText();
async function playPlan(page, dragFn, tapFn) {
  let elapsed = 0;
  for (const p of plan) {
    await page.clock.runFor(Math.max(0, p.t - elapsed)); elapsed = Math.max(elapsed, p.t);
    if (p.op === 'shift') await dragFn(p.row, p.d);
    else if (p.op === 'cannon') await tapFn(`[data-col="${p.col}"]`);
    else await tapFn('#btn-fire');
  }
  await page.clock.runFor(2500);
}

try {
  { // PC mouse: optimal plan with real drags → S; locked FIRE ignored; ±2 clamp; BEST persists
    const { ctx, page, errors } = await open({ width: 1280, height: 720 });
    await page.screenshot({ path: join(out, 'pc-title.png') });
    await page.locator('#btn-play').click();
    await page.clock.runFor(2000);
    const s = await toClient(page, 240, 200); await page.mouse.click(s.x, s.y);
    await page.screenshot({ path: join(out, 'pc-room1.png') });
    await playPlan(page, (r, d) => mouseDrag(page, r, d), sel => page.locator(sel).click());
    await page.screenshot({ path: join(out, 'pc-result.png') });
    const rank = await text(page, '#result-rank'); const body = await text(page, '#result-body');
    check('pc optimal plan via real drags → rank S, 6 full pierces, 19 steps', rank === 'S' && body.includes('6/6') && body.includes('19段'), { rank, body });
    await page.reload(); await page.waitForFunction(() => document.body.dataset.ready === '1'); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50)); // re-freeze after reload
    check('BEST persists across reload', /BEST [1-9]/.test(await text(page, '#title-best')), await text(page, '#title-best'));
    // locked fire + clamp + gear screenshot
    await page.locator('#btn-play').click(); await page.keyboard.press('Space');
    await page.clock.runFor(300);
    await mouseDrag(page, 0, 3.2); // over-drag → clamped to +2
    await page.locator('#btn-fire').click(); // within 120ms move lock → rejected
    await page.clock.runFor(60);
    check('fire during move lock is rejected (ammo unchanged)', (await text(page, '#btn-fire')).includes('残12'), await text(page, '#btn-fire'));
    await page.keyboard.press('Escape');
    check('pause overlay', await page.locator('#paused').isVisible());
    await page.locator('#btn-quit').click();
    check('pc no console errors', errors.length === 0, errors);
    await ctx.close();
  }
  { // keyboard-only full run: 1-4 rows, arrows, Q/E, Space
    const { ctx, page, errors } = await open({ width: 1280, height: 720 });
    await page.locator('#btn-play').click(); await page.keyboard.press('Space');
    let elapsed = 0, cannon = 2;
    for (const p of plan) {
      await page.clock.runFor(Math.max(0, p.t - elapsed)); elapsed = Math.max(elapsed, p.t);
      if (p.op === 'shift') { await page.keyboard.press(String(p.row + 1)); await page.keyboard.press(p.d > 0 ? 'ArrowRight' : 'ArrowLeft'); }
      else if (p.op === 'cannon') { while (cannon !== p.col) { await page.keyboard.press(p.col > cannon ? 'e' : 'q'); cannon += p.col > cannon ? 1 : -1; } }
      else await page.keyboard.press('Space');
    }
    await page.clock.runFor(2500);
    const rank = await text(page, '#result-rank');
    check('keyboard-only plan → rank S', rank === 'S', { rank, body: await text(page, '#result-body') });
    await page.locator('#btn-practice').count();
    await page.locator('#btn-to-title').click();
    await page.locator('#btn-practice').click(); await page.keyboard.press('Space');
    await page.clock.runFor(300);
    await page.keyboard.press('1'); await page.keyboard.press('ArrowRight'); await page.clock.runFor(200);
    await page.keyboard.press('3'); await page.keyboard.press('ArrowLeft'); await page.clock.runFor(200);
    await page.keyboard.press('Space'); await page.clock.runFor(2000);
    check('practice room 1 cleared in 2 moves', (await text(page, '#result-title')).includes('練習'), await text(page, '#result-body'));
    await page.locator('#btn-exit-2').click();
    check('preview exit screen', await page.locator('#exited').isVisible());
    check('kbd no console errors', errors.length === 0, errors);
    await ctx.close();
  }
  for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors, cdp } = await open(vp, true);
    await page.screenshot({ path: join(out, `touch-${vp.width}x${vp.height}-title.png`) });
    await page.locator('#btn-play').tap();
    const s = await toClient(page, 240, 200); await page.touchscreen.tap(s.x, s.y);
    // cancelled drag must not move anything
    await page.clock.runFor(200);
    await touchDrag(page, cdp, 0, 1, true);
    await page.clock.runFor(200);
    await page.screenshot({ path: join(out, `touch-${vp.width}x${vp.height}-play.png`) });
    let shotDone = false;
    await playPlan(page, (r, d) => touchDrag(page, cdp, r, d), async sel => {
      await page.locator(sel).tap();
      if (!shotDone && sel === '#btn-fire' && vp.width === 390) { shotDone = true; await page.clock.runFor(180); await page.screenshot({ path: join(out, 'phone-pierce.png') }); }
    });
    const rank = await text(page, '#result-rank'); const body = await text(page, '#result-body');
    check(`touch ${vp.width}x${vp.height}: cancelled drag ignored and plan → S`, rank === 'S' && body.includes('19段'), { rank, body });
    await page.screenshot({ path: join(out, `touch-${vp.width}x${vp.height}-result.png`) });
    for (const sel of ['[data-col="0"]', '#btn-fire', '#btn-pause']) {
      const b = await page.locator(sel).boundingBox();
      check(`touch ${vp.width}x${vp.height} ${sel} >= 44px & on screen`, b && b.height >= 44 && b.width >= 44 && b.y + b.height <= vp.height + 0.5 && b.x + b.width <= vp.width + 0.5, b);
    }
    check(`touch ${vp.width}x${vp.height} no console errors`, errors.length === 0, errors);
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
report.passed = report.checks.every(c => c.passed);
writeFileSync(join(out, 'e2e-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`E2E ${report.passed ? 'PASSED' : 'FAILED'} ${report.checks.filter(c => c.passed).length}/${report.checks.length}`);
process.exit(report.passed ? 0 : 1);
