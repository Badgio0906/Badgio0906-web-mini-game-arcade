import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.ADMIN_TEST_BASE_URL??'http://127.0.0.1:5351';
const summary=JSON.parse(await readFile('docs/analytics/QA/admin-worker-local-synthetic-export.json','utf8'));
assert.equal(summary.environment,'synthetic');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:320,height:568}});
  await page.route('http://127.0.0.1:8787/**',route=>route.fulfill({json:summary,headers:{'access-control-allow-origin':'*'}}));
  await page.goto(`${base}/analytics-admin.html`);
  await page.locator('[name=environment]').selectOption('synthetic');
  await page.locator('[name=token]').fill('fixture-only-token');
  await page.getByRole('button',{name:'集計を取得',exact:true}).click();
  await page.getByText('集計を取得しました。',{exact:false}).waitFor();
  for (const game of summary.games) assert.equal(await page.getByRole('button',{name:new RegExp(game.game_id)}).count(),1);
  assert.equal(summary.games.length,18);
  await page.getByRole('button',{name:/game019/}).click();
  assert.ok((await page.locator('#game-detail').textContent()).includes('rules_version'));
  assert.ok((await page.locator('#results').textContent()).includes('unreported_milestones'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await writeFile('docs/analytics/QA/admin-worker-contract.json',JSON.stringify({provenance:'Author browser test consuming aggregate JSON produced by real local Wrangler/D1 synthetic test; HTTP API replayed as fixture, no production data or cloud-deploy claim',viewport:{width:320,height:568},games:18,environment:summary.environment,passed:true},null,2)+'\n');
} finally { await browser.close(); }
