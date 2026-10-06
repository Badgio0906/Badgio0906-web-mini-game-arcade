import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.TOUCH_GUARD_BASE ?? 'http://127.0.0.1:5310';
const out = process.env.TOUCH_GUARD_REPORT ?? '/tmp/touch-retirement-report.json';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const report = { base, checkedAt: new Date().toISOString(), physicalIphone: 'not tested; Chromium cannot reproduce native iOS callout', cases: [] };
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const { installGameTouchGuards } = await import('/src/core/installGameTouchGuards.ts');
    document.body.innerHTML = '<p id="ordinary">Ordinary explanatory text</p><button id="menu">Ordinary menu</button><canvas id="target"></canvas><button data-game-control id="hold">HOLD<img id="sprite"></button><input data-game-control id="editable"><iframe id="frame"></iframe>';
    const dispose = installGameTouchGuards(document);
    const target = document.querySelector('#hold');
    let up = 0, down = 0, cancel = 0, lost = 0;
    for (const [name, count] of [['pointerdown', () => down++], ['pointerup', () => up++], ['pointercancel', () => cancel++], ['lostpointercapture', () => lost++]]) target.addEventListener(name, count);
    const blocked = (selector, name) => { const event = new Event(name, { cancelable: true, bubbles: true }); document.querySelector(selector).dispatchEvent(event); return event.defaultPrevented; };
    const events = ['selectstart', 'contextmenu', 'dragstart'];
    const protectedEvents = events.map(name => blocked('#sprite', name));
    const ordinaryEvents = events.map(name => blocked('#ordinary', name));
    const menuEvents = events.map(name => blocked('#menu', name));
    const editableEvents = events.map(name => blocked('#editable', name));
    const fixtureStyle = { holdTouch: getComputedStyle(target).touchAction, canvasTouch: getComputedStyle(document.querySelector('#target')).touchAction, menuTouch: getComputedStyle(document.querySelector('#menu')).touchAction, holdSelect: getComputedStyle(target).userSelect, textSelect: getComputedStyle(document.querySelector('#ordinary')).userSelect, imageDraggable: document.querySelector('#sprite').draggable };
    const dynamic = document.createElement('button'); dynamic.setAttribute('data-practice-action', 'left'); document.body.append(dynamic); await new Promise(resolve => setTimeout(resolve, 0));
    const dynamicGuard = dynamic.hasAttribute('data-game-control');
    const child = document.querySelector('#frame').contentDocument; child.body.innerHTML = '<canvas id="canvas"></canvas><p id="copy">copy</p>'; const childDispose = installGameTouchGuards(child);
    const frameEvent = new child.defaultView.Event('contextmenu', { bubbles: true, cancelable: true }); child.querySelector('canvas').dispatchEvent(frameEvent);
    const frameGuard = frameEvent.defaultPrevented && child.defaultView.getComputedStyle(child.querySelector('canvas')).touchAction === 'none'; childDispose();
    const sameDispose = dispose === installGameTouchGuards(document);
    window.__touchProbe = { counts: () => ({ up, down, cancel, lost }), dispose };
    return { protectedEvents, ordinaryEvents, menuEvents, editableEvents, fixtureStyle, dynamicGuard, frameGuard, sameDispose };
  });
  assert.deepEqual(result.protectedEvents, [true, true, true]);
  for (const field of ['ordinaryEvents', 'menuEvents', 'editableEvents']) assert.deepEqual(result[field], [false, false, false]);
  assert.equal(result.fixtureStyle.holdTouch, 'none'); assert.equal(result.fixtureStyle.canvasTouch, 'none'); assert.equal(result.fixtureStyle.menuTouch, 'manipulation'); assert.equal(result.fixtureStyle.holdSelect, 'none'); assert.notEqual(result.fixtureStyle.textSelect, 'none'); assert.equal(result.fixtureStyle.imageDraggable, false);
  assert.ok(result.dynamicGuard && result.frameGuard && result.sameDispose);
  report.cases.push({ name: 'scope, editable exclusions, dynamic practice, iframe realm, idempotence', ...result, pass: true });
  const session = await context.newCDPSession(page), bounds = await page.locator('#hold').boundingBox();
  for (const seconds of [1, 2, 3]) {
    const before = await page.evaluate(() => window.__touchProbe.counts());
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + 12, y: bounds.y + 12 }] });
    await page.waitForTimeout(seconds * 1000);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => ({ ...window.__touchProbe.counts(), selection: getSelection()?.toString() }));
    assert.equal(after.down - before.down, 1); assert.equal(after.up - before.up, 1); assert.equal(after.selection, '');
    report.cases.push({ name: `native Chromium touch ${seconds}s`, before, after, pass: true });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + 12, y: bounds.y + 12 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  assert.equal((await page.evaluate(() => window.__touchProbe.counts())).cancel, 1);
  report.cases.push({ name: 'pointercancel reaches gameplay without swallowed/duplicated pointerup', pass: true });
  await page.goto(base + '/game010.html'); assert.equal(await page.locator('canvas, script:not([src="/@vite/client"])').count(), 0); assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex,nofollow'); report.cases.push({ name: 'retired route no engine', pass: true });
  await context.close();
} finally { await browser.close(); await mkdir(out.substring(0, out.lastIndexOf('/')), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ report: out, count: report.cases.length, passed: report.cases.every(row => row.pass) }));
