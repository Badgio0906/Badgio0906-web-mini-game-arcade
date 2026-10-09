// Live published UI, real public GETs, no synthetic production writes.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.LEADERBOARDS_QA_OUT, sha = process.env.RECORDS_EXPECTED_COMMIT;
if (!out || !/^[a-f0-9]{40}$/.test(sha ?? '')) throw Error('Unique output and expected commit required');
await mkdir(out, { recursive: false });
const value = process.env.HTTPS_PROXY || process.env.https_proxy;
const proxy = value ? (() => { const url = new URL(value); return { server: url.origin, username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) }; })() : undefined;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', proxy, args: ['--no-sandbox'] });
const base = 'https://game100garage.com/';
const report = { at: new Date().toISOString(), expected_commit: sha, provenance: 'Actual published HTTP resources and production public GETs; simulated viewports, ordinary Game001 local results, disposable local saves. Every POST blocked. No participant registration, credential creation, score submission, or Analytics POST. Not physical devices/human play.', checks: [], requests: [], post_attempts: 0, errors: [] };
const check = (pass, name, extra = {}) => { report.checks.push({ name, pass: !!pass, ...extra }); if (!pass) throw Error(name); };
let active;
try {
  for (const viewport of [{ width: 1300, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 720 }, { width: 844, height: 390 }]) {
    const touch = viewport.width !== 1300, context = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch }), page = await context.newPage(); active = page;
    await context.addInitScript(() => localStorage.setItem('game100garage:analytics-consent:v1', 'denied'));
    await context.route('**/*', route => { if (route.request().method() === 'POST') { report.post_attempts++; return route.abort(); } return route.continue(); });
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/v1/records/')) { const headers = request.headers(); report.requests.push({ method: request.method(), url: request.url(), authorization: !!headers.authorization, credential: !!headers['x-record-credential'], cookie: !!headers.cookie }); } });
    const portal = async () => {
      await page.goto(base + '?qa=' + sha.slice(0, 12), { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelectorAll('.card-records').length === 30 && !Array.from(document.querySelectorAll('.card-records dd')).some(node => ['読み込み中', '準備中', '取得できません'].includes(node.textContent)));
    };
    await portal();
    check(await page.locator('.game-card').count() === 30 && await page.locator('.leaderboard-button').count() === 20, '30 active cards / 20 TOP10 buttons', { viewport });
    check(await page.locator('[data-game-id=game010]').count() === 0, 'Game010 remains retired', { viewport });
    const structural = await page.locator('.game-card').evaluateAll(cards => cards.every(card => card.querySelector('.card-records').previousElementSibling === card.querySelector('.game-image-link') && card.querySelectorAll('.card-records dl>div').length === 2 && !card.querySelector('a button')));
    check(structural, 'BEST two rows below thumbnail; link/button siblings', { viewport });
    check(await page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').count() === 1, 'AdSense setup retained', { viewport });
    await page.getByText('あなたのBEST・記録共有設定', { exact: true }).click();
    const checkbox = page.locator('.record-sharing-settings input[type=checkbox]');
    check(!await checkbox.isDisabled() && !await checkbox.isChecked(), 'Optional sharing available, initial OFF', { viewport });
    const games = viewport.width === 1300 ? await page.locator('.leaderboard-button').evaluateAll(buttons => buttons.map(button => button.closest('.game-card').dataset.gameId)) : ['game001'];
    for (const id of games) {
      const button = page.locator(`[data-game-id=${id}] .leaderboard-button`), before = page.url();
      await button[touch ? 'tap' : 'click']();
      await page.waitForFunction(() => document.querySelector('.leaderboard-dialog').open && document.querySelector('.leaderboard-status').textContent !== 'ランキングを読み込み中');
      const status = await page.locator('.leaderboard-status').innerText(), rows = await page.locator('.leaderboard-list li').count();
      check(rows <= 10 && (rows > 0 || status === 'まだ記録はありません'), 'Live TOP10 / empty state ' + id, { viewport, rows });
      check(page.url() === before && await page.locator('#leaderboard-title').evaluate(node => node === document.activeElement), 'No game launch, heading focus ' + id, { viewport });
      check((await page.locator('.leaderboard-personal').innerText()).includes('あなたのBEST'), 'Unshared personal BEST visible ' + id, { viewport });
      if (id === 'game001') await page.screenshot({ path: out + `/ranking-${viewport.width}x${viewport.height}.png` });
      await page.keyboard.press('Escape');
      check(await button.evaluate(node => node === document.activeElement), 'Esc restores origin focus ' + id, { viewport });
    }
    const first = page.locator('[data-game-id=game001] .leaderboard-button');
    await first[touch ? 'tap' : 'click'](); await page.getByRole('button', { name: '閉じる', exact: true })[touch ? 'tap' : 'click']();
    check(await first.evaluate(node => node === document.activeElement), 'Close button and repeated open', { viewport });
    check(await page.evaluate(() => localStorage.getItem('game100:records:participant-credential:v1')) === null, 'Viewing never creates participant credentials', { viewport });
    const images = await page.locator('.game-image img').evaluateAll(async nodes => { await Promise.all(nodes.map(async node => { node.loading = 'eager'; await node.decode(); })); return nodes.length === 30 && nodes.every(node => node.naturalWidth > 0); });
    check(images, 'All 30 real published thumbnails decode', { viewport });
    if (viewport.width === 1300 || viewport.width === 390) {
      const card = page.locator('[data-game-id=game001]');
      if (touch) await card.tap(); else { await card.locator('.game-copy-link').focus(); await page.keyboard.press('Enter'); }
      await page.waitForURL('**/game001.html'); await page.locator('#play-button')[touch ? 'tap' : 'click']();
      await page.waitForFunction(() => document.getElementById('app').dataset.state === 'result', null, { timeout: 45000 });
      check(await page.getByRole('button', { name: 'この記録を共有', exact: true }).isDisabled(), 'Automated QA result excluded from production sharing', { viewport });
      const localBest = await page.evaluate(() => localStorage.getItem('orbit-shift:v1:best'));
      check(localBest !== null, 'Ordinary Game001 result preserves original personal BEST', { viewport });
      await page.screenshot({ path: out + `/game001-result-${viewport.width}.png` });
      await portal(); await page.waitForFunction(best => document.querySelector('[data-game-id=game001] .card-records dd').textContent === Number(best).toLocaleString('ja-JP') + ' 点', localBest);
      check(true, 'Local result matches portal BEST without sharing', { viewport });
    }
    await context.close(); active = undefined;
  }
  check(report.requests.length > 20 && report.requests.every(request => request.method === 'GET' && request.url.startsWith('https://analytics.game100garage.com/v1/records/public/') && !request.authorization && !request.credential && !request.cookie), 'Correct production endpoint; anonymous public GET only');
  check(report.post_attempts === 0 && report.errors.length === 0, 'Zero production POST attempts and JS exceptions');
  report.result = 'PASS';
} catch (error) { report.result = 'FAIL'; report.error = error.message; process.exitCode = 1; if (active) await active.screenshot({ path: out + '/failure.png' }).catch(() => {}); }
finally { await browser.close(); await writeFile(out + '/REPORT.json', JSON.stringify(report, null, 2) + '\n'); }
console.log({ out, result: report.result, checks: report.checks.length, error: report.error });
