import { expect, test, type Page } from '@playwright/test';
import type { EchoInspection } from '../../src/games/game004/contracts';

type Diagnostic = { gameId: string; inspection(): EchoInspection; state(): string; telemetry(): Array<{ name: string; data: Record<string, string | number | boolean> }> };
const read = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.inspection());
const events = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.telemetry());
const oracle = (page: Page) => read(page);
async function recall(page: Page) { await expect.poll(async () => (await read(page)).phase, { timeout: 15_000, intervals: [20] }).toBe('recall'); }
async function input(page: Page, cell: number, touch = false) { const button = page.locator(`#cell-${cell}`); if (touch) await button.tap(); else await button.click(); }
async function complete(page: Page, touch = false) {
  await recall(page); const run = await oracle(page);
  for (const cell of run.sequence) await input(page, cell, touch);
  await expect.poll(async () => (await read(page)).level).toBe(run.level + 1);
  return run;
}
async function wrong(page: Page, touch = false) {
  await recall(page); const run = await oracle(page); const actual = (run.expectedCell! + 1) % 9;
  await input(page, actual, touch);
  await expect.poll(async () => (await read(page)).alive, { timeout: 500 }).toBe(false);
  return { run, actual };
}
async function fits(page: Page, selectors: string[]) {
  const v = page.viewportSize()!;
  for (const selector of selectors) {
    const b = (await page.locator(selector).boundingBox())!; expect(b, selector).not.toBeNull();
    expect(b.x, selector).toBeGreaterThanOrEqual(-1); expect(b.y, selector).toBeGreaterThanOrEqual(-1);
    expect(b.x + b.width, selector).toBeLessThanOrEqual(v.width + 1); expect(b.y + b.height, selector).toBeLessThanOrEqual(v.height + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
}

test('Echo actual grid ignores WATCH, accepts native activation once, pauses flash/off/recall and persists mute', async ({ page, isMobile }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/game004.html'); await expect(page.locator('#play-button')).toBeVisible(); await page.locator('#play-button').click();
  expect(await page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.gameId)).toBe('game004');
  await expect.poll(async () => (await read(page)).highlightedCell).not.toBeNull();
  const cell = (await read(page)).sequence[0]; const b = (await page.locator(`#cell-${(cell + 1) % 9}`).boundingBox())!;
  if (isMobile) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  expect((await read(page)).correctInputs).toBe(0); expect((await read(page)).alive).toBe(true);
  await page.locator('#pause-button').click(); const flash = await read(page); await page.waitForTimeout(220);
  expect((await read(page)).time).toBe(flash.time); expect((await read(page)).remaining).toBe(flash.remaining); expect((await read(page)).highlightedCell).toBe(flash.highlightedCell);
  await page.locator('#resume-button').click();
  await expect.poll(async () => { const s = await read(page); return s.phase === 'watch' && s.highlightedCell === null; }, { intervals: [10] }).toBe(true);
  await page.locator('#pause-button').click(); const dark = await read(page); await page.waitForTimeout(220); expect((await read(page)).remaining).toBe(dark.remaining);
  await page.locator('#resume-button').click(); await recall(page);
  const run = await read(page);
  if (isMobile) await input(page, run.sequence[0], true);
  else {
    await page.locator(`#cell-${run.sequence[0]}`).focus(); await page.keyboard.down('Enter'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  }
  expect((await read(page)).correctInputs).toBe(1); expect((await read(page)).index).toBe(1); expect((await read(page)).alive).toBe(true);
  const stableCell = (await page.locator(`#cell-${run.sequence[1]}`).boundingBox())!;
  await page.locator('#pause-button').click(); const partial = await read(page); await page.waitForTimeout(220); expect((await read(page)).index).toBe(partial.index); expect((await read(page)).time).toBe(partial.time);
  const pausedCell = (await page.locator(`#cell-${run.sequence[1]}`).boundingBox())!;
  expect(pausedCell.x).toBeCloseTo(stableCell.x, 0); expect(pausedCell.y).toBeCloseTo(stableCell.y, 0);
  const original = page.viewportSize()!;
  const smaller = isMobile
    ? [info.project.name === 'mobile-portrait' ? { width: 320, height: 568 } : { width: 568, height: 320 }]
    : [{ width: 1280, height: 720 }, { width: 1024, height: 768 }];
  for (const size of smaller) {
    await page.setViewportSize(size);
    await fits(page, ['.echo-grid', '#resume-button', '#title-button']);
    await page.screenshot({ path: `artifacts/qa-game004-${info.project.name}-${size.width}-paused.png` });
  }
  await page.setViewportSize(original); await page.locator('#resume-button').click();
  if (!isMobile) { await page.locator(`#cell-${run.sequence[1]}`).focus(); await page.keyboard.press('Space'); } else await input(page, run.sequence[1], true);
  await expect.poll(async () => (await read(page)).level).toBe(2); expect((await read(page)).correctInputs).toBe(2);
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.locator('#resume-button')).toBeVisible(); await page.locator('#title-button').click(); await expect(page.locator('#credit-count')).toHaveText('3');
  const ended = await events(page); expect(ended.every(e => e.data.game_id === 'game004')).toBe(true); expect(ended.filter(e => e.name === 'run_end')).toHaveLength(1); expect(ended.filter(e => e.name === 'run_duration')).toHaveLength(1);
  await page.reload(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true'); expect(errors).toEqual([]);
});

test('Echo several native-click levels show repeated-cell darkness, reveal wrong/expected/full answer, retry before replay finishes, and save reached best', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop'); test.setTimeout(120_000);
  // Seed only the ordinary RNG for repeat coverage; diagnostics remain readonly and all input is native.
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/game004.html'); await page.locator('#play-button').click();
  for (let n = 0; n < 3; n++) await complete(page);
  await expect.poll(async () => (await read(page)).highlightedCell, { intervals: [10] }).toBe(0);
  await expect(page.locator('#cell-0')).toHaveClass(/is-lit/);
  await expect.poll(async () => (await read(page)).highlightedCell, { intervals: [10] }).toBe(null);
  await expect(page.locator('#cell-0')).not.toHaveClass(/is-lit/);
  await expect.poll(async () => (await read(page)).highlightedCell, { intervals: [10] }).toBe(0);
  await expect(page.locator('#cell-0')).toHaveClass(/is-lit/);
  const { run, actual } = await wrong(page); await expect(page.locator('#credit-count')).toHaveText('2', { timeout: 200 });
  await expect(page.locator(`#cell-${actual}`)).toHaveClass(/is-wrong/);
  await expect(page.locator(`#cell-${run.expectedCell}`)).toHaveClass(/is-expected/);
  await expect(page.locator('.result-reason')).toContainText(`押したのは ${actual + 1}`); await expect(page.locator('.result-reason')).toContainText(`次の正解は ${run.expectedCell! + 1}`);
  expect(await page.locator('.sequence-pill b').allTextContents()).toEqual(run.sequence.map(n => String(n + 1)));
  await fits(page, ['.echo-grid', '.result-card', '.correct-sequence', '#retry-button']);
  // The replay remains below/beside the card, not covered by it.
  const grid = (await page.locator('.echo-grid').boundingBox())!; const result = (await page.locator('.result-card').boundingBox())!;
  expect(result.x >= grid.x + grid.width - 1 || result.y >= grid.y + grid.height - 1 || result.x + result.width <= grid.x + 1 || result.y + result.height <= grid.y + 1).toBe(true);
  await expect(page.locator('#retry-button')).toBeEnabled(); await page.locator('#retry-button').click();
  expect((await read(page)).level).toBe(1); expect((await read(page)).phase).toBe('watch'); expect((await read(page)).correctInputs).toBe(0);
  await page.reload(); await expect(page.locator('#best-value')).toHaveText('4'); await expect(page.locator('#credit-count')).toHaveText('2');
});

test('Echo rapid retry cancels a running answer replay instead of waiting for the full sequence', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/game004.html'); await page.locator('#play-button').click();
  await complete(page); await complete(page); await complete(page);
  await wrong(page);
  await expect.poll(async () => page.locator('.is-replay').count(), { intervals: [10] }).toBe(1);
  await expect(page.locator('#retry-button')).toBeEnabled(); await page.locator('#retry-button').click();
  expect((await read(page)).phase).toBe('watch'); expect((await read(page)).level).toBe(1);
  await expect(page.locator('.is-replay')).toHaveCount(0);
  await expect.poll(async () => (await read(page)).phase).toBe('recall');
  expect((await read(page)).correctInputs).toBe(0); expect((await read(page)).alive).toBe(true);
});

