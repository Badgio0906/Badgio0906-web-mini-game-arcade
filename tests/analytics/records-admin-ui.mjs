import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = process.env.RECORDS_ADMIN_BASE_URL ?? 'http://127.0.0.1:4328';
const out = process.env.RECORDS_ADMIN_QA_DIR ?? 'docs/records/QA/admin-fixture-01';
const preparing = process.env.RECORDS_ADMIN_PREPARING === 'true';
await mkdir(out, { recursive: true });
const fixtureId = 'a8328e11-eaf4-4c90-8304-4e2e6a168de1';
const boardId = 'game018.distance.r1.all-shoes';
const best = { board_id: boardId, game_id: 'game018', value: 1234, unit: 'm', mode_label: '全靴', ruleset_id: '1', collected_since: '2026-10-08T00:00:00Z', revision: 1 };
const record = { id: fixtureId, board_id: boardId, value: 1234, received_at: '2026-10-08T00:00:00Z', status: 'pending', inspection_reason: '<img src=x onerror="window.recordsXss=1">', metadata_json: JSON.stringify({ mode_id: 'all-shoes', assistance: 'allowed', duration_ms: 24000, outcome: 'complete', unrelated_secret: 'DO_NOT_DISPLAY' }) };
const evidence = [];
const sourceHashes = {};
for (const path of ['src/analytics-admin/records.ts', 'src/analytics-admin/main.ts', 'src/analytics-admin/style.css', 'src/data/recordDefinitions.ts']) sourceHashes[path] = createHash('sha256').update(await readFile(path)).digest('hex');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    const context = await browser.newContext({ viewport }); const page = await context.newPage();
    const requests = [], errors = []; const candidate = { ...record }; let writes = 0, delay = false, hold = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('http://127.0.0.1:8798/**', async route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type' } }); return; }
      const body = request.postDataJSON();
      requests.push({ path, method: request.method(), authorization_present: !!request.headers().authorization, query: new URL(request.url()).search, cache_control: request.headers()['cache-control'] ?? null, referrer_present: !!request.headers().referer, decision: body?.decision ?? null });
      assert.equal(request.headers().referer, undefined);
      assert.equal(path === '/v1/records/public/bests' ? request.headers().authorization === undefined : !!request.headers().authorization, true);
      if (hold) await new Promise(resolve => setTimeout(resolve, 400));
      let json;
      if (path.endsWith('/public/bests')) json = { boards: [best] };
      else if (request.method() === 'POST') {
        writes++; assert.match(body.operation_key, /^[0-9a-f-]{36}$/); assert.equal(body.reason, '合成fixtureを確認');
        if (delay) await new Promise(resolve => setTimeout(resolve, 250));
        if (body.decision) candidate.status = ({ accept: 'accepted', reject: 'rejected', revoke: 'revoked', restore: 'pending' })[body.decision];
        json = { status: 'reviewed', duplicate: false };
      } else json = { submissions: [candidate] };
      await route.fulfill({ json, headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' } }).catch(() => {});
    });
    await page.goto(`${base}/analytics-admin.html`); assert.equal(requests.length, 0);
    if (preparing) {
      assert.match(await page.locator('#records-status').textContent(), /準備中/);
      for (const selector of ['#records-load', '#records-recalculate', '#records-board', '#records-state']) assert.equal(await page.locator(selector).isDisabled(), true);
      await page.locator('[name=token]').fill('fixture-admin-only'); assert.equal(await page.locator('#records-load').isDisabled(), true); assert.equal(requests.length, 0);
      await page.screenshot({ path: `${out}/preparing-${viewport.width}x${viewport.height}.png`, fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.equal(errors.length, 0);
      evidence.push({ viewport, passed: true, requests, fixture_only: true, preparing: true }); await context.close(); continue;
    }
    await page.locator('#records-load').click(); assert.equal(requests.length, 0); assert.match(await page.locator('#records-status').textContent(), /管理トークンを入力/);
    await page.locator('[name=token]').fill('fixture-admin-only');
    await page.locator('#records-load').click(); await page.getByText('共有記録を取得しました（最近100候補まで）。', { exact: true }).waitFor();
    assert.match(await page.locator('.records-display').textContent(), /123\.4 m/);
    assert.equal(await page.locator('.records-display img').count(), 0);
    assert.equal(await page.evaluate(() => window.recordsXss ?? false), false);
    assert.equal((await page.locator('.records-display').textContent()).includes('DO_NOT_DISPLAY'), false);
    assert.equal(await page.evaluate(() => Object.values(localStorage).some(value => value.includes('fixture-admin-only')) || Object.values(sessionStorage).some(value => value.includes('fixture-admin-only'))), false);
    await page.locator('.records-display button').filter({ hasText: /^承認$/ }).click();
    assert.match(await page.locator('.records-confirm p').textContent(), /123\.4 m（保存整数: 1234）/);
    assert.equal(writes, 0); await page.locator('.records-confirm button[type=submit]').click(); assert.equal(writes, 0);
    await page.locator('.records-confirm input').fill('合成fixtureを確認');
    await page.screenshot({ path: `${out}/confirmation-${viewport.width}x${viewport.height}.png`, fullPage: false });
    await page.locator('.records-confirm button').filter({ hasText: /^中止$/ }).click(); assert.equal(writes, 0);
    await page.locator('.records-display button').filter({ hasText: /^承認$/ }).click(); await page.locator('.records-confirm input').fill('合成fixtureを確認'); delay = true;
    await page.locator('.records-confirm button[type=submit]').evaluate(button => { button.click(); button.click(); });
    await page.getByText('操作を受け付け、候補とBESTを再取得しました。', { exact: false }).waitFor(); assert.equal(writes, 1); assert.equal(candidate.status, 'accepted');
    for (const action of ['取消', '再審査へ戻す', '拒否']) {
      await page.locator('.records-display button').filter({ hasText: new RegExp(`^${action}$`) }).click(); await page.locator('.records-confirm input').fill('合成fixtureを確認'); await page.locator('.records-confirm button[type=submit]').click();
      await page.getByText('操作を受け付け、候補とBESTを再取得しました。', { exact: false }).waitFor();
    }
    assert.equal(writes, 4); assert.equal(candidate.status, 'rejected');
    await page.locator('#records-board').selectOption(boardId); await page.locator('#records-recalculate').click(); await page.locator('.records-confirm input').fill('合成fixtureを確認'); await page.locator('.records-confirm input').press('Enter');
    await page.getByText('操作を受け付け、候補とBESTを再取得しました。', { exact: false }).waitFor(); assert.equal(writes, 5);
    await page.locator('#records-board').selectOption(''); await page.locator('#records-load').click(); await page.getByText('共有記録を取得しました（最近100候補まで）。', { exact: true }).waitFor();
    await page.screenshot({ path: `${out}/admin-${viewport.width}x${viewport.height}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    // Clearing cancels active reads and keeps late response content out of the DOM.
    hold = true; await page.locator('#records-load').click(); await page.locator('#clear').click(); await page.waitForTimeout(450);
    assert.equal(await page.locator('[name=token]').inputValue(), ''); assert.equal(await page.locator('.records-display').textContent(), '');
    assert.equal(await page.locator('#export').isDisabled(), true);
    assert.equal(errors.length, 0); evidence.push({ viewport, passed: true, requests, write_count: writes, page_errors: errors, fixture_only: true }); await context.close();
  }
  await writeFile(`${out}/REPORT.json`, JSON.stringify({ status: 'PASS', recorded_at: new Date().toISOString(), base, provenance: 'synthetic mocked API and automated real browser clicks; no production record/admin API or real secret', sourceHashes, evidence }, null, 2) + '\n');
} finally { await browser.close(); }
