// Independent revised-behavior QA. Source is read-only; all resources fulfilled locally.
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const dist=process.env.REVIEW_DIST,out=process.env.REVIEW_OUT;
if(!dist||!out)throw Error('Immutable REVIEW_DIST and unique REVIEW_OUT required');
const {gameCatalog}=await import(pathToFileURL(resolve('src/data/gameCatalog.ts')).href);
const {recordBoards}=await import(pathToFileURL(resolve('src/data/recordDefinitions.ts')).href);
await mkdir(out,{recursive:false});
const origin='https://independent.portal.test',favkey='game100garage:favorites:v1';
const report={complete:false,result:'RUNNING',checks:[],pageErrors:[],consoleErrors:[],writes:[],images:[],provenance:'Immutable compiled build, ordinary input, local GET fixtures only; explicitly seeded favorites and synthetic storage denial. No model changes or production writes.'};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});let active;
const save=()=>writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');
const check=(ok,name,detail={})=>{report.checks.push({pass:!!ok,name,...detail});if(!ok)throw Error(name)};
async function context(width,height,denied=false){
 const c=await browser.newContext({viewport:{width,height},isMobile:width<600,hasTouch:width<600});
 await c.addInitScript(({favkey,denied})=>{
  if(location.origin==='null')return; // about:blank has no storage origin; no product loaded there.
  if(!localStorage.getItem('comfort:initialized')&&!sessionStorage.getItem('comfort:initialized')){localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem(favkey,'["game019"]');localStorage.setItem('comfort:initialized','yes')}
  sessionStorage.setItem('comfort:initialized','yes');
  if(denied)Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Independent denied-storage fixture','SecurityError')}});
 },{favkey,denied});
 await c.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(req.method()!=='GET'){report.writes.push({host:u.hostname,path:u.pathname,method:req.method()});return route.abort()}
  if(u.hostname==='pagead2.googlesyndication.com')return route.fulfill({contentType:'application/javascript',body:''});
  if(u.origin!==origin){const at=new Date().toISOString();return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':origin},body:JSON.stringify({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:at,boards:recordBoards.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:at,revision:0}))})})}
  const path=decodeURIComponent(u.pathname.slice(1))||'index.html';try{return route.fulfill({body:await readFile(resolve(dist,path)),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.json':'application/json'})[extname(path)]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:'Local fixture missing resource'})}});
 c.on('page',p=>{p.on('pageerror',e=>report.pageErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())})});return c;
}
async function open(c){const p=await c.newPage();active=p;p.setDefaultTimeout(12000);await p.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});await p.locator('.game-card').first().waitFor();if(await p.locator('#analytics-settings-host .panel').isVisible())await p.locator('#analytics-settings-host #deny').click();return p}
const ids=p=>p.locator('.game-card:not([hidden])').evaluateAll(cs=>cs.map(c=>c.dataset.gameId));
const fav=(p,id)=>p.locator(`[data-game-id="${id}"] .favorite-button`);
const panel=p=>p.locator('#discovery-panel');
const summary=p=>p.locator('#discovery-panel>summary');
async function input(p,l,width){await l.scrollIntoViewIfNeeded();if(width<600)await l.tap();else await l.click()}
async function reveal(p,width){if(!await panel(p).evaluate(d=>d.open))await input(p,summary(p),width);if(!await p.locator('#tag-picker').evaluate(d=>d.open))await input(p,p.locator('#tag-picker summary'),width)}
async function shot(p,name){await p.evaluate(()=>scrollTo(0,0));const file=out+'/'+name+'.png';await p.screenshot({path:file});report.images.push(file)}
try{
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  const c=await context(width,height),p=await open(c),loaded=['game019',...gameCatalog.filter(g=>g.id!=='game019').map(g=>g.id)];
  check(!await panel(p).evaluate(d=>d.open)&&!await p.locator('#game-discovery').isVisible(),width+' entire filter initially collapsed');
  check(JSON.stringify(await ids(p))===JSON.stringify(loaded),width+' initial persisted favorite order');
  await shot(p,width+'-initial');
  await p.evaluate(()=>{window.comfortRefs=[...document.querySelectorAll('.game-card')].map(c=>({c,id:c.dataset.gameId,record:c.querySelector('.card-records'),play:c.querySelector('.game-play'),rank:c.querySelector('.leaderboard-button')}))});
  await input(p,fav(p,'game031'),width);const afterAdd=await ids(p);
  check(JSON.stringify(afterAdd)===JSON.stringify(loaded)&&await fav(p,'game031').getAttribute('aria-pressed')==='true',width+' add031 updates star without moving cards');
  check((await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),favkey)).includes('game031'),width+' add031 immediately persists');
  // Existing card hover transition lasts150ms; finish it before comparing layout.
  await p.waitForTimeout(190);const beforeBox=await fav(p,'game031').boundingBox(),beforeScroll=await p.evaluate(()=>scrollY);
  if(width<600)await p.touchscreen.tap(beforeBox.x+beforeBox.width/2,beforeBox.y+beforeBox.height/2);else await p.mouse.click(beforeBox.x+beforeBox.width/2,beforeBox.y+beforeBox.height/2);
  await p.waitForTimeout(190);const afterBox=await fav(p,'game031').boundingBox(),afterScroll=await p.evaluate(()=>scrollY);
  check(await fav(p,'game031').getAttribute('aria-pressed')==='false'&&JSON.stringify(await ids(p))===JSON.stringify(loaded)&&beforeScroll===afterScroll&&Math.abs(beforeBox.x-afterBox.x)<.1&&Math.abs(beforeBox.y-afterBox.y)<.1&&beforeBox.width===afterBox.width&&beforeBox.height===afterBox.height,width+' settled same-coordinate cancellation preserves geometry scroll and ordering',{beforeBox,afterBox,beforeScroll,afterScroll});
  await input(p,fav(p,'game031'),width);

  await input(p,fav(p,'game019'),width);check(JSON.stringify(await ids(p))===JSON.stringify(loaded)&&await fav(p,'game019').getAttribute('aria-pressed')==='false',width+' remove loaded019 leaves first card fixed');
  await fav(p,'game031').focus();await p.keyboard.press('Space');check(await fav(p,'game031').evaluate(b=>document.activeElement===b)&&JSON.stringify(await ids(p))===JSON.stringify(loaded),width+' Space toggle focus and order retained');
  await p.keyboard.press('Enter');check(await fav(p,'game031').getAttribute('aria-pressed')==='true'&&await fav(p,'game031').evaluate(b=>document.activeElement===b),width+' Enter toggle restores pending031 without focus loss');
  await reveal(p,width);await input(p,p.locator('#tag-options [data-tag-id="puzzle"]'),width);await input(p,p.locator('#tag-options [data-tag-id="brain-training"]'),width);await input(p,p.locator('[data-mode="and"]'),width);
  const andIds=gameCatalog.filter(g=>['puzzle','brain-training'].every(t=>g.tags.some(x=>x.id===t))).map(g=>g.id);check(JSON.stringify(await ids(p))===JSON.stringify(andIds),width+' AND filter excludes pending favorite changes');
  await input(p,p.locator('[data-development-status="complete"]'),width);check((await ids(p)).length===0,width+' complete zero with tag conditions');
  await input(p,summary(p),width);check(await p.locator('#game-empty').isVisible()&&(await p.locator('#discovery-selection-summary').innerText()).includes('AND')&&(await summary(p).innerText()).includes('完成版'),width+' collapsed active summary and empty result remain clear');
  await shot(p,width+'-closed-empty');
  await input(p,summary(p),width);await input(p,p.locator('#clear-filters'),width);check(JSON.stringify(await ids(p))===JSON.stringify(loaded),width+' clear does not apply pending favorites');
  const peer=await open(c);check((await ids(peer))[0]==='game031',width+' fresh second page uses persisted pending favorite');
  await input(peer,fav(peer,'game025'),width);await p.waitForFunction(()=>document.querySelector('[data-game-id="game025"] .favorite-button').getAttribute('aria-pressed')==='true');check(JSON.stringify(await ids(p))===JSON.stringify(loaded),width+' cross-tab star update does not move current cards');
  await reveal(p,width);await input(p,p.locator('#tag-options [data-tag-id="puzzle"]'),width);const puzzle=gameCatalog.filter(g=>g.tags.some(t=>t.id==='puzzle')).map(g=>g.id);check(JSON.stringify(await ids(p))===JSON.stringify(puzzle),width+' filter after cross-tab pending025 retains loaded ordering');
  await input(p,p.locator('#clear-filters'),width);check(JSON.stringify(await ids(p))===JSON.stringify(loaded),width+' clear after cross-tab retains loaded ordering');
  check(await p.evaluate(()=>window.comfortRefs.every(({c,id,record,play,rank})=>c.isConnected&&c.dataset.gameId===id&&c.querySelector('.card-records')===record&&c.querySelector('.game-play')===play&&c.querySelector('.leaderboard-button')===rank)),width+' records PLAY rank and card identities retained');
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('.game-card').first().waitFor();check(JSON.stringify((await ids(p)).slice(0,2))==='["game025","game031"]'&&!await panel(p).evaluate(d=>d.open),width+' reload applies new favorites and starts collapsed');
  await peer.evaluate(()=>localStorage.clear());await p.waitForFunction(()=>document.querySelector('[data-game-id="game031"] .favorite-button').getAttribute('aria-pressed')==='false');check(JSON.stringify((await ids(p)).slice(0,2))==='["game025","game031"]',width+' cross-tab clear updates stars without applying new order');
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('.game-card').first().waitFor();if(await p.locator('#analytics-settings-host .panel').isVisible())await p.locator('#analytics-settings-host #deny').click();check((await ids(p))[0]==='game001',width+' next reload reflects cleared storage');
  await summary(p).focus();await p.keyboard.press('Space');check(await panel(p).evaluate(d=>d.open)&&await summary(p).evaluate(s=>document.activeElement===s),width+' keyboard Space opens outer panel and retains summary focus');await p.keyboard.press('Enter');check(!await panel(p).evaluate(d=>d.open),width+' keyboard Enter closes outer panel');
  const geom=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,summaryHeight:document.querySelector('#discovery-panel>summary').getBoundingClientRect().height,firstPlay:document.querySelector('.game-play').getBoundingClientRect().toJSON()}));check(geom.scrollWidth<=geom.width&&geom.summaryHeight>=44,width+' closed layout no overflow and summary44',{geom});
  await c.close();await save();
 }
 const c=await context(390,844,true),p=await open(c);check(!await panel(p).evaluate(d=>d.open),'denied getter panel initially closed');const before=await ids(p);await input(p,fav(p,'game031'),390);check(JSON.stringify(await ids(p))===JSON.stringify(before)&&await fav(p,'game031').getAttribute('aria-pressed')==='true','denied getter memory star works without sorting');check(await p.locator('#favorites-storage-notice').isVisible()&&!await panel(p).evaluate(d=>d.open),'denied getter notice visible with entire filter closed');await shot(p,'390-denied-getter');await c.close();
 check(report.pageErrors.length===0&&report.consoleErrors.length===0,'zero page or console errors',{pageErrors:report.pageErrors,consoleErrors:report.consoleErrors});check(report.writes.length===0,'no production or other POST attempts',{writes:report.writes});report.result='PASS';
}catch(e){report.result='FAIL';report.failure=String(e);if(active&&!active.isClosed())try{await shot(active,'failure')}catch{}}
finally{report.complete=true;await browser.close();await save()}
if(report.result!=='PASS')process.exitCode=1;
