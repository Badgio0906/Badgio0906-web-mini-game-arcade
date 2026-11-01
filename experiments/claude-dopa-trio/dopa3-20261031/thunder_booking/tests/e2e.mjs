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
const plan = JSON.parse(readFileSync(new URL('../qa/plan-predictive.json', import.meta.url), 'utf8'));
const report = { url, scope: 'static HTTP + Chromium headless + fake clock; NOT launcher/Windows/real device', checks: [] };
const check = (name, passed, detail) => { report.checks.push({ name, passed: !!passed, detail }); console.log(passed ? 'PASS' : 'FAIL', name, detail ?? ''); };

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
  return { ctx, page, errors };
}
async function toClient(page, x, y) {
  const b = await page.locator('#stage').boundingBox();
  return { x: b.x + (x / 480) * b.width, y: b.y + (y / 480) * b.height };
}
/** Plays the timed plan; elapsed game time is tracked through the fake clock. */
async function playPlan(page, taps, tapFn, opts = {}) {
  let elapsed = 0;
  for (const tap of taps) {
    if (opts.pauseAt !== undefined && elapsed <= opts.pauseAt && tap.t > opts.pauseAt) {
      await page.clock.runFor(opts.pauseAt - elapsed); elapsed = opts.pauseAt;
      await page.keyboard.press('Escape');
      check('pause overlay shows', await page.locator('#paused').isVisible());
      await page.clock.runFor(6000); // clock must not advance game time while paused
      { const rb = await page.locator('#btn-resume').boundingBox(); await page.mouse.click(rb.x + rb.width / 2, rb.y + rb.height / 2); } // raw press: no actionability wait advancing the fake clock
    }
    await page.clock.runFor(Math.max(0, tap.t - elapsed)); elapsed = Math.max(elapsed, tap.t);
    const c = await toClient(page, tap.x, tap.y);
    await tapFn(c);
    if (opts.shotAt === tap.t) { await page.clock.runFor(450); elapsed += 450; await page.screenshot({ path: join(out, `${opts.prefix}-pending.png`) }); await page.clock.runFor(470); elapsed += 470; await page.screenshot({ path: join(out, `${opts.prefix}-impact.png`) }); }
  }
  await page.clock.runFor(Math.max(0, 47000 - elapsed));
  await page.clock.runFor(1500);
}
const text = (page, sel) => page.locator(sel).innerText();

try {
  // 1. PC mouse: title → play → predictive plan → rank S, BEST saved, reload keeps BEST
  {
    const { ctx, page, errors } = await open({ width: 1280, height: 720 });
    await page.screenshot({ path: join(out, 'pc-title.png') });
    await page.locator('#btn-play').click();
    check('ready overlay before clock', await page.locator('#ready').isVisible());
    await page.clock.runFor(3000); // reading time must not consume game time
    const start = await toClient(page, 240, 160);
    await page.mouse.click(start.x, start.y); // starts the clock, never a reservation
    await playPlan(page, plan, c => page.mouse.click(c.x, c.y), { shotAt: plan[0].t, prefix: 'pc' });
    await page.screenshot({ path: join(out, 'pc-result.png') });
    check('pc result visible', await page.locator('#result').isVisible());
    const rank = await text(page, '#result-rank');
    const body = await text(page, '#result-body');
    check('pc predictive plan rank S through real mouse input', rank === 'S', { rank, body });
    check('pc thunder count equals plan length (start gesture not counted)', body.includes(`${plan.length}本`), body);
    await page.reload();
    await page.waitForFunction(() => document.body.dataset.ready === '1'); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50)); // re-freeze after reload
    const best = await text(page, '#title-best');
    check('BEST persists across reload', /BEST [1-9]/.test(best), best);
    // retry flow and pause: same plan after a 6s pause must still give S
    await page.locator('#btn-play').click();
    await page.keyboard.press('Space'); // keyboard start
    await playPlan(page, plan, c => page.mouse.click(c.x, c.y), { pauseAt: 2500 });
    check('pause froze game clock (plan still S after 6s pause)', (await text(page, '#result-rank')) === 'S', await text(page, '#result-body'));
    await page.locator('#btn-retry').click();
    check('retry returns to ready state without reload', await page.locator('#ready').isVisible());
    check('pc no console errors', errors.length === 0, errors);
    await ctx.close();
  }
  // 2. Keyboard-only practice: Space start, arrows move, Space reserves; BEST untouched
  {
    const { ctx, page, errors } = await open({ width: 1280, height: 720 });
    const before = await text(page, '#title-best');
    await page.locator('#btn-practice').click();
    await page.keyboard.press('Space');
    await page.keyboard.down('ArrowUp'); await page.clock.runFor(240); await page.keyboard.up('ArrowUp'); // ~70px up → y≈160
    await page.keyboard.press('Space');
    await page.keyboard.press('Space'); // within 120ms gap → rejected
    await page.clock.runFor(18000);
    const body = await text(page, '#result-body');
    check('keyboard practice: one reservation accepted (gap rejection works)', body.includes('1本'), body);
    check('practice result labelled', (await text(page, '#result-title')).includes('練習'));
    await page.locator('#btn-to-title').click();
    check('practice does not change BEST', (await text(page, '#title-best')) === before, { before });
    await page.locator('#btn-exit').click();
    check('preview exit stops and explains return', await page.locator('#exited').isVisible());
    check('kbd no console errors', errors.length === 0, errors);
    await ctx.close();
  }
  // 3. Phone portrait touch: same plan → S; narrow phones layout
  for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors } = await open(vp, true);
    await page.screenshot({ path: join(out, `touch-${vp.width}x${vp.height}-title.png`) });
    await page.locator('#btn-play').tap();
    const s = await toClient(page, 240, 300); await page.touchscreen.tap(s.x, s.y);
    await playPlan(page, plan, c => page.touchscreen.tap(c.x, c.y), vp.width === 390 ? { shotAt: plan[2].t, prefix: 'phone' } : {});
    const rank = await text(page, '#result-rank');
    await page.screenshot({ path: join(out, `touch-${vp.width}x${vp.height}-result.png`) });
    const box = await page.locator('#stage').boundingBox();
    const btn = await page.locator('#btn-retry').boundingBox();
    check(`touch ${vp.width}x${vp.height} plan rank S (no synthetic double input)`, rank === 'S', { rank, body: await text(page, '#result-body') });
    check(`touch ${vp.width}x${vp.height} canvas fully visible`, box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width + 0.5 && box.y + box.height <= vp.height + 0.5, box);
    check(`touch ${vp.width}x${vp.height} buttons >= 44px`, btn.height >= 44 && btn.width >= 44, btn);
    check(`touch ${vp.width}x${vp.height} no console errors`, errors.length === 0, errors);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
report.passed = report.checks.every(c => c.passed);
writeFileSync(join(out, 'e2e-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`E2E ${report.passed ? 'PASSED' : 'FAILED'} ${report.checks.filter(c => c.passed).length}/${report.checks.length}`);
process.exit(report.passed ? 0 : 1);