test('Echo three single mistakes use credits once, refill once and preserve isolated reached LEVEL', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/game004.html'); await page.locator('#play-button').click();
  for (let remaining = 2; remaining >= 0; remaining--) {
    await wrong(page); await expect(page.locator('#credit-count')).toHaveText(String(remaining), { timeout: 200 });
    await page.evaluate(() => { for (let n = 0; n < 6; n++) document.querySelector<HTMLButtonElement>('#cell-0')?.click(); });
    if (remaining) { await expect(page.locator('#retry-button')).toBeEnabled(); await page.locator('#retry-button').click(); }
  }
  const before = await events(page); for (const name of ['run_start', 'run_end', 'run_duration', 'credit_used', 'memory_level', 'sequence_length']) expect(before.filter(e => e.name === name), name).toHaveLength(3);
  expect(before.filter(e => e.name === 'reward_offer_shown')).toHaveLength(1); await expect(page.locator('#reward-button')).toBeEnabled(); await page.locator('#reward-button').click(); await expect(page.locator('#reward-button')).toBeDisabled();
  await page.evaluate(() => { for (let n = 0; n < 8; n++) document.querySelector<HTMLButtonElement>('#reward-button')?.click(); });
  await expect(page.locator('#credit-count')).toHaveText('3'); const after = await events(page); expect(after.filter(e => e.name === 'reward_requested')).toHaveLength(1); expect(after.filter(e => e.name === 'reward_granted')).toHaveLength(1); expect(after.filter(e => e.name === 'reward_offer_shown')).toHaveLength(1);
  await page.reload(); await expect(page.locator('#best-value')).toHaveText('1'); await expect(page.locator('#credit-count')).toHaveText('3');
  await page.goto('/game003.html'); await expect(page.locator('#best-value')).toHaveText('0'); await expect(page.locator('#credit-count')).toHaveText('3');
});

