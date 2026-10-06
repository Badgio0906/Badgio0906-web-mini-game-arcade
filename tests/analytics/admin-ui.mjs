import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir=process.env.ADMIN_TEST_REPORT_DIR ?? 'docs/analytics/QA';
const base=process.env.ADMIN_TEST_BASE_URL ?? 'http://127.0.0.1:5351';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const evidence=[];
const rate={numerator:25,denominator:40,rate:.625,sample_size_small:false};
const fixture={schema_version:1,generated_at:'2026-10-06T02:00:00Z',period:{from:'2026-10-01',to:'2026-10-07'},environment:'synthetic',coverage:{scope:'fixture; no real user observations',event_count:80,missing:['legacy_uninstrumented'],query_truncated:false},summary:{observed_browser_count:40,visit_count:50,game_starts:40,run_count:75,second_run_rate:rate,third_run_rate:{numerator:3,denominator:10},device_split:{mobile:30,desktop:10},traffic_source_split:{x:20,direct:20}},games:[{game_id:'game019',status:'active',game_card_impressions:80,game_card_clicks:40,ctr:{numerator:40,denominator:80},game_starts:40,second_run_rate:rate,third_run_rate:{numerator:3,denominator:10},versions:[{game_version:'2',rules_version:'charge-2',presentation_version:'2',event_count:80}],funnel:[{step:'50m',...rate}],measurement_coverage:'fixture'}, {game_id:'game010',status:'retired'}]};
try {for(const viewport of [{width:1365,height:900},{width:390,height:844},{width:320,height:568}]){
const context=await browser.newContext({viewport,acceptDownloads:true}); const page=await context.newPage(); const requests=[]; const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('http://127.0.0.1:8787/**',async route=>{const req=route.request();requests.push({url:req.url(),authorization_present:!!req.headers().authorization});await route.fulfill({json:{...fixture,games:fixture.games.filter(game=>new URL(req.url()).searchParams.get('include_retired')==='1'||game.status!=='retired')},headers:{'access-control-allow-origin':'*'}});});
await page.goto(`${base}/analytics-admin.html`);
assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
assert.equal(requests.length,0);
await page.locator('[name=environment]').selectOption('synthetic');
await page.locator('[name=token]').fill('fixture-only-token');
await page.getByRole('button',{name:'集計を取得',exact:true}).click();await page.getByText('集計を取得しました。',{exact:false}).waitFor();
assert.ok(requests[0].url.includes('environment=synthetic'));assert.ok(requests[0].url.includes('include_retired=0'));assert.ok(requests[0].authorization_present);assert.equal(new URL(requests[0].url).pathname,'/v1/admin/summary');
assert.equal(await page.getByRole('button',{name:/game010/}).count(),0);
await page.locator('[name=retired]').check();await page.getByRole('button',{name:'集計を取得',exact:true}).click();await page.getByRole('button',{name:/game010/}).waitFor();
assert.ok(await page.locator('#results').textContent().then(t=>t.includes('62.5% (25 / 40)')));
await page.getByRole('button',{name:/game019/}).click();assert.ok(await page.locator('#game-detail').textContent().then(t=>t.includes('50m')));
assert.equal(await page.evaluate(()=>Object.values(localStorage).some(v=>v.includes('fixture-only-token'))),false);
const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'集計JSONを保存'}).click();const download=await downloadPromise;await download.saveAs(`${dir}/admin-ui-synthetic-export.json`);
await page.screenshot({path:`${dir}/admin-${viewport.width}.png`,fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
await page.getByRole('button',{name:'トークン・表示を消去'}).click();assert.equal(await page.locator('[name=token]').inputValue(),'');assert.equal(await page.locator('#results').isVisible(),false);
evidence.push({viewport,passed:true,requests,errors,real_data:false});assert.equal(errors.length,0);await context.close();
}
await writeFile(`${dir}/admin-ui.json`,JSON.stringify({provenance:'author QA; synthetic API fixture, not deployed Cloudflare proof',evidence},null,2)+'\n');}finally{await browser.close();}
