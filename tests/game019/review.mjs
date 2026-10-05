import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const output = process.env.GAME019_REPORT_DIR || 'docs/game019/QA/independent-native';
const base = process.env.GAME019_URL || 'http://127.0.0.1:5181/';
await mkdir(output, { recursive: true });
const sources = ['game019.html', 'src/games/game019/main.ts', 'src/games/game019/style.css', 'src/games/game019/FrogRun.ts', 'src/games/game019/generation.ts', 'src/games/game019/types.ts', 'src/games/game019/FrogPractice.ts', 'src/games/game019/FrogBoard.ts', 'src/games/game019/frogPixels.ts', 'src/core/TelemetryService.ts', ...(process.env.GAME019_REVIEW_SHOE ? ['game018.html', 'src/games/game018/main.ts', 'src/games/game018/ShoeBoard.ts', 'src/games/game018/ShoeArt.ts', 'src/games/game018/spinGuide.ts'] : [])];
const hashSources = async () => Object.fromEntries(await Promise.all(sources.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const sourceHashes = await hashSources();
const report = { branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(), baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), startedAt: new Date().toISOString(), sourceHashes, runtimeMutation: false, evidence: 'ordinary keyboard/touch inputs guided by readonly exact-physics forecasts; not human fun evaluation', records: [] };
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
let failed = false;
const profiles = [{ name: 'desktop', width: 1440, height: 900, touch: false }, { name: 'phone', width: 390, height: 844, touch: true }, { name: 'narrow', width: 320, height: 568, touch: true }, { name: 'landscape', width: 844, height: 390, touch: true }];
const read = page => page.evaluate(() => window.__game019);
const until = (page, predicate, arg, timeout = 10000) => page.waitForFunction(predicate, arg, { polling: 'raf', timeout });
for (const profile of profiles.filter(p => !process.env.GAME019_SHOE_ONLY && (!process.env.GAME019_PROFILES || process.env.GAME019_PROFILES.split(',').includes(p.name)))) {
  const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch });
  const page = await context.newPage(), errors = [], record = { profile, checks: [], captures: [], jumps: [], errors }; report.records.push(record);
  page.on('pageerror', error => errors.push(error.message));
  const input = selector => profile.touch ? page.locator(selector).tap() : page.locator(selector).click();
  const capture = async name => { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); const path = `${output}/${profile.name}-${name}.png`; await page.screenshot({ path, fullPage: true }); record.captures.push(path); };
  const geometry = async name => {
    const g = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
      targets: [...document.querySelectorAll('button,a')].filter(e => e.getClientRects().length && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden').map(e => { const b = e.getBoundingClientRect(); return { id: e.id || e.dataset.size || e.dataset.direction || e.textContent, x: b.x, y: b.y, width: b.width, height: b.height }; }) }));
    record.checks.push({ name, geometry: g });
    assert.ok(g.scrollWidth <= g.width + 1, `${name}: horizontal overflow`);
    for (const target of g.targets) assert.ok(target.width >= 43.5 && target.height >= 43.5, `${name}: 44px ${target.id}`);
    if (name.startsWith('practice-') || ['well-start', 'sky'].includes(name)) {
      assert.ok(g.scrollHeight <= g.height + 1, `${name}: gameplay must fit viewport; ${g.scrollHeight} > ${g.height}`);
      for (const target of g.targets) assert.ok(target.x >= -1 && target.y >= -1 && target.x + target.width <= g.width + 1 && target.y + target.height <= g.height + 1, `${name}: visible control ${target.id}`);
    }
  };
  async function jump(size, direction) {
    if (profile.touch) { await input(`[data-direction="${direction}"]`); await input(`[data-size="${size}"]`); }
    else { await page.locator('#frog-canvas').focus(); await page.keyboard.press(direction === -1 ? 'ArrowLeft' : direction === 1 ? 'ArrowRight' : 'ArrowUp'); await page.keyboard.press({ small: 'z', medium: 'x', large: 'c' }[size]); }
    await until(page, () => { const d = window.__game019; return d.charging || !d.run.player.grounded || d.state === 'result'; });
    await until(page, () => { const d = window.__game019; return !d.charging && (d.run.player.grounded || d.run.phase === 'milestone' || d.state === 'result'); }, null, 15000);
    if ((await read(page)).run.phase === 'milestone') {
      await capture('shore-milestone');
      await until(page, () => { const d = window.__game019; return d.run.player.grounded || d.state === 'result'; });
    }
    return read(page);
  }
  try {
    await page.goto(base + 'game019.html'); await until(page, () => !!window.__game019); await capture('title'); await geometry('title');
    assert.equal((await read(page)).state, 'title');
    await input('#play-button'); await page.waitForTimeout(160); assert.equal((await read(page)).state, 'playing');
    assert.equal(await page.evaluate(() => localStorage.getItem('web-mini-arcade:v1:game019:practiceCompleted')), null, 'skip must not mark completed');
    await input('#pause-button'); const frozen = (await read(page)).run; await page.waitForTimeout(240); assert.equal((await read(page)).run.time, frozen.time); await capture('pause'); await geometry('pause');
    await input('#title-button'); await input('#tutorial-explain-button'); await capture('explanation'); await geometry('explanation');
    await input('#practice-button'); await page.waitForTimeout(160);
    for (const [stage, size, direction] of [[0, 'small', -1], [1, 'medium', -1], [2, 'large', 1], [3, 'medium', -1]]) {
      const before = await read(page); assert.equal(before.practice.stage, stage); await capture(`practice-${stage}`); await geometry(`practice-${stage}`);
      await jump(size, direction); assert.equal((await read(page)).practice.passed, true, `practice instruction ${stage} must pass`);
      await input('#next-practice-button'); await page.waitForTimeout(160);
    }
    await capture('practice-complete'); const practiceEvents = (await read(page)).telemetry;
    assert.equal(practiceEvents.filter(e => e.name === 'practice_complete').length, 1);
    assert.equal(practiceEvents.filter(e => e.name === 'best_update').length, 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('web-mini-arcade:v1:game019:bestHeightDm')), null, 'practice must not save BEST');
    await input('#play-button'); await page.waitForTimeout(160); await capture('well-start'); await geometry('well-start');
    // Header keyboard activation must remain a UI action.
    const beforeHeader = (await read(page)).run;
    await page.locator('#mute-button').focus(); await page.keyboard.press('Space'); await page.waitForTimeout(150);
    assert.equal((await read(page)).run.player.y, beforeHeader.player.y, 'header Space must not jump');
    await page.locator('#frog-canvas').focus();
    let capturedSky = false, fallTested = false;
    const deadline = Date.now() + 210000;
    for (let index = 0; index < 110; index++) {
      assert.ok(Date.now() < deadline, 'climb watchdog');
      const d = await read(page); if (d.state === 'result') break;
      assert.ok(Array.isArray(d.forecasts), 'readonly all-choice forecasts required');
      const candidates = [...d.forecasts].sort((a, b) => Number(b.cleared || b.milestone) - Number(a.cleared || a.milestone) || (b.landing?.y ?? -1) - (a.landing?.y ?? -1));
      let choice = candidates[0];
      if (!fallTested && d.run.height >= 24 && d.run.height < 90) {
        const bad = candidates.filter(f => f.landing && f.landing.y < d.run.player.y - 100).sort((a, b) => a.landing.y - b.landing.y)[0];
        if (bad) { choice = bad; fallTested = true; }
      }
      assert.ok(choice.cleared || choice.milestone || choice.landing, 'at least a reachable landing');
      const startHeight = d.run.height;
      const after = await jump(choice.size, choice.direction);
      record.jumps.push({ size: choice.size, direction: choice.direction, startHeight, landingHeight: after.run.height, chapter: after.run.chapter, falls: after.run.falls });
      if (fallTested && after.run.falls > 0 && !record.fallEvidence) { record.fallEvidence = { startHeight, height: after.run.height, feedback: after.run.feedback }; await capture('fall-recovery'); assert.equal(after.run.alive, true); }
      if (!capturedSky && after.run.milestoneSeen) { capturedSky = true; await capture('sky-start'); await geometry('sky'); assert.equal(after.run.chapter, 'sky'); }
      if (after.run.height > 145 && !record.upperCapture) { record.upperCapture = true; await capture('upper-sky'); }
    }
    const result = await read(page); assert.equal(result.state, 'result'); assert.equal(result.run.cleared, true); assert.equal(result.run.maxHeight, 200);
    assert.ok(record.fallEvidence, 'ordinary missed jump demonstrates recovery');
    await capture('space-result'); await geometry('result');
    const events = result.telemetry; assert.equal(events.filter(e => e.name === 'run_end' && e.data.outcome === 'clear').length, 1);
    assert.ok(events.some(e => e.name === 'best_update' && e.data.best === 200)); assert.ok(events.some(e => e.name === 'phase_reached' && e.data.phase === 'sky'));
    assert.equal(await page.evaluate(() => localStorage.getItem('web-mini-arcade:v1:game019:bestHeightDm')), '2000');
    await input('#retry-button'); await page.waitForTimeout(160); assert.equal((await read(page)).run.height, 0); assert.equal((await read(page)).run.maxHeight, 0);
    await input('#pause-button'); await input('#title-button'); await page.reload(); await until(page, () => !!window.__game019); assert.equal(await page.locator('#best-value').textContent(), '200.0 m');
    record.result = { maxHeight: 200, jumps: record.jumps.length, firstRunDirect: true, practiceIndependent: true }; record.status = 'PASS';
  } catch (error) { record.status = 'FAIL'; record.error = error.message; failed = true; await capture('FAILURE').catch(() => {}); }
  finally { if (errors.length) { failed = true; record.status = 'FAIL'; } await context.close(); await writeFile(`${output}/partial-report.json`, JSON.stringify(report, null, 2)); console.log(profile.name, record.status, record.error || ''); }
}
if (process.env.GAME019_REVIEW_SHOE) {
  const { until: shoeUntil, read: shoeRead, geometry: shoeGeometry, input: shoeInput, stopAt } = await import('../game018/helpers.mjs');
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch });
    const page = await context.newPage(), errors = [], record = { game: 'game018', profile, captures: [], errors }; report.records.push(record);
    page.on('pageerror', error => errors.push(error.message));
    const capture = async name => { const path = `${output}/shoe-${profile.name}-${name}.png`; await page.screenshot({ path }); record.captures.push(path); };
    try {
      await page.goto(base + 'game018.html'); await page.locator('#play-button').waitFor(); await capture('title'); await shoeGeometry(page);
      await shoeInput(page, profile.touch, '#play-button'); await shoeInput(page, profile.touch, '#start-button');
      await stopAt(page, profile.touch, 'angle', 40, 50); await shoeUntil(page, d => d.snapshot.phase === 'spin', 'spin'); await page.waitForTimeout(250); await capture('spin-fixed'); await shoeGeometry(page);
      await stopAt(page, profile.touch, 'spin', .7, .9); await stopAt(page, profile.touch, 'power', 70, 85);
      await shoeUntil(page, d => d.snapshot.phase === 'kick' && d.snapshot.phaseProgress >= .58 && d.snapshot.phaseProgress < .8, 'kick impact'); await capture('actual-kick');
      await shoeUntil(page, d => d.snapshot.phase === 'flight', 'flight'); await capture('flight');
      await shoeUntil(page, d => d.state === 'result', 'result', 32000); await capture('result'); await shoeGeometry(page);
      const d = await shoeRead(page); record.result = d.snapshot.result; assert.ok(d.snapshot.result.distance > 0);
      assert.ok(d.events.some(e => e.name === 'best_update')); assert.ok(d.events.some(e => e.name === 'specific_game_events' && e.data.event === 'kick'));
      assert.equal(d.events.filter(e => e.name === 'run_end').length, 1); record.status = 'PASS';
    } catch (error) { record.status = 'FAIL'; record.error = error.message; failed = true; await capture('FAILURE').catch(() => {}); }
    finally { if (errors.length) { failed = true; record.status = 'FAIL'; } await context.close(); console.log('shoe', profile.name, record.status, record.error || ''); }
  }
}
await browser.close();
report.endedAt = new Date().toISOString(); report.finalSourceHashes = await hashSources();
try { assert.deepEqual(report.finalSourceHashes, sourceHashes, 'review source must remain fixed'); } catch (error) { report.sourceFreezeFailure = error.message; failed = true; }
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
if (failed) process.exitCode = 1;
