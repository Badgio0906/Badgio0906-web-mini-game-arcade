import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4942/',out=process.env.QA_OUT||'test-results/game015-portrait-compiled';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.QA_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
const rows=[];
try{for(const [width,height] of [[390,844],[375,667],[320,568],[844,390],[932,430],[667,375],[1440,900]]){
  if(process.env.QA_WIDTH&&width!==Number(process.env.QA_WIDTH))continue;
  const mobile=width!==1440,c=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  await c.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('web-mini-arcade:v1:game015:tutorialCompleted','true');localStorage.setItem('web-mini-arcade:v1:game015:muted','true');});
  const row={width,height,checks:[],errors:[],writes:[],rects:[]};
  await c.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method()))row.writes.push('blocked write');return r.request().url().startsWith(base)?r.continue():r.abort();});
  const p=await c.newPage(),cdp=await c.newCDPSession(p);p.on('pageerror',e=>row.errors.push(e.message));
  const check=(v,name)=>{row.checks.push({name,pass:!!v});assert(v,name);};
  const tap=s=>mobile?p.locator(s).tap():p.locator(s).click();
  const fit=()=>p.evaluate(()=>{const c=document.querySelector('#fall-canvas'),r=c.getBoundingClientRect();return{canvas:r.toJSON(),padding:getComputedStyle(document.body).padding,overflow:[document.documentElement.scrollWidth-innerWidth,document.documentElement.scrollHeight-innerHeight],viewport:[innerWidth,innerHeight],buttons:[...document.querySelectorAll('.fall-controls button')].map(b=>b.getBoundingClientRect().toJSON())};});
  try{
    await p.goto(base+'game015.html',{waitUntil:'networkidle'});
    check(await p.evaluate(()=>!window.__arcadeDebug&&!window.__tutorialDebug),'no DEV diagnostic hooks in build');
    if(mobile&&width>height){
      check(await p.locator('#portrait-notice').isVisible(),'compiled landscape gate');
      await p.screenshot({path:`${out}/${width}x${height}-notice.png`});
      await p.setViewportSize({width:height,height:width});
    }
    await tap('#play-button');
    check(await p.locator('#app').getAttribute('data-state')==='playing','compiled start');
    const before=await fit();row.rects.push(before);
    check(before.overflow.every(x=>x<=1),'compiled play has no document overflow');
    check(before.buttons.every(b=>b.width>=44&&b.height>=44&&b.bottom<=p.viewportSize().height),'compiled buttons fit');
    await p.screenshot({path:`${out}/${width}x${height}-playing.png`});
    if(mobile){
      const box=await p.locator('#drop-button').boundingBox();const pt={x:box.x+box.width/2,y:box.y+box.height/2,id:1};
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});
      check(await p.locator('#drop-button').getAttribute('data-held')==='true','compiled DROP held feedback');
      const v=p.viewportSize();await p.setViewportSize({width:v.height,height:v.width});await p.waitForTimeout(80);
      check(await p.locator('#app').getAttribute('data-state')==='paused'&&await p.locator('#portrait-notice').isVisible(),'compiled rotation pauses');
      check(await p.locator('#drop-button').getAttribute('data-held')==='false','compiled rotation clears input');
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.setViewportSize(v);await p.waitForTimeout(80);
      check(await p.locator('#app').getAttribute('data-state')==='paused','compiled portrait remains paused');await tap('#resume-button');
      if(width===390){
        await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:20,bottom:34,left:0,right:0}});await p.waitForTimeout(80);
        row.safeArea=await fit();check(row.safeArea.padding==='20px 0px 34px','safe area insets applied');check(row.safeArea.overflow.every(x=>x<=1)&&row.safeArea.buttons.every(b=>b.bottom<=810),'safe area controls remain visible');
        await p.screenshot({path:`${out}/390x844-safearea-playing.png`});
        await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:0,bottom:0,left:0,right:0}});
        for(const h of [620,760,844]){await p.setViewportSize({width:390,height:h});await p.waitForTimeout(60);const r=await fit();row.rects.push(r);check(r.overflow.every(x=>x<=1)&&r.buttons.every(b=>b.bottom<=h),'dynamic portrait height '+h);}
      }
    }
    await tap('#pause-button');await tap('#title-button');
    if(width===390){
      await p.locator('#tutorial-again-button').tap();await p.locator('#tutorial-close-button').tap();
      await p.setViewportSize({width:844,height:390});
      await p.locator('#portrait-notice a').tap();await p.waitForURL('**/index.html');
      check(await p.locator('.game-card').count()===28,'notice back link reaches portal');
      for(const id of ['game005','game016']){
        await p.goto(base+id+'.html',{waitUntil:'networkidle'});
        check(await p.locator('#portrait-notice').count()===0,'no portrait gate in '+id);
        await p.locator('#play-button').tap();check(await p.locator('#app').getAttribute('data-state')==='playing','other game starts '+id);
        if(id==='game005'){
          await p.locator('#pause-button').tap();await p.locator('#title-button').tap();await p.locator('#tutorial-again-button').tap();
          check(await p.locator('#tutorial-canvas').isVisible(),'other game practice remains available');await p.locator('#tutorial-close-button').tap();
        }
      }
    }
    check(row.errors.length===0,'compiled no JavaScript exceptions');check(row.writes.length===0,'compiled no external writes');row.pass=true;
  }catch(e){row.pass=false;row.failure=e.message;await p.screenshot({path:`${out}/${width}x${height}-FAIL.png`}).catch(()=>{});}
  rows.push(row);await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({width,height,pass:row.pass,checks:row.checks.length,failure:row.failure}));await c.close();
}}finally{await browser.close();}
if(rows.some(r=>!r.pass))process.exitCode=1;
