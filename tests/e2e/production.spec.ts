import { expect, test } from '@playwright/test';

test('built static game starts, receives input, persists death and contains no development hook', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#play-button')).toBeVisible();
  expect(await page.evaluate(() => '__orbitDebug' in window)).toBe(false);
  await expect(page.locator('#credit-count')).toHaveText('3');
  await page.locator('#play-button').click();
  await page.locator('#stage').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#lane-value')).toContainText('OUTER');
  await page.waitForTimeout(180);
  await page.keyboard.press('Enter');
  await expect(page.locator('#lane-value')).toContainText('INNER');
  await expect(page.locator('#retry-button')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#credit-count')).toHaveText('2');
  const best = await page.locator('#best-value').textContent();
  expect(Number(best?.replace(/,/g, ''))).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#play-button')).toBeVisible();
  await expect(page.locator('#credit-count')).toHaveText('2');
  await expect(page.locator('#best-value')).toHaveText(best!);
  expect(await page.evaluate(() => '__orbitDebug' in window)).toBe(false);
  expect(errors).toEqual([]);
});
