import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import type { TowerInspection, TowerSnapshot } from '../../src/games/game003/contracts';

type Diagnostic = { gameId: string; snapshot(): TowerSnapshot; inspection(): TowerInspection; state(): string; telemetry(): Array<{ name: string; data: Record<string, string | number | boolean> }> };
const read = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.inspection());
const events = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.telemetry());
async function drop(page: Page, touch: boolean) {
  if (touch) { const box = (await page.locator('#stage').boundingBox())!; await page.locator('#stage').tap({ position: { x: box.width / 2, y: box.height * 0.45 } }); }
  else await page.keyboard.press('Space');
}
async function timedFloor(page: Page, touch: boolean, tolerance = 25, fixedCenter?: number) {
  let before!: TowerInspection;
  await expect.poll(async () => { const s = await read(page); before = s; return s.phase === 'hanging' && s.cargo !== null && Math.abs(s.cargo.x - (fixedCenter ?? s.topCenter)) < tolerance; }, { timeout: 25_000, intervals: [20] }).toBe(true);
  await drop(page, touch);
  await expect.poll(async () => (await read(page)).floors, { timeout: 12_000, intervals: [40] }).toBe(before.floors + 1);
}
async function preciseChallengeFloor(page: Page, anticipation: number) {
  const before = await read(page);
  // Return a small read-only readiness signal: full-stack IPC made the2x hanger
  // travel tens of pixels between an observed center and the actual native key.
  const readiness = await page.waitForFunction(lead => {
    const s = (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.inspection();
    const c = s.cargo; if (s.phase !== 'hanging' || !c) return false;
    const fall = Math.sqrt(2 * Math.max(0, s.topY - c.y - c.height / 2) / 720);
    const decay = (1 - Math.exp(-1.5 * fall)) / 1.5;
    const wind = s.floors < 8 ? 0 : Math.sin(s.time * .37) * 3;
    const shadow = c.x + Math.max(-3, Math.min(3, c.vx * .02)) * decay + wind / 1.5 * (fall - decay);
    const predictedError = shadow + c.vx * lead - s.topCenter;
    return Math.abs(predictedError) < 5 && predictedError * c.vx <= 0
      ? { vx: c.vx, center: s.topCenter, shadow } : false;
  }, anticipation, { timeout: 30_000, polling: 'raf' });
  await page.keyboard.press('Space');
  const release = await readiness.jsonValue(); await readiness.dispose();
  if (!release) throw new Error('Readiness must contain the read-only release observation');
  await expect.poll(async () => (await read(page)).floors, { timeout: 12_000, intervals: [40] }).toBe(before.floors + 1);
  return release;
}
async function naturalFailure(page: Page, touch: boolean) {
  for (let n = (await read(page)).floors; n < 3; n++) await timedFloor(page, touch);
  await expect.poll(async () => { const s = await read(page); return s.phase === 'hanging' && s.cargo !== null && Math.abs(s.cargo.x - s.topCenter) > 100; }, { timeout: 20_000, intervals: [30] }).toBe(true);
  await drop(page, touch);
  await expect.poll(async () => (await read(page)).alive, { timeout: 12_000, intervals: [30] }).toBe(false);
}
async function insideViewport(page: Page, selectors: string[]) {
  const viewport = page.viewportSize()!;
  for (const selector of selectors) {
    const box = (await page.locator(selector).boundingBox())!;
    expect(box, selector).not.toBeNull();
    expect(box.x, selector).toBeGreaterThanOrEqual(-1); expect(box.y, selector).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height, selector).toBeLessThanOrEqual(viewport.height + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
}

test('Tower normal key/tap release accepts full cargo, rejects spam, pauses, mutes and resizes', async ({ page, isMobile }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/game003.html'); await expect(page.locator('#credit-count')).toHaveText('3');
  expect(await page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.gameId)).toBe('game003');
  await page.locator('#play-button').click(); await expect.poll(async () => (await read(page)).alive).toBe(true);
  const original = (await read(page)).cargo!; await drop(page, isMobile);
  expect((await read(page)).floors).toBe(0);
  for (let n = 0; n < 4; n++) await drop(page, isMobile);
  await expect.poll(async () => (await read(page)).floors).toBe(1);
  await expect.poll(async () => (await read(page)).phase).toBe('hanging');
  expect((await events(page)).filter(e => e.name === 'run_end')).toHaveLength(0);
  expect((await read(page)).stack[0]).toMatchObject({ width: original.width, height: original.height, mass: original.mass });
  await page.waitForTimeout(300); expect((await read(page)).phase).toBe('hanging');
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true');
  expect((await read(page)).phase).toBe('hanging');
  await page.locator('#pause-button').click(); const paused = await read(page); await page.waitForTimeout(250);
  expect((await read(page)).time).toBeCloseTo(paused.time, 5); expect((await read(page)).cargo!.x).toBe(paused.cargo!.x);
  const originalViewport = page.viewportSize()!;
  await page.setViewportSize(isMobile ? info.project.name === 'mobile-portrait' ? { width: 320, height: 568 } : { width: 568, height: 320 } : { width: 1280, height: 720 });
  await insideViewport(page, ['#stage', '#resume-button', '#title-button']);
  await page.screenshot({ path: `artifacts/qa-game003-${info.project.name}-paused-small.png` });
  await page.setViewportSize(originalViewport); await page.locator('#resume-button').click();
  await expect.poll(async () => (await read(page)).time).toBeGreaterThan(paused.time);
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.locator('#resume-button')).toBeVisible();
  await page.locator('#title-button').click(); await expect(page.locator('#play-button')).toBeVisible(); await expect(page.locator('#credit-count')).toHaveText('3');
  const ended = await events(page); expect(ended.every(e => e.data.game_id === 'game003')).toBe(true);
  expect(ended.filter(e => e.name === 'quit')).toHaveLength(1); expect(ended.filter(e => e.name === 'run_end')).toHaveLength(1); expect(ended.filter(e => e.name === 'run_duration')).toHaveLength(1);
  await page.reload(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true'); expect(errors).toEqual([]);
});

test('Tower three natural failures charge once, persist floor best, and repeat refill clicks grant only three', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop'); test.setTimeout(150_000);
  await page.goto('/game003.html'); await page.locator('#play-button').click();
  for (let remaining = 2; remaining >= 0; remaining--) {
    await naturalFailure(page, false); await expect(page.locator('#credit-count')).toHaveText(String(remaining), { timeout: 200 });
    if (remaining) { await expect(page.locator('#retry-button')).toBeVisible(); await page.locator('#retry-button').click(); await expect.poll(async () => (await read(page)).alive).toBe(true); }
  }
  await expect(page.locator('#reward-button')).toBeVisible(); await expect(page.locator('#best-value')).toHaveText('3');
  const before = await events(page);
  for (const name of ['run_start', 'run_end', 'run_duration', 'credit_used', 'score', 'tower_height', 'perfect_count']) expect(before.filter(e => e.name === name), name).toHaveLength(3);
  expect(before.filter(e => e.name === 'reward_offer_shown')).toHaveLength(1); expect(before.filter(e => e.name === 'credit_zero')).toHaveLength(1);
  await page.locator('#reward-button').click(); await expect(page.locator('#reward-button')).toBeDisabled();
  await page.evaluate(() => { for (let n = 0; n < 8; n++) document.querySelector<HTMLButtonElement>('#reward-button')?.click(); });
  await expect(page.locator('#credit-count')).toHaveText('3');
  const after = await events(page); expect(after.filter(e => e.name === 'reward_requested')).toHaveLength(1); expect(after.filter(e => e.name === 'reward_granted')).toHaveLength(1); expect(after.filter(e => e.name === 'reward_offer_shown')).toHaveLength(1);
  await page.reload(); await expect(page.locator('#best-value')).toHaveText('3'); await expect(page.locator('#credit-count')).toHaveText('3');
  await page.goto('/game002.html'); await expect(page.locator('#best-value')).toHaveText('0'); await expect(page.locator('#credit-count')).toHaveText('3');
});

