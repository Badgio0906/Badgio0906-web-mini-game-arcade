import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const output = process.env.GAME017_REPORT_DIR || 'docs/game017/QA/initial-native';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
const read = page => page.evaluate(() => { const d = window.__arcadeDebug; return { state: d.state(), snapshot: d.snapshot(), inspection: d.inspection(), events: d.telemetry() }; });
async function until(page, predicate, label, ms = 10000) {
  const end = Date.now() + ms; let last;
  while (Date.now() < end) { last = await read(page); if (predicate(last)) return last; await page.waitForTimeout(20); }
  throw Error(label + ': ' + JSON.stringify(last.snapshot));
}
async function geometry(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const result = await page.evaluate(() => {
    const targets = [...document.querySelectorAll('button,a')].filter(e => e.getClientRects().length && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden');
    return { width: innerWidth, height: innerHeight, docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight, targets: targets.map(e => { const b = e.getBoundingClientRect(); return { id: e.id || e.textContent, x: b.x, y: b.y, width: b.width, height: b.height }; }) };
  });
  assert.ok(result.docWidth <= result.width + 1, 'horizontal overflow');
  assert.ok(result.docHeight <= result.height + 1, 'vertical overflow');
  for (const e of result.targets) { assert.ok(e.width >= 43.5 && e.height >= 43.5, '44px ' + e.id); assert.ok(e.x >= -1 && e.y >= -1 && e.x + e.width <= result.width + 1 && e.y + e.height <= result.height + 1, 'viewport ' + e.id); }
  return result;
}
async function coordinates(page, point) {
  return page.evaluate(point => { const canvas = document.getElementById('rain-canvas'), b = canvas.getBoundingClientRect(), h = canvas.height, scale = Math.min(b.width / 1000, b.height / h); return { x: b.left + (b.width - 1000 * scale) / 2 + (58 + point.x * .884) * scale, y: b.top + (b.height - h * scale) / 2 + (116 + point.z * ((h - 212) / 600)) * scale }; }, point);
}
async function dragRoute(page, touch, path) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const points = [];
  for (const p of path) points.push(await coordinates(page, p));
  if (touch) {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: points[0].x, y: points[0].y, id: 7 }] });
    for (const p of points.slice(1)) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y, id: 7 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  } else {
    await page.mouse.move(points[0].x, points[0].y); await page.mouse.down();
    for (const p of points.slice(1)) await page.mouse.move(p.x, p.y);
    await page.mouse.up();
  }
}
let failed = false;
for (const profile of [{ name: 'desktop', width: 1440, height: 900, touch: false }, { name: 'phone', width: 390, height: 844, touch: true }, { name: 'narrow', width: 320, height: 568, touch: true }, { name: 'landscape', width: 844, height: 390, touch: true }]) {
  const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const record = { profile, captures: [], checks: [] };
  const button = async id => profile.touch ? page.locator(id).tap() : page.locator(id).click();
  const capture = async name => { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); const path = output + '/' + profile.name + '-' + name + '.png'; await page.screenshot({ path }); record.captures.push(path); };
  try {
    await page.goto((process.env.GAME017_URL || 'http://127.0.0.1:5181/') + 'game017.html');
    await capture('title'); record.checks.push({ kind: 'title', geometry: await geometry(page) });
    await button('#play-button'); await capture('explanation'); record.checks.push({ kind: 'explanation', geometry: await geometry(page) });
    await button('#tutorial-practice-button');
    await until(page, r => r.snapshot.phase === 'rain', 'practice rain'); await button('#accelerate-button');
    await until(page, r => r.snapshot.phase === 'plan', 'practice planning'); await capture('practice-plan');
    const p = await read(page); assert.equal(p.snapshot.practice, true); assert.equal(p.snapshot.score, 0); assert.ok(!p.events.some(e => e.name === 'run_start'));
    await dragRoute(page, profile.touch, p.inspection.safeRoute);
    await until(page, r => r.state === 'practice-complete', 'practice clear'); await capture('practice-complete'); record.checks.push({ kind: 'practice-complete', geometry: await geometry(page) });
    await button('#tutorial-start-button');
    await until(page, r => r.snapshot.phase === 'rain', 'main rain'); await capture('main-rain');
    await button('#accelerate-button'); await until(page, r => r.snapshot.phase === 'plan', 'main plan'); await capture('main-plan');
    const before = await read(page); record.checks.push({ kind: 'main-plan', geometry: await geometry(page), snapshot: before.snapshot });
    await button('#pause-button'); const frozen = await read(page); await page.waitForTimeout(250); const still = await read(page);
    assert.equal(still.snapshot.remaining, frozen.snapshot.remaining); await button('#resume-button');
    await dragRoute(page, profile.touch, before.inspection.safeRoute);
    await until(page, r => r.snapshot.phase === 'dash', 'dash'); await capture('dash');
    await until(page, r => r.snapshot.phase === 'clear', 'clear'); await capture('clear');
    const clear = await read(page); assert.ok(clear.snapshot.score >= 1000); record.checks.push({ kind: 'clear', snapshot: clear.snapshot });
    await until(page, r => r.snapshot.round === 2 && r.snapshot.phase === 'rain', 'round2');
    await button('#accelerate-button'); await until(page, r => r.snapshot.phase === 'plan', 'round2 plan');
    const scene = await read(page), hazard = scene.inspection.rain.find(r => r.dangerous);
    await dragRoute(page, profile.touch, [{ x: 70, z: 300 }, hazard.impact, { x: 930, z: 300 }]);
    await until(page, r => r.state === 'result', 'rain collision'); await capture('result'); record.checks.push({ kind: 'result', geometry: await geometry(page), snapshot: (await read(page)).snapshot });
    assert.equal((await read(page)).snapshot.result.reason, 'rain'); assert.equal(await page.locator('#live-status').textContent(), '赤い雨の着地点に触れました。');
    await button('#retry-button'); assert.equal((await read(page)).snapshot.score, 0);
    await button('#pause-button'); await button('#title-button'); await button('#mute-button');
    const saved = await page.evaluate(() => ({ best: localStorage.getItem('web-mini-arcade:v1:game017:best'), mute: localStorage.getItem('web-mini-arcade:v1:game017:muted'), done: localStorage.getItem('web-mini-arcade:v1:game017:tutorialCompleted') }));
    assert.ok(Number(saved.best) >= 1000); assert.equal(saved.done, 'true'); assert.equal(saved.mute, 'true');
    await page.reload(); assert.equal(await page.locator('#mute-button').textContent(), '音 OFF'); assert.ok(Number(await page.locator('#best-value').textContent()) >= 1000);
    assert.deepEqual(errors, []); record.saved = saved; record.status = 'PASS';
  } catch (error) {
    failed = true; record.status = 'FAIL'; record.error = String(error); record.last = await read(page).catch(() => null); record.geometry = await geometry(page).catch(e => String(e)); await capture('failure');
  }
  record.errors = errors; records.push(record); console.log(profile.name + ' ' + record.status + (record.error ? ' ' + record.error : '')); await context.close();
}
await browser.close();
await writeFile(output + '/report.json', JSON.stringify({ profiles: records, forcedRuntimeWrites: false, readonlySafeRouteOracle: true, nativeMouseOrCDPTouch: true }, null, 2) + '\n');
if (failed) process.exitCode = 1;
