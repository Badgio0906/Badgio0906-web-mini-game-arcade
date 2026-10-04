import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Fresh native input plus readonly answer planning, never simulated time/state.
const base = process.env.REVIEW_BASE_URL;
if (!base) throw Error('Supply the explicitly released frozen candidate.');
const device = process.argv[2] ?? 'desktop', touch = device === 'mobile';
const viewport = touch ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const out = 'docs/migration/screenshots/game011'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
const page = await context.newPage(), errors = [];
const records = [{ kind: 'candidate', base, device, viewport, freshContext: true, nativeInputs: true, readonlyAnswerOracle: true, humanRecognitionEvidence: false }];
page.on('pageerror', e => errors.push(e.message));
const read = () => page.evaluate(() => ({ state: window.__arcadeDebug.state(), inspection: window.__arcadeDebug.inspection(), focus: document.activeElement?.id, status: document.querySelector('.question-status')?.textContent, description: document.querySelector('.question-copy p')?.textContent }));
const native = selector => page.locator(selector)[touch ? 'tap' : 'click']();
async function shot(name) { const path = `${out}/independent-${device}-${name}.png`; await page.screenshot({ path }); records.push({ kind: 'capture', name, path, ...await read() }); }
async function phase(value) { await page.waitForFunction(value => window.__arcadeDebug.inspection().phase === value, value); }
function tier(number) { return number <= 20 ? { deadline: 2, points: 100 } : number <= 50 ? { deadline: 1.5, points: 200 } : { deadline: .5, points: 500 }; }
async function answer(pointer = touch) {
  const before = await read(), s = before.inspection, expected = tier(s.questionNumber);
  if (s.deadline !== expected.deadline || s.pointsPerCorrect !== expected.points) throw Error('Actual cumulative tier mismatch');
  if (pointer) await native(`#${s.answerSide}-button`); else await page.keyboard.press(s.answerSide === 'left' ? 'ArrowLeft' : 'ArrowRight');
  const after = await read(); records.push({ kind: 'nativeCorrect', ordinal: s.questionNumber, before, after });
  if (after.inspection.score !== s.score + expected.points) throw Error('Native correct answer failed exact tier award');
}
try {
  await page.goto(`${base}/game011.html`); await shot('title');
  await native('#play-button'); await native('#tutorial-practice-button'); await native('[data-practice-action="unko"]'); await native('#tutorial-start-button');
  await page.waitForFunction(() => document.querySelector('.unko-board')?.dataset.loading === 'false' && window.__arcadeDebug.inspection().alive);
  await page.evaluate(() => {
    window.__tierReviewEvents = [];
    for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']) document.addEventListener(type, e => window.__tierReviewEvents.push({ type, time: performance.now(), key: e.key, target: e.target.id, phase: window.__arcadeDebug.inspection().phase, ordinal: window.__arcadeDebug.inspection().questionNumber }), { capture: true });
  });
  await shot('first-image-two-seconds');
  for (let i = 1; i <= 10; i++) await answer(touch || i <= 2);
  await phase('text_intro'); await shot('text-intro'); await native('#continue-button'); await phase('text_read'); await shot('untimed-text');
  let release;
  if (touch) {
    const r = await page.locator('#ready-button').boundingBox(), cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 }] });
    release = async () => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); };
  } else {
    await page.locator('#ready-button').focus(); await page.keyboard.down('Space'); release = () => page.keyboard.up('Space');
  }
  await page.waitForTimeout(1200); const held = await read(); records.push({ kind: 'nativeReadyHeld', ...held });
  if (held.inspection.phase !== 'text_read' || held.inspection.choices !== null) throw Error('Held READY revealed timed choices');
  await release(); await phase('text_answer'); await answer();
  for (let i = 2; i <= 10; i++) {
    await phase('text_read'); await page.waitForTimeout(i === 2 ? 700 : 30); await native('#ready-button'); await phase('text_answer');
    if (i === 10) await shot('actual-question20'); await answer();
  }
  await phase('final_choice'); await shot('earned-final-choice');
  const choiceBefore = await read(); await page.waitForTimeout(500); records.push({ kind: 'untimedFinalChoice', before: choiceBefore, after: await read() });
  await native(touch ? '#ukon-mode-button' : '#unko-mode-button'); await phase('final_answer');
  // The first final answer uses no intervening PAUSE/focus change.
  await answer(); await shot('actual-one-and-half-second-final');
  const count = touch ? 32 : 35;
  for (let i = 2; i <= count; i++) {
    const current = (await read()).inspection;
    if (current.questionNumber === 50) await shot('actual-question50');
    if (current.questionNumber === 51) {
      await native('#pause-button'); await page.waitForTimeout(400); await shot('actual-question51-half-second-paused'); await native('#resume-button');
    }
    await answer();
  }
  const earned = await read(), expectedScore = 8000 + (count - 30) * 500;
  if (earned.inspection.score !== expectedScore || earned.inspection.finalStreak !== count) throw Error('Cumulative threshold total mismatch');
  records.push({ kind: 'earnedCumulativeTotal', ...earned });
  await page.waitForFunction(() => window.__arcadeDebug.state() === 'result'); await shot('earned-timeout-result');
  const began = Date.now(); await native('#retry-button'); await phase('image_answer'); const reset = await read();
  records.push({ kind: 'nativeRetry', wallMs: Date.now() - began, ...reset });
  if (reset.inspection.score !== 0 || reset.inspection.questionNumber !== 1 || reset.inspection.deadline !== 2) throw Error('Retry did not reset first tier');
} catch (error) { records.push({ kind: 'reviewFailure', message: String(error), ...await read() }); throw error; }
finally {
  records.push({ kind: 'diagnostics', errors, events: await page.evaluate(() => window.__tierReviewEvents ?? []), telemetry: await page.evaluate(() => window.__arcadeDebug?.telemetry()) });
  await writeFile(`${out}/independent-${device}-TIER_RECORD.json`, JSON.stringify(records, null, 2) + '\n'); await context.close(); await browser.close();
}
