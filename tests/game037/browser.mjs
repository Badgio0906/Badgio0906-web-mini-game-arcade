// Game037 real-browser QA. Builds the isolated Vite page, serves it over local
// HTTP (vite preview) and plays it with real mouse / touch / keyboard events.
// Solutions come from the pure model's solver (loaded through Vite SSR); the
// page is never mutated by a test hook.
//   node tests/game037/browser.mjs            (writes docs/game037/QA/browser-<time>/)
//   GAME037_REPORT=dir node tests/game037/browser.mjs
import {build, preview, createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {launchChrome} from './chrome.mjs';

const configFile = 'tests/game037/vite.config.mjs';
const dir = process.env.GAME037_REPORT || `docs/game037/QA/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.mkdirSync(dir, {recursive: true});
const BEST_KEY = 'web-mini-arcade:v1:game037:best:rules1';
const MUTE_KEY = 'web-mini-arcade:v1:game037:mute';
const report = {started_at: new Date().toISOString(), chrome: null, base: null, checks: [], viewports: [], status: 'RUNNING'};
const write = () => fs.writeFileSync(path.join(dir, 'RESULTS.json'), JSON.stringify(report, null, 2) + '\n');

const chrome = await launchChrome();
if (!chrome) {
  report.status = 'UNTESTED';
  report.reason = 'No Chromium executable found; browser QA not executed.';
  write();
  console.log('UNTESTED: no Chromium');
  process.exit(2);
}
report.chrome = chrome.executablePath;

await build({configFile, logLevel: 'warn'});
const ssr = await createServer({configFile, server: {middlewareMode: true}, appType: 'custom', logLevel: 'error', optimizeDeps: {noDiscovery: true, entries: []}});
const model = await ssr.ssrLoadModule('/src/games/game037/model.ts');
await ssr.close();
const server = await preview({configFile, preview: {port: 4937, strictPort: false}, logLevel: 'warn'});
const base = server.resolvedUrls.local[0].replace(/\/$/, '');
report.base = base;

const solutions = model.STAGES.map(s => model.solveStage(s)[0]);
const practiceSolution = model.solveStage(model.PRACTICE_STAGE)[0];

let current = '';
const check = (ok, name, detail) => {
  report.checks.push({viewport: current, name, ok: !!ok, ...(detail === undefined ? {} : {detail})});
  if (!ok) throw new Error(`${current}: ${name}${detail === undefined ? '' : ' ' + JSON.stringify(detail)}`);
};

const VIEWPORTS = [
  {name: 'desktop', width: 1280, height: 720, touch: false, plan: ['drag', 'keyboard', 'drag', 'keyboard', 'click', 'drag']},
  {name: 'phone', width: 390, height: 844, touch: true, mobile: true, plan: ['tap', 'touchdrag', 'tap', 'touchdrag', 'tap', 'tap']},
  {name: 'narrow', width: 320, height: 568, touch: true, mobile: true, reducedMotion: 'reduce', plan: ['tap', 'tap', 'touchdrag', 'tap', 'tap', 'tap']},
  {name: 'landscape', width: 844, height: 390, touch: true, plan: ['drag', 'tap', 'keyboard', 'drag', 'tap', 'drag']},
];

async function play(vp) {
  current = vp.name;
  const ctx = await chrome.browser.newContext({viewport: {width: vp.width, height: vp.height}, hasTouch: vp.touch, isMobile: !!vp.mobile, reducedMotion: vp.reducedMotion ?? 'no-preference'});
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('request', r => requests.push({method: r.method(), url: r.url()}));
  const cdp = vp.touch ? await ctx.newCDPSession(page) : null;
  const shot = name => page.screenshot({path: path.join(dir, `${vp.name}-${name}.png`)});
  const expected = {rotates: [], undos: []};

  const rot = id => page.locator(`.slot[data-id="${id}"]`).getAttribute('data-rotation').then(Number);
  const placedAt = id => page.locator(`.placed[data-id="${id}"]`).evaluate(el => el.hidden ? null : {x: +el.dataset.x, y: +el.dataset.y});
  const gridBox = () => page.locator('#grid').boundingBox();
  const center = async sel => { const b = await page.locator(sel).boundingBox(); return {x: b.x + b.width / 2, y: b.y + b.height / 2}; };
  const status = () => page.locator('#status').innerText();
  const hudNum = id => page.locator('#' + id).innerText().then(Number);
  const isPlacedCount = () => page.locator('#grid .placed:not([hidden])').count();

  async function ensureSelected(method, id) {
    const slot = page.locator(`.slot[data-id="${id}"]`);
    if ((await slot.getAttribute('aria-pressed')) === 'true') return;
    if (method === 'tap') await slot.tap(); else await slot.click();
  }
  async function rotateWith(method, id, target) {
    let n = 0;
    while ((await rot(id)) !== target) {
      if (method === 'keyboard') await page.keyboard.press('r');
      else if (method === 'tap' || method === 'touchdrag') await page.locator('#rotate').tap();
      else await page.locator('#rotate').click();
      if (++n > 4) throw new Error('rotation did not converge');
    }
    return n;
  }
  async function dropPoint(p) {
    const g = await gridBox(), cell = g.width / 4;
    const {w, h} = model.cellBounds(model.shapeCells(p.shape, p.rotation));
    return {x: g.x + (p.x + w / 2) * cell, y: g.y + (p.y + h / 2) * cell};
  }
  async function cellCenter(cx, cy) {
    const g = await gridBox(), cell = g.width / 4;
    return {x: g.x + (cx + 0.5) * cell, y: g.y + (cy + 0.5) * cell};
  }
  async function touchDrag(from, to, {cancel = false} = {}) {
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: from.x, y: from.y}]});
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: from.x + (to.x - from.x) * i / 10, y: from.y + (to.y - from.y) * i / 10}]});
    await cdp.send('Input.dispatchTouchEvent', {type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: []});
  }
  async function mouseDrag(from, to, mid) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, {steps: 12});
    if (mid) await mid();
    await page.mouse.up();
  }

  /** Place one dish via a given input path and verify the model result shown in the DOM. */
  async function place(method, p, stageIdx) {
    const index = (await page.locator('.slot').evaluateAll(els => els.map(e => e.dataset.id))).indexOf(p.id);
    let rotations = 0;
    if (method === 'keyboard') {
      await page.keyboard.press(String(index + 1));
      rotations = await rotateWith('keyboard', p.id, p.rotation);
      for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); }
      for (let i = 0; i < p.x; i++) await page.keyboard.press('ArrowRight');
      for (let i = 0; i < p.y; i++) await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    } else if (method === 'tap' || method === 'click') {
      const [fx, fy] = model.shapeCells(p.shape, p.rotation)[0];
      await ensureSelected(method, p.id);
      if (method === 'tap') check(await page.locator('.cell.ok, .cell.ng').count() === 0, 'touch tap selection is not treated as keyboard (no cursor preview)');
      rotations = await rotateWith(method, p.id, p.rotation);
      const c = await cellCenter(p.x + fx, p.y + fy);
      if (method === 'tap') await page.touchscreen.tap(c.x, c.y); else await page.mouse.click(c.x, c.y);
    } else {
      // Select and rotate first, then drag from the tray art centre.
      const sel = `.slot[data-id="${p.id}"]`;
      await ensureSelected(method === 'touchdrag' ? 'tap' : 'click', p.id);
      rotations = await rotateWith(method, p.id, p.rotation);
      const from = await center(`${sel} .food`), to = await dropPoint(p);
      if (method === 'touchdrag') await touchDrag(from, to);
      else await mouseDrag(from, to, stageIdx === 0 && vp.name === 'desktop' && !fs.existsSync(path.join(dir, 'desktop-drag-preview.png')) ? () => shot('drag-preview') : null);
    }
    expected.rotates[stageIdx] = (expected.rotates[stageIdx] ?? 0) + rotations;
    const at = await placedAt(p.id);
    check(at && at.x === p.x && at.y === p.y, `stage${stageIdx + 1} ${method} places ${p.id}`, {at, want: {x: p.x, y: p.y}});
  }

  try {
    await page.goto(base + '/game037.html');
    await page.waitForLoadState('networkidle');
    check(await page.locator('#app').getAttribute('data-screen') === 'title', 'opens on title');
    check(await page.evaluate(() => Object.keys(window).filter(k => /game037|__bento/i.test(k)).length === 0), 'no global diagnostic hook in production build');
    const otherKeyBefore = await page.evaluate(() => { localStorage.setItem('web-mini-arcade:v1:game035:state', 'sentinel'); return Object.keys(localStorage).sort(); });
    await shot('title');
    // portal link and 44px header controls
    const portal = page.locator('#portal-link');
    check((await portal.getAttribute('href')) === './index.html', 'portal return link present');
    for (const sel of ['#portal-link', '#mute', '#start', '#practice-start', '#help-open']) {
      const b = await page.locator(sel).boundingBox();
      check(b.height >= 44 && b.width >= 44, `44px ${sel}`, b);
    }
    // help
    await page.locator('#help-open').click();
    check(await page.locator('#dialog').evaluate(d => d.open), 'help dialog opens');
    await shot('help');
    await page.locator('#help-close').click();

    // ---------------- practice (isolated)
    await page.locator('#practice-start').click();
    check((await page.locator('#hud-stage').innerText()).includes('練習'), 'practice labelled');
    for (const p of practiceSolution) await place(vp.touch ? 'tap' : 'click', p, 99);
    check(!(await page.locator('#clear-panel').isHidden()), 'practice completion message');
    check(await page.locator('.cell.ok, .cell.ng').count() === 0, 'no placement preview left on the finished box');
    check((await page.locator('#clear-title').innerText()).includes('練習達成'), 'practice says achieved');
    await shot('practice-clear');
    check(await page.evaluate(k => localStorage.getItem(k), BEST_KEY) === null, 'practice wrote no BEST');
    await page.locator('#practice-again').click();
    check(await isPlacedCount() === 0, 'practice repeatable from an empty board');
    await page.locator('#pause').click();
    await page.locator('#pause-title').click();
    check(await page.locator('#app').getAttribute('data-screen') === 'title', 'practice exits to title');

    // ---------------- production run
    await page.locator('#start').click();
    check(await page.locator('#hud-stage').innerText() === '弁当 1 / 6', 'run starts at stage 1');
    for (const sel of ['#pause', '#rotate', '#deselect', '.slot >> nth=0', '.slot >> nth=3']) {
      const b = await page.locator(sel).boundingBox();
      check(b.height >= 44 && b.width >= 44, `44px ${sel}`, b);
    }
    const gb = await gridBox();
    check(gb.x >= 0 && gb.y >= 0 && gb.x + gb.width <= vp.width && gb.y + gb.height <= vp.height, 'box fully inside viewport', gb);
    const trayBox = await page.locator('#tray').boundingBox();
    check(trayBox.x >= 0 && trayBox.x + trayBox.width <= vp.width && trayBox.y + trayBox.height <= vp.height + 1, 'tray fully inside viewport', trayBox);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');

    for (let s = 0; s < 6; s++) {
      const sol = solutions[s];
      const method = vp.plan[s];
      if (s === 0) {
        // Illegal drops: out of bounds, then overlap — rejected, no penalty.
        // Vertical I dropped one row low sticks out of the box.
        const out = {shape: 'I', id: 'I1', rotation: 0, x: 0, y: 1};
        if (vp.touch) await touchDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(out));
        else await mouseDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(out));
        check(await placedAt('I1') === null, 'out-of-box drop rejected');
        check((await status()).includes('はみ出'), 'out-of-box reason shown');
        // Place I1 legally at (0,0), then try O1 on top of it.
        const legal = {shape: 'I', id: 'I1', rotation: 0, x: 0, y: 0};
        if (vp.touch) await touchDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(legal));
        else await mouseDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(legal));
        check(JSON.stringify(await placedAt('I1')) === '{"x":0,"y":0}', 'legal drop placed once');
        await page.waitForTimeout(150);
        check(await isPlacedCount() === 1, 'no double placement from the click after drag');
        const before = await hudNum('hud-stage-score');
        const onTop = {shape: 'O', id: 'O1', rotation: 0, x: 0, y: 1};
        if (vp.touch) await touchDrag(await center('.slot[data-id="O1"] .food'), await dropPoint(onTop));
        else await mouseDrag(await center('.slot[data-id="O1"] .food'), await dropPoint(onTop));
        check(await placedAt('O1') === null, 'overlapping placement rejected');
        check((await status()).includes('重な'), 'overlap reason shown');
        // Undo: tap the placed dish to take it out (counts 1 removal).
        const pc = await center('.placed[data-id="I1"]');
        if (vp.touch) await page.touchscreen.tap(pc.x, pc.y); else await page.mouse.click(pc.x, pc.y);
        check(await placedAt('I1') === null, 'placed dish removed by tap');
        check(await page.locator('.slot[data-id="I1"]').getAttribute('aria-pressed') === 'true', 'removed dish becomes selected');
        const after = await hudNum('hud-stage-score');
        check(before - after >= 50, 'removal penalty visible in live stage score', {before, after});
        expected.undos[0] = 1;
        if (vp.touch) {
          // pointercancel mid-drag never places.
          await touchDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(legal), {cancel: true});
          check(await placedAt('I1') === null, 'touch pointercancel does not place');
        }
        await shot('play-rejected');
      }
      if (s === 1) {
        // Held R: only the first keydown rotates (repeat ignored).
        await page.keyboard.press('1');
        const r0 = await rot('O1');
        await page.keyboard.down('r'); await page.keyboard.down('r'); await page.keyboard.down('r'); await page.keyboard.up('r');
        check((await rot('O1')) === (r0 + 1) % 4, 'held R rotates once', {r0, r1: await rot('O1')});
        expected.rotates[1] = 1;
        await page.keyboard.press('Escape');
        // Pause freezes the clock and blocks input.
        await page.locator('#pause').click();
        const t0 = await hudNum('hud-time');
        await page.waitForTimeout(1300);
        check(await hudNum('hud-time') === t0, 'pause freezes time');
        await shot('pause');
        await page.locator('#resume').click();
        // Blur mid-drag releases the drag and pauses; nothing is placed.
        if (!vp.touch) {
          const p = sol[0];
          const sel = `.slot[data-id="${p.id}"]`;
          await page.mouse.move(...Object.values(await center(`${sel} .food`)));
          await page.mouse.down();
          const to = await dropPoint({...p, rotation: await rot(p.id)});
          await page.mouse.move(to.x, to.y, {steps: 6});
          await page.evaluate(() => window.dispatchEvent(new Event('blur')));
          await page.mouse.up();
          check(await placedAt(p.id) === null, 'blur mid-drag places nothing');
          check(await page.locator('#dialog').evaluate(d => d.open), 'blur auto-pauses');
          await page.evaluate(() => window.dispatchEvent(new Event('focus')));
          await page.locator('#resume').click();
        }
        // document.hidden (simulated visibility change) auto-pauses.
        await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true}); document.dispatchEvent(new Event('visibilitychange')); });
        check(await page.locator('#dialog').evaluate(d => d.open), 'hidden auto-pauses');
        const th = await hudNum('hud-time');
        await page.waitForTimeout(1100);
        check(await hudNum('hud-time') === th, 'hidden freezes time');
        await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
        await page.locator('#resume').click();
        // Escape (nothing selected) pauses; holding it must not close the menu it opened.
        await page.keyboard.down('Escape'); await page.keyboard.down('Escape'); await page.keyboard.up('Escape');
        check(await page.locator('#dialog').evaluate(d => d.open), 'held Escape keeps pause open');
        await page.keyboard.press('Escape');
        check(!(await page.locator('#dialog').evaluate(d => d.open)), 'fresh Escape resumes');
      }
      for (const p of sol) await place(method, p, s);
      check(!(await page.locator('#clear-panel').isHidden()), `stage ${s + 1} cleared`);
      check(await page.locator('#menu-items li.done').count() === s + 1, `menu board marks ${s + 1} finished`);
      const frozen = await hudNum('hud-time');
      await page.waitForTimeout(1100);
      check(await page.locator('#hud-stage').innerText() === `弁当 ${s + 1} / 6`, `stage ${s + 1} does not auto-advance`);
      check(await hudNum('hud-time') === frozen, `stage ${s + 1} clock stopped at clear`);
      if (s === 0 || s === 5) await shot(`stage${s + 1}-clear`);
      await page.locator('#next').click();
    }
    check(await page.locator('#app').getAttribute('data-screen') === 'result', 'six stages reach result');
    await shot('result');
    const rows = await page.locator('#result-rows tr').evaluateAll(trs => trs.map(tr => [...tr.children].map(td => td.textContent)));
    check(rows.length === 6, 'six result rows');
    rows.forEach((r, i) => {
      check(Number(r[2]) === (expected.rotates[i] ?? 0), `stage ${i + 1} rotation count matches inputs`, {shown: r[2], expected: expected.rotates[i] ?? 0});
      check(Number(r[3]) === (expected.undos[i] ?? 0), `stage ${i + 1} removal count matches inputs`, {shown: r[3], expected: expected.undos[i] ?? 0});
      const secs = parseInt(r[1], 10);
      check(Number(r[4]) === Math.max(0, 1000 - 3 * secs - 20 * Number(r[2]) - 50 * Number(r[3])), `stage ${i + 1} score formula`, r);
    });
    const total = Number(await page.locator('#result-total').innerText());
    check(total === rows.reduce((n, r) => n + Number(r[4]), 0) && total >= 0 && total <= 6000, 'total is the sum, 0..6000', total);
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), BEST_KEY);
    check(saved && saved.best === total, 'BEST saved after complete run', saved);
    check((await page.locator('#result-best').innerText()).includes('NEW BEST'), 'NEW BEST shown');
    const keysAfter = await page.evaluate(() => Object.keys(localStorage).sort());
    check(JSON.stringify(keysAfter.filter(k => !otherKeyBefore.includes(k))) === JSON.stringify([BEST_KEY]) || JSON.stringify(keysAfter.filter(k => !otherKeyBefore.includes(k)).sort()) === JSON.stringify([BEST_KEY, MUTE_KEY].sort()), 'only game037 keys written', keysAfter);
    check(await page.evaluate(() => localStorage.getItem('web-mini-arcade:v1:game035:state')) === 'sentinel', 'other game storage untouched');

    // retry: a new run, nothing carried over
    await page.locator('#retry').click();
    check(await page.locator('#hud-stage').innerText() === '弁当 1 / 6', 'retry restarts stage 1');
    check(await hudNum('hud-total') === 0, 'retry total 0');
    check(await isPlacedCount() === 0 && (await page.locator('.slot.selected').count()) === 0, 'retry has no placed/selected dishes');
    // mute persists
    await page.locator('#mute').click();
    check(await page.evaluate(k => localStorage.getItem(k), MUTE_KEY) === '1', 'mute saved');
    await page.reload();
    check((await page.locator('#mute').innerText()).includes('OFF'), 'mute restored after reload');
    check(Number(await page.locator('#title-best').innerText()) === total, 'BEST restored after reload');
    // portal return via a normal click (the isolated build has no portal, so a stub answers ./index.html)
    await page.route('**/index.html', r => r.fulfill({status: 200, contentType: 'text/html', body: '<!doctype html><title>portal stub</title>'}));
    await Promise.all([page.waitForURL(/index\.html$/), page.locator('#portal-link').click()]);
    check(page.url().endsWith('/index.html'), 'portal return navigates to ./index.html');

    const external = requests.filter(r => !r.url.startsWith(base) && !r.url.startsWith('data:'));
    const posts = requests.filter(r => r.method !== 'GET');
    check(posts.length === 0, 'no POST/non-GET requests', posts);
    check(external.length === 0, 'no external requests', external);
    const pageErrors = errors.filter(e => !/index\.html/.test(e) && !/404/.test(e));
    check(pageErrors.length === 0, 'no page/console errors', errors);
    report.viewports.push({name: vp.name, ok: true, requests: requests.length, errors});
  } catch (e) {
    await shot('failure').catch(() => {});
    report.viewports.push({name: vp.name, ok: false, error: e.message, errors});
    throw e;
  } finally {
    await ctx.close();
  }
}

/** Storage refused entirely: game still runs, BEST lives in memory, UI says it is not saved. */
async function deniedStorage() {
  current = 'denied-storage';
  const ctx = await chrome.browser.newContext({viewport: {width: 1280, height: 720}});
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('denied', 'SecurityError'); }}); });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(base + '/game037.html');
    check(await page.locator('#storage-note').isVisible(), 'non-persistent note shown');
    await page.locator('#start').click();
    for (let s = 0; s < 6; s++) {
      for (const p of solutions[s]) {
        const index = (await page.locator('.slot').evaluateAll(els => els.map(e => e.dataset.id))).indexOf(p.id);
        await page.keyboard.press(String(index + 1));
        while (Number(await page.locator(`.slot[data-id="${p.id}"]`).getAttribute('data-rotation')) !== p.rotation) await page.keyboard.press('r');
        for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); }
        for (let i = 0; i < p.x; i++) await page.keyboard.press('ArrowRight');
        for (let i = 0; i < p.y; i++) await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      await page.locator('#next').click();
    }
    check(await page.locator('#app').getAttribute('data-screen') === 'result', 'denied storage: run completes');
    await page.locator('#result-title').click();
    check(Number(await page.locator('#title-best').innerText()) > 0, 'denied storage: in-memory BEST for this page');
    check(await page.locator('#storage-note').isVisible(), 'denied storage: still flagged as not saved');
    check(errors.length === 0, 'denied storage: no page errors', errors);
    await page.screenshot({path: path.join(dir, 'denied-storage-title.png')});
    report.viewports.push({name: 'denied-storage', ok: true, errors});
  } finally {
    await ctx.close();
  }
}

try {
  for (const vp of VIEWPORTS) await play(vp);
  await deniedStorage();
  report.status = 'PASS';
} catch (e) {
  report.status = 'FAIL';
  report.error = e.message;
  process.exitCode = 1;
} finally {
  report.ended_at = new Date().toISOString();
  report.passed = report.checks.filter(c => c.ok).length;
  report.failed = report.checks.filter(c => !c.ok).length;
  write();
  await chrome.browser.close();
  await new Promise(r => server.httpServer.close(r));
  console.log(JSON.stringify({dir, status: report.status, passed: report.passed, failed: report.failed, error: report.error ?? null}));
}
