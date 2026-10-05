import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.GAME015_RISK_URL ?? 'http://127.0.0.1:5181/';
const out = process.env.GAME015_RISK_OUT ?? 'docs/game015/revision-03/QA/native';
const read = page => page.evaluate(() => ({ state: window.__arcadeDebug.state(), run: window.__arcadeDebug.snapshot(), events: window.__arcadeDebug.telemetry(), practice: window.__tutorialDebug?.snapshot()?.practice }));
async function until(page, predicate, label, limit = 15000) {
  const end = Date.now() + limit; let snapshot;
  while (Date.now() < end) { snapshot = await read(page); if (predicate(snapshot)) return snapshot; await page.waitForTimeout(20); }
  throw Error(`${label}: ${JSON.stringify(snapshot)}`);
}
async function geometry(page, selectors) {
  const result = await page.evaluate(selectors => selectors.map(selector => {
    const r = document.querySelector(selector)?.getBoundingClientRect();
    return { selector, rect: r ? { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } : null, vw: innerWidth, vh: innerHeight };
  }), selectors);
  for (const { selector, rect: r, vw, vh } of result) {
    assert.ok(r?.width && r.height, selector); assert.ok(r.x >= -1 && r.y >= -1 && r.right <= vw + 1 && r.bottom <= vh + 1, `viewport ${selector}`);
    if (selector.includes('button') || selector.includes('action')) assert.ok(r.width >= 43 && r.height >= 43, `44px control ${selector}`);
  }
  return result;
}
class Inputs {
  constructor(page, touch, practice = false) { Object.assign(this, { page, touch, practice, direction: 0, held: false, points: new Map() }); }
  async touchPoint(id, selector) {
    this.cdp ??= await this.page.context().newCDPSession(this.page);
    if (selector) { const b = await this.page.locator(selector).boundingBox(); assert.ok(b); this.points.set(id, { x: b.x + b.width / 2, y: b.y + b.height / 2, id }); }
    else { const ended = this.points.get(id); this.points.delete(id); if (ended) await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [ended] }); return; }
    await this.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [...this.points.values()] });
  }
  async drop(held) {
    if (held === this.held) return;
    if (this.touch) await this.touchPoint(1, held ? this.practice ? '#arcade-training [data-practice-action="action"]' : '#drop-button' : null);
    else if (held) await this.page.keyboard.down('ArrowDown'); else await this.page.keyboard.up('ArrowDown');
    this.held = held;
  }
  async steer(direction) {
    if (direction === this.direction) return;
    if (this.touch) {
      if (this.direction) await this.touchPoint(2, null);
      if (direction) await this.touchPoint(2, this.practice ? `#arcade-training [data-practice-action="${direction > 0 ? 'right' : 'left'}"]` : direction > 0 ? '#right-button' : '#left-button');
    } else {
      if (this.direction) await this.page.keyboard.up(this.direction > 0 ? 'ArrowRight' : 'ArrowLeft');
      if (direction) await this.page.keyboard.down(direction > 0 ? 'ArrowRight' : 'ArrowLeft');
    }
    this.direction = direction;
  }
  async close() { await this.steer(0); await this.drop(false); await this.cdp?.detach(); }
}
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
const profiles = [{ name: 'desktop', width: 1440, height: 900, touch: false }, { name: 'phone', width: 390, height: 844, touch: true }, { name: 'narrow', width: 320, height: 568, touch: true }, { name: 'landscape', width: 844, height: 390, touch: true }];
try {
  for (const profile of profiles.filter(p => !process.env.GAME015_RISK_PROFILES || process.env.GAME015_RISK_PROFILES.split(',').includes(p.name))) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch });
    const page = await context.newPage(), errors = [], record = { profile, geometry: [], landings: [] }; records.push(record);
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const click = selector => profile.touch ? page.locator(selector).tap() : page.locator(selector).click();
    const capture = name => page.screenshot({ path: `${out}/${profile.name}-${name}.png` });
    try {
      await page.goto(base + 'game015.html'); await capture('title');
      record.geometry.push(await geometry(page, ['#play-button', '#tutorial-again-button', '#tutorial-explain-button']));
      await click('#tutorial-again-button'); await page.locator('#arcade-training[data-phase="practice"]').waitFor();
      record.geometry.push(await geometry(page, ['#tutorial-canvas', '#arcade-training [data-practice-action="action"]']));
      const before = await read(page);
      for (const step of [0, 1, 2]) {
        await until(page, s => s.practice?.step === step, `practice ${step}`);
        const input = new Inputs(page, profile.touch, true);
        await input.drop(true); await input.drop(false); if (step) await input.steer(step === 1 ? 1 : -1);
        await until(page, s => s.practice?.step === step && s.practice?.fall?.phase === 'landed', 'practice landing');
        record.landings.push((await read(page)).practice.fall); await input.close();
        await until(page, s => s.practice?.step > step, 'next lesson');
      }
      const holdInput = new Inputs(page, profile.touch, true); await holdInput.drop(true);
      const continuous = await until(page, s => s.practice?.step === 3 && s.practice?.fall?.phase === 'landed', 'hold practice');
      assert.equal(continuous.practice.fall.passedPlatforms, 2); assert.equal(continuous.practice.fall.fallDistance, 9); record.holdPractice = continuous.practice;
      await capture('hold-practice'); await holdInput.close();
      await until(page, s => s.practice?.fall?.cause === 'impact', 'impact demo'); await capture('impact-practice');
      await until(page, s => s.practice?.step === 5 && s.practice?.fall?.cause === 'scroll', 'ceiling demo');
      await page.locator('#arcade-training[data-phase="success"]').waitFor();
      const after = await read(page); assert.equal(after.run.time, before.run.time); assert.equal(after.run.score, before.run.score);
      for (const name of ['run_start', 'run_end', 'score', 'credit_used']) assert.equal(after.events.filter(e => e.name === name).length, before.events.filter(e => e.name === name).length);
      await click('#tutorial-start-button'); await click('#play-button'); await until(page, s => s.state === 'playing', 'immediate start');
      record.geometry.push(await geometry(page, ['#fall-canvas', '#drop-button', '#left-button', '#right-button']));
      const input = new Inputs(page, profile.touch), initial = await read(page), soft = initial.run.platforms.find(p => p.type === 'soft'); assert.ok(soft);
      await input.drop(true); let captured = false;
      const deadline = Date.now() + 7000; let latest;
      while (Date.now() < deadline) {
        latest = await read(page); const s = latest.run; assert.ok(s.alive, `hold shortcut alive: ${JSON.stringify(s)}`);
        if (s.player.platformId === soft.id) break;
        assert.equal(s.heldDrop, true); const command = (soft.x + soft.width / 2 - s.player.x) * 5 - s.player.vx * 1.8;
        await input.steer(command > 4 ? 1 : command < -4 ? -1 : 0);
        if (!captured && s.fallDistance > 7) { await capture('deep-fall'); captured = true; }
        await page.waitForTimeout(20);
      }
      latest = await read(page); assert.equal(latest.run.player.platformId, soft.id); assert.ok(latest.run.lastLanding.fallDistance > 10.2); assert.equal(latest.run.niceDrops, 1);
      record.deepCatch = latest.run; await input.close(); await capture('soft-catch');
      await click('#pause-button'); const frozen = await read(page); assert.equal(frozen.run.heldDrop, false); await page.waitForTimeout(200); assert.deepEqual((await read(page)).run, frozen.run);
      await click('#resume-button'); await until(page, s => s.state === 'result', 'standing ceiling death', 15000);
      assert.match(await page.locator('.death-reason').innerText(), /置いていかれ/); await capture('scroll-result');
      await click('#retry-button'); await until(page, s => s.state === 'playing', 'retry'); assert.equal((await read(page)).run.heldDrop, false);
      await click('#pause-button'); await click('#title-button'); await page.reload();
      const best = await page.locator('#best-value').innerText(); assert.ok(Number(best) >= 10); record.savedBest = best;
      await click('.arcade-portal-back'); await page.locator('.game-card').first().waitFor(); assert.ok(await page.locator('.game-card').count() >= 18);
      assert.deepEqual(errors, []); record.status = 'PASS';
    } catch (error) { record.status = 'FAIL'; record.error = error.message; record.last = await read(page).catch(() => null); await capture('FAIL').catch(() => {}); process.exitCode = 1; }
    finally { record.errors = errors; await context.close(); console.log(profile.name, record.status, record.error?.slice(0, 180) ?? ''); await writeFile(`${out}/report.json`, JSON.stringify({ base, records, limitations: 'Native keyboard/mouse/CDP touch events; diagnostics read only. Viewports do not establish physical-device feel or human fun.' }, null, 2)); }
  }
} finally { await browser.close(); }
