// Built site only; public record responses are anonymous local fixtures.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {gameCatalog} from '../../src/data/gameCatalog.ts';
import {recordBoards} from '../../src/data/recordDefinitions.ts';
const out=process.env.QA_OUT,base=process.env.QA_BASE||'http://127.0.0.1:4952/';
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={views:[],errors:[],realExternalRequests:0,blocked:[],checks:[]};
const check=(condition,name)=>{report.checks.push({name,pass:!!condition});assert(condition,name);};
let active;
try{
for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390]]){
 const mobile=width<1000,context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();active=page;
 const kept=['game026','game028','game029','game030','game031'];
 await context.addInitScript(ids=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');if(localStorage.getItem('game100garage:favorites:v1')===null)localStorage.setItem('game100garage:favorites:v1',JSON.stringify(ids));if(localStorage.getItem('orbit-shift:v1:best')===null)localStorage.setItem('orbit-shift:v1:best','42');},kept);
 await context.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url()),now=new Date().toISOString();
  if(url.href.startsWith(base))return route.continue();
  if(request.method()==='GET'&&url.pathname==='/v1/records/public/bests')return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:now,boards:recordBoards.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:d.gameId==='game001'?100:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:d.gameId==='game001'?'accepted':'empty',collected_since:now,revision:1}))})});
  if(request.method()==='GET'&&url.pathname==='/v1/records/public/leaderboard'){
   const d=recordBoards.find(d=>d.boardId===url.searchParams.get('board_id'));
   return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({schema_version:1,board_id:d.boardId,game_id:d.gameId,metric_label:d.metricLabel,mode_label:d.modeLabel,ruleset_id:d.rulesetId,direction:d.direction,unit:d.unit,generated_at:now,revision:1,cache_ttl_seconds:60,entries:[{rank:1,public_label:'ガレージ住人 000000000001',value:100,received_at:now}]})});
  }
  report.blocked.push({method:request.method(),url:request.url()});return route.abort();
 });
 page.on('pageerror',e=>report.errors.push(e.message));
 const click=async selector=>page.locator(selector)[mobile?'tap':'click']();
 const visible=()=>page.locator('.game-card:visible').evaluateAll(es=>es.map(e=>e.dataset.gameId));
 await page.goto(base,{waitUntil:'networkidle'});
 check(await page.locator('.game-card').count()===27,'27 cards '+width);
 const ids=await visible();check(kept.every(id=>!ids.includes(id)),'removed/hold absent '+width);
 check(await page.locator('.game-development-status--complete').count()===9,'9 complete '+width);
 await click('#discovery-panel > summary');await click('#tag-picker > summary');
 await click('#tag-options [data-tag-id="reflex"]');await click('#tag-options [data-tag-id="short"]');
 const or=await visible();await click('[data-mode="and"]');const and=await visible();
 const wantOr=gameCatalog.filter(g=>g.tags.some(t=>['reflex','short'].includes(t.id))).map(g=>g.id);
 const wantAnd=gameCatalog.filter(g=>['reflex','short'].every(id=>g.tags.some(t=>t.id===id))).map(g=>g.id);
 check(JSON.stringify(or)===JSON.stringify(wantOr)&&JSON.stringify(and)===JSON.stringify(wantAnd),'exact OR/AND '+width);
 await click('#clear-filters');check((await visible()).length===27,'clear filters '+width);
 await click('[data-development-status="complete"]');check((await visible()).length===9,'complete filter '+width);await click('#clear-filters');
 await click('[data-development-status="trial"]');check((await visible()).length===18,'trial filter '+width);await click('#clear-filters');
 await click('[data-game-id="game035"] .favorite-button');await page.reload({waitUntil:'networkidle'});
 check((await visible())[0]==='game035'&&(await visible()).length===27,'favorite priority leaves all cards '+width);
 const favorites=await page.evaluate(()=>JSON.parse(localStorage.getItem('game100garage:favorites:v1')));check(kept.every(id=>favorites.includes(id)),'old favorite IDs retained '+width);
 const localBest=await page.locator('[data-game-id="game001"] .card-records dd').first().innerText();check(localBest==='42 点','personal BEST '+width);
 await page.waitForFunction(()=>document.querySelector('[data-game-id="game001"] dl>div:nth-child(2) dd')?.textContent==='100 点');
 await click('[data-game-id="game001"] .leaderboard-button');await page.waitForFunction(()=>document.querySelector('.leaderboard-list')?.textContent.includes('000000000001'));
 check((await page.locator('.leaderboard-list').innerText()).includes('100 点'),'ranking fixture '+width);await click('.leaderboard-close');
 await page.getByText('あなたのBEST・記録共有設定',{exact:true})[mobile?'tap':'click']();
 check(await page.locator('.record-sharing-settings input[type="checkbox"]').count()===1,'sharing UI retained '+width);
 check(await page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').count()===1,'AdSense tag retained '+width);
 const overflow=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth);check(overflow===0,'portal no horizontal overflow '+width);
 await page.screenshot({path:out+`/portal-${width}.png`});
 await click('.footer-links a[href="./about.html"]');await page.waitForURL('**/about.html');
 check(await page.locator('.about-issue-link').getAttribute('href')==='https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/issues/new/choose','Issues destination '+width);
 check((await page.locator('body').innerText()).includes('公開')&&(await page.locator('body').innerText()).includes('ログイン'),'public/login notice '+width);
 await click('a[href="./privacy.html"]');await page.waitForURL('**/privacy.html');check((await page.locator('body').innerText()).includes('AdSense'),'privacy retained '+width);
 const ads=await context.request.get(base+'ads.txt');check((await ads.text())==='google.com, pub-2598150338179299, DIRECT, f08c47fec0942fa0\n','ads exact '+width);
 report.views.push({width,height,or,and,favorites,localBest,overflow});await context.close();active=undefined;
}
check(report.errors.length===0,'no pageerrors');report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.message;if(active)await active.screenshot({path:out+'/failure.png'}).catch(()=>{});}
finally{await browser.close();await writeFile(out+'/portal.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({result:report.result,checks:report.checks.length,failure:report.failure}));if(report.result!=='PASS')process.exitCode=1;
