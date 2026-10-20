import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4931/', out=process.env.QA_OUT||'test-results/game015-iphone';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.QA_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
const short=process.env.QA_SHORT==='1';
const rows=[],lostOnly=process.env.QA_CASE==='lost';
async function observe(page,label){return page.evaluate(label=>{const snap=window.__arcadeDebug.snapshot();const selectors=['#fall-canvas','.fall-window','.fall-board','#game-canvas','#stage','#app>header','#left-button','#right-button','#drop-button','#analytics-settings-host','#live-status'];return{label,state:document.querySelector('#app').dataset.state,time:snap.time,horizontal:snap.horizontal,drop:snap.heldDrop,alive:snap.alive,selection:getSelection().toString(),viewport:[innerWidth,innerHeight,visualViewport.width,visualViewport.height,visualViewport.scale],rects:Object.fromEntries(selectors.map(s=>[s,document.querySelector(s).getBoundingClientRect().toJSON()]))}},label);}
try { for(const [width,height]of(lostOnly?[[844,390]]:[[844,390],[932,430],[667,375],[390,844],[320,568],[1440,900]])){
 const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:width!==1440});
 await c.addInitScript(()=>{document.addEventListener('pointerdown',e=>{window.__lastQAContact=e.pointerId;},{capture:true});document.addEventListener('gotpointercapture',e=>{window.__QAActiveCapture=e.pointerId;},{capture:true});localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('web-mini-arcade:v1:game015:tutorialCompleted','true');localStorage.setItem('web-mini-arcade:v1:game015:muted','true');});
 const row={width,height,checks:[],holds:[],errors:[],blockedWrites:[]};await c.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method()))row.blockedWrites.push(r.request().url().startsWith(base)?'local':'blocked external');return r.request().url().startsWith(base)?r.continue():r.abort();});
 const p=await c.newPage(),cdp=await c.newCDPSession(p);p.on('pageerror',e=>row.errors.push(e.message));
 const check=(condition,name)=>{row.checks.push({name,pass:!!condition});assert(condition,name);};
 const point=async(selector,id=1)=>{const r=await p.locator(selector).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2,id};};
 const dispatch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 const start=async()=>{await p.goto(base+'game015.html',{waitUntil:'networkidle'});await p.locator('#play-button').tap();};
 try {
  await start();let left=await point('#left-button');await dispatch('touchStart',[left]);check((await observe(p,'down')).horizontal===-1,'native input starts');
  await p.evaluate(()=>{for(const t of ['pointerup','lostpointercapture'])window.addEventListener(t,e=>e.stopImmediatePropagation(),{capture:true,once:true});});
  await dispatch('touchEnd',[]);const lost=await observe(p,'terminal pointer events deliberately intercepted');row.lostTerminal=lost;check(lost.horizontal===0&&!lost.drop,'final native touchend clears input when pointerup and lostcapture are intercepted');
  if(!lostOnly){
   for(const [selector,duration]of[['#left-button',!short&&(width===844||width===667)?3000:250],['#right-button',!short&&(width===844||width===667)?3000:250],...(!short&&width===844?[['#left-button',10000]]:[])]){
    await start();const samples=[await observe(p,'before')],pt=await point(selector);await dispatch('touchStart',[pt]);samples.push(await observe(p,'down'));
    const until=Date.now()+duration;while(Date.now()<until){await p.waitForTimeout(Math.min(120,Math.max(1,until-Date.now())));samples.push(await observe(p,'hold'));}
    await dispatch('touchEnd',[]);samples.push(await observe(p,'up'));await p.waitForTimeout(100);samples.push(await observe(p,'after'));
    const playing=samples.filter(s=>s.state==='playing'),initial=playing[0],same=playing.filter(s=>JSON.stringify(s.viewport)===JSON.stringify(initial.viewport));
    const range=Object.fromEntries(['x','y','width','height'].map(k=>[k,Math.max(...same.map(s=>s.rects['#fall-canvas'][k]))-Math.min(...same.map(s=>s.rects['#fall-canvas'][k]))]));
    check(Object.values(range).every(v=>v<=.02),'stable Canvas during '+selector+' '+duration+'ms');check(samples.at(-1).horizontal===0&&!samples.at(-1).drop,'final release '+duration+'ms');check(samples.every(s=>s.selection===''),'no selected text during native hold');row.holds.push({selector,duration,range,samples});
   }
   await start();left=await point('#left-button');const right=await point('#right-button',2),drop=await point('#drop-button',3);
   await dispatch('touchStart',[left]);await dispatch('touchStart',[left,right]);check((await observe(p,'both')).horizontal===0,'opposite directions neutral');await dispatch('touchEnd',[left]);check((await observe(p,'right remains')).horizontal===1,'remaining direction survives first lift');await dispatch('touchEnd',[]);
   await dispatch('touchStart',[left]);await dispatch('touchStart',[left,drop]);check((await observe(p,'two')).horizontal===-1&&(await observe(p,'two')).drop,'two-thumb direction plus DROP');await dispatch('touchEnd',[left]);check((await observe(p,'drop remains')).horizontal===0&&(await observe(p,'drop remains')).drop,'independent release retains DROP');await dispatch('touchCancel',[]);check(!(await observe(p,'cancel')).drop,'native cancel clears DROP');
   await dispatch('touchStart',[left]);const firstId=await p.evaluate(()=>window.__lastQAContact);const second={...left,x:left.x+10,id:2};await dispatch('touchStart',[left,second]);
   await p.locator('#left-button').evaluate((e,id)=>e.dispatchEvent(new PointerEvent('contextmenu',{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch'})),firstId);
   check((await observe(p,'one interrupted')).horizontal===-1,'known callout pointer preserves same-button second finger');await dispatch('touchEnd',[left]);check((await observe(p,'second remains')).horizontal===-1,'second finger remains after first physical lift');await dispatch('touchEnd',[]);check((await observe(p,'all ended')).horizontal===0,'same-button final release neutral');
   // Sliding remains owned by the starting control until release; outside viewport cancels.
   await dispatch('touchStart',[left]);await dispatch('touchMove',[{...left,x:right.x,y:right.y}]);await p.waitForTimeout(40);check((await observe(p,'cross-control')).horizontal===-1,'slide does not invent a second button press');await dispatch('touchMove',[{...left,x:width+5}]);await p.waitForFunction(()=>window.__arcadeDebug.snapshot().horizontal===0,{},{timeout:1000});check((await observe(p,'outside')).horizontal===0,'outside viewport releases');await dispatch('touchEnd',[]);
   await start();left=await point('#left-button');await dispatch('touchStart',[left]);
   const actualId=await p.evaluate(()=>window.__lastQAContact);await dispatch('touchMove',[{...left,x:left.x+1}]);await p.waitForFunction(id=>window.__QAActiveCapture===id,actualId,{timeout:1000});await p.locator('#left-button').evaluate((e,id)=>e.releasePointerCapture(id),actualId);await dispatch('touchMove',[{...left,x:left.x+2}]);await p.waitForFunction(()=>window.__arcadeDebug.snapshot().horizontal===0,{},{timeout:1000});check((await observe(p,'capture-lost')).horizontal===0,'explicit native capture loss releases');await dispatch('touchEnd',[]);
   await dispatch('touchStart',[left]);
   const prevented=await p.locator('#left-button').evaluate(e=>{const ev=new Event('contextmenu',{bubbles:true,cancelable:true});e.dispatchEvent(ev);return ev.defaultPrevented;});check(prevented&&(await observe(p,'menu')).horizontal===0,'localized synthetic contextmenu interruption releases');await dispatch('touchEnd',[]);
   await dispatch('touchStart',[await point('#drop-button')]);const selected=await p.locator('#drop-button small').evaluate(e=>{const ev=new Event('selectstart',{bubbles:true,cancelable:true});e.dispatchEvent(ev);return ev.defaultPrevented;});check(selected&&!(await observe(p,'selection')).drop,'child selectstart prevented and released');await dispatch('touchEnd',[]);
   await dispatch('touchStart',[left]);await p.setViewportSize({width:height,height:width});await p.waitForTimeout(80);check((await observe(p,'rotated')).horizontal===0,'rotation releases without reusing a contact');await dispatch('touchEnd',[]);await p.setViewportSize({width,height});
   await dispatch('touchStart',[await point('#drop-button')]);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));check((await observe(p,'blur')).state==='paused'&&!(await observe(p,'blur')).drop,'blur pauses and clears');await dispatch('touchEnd',[]);await p.locator('#resume-button').tap();
   await p.locator('#pause-button').tap();await p.locator('.pause-help summary').tap();const normal=await p.locator('.pause-help p').first().evaluate(e=>{const event=new Event('selectstart',{bubbles:true,cancelable:true});e.dispatchEvent(event);return{prevented:event.defaultPrevented,userSelect:getComputedStyle(e).userSelect};});check(!normal.prevented&&normal.userSelect!=='none','ordinary help selection remains enabled');await p.locator('#resume-button').tap();
   await p.locator('#fall-canvas').focus();await p.keyboard.down('ArrowRight');check((await observe(p,'key')).horizontal===1,'PC keyboard direction retained');await p.keyboard.up('ArrowRight');check((await observe(p,'key-up')).horizontal===0,'PC keyboard release retained');
   const css=await p.locator('#drop-button small').evaluate(e=>({select:getComputedStyle(e).userSelect,callout:getComputedStyle(e).getPropertyValue('-webkit-touch-callout'),touch:getComputedStyle(e).touchAction}));check(css.select==='none'&&css.touch==='none','child selection CSS explicitly applied');row.childCSS=css;
  }
  check(row.errors.length===0,'no JavaScript exceptions');row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;await p.screenshot({path:out+'/'+width+'-FAIL.png'});}
 rows.push(row);await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({width,height,pass:row.pass,checks:row.checks.length,failure:row.failure}));await c.close();
}}finally{await browser.close();}if(rows.some(r=>!r.pass))process.exitCode=1;
