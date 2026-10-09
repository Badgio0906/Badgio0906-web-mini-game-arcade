// Compiled-build verification of the four corrected long-menu layouts.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.NAV_QA_OUT,base=process.env.NAV_BASE||'http://127.0.0.1:8813/';
if(!out)throw Error('Unique output required');await mkdir(out,{recursive:false});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={at:new Date().toISOString(),base,cases:[],errors:[],provenance:'Final compiled production build. Ordinary title/explanation/practice inputs and actual return, four viewports. No state injection; POST and external requests blocked.'};
try{for(const viewport of [{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width!==1300,isMobile:viewport.width!==1300});await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await context.route('**/*',r=>r.request().method()==='POST'||!r.request().url().startsWith(base)?r.abort():r.continue());
 const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));
 for(const id of ['game022','game023','game024','game028'])for(const state of ['title','explanation','practice']){
  const item={id,viewport,state};try{
   await page.goto(base+id+'.html',{waitUntil:'domcontentloaded'});await page.waitForSelector('#portal-link');
   if(state!=='title')await page.locator(state==='explanation'?'#explain-button, #explain':'#practice-button, #practice').click();
   const a=page.locator('.arcade-game-header .arcade-portal-return');item.geometry=await a.evaluate(a=>{const r=a.getBoundingClientRect();return {x:r.x,y:r.y,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')===a}});
   if(!item.geometry.hit||item.geometry.height<44||item.geometry.x>100&&viewport.width<500)throw Error('header return geometry');
   if(state==='explanation')await page.screenshot({path:`${out}/${id}-${viewport.width}.png`});
   if(viewport.width===1300){await a.focus();await page.keyboard.press('Enter')}else await a.tap();
   await page.waitForURL(base+'index.html');item.actual_return=true;item.pass=true;
  }catch(e){item.pass=false;item.failure=e.message}report.cases.push(item);await writeFile(out+'/REPORT.json',JSON.stringify({...report,result:'RUNNING'},null,2)+'\n');
 }
 await context.close();
}}finally{await browser.close();report.result=report.cases.length===48&&report.cases.every(c=>c.pass)&&!report.errors.length?'PASS':'FAIL';await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n')}
console.log({result:report.result,cases:report.cases.length,failures:report.cases.filter(c=>!c.pass)});if(report.result!=='PASS')process.exitCode=1;
