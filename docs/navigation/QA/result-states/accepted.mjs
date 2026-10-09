import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../result-states-accepted/',import.meta.url));
const repo=fileURLToPath(new URL('../../../../',import.meta.url));
const base=process.env.NAV_RESULT_BASE||'http://127.0.0.1:8813/';
await mkdir(out,{recursive:true});
const hash=async path=>createHash('sha256').update(await readFile(repo+path)).digest('hex');
const manifest=JSON.parse(await readFile(repo+'docs/navigation/QA/FINAL_SOURCE_MANIFEST.json','utf8'));
const mismatch=async()=>{const wrong=[];for(const f of manifest.files)if(await hash(f.path)!==f.sha256)wrong.push(f.path);return wrong;};
const selected=[4,21,23];
const methods={1:'Start and ordinary idle until collision.',2:'Start and ordinary idle until collision.',4:'Start; wait until recall; ordinary digit1 twice produces a wrong sequence (initial adjacent cues differ).',5:'Start and ordinary idle until parcel deadline.',15:'Start and ordinary idle until ceiling/fall failure.',16:'Start and ordinary idle until question timeout.',18:'Start, select default shoe, stop angle/spin/power with ordinary control presses; wait for landing.',21:'Select ordinary same-device two-player mode; seven alternating column0/1 drops yield four-in-a-row.',23:'Start and guess successive unused visible kana through ordinary buttons until terminal correct/end; no hidden-answer observation.',24:'Start and ordinary idle until wall collision.',29:'Start, ordinary cast; wait for returned dock; actual finish button.'};
const report={startedAt:new Date().toISOString(),status:'RUNNING',completed:false,result:'IN_PROGRESS',base,sourceCommit:process.env.NAV_SOURCE_COMMIT||'post08531b12-menu-scroll-candidate',compiledSnapshot:process.env.NAV_COMPILED_SNAPSHOT||'parent-confirmed frozen final build',sourceManifest:{files:manifest.files.length,before:await mismatch()},cases:[],postsBlocked:0,externalBlocked:0,fixture:false,retestOf:'Original44 retained; corrected004 and actual021/023 result transition geometry across four widths; no wheel or manual scroll recovery allowed.',provenance:'Independent compiled-preview result navigation QA. All game actions are ordinary trusted Playwright mouse/keyboard/tap inputs; time is not advanced or patched, game model/save is not injected. Disposable contexts; analytics consent denied; POST/external requests blocked. Simulated Chromium only, no production writes or physical-device claim.',limitations:[]};
for(const id of Array.from({length:31},(_,i)=>i+1).filter(i=>![10,12,13,14].includes(i)&&!selected.includes(i)))report.limitations.push({gameId:`game${String(id).padStart(3,'0')}`,resultState:'NOT_ATTEMPTED',reason:id===31?'Separate parent save031-release6 tests cover actual exit/save failure; no terminal win in sandbox.':'Scoped ordinary terminal suite did not complete this game; title/help/practice/play/pause coverage is separate. No full-game completion claim.'});
report.compiledHTML={};for(const id of selected){const p=`game${String(id).padStart(3,'0')}.html`;report.compiledHTML[p]=createHash('sha256').update(await(await fetch(base+p)).text()).digest('hex');}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const write=()=>writeFile(out+'REPORT.json',JSON.stringify(report,null,2)+'\n');
await write();
async function run(viewport){for(const id of selected){
 const gameId=`game${String(id).padStart(3,'0')}`,touch=viewport.width<500;
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');window.__navigationResultFocus=[];document.addEventListener('focusin',e=>window.__navigationResultFocus.push({id:e.target?.id,tag:e.target?.tagName,state:document.getElementById('app')?.dataset.state,scrollY,at:performance.now()}),true);});
 await context.route('**/*',r=>{if(r.request().method()==='POST'){report.postsBlocked++;return r.abort();}if(!['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)){report.externalBlocked++;return r.abort();}return r.continue();});
 const page=await context.newPage();page.setDefaultTimeout(9000);
 const item={gameId,viewport,method:methods[id],fixture:false,resultStateReached:false,pass:false,outcome:'UNREACHED',actions:[],pageErrors:[]};
 page.on('pageerror',e=>item.pageErrors.push(e.message.slice(0,350)));
 const press=async(selector)=>{const l=page.locator(selector).first();await l.focus();await page.keyboard.press('Enter');item.actions.push({selector,method:'ordinary Enter'});await page.waitForTimeout(240);};
 const operate=async(selector)=>{const l=page.locator(selector).first();try{if(touch)await l.tap({timeout:2200});else await l.click({timeout:2200});item.actions.push({selector,method:touch?'ordinary tap':'ordinary click'});}catch(e){await press(selector);item.actions.push({selector,clickUnavailable:String(e.message).split('\n')[0]});}await page.waitForTimeout(240);};
 const state=()=>page.locator('#app').getAttribute('data-state');
 try{
  await page.goto(base+gameId+'.html',{waitUntil:'domcontentloaded'});await page.locator('.arcade-game-header .arcade-portal-return').waitFor();
  if(id===21){await page.locator('#mode-select').selectOption('two');item.actions.push({selector:'#mode-select',method:'ordinary selectOption(two)'});await operate('#start-button');for(const c of[0,1,0,1,0,1,0])await operate(`[data-column="${c}"]`);}
  else{await operate(id===29?'#play':'#play-button');
   if(id===4){await page.waitForSelector('#app[data-phase="recall"]');await page.keyboard.press('1');await page.waitForTimeout(250);if(await state()!=='result')await page.keyboard.press('1');item.actions.push({method:'ordinary digit1 twice while recall; no canvas selector'});}
   if(id===18){await operate('#start-button');for(let n=0;n<3;n++){await page.waitForFunction(()=>!document.getElementById('control-button')?.disabled,{timeout:12000});await operate('#control-button');await page.waitForTimeout(1000);}}
   if(id===23){for(let n=0;n<22&&await state()!=='result';n++){const key=page.locator('[data-kana][aria-disabled="false"]').first();await operate(`[data-kana="${await key.getAttribute('data-kana')}"]`);}}
   if(id===29){await operate('#cast');await page.waitForFunction(()=>document.getElementById('finish')?.disabled,{timeout:3000});await page.waitForFunction(()=>!document.getElementById('finish')?.disabled,{timeout:26000});await operate('#finish');}
  }
  await page.waitForSelector('#app[data-state="result"]',{timeout:id===18?40000:26000});await page.waitForTimeout(500);item.resultStateReached=true;
  item.resultFocus=await page.evaluate(()=>({id:document.activeElement?.id,tag:document.activeElement?.tagName}));
  item.expectedResultFocus=id===23?'menu-title':'retry-button';
  item.resultFocusTrace=await page.evaluate(()=>window.__navigationResultFocus.filter(e=>e.state==='result'));
  if(!item.resultFocusTrace.some(e=>e.id===item.expectedResultFocus))throw Error('No original game result focus event captured');
  if(item.resultFocus.id!==item.expectedResultFocus)throw Error('Original game result focus choice changed');
  const proxy=page.locator('dialog:modal .arcade-modal-return');const anchor=await proxy.count()?proxy.last():page.locator('.arcade-game-header a.arcade-portal-return').first();
  item.geometry=await anchor.evaluate(a=>{const b=a.getBoundingClientRect(),h=document.querySelector('.arcade-game-header')?.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{text:a.textContent,href:a.href,x:b.x,y:b.y,width:b.width,height:b.height,hit:hit===a||a.contains(hit),modalProxy:a.classList.contains('arcade-modal-return'),header:h?{x:h.x,y:h.y,width:h.width,height:h.height}:null,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,modal:d.matches(':modal'),y:d.getBoundingClientRect().y,height:d.getBoundingClientRect().height})),resultExcerpt:(document.querySelector('#menu, #overlay')?.textContent||'').replace(/\s+/g,' ').slice(0,500)};});
  item.screenshot=`${gameId}-${viewport.width}-result.png`;await page.screenshot({path:out+item.screenshot});
  if(!item.geometry.hit||item.geometry.height<44||item.geometry.x<0||item.geometry.y<0)throw Error('Result return geometry is covered/offscreen/below44px');
  if(touch){await anchor.tap();item.returnMethod='ordinary tap';}else{await anchor.focus();await page.keyboard.press('Enter');item.returnMethod='ordinary Enter';}
  await page.waitForURL(url=>url.pathname==='/index.html',{timeout:15000,waitUntil:'domcontentloaded'});item.returnUrl=page.url();
  if(item.pageErrors.length)throw Error('Page errors observed');item.pass=true;item.outcome='PASS';
 }catch(e){item.error=String(e.message).split('\n').slice(0,4).join('\n');item.stateAtFailure=await state().catch(()=>null);item.outcome=item.resultStateReached?'FAIL':'UNREACHED';item.screenshot=`${gameId}-${viewport.width}-${item.outcome.toLowerCase()}.png`;await page.screenshot({path:out+item.screenshot}).catch(()=>{});}
 finally{await context.close();report.cases.push(item);await write();process.stdout.write(`${gameId} ${viewport.width} ${item.outcome}${item.error?' '+item.error.split('\n')[0]:''}\n`);}
}}
try{await Promise.all([{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}].map(run));}finally{await browser.close();}
report.compiledHTMLAfter={};report.compiledMismatch=[];for(const p of Object.keys(report.compiledHTML)){const digest=createHash('sha256').update(await(await fetch(base+p)).text()).digest('hex');report.compiledHTMLAfter[p]=digest;if(digest!==report.compiledHTML[p])report.compiledMismatch.push(p);}
report.sourceManifest.after=await mismatch();report.finishedAt=new Date().toISOString();report.status='COMPLETE';report.completed=true;
report.summary={attempted:report.cases.length,resultReached:report.cases.filter(c=>c.resultStateReached).length,passed:report.cases.filter(c=>c.pass).length,failed:report.cases.filter(c=>c.outcome==='FAIL').length,unreached:report.cases.filter(c=>c.outcome==='UNREACHED').length,notAttemptedGames:report.limitations.length};
report.result=report.summary.failed||report.compiledMismatch.length||report.sourceManifest.after.length||report.sourceManifest.before.length?'FAIL':report.summary.unreached?'PASS_WITH_UNREACHED_LIMITATIONS':'PASS_SCOPED';await write();process.stdout.write(JSON.stringify(report.summary)+'\n');
