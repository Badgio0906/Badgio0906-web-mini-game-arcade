// Real lesson inputs/clock, read-only DEV snapshots. No score/model/time injection.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.QA_OUT,base=process.env.QA_BASE||'http://127.0.0.1:4941/';
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await c.newPage(),r={errors:[],steps:[]};
await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
await c.route('**/*',x=>x.request().url().startsWith(base)&&['GET','HEAD'].includes(x.request().method())?x.continue():x.abort());
p.on('pageerror',e=>r.errors.push(e.message));
try{
 await p.goto(base+'game015.html');await p.locator('#tutorial-again-button').tap();
 for(let step=0;step<4;step++){
  await p.waitForFunction(step=>window.__tutorialDebug.snapshot().practice.step===step,step,{timeout:12000});
  const direction=step===1?'ArrowRight':step===2?'ArrowLeft':null;
  if(direction)await p.keyboard.down(direction);await p.keyboard.down('ArrowDown');
  await p.waitForFunction(step=>{const s=window.__tutorialDebug.snapshot().practice;return s.step===step&&s.fall.phase==='landed';},step,{timeout:12000});
  r.steps.push(await p.evaluate(()=>window.__tutorialDebug.snapshot().practice));
  await p.keyboard.up('ArrowDown');if(direction)await p.keyboard.up(direction);
 }
 await p.locator('#tutorial-start-button').waitFor({timeout:20000});r.success=await p.evaluate(()=>window.__tutorialDebug.snapshot());
 assert(r.success.practice.complete);await p.screenshot({path:out+'/success-portrait.png'});
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);
 r.landscape=await p.locator('#arcade-training').evaluate(d=>({open:d.open,display:getComputedStyle(d).display,phase:d.dataset.phase,rect:d.getBoundingClientRect().toJSON()}));
 assert(!r.landscape.open&&r.landscape.display==='none'&&r.landscape.phase==='success');
 await p.setViewportSize({width:390,height:844});await p.locator('#tutorial-start-button').waitFor();
 r.returned=await p.evaluate(()=>window.__tutorialDebug.snapshot());assert.equal(r.returned.phase,'success');assert(r.returned.practice.complete);
 await p.screenshot({path:out+'/success-returned.png'});await p.locator('#tutorial-start-button').tap();
 assert.equal(await p.locator('#app').getAttribute('data-state'),'title');await p.locator('#play-button').tap();assert.equal(await p.locator('#app').getAttribute('data-state'),'playing');
 assert.equal(r.errors.length,0);r.pass=true;
}catch(e){r.pass=false;r.failure=e.message;r.state=await p.evaluate(()=>window.__tutorialDebug?.snapshot());await p.screenshot({path:out+'/FAIL.png'});}
finally{await c.close();await b.close();await writeFile(out+'/REPORT.json',JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({pass:r.pass,failure:r.failure}));}
if(!r.pass)process.exitCode=1;