test('Tower touch NO CREDIT NEW BEST card fits portrait or side-panel landscape at both viewport sizes', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop');
  await page.addInitScript(() => localStorage.setItem('web-mini-arcade:v1:game003:credits', '1'));
  await page.goto('/game003.html'); await page.locator('#play-button').tap(); await naturalFailure(page, true); await expect(page.locator('#reward-button')).toBeVisible();
  await expect(page.locator('.new-best')).toBeVisible();
  const viewport = page.viewportSize()!;
  for (const size of [viewport, info.project.name === 'mobile-portrait' ? { width: 320, height: 568 } : { width: 568, height: 320 }]) {
    await page.setViewportSize(size); await insideViewport(page, ['#stage', '.result-card', '#reward-button', '#title-button', '.result-note']);
    for (const id of ['#reward-button', '#title-button']) expect((await page.locator(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await page.screenshot({ path: `artifacts/qa-game003-${info.project.name}-${size.width}-reward.png` });
  }
  await page.locator('#reward-button').tap(); await expect(page.locator('#credit-count')).toHaveText('3'); await expect(page.locator('#play-button')).toBeVisible();
});

test('Tower saved zero title offer is recorded once without request inflation', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.addInitScript(() => localStorage.setItem('web-mini-arcade:v1:game003:credits', '0'));
  await page.goto('/game003.html'); await expect(page.locator('#reward-button')).toBeVisible();
  expect((await events(page)).filter(e => e.name === 'reward_offer_shown')).toHaveLength(1);
  await page.locator('#reward-button').click(); await expect(page.locator('#credit-count')).toHaveText('3');
  expect((await events(page)).filter(e => e.name === 'reward_offer_shown')).toHaveLength(1);
});

test('Tower cached pagehide pauses instead of quitting; resumed run ends once', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/game003.html'); await page.locator('#play-button').click();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('#resume-button')).toBeVisible(); expect((await events(page)).filter(e => e.name === 'quit' || e.name === 'run_end')).toHaveLength(0);
  await page.locator('#resume-button').click(); await naturalFailure(page, false); await expect(page.locator('#retry-button')).toBeVisible();
  expect((await events(page)).filter(e => e.name === 'run_end')).toHaveLength(1); expect((await events(page)).filter(e => e.name === 'run_duration')).toHaveLength(1); await expect(page.locator('#credit-count')).toHaveText('2');
});

