import { expect, test } from '@playwright/test';
import { inspectNativeScripts } from './helpers/production-scripts';

test('static Elevator makes real board/unload decisions and commits overload before warning, with no Phaser or DEV hooks', async ({ page }) => {
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const audit=inspectNativeScripts(page);await page.goto('/game007.html');await expect(page.locator('#play-button')).toBeVisible();expect(await page.evaluate(()=>'__arcadeDebug'in window||'__orbitDebug'in window)).toBe(false);
  await expect(page.locator('canvas')).toHaveCount(0);await page.locator('#play-button').click();await page.locator('#stage').focus();
  for(let floor=1;floor<=4;floor++){
    await expect(page.locator('#app')).toHaveAttribute('data-phase','boarding');await expect(page.locator('#floor-value')).toHaveText(String(floor));
    if(floor===4)await expect(page.locator('#load-value')).toHaveText('330');
    await page.keyboard.press('ArrowRight');if(floor<4)await expect(page.locator('#floor-value')).toHaveText(String(floor+1));
  }
  await expect(page.locator('#credit-count')).toHaveText('2',{timeout:200});await expect(page.locator('.overload-banner')).toBeVisible();await expect(page.locator('#brand-button')).toBeDisabled();await expect(page.locator('#retry-button')).toBeVisible();await expect(page.locator('.result-reason')).toContainText('185');
  const best=await page.locator('#best-value').textContent();expect(Number(best)).toBeGreaterThan(0);await page.locator('#mute-button').click();await page.locator('#retry-button').click();await expect(page.locator('#floor-value')).toHaveText('1');await expect(page.locator('#credit-count')).toHaveText('2');
  await page.locator('#pause-button').click();await expect(page.locator('#resume-button')).toBeVisible();await page.locator('#title-button').click();await page.reload();await expect(page.locator('#best-value')).toHaveText(best!);await expect(page.locator('#credit-count')).toHaveText('2');await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');
  await audit('artifacts/qa-game007-production-network.json');expect(errors).toEqual([]);
});
