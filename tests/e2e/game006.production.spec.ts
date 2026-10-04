import { expect, test } from '@playwright/test';

test('static Parking route uses visible native gauges to park a complete car without diagnostic hooks', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('/game006.html'); await expect(page.locator('#play-button')).toBeVisible();
  expect(await page.evaluate(() => '__arcadeDebug' in window || '__orbitDebug' in window)).toBe(false);
  await expect(page.locator('#credit-count')).toHaveText('3'); await page.locator('#play-button').click(); await page.locator('#stage').focus();
  await expect.poll(async () => Math.abs(parseFloat((await page.locator('#angle-value').textContent())!)), { timeout: 15_000, intervals: [20] }).toBeLessThan(.5);
  await page.keyboard.press('Space');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'power');
  await expect.poll(async () => Math.abs(parseFloat((await page.locator('#power-value').textContent())!) - 55), { timeout: 12_000, intervals: [20] }).toBeLessThanOrEqual(1);
  await page.keyboard.press('Space'); await expect(page.locator('#parked-value')).toHaveText('1', { timeout: 12_000 });
  expect(Number(await page.locator('#score-value').textContent())).toBeGreaterThanOrEqual(100);
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.locator('#pause-button').click(); await expect(page.locator('#resume-button')).toBeVisible();
  const score = await page.locator('#score-value').textContent(); await page.waitForTimeout(250); await expect(page.locator('#score-value')).toHaveText(score!);
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');
  await page.locator('#resume-button').click(); await expect(page.locator('#app')).toHaveAttribute('data-phase','angle');
  await page.keyboard.press('Space'); await expect(page.locator('#app')).toHaveAttribute('data-phase','power');
  await page.keyboard.press('Space'); await expect(page.locator('#retry-button')).toBeVisible({timeout:12_000});
  await expect(page.locator('#credit-count')).toHaveText('2'); await expect(page.locator('#best-value')).toHaveText(score!);
  await page.reload(); await expect(page.locator('#credit-count')).toHaveText('2'); await expect(page.locator('#best-value')).toHaveText(score!); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');
  await page.goto('/game005.html'); await expect(page.locator('#credit-count')).toHaveText('3'); await expect(page.locator('#best-value')).toHaveText('0'); expect(errors).toEqual([]);
});
