# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: start-choices.spec.ts >> finger-heart-challenge: shell practice never loads or runs production engine
- Location: tests/e2e/start-choices.spec.ts:54:28

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('.legacy-card h2')
Expected: "できました！"
Received: "操作を練習する"
Timeout:  10000ms

Call log:
  - Expect "toHaveText" locator('.legacy-card h2') with timeout 10000ms
  - waiting for locator('.legacy-card h2')
    24 × locator resolved to <h2>操作を練習する</h2>
       - unexpected value "操作を練習する"

```

```yaml
- heading "操作を練習する" [level=2]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | const native = [...Array.from({ length: 11 }, (_, i) => `game${String(i + 1).padStart(3, '0')}`), ...[15, 16, 17, 18, 19].map(i => `game${String(i).padStart(3, '0')}`)];
  3  | const legacy = ['yokodori-days', 'tachibana-task-heaven', 'finger-heart-challenge'];
  4  | const paths = [...native.map(id => `./${id}.html`), ...legacy.map(slug => `./games/${slug}/index.html`)];
  5  | async function events(page: import('@playwright/test').Page) { return page.evaluate(() => { const debug = (window as any).__arcadeDebug ?? (window as any).__orbitDebug; return debug?.telemetry?.() ?? (window as any).__game019?.telemetry ?? []; }); }
  6  |
  7  | for (const path of paths) test(`${path}: first visit offers three distinct accessible start choices`, async ({ page }) => {
  8  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  9  |   await page.goto(path);
  10 |   for (const [id, label] of [['play-button', 'すぐ遊ぶ'], ['tutorial-explain-button', '説明を見る'], ['tutorial-again-button', '練習する']]) {
  11 |     const button = page.locator(`#${id}`); await expect(button).toBeVisible(); await expect(button).toHaveText(label);
  12 |     const box = (await button.boundingBox())!; expect(box.height).toBeGreaterThanOrEqual(43.5); expect(box.width).toBeGreaterThanOrEqual(43.5);
  13 |     expect(box.x).toBeGreaterThanOrEqual(-.5); expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + .5);
  14 |   }
  15 |   await page.locator('#tutorial-explain-button').click();
  16 |   if (path.includes('/games/')) {
  17 |     await expect(page.locator('.legacy-card h2')).toHaveText('遊び方');
  18 |     await expect(page.locator('#legacy-game-frame')).not.toBeVisible();
  19 |     await page.locator('#title-button').click();
  20 |   } else if (native.slice(0, 12).some(id => path.includes(id))) {
  21 |     await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase', 'explanation');
  22 |     await page.locator('#tutorial-close-button').click();
  23 |   } else {
  24 |     await expect(page.locator('#app')).toHaveAttribute('data-state', 'explanation');
  25 |     await page.locator('#title-button').click();
  26 |   }
  27 |   await expect(page.locator('#play-button')).toBeVisible();
  28 |   expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  29 |   expect(errors).toEqual([]);
  30 | });
  31 |
  32 | for (const id of native) test(`${id}: immediate first run skips tutorial without inventing completion`, async ({ page }) => {
  33 |   await page.goto(`./${id}.html`); const button = page.locator('#play-button'); await expect(button).toBeEnabled(); await button.click();
  34 |   if (id === 'game018') { await expect(page.locator('#app')).toHaveAttribute('data-state', 'selection'); await page.locator('#start-button').click(); }
  35 |   await expect(page.locator('#app')).toHaveAttribute('data-state', 'playing');
  36 |   await expect(page.locator('#arcade-training')).not.toBeVisible();
  37 |   const completion = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('tutorialCompleted')));
  38 |   expect(completion.filter(([, value]) => value === 'true')).toEqual([]);
  39 |   const log = await events(page); expect(log.filter((e: any) => e.name === 'run_start')).toHaveLength(1);
  40 |   expect(log.some((e: any) => e.name === 'tutorial_skip')).toBe(true);
  41 | });
  42 |
  43 | test('explicit shared practice has no production run and held answer cannot start a run', async ({ page }) => {
  44 |   await page.goto('./game011.html'); const best = await page.locator('#best-value').textContent();
  45 |   await page.locator('#tutorial-again-button').click(); await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase', 'practice');
  46 |   expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  47 |   await page.locator('[data-practice-action="unko"]').focus(); await page.keyboard.down('Enter');
  48 |   await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase', 'success'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  49 |   expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  50 |   await expect(page.locator('#best-value')).toHaveText(best!); await page.locator('#tutorial-start-button').click();
  51 |   await expect(page.locator('#play-button')).toBeVisible(); expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  52 | });
  53 |
  54 | for (const slug of legacy) test(`${slug}: shell practice never loads or runs production engine`, async ({ page }) => {
  55 |   await page.goto(`./games/${slug}/index.html`); await page.locator('#tutorial-again-button').click();
  56 |   await expect(page.locator('#practice-sample')).toBeVisible(); await expect(page.locator('#legacy-game-frame')).not.toHaveAttribute('src', /.+/);
  57 |   expect(await page.evaluate(() => Object.keys(localStorage).filter(key => !key.includes('telemetry')))).toEqual([]);
  58 |   if (slug === 'tachibana-task-heaven') for (let i = 1; i <= 4; i++) await page.locator(`[data-pad="${i}"]`).click();
  59 |   else for (let i = 0; i < 2; i++) { await expect(page.locator('#practice-sample')).toContainText(slug === 'yokodori-days' ? 'よそ見中' : '指ハート'); await page.locator('#practice-action').click(); }
> 60 |   await expect(page.locator('.legacy-card h2')).toHaveText('できました！'); await expect(page.locator('#legacy-game-frame')).not.toHaveAttribute('src', /.+/);
     |                                                 ^ Error: expect(locator).toHaveText(expected) failed
  61 |   expect(await page.evaluate(() => Object.keys(localStorage).filter(key => !key.includes('telemetry')))).toEqual([]);
  62 | });
  63 |
```
