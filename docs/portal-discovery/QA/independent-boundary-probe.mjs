// Independent read-only product probe. Run only after Chromium slot and immutable build are supplied.
// All network resources are locally fulfilled; consent denied, every non-GET blocked, no production writes.
import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=process.cwd(),dist=process.env.REVIEW_DIST,out=process.env.REVIEW_OUT;
if(!dist||!out)throw Error('REVIEW_DIST immutable build and new REVIEW_OUT required');
const {gameCatalog}=await import(pathToFileURL(resolve(root,'src/data/gameCatalog.ts')).href);
const {recordBoards}=await import(pathToFileURL(resolve(root,'src/data/recordDefinitions.ts')).href);
await mkdir(out,{recursive:false});
const origin='https://independent.portal.test',favkey='game100garage:favorites:v1';
const report={at:new Date().toISOString(),complete:false,result:'RUNNING',provenance:'Independent ordinary inputs against immutable compiled build. Local HTTPS routing and empty public best fixtures; storage denial/clear explicitly synthetic environment fixtures. No production requests, no model injection.',checks:[],pageErrors:[],consoleErrors:[],blockedWrites:[],images:[],assetSha256:{}};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let current;
const save=()=>writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');
function check(ok,name,detail={}){report.checks.push({pass:!!ok,name,...detail});if(!ok)throw Error(name)}
async function context(width=1440,height=900,denial='none'){
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<600,isMobile:width<600});
 await c.addInitScript(({favkey,denial})=>{
  // Ordinary storage API seed is an environment fixture, not gameplay progress.
  try{if(!localStorage.getItem('independent:initialized')){localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('independent:initialized','yes')}}catch{}
  if(denial==='getter')Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Independent QA denied getter','SecurityError')}});
  if(denial==='favorites-read'){const original=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key===favkey)throw new DOMException('Independent QA denied favorite read','SecurityError');return original.call(this,key)}}
 },{favkey,denial});
 await c.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(req.method()!=='GET'){report.blockedWrites.push({method:req.method(),host:u.hostname,path:u.pathname});return route.abort()}
  if(u.hostname==='pagead2.googlesyndication.com')return route.fulfill({contentType:'application/javascript',body:''});
  if(u.origin!==origin){const generated_at=new Date().toISOString(),headers={'Access-Control-Allow-Origin':origin};return route.fulfill({contentType:'application/json',headers,body:JSON.stringify({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at,boards:recordBoards.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:generated_at,revision:0}))})})}
  const file=decodeURIComponent(u.pathname.slice(1))||'index.html';
  try{const body=await readFile(resolve(dist,file));if(file.endsWith('.js'))report.assetSha256[file]=createHash('sha256').update(body).digest('hex');return route.fulfill({body,contentType:({'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'})[extname(file)]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:'Independent fixture missing resource'})}
 });
 c.on('page',p=>{p.on('pageerror',e=>report.pageErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())})});
 return c;
}
async function open(c){current=await c.newPage();current.setDefaultTimeout(12000);await current.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});await current.locator('.game-card').first().waitFor();const panel=current.locator('#analytics-settings-host .panel');if(await panel.isVisible())await current.locator('#analytics-settings-host #deny').click();return current}
const ids=p=>p.locator('.game-card:not([hidden])').evaluateAll(cs=>cs.map(c=>c.dataset.gameId));
const favorite=(p,id)=>p.locator(`[data-game-id="${id}"] .favorite-button`);
async function picker(p){if(!await p.locator('#tag-picker').evaluate(d=>d.open))await p.locator('#tag-picker summary').click()}
async function shot(p,name){await p.evaluate(()=>scrollTo(0,0));const file=out+'/'+name+'.png';await p.screenshot({path:file});report.images.push(file)}
async function inspect(p,name){const observation=await p.locator('.game-card').evaluateAll(cs=>cs.map(c=>({id:c.dataset.gameId,hidden:c.hidden,position:c.dataset.cardPosition,display:getComputedStyle(c).display})));const visible=observation.filter(c=>!c.hidden);check(visible.every((c,i)=>c.position===String(i+1))&&observation.filter(c=>c.hidden).every(c=>c.position===undefined&&c.display==='none'),name,{observation});}
try{
 const c=await context();const p=await open(c);
 check((await ids(p)).length===30,'all active30 rendered initially');
 await p.evaluate(()=>{window.independentRefs=[...document.querySelectorAll('.game-card')].map(c=>({c,id:c.dataset.gameId,record:c.querySelector('.card-records'),play:c.querySelector('.game-play'),ranking:c.querySelector('.leaderboard-button'),tags:[...c.querySelectorAll('.game-tags li')].map(t=>t.dataset.tagId)}))});
 await picker(p);await p.locator('#tag-options [data-tag-id="puzzle"]').click();await p.locator('#tag-options [data-tag-id="brain-training"]').click();
 const manualOr=gameCatalog.filter(g=>g.tags.some(t=>['puzzle','brain-training'].includes(t.id))).map(g=>g.id);
 check(JSON.stringify(await ids(p))===JSON.stringify(manualOr),'independent manually calculated OR IDs');await inspect(p,'OR hidden CSS and positions');
 await p.locator('[data-mode="and"]').click();const manualAnd=gameCatalog.filter(g=>['puzzle','brain-training'].every(id=>g.tags.some(t=>t.id===id))).map(g=>g.id);
 check(JSON.stringify(await ids(p))===JSON.stringify(manualAnd),'independent manually calculated AND IDs');await inspect(p,'AND hidden CSS and positions');
 await p.locator('#tag-picker summary').click();const chip=p.locator('#selected-tags button[aria-label="脳トレの絞り込みを解除"]');await chip.focus();await p.keyboard.press('Enter');
 check(await p.locator('#tag-picker summary').evaluate(e=>document.activeElement===e),'closed picker chip removal restores summary focus');
 await picker(p);await p.locator('#tag-options [data-tag-id="brain-training"]').click();await p.locator('#selected-tags button[aria-label="脳トレの絞り込みを解除"]').focus();await p.keyboard.press('Space');
 check(await p.locator('#tag-options [data-tag-id="brain-training"]').evaluate(e=>document.activeElement===e),'open picker chip removal restores original tag focus');
 await p.locator('#clear-filters').click();await inspect(p,'clear all hidden and positions restored');
 await favorite(p,'game031').focus();await p.keyboard.press('Space');
 check((await ids(p))[0]==='game031'&&await favorite(p,'game031').evaluate(e=>document.activeElement===e),'keyboard Space favorite latest031 moves first and retains focus');
 await p.keyboard.press('Tab');check(await p.locator('[data-game-id="game031"] .game-play').evaluate(e=>document.activeElement===e),'Tab from retained favorite reaches same card PLAY');
 await favorite(p,'game031').focus();await p.keyboard.press('Enter');check((await ids(p)).at(-1)==='game031'&&await favorite(p,'game031').evaluate(e=>document.activeElement===e),'keyboard Enter unfavorite latest031 moves last and retains focus');
 await picker(p);await p.locator('#tag-options [data-tag-id="wind"]').click();await inspect(p,'wind visible019 only positions');
 const peer=await open(c);await favorite(peer,'game031').click();await p.waitForFunction(()=>document.querySelector('[data-game-id="game031"] .favorite-button').getAttribute('aria-pressed')==='true');
 check(JSON.stringify(await ids(p))==='["game019"]'&&await favorite(p,'game031').getAttribute('aria-pressed')==='true','actual cross-tab storage updates hidden favorite without changing filter');await inspect(p,'cross-tab hidden favorite retains no position');
 await favorite(peer,'game019').click();await p.waitForFunction(()=>document.querySelector('[data-game-id="game019"] .favorite-button').getAttribute('aria-pressed')==='true');check(await favorite(p,'game019').getAttribute('aria-pressed')==='true','actual cross-tab visible favorite updates');
 await peer.evaluate(()=>localStorage.clear());await p.waitForFunction(()=>document.querySelector('[data-game-id="game019"] .favorite-button').getAttribute('aria-pressed')==='false');
 check(await favorite(p,'game031').getAttribute('aria-pressed')==='false'&&JSON.stringify(await ids(p))==='["game019"]','native storage clear keynull resets favorites but preserves selection');
 await p.locator('#clear-filters').click();check(await p.evaluate(()=>window.independentRefs.every(({c,id,record,play,ranking,tags})=>c.isConnected&&c.dataset.gameId===id&&c.querySelector('.card-records')===record&&c.querySelector('.game-play')===play&&c.querySelector('.leaderboard-button')===ranking&&JSON.stringify([...c.querySelectorAll('.game-tags li')].map(t=>t.dataset.tagId))===JSON.stringify(tags))),'all30 card ID tags records PLAY ranking identity retained through filters cross-tab and reorders');
 await c.close();await save();
 for(const denial of ['getter','favorites-read']){const ctx=await context(390,844,denial),p=await open(ctx);check((await ids(p)).length===30,denial+' failure still renders all30');await favorite(p,'game031').click();check((await ids(p))[0]==='game031',denial+' failure memory favorite works');if(denial==='getter')check(await p.locator('#favorites-storage-notice').isVisible(),'denied getter shows memory-only notice');await picker(p);await p.locator('#tag-options [data-tag-id="wind"]').click();check(JSON.stringify(await ids(p))==='["game019"]',denial+' failure filters still work');await p.locator('#clear-filters').click();check((await ids(p))[0]==='game031',denial+' failure favorite memory survives filtering');await shot(p,'390-'+denial);await ctx.close();await save()}
 for(const [w,h] of [[1440,900],[390,844],[320,720]]){const ctx=await context(w,h),p=await open(ctx);await shot(p,w+'-independent-initial');const geom=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,closed:!document.querySelector('#tag-picker').open,buttons:[...document.querySelectorAll('#game-discovery button,.favorite-button')].filter(b=>b.getClientRects().length).map(b=>({h:b.getBoundingClientRect().height,w:b.getBoundingClientRect().width})),firstPlay:document.querySelector('.game-play').getBoundingClientRect().toJSON()}));check(geom.scrollWidth<=geom.width&&geom.buttons.every(b=>b.h>=44),w+' controls44 and no horizontal overflow',{geom});await ctx.close();await save()}
 check(report.pageErrors.length===0,'zero independent page exceptions',{errors:report.pageErrors});check(report.blockedWrites.length===0,'denied independent probe attempts zero POST or other writes',{writes:report.blockedWrites});check(report.consoleErrors.length===0,'zero independent console errors',{errors:report.consoleErrors});report.result='PASS';
}catch(e){report.result='FAIL';report.failure=String(e);if(current&&!current.isClosed())try{await shot(current,'failure')}catch{}}
finally{report.complete=true;await browser.close();await save()}
if(report.result!=='PASS')process.exitCode=1;
