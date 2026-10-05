import { expect, test } from '@playwright/test';
const native = [...Array.from({ length: 11 }, (_, i) => `game${String(i + 1).padStart(3, '0')}`), ...[15, 16, 17, 18, 19].map(i => `game${String(i).padStart(3, '0')}`)];
const legacy = ['yokodori-days', 'tachibana-task-heaven', 'finger-heart-challenge'];
const paths = [...native.map(id => `./${id}.html`), ...legacy.map(slug => `./games/${slug}/index.html`)];
async function events(page: import('@playwright/test').Page) { return page.evaluate(() => { const debug = (window as any).__arcadeDebug ?? (window as any).__orbitDebug; return debug?.telemetry?.() ?? (window as any).__game019?.telemetry ?? []; }); }

for (const path of paths) test(`${path}: first visit offers three distinct accessible start choices`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(path);
  for (const [id, label] of [['play-button', 'すぐ遊ぶ'], ['tutorial-explain-button', '説明を見る'], ['tutorial-again-button', '練習する']]) {
    const button = page.locator(`#${id}`); await expect(button).toBeVisible(); await expect(button).toHaveText(label);
    const box = (await button.boundingBox())!; expect(box.height).toBeGreaterThanOrEqual(43.5); expect(box.width).toBeGreaterThanOrEqual(43.5);
    expect(box.x).toBeGreaterThanOrEqual(-.5); expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width + .5);
  }
  await page.locator('#tutorial-explain-button').click();
  if (path.includes('/games/')) {
    await expect(page.locator('.legacy-card h2')).toHaveText('遊び方');
    await expect(page.locator('#legacy-game-frame')).not.toBeVisible();
    await page.locator('#title-button').click();
  } else if (native.slice(0, 12).some(id => path.includes(id))) {
    await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase', 'explanation');
    await page.locator('#tutorial-close-button').click();
  } else {
    await expect(page.locator('#app')).toHaveAttribute('data-state', 'explanation');
    await page.locator('#title-button').click();
  }
  await expect(page.locator('#play-button')).toBeVisible();
  expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  expect(errors).toEqual([]);
});

for (const id of native) test(`${id}: immediate first run skips tutorial without inventing completion`, async ({ page }) => {
  await page.goto(`./${id}.html`); const button = page.locator('#play-button'); await expect(button).toBeEnabled(); await button.click();
  if (id === 'game018') { await expect(page.locator('#app')).toHaveAttribute('data-state', 'selection'); await page.locator('#start-button').click(); }
  await expect(page.locator('#app')).toHaveAttribute('data-state', 'playing');
  await expect(page.locator('#arcade-training')).not.toBeVisible();
  const completion = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('tutorialCompleted')));
  expect(completion.filter(([, value]) => value === 'true')).toEqual([]);
  const log = await events(page); expect(log.filter((e: any) => e.name === 'run_start')).toHaveLength(1);
  expect(log.some((e: any) => e.name === 'tutorial_skip')).toBe(true);
});

test('explicit shared practice has no production run and held answer cannot start a run', async ({ page }) => {
  await page.goto('./game011.html'); const best = await page.locator('#best-value').textContent();
  await page.locator('#tutorial-again-button').click(); await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase', 'practice');
  expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  await page.locator('[data-practice-action="unko"]').focus(); await page.keyboard.down('Enter');
  await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase', 'success'); await page.keyboard.down('Enter'); await page.keyboard.up('Enter');
  expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
  await expect(page.locator('#best-value')).toHaveText(best!); await page.locator('#tutorial-start-button').click();
  await expect(page.locator('#play-button')).toBeVisible(); expect((await events(page)).filter((e: any) => e.name === 'run_start')).toHaveLength(0);
});

for (const slug of legacy) test(`${slug}: shell practice never loads or runs production engine`, async ({ page }) => {
  await page.goto(`./games/${slug}/index.html`); await page.locator('#tutorial-again-button').click();
  await expect(page.locator('#practice-sample')).toBeVisible(); await expect(page.locator('#legacy-game-frame')).not.toHaveAttribute('src', /.+/);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => !key.includes('telemetry')))).toEqual([]);
  if (slug === 'tachibana-task-heaven') for (let i = 1; i <= 4; i++) await page.locator(`[data-pad="${i}"]`).click();
  else for (let i = 0; i < 2; i++) { await expect(page.locator('#practice-sample')).toContainText(slug === 'yokodori-days' ? '作業中' : 'グー'); await expect(page.locator('#practice-sample')).toContainText(slug === 'yokodori-days' ? 'よそ見中' : '指ハート'); await page.locator('#practice-action').click(); }
  await expect(page.locator('.legacy-card h2')).toHaveText('できました！'); await expect(page.locator('#legacy-game-frame')).not.toHaveAttribute('src', /.+/);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => !key.includes('telemetry')))).toEqual([]);
});
