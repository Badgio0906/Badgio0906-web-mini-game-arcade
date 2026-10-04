import { enterSortPlay } from './helpers/sort-flow';
import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('static Sort route uses native conveyor without loading Phaser or exposing development diagnostics', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const scripts: Array<Promise<{ url: string; status: number; inspected: boolean; bytes: number; engine: boolean; error?: string }>> = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'script') scripts.push((async () => {
      // A reload can return HTTP 304; inspect its earlier 200 body rather than request a missing body.
      if (response.status() >= 300 && response.status() < 400) return { url: response.url(), status: response.status(), inspected: false, bytes: 0, engine: false };
      const body = await response.text();
      return { url: response.url(), status: response.status(), inspected: true, bytes: Buffer.byteLength(body), engine: /WebGLRenderer|__PHASER__|Phaser v|Phaser\.Game/.test(body) };
    })().catch(error => ({url:response.url(),status:response.status(),inspected:false,bytes:0,engine:false,error:String(error)})));
  });
  await page.goto('/game005.html');
  await expect(page.locator('#play-button')).toBeVisible();
  expect(await page.evaluate(() => '__arcadeDebug' in window || '__orbitDebug' in window)).toBe(false);
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('#left-button')).toBeVisible(); await expect(page.locator('#right-button')).toBeVisible();
  await enterSortPlay(page);
  await expect(page.locator('.sort-board')).toHaveAttribute('data-phase', 'sorting');
  const firstRound = await page.locator('.parcel').evaluate(element => element.classList.contains('round'));
  await page.keyboard.press(firstRound ? 'ArrowLeft' : 'ArrowRight');
  await expect(page.locator('#score-value')).toHaveText('1');
  await expect(page.locator('.sort-board')).toHaveAttribute('data-phase', 'sorting');
  await page.locator('#pause-button').click(); await expect(page.locator('#resume-button')).toBeVisible();
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#resume-button').click();
  const nextRound = await page.locator('.parcel').evaluate(element => element.classList.contains('round'));
  await page.keyboard.press(nextRound ? 'ArrowRight' : 'ArrowLeft');
  await expect(page.locator('#credit-count')).toHaveText('2');
  await expect(page.locator('#best-value')).toHaveText('1');
  await expect(page.locator('#retry-button')).toBeEnabled(); await page.locator('#retry-button').click();
  await expect(page.locator('.sort-board')).toHaveAttribute('data-phase', 'sorting');
  await page.locator('#pause-button').click(); await page.locator('#title-button').click();
  await expect(page.locator('#credit-count')).toHaveText('2'); await page.reload();
  await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#credit-count')).toHaveText('2'); await expect(page.locator('#best-value')).toHaveText('1');
  const loaded = await Promise.all(scripts);
  expect(loaded.length).toBeGreaterThan(0);
  expect(loaded.every(script => !script.error), JSON.stringify(loaded)).toBe(true);
  const inspectedUrls = new Set(loaded.filter(script => script.inspected).map(script => script.url));
  expect(inspectedUrls.size).toBeGreaterThan(0);
  for (const script of loaded) if (script.status === 304) expect(inspectedUrls.has(script.url)).toBe(true);
  expect(loaded.some(script => script.engine), JSON.stringify(loaded)).toBe(false);
  expect(loaded.some(script => /phaser/i.test(script.url)), JSON.stringify(loaded)).toBe(false);
  expect(loaded.reduce((sum, script) => sum + script.bytes, 0)).toBeLessThan(300_000);
  await writeFile('artifacts/qa-game005-production-network.json', JSON.stringify(loaded, null, 2));
  expect(errors).toEqual([]);
});
