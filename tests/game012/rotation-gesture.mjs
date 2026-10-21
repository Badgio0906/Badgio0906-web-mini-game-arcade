// Real browser pointer/keyboard gestures spanning two orientation changes.
// No score, engine model, time or event dispatch is injected.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4972/',out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),rows=[];
try{for(const method of ['pointer','touch','Space','Enter']){
 const c=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await c.addInitScript(()=>{try{localStorage.setItem('game100garage:analytics-consent:v1','denied');}catch{}});
 const row={method,requests:0,errors:[]};
 await c.route('**/*',r=>{const q=r.request();if(!q.url().startsWith(base)||!['GET','HEAD'].includes(q.method()))return r.abort();if(q.url().includes('/game.html')){row.requests++;return r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Activation boundary probe</title>'});}return r.continue();});
 const p=await c.newPage();p.on('pageerror',e=>row.errors.push(e.message));
 try{await p.goto(base+'games/yokodori-days/index.html');await p.locator('#tutorial-explain-button').tap();
 const button=p.locator('#play-button');let session;
 if(method==='pointer'){const r=await button.boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();}
 else if(method==='touch'){const r=await button.boundingBox();session=await c.newCDPSession(p);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});}
 else{await button.focus();if(method==='Space')await p.keyboard.down('Space');else{
  // Enter activates on keydown; start the held key on a non-button, then focus
  // the surviving button before keyup to check no release-driven activation.
  await p.getByRole('heading',{name:'遊び方',exact:true}).evaluate(e=>{e.tabIndex=-1;e.focus();});await p.keyboard.down('Enter');await button.focus();
 }}
 await p.setViewportSize({width:390,height:844});await button.waitFor();assert.equal(await button.isDisabled(),true);
 await p.setViewportSize({width:844,height:390});assert.equal(await button.isDisabled(),false);
 if(method==='pointer')await p.mouse.up();else if(method==='touch')await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await p.keyboard.up(method);
 await p.waitForTimeout(200);row.staleRequests=row.requests;row.src=await p.locator('#legacy-game-frame').getAttribute('src');
 assert.equal(row.src,null,'A gesture begun before rotation must not start the engine');assert.equal(row.requests,0);
 // A genuinely fresh activation must remain usable after the rejected gesture.
 if(method==='Space'||method==='Enter'){await button.focus();await p.keyboard.press(method);}else await button.tap();
 await p.waitForFunction(()=>document.querySelector('#legacy-game-frame').hasAttribute('src'));row.freshActivation=true;assert.equal(row.errors.length,0);row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;}finally{rows.push(row);await c.close();console.log(JSON.stringify(row));}
}}finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');}
if(rows.some(r=>!r.pass))process.exitCode=1;
