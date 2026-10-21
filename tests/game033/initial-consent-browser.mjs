// Isolated real UI regression; no production requests or game-state/clock injection.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4963/',out=process.env.QA_OUT;if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const rows=[];
const key='game100garage:analytics-consent:v1';
async function one(width,height,choice,existing=null){
 const c=await b.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000}),row={width,height,choice,existing,errors:[],blocked:[]};
 if(existing)await c.addInitScript(({key,existing})=>{if(existing==='storage-denied'){Storage.prototype.getItem=()=>{throw new DOMException('fixture','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('fixture','SecurityError');};}else localStorage.setItem(key,existing);},{key,existing});
 await c.route('**/*',r=>{if(!r.request().url().startsWith(base)){row.blocked.push({method:r.request().method(),url:r.request().url()});return r.abort();}return r.continue();});
 const p=await c.newPage();p.setDefaultTimeout(4000);p.on('pageerror',e=>row.errors.push(e.message));
 const touch=width<1000?await c.newCDPSession(p):null;
 const holdLaunch=async ms=>{const l=p.locator('#launch');await l.scrollIntoViewIfNeeded();const box=await l.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;if(touch){await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.waitForTimeout(ms);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up();}};
 const tap=async l=>width<1000?l.tap():l.click();
 const read=()=>p.evaluate(key=>{try{return localStorage.getItem(key);}catch{return 'storage-unavailable';}},key);
 const title=async()=>{assert.equal(await p.locator('#app').getAttribute('data-state'),'title');assert.equal(await p.locator('#menu').evaluate(e=>e.open&&!e.matches(':modal')),true);assert.equal(await p.locator('#launch').isDisabled(),true);};
 const settings=p.locator('#analytics-settings-host');
 try{
 await p.goto(base+'game033.html',{waitUntil:'networkidle'});await title();
 if(existing&&existing!=='storage-denied'){assert.equal(await settings.locator('#later').isVisible(),false);await tap(settings.locator('#settings'));}
 await p.screenshot({path:out+`/${width}-${choice}-${existing||'fresh'}-before.png`});
 if(choice==='privacy'){
  await tap(settings.locator('.panel a'));await p.waitForURL('**/privacy.html');assert.equal(await read(),null);row.privacyBeforePlay=true;row.pass=true;return;
 }
 if(width===1440&&choice==='grant'){await settings.locator('#grant').focus();await p.keyboard.press('Enter');}
 else await tap(settings.locator('#'+choice));
 row.storedConsent=await read();assert.equal(row.storedConsent,existing==='storage-denied'?'storage-unavailable':choice==='grant'?'granted':choice==='deny'?'denied':existing);
 await title();row.noAutomaticStart=true;
 if(choice==='grant'){await tap(settings.locator('#settings'));await tap(settings.locator('#deny'));if(existing!=='storage-denied')assert.equal(await read(),'denied');await title();row.withdrawnBeforePlay=true;}
 await p.screenshot({path:out+`/${width}-${choice}-${existing||'fresh'}-title.png`});
 await tap(p.locator('button[data-action="how"]'));assert.equal(await p.locator('#menu').evaluate(e=>e.matches(':modal')),true);
 await tap(p.locator('button[data-action="title"]'));await title();
 await tap(p.locator('button[data-action="practice"]'));assert.equal(await p.locator('#app').getAttribute('data-state'),'playing');assert.equal(await p.locator('#practice-banner').isVisible(),true);
 await holdLaunch(400);
 await tap(p.locator('#pause'));assert.equal(await p.locator('#menu').evaluate(e=>e.matches(':modal')),true);
 await tap(p.locator('button[data-action="resume"]'));await tap(p.locator('#help'));assert.equal(await p.locator('#menu').evaluate(e=>e.matches(':modal')),true);
 await tap(p.locator('button[data-action="title"]'));await title();
 await tap(p.locator('button[data-action="play"]'));assert.equal(await p.locator('#app').getAttribute('data-state'),'playing');assert.equal(await p.locator('#menu').isVisible(),false);
 // Use real pointer gestures for normal play; the model remains untouched.
 await holdLaunch(450);
 await tap(p.locator('#pause'));const time=await p.locator('#time').innerText();await p.waitForTimeout(350);assert.equal(await p.locator('#time').innerText(),time);assert.equal(await p.locator('#menu').evaluate(e=>e.matches(':modal')),true);
 await tap(p.locator('button[data-action="resume"]'));
 if(process.env.Q04_LONG==='1'&&width===1440&&choice==='later'&&!existing){
  const t=Date.now();await p.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',null,{timeout:110000});row.normalRunWaitMs=Date.now()-t;assert.equal(await p.locator('#menu').evaluate(e=>e.matches(':modal')),true);await p.screenshot({path:out+'/normal-result.png'});await tap(p.locator('button[data-action="retry"]'));assert.equal(await p.locator('#app').getAttribute('data-state'),'playing');row.retry=true;
 }
 await tap(p.locator('#pause'));await tap(p.locator('dialog[open] a.arcade-portal-return'));await p.waitForURL('**/index.html');row.returned=true;assert.equal(row.errors.length,0);row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;await p.screenshot({path:out+`/${width}-${choice}-${existing||'fresh'}-failure.png`}).catch(()=>{});}
 finally{await c.close();rows.push(row);await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({width,choice,existing,pass:row.pass,failure:row.failure}));}
}
try{for(const [w,h] of [[1440,900],[390,844],[320,568],[844,390]])for(const choice of ['grant','deny','later','privacy'])await one(w,h,choice);for(const existing of ['granted','denied','storage-denied'])await one(390,844,'grant',existing);}finally{await b.close();}
if(rows.some(r=>!r.pass))process.exitCode=1;