test('Echo mobile NEW BEST zero-credit feedback/sequence/Stub fit both viewport sizes and touch refills', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop');
  await page.addInitScript(() => localStorage.setItem('web-mini-arcade:v1:game004:credits', '1'));
  await page.goto('/game004.html'); await page.locator('#play-button').tap(); await complete(page, true); const { run } = await wrong(page, true);
  await expect(page.locator('.new-best')).toBeVisible();
  const original = page.viewportSize()!;
  for (const size of [original, info.project.name === 'mobile-portrait' ? { width: 320, height: 568 } : { width: 568, height: 320 }]) {
    await page.setViewportSize(size); await fits(page, ['.echo-grid', '.result-card', '.correct-sequence', '#reward-button', '#title-button', '.result-note']);
    expect(await page.locator('.sequence-pill b').allTextContents()).toEqual(run.sequence.map(n => String(n + 1)));
    for (const selector of ['#reward-button', '#title-button']) expect((await page.locator(selector).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await page.screenshot({ path: `artifacts/qa-game004-${info.project.name}-${size.width}-reward.png` });
  }
  await page.locator('#reward-button').tap(); await expect(page.locator('#credit-count')).toHaveText('3');
});

test('Echo cached pagehide resumes partial recall without duplicate end; saved zero offer does not inflate', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/game004.html'); await page.locator('#play-button').click(); await recall(page); const run = await read(page); await input(page, run.sequence[0]);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await expect(page.locator('#resume-button')).toBeVisible(); expect((await events(page)).filter(e => e.name === 'run_end')).toHaveLength(0);
  await page.locator('#resume-button').click(); expect((await read(page)).index).toBe(1); await wrong(page); expect((await events(page)).filter(e => e.name === 'run_end')).toHaveLength(1); expect((await events(page)).filter(e => e.name === 'run_duration')).toHaveLength(1);
  await page.evaluate(() => localStorage.setItem('web-mini-arcade:v1:game004:credits', '0')); await page.reload(); await expect(page.locator('#reward-button')).toBeVisible(); expect((await events(page)).filter(e => e.name === 'reward_offer_shown')).toHaveLength(1);
  await page.locator('#reward-button').click(); await expect(page.locator('#credit-count')).toHaveText('3'); expect((await events(page)).filter(e => e.name === 'reward_offer_shown')).toHaveLength(1);
});

