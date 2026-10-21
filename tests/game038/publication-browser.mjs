// Read-only deployment smoke. Isolated consent-denied contexts; block ads, analytics and all writes.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=(process.env.PUBLICATION_BASE||'https://game100garage.com').replace(/\/$/,''),out=process.env.PUBLICATION_REPORT;
if(!out)throw Error('PUBLICATION_REPORT required');await mkdir(out,{recursive:true});
const settings={executablePath:'/usr/bin/chromium',args:['--no-sandbox']};
if(base.startsWith('https:'))settings.proxy={server:process.env.HTTPS_PROXY||process.env.HTTP_PROXY};
const browser=await chromium.launch(settings),results=[],section=process.env.PUBLICATION_SECTION||'all';
const make=async(width,height)=>{
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});
 await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());return c;
};
try{
 if(['all','portal'].includes(section))for(const[width,height]of[[1440,900],[390,844],[320,568],[844,390]]){
  const c=await make(width,height),p=await c.newPage(),r={type:'portal',width,height,errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
  try{
   assert.equal((await p.goto(base+'/')).status(),200);await p.locator('.game-card').first().waitFor();assert.equal(await p.locator('.game-card').count(),28);
   for(const[id,num]of[['game036','027'],['game038','028']]){const card=p.locator(`[data-game-id="${id}"]`);assert.equal(await card.locator('.game-number').innerText(),num);assert((await card.innerText()).includes('試遊版'));const image=card.locator('img');await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());assert(await image.evaluate(i=>i.complete&&i.naturalWidth===640&&i.naturalHeight===360));}
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:`${out}/portal-${width}.png`,fullPage:false});assert.equal(r.errors.length,0);r.pass=true;
  }catch(e){r.pass=false;r.error=String(e.stack||e);}finally{results.push(r);await c.close();}
 }
 if(['all','games'].includes(section))for(const[width,height]of[[1440,900],[390,844]])for(const id of['game036','game038']){
  const c=await make(width,height),p=await c.newPage(),r={type:id,width,height,errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
  try{
   assert.equal((await p.goto(`${base}/${id}.html`)).status(),200);assert.equal(await p.evaluate(id=>typeof window['__'+id],id),'undefined');await p.waitForTimeout(500);
   if(id==='game036'){
    await p.locator('#play').click();await p.locator('#left').click();
    await p.locator('#pause').click();assert.equal(await p.locator('#app').getAttribute('data-state'),'paused');await p.waitForTimeout(500);await p.locator('#resume').click();
   }else{
    await p.locator('#play').click();await p.locator('#name').fill('公開確認');await p.locator('#debut').click();await p.waitForTimeout(500);await p.locator('#start').click();await p.waitForTimeout(100);await p.locator('#pause').click();assert.equal(await p.locator('#app').getAttribute('data-state'),'paused');
   }
   await p.screenshot({path:`${out}/${id}-${width}.png`,fullPage:false});await p.locator('#portal-link').click();await p.waitForURL('**/index.html');await p.locator('.game-card').first().waitFor();assert.equal(await p.locator('.game-card').count(),28);assert.equal(r.errors.length,0);r.pass=true;
  }catch(e){r.pass=false;r.error=String(e.stack||e);}finally{results.push(r);await c.close();}
 }
}finally{await browser.close();await writeFile(out+'/RESULTS.json',JSON.stringify({base,at:new Date().toISOString(),realPostRequests:0,results},null,2)+'\n');console.log(JSON.stringify(results,null,2));}
if(results.some(r=>!r.pass))process.exitCode=1;
