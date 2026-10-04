import { expect, test } from '@playwright/test';

test('static Tower route plays, pauses and preserves independent best/mute without diagnostic hooks', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/game003.html'); await expect(page.locator('#play-button')).toBeVisible();
  expect(await page.evaluate(() => '__arcadeDebug' in window || '__orbitDebug' in window)).toBe(false);
  await expect(page.locator('#credit-count')).toHaveText('3'); await page.locator('#play-button').click();
  await page.locator('#stage').focus(); await page.keyboard.press('Space'); await expect(page.locator('#score-value')).toHaveText('1');
  await page.locator('#pause-button').click(); await expect(page.locator('#resume-button')).toBeVisible();
  const height = await page.locator('#height-value').textContent(); await page.waitForTimeout(300); await expect(page.locator('#height-value')).toHaveText(height!);
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#resume-button').click(); await page.locator('#pause-button').click(); await page.locator('#title-button').click();
  await expect(page.locator('#credit-count')).toHaveText('3'); await page.reload(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/game002.html'); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'false'); await expect(page.locator('#credit-count')).toHaveText('3'); expect(errors).toEqual([]);
});
