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
const plan = JSON.parse(readFileSync(new URL('../qa/plan-reading.json', import.meta.url), 'utf8')).sort((a, b) => a.at - b.at);
const report = { url, scope: 'static HTTP + Chromium headless + fake clock; NOT launcher/Windows/real device', checks: [] };
const check = (name, passed, detail) => { report.checks.push({ name, passed: !!passed, detail }); console.log(passed ? 'PASS' : 'FAIL', name, detail ?? ''); };
const browser = await chromium.launch();
async function open(viewport, touch = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.install(); await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  // freeze natural time flow: game time advances only through clock.runFor
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
  return { ctx, page, errors };
}
const text = (page, sel) => page.locator(sel).innerText();
const keys = { in: 'qwe', out: 'asd' };
/** Button centres measured once; locator.click() actionability waits advance the fake clock, so the
 *  timed plan presses raw coordinates (still real pointer events on the real buttons). */
async function centres(page) {
  const m = {};
  for (const sel of ['in', 'out']) for (const v of [0, 1, 2]) { const b = await page.locator(`[data-sel="${sel}"][data-v="${v}"]`).boundingBox(); m[`${sel}${v}`] = { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
  return m;
}
/** Applies only changes (a real player would not re-press the selected button). */
async function playPlan(page, press, opts = {}) {
  let elapsed = 0; const cur = { in: 0, out: 0 }; let paused = false;
  for (const c of plan) {
    if (opts.pauseAt !== undefined && !paused && c.at > opts.pauseAt) {
      paused = true; await page.clock.runFor(opts.pauseAt - elapsed); elapsed = opts.pauseAt;
      await page.keyboard.press('Escape'); check('pause overlay', await page.locator('#paused').isVisible());
      await page.clock.runFor(7000); { const rb = await page.locator('#btn-resume').boundingBox(); await page.mouse.click(rb.x + rb.width / 2, rb.y + rb.height / 2); } // raw press: no actionability wait advancing the fake clock
    }
    if (cur[c.selector] === c.value) continue;
    await page.clock.runFor(Math.max(0, c.at - elapsed)); elapsed = Math.max(elapsed, c.at);
    await press(c.selector, c.value); cur[c.selector] = c.value;
    if (opts.shotAt && elapsed >= opts.shotAt && !opts.done) { opts.done = true; await page.clock.runFor(200); elapsed += 200; await page.screenshot({ path: join(out, `${opts.prefix}-play.png`) }); }
  }
  await page.clock.runFor(Math.max(0, 50000 - elapsed)); await page.clock.runFor(1500);
}
try {
  {
    const { ctx, page, errors } = await open({ width: 1280, height: 720 });
    await page.screenshot({ path: join(out, 'pc-title.png') });
    await page.locator('#btn-play').click(); await page.clock.runFor(2500);
    await page.screenshot({ path: join(out, 'pc-ready.png') });
    await page.keyboard.press('Space');
    const cm = await centres(page);
    await playPlan(page, (sel, v) => page.mouse.click(cm[sel + v].x, cm[sel + v].y), { shotAt: 17000, prefix: 'pc' });
    await page.screenshot({ path: join(out, 'pc-result.png') });
    const rank = await text(page, '#result-rank'); const body = await text(page, '#result-body');
    check('pc mouse buttons: reading plan rescues 60/60 → S', rank === 'S' && body.includes('60/60'), { rank, body });
    await page.reload(); await page.waitForFunction(() => document.body.dataset.ready === '1'); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50)); // re-freeze after reload
    check('BEST persists across reload', /BEST [1-9]/.test(await text(page, '#title-best')), await text(page, '#title-best'));
    await page.locator('#btn-play').click(); await page.keyboard.press('Space');
    await playPlan(page, (sel, v) => page.keyboard.press(keys[sel][v]), { pauseAt: 9000 });
    check('keyboard Q/W/E + A/S/D plan with 7s pause → still 60/60 (pause froze clock & flight)', (await text(page, '#result-body')).includes('60/60'), await text(page, '#result-body'));
    await page.locator('#btn-retry').click();
    check('retry → ready without reload', await page.locator('#ready').isVisible());
    check('pc no console errors', errors.length === 0, errors);
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await open({ width: 1280, height: 720 });
    const before = await text(page, '#title-best');
    await page.locator('#btn-practice').click(); await page.keyboard.press('Space');
    await page.clock.runFor(12000);
    const body = await text(page, '#result-body');
    check('practice: idle play rescues first wave (lane0/dock0) and ends', body.includes('5/10'), body);
    await page.locator('#btn-to-title').click();
    check('practice leaves BEST unchanged', (await text(page, '#title-best')) === before);
    await page.locator('#btn-exit').click();
    check('preview exit screen', await page.locator('#exited').isVisible());
    // rapid toggling: 80ms cooldown
    check('practice no console errors', errors.length === 0, errors);
    await ctx.close();
  }
  for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors } = await open(vp, true);
    await page.locator('#btn-play').tap();
    const bb = await page.locator('#stage').boundingBox(); await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 3);
    const cm = await centres(page);
    await playPlan(page, (sel, v) => page.touchscreen.tap(cm[sel + v].x, cm[sel + v].y), vp.width === 390 ? { shotAt: 25000, prefix: 'phone' } : {});
    const rank = await text(page, '#result-rank'); const body = await text(page, '#result-body');
    check(`touch ${vp.width}x${vp.height} taps → 60/60 S`, rank === 'S' && body.includes('60/60'), { rank, body });
    await page.screenshot({ path: join(out, `touch-${vp.width}x${vp.height}-result.png`) });
    for (const sel of ['[data-sel="in"][data-v="0"]', '[data-sel="out"][data-v="2"]', '#btn-pause']) {
      const b = await page.locator(sel).boundingBox();
      check(`touch ${vp.width}x${vp.height} ${sel} >= 44px & on screen`, b && b.height >= 44 && b.width >= 44 && b.y + b.height <= vp.height + 0.5 && b.x + b.width <= vp.width + 0.5, b);
    }
    const sb = await page.locator('#stage').boundingBox();
    check(`touch ${vp.width}x${vp.height} canvas fully on screen`, sb.x >= 0 && sb.y >= 0 && sb.x + sb.width <= vp.width + 0.5 && sb.y + sb.height <= vp.height + 0.5, sb);
    check(`touch ${vp.width}x${vp.height} no console errors`, errors.length === 0, errors);
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
report.passed = report.checks.every(c => c.passed);
writeFileSync(join(out, 'e2e-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`E2E ${report.passed ? 'PASSED' : 'FAILED'} ${report.checks.filter(c => c.passed).length}/${report.checks.length}`);
process.exit(report.passed ? 0 : 1);