test('Echo two-finger gesture cannot add a secondary answer; clean native taps still activate exactly once', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-portrait');
  await page.goto('/game004.html'); await page.locator('#play-button').tap(); await recall(page); const run = await read(page);
  const a = (await page.locator(`#cell-${run.sequence[0]}`).boundingBox())!; const b = (await page.locator(`#cell-${(run.sequence[0] + 1) % 9}`).boundingBox())!; const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 }, { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(200);
  const after = await read(page);
  // Native browsers may suppress click for a multi-touch gesture altogether.
  expect(after.correctInputs).toBeLessThanOrEqual(1); expect(after.alive).toBe(true);
  if (!after.correctInputs) await input(page, run.sequence[0], true);
  expect((await read(page)).correctInputs).toBe(1);
  await input(page, run.sequence[1], true);
  expect((await read(page)).correctInputs).toBe(2);
  await expect.poll(async () => (await read(page)).level).toBe(2);
});

test('Echo pointer held during WATCH cannot become a queued answer when released in RECALL; modifier clicks are ignored', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/game004.html'); await page.locator('#play-button').click();
  const opening = await read(page); const b = (await page.locator(`#cell-${opening.sequence[0]}`).boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await recall(page); await page.mouse.up();
  expect((await read(page)).correctInputs).toBe(0); expect((await read(page)).alive).toBe(true);
  await page.locator(`#cell-${opening.sequence[0]}`).click({modifiers:['Control']});
  expect((await read(page)).correctInputs).toBe(0); expect((await read(page)).alive).toBe(true);
  await input(page, opening.sequence[0]); expect((await read(page)).correctInputs).toBe(1);
  const last = (await page.locator(`#cell-${opening.sequence[1]}`).boundingBox())!;
  await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2); await page.mouse.down();
  await page.keyboard.press(String(opening.sequence[1] + 1));
  await expect.poll(async () => (await read(page)).level).toBe(2); await recall(page); await page.mouse.up();
  expect((await read(page)).correctInputs).toBe(2); expect((await read(page)).index).toBe(0); expect((await read(page)).alive).toBe(true);
});

test('Echo reached LEVEL 8 full nine-answer zero-credit feedback stays visible at seven sizes', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop'); test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('web-mini-arcade:v1:game004:credits', '1'));
  await page.goto('/game004.html'); await page.locator('#play-button').click();
  for (let n = 0; n < 7; n++) await complete(page);
  const { run } = await wrong(page); expect(run.level).toBe(8); expect(run.sequence).toHaveLength(9);
  for (const size of [{width:1366,height:900},{width:1280,height:720},{width:1024,height:768},{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:568,height:320}]) {
    await page.setViewportSize(size); await fits(page, ['.echo-grid','.result-card','.correct-sequence','#reward-button','#title-button','.result-note']);
    expect(await page.locator('.sequence-pill b').allTextContents()).toEqual(run.sequence.map(cell => String(cell + 1)));
    await page.screenshot({path:`artifacts/qa-game004-nine-cues-${size.width}-${size.height}.png`});
  }
});
