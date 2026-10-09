import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const outputName=process.env.NAV_EXPLANATION_REPORT;
if(outputName&&!/^[a-z0-9-]+$/.test(outputName))throw new Error('Invalid report directory');
const out=fileURLToPath(outputName?new URL(`../${outputName}/`,import.meta.url):new URL('.',import.meta.url));
await mkdir(out,{recursive:true});
const repo=fileURLToPath(new URL('../../../../',import.meta.url));
const hash=async path=>createHash('sha256').update(await readFile(repo+path)).digest('hex');
const report={at:new Date().toISOString(),status:'RUNNING',completed:false,result:'IN_PROGRESS',base:'http://127.0.0.1:5173/',reviewer:'independent navigation_review subagent',source:{},cases:[],errors:[],postsBlocked:0,externalBlocked:0,provenance:'Read-only independent Chromium review. Disposable contexts; analytics consent denied; all POST and external requests blocked. Explanation and return use ordinary keyboard/mouse/tap. No game model injection or production writes.'};
for(const path of ['public/arcade-navigation.js','src/games/game022/style.css','src/games/game023/style.css','src/games/game024/style.css','src/games/game028/style.css'])report.source[path]=await hash(path);
const manifest=JSON.parse(await readFile(repo+'docs/navigation/QA/FINAL_SOURCE_MANIFEST.json','utf8'));
report.sourceManifestBefore={files:manifest.files.length,mismatches:[]};
for(const file of manifest.files)if(await hash(file.path)!==file.sha256)report.sourceManifestBefore.mismatches.push(file.path);
const ids=Array.from({length:31},(_,i)=>i+1).filter(i=>![10,12,13,14].includes(i));
const viewports=[{width:320,height:720},{width:844,height:390}];
const tasks=ids.flatMap(id=>viewports.map(viewport=>({id,viewport})));
tasks.push({id:22,viewport:{width:1300,height:900}},{id:22,viewport:{width:390,height:844}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const {id,viewport} of tasks){
  const gameId=`game${String(id).padStart(3,'0')}`;
  const touch=viewport.width<500;
  const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,serviceWorkers:'block'});
  await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
  await context.route('**/*',async route=>{
   const request=route.request();
   if(request.method()==='POST'){report.postsBlocked++;return route.abort();}
   const url=new URL(request.url());
   if(!['127.0.0.1','localhost'].includes(url.hostname)){report.externalBlocked++;return route.abort();}
   return route.continue();
  });
  const page=await context.newPage();
  const item={gameId,viewport,pass:false,explanationSelector:null,explanationMethod:null,geometry:null,returnMethod:touch?'tap':'Enter',consoleErrors:[]};
  page.on('pageerror',e=>item.consoleErrors.push(e.message.slice(0,300)));
  try{
   await page.goto(report.base+gameId+'.html',{waitUntil:'domcontentloaded',timeout:20000});
   await page.locator('.arcade-game-header a.arcade-portal-return').waitFor({state:'visible',timeout:12000});
   const selectors=['#tutorial-explain-button','#explain-button','#explain','#help','#how-button','#how','#help-button'];
   let explanation=null;
   for(const selector of selectors){
    const locator=page.locator(selector).first();
    if(await locator.count()&&await locator.isVisible()&&await locator.isEnabled()){explanation=locator;item.explanationSelector=selector;break;}
   }
   if(!explanation)throw new Error('No ordinary explanation control found on title');
   try{await explanation.click({timeout:2200});item.explanationMethod='click';}
   catch(error){item.explanationClickUnavailable=String(error.message).split('\n')[0];await explanation.press('Enter',{timeout:3000});item.explanationMethod='Enter fallback';}
   await page.waitForTimeout(250);
   const proxy=page.locator('dialog:modal .arcade-modal-return');
   const anchor=await proxy.count()?proxy.last():page.locator('.arcade-game-header a.arcade-portal-return').first();
   item.geometry=await anchor.evaluate(anchor=>{
    const box=anchor.getBoundingClientRect(),hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
    const header=document.querySelector('.arcade-game-header')?.getBoundingClientRect();
    return {text:anchor.textContent,href:anchor.href,x:box.x,y:box.y,width:box.width,height:box.height,hit:hit===anchor||anchor.contains(hit),hitElement:hit?.tagName,hitId:hit?.id,modalProxy:anchor.classList.contains('arcade-modal-return'),header:header?{x:header.x,y:header.y,width:header.width,height:header.height,bottom:header.bottom}:null,state:document.getElementById('app')?.dataset.state,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,modal:d.matches(':modal'),x:d.getBoundingClientRect().x,y:d.getBoundingClientRect().y,height:d.getBoundingClientRect().height}))};
   });
   await page.screenshot({path:out+`${gameId}-${viewport.width}-explanation.png`});
   item.screenshot=`${gameId}-${viewport.width}-explanation.png`;
   if(!item.geometry.hit||item.geometry.height<44)throw new Error('Return is covered or shorter than44px');
   if(touch)await anchor.tap({timeout:5000});else await anchor.press('Enter',{timeout:5000});
   await page.waitForURL(url=>url.pathname==='/index.html',{timeout:15000,waitUntil:'domcontentloaded'});
   item.returnUrl=page.url();item.pass=true;
  }catch(error){
   item.failure=String(error.message).split('\n').slice(0,3).join('\n');
   try{await page.screenshot({path:out+`${gameId}-${viewport.width}-failure.png`});}catch{}
  }finally{await context.close();}
  report.cases.push(item);
  await writeFile(out+'REPORT.json',JSON.stringify(report,null,2)+'\n');
  process.stdout.write(`${gameId} ${viewport.width} ${item.pass?'PASS':'FAIL '+item.failure}\n`);
 }
}finally{await browser.close();}
report.finishedAt=new Date().toISOString();
report.summary={cases:report.cases.length,passed:report.cases.filter(c=>c.pass).length,failed:report.cases.filter(c=>!c.pass).length};
report.sourceManifestAfter={files:manifest.files.length,mismatches:[]};
for(const file of manifest.files)if(await hash(file.path)!==file.sha256)report.sourceManifestAfter.mismatches.push(file.path);
report.status='COMPLETE';report.completed=true;
report.result=report.summary.failed||report.sourceManifestBefore.mismatches.length||report.sourceManifestAfter.mismatches.length?'FAIL':'PASS';
await writeFile(out+'REPORT.json',JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify(report.summary)+'\n');
