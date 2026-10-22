// Game037 real-browser QA (rules v2: boxes grow 4×4 → 8×8, six bentos each).
// Builds the isolated Vite page, serves it over local HTTP (vite preview) and
// plays it with real mouse / touch / keyboard events. Placements come from each
// stage's stored solution in the pure model (loaded through Vite SSR); the page
// is never mutated by a test hook. The only fixture is a box checkpoint written
// to localStorage (labelled below) so small viewports can reach the 8×8 box.
//   node tests/game037/browser.mjs            (writes docs/game037/QA/browser-<time>/)
//   GAME037_REPORT=dir node tests/game037/browser.mjs
import {build, preview, createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {launchChrome} from './chrome.mjs';

const configFile = 'tests/game037/vite.config.mjs';
const dir = process.env.GAME037_REPORT || `docs/game037/QA/browser-${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.mkdirSync(dir, {recursive: true});
const BEST_KEY = 'web-mini-arcade:v1:game037:best:rules2';
const CHECKPOINT_KEY = 'web-mini-arcade:v1:game037:checkpoint:rules2';
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

const STAGES = model.STAGES;
const keyOf = i => (i === 9 ? '0' : String(i + 1));
const label = s => `${STAGES[s].size}×${STAGES[s].size} ${(s % 6) + 1}/6`;
/** Fixture: results for every bento before box `sizeIndex`, as the game itself saves them. */
const checkpointFixture = sizeIndex => JSON.stringify({sizeIndex, results: Array.from({length: sizeIndex * 6}, (_, i) => ({stageIndex: i, size: STAGES[i].size, activeMs: 20000, rotates: 2, undos: 0, score: 900}))});

let current = '';
const check = (ok, name, detail) => {
  report.checks.push({viewport: current, name, ok: !!ok, ...(detail === undefined ? {} : {detail})});
  if (!ok) throw new Error(`${current}: ${name}${detail === undefined ? '' : ' ' + JSON.stringify(detail)}`);
};

const PLAN = {
  desktop: ['drag', 'keyboard', 'drag', 'keyboard', 'click', 'drag'],
  phone: ['tap', 'touchdrag', 'tap', 'touchdrag', 'tap', 'tap'],
  narrow: ['tap', 'tap', 'touchdrag', 'tap', 'tap', 'tap'],
  landscape: ['drag', 'tap', 'keyboard', 'drag', 'tap', 'drag'],
};
const VIEWPORTS = [
  {name: 'desktop', width: 1280, height: 720, touch: false, full: true},
  {name: 'phone', width: 390, height: 844, touch: true, mobile: true, full: true},
  {name: 'narrow', width: 320, height: 568, touch: true, mobile: true, reducedMotion: 'reduce', full: false},
  {name: 'landscape', width: 844, height: 390, touch: true, full: false},
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
  const expected = {rotates: {}, undos: {}};
  const scores = {};

  const rot = id => page.locator(`.slot[data-id="${id}"]`).getAttribute('data-rotation').then(Number);
  const placedAt = id => page.locator(`#grid .placed[data-id="${id}"]`).evaluate(el => el.hidden ? null : {x: +el.dataset.x, y: +el.dataset.y});
  const gridBox = () => page.locator('#grid').boundingBox();
  const center = async sel => { const b = await page.locator(sel).boundingBox(); return {x: b.x + b.width / 2, y: b.y + b.height / 2}; };
  const status = () => page.locator('#status').innerText();
  const hudNum = id => page.locator('#' + id).innerText().then(Number);
  const isPlacedCount = () => page.locator('#grid .placed:not([hidden])').count();
  const screenOf = () => page.locator('#app').getAttribute('data-screen');
  const uiState = () => page.evaluate(() => ({
    screen: document.querySelector('#app').dataset.screen, dialogOpen: document.querySelector('#dialog').open,
    status: document.querySelector('#status').textContent, hud: document.querySelector('#hud-stage').textContent,
    selected: [...document.querySelectorAll('.slot')].filter(s => s.getAttribute('aria-pressed') === 'true').map(s => s.dataset.id),
    slotsDisabled: [...document.querySelectorAll('.slot')].map(s => s.disabled), visibility: document.visibilityState, hasFocus: document.hasFocus(),
  }));
  async function waitActive(why) {
    try {
      await page.waitForFunction(() => !document.querySelector('#dialog').open && [...document.querySelectorAll('.slot:not(.used)')].some(s => !s.disabled), null, {timeout: 5000});
    } catch {
      throw new Error(`board never became active (${why}) ${JSON.stringify(await uiState())}`);
    }
  }
  const shapeOf = (s, p) => model.rotateCells(STAGES[s].pieces.find(q => q.id === p.id).cells, p.rotation);

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
      if (++n > 4) throw new Error(`rotation did not converge for ${id} ${JSON.stringify(await uiState())}`);
    }
    return n;
  }
  async function dropPoint(s, p) {
    const g = await gridBox(), cell = g.width / STAGES[s].size;
    const {w, h} = model.cellBounds(shapeOf(s, p));
    return {x: g.x + (p.x + w / 2) * cell, y: g.y + (p.y + h / 2) * cell};
  }
  async function cellCenter(s, cx, cy) {
    const g = await gridBox(), cell = g.width / STAGES[s].size;
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
  async function place(method, p, s) {
    const index = (await page.locator('.slot').evaluateAll(els => els.map(e => e.dataset.id))).indexOf(p.id);
    const n = STAGES[s].size;
    let rotations = 0;
    if (method === 'keyboard') {
      await page.keyboard.press(keyOf(index));
      rotations = await rotateWith('keyboard', p.id, p.rotation);
      for (let i = 0; i < n - 1; i++) { await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); }
      for (let i = 0; i < p.x; i++) await page.keyboard.press('ArrowRight');
      for (let i = 0; i < p.y; i++) await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    } else if (method === 'tap' || method === 'click') {
      await ensureSelected(method, p.id);
      if (method === 'tap') check(await page.locator('.cell.ok, .cell.ng').count() === 0, 'touch tap selection is not treated as keyboard (no cursor preview)');
      rotations = await rotateWith(method, p.id, p.rotation);
      const [fx, fy] = shapeOf(s, p)[0];
      const c = await cellCenter(s, p.x + fx, p.y + fy);
      if (method === 'tap') await page.touchscreen.tap(c.x, c.y); else await page.mouse.click(c.x, c.y);
    } else {
      const sel = `.slot[data-id="${p.id}"]`;
      await ensureSelected(method === 'touchdrag' ? 'tap' : 'click', p.id);
      rotations = await rotateWith(method, p.id, p.rotation);
      const from = await center(`${sel} .food`), to = await dropPoint(s, p);
      if (method === 'touchdrag') await touchDrag(from, to);
      else await mouseDrag(from, to, s === 0 && vp.name === 'desktop' && !fs.existsSync(path.join(dir, 'desktop-drag-preview.png')) ? () => shot('drag-preview') : null);
    }
    expected.rotates[s] = (expected.rotates[s] ?? 0) + rotations;
    const at = await placedAt(p.id);
    check(at && at.x === p.x && at.y === p.y, `stage${s + 1} ${method} places ${p.id}`, {at, want: {x: p.x, y: p.y}});
  }

  /** Solve stage s with real input, then verify the clear panel's numbers against the model's score formula. */
  async function playStage(s, method, {freezeCheck = false} = {}) {
    await waitActive(`stage ${s + 1} start`);
    check(await page.locator('#hud-stage').innerText() === label(s), `stage ${s + 1} HUD shows ${label(s)}`);
    const boxAtStart = await gridBox();
    for (const p of STAGES[s].solution) {
      await place(method, p, s);
      const g = await gridBox();
      check(Math.abs(g.y - boxAtStart.y) < 0.5 && Math.abs(g.x - boxAtStart.x) < 0.5, `stage ${s + 1} box does not move while playing`, {start: boxAtStart, now: g});
    }
    check(!(await page.locator('#clear-panel').isHidden()), `stage ${s + 1} cleared`);
    const detail = await page.locator('#clear-detail').innerText();
    const m = detail.match(/時間 (\d+)秒 ・ 回転 (\d+) ・ 取外し (\d+) → (\d+)点/);
    check(m, `stage ${s + 1} clear detail readable`, detail);
    const [sec, r, u, score] = m.slice(1).map(Number);
    check(r === (expected.rotates[s] ?? 0), `stage ${s + 1} rotation count matches inputs`, {shown: r, expected: expected.rotates[s] ?? 0});
    check(u === (expected.undos[s] ?? 0), `stage ${s + 1} removal count matches inputs`, {shown: u, expected: expected.undos[s] ?? 0});
    check(score === model.stageScore(sec * 1000, r, u, STAGES[s].size ** 2, STAGES[s].pieces.length), `stage ${s + 1} score formula`, {sec, r, u, score});
    scores[s] = score;
    check(await page.locator('#menu-items li.done').count() === (s % 6) + 1, `menu board marks ${(s % 6) + 1} finished in this box`);
    if (freezeCheck) {
      const frozen = await hudNum('hud-time');
      await page.waitForTimeout(1100);
      check(await page.locator('#hud-stage').innerText() === label(s), `stage ${s + 1} does not auto-advance`);
      check(await hudNum('hud-time') === frozen, `stage ${s + 1} clock stopped at clear`);
    }
    const nextText = await page.locator('#next').innerText();
    if (s === STAGES.length - 1) check(nextText === '結果を見る', 'last bento leads to the result');
    else if (s % 6 === 5) {
      const n2 = STAGES[s + 1].size;
      check(nextText === `${n2}×${n2}の箱へ`, `box ${STAGES[s].size} finished: next button names the bigger box`, nextText);
      const cp = await page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), CHECKPOINT_KEY);
      check(cp && cp.sizeIndex === (s + 1) / 6 && cp.results.length === s + 1, `checkpoint saved after box ${STAGES[s].size}`, cp && {sizeIndex: cp.sizeIndex, n: cp.results.length});
    } else check(nextText === '次の弁当へ', `stage ${s + 1} next button`);
    const best = await page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? 'null'), BEST_KEY);
    check(best && best.best === (await hudNum('hud-total')) && best.cleared === s + 1, `BEST follows the running total after stage ${s + 1}`, best);
  }

  async function layoutChecks(tag) {
    for (const sel of ['#pause', '#rotate', '#deselect', '.slot >> nth=0', '.slot >> nth=-1']) {
      const b = await page.locator(sel).boundingBox();
      check(b.height >= 44 && b.width >= 44, `44px ${sel} (${tag})`, b);
    }
    const gb = await gridBox();
    check(gb.x >= 0 && gb.y >= 0 && gb.x + gb.width <= vp.width && gb.y + gb.height <= vp.height, `box fully inside viewport (${tag})`, gb);
    const trayBox = await page.locator('#tray').boundingBox();
    check(trayBox.x >= 0 && trayBox.x + trayBox.width <= vp.width && trayBox.y + trayBox.height <= vp.height + 1, `tray fully inside viewport (${tag})`, trayBox);
    const act = await page.locator('#actions').boundingBox();
    check(act.y + act.height <= vp.height + 1, `rotate/back buttons inside viewport (${tag})`, act);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal scroll (${tag})`);
  }

  try {
    await page.goto(base + '/game037.html');
    await page.waitForLoadState('networkidle');
    check(await screenOf() === 'title', 'opens on title');
    check(await page.evaluate(() => Object.keys(window).filter(k => /game037|__bento/i.test(k)).length === 0), 'no global diagnostic hook in production build');
    check(await page.evaluate(() => !!document.querySelector('#m-tamago') && !!document.querySelector('#m-hamburg')), 'food motif sprite loaded');
    const otherKeyBefore = await page.evaluate(() => { localStorage.setItem('web-mini-arcade:v1:game035:state', 'sentinel'); localStorage.setItem('web-mini-arcade:v1:game037:best:rules1', '{"best":5500}'); return Object.keys(localStorage).sort(); });
    check(await page.locator('#continue').isHidden(), 'no continue button without a checkpoint');
    await shot('title');
    const portal = page.locator('#portal-link');
    check((await portal.getAttribute('href')) === './index.html', 'portal return link present');
    for (const sel of ['#portal-link', '#mute', '#start', '#practice-start', '#help-open']) {
      const b = await page.locator(sel).boundingBox();
      check(b.height >= 44 && b.width >= 44, `44px ${sel}`, b);
    }
    await page.locator('#help-open').click();
    check(await page.locator('#dialog').evaluate(d => d.open), 'help dialog opens');
    check((await page.locator('#dialog').innerText()).includes('8×8'), 'help explains the growing boxes');
    await shot('help');
    await page.locator('#help-close').click();

    // ---------------- practice (isolated, 4×4)
    await page.locator('#practice-start').click();
    check((await page.locator('#hud-stage').innerText()).includes('練習'), 'practice labelled');
    for (const p of model.PRACTICE_STAGE.solution) await place(vp.touch ? 'tap' : 'click', p, 0);
    expected.rotates = {};
    check(!(await page.locator('#clear-panel').isHidden()), 'practice completion message');
    check(await page.locator('.cell.ok, .cell.ng').count() === 0, 'no placement preview left on the finished box');
    check((await page.locator('#clear-title').innerText()).includes('練習達成'), 'practice says achieved');
    await shot('practice-clear');
    check(await page.evaluate(k => localStorage.getItem(k), BEST_KEY) === null, 'practice wrote no BEST');
    await page.locator('#practice-again').click();
    check(await isPlacedCount() === 0, 'practice repeatable from an empty board');
    await page.locator('#pause').click();
    await page.locator('#pause-title').click();
    check(await screenOf() === 'title', 'practice exits to title');

    // ---------------- production run: the 4×4 box with input edge cases
    await page.locator('#start').click();
    check(await page.locator('#hud-stage').innerText() === label(0), 'run starts at 4×4 bento 1');
    await layoutChecks('4×4');
    const plan = PLAN[vp.name];
    for (let s = 0; s < 6; s++) {
      const method = plan[s];
      if (s === 0) {
        const out = {id: 'I1', rotation: 0, x: 0, y: 1};
        if (vp.touch) await touchDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(0, out));
        else await mouseDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(0, out));
        check(await placedAt('I1') === null, 'out-of-box drop rejected');
        check((await status()).includes('はみ出'), 'out-of-box reason shown');
        const legal = {id: 'I1', rotation: 0, x: 0, y: 0};
        if (vp.touch) await touchDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(0, legal));
        else await mouseDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(0, legal));
        check(JSON.stringify(await placedAt('I1')) === '{"x":0,"y":0}', 'legal drop placed once');
        await page.waitForTimeout(150);
        check(await isPlacedCount() === 1, 'no double placement from the click after drag');
        const before = await hudNum('hud-stage-score');
        const onTop = {id: 'O1', rotation: 0, x: 0, y: 1};
        if (vp.touch) await touchDrag(await center('.slot[data-id="O1"] .food'), await dropPoint(0, onTop));
        else await mouseDrag(await center('.slot[data-id="O1"] .food'), await dropPoint(0, onTop));
        check(await placedAt('O1') === null, 'overlapping placement rejected');
        check((await status()).includes('重な'), 'overlap reason shown');
        const pc = await center('#grid .placed[data-id="I1"]');
        if (vp.touch) await page.touchscreen.tap(pc.x, pc.y); else await page.mouse.click(pc.x, pc.y);
        check(await placedAt('I1') === null, 'placed dish removed by tap');
        check(await page.locator('.slot[data-id="I1"]').getAttribute('aria-pressed') === 'true', 'removed dish becomes selected');
        const after = await hudNum('hud-stage-score');
        check(before - after >= 50, 'removal penalty visible in live stage score', {before, after});
        expected.undos[0] = 1;
        if (vp.touch) {
          await touchDrag(await center('.slot[data-id="I1"] .food'), await dropPoint(0, legal), {cancel: true});
          check(await placedAt('I1') === null, 'touch pointercancel does not place');
        }
        await shot('play-rejected');
      }
      if (s === 1) {
        await page.keyboard.press('1');
        const r0 = await rot('O1');
        await page.keyboard.down('r'); await page.keyboard.down('r'); await page.keyboard.down('r'); await page.keyboard.up('r');
        check((await rot('O1')) === (r0 + 1) % 4, 'held R rotates once', {r0, r1: await rot('O1')});
        expected.rotates[1] = 1;
        await page.keyboard.press('Escape');
        await page.locator('#pause').click();
        const t0 = await hudNum('hud-time');
        await page.waitForTimeout(1300);
        check(await hudNum('hud-time') === t0, 'pause freezes time');
        await shot('pause');
        await page.locator('#resume').click();
        if (!vp.touch) {
          const p = STAGES[1].solution[0];
          await page.mouse.move(...Object.values(await center(`.slot[data-id="${p.id}"] .food`)));
          await page.mouse.down();
          const to = await dropPoint(1, {...p, rotation: await rot(p.id)});
          await page.mouse.move(to.x, to.y, {steps: 6});
          await page.evaluate(() => window.dispatchEvent(new Event('blur')));
          await page.mouse.up();
          check(await placedAt(p.id) === null, 'blur mid-drag places nothing');
          check(await page.locator('#dialog').evaluate(d => d.open), 'blur auto-pauses');
          await page.evaluate(() => window.dispatchEvent(new Event('focus')));
          await page.locator('#resume').click();
        }
        await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', {value: 'hidden', configurable: true}); document.dispatchEvent(new Event('visibilitychange')); });
        check(await page.locator('#dialog').evaluate(d => d.open), 'hidden auto-pauses');
        const th = await hudNum('hud-time');
        await page.waitForTimeout(1100);
        check(await hudNum('hud-time') === th, 'hidden freezes time');
        await page.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
        await page.locator('#resume').click();
        await page.keyboard.down('Escape'); await page.keyboard.down('Escape'); await page.keyboard.up('Escape');
        check(await page.locator('#dialog').evaluate(d => d.open), 'held Escape keeps pause open');
        await page.keyboard.press('Escape');
        check(!(await page.locator('#dialog').evaluate(d => d.open)), 'fresh Escape resumes');
        if (!vp.touch) {
          await page.keyboard.press('1');
          check(await page.locator('.slot[data-id="O1"]').getAttribute('aria-pressed') === 'true', 'Esc resume accepts immediate keyboard selection');
        }
      }
      await playStage(s, method, {freezeCheck: s === 0});
      if (s === 0) await shot('stage1-clear');
      if (s === 5) await shot('box4-clear');
      await page.locator('#next').click();
    }

    // ---------------- the 5×5 box comes next; leave to title and continue from the checkpoint
    await waitActive('5×5 start');
    check(await page.locator('#hud-stage').innerText() === label(6), 'box grows to 5×5 after six bentos');
    check(await page.locator('#menu-ladder li.done').count() === 1, 'menu ladder marks 4×4 done');
    const totalAfter4 = await hudNum('hud-total');
    await page.locator('#pause').click();
    await page.locator('#pause-title').click();
    check(await page.locator('#continue').isVisible(), 'continue offered on the title');
    check((await page.locator('#continue').innerText()).includes('5×5'), 'continue names the 5×5 box');
    await page.locator('#continue').click();
    check(await page.locator('#hud-stage').innerText() === label(6), 'continue resumes at 5×5 bento 1');
    check(await hudNum('hud-total') === totalAfter4, 'continue keeps the total so far');
    await layoutChecks('5×5');

    let last = 6;
    if (vp.full) {
      for (let s = 6; s < STAGES.length; s++) {
        await playStage(s, plan[s % 6]);
        if (s % 6 === 5 || s === 6) await shot(`stage${s + 1}-clear`);
        await page.locator('#next').click();
        if (s < STAGES.length - 1 && (s + 1) % 6 === 0) { await waitActive(`box ${STAGES[s + 1].size}`); await layoutChecks(`${STAGES[s + 1].size}×${STAGES[s + 1].size}`); }
      }
      last = STAGES.length;
    } else {
      await playStage(6, plan[0]);
      await shot('stage7-clear');
      // Fixture: a saved checkpoint at the 8×8 box (results for the first 24 bentos), then real play to the end.
      await page.locator('#next').click();
      await page.locator('#pause').click();
      await page.locator('#pause-title').click();
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CHECKPOINT_KEY, checkpointFixture(4)]);
      await page.reload();
      check((await page.locator('#continue').innerText()).includes('8×8'), 'continue names the 8×8 box (fixture checkpoint)');
      await page.locator('#continue').click();
      await waitActive('8×8 from fixture');
      check(await page.locator('#hud-stage').innerText() === label(24), 'fixture continue starts at 8×8 bento 1');
      await layoutChecks('8×8');
      await shot('box8-play');
      for (let i = 0; i < 24; i++) scores[i] = 900;
      for (let s = 24; s < STAGES.length; s++) {
        await playStage(s, plan[s % 6]);
        if (s === 29) await shot('stage30-clear');
        await page.locator('#next').click();
      }
      last = STAGES.length;
    }
    check(await screenOf() === 'result', 'all thirty bentos reach the result');
    await shot('result');
    const rows = await page.locator('#result-rows tr').evaluateAll(trs => trs.map(tr => [...tr.children].map(td => td.textContent)));
    check(rows.length === 5, 'one result row per box', rows);
    const total = Number(await page.locator('#result-total').innerText());
    const sum = Object.values(scores).reduce((n, v) => n + v, 0);
    check(total === sum && total >= 0 && total <= 30000 && last === 30, 'total is the sum of bento scores, 0..30000', {total, sum});
    check(rows.reduce((n, r) => n + Number(r[4]), 0) === total, 'per-box rows add up to the total');
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), BEST_KEY);
    check(saved && saved.best === total && saved.cleared === 30, 'BEST holds the full-run total', saved);
    check(await page.evaluate(k => localStorage.getItem(k), CHECKPOINT_KEY) === null, 'finishing all boxes clears the checkpoint');
    const keysAfter = await page.evaluate(() => Object.keys(localStorage).sort());
    const added = keysAfter.filter(k => !otherKeyBefore.includes(k));
    check(added.every(k => [BEST_KEY, CHECKPOINT_KEY, MUTE_KEY].includes(k)), 'only game037 rules2 keys written', added);
    check(await page.evaluate(() => localStorage.getItem('web-mini-arcade:v1:game035:state')) === 'sentinel', 'other game storage untouched');
    check(await page.evaluate(() => localStorage.getItem('web-mini-arcade:v1:game037:best:rules1')) === '{"best":5500}', 'rules v1 BEST left untouched');

    await page.locator('#retry').click();
    check(await page.locator('#hud-stage').innerText() === label(0), 'retry restarts at 4×4 bento 1');
    check(await hudNum('hud-total') === 0, 'retry total 0');
    check(await isPlacedCount() === 0 && (await page.locator('.slot.selected').count()) === 0, 'retry has no placed/selected dishes');
    await page.locator('#mute').click();
    check(await page.evaluate(k => localStorage.getItem(k), MUTE_KEY) === '1', 'mute saved');
    await page.reload();
    check((await page.locator('#mute').innerText()).includes('OFF'), 'mute restored after reload');
    check(Number(await page.locator('#title-best').innerText()) === total, 'BEST restored after reload');
    await page.route('**/index.html', r => r.fulfill({status: 200, contentType: 'text/html', body: '<!doctype html><title>portal stub</title>'}));
    await Promise.all([page.waitForURL(/index\.html$/), page.locator('#portal-link').click()]);
    check(page.url().endsWith('/index.html'), 'portal return navigates to ./index.html');

    const external = requests.filter(r => !r.url.startsWith(base) && !r.url.startsWith('data:'));
    const posts = requests.filter(r => r.method !== 'GET');
    check(posts.length === 0, 'no POST/non-GET requests', posts);
    check(external.length === 0, 'no external requests', external);
    const pageErrors = errors.filter(e => !/index\.html/.test(e) && !/404/.test(e));
    check(pageErrors.length === 0, 'no page/console errors', errors);
    report.viewports.push({name: vp.name, ok: true, full_run: vp.full, requests: requests.length, errors});
  } catch (e) {
    await shot('failure').catch(() => {});
    report.viewports.push({name: vp.name, ok: false, error: e.message, errors});
    throw e;
  } finally {
    await ctx.close();
  }
}

/** Storage refused entirely: game still runs, BEST and checkpoint live in memory, UI says nothing is saved. */
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
      for (const p of STAGES[s].solution) {
        const index = (await page.locator('.slot').evaluateAll(els => els.map(e => e.dataset.id))).indexOf(p.id);
        await page.keyboard.press(keyOf(index));
        while (Number(await page.locator(`.slot[data-id="${p.id}"]`).getAttribute('data-rotation')) !== p.rotation) await page.keyboard.press('r');
        for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); }
        for (let i = 0; i < p.x; i++) await page.keyboard.press('ArrowRight');
        for (let i = 0; i < p.y; i++) await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      await page.locator('#next').click();
    }
    check(await page.locator('#hud-stage').innerText() === label(6), 'denied storage: reaches the 5×5 box');
    await page.locator('#pause').click();
    await page.locator('#pause-title').click();
    check(Number(await page.locator('#title-best').innerText()) > 0, 'denied storage: in-memory BEST for this page');
    check(await page.locator('#continue').isVisible(), 'denied storage: in-memory continue for this page');
    check(await page.locator('#storage-note').isVisible(), 'denied storage: still flagged as not saved');
    check(errors.length === 0, 'denied storage: no page errors', errors);
    await page.screenshot({path: path.join(dir, 'denied-storage-title.png')});
    report.viewports.push({name: 'denied-storage', ok: true, errors});
  } finally {
    await ctx.close();
  }
}

// GAME037_ONLY=phone,narrow limits the run (debugging); the default runs everything.
const only = process.env.GAME037_ONLY ? process.env.GAME037_ONLY.split(',') : null;
try {
  for (const vp of VIEWPORTS) if (!only || only.includes(vp.name)) await play(vp);
  if (!only || only.includes('denied-storage')) await deniedStorage();
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
