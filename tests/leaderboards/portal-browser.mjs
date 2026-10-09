import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {recordBoards} from '../../src/data/recordDefinitions.ts';
const out=process.env.LEADERBOARDS_QA_OUT, dist=process.env.LEADERBOARDS_FIXTURE_DIST||'/tmp/leaderboards-fixture';
if(!out)throw Error('LEADERBOARDS_QA_OUT must be a new directory');
await mkdir(out,{recursive:false});
const report={at:new Date().toISOString(),provenance:'Production source build on mocked HTTPS portal + public API. Synthetic local fixtures only. Desktop Chromium mobile viewports; not physical devices.',checks:[],requests:[],errors:[],views:[]};
const check=(pass,name,details={})=>{report.checks.push({pass:!!pass,name,...details});if(!pass)throw Error(name);};
const at='2026-10-09T00:00:00Z', types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp'};
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
let page;
try {
 for(const viewport of [{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}]){
  const context=await browser.newContext({viewport});page=await context.newPage();await page.clock.install();
  await page.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('orbit-shift:v1:best','0');});
  let gets=0,revision=1, mode='ready', waiting, calls=0;
  const fixture=(definition)=>({schema_version:1,board_id:definition.boardId,game_id:definition.gameId,metric_label:definition.metricLabel,mode_label:definition.modeLabel,ruleset_id:definition.rulesetId,direction:definition.direction,unit:definition.unit,generated_at:at,revision,cache_ttl_seconds:60,
   entries:mode==='empty'?[]:Array.from({length:10},(_,i)=>({rank:i+1,public_label:`ガレージ住人 ${String(i+1).padStart(12,'0')}`,value:definition.gameId==='game018'?9007199254740991-i:(i<2?900:900-i),received_at:at}))});
  page.on('pageerror',e=>report.errors.push(e.message));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(request.method()!=='GET'){report.requests.push({method:request.method(),pathname:url.pathname});return route.abort();}
   if(url.origin==='https://records-fixture.test'){
    const headers=request.headers();report.requests.push({pathname:url.pathname,query:url.search,authorization:!!headers.authorization,cookie:!!headers.cookie});
    if(url.pathname.endsWith('/bests')){gets++;return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'https://game100garage.com'},body:JSON.stringify({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:at,boards:recordBoards.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:at,revision:0}))})});}
    calls++;
    if(mode==='loading')await new Promise(resolve=>waiting=resolve);
    if(mode==='failure')return route.abort();
    if(mode==='preparing')return route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'https://game100garage.com'},body:'unavailable'});
    const d=recordBoards.find(d=>d.boardId===url.searchParams.get('board_id'));
    return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'https://game100garage.com'},body:JSON.stringify(fixture(d))});
   }
   if(url.origin!=='https://game100garage.com')return route.abort();
   const file=resolve(dist,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
   try{return route.fulfill({contentType:types[extname(file)]||'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:'fixture missing'});}
  });
  await page.goto('https://game100garage.com/',{waitUntil:'networkidle'});
  check(await page.locator('.game-card').count()===30,'30 active cards',{viewport});
  check(await page.locator('.leaderboard-button').count()===20,'20 target board buttons',{viewport});
  check(await page.locator('a button').count()===0,'no nested anchor button',{viewport});
  check(gets===1&&calls===0,'only one batch BEST GET before open',{viewport});
  check(await page.locator('[data-game-id=game031] .leaderboard-button').count()===0,'noncompetitive no ranking button',{viewport});
  const button=page.locator('[data-game-id=game001] .leaderboard-button'), dialog=page.locator('.leaderboard-dialog');
  mode='loading';await button.click();await page.locator('.leaderboard-status').filter({hasText:'ランキングを読み込み中'}).waitFor();
  check(page.url()==='https://game100garage.com/','TOP10 does not launch game',{viewport});
  check(await page.locator('#leaderboard-title').evaluate(e=>document.activeElement===e),'heading receives opening focus',{viewport});
  check(await page.locator('.leaderboard-personal').innerText()==='あなたのBEST：0 点（このブラウザ内）','personal zero shown with sharing OFF',{viewport});
  const blocked=await page.locator('[data-game-id=game001] .game-copy-link').evaluate(e=>{e.focus();return document.activeElement!==e;});check(blocked,'background link inert',{viewport});
  mode='ready';waiting();await page.waitForFunction(()=>document.querySelectorAll('.leaderboard-list li').length===10);
  check((await page.locator('[data-game-id=game001] dl > div:nth-child(2) dd').innerText())==='900 点','BEST reconciles to top1',{viewport});
  check(await page.locator('.leaderboard-value small').count()===2,'same values explicitly marked tied',{viewport});
  await page.keyboard.press('Tab');check(await page.locator('.leaderboard-close').evaluate(e=>document.activeElement===e),'Tab reaches close',{viewport});
  await page.keyboard.press('Tab');const tabFocus=await page.evaluate(()=>({tag:document.activeElement?.tagName,id:document.activeElement?.id,within:!!document.activeElement?.closest('.leaderboard-dialog')}));check(tabFocus.within,'Tab stays in modal',{viewport,tabFocus});
  await page.screenshot({path:out+`/ranking-${viewport.width}x${viewport.height}.png`});
  const layout=await dialog.evaluate(e=>{const r=e.getBoundingClientRect(),c=e.querySelector('.leaderboard-content'),b=e.querySelector('.leaderboard-close').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,closeBottom:b.bottom,contentScroll:c.scrollHeight>c.clientHeight,overflow:[e,...e.querySelectorAll('*')].filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.className)}});
  check(layout.left>=0&&layout.right<=viewport.width&&layout.top>=0&&layout.bottom<=viewport.height,'dialog fits viewport',{viewport,layout});
  check(layout.closeBottom<=viewport.height&&layout.closeBottom>=44,'close visible in portrait and landscape',{viewport});
  check(!layout.overflow.length,'ranking contains no horizontal text overflow',{viewport,overflow:layout.overflow});
  if(viewport.height<850)check(layout.contentScroll,'ten entries vertically scroll',{viewport});
  await page.locator('.leaderboard-content').evaluate(e=>e.scrollTop=e.scrollHeight);check(await page.locator('.leaderboard-list li').last().isVisible(),'tenth row exists after scroll',{viewport});
  await page.keyboard.press('Escape');check(!await dialog.evaluate(e=>e.open),'Esc closes',{viewport});check(await button.evaluate(e=>document.activeElement===e),'focus restored to originating button',{viewport});
  check(await page.evaluate(()=>document.body.style.overflow)==='','background scroll restored',{viewport});
  for(let i=0;i<3;i++){await button.click();await page.locator('.leaderboard-list li').last().waitFor();await page.locator('.leaderboard-close').click();}
  check(calls===1,'repeated open uses cache with no extra subscriptions/GET',{viewport});
  // Exercise stale cache by advancing only virtual Date: no batch refresh timer fires.
  await page.clock.setSystemTime(new Date(Date.now()+61001));mode='failure';await button.click();await page.locator('.leaderboard-status').filter({hasText:'前回取得したランキング'}).waitFor();
  check(await page.locator('.leaderboard-list li').count()===10,'failed refresh keeps previous dated ranking',{viewport});await page.locator('.leaderboard-close').click();
  const other=page.locator('[data-game-id=game018] .leaderboard-button');mode='ready';await other.click();await page.waitForFunction(()=>document.querySelectorAll('.leaderboard-list li').length===10);
  check((await page.locator('.leaderboard-value').first().innerText()).includes('900,719,925,474,099.1 m'),'long score preserves precision/scale',{viewport});
  check((await page.locator('.leaderboard-value').nth(4).innerText()).includes('900,719,925,474,098.7 m'),'adjacent large dm scores retain exact tenths',{viewport});
  check(await page.locator('.leaderboard-value').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)),'long numbers fit',{viewport});await page.screenshot({path:out+`/long-${viewport.width}x${viewport.height}.png`});await page.locator('.leaderboard-close').click();
  mode='empty';await page.locator('[data-game-id=game002] .leaderboard-button').click();await page.locator('.leaderboard-status').filter({hasText:'まだ記録はありません'}).waitFor();check(await page.locator('.leaderboard-list li').count()===0,'empty ranking has no dummy rows',{viewport});await page.locator('.leaderboard-close').click();
  mode='preparing';await page.locator('[data-game-id=game003] .leaderboard-button').click();await page.locator('.leaderboard-status').filter({hasText:'ランキング準備中'}).waitFor();await page.locator('.leaderboard-close').click();
  mode='failure';await page.locator('[data-game-id=game004] .leaderboard-button').click();await page.locator('.leaderboard-status').filter({hasText:'ランキングを取得できませんでした'}).waitFor();await page.locator('.leaderboard-close').click();
  // Closing a pending GET never reopens or changes a later game modal.
  mode='loading';await page.locator('[data-game-id=game005] .leaderboard-button').click();await page.waitForTimeout(20);await page.keyboard.press('Escape');mode='ready';waiting();await page.waitForTimeout(20);check(!await dialog.evaluate(e=>e.open),'late request after close stays closed',{viewport});
  await page.locator('[data-game-id=game001] .game-copy-link').focus();await page.keyboard.press('Enter');await page.waitForURL('**/game001.html');check(page.url().endsWith('game001.html'),'keyboard game link launch preserved',{viewport});
  report.views.push({viewport,gets,leaderboardGets:calls});await context.close();page=undefined;
 }
 check(!report.requests.some(r=>r.method==='POST'),'no POST with analytics denied / sharing OFF');
 check(report.requests.filter(r=>r.pathname?.includes('/public/')).every(r=>!r.authorization&&!r.cookie),'public reads carry no auth or cookie');
 check(report.errors.length===0,'no page errors');report.result='PASS';
} catch(e){report.result='FAIL';report.error=e.message;if(page)await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});}
finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');}
console.log({out,result:report.result,error:report.error,checks:report.checks.length});if(report.result!=='PASS')process.exitCode=1;
