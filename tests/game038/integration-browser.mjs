// Compiled build, normal input only. Inspect DOM and persisted saves; never inject game state/time.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.GAME038_BASE||'http://127.0.0.1:4981',out=process.env.GAME038_REPORT;
if(!out)throw Error('GAME038_REPORT required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),results=[];
try{for(const [width,height]of [[1440,900],[390,844],[320,568],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});
 await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await context.route('**/*',r=>r.request().url().startsWith(base)&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 const page=await context.newPage(),row={width,height,errors:[]};page.on('pageerror',e=>row.errors.push(e.message));
 const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game038:state')||'null'));
 const phase=()=>page.locator('#app').getAttribute('data-state');
 const tap=async sel=>{await page.waitForTimeout(470);await page.locator(sel).click();};
 const shot=async name=>page.screenshot({path:`${out}/${width}-${name}.png`,fullPage:true});
 const noOverflow=async()=>{
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  if(await page.locator('#menu').isVisible()){
   const box=await page.locator('#menu').boundingBox(),settings=await page.locator('#analytics-settings-host #settings').boundingBox(),header=await page.locator('header').boundingBox();
   assert(box.y>=header.y+header.height-1&&box.y+box.height<=settings.y+1,`dialog must not overlap header/settings: ${JSON.stringify({box,settings,header})}`);
  }
 };
 try{
  assert.equal((await page.goto(base+'/game038.html')).status(),200);
  assert.equal(await page.evaluate(()=>typeof window.__game038),'undefined');await noOverflow();
  await tap('#practice');await tap('#start');await tap('#speed-next');
  for(let i=0;i<120&&!(await page.locator('#real').count());i++){
   if(await phase()==='decide')await tap('#choice-0');else await page.waitForTimeout(150);
  }
  assert.equal(await page.locator('#real').count(),1,'practice completes');assert.equal((await save())?.runs||0,0);
  await tap('#real');await page.locator('#name').fill('<i>ひかり</i>&amp;');await page.locator('.genre:has(input[value=song])').click();await noOverflow();await shot('setup');
  await tap('#debut');assert.equal((await save()).snapshot.aim,'song');assert(!(await save()).snapshot.name.includes('<'));await shot('debut');
  await tap('#start');await tap('#speed-pause');const before=await save();await page.waitForTimeout(400);assert.equal((await save()).snapshot.month,before.snapshot.month);
  await tap('#focus-rest');assert.equal((await save()).snapshot.focus,'rest');await noOverflow();await shot('play');
  const month=(await save()).snapshot.month;await page.reload();assert.equal(await phase(),'paused');assert.equal((await save()).snapshot.month,month);await tap('#resume');
  let endingReloaded=false;
  for(let i=0;i<1200&&await phase()!=='card';i++){
   const st=await phase();
   if(st==='decide'){
    await noOverflow();
    if(await page.locator('#note').count()){
     if((await save())?.snapshot?.pending?.kind==='end'&&!endingReloaded){
      const s=await save();await shot('ending');await page.reload();assert.equal(await phase(),'paused');assert.equal((await save()).snapshot.month,s.snapshot.month);assert.equal((await save()).runs,0);await tap('#resume');endingReloaded=true;
     }
     await page.locator('#note').fill('おつかれさま！');await tap('#answer');
    }else await tap('#choice-0');
   }else if(st==='play'){if(await page.locator('#speed-next').getAttribute('aria-pressed')!=='true')await page.locator('#speed-next').click();await page.waitForTimeout(100);}
   else throw Error(`unexpected phase ${st}`);
  }
  assert.equal(await phase(),'card');assert(endingReloaded,'normal ending survives reload');const s=await save();assert.equal(s.runs,1);assert.equal(s.history.length,1);assert.equal(s.snapshot,null);assert(s.bestRank>=1&&s.bestRank<=60000);
  assert((await page.locator('#card-body').innerText()).includes('おつかれさま！'));await noOverflow();await shot('result');
  for(const id of['again','copy','card-title']){const r=await page.locator('#'+id).boundingBox();assert(r.width>=44&&r.height>=44&&r.x>=0&&r.x+r.width<=width+1);}
  await tap('#again');assert.equal(await phase(),'setup');assert.equal(await page.locator('#name').inputValue(),s.lastName);
  await page.locator('#portal-link').click();await page.waitForURL('**/index.html');assert.equal(await page.locator('.game-card').count(),28);const card=page.locator('[data-game-id="game038"]');assert((await card.innerText()).includes('028'));assert.equal(await card.locator('.leaderboard-button,.card-records').count(),0);await card.locator('.game-play').click();await page.waitForURL('**/game038.html');assert.equal((await save()).runs,1);
  row.months=s.history[0].months;row.rank=s.bestRank;row.endingReloaded=endingReloaded;row.pass=true;assert.equal(row.errors.length,0);
 }catch(error){row.pass=false;row.error=String(error.stack||error);await shot('failure').catch(()=>{});}
 finally{results.push(row);await context.close();}
}}finally{await browser.close();await writeFile(out+'/RESULTS.json',JSON.stringify({base,at:new Date().toISOString(),results},null,2)+'\n');console.log(JSON.stringify(results,null,2));}
if(results.some(r=>!r.pass))process.exitCode=1;
