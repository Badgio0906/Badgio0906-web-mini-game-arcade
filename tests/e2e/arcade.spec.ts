import { expect, test, type Page } from '@playwright/test';
import type { RunSnapshot } from '../../src/game/contracts';

type Debug = {
  snapshot(): RunSnapshot;
  state(): string;
  telemetry(): Array<{ name: string; data: Record<string, string | number | boolean> }>;
};
function debug(page: Page) {
  return page.evaluate(() => (window as unknown as { __orbitDebug: Debug }).__orbitDebug.snapshot());
}

test('title, orbit input, pause and responsive layout', async ({ page, isMobile }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#play-button')).toBeVisible();
  await expect(page.locator('#credit-count')).toHaveText('3');
  await page.locator('#play-button').click();
  await expect.poll(async () => (await debug(page)).alive).toBe(true);
  const stage = page.locator('#stage');
  await expect(page.locator('canvas')).toBeVisible();
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await debug(page)).lane).toBe('inner');
  if (isMobile) await stage.tap({ position: { x: box!.width / 2, y: box!.height / 2 } });
  else { await stage.focus(); await page.keyboard.press('Space'); }
  await expect.poll(async () => (await debug(page)).lane).toBe('outer');
  await page.waitForTimeout(200);
  if (isMobile) await stage.tap({ position: { x: box!.width / 2, y: box!.height / 2 } });
  else await page.keyboard.press('Enter');
  await expect.poll(async () => (await debug(page)).lane).toBe('inner');
  await page.locator('#pause-button').click();
  await expect(page.locator('#resume-button')).toBeVisible();
  const paused = await debug(page);
  await page.waitForTimeout(350);
  expect((await debug(page)).time).toBeCloseTo(paused.time, 3);
  expect((await debug(page)).lane).toBe(paused.lane);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-paused.png` });
  await page.locator('#resume-button').click();
  await expect.poll(async () => (await debug(page)).time).toBeGreaterThan(paused.time);
  expect((await debug(page)).lane).toBe(paused.lane);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#resume-button')).toBeVisible();
  const background = await debug(page);
  await page.waitForTimeout(250);
  expect((await debug(page)).time).toBeCloseTo(background.time, 3);
  await page.locator('#resume-button').click();
  if (!isMobile) {
    await stage.focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(180);
    const first = await debug(page);
    await page.keyboard.down('Space');
    await page.waitForTimeout(180);
    expect((await debug(page)).lane).toBe(first.lane);
    await page.keyboard.up('Space');
  }
  await page.locator('#pause-button').click();
  await page.locator('#title-button').click();
  await expect(page.locator('#play-button')).toBeVisible();
  await expect(page.locator('#credit-count')).toHaveText('3');
  expect((await debug(page)).alive).toBe(false);
  await page.locator('#play-button').click();
  await expect.poll(async () => (await debug(page)).alive).toBe(true);
  expect((await debug(page)).time).toBeLessThan(1);
  expect((await debug(page)).lane).toBe('inner');
  expect(errors).toEqual([]);
});

test('preserved pagehide pauses Orbit, then resumed collision produces one terminal event and credit charge', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/');
  await page.locator('#play-button').click();
  await expect.poll(async () => (await debug(page)).alive).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('#resume-button')).toBeVisible();
  const paused = await debug(page);
  await page.waitForTimeout(250);
  expect((await debug(page)).time).toBeCloseTo(paused.time, 4);
  const before = await page.evaluate(() => (window as unknown as { __orbitDebug: Debug }).__orbitDebug.telemetry());
  expect(before.filter(event => ['quit', 'run_end', 'run_duration', 'credit_used'].includes(event.name))).toHaveLength(0);
  await page.locator('#resume-button').click();
  await expect(page.locator('#retry-button')).toBeVisible({ timeout: 30_000 });
  const events = await page.evaluate(() => (window as unknown as { __orbitDebug: Debug }).__orbitDebug.telemetry());
  expect(events.filter(event => event.name === 'quit')).toHaveLength(0);
  const endings = events.filter(event => event.name === 'run_end');
  expect(endings).toHaveLength(1);
  expect(endings[0].data).toMatchObject({ game_id: 'game001', outcome: 'over', reason: 'collision' });
  const durations = events.filter(event => event.name === 'run_duration');
  expect(durations).toHaveLength(1);
  expect(durations[0].data.reason).toBe('over');
  expect(events.filter(event => event.name === 'credit_used')).toHaveLength(1);
  await expect(page.locator('#credit-count')).toHaveText('2');
});

test('three natural deaths, fast retry, persisted best and single rewarded refill', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Full persistence/reward lifecycle uses desktop; touch flow is covered above.');
  await page.goto('/');
  await page.locator('#play-button').click();
  for (let remaining = 2; remaining >= 0; remaining--) {
    await expect.poll(async () => (await debug(page)).alive, { timeout: 30_000, intervals: [50] }).toBe(false);
    await expect(page.locator('#credit-count')).toHaveText(String(remaining), { timeout: 200 });
    await expect(page.locator('#retry-button, #reward-button').filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#credit-count')).toHaveText(String(remaining));
    expect((await debug(page)).alive).toBe(false);
    if (remaining > 0) {
      await page.locator('#retry-button').click();
      await expect.poll(async () => (await debug(page)).alive).toBe(true);
      expect((await debug(page)).time).toBeLessThan(1);
    }
  }
  const best = await page.locator('#best-value').textContent();
  expect(Number(best?.replace(/,/g, ''))).toBeGreaterThan(0);
  const before = await page.evaluate(() => (window as unknown as { __orbitDebug: Debug }).__orbitDebug.telemetry().map(event => event.name));
  expect(before.filter(name => name === 'run_end')).toHaveLength(3);
  expect(before.filter(name => name === 'credit_used')).toHaveLength(3);
  expect(before.filter(name => name === 'credit_zero')).toHaveLength(1);
  await page.locator('#reward-button').click();
  await expect(page.locator('#reward-button')).toBeDisabled();
  await page.evaluate(() => {
    const reward = document.querySelector<HTMLButtonElement>('#reward-button');
    for (let n = 0; n < 8; n++) reward?.click();
  });
  await expect(page.locator('#credit-count')).toHaveText('3');
  const events = await page.evaluate(() => (window as unknown as { __orbitDebug: Debug }).__orbitDebug.telemetry().map(event => event.name));
  expect(events.filter(name => name === 'reward_requested')).toHaveLength(1);
  expect(events.filter(name => name === 'reward_granted')).toHaveLength(1);
  await page.reload();
  await expect(page.locator('#credit-count')).toHaveText('3');
  await expect(page.locator('#best-value')).toHaveText(best!);
});

test('denied browser storage remains playable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage denied', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
  });
  await page.goto('/');
  await expect(page.locator('#credit-count')).toHaveText('3');
  await page.locator('#play-button').click();
  await expect(page.locator('#retry-button')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#credit-count')).toHaveText('2');
  await page.locator('#retry-button').click();
  await expect.poll(async () => (await debug(page)).alive).toBe(true);
  expect(errors).toEqual([]);
});

test('mobile NO CREDIT result remains visible and refills by touch', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Desktop reward lifecycle is covered above.');
  await page.addInitScript(() => localStorage.setItem('orbit-shift:v1:credits', '1'));
  await page.goto('/');
  await expect(page.locator('#credit-count')).toHaveText('1');
  await page.locator('#play-button').tap();
  const reward = page.locator('#reward-button');
  await expect(reward).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#credit-count')).toHaveText('0');
  const field = (await page.locator('#stage').boundingBox())!;
  for (const control of [reward, page.locator('#title-button'), page.locator('.stub-note'), ...await page.locator('.reward-summary > span').all()]) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(box!.x).toBeGreaterThanOrEqual(field.x);
    expect(box!.y).toBeGreaterThanOrEqual(field.y);
    expect(box!.x + box!.width).toBeLessThanOrEqual(field.x + field.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(field.y + field.height + 1);
  }
  await expect(page.locator('.reward-summary')).toContainText('MAX COMBO');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-no-credit.png` });
  await reward.tap();
  await expect(page.locator('#credit-count')).toHaveText('3');
  await expect.poll(async () => (await debug(page)).alive).toBe(true);
});
