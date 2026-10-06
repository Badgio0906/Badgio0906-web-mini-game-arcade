import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.TOUCH_GUARD_BASE ?? 'http://127.0.0.1:5310';
const out = process.env.TOUCH_GUARD_REPORT ?? '/tmp/touch-integration-report.json';
const profile = process.env.TOUCH_VIEWPORT ?? 'phone';
const profiles = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 }, narrow: { width: 320, height: 640 }, landscape: { width: 844, height: 390 } };
const viewport = profiles[profile];
assert.ok(viewport, 'known viewport');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const report = { base, profile, viewport, checkedAt: new Date().toISOString(), physicalIphone: 'not tested', cases: [] };
try {
  const context = await browser.newContext({ viewport, isMobile: profile !== 'desktop', hasTouch: true });
  const page = await context.newPage();
  const routes = [1,2,3,4,5,6,7,8,9,11,15,16,17,18,19].map(n => `game${String(n).padStart(3, '0')}.html`).concat(['games/yokodori-days/index.html','games/tachibana-task-heaven/index.html','games/finger-heart-challenge/index.html']);
  for (const route of routes) {
    await page.goto(base + '/' + route);
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-game-touch-page'));
    const deny = page.getByRole('button', { name: '許可しない', exact: true }); if (await deny.isVisible()) await deny.click();
    const result = await page.evaluate(() => {
      const elements = [...document.querySelectorAll('[data-game-control],[data-game-interaction]')];
      const checks = elements.map(element => {
        const event = new Event('contextmenu', { bubbles: true, cancelable: true }); element.dispatchEvent(event);
        return { tag: element.tagName, id: element.id, touch: getComputedStyle(element).touchAction, select: getComputedStyle(element).userSelect, contextBlocked: event.defaultPrevented };
      });
      const menu = document.querySelector('#mute-button,#legacy-menu-return');
      let ordinaryMenu = null;
      if (menu) { const event = new Event('contextmenu', { bubbles: true, cancelable: true }); menu.dispatchEvent(event); ordinaryMenu = { touch: getComputedStyle(menu).touchAction, blocked: event.defaultPrevented }; }
      return { checks, protectedCount: elements.length, ordinaryMenu };
    });
    if (!route.startsWith('games/')) assert.ok(result.protectedCount > 0, route);
    assert.ok(result.checks.every(row => row.touch === 'none' && row.select === 'none' && row.contextBlocked), JSON.stringify({ route, result }));
    if (result.ordinaryMenu) assert.deepEqual(result.ordinaryMenu, { touch: 'manipulation', blocked: false });
    report.cases.push({ name: route, ...result, pass: true });
    if (route.startsWith('games/')) {
      await page.locator('#tutorial-again-button').click();
      await page.waitForFunction(() => document.querySelector('#legacy-start [data-game-control]'));
      const practice = await page.locator('#legacy-start [data-game-control]').first().evaluate(element => {
        const event = new Event('contextmenu', { bubbles: true, cancelable: true }); element.dispatchEvent(event);
        return { touch: getComputedStyle(element).touchAction, select: getComputedStyle(element).userSelect, blocked: event.defaultPrevented };
      });
      assert.deepEqual(practice, { touch: 'none', select: 'none', blocked: true });
      await page.locator('#title-button').click(); await page.locator('#play-button').click();
      await page.waitForFunction(() => document.querySelector('iframe')?.contentDocument?.querySelector('canvas[data-game-interaction]'), { timeout: 15000 });
      const embedded = await page.evaluate(() => {
        const child = document.querySelector('iframe').contentDocument, canvas = child.querySelector('canvas');
        const event = new child.defaultView.Event('contextmenu', { bubbles: true, cancelable: true }); canvas.dispatchEvent(event);
        return { touch: child.defaultView.getComputedStyle(canvas).touchAction, select: child.defaultView.getComputedStyle(canvas).userSelect, blocked: event.defaultPrevented };
      });
      assert.deepEqual(embedded, { touch: 'none', select: 'none', blocked: true });
      report.cases.push({ name: route + ' practice and actual Godot iframe canvas guard', practice, embedded, pass: true, coverage: 'guard and native iframe load; not Godot gameplay completion' });
    }
  }
  // Real touch reaches the existing Game019 input owner; cancellation must not launch a jump.
  await page.goto(base + '/game019.html'); await page.locator('#play-button').click(); await page.waitForTimeout(250);
  const session = await context.newCDPSession(page), jump = await page.locator('#jump-button').boundingBox();
  const touch = (type, offset = 0) => session.send('Input.dispatchTouchEvent', { type, touchPoints: ['touchStart','touchMove'].includes(type) ? [{ x: jump.x + jump.width / 2 + offset, y: jump.y + jump.height / 2 }] : [] });
  await page.evaluate(() => document.querySelector('#jump-button').addEventListener('pointerdown', e => window.__probePointer = e.pointerId));
  await touch('touchStart'); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__game019.run.phase), 'charging');
  await touch('touchCancel'); await page.waitForTimeout(100);
  const cancelled = await page.evaluate(() => ({ phase: window.__game019.run.phase, jumps: window.__game019.run.jumps, pressed: document.querySelector('#jump-button').getAttribute('aria-pressed') }));
  assert.deepEqual(cancelled, { phase: 'grounded', jumps: 0, pressed: 'false' });
  report.cases.push({ name: 'Game019 native pointercancel clears charge without jump', ...cancelled, pass: true });
  await touch('touchStart'); await touch('touchMove', 2); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('#jump-button').releasePointerCapture(window.__probePointer)); await touch('touchMove', 4); await page.waitForTimeout(100);
  const lost = await page.evaluate(() => ({ phase: window.__game019.run.phase, jumps: window.__game019.run.jumps, pressed: document.querySelector('#jump-button').getAttribute('aria-pressed') }));
  assert.deepEqual(lost, { phase: 'grounded', jumps: 0, pressed: 'false' }); await touch('touchEnd');
  report.cases.push({ name: 'Game019 native lostcapture clears charge without jump', ...lost, pass: true });
  await touch('touchStart'); await page.waitForTimeout(1000); await touch('touchEnd'); await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => window.__game019.run.jumps), 1);
  report.cases.push({ name: 'Game019 hold then release launches exactly once', pass: true });
  for (const game of ['game015','game008']) {
    await page.goto(base + '/' + game + '.html'); await page.locator('#play-button').click(); await page.waitForTimeout(300);
    for (const id of game === 'game015' ? ['left-button','drop-button'] : ['left-button']) {
      const control = page.locator('#' + id); await control.scrollIntoViewIfNeeded(); const box = await control.boundingBox();
      const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] }); await page.waitForTimeout(80);
      const held = await page.evaluate(() => window.__arcadeDebug.snapshot());
      if (id === 'drop-button') assert.equal(held.heldDrop, true); else assert.equal(game === 'game015' ? held.horizontal : held.input, -1);
      await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await page.waitForTimeout(80);
      const ended = await page.evaluate(() => window.__arcadeDebug.snapshot());
      if (id === 'drop-button') assert.equal(ended.heldDrop, false); else assert.equal(game === 'game015' ? ended.horizontal : ended.input, 0);
      report.cases.push({ name: game + ' native ' + id + ' cancelled', held: id === 'drop-button' ? held.heldDrop : game === 'game015' ? held.horizontal : held.input, released: id === 'drop-button' ? ended.heldDrop : game === 'game015' ? ended.horizontal : ended.input, pass: true });
    }
  }
  await context.close();
} catch (error) { report.cases.push({ name: 'probe failure', message: String(error), pass: false }); throw error; }
finally { await browser.close(); await mkdir(out.substring(0, out.lastIndexOf('/')), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ report: out, count: report.cases.length, passed: report.cases.every(row => row.pass) }));
