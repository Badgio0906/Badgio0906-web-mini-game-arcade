import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.MOBILE_BASE||'http://127.0.0.1:4980';
const out=process.env.MOBILE_OUT||'docs/mobile-eleven-20261104/QA/compiled';await mkdir(out,{recursive:true});
const routes={game006:'game006.html',game009:'game009.html',game012:'games/yokodori-days/index.html',game013:'games/tachibana-task-heaven/index.html',game014:'games/finger-heart-challenge/index.html',game020:'game020.html',game022:'game022.html',game023:'game023.html',game025:'game025.html',game027:'game027.html',game051:'games/echo_office/index.html'};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const results=[];
try{for(const [id,route]of Object.entries(routes))for(const [width,height]of[[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(10000);const row={id,width,height,errors:[],failedResponses:[]};page.on('pageerror',e=>row.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))row.failedResponses.push({status:r.status(),url:r.url()});});await page.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 try{const response=await page.goto(base+'/'+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  if(id==='game012'&&width===390){await page.getByRole('heading',{name:'横向きで遊んでください'}).waitFor();row.guide=true;}
  else{
   const selector=['game013','game014','game025','game051'].includes(id)?'#play':'#play-button';await page.locator(selector).click();
   if(id==='game051'){for(let i=0;i<2;i++)await page.locator('#guide-next').click();await page.locator('#guide-play').click();}
   if(id==='game012'){await page.frameLocator('#legacy-game-frame').locator('#status').waitFor({state:'hidden',timeout:45000});await page.waitForTimeout(1000);await page.frameLocator('#legacy-game-frame').locator('#canvas').focus();await page.keyboard.press('Enter');}
   if(id==='game013')await page.locator('#pads').waitFor({state:'visible',timeout:30000});
   if(id==='game014')await page.locator('#stop:not([disabled])').waitFor({state:'visible',timeout:30000});
   await page.waitForTimeout(200);
   row.body=await page.locator('body').evaluate(e=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,state:e.querySelector('#app')?.dataset.state,devHooks:Object.getOwnPropertyNames(window).filter(k=>/^__game0/.test(k))}));assert.equal(row.body.devHooks.length,0);assert(row.body.scrollWidth<=width+1);
  }
  await page.screenshot({path:`${out}/${id}-${width}.jpg`,type:'jpeg',quality:75});assert.deepEqual(row.errors,[]);assert.deepEqual(row.failedResponses,[]);row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;await page.screenshot({path:`${out}/${id}-${width}-failure.jpg`}).catch(()=>{});}
 results.push(row);console.log(JSON.stringify(row));await context.close();await writeFile(out+'/REPORT.json',JSON.stringify({base,results},null,2)+'\n');
}}finally{await browser.close();}if(results.some(r=>!r.pass))process.exitCode=1;