test('Tower simultaneous two fingers release once and leave next cargo hanging', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile-portrait');
  await page.goto('/game003.html'); await page.locator('#play-button').tap();
  const field = (await page.locator('#stage').boundingBox())!; const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: field.x + field.width * .3, y: field.y + field.height * .4, id: 1 }, { x: field.x + field.width * .7, y: field.y + field.height * .4, id: 2 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await read(page)).floors).toBe(1); await expect.poll(async () => (await read(page)).phase).toBe('hanging');
  await page.waitForTimeout(500); expect((await read(page)).phase).toBe('hanging'); expect((await read(page)).floors).toBe(1);
});

test('Tower eighteen normal timed drops scroll above ground and retain accurate full stack', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop'); test.setTimeout(240_000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/game003.html'); await page.locator('#play-button').click();
  await page.locator('#stage').focus();
  for (let n = 0; n < 18; n++) await timedFloor(page, false, 5, 300);
  const tower = await read(page); expect(tower.floors).toBe(18); expect(tower.topY).toBeLessThan(0); expect(tower.stack).toHaveLength(18);
  expect(tower.height).toBeCloseTo(tower.stack.reduce((sum, box) => sum + box.height, 0) / 60, 8);
  expect(tower.perfectCount).toBeLessThanOrEqual(tower.floors);
  expect(tower.precisionScore).toBeGreaterThanOrEqual(tower.perfectCount * 100);
  await expect(page.locator('#score-value')).toHaveText('18'); await expect(page.locator('canvas')).toHaveCount(1);
  await page.locator('#pause-button').click(); const paused = await read(page); await page.waitForTimeout(300); expect((await read(page)).time).toBe(paused.time);
  await page.screenshot({ path: 'artifacts/qa-game003-eighteen-floor-camera.png' });
  expect(errors).toEqual([]);
});

