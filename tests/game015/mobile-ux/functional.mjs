import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const out=process.env.QA_OUT||'test-results/game015-mobile/functional';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.QA_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const results=[];const base=process.env.QA_BASE||'http://127.0.0.1:4931/';
try{for(const [width,height] of [[390,844],[375,667],[320,568],[1440,900]]){
 const mobile=width!==1440,c=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});const row={width,height,checks:[],errors:[],writes:[],frames:null};
 await c.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('web-mini-arcade:v1:game015:tutorialCompleted','true');localStorage.setItem('web-mini-arcade:v1:game015:muted','true');});
 await c.route('**/*',r=>{const q=r.request();if(!['GET','HEAD'].includes(q.method()))row.writes.push(q.method());return q.url().startsWith(base)?r.continue():r.abort();});
 const p=await c.newPage();p.on('pageerror',e=>row.errors.push(e.message));const cdp=await c.newCDPSession(p);const snap=()=>p.evaluate(()=>window.__arcadeDebug.snapshot());const check=(ok,name)=>{row.checks.push({name,pass:!!ok});assert(ok,name);};const tap=async s=>mobile?p.locator(s).tap():p.locator(s).click();
 const start=async()=>{const state=await p.locator('#app').getAttribute('data-state');if(state==='playing')await tap('#pause-button');if(['playing','paused','result'].includes(state))await tap('#title-button');await tap('#play-button');await p.waitForFunction(()=>document.querySelector('#app').dataset.state==='playing');};
 const point=async id=>{await p.locator(id).scrollIntoViewIfNeeded();const b=await p.locator(id).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2,id:1};};
 const down=async id=>{const pt=await point(id);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});return pt;};
 const up=async()=>cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 try{
 await p.goto(base+'game015.html',{waitUntil:'networkidle'});await p.locator('#tutorial-again-button').waitFor();
 await tap('#tutorial-explain-button');check(await p.locator('#arcade-training').isVisible(),'title help reachable');await tap('#tutorial-close-button');await p.waitForFunction(()=>!document.querySelector('#arcade-training').open);
 await tap('#tutorial-again-button');await p.waitForTimeout(250);check(await p.locator('#tutorial-canvas').isVisible(),'independent practice reachable');await tap('#tutorial-close-button');await p.waitForFunction(()=>!document.querySelector('#arcade-training').open);
 await start();let s=await snap();const x=s.player.x;await down('#left-button');await p.waitForTimeout(120);s=await snap();check(s.horizontal===-1&&s.player.x<x,'left touch movement');await up();check((await snap()).horizontal===0,'direction release');
 await down('#right-button');await p.waitForTimeout(130);check((await snap()).horizontal===1,'right touch movement');await up();
 await down('#drop-button');check((await snap()).heldDrop,'DROP pointerdown');await p.waitForTimeout(65);await up();check(!(await snap()).heldDrop,'DROP short press release');
 await start();await down('#drop-button');await p.waitForTimeout(350);check((await snap()).heldDrop,'DROP continuous hold');await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});check(!(await snap()).heldDrop,'native pointercancel release');
 await down('#drop-button');await p.evaluate(()=>window.dispatchEvent(new Event('blur')));check(await p.locator('#app').getAttribute('data-state')==='paused'&&!(await snap()).heldDrop,'blur pauses and clears input');await up();await tap('#resume-button');check(await p.locator('#app').getAttribute('data-state')==='playing'&&!(await snap()).heldDrop,'resume neutral');
 await down('#drop-button');const pre=await snap();await p.setViewportSize({width:height,height:width});await p.waitForTimeout(100);s=await snap();check(!s.heldDrop&&s.time>=pre.time&&s.depth>=pre.depth,'rotation clears input without reset');await up();await p.setViewportSize({width,height});await p.waitForTimeout(80);if(mobile){check(await p.locator('#app').getAttribute('data-state')==='paused','portrait return requires explicit resume');await tap('#resume-button');}
 await tap('#pause-button');await tap('.pause-help summary');check((await p.locator('.pause-help').innerText()).includes('やわらかい床'),'paused rules retained');await tap('#resume-button');
 await start();await p.locator('#fall-canvas').focus();await p.keyboard.down('ArrowRight');await p.keyboard.down('ArrowDown');check((await snap()).horizontal===1&&(await snap()).heldDrop,'PC keyboard mappings');await p.keyboard.up('ArrowDown');await p.keyboard.up('ArrowRight');check(!(await snap()).heldDrop&&(await snap()).horizontal===0,'keyboard releases');
 // Hold through a genuine model end; never inject a score, run or result.
 await down('#drop-button');await p.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',{},{timeout:25000});await up();await p.waitForTimeout(100);check(await p.locator('#app').getAttribute('data-state')==='result','late release does not restart');
 const score=Number((await p.locator('#result-score').innerText()).replace(/[^0-9.]/g,''));const best=await p.evaluate(()=>Number(localStorage.getItem('web-mini-arcade:v1:game015:bestR04')));check(best>=score&&best>0,'actual result writes BEST');
 await tap('#retry-button');check(await p.locator('#app').getAttribute('data-state')==='playing'&&!(await snap()).heldDrop,'retry neutral');await tap('#pause-button');await tap('#title-button');check(await p.locator('#app').getAttribute('data-state')==='title','return to title');
 await p.reload({waitUntil:'networkidle'});check((await p.locator('#overlay').innerText()).includes('BEST r04 '+best+' m'),'BEST restored after reload');
 await tap('header a.arcade-portal-return');await p.waitForURL('**/index.html');check(await p.locator('.game-card').count()===27,'portal return retains all games');
 check(row.errors.length===0,'no JavaScript exceptions');check(row.writes.length===0,'no external writes');row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;await p.screenshot({path:out+'/'+width+'-FAIL.png'}).catch(()=>{});}results.push(row);await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({width,height,pass:row.pass,checks:row.checks.length,failure:row.failure}));await c.close();
}}finally{await browser.close();}if(results.some(r=>!r.pass))process.exitCode=1;
