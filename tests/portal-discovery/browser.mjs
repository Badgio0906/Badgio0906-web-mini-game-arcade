// Run against a fixed production build (mocked HTTPS) or the actual published site.
// No production scores or events are posted. Mobile viewports are emulated.
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname} from 'node:path';
import {createHash} from 'node:crypto';
import {gameCatalog} from '../../src/data/gameCatalog.ts';
import {recordBoards} from '../../src/data/recordDefinitions.ts';
import {tagCatalog} from '../../src/data/tagCatalog.ts';
const FAVORITES_KEY='game100garage:favorites:v1';
const expectedTagIds=tagCatalog.filter(tag=>gameCatalog.some(game=>game.tags.some(t=>t.id===tag.id))).map(tag=>tag.id);
const out=process.env.DISCOVERY_QA_OUT, live=process.env.DISCOVERY_LIVE==='1';
if(!out)throw Error('Unique DISCOVERY_QA_OUT required');
await mkdir(out,{recursive:false});
const origin='https://game100garage.com', dist=process.env.DISCOVERY_DIST||'dist';
const raw=process.env.HTTPS_PROXY||process.env.https_proxy;
const proxy=live&&raw?(()=>{const u=new URL(raw);return {server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}})():undefined;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={at:new Date().toISOString(),expected_commit:process.env.DISCOVERY_COMMIT||null,provenance:live?'Actual published resources and anonymous public GETs; ordinary input, local browser favorites, no production writes.':'Fixed production build served as mocked HTTPS root/subpath. Empty public ranking fixtures. Ordinary input, no model injection. Mixed development states covered separately by synthetic unit fixtures.',checks:[],errors:[],consoleErrors:[],postAttempts:[],mockedAnalyticsPosts:0,views:[],assetSha256:{}};
const check=(p,name,detail={})=>{report.checks.push({pass:!!p,name,...detail});if(!p)throw Error(name)};
const all=gameCatalog.map(g=>g.id), key='web-mini-game-arcade:telemetry:v1';
const modes=[{width:1440,height:900},{width:390,height:844},{width:320,height:720}];
if(!live)modes.push({width:320,height:720,prefix:'/Badgio0906-web-mini-game-arcade/'});
let page;
async function contextFor(viewport,seed='[]',denied=false){
 const c=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},hasTouch:viewport.width!==1440,isMobile:viewport.width!==1440});
 await c.addInitScript(({seed,key,denied})=>{
  if(!localStorage.getItem('qa:initialized')){localStorage.setItem('game100garage:analytics-consent:v1','granted');localStorage.setItem(key,seed);localStorage.setItem('qa:initialized','yes')}
  if(denied){const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('QA quota fixture','QuotaExceededError');return original.call(this,k,v)}}
 },{seed,key:FAVORITES_KEY,denied});
 await c.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(request.method()==='POST'&&u.hostname==='analytics.game100garage.com'&&u.pathname==='/v1/events'){report.mockedAnalyticsPosts++;return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':origin}})}
  if(request.method()!=='GET'){report.postAttempts.push({method:request.method(),path:u.pathname});return route.abort()}
  // Avoid executing third-party ads during QA without changing the source script.
  if(u.hostname==='pagead2.googlesyndication.com')return route.fulfill({contentType:'application/javascript',body:''});
  if(live)return route.continue();
  if(u.hostname==='analytics.game100garage.com'){
   const at='2026-10-10T00:00:00Z', headers={'Access-Control-Allow-Origin':origin};
   if(u.pathname.endsWith('/bests'))return route.fulfill({contentType:'application/json',headers,body:JSON.stringify({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:at,boards:recordBoards.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:at,revision:0}))})});
   const d=recordBoards.find(d=>d.boardId===u.searchParams.get('board_id'));
   if(!d)return route.fulfill({status:404,body:'Unexpected fixture GET'});
   return route.fulfill({contentType:'application/json',headers,body:JSON.stringify({schema_version:1,board_id:d.boardId,game_id:d.gameId,metric_label:d.metricLabel,mode_label:d.modeLabel,ruleset_id:d.rulesetId,direction:d.direction,unit:d.unit,generated_at:at,revision:0,cache_ttl_seconds:60,entries:[]})});
  }
  const prefix=viewport.prefix||'/';
  if(u.origin!==origin||!u.pathname.startsWith(prefix))return route.fulfill({status:404,body:'Unexpected origin/path'});
  const path=decodeURIComponent(u.pathname.slice(prefix.length))||'index.html';
  try{return route.fulfill({body:await readFile(dist+'/'+path),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.json':'application/json','.wasm':'application/wasm'})[extname(path)]||'application/octet-stream'})}
  catch{return route.fulfill({status:404,body:'Missing QA file'})}
 });return c;
}
try{
 for(const viewport of modes){
  const c=await contextFor(viewport),url=origin+(viewport.prefix||'/')+'index.html';
  page=await c.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});
  page.on('response',async r=>{if(r.url().startsWith(url.split('index.html')[0]+'assets/')&&r.url().endsWith('.js'))try{report.assetSha256[new URL(r.url()).pathname]=createHash('sha256').update(await r.body()).digest('hex')}catch{}});
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.game-play').first().waitFor();
  const visible=()=>page.locator('.game-card:not([hidden])').evaluateAll(cs=>cs.map(c=>c.dataset.gameId));
  const click=async locator=>{await locator.scrollIntoViewIfNeeded();if(viewport.width===1440)await locator.click();else await locator.tap()};
  const fav=id=>page.locator(`[data-game-id=${id}] .favorite-button`);
  const tag=id=>page.locator(`#tag-options [data-tag-id="${id}"]`);
  const state=id=>page.locator(`#development-filters [data-development-status="${id}"]`);
  const clear=()=>click(page.locator('#clear-filters'));
  const snapshot=async name=>{await page.evaluate(()=>scrollTo(0,0));const path=`${out}/${viewport.prefix?'subpath-':''}${viewport.width}-${name}.png`;await page.screenshot({path});report.views.push({viewport,name,path})};
  check(JSON.stringify(await visible())===JSON.stringify(all),'initial all30 release order',{viewport});
  check(await page.locator('.game-development-status--trial').count()===30,'all30 explicit trial badges',{viewport});
  check(await page.locator('.game-tags').count()===30&&await page.locator('.game-tags li').count()<=120,'normal tags separate max4',{viewport});
  check(await page.locator('a button,button a').count()===0,'no nested interactive controls',{viewport});
  const candidates=await page.locator('#tag-options button').evaluateAll(bs=>bs.map(b=>b.dataset.tagId));
  check(JSON.stringify(candidates)===JSON.stringify(expectedTagIds)&&!candidates.includes('meeting'),'active-only normal tag candidates',{viewport});
  check((await page.locator('#tag-match-modes [data-mode=or]').getAttribute('aria-pressed'))==='true','UI defaults OR',{viewport});
  check(!(await page.locator('#tag-picker').evaluate(d=>d.open)),'picker initially collapsed at every width',{viewport});
  const geometry=await page.locator('#game-discovery button,.favorite-button').evaluateAll(bs=>bs.map(b=>({h:b.getBoundingClientRect().height,w:b.getBoundingClientRect().width,visible:b.getClientRects().length>0})));
  check(geometry.filter(g=>g.visible).every(g=>g.h>=43.99),'visible controls 44px',{viewport,geometry});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow',{viewport});
  // Retained references prove the integration DOM is never recreated.
  await page.evaluate(()=>{window.qaCards=[...document.querySelectorAll('.game-card')];window.qaRecords=[...document.querySelectorAll('.card-records')];window.qaRankings=[...document.querySelectorAll('.leaderboard-button')]});
  await page.waitForFunction(()=>[...document.querySelectorAll('.card-records dd')].every(e=>!e.textContent.includes('読み込み中')));
  check(await page.locator('.card-records').count()===30&&await page.locator('.leaderboard-button').count()===20,'records30 and ranking20 installed',{viewport});
  await snapshot('initial');
  check(!(await page.locator('#discovery-panel').evaluate(d=>d.open))&&!(await page.locator('#clear-filters').isVisible()),'entire filter panel initially collapsed',{viewport});
  check((await page.locator('#discovery-panel > summary').boundingBox()).height>=44&&await page.locator('#game-count').isVisible(),'compact panel target and always-visible count',{viewport});
  await click(page.locator('#discovery-panel > summary'));
  await click(page.locator('#tag-picker summary'));
  await click(tag('puzzle'));await click(tag('brain-training'));
  check((await visible()).length===9,'OR puzzle/brain-training union9',{viewport});
  await click(page.locator('#tag-match-modes [data-mode=and]'));
  check(JSON.stringify(await visible())===JSON.stringify(['game020','game021','game022','game025','game030']),'AND intersection5',{viewport});
  if(await page.locator('#tag-picker').evaluate(d=>d.open))await click(page.locator('#tag-picker summary'));
  check((await page.locator('#selected-tags').innerText()).includes('パズル')&&(await page.locator('#selected-tags').innerText()).includes('脳トレ')&&(await page.locator('[data-mode=and]').getAttribute('aria-pressed'))==='true','selection/mode visible with picker closed',{viewport});
  await click(page.locator('#discovery-panel > summary'));
  check((await page.locator('#discovery-selection-summary').innerText()).includes('AND：パズル・脳トレ')&&!(await page.locator('#clear-filters').isVisible())&&(await visible()).length===5,'closed panel preserves selected conditions and results',{viewport});
  await snapshot('collapsed-selected');
  await click(page.locator('#discovery-panel > summary'));
  await click(state('trial'));check((await visible()).length===5,'trial AND normal tag conditions',{viewport});
  await click(state('complete'));check((await visible()).length===5,'both states independent of tag AND',{viewport});
  await click(state('trial'));check((await visible()).length===0&&await page.locator('#game-empty').isVisible(),'complete-only empty state',{viewport});
  check(await page.locator('#game-count').innerText()==='0 / 30','empty result count',{viewport});await snapshot('empty');
  await clear();check((await visible()).length===30&&!(await page.locator('#game-empty').isVisible()),'clear restores all30',{viewport});
  const eventCount=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]').filter(e=>['game_launch','game_card_click'].includes(e.name)).length,key);
  const before=await eventCount();
  await click(fav('game019'));await click(fav('game003'));await click(fav('game015'));
  check(JSON.stringify(await visible())===JSON.stringify(all),'favorite registration leaves loaded release order unchanged',{viewport});
  const beforeCancel=await fav('game015').boundingBox(), stable=await page.evaluate(()=>({scrollY,cardTop:document.querySelector('[data-game-id=game015]').offsetTop,positions:[...document.querySelectorAll('.game-card')].map(c=>c.dataset.cardPosition)}));
  if(viewport.width===1440)await page.mouse.click(beforeCancel.x+beforeCancel.width/2,beforeCancel.y+beforeCancel.height/2);else await page.touchscreen.tap(beforeCancel.x+beforeCancel.width/2,beforeCancel.y+beforeCancel.height/2);
  const afterCancel=await fav('game015').boundingBox(), afterStable=await page.evaluate(()=>({scrollY,cardTop:document.querySelector('[data-game-id=game015]').offsetTop,positions:[...document.querySelectorAll('.game-card')].map(c=>c.dataset.cardPosition)})), pressed=await fav('game015').getAttribute('aria-pressed');
  // The existing 150ms card hover animation translates by at most2px.
  // Compare stable layout/scroll/order and allow only that pre-existing transform.
  check(pressed==='false'&&Math.abs(afterCancel.x-beforeCancel.x)<=2&&Math.abs(afterCancel.y-beforeCancel.y)<=2&&Math.abs(afterCancel.width-beforeCancel.width)<0.01&&Math.abs(afterCancel.height-beforeCancel.height)<0.01&&JSON.stringify(afterStable)===JSON.stringify(stable),'same-coordinate cancellation preserves card geometry scroll and positions',{viewport,beforeCancel,afterCancel,stable,afterStable,pressed});
  await click(fav('game015'));
  check((await visible()).length===30&&(await visible()).at(-1)==='game031','non-favorites / latest031 remain',{viewport});
  check(await eventCount()===before&&page.url()===url,'favorite buttons never launch or send card clicks',{viewport});
  check(await page.locator('#game-count').innerText()==='30 / 30','favorite does not reduce count',{viewport});
  check(await fav('game015').getAttribute('aria-pressed')==='true'&&(await fav('game015').getAttribute('aria-label')).includes('解除'),'favorite accessible state',{viewport});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.game-card').first().waitFor();
  check(JSON.stringify((await visible()).slice(0,3))===JSON.stringify(['game003','game015','game019']),'reload persistence',{viewport});
  // Capture references again after actual reload; all subsequent filters/sorts must retain them.
  await page.evaluate(()=>{window.qaCards=[...document.querySelectorAll('.game-card')];window.qaRecords=[...document.querySelectorAll('.card-records')];window.qaRankings=[...document.querySelectorAll('.leaderboard-button')]});
  await fav('game015').focus();await page.keyboard.press('Enter');
  check(JSON.stringify((await visible()).slice(0,3))===JSON.stringify(['game003','game015','game019'])&&await fav('game015').getAttribute('aria-pressed')==='false'&&await fav('game015').evaluate(b=>document.activeElement===b),'keyboard unfavorite retains loaded order and focus',{viewport});
  check(!(await page.locator('#discovery-panel').evaluate(d=>d.open)),'reload closes full filter panel',{viewport});
  await click(page.locator('#discovery-panel > summary'));
  await click(fav('game025'));if(!(await page.locator('#tag-picker').evaluate(d=>d.open)))await click(page.locator('#tag-picker summary'));
  await tag('puzzle').focus();await page.keyboard.press('Enter');
  check((await visible()).length===6&&(await visible())[0]==='game007','pending favorite does not reorder after tag filter',{viewport});
  await tag('brain-training').focus();await page.keyboard.press('Enter');
  await page.locator('[data-mode=and]').focus();await page.keyboard.press('Enter');
  check((await visible()).length===5&&(await visible())[0]==='game020','keyboard AND keeps loaded favorite snapshot',{viewport});
  const positions=await page.locator('.game-card').evaluateAll(cs=>cs.map(c=>({hidden:c.hidden,pos:c.dataset.cardPosition})));
  check(positions.filter(x=>!x.hidden).every((x,i)=>x.pos===String(i+1))&&positions.filter(x=>x.hidden).every(x=>x.pos===undefined),'positions count visible nodes only',{viewport});
  await page.locator('#game-discovery').scrollIntoViewIfNeeded();await snapshot('filtered');
  check(await page.evaluate(()=>window.qaCards.every(c=>c.isConnected)&&window.qaRecords.every(c=>c.isConnected)&&window.qaRankings.every(c=>c.isConnected)),'cards/records/ranking nodes retain identity',{viewport});
  await click(page.locator('#selected-tags button[aria-label="脳トレの絞り込みを解除"]'));
  check((await visible()).length===6,'remove selected tag chip',{viewport});
  const leaderboard=page.locator('[data-game-id=game007] .leaderboard-button');
  await leaderboard.focus();await page.keyboard.press('Enter');await page.locator('.leaderboard-dialog[open]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.leaderboard-status').textContent!=='ランキングを読み込み中');
  check(page.url()===url,'retained ranking opens without launch',{viewport});await page.keyboard.press('Escape');
  check(await leaderboard.evaluate(b=>document.activeElement===b),'ranking Escape restores focus',{viewport});
  await clear();await snapshot('favorites');
  await click(page.locator('.record-sharing-settings summary'));const sharing=page.locator('.record-sharing-settings input');
  check(!(await sharing.isChecked())&&!(await sharing.isDisabled()),'record sharing initial OFF / available',{viewport});
  page.on('dialog',d=>d.accept());await sharing.check();check(await sharing.isChecked(),'record sharing opt-in control',{viewport});await sharing.uncheck();
  await click(page.locator('#analytics-settings-host #settings'));check(await page.locator('#analytics-settings-host .panel').isVisible(),'analytics consent settings open',{viewport});
  await click(page.locator('#analytics-settings-host #deny'));check(await page.evaluate(()=>localStorage.getItem('game100garage:analytics-consent:v1'))==='denied','consent denial control',{viewport});
  // Filter while consent is denied, then regrant: no pre-filter exposure can mark this visit.
  const impressionBaseline=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]').filter(e=>e.name==='game_card_impression'&&e.data.selected_game==='game019').length,key);
  // Observe a card after reordering/filtering; then toggle controls and ensure it stays once/visit.
  if(!(await page.locator('#tag-picker').evaluate(d=>d.open)))await click(page.locator('#tag-picker summary'));
  await click(tag('wind')); // Only019: favorite rank is1.
  await click(page.locator('#analytics-settings-host #settings'));await click(page.locator('#analytics-settings-host #grant'));
  await page.locator('[data-game-id=game019]').scrollIntoViewIfNeeded();await page.waitForTimeout(1350);
  const impressions=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]').filter(e=>e.name==='game_card_impression'&&e.data.selected_game==='game019'),key);
  const seen=await impressions();check(seen.length===impressionBaseline+1&&seen.at(-1).data.card_position===1,'post-filter observer records visible position1',{viewport,impressionBaseline,recorded:seen.map(e=>({position:e.data.card_position,at:e.at}))});
  await click(state('trial'));await page.locator('[data-game-id=game019]').scrollIntoViewIfNeeded();await page.waitForTimeout(1250);
  check((await impressions()).length===impressionBaseline+1,'observer rebuild preserves impression dedup',{viewport});
  await clear();
  check(JSON.stringify((await visible()).slice(0,3))===JSON.stringify(['game003','game015','game019']),'clear keeps loaded snapshot despite pending changes',{viewport});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.game-card').first().waitFor();
  check(JSON.stringify((await visible()).slice(0,3))===JSON.stringify(['game003','game019','game025'])&&(await visible()).length===30,'next reload applies registration and removal together',{viewport});
  await click(page.locator('#discovery-panel > summary'));await click(page.locator('#tag-picker summary'));await click(tag('puzzle'));
  check((await visible())[0]==='game025'&&(await visible()).length===6,'loaded favorite prioritized inside tag results',{viewport});
  await clear();
  const launchBefore=await eventCount();await click(page.locator('[data-game-id=game001] .game-play'));
  await page.waitForURL(new URL('./game001.html',url).href);await page.locator('.arcade-game-header .arcade-portal-return').waitFor();
  check(await eventCount()===launchBefore+2,'PLAY emits exactly one launch and card click',{viewport});
  await click(page.locator('.arcade-game-header .arcade-portal-return'));await page.waitForURL(url);
  check((await visible()).length===30,'actual PLAY and portal return',{viewport});
  await click(page.locator('[data-game-id=game003] .game-card-meta .game-development-status'));
  await page.waitForURL(new URL('./game003.html',url).href);await click(page.locator('.arcade-game-header .arcade-portal-return'));await page.waitForURL(url);
  check(true,'card blank/meta click delegates launch and actual return',{viewport});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow after controls',{viewport});
  await c.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');
 }
 if(!live){
  for(const variant of [{seed:'{',name:'corrupt'},{seed:'["game019","game010","missing",null,42,"game019"]',name:'unknown-retired'},{seed:'[]',name:'quota',denied:true}]){
   const c=await contextFor(modes[1],variant.seed,variant.denied),p=await c.newPage();page=p;
   await p.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});await p.locator('.game-card').first().waitFor();
   const order=await p.locator('.game-card:not([hidden])').evaluateAll(cs=>cs.map(c=>c.dataset.gameId));
   check(order.length===30&&!order.includes('game010'),'storage variant remains30 '+variant.name);
   if(variant.name==='unknown-retired')check(order[0]==='game019','known favorite restored / unknown ignored');
   if(variant.name==='corrupt')check(order[0]==='game001','corrupt JSON harmless');
   if(variant.denied){await p.locator('[data-game-id=game019] .favorite-button').tap();check(await p.locator('#favorites-storage-notice').isVisible()&&await p.locator('.game-card').first().getAttribute('data-game-id')==='game001'&&await p.locator('[data-game-id=game019] .favorite-button').getAttribute('aria-pressed')==='true','quota failure keeps position and visible notice outside collapsed panel')}
   await c.close();
  }
 }
 check(report.errors.length===0&&report.consoleErrors.length===0,'no page/console errors');check(report.postAttempts.length===0,'no record/other POST attempts (analytics acknowledged locally)');report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.message;process.exitCode=1;if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{})}
finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n')}
console.log({result:report.result,checks:report.checks.length,failure:report.failure,errors:report.errors.length,consoleErrors:report.consoleErrors.length,posts:report.postAttempts.length});