test('Tower real drops reach15m offer, freeze before irreversible C mode, then persist ordinary Perfect bonus separately', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'One actual long C-mode route; seeded physics and multiplier cases cover additional model runs.');
  test.setTimeout(420_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/game003.html'); await page.locator('#play-button').click(); await page.locator('#stage').focus();
  for (let floor = 0; floor < 30 && !(await read(page)).pending; floor++) await timedFloor(page, false, 5, 300);
  const frozen = await read(page);
  expect(frozen).toMatchObject({ pending: 'height15', alive: true, cMode: false, speedMultiplier: 1, perfectMultiplier: 1 });
  expect(frozen.height).toBeGreaterThan(15);
  await expect(page.locator('#normal-button')).toBeVisible(); await expect(page.locator('#challenge-button')).toBeVisible();
  await page.keyboard.down('Space');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.waitForTimeout(400); expect(await read(page)).toEqual(frozen);
  const before = await events(page);
  expect(before.filter(event => event.name === 'milestone_reached')).toHaveLength(1);
  expect(before.filter(event => event.name === 'escalation_offered')).toHaveLength(1);
  for (const name of ['run_end', 'credit_used', 'quit']) expect(before.filter(event => event.name === name), name).toHaveLength(0);
  const offerLayouts = []; const originalViewport = page.viewportSize()!;
  for (const [width, height] of [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]]) {
    await page.setViewportSize({ width, height });
    await insideViewport(page, ['.milestone-card', '#normal-button', '#challenge-button', '#title-button']);
    for (const id of ['#normal-button','#challenge-button','#title-button']) expect((await page.locator(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    offerLayouts.push({ width, height, card: await page.locator('.milestone-card').boundingBox() });
    expect(await read(page)).toEqual(frozen);
  }
  await page.setViewportSize(originalViewport);
  await info.attach('actual-height15-eight-layouts', { body: JSON.stringify(offerLayouts, null, 2), contentType: 'application/json' });
  await page.locator('#challenge-button').click(); await page.keyboard.up('Space');
  await expect.poll(async () => (await read(page)).phase).toBe('hanging');
  const challenge = await read(page);
  expect(challenge).toMatchObject({ pending: null, cMode: true, mode: 'challenge', speedMultiplier: 2, perfectMultiplier: 3, floors: frozen.floors, precisionScore: frozen.precisionScore });
  await page.waitForTimeout(350); expect((await read(page)).phase).toBe('hanging');
  await expect(page.locator('#drop-status')).toContainText('C国');
  let earnedPerfect = false;
  let anticipation = .06;
  const challengeLandings = [];
  for (let n = 0; n < 6 && !earnedPerfect; n++) {
    const beforeFloor = await read(page); const release = await preciseChallengeFloor(page, anticipation); const after = await read(page);
    challengeLandings.push({ release, anticipation, accepted: after.recentlyAccepted, score: after.precisionScore });
    if (after.recentlyAccepted && Math.abs(release.vx) > 20) anticipation = Math.max(0, Math.min(.16, anticipation + (after.recentlyAccepted.x - release.center) / release.vx));
    expect(after.pending).toBeNull(); expect(after.cMode).toBe(true);
    if (after.perfectCount > beforeFloor.perfectCount) {
      expect(after.precisionScore - beforeFloor.precisionScore).toBe(100 * Math.min(after.combo, 8) * 3);
      earnedPerfect = true;
    } else expect(after.precisionScore).toBe(beforeFloor.precisionScore);
  }
  expect(earnedPerfect).toBe(true);
  const final = await read(page);
  await naturalFailure(page, false); await expect(page.locator('#retry-button')).toBeVisible();
  await expect(page.locator('#credit-count')).toHaveText('2');
  const ended = await events(page);
  for (const name of ['run_start', 'run_end', 'run_duration', 'escalation_accepted', 'milestone_reached', 'escalation_offered']) expect(ended.filter(event => event.name === name), name).toHaveLength(1);
  expect(ended.filter(event => event.name === 'credit_used')).toHaveLength(1);
  const saved = await page.evaluate(() => ({ floors: Number(localStorage.getItem('web-mini-arcade:v1:game003:best')), bonus: Number(localStorage.getItem('web-mini-arcade:v1:game003:bestBonus')) }));
  expect(saved).toEqual({ floors: final.floors, bonus: final.precisionScore });
  await page.locator('#retry-button').click();
  expect(await read(page)).toMatchObject({ pending: null, cMode: false, speedMultiplier: 1, perfectMultiplier: 1, floors: 0, precisionScore: 0 });
  expect(errors).toEqual([]);
  const evidencePath = info.outputPath('actual-height15-C-mode.json');
  await writeFile(evidencePath, JSON.stringify({ frozen, challenge, final, offerLayouts, challengeLandings, events: ended, errors }, null, 2));
  await info.attach('actual-height15-C-mode', { path: evidencePath, contentType: 'application/json' });
});
