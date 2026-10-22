import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.env.QA_BASE||'http://127.0.0.1:4941/';
const out=process.env.QA_OUT||'test-results/game015-portrait';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.QA_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
const rows=[];
const cases=process.env.QA_CASE==='red'?[[390,844,true]]:[[390,844,true],[375,667,true],[320,568,true],[844,390,true],[932,430,true],[667,375,true],[1440,900,false],[844,390,false],[1024,768,true]];
try { for(const [width,height,mobile] of cases){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('web-mini-arcade:v1:game015:tutorialCompleted','true');localStorage.setItem('web-mini-arcade:v1:game015:muted','true');});
  const row={width,height,mobile,checks:[],errors:[],writes:[],rects:[]};
  await context.route('**/*',r=>{if(!['GET','HEAD'].includes(r.request().method()))row.writes.push(r.request().url().startsWith(base)?'local':'external');return r.request().url().startsWith(base)?r.continue():r.abort();});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  page.on('pageerror',e=>row.errors.push(e.message));
  const check=(value,name)=>{row.checks.push({name,pass:!!value});assert(value,name);};
  const snap=()=>page.evaluate(()=>window.__arcadeDebug.snapshot());
  const counts=()=>page.evaluate(()=>Object.fromEntries(['run_start','run_end','best_update','practice_start','tutorial_start','practice_complete'].map(name=>[name,window.__arcadeDebug.telemetry().filter(e=>e.name===name).length])));
  const best=()=>page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game015:bestR04'));
  const state=()=>page.locator('#app').getAttribute('data-state');
  const tap=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
  const point=async(selector,id=1)=>{const r=await page.locator(selector).boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2,id};};
  const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  const rect=()=>page.evaluate(()=>{const c=document.querySelector('#fall-canvas'),r=c.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,internal:[c.width,c.height],viewport:[innerWidth,innerHeight,visualViewport.width,visualViewport.height],overflow:[document.documentElement.scrollWidth-innerWidth,document.documentElement.scrollHeight-innerHeight],buttons:[...document.querySelectorAll('.fall-controls button')].map(b=>({id:b.id,...b.getBoundingClientRect().toJSON()})),selection:getSelection().toString()};});
  try {
    await page.goto(base+'game015.html',{waitUntil:'networkidle'});
    const blocked=mobile&&width>height&&width<=1000&&height<=600;
    if(blocked){
      check(await page.locator('#portrait-notice').isVisible(),'landscape notice initially visible');
      check((await page.locator('#portrait-notice').innerText()).includes('落下キングは縦画面専用です'),'exact portrait message');
      check(await page.locator('#app').evaluate(e=>e.inert),'game inert in landscape');
      await page.screenshot({path:`${out}/${width}x${height}-notice.png`});
      await page.setViewportSize({width:height,height:width});
    }
    await tap('#play-button');check(await state()==='playing','normal play starts');
    row.rects.push(await rect());
    const initialRect=row.rects[0];
    check(initialRect.internal.join(',')==='256,448'&&Math.abs(initialRect.width/initialRect.height-4/7)<.001,'4:7 and internal resolution retained');
    check(initialRect.overflow.every(v=>v<=1),'playing fits viewport without document scrolling');
    check(initialRect.buttons.every(b=>b.width>=44&&b.height>=44&&b.x>=0&&b.y>=0&&b.right<=page.viewportSize().width&&b.bottom<=page.viewportSize().height),'all controls visible and tappable');
    if(process.env.QA_CASE==='red'){
      await page.setViewportSize({width:844,height:390});
      await page.waitForTimeout(80);
      check(await state()==='paused','rotation automatically pauses');
      check(await page.locator('#portrait-notice').isVisible(),'rotation notice visible');
      row.pass=true;
    } else {
      await page.screenshot({path:`${out}/${width}x${height}-playing.png`});
      if(mobile){
        const left=await point('#left-button'),drop=await point('#drop-button',2);
        await touch('touchStart',[left,drop]);
        check((await snap()).horizontal===-1&&(await snap()).heldDrop,'left and DROP held');
        row.rects.push(await rect());
        check(['x','y','width','height'].every(k=>Math.abs(row.rects[0][k]-row.rects[1][k])<=.02),'held input does not change Canvas dimensions');
        check(row.rects[1].selection==='','no text selection during native touch');
        await touch('touchEnd',[]);
        check((await snap()).horizontal===0&&!(await snap()).heldDrop,'last touch neutral');
        const portrait=page.viewportSize();
        if(portrait.width<portrait.height){
          const beforeEvents=await counts(),beforeBest=await best();
          await touch('touchStart',[await point('#drop-button')]);
          await page.setViewportSize({width:portrait.height,height:portrait.width});
          await page.waitForFunction(()=>document.querySelector('#portrait-notice')&&!document.querySelector('#portrait-notice').hidden);
          const frozen=await snap();row.frozen=frozen;
          check(await state()==='paused','rotation automatically pauses');
          check(frozen.horizontal===0&&!frozen.heldDrop,'rotation clears held inputs');
          await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
          await page.waitForTimeout(700);
          check(JSON.stringify(await snap())===JSON.stringify(frozen),'entire run frozen while landscape');
          check(JSON.stringify(await counts())===JSON.stringify(beforeEvents)&&await best()===beforeBest,'rotation creates no run/end/BEST writes');
          await tap('#analytics-settings-host #settings');
          check(await page.getByRole('button',{name:'許可しない',exact:true}).isVisible(),'analytics settings accessible behind portrait notice');
          await page.getByRole('button',{name:'許可しない',exact:true}).click();
          check((await page.locator('#analytics-settings-host a[part="privacy-link"]').getAttribute('href')).endsWith('privacy.html'),'privacy link retained');
          await touch('touchEnd',[]);
          await page.setViewportSize(portrait);await page.waitForTimeout(120);
          check(await state()==='paused','portrait return stays paused');
          check(JSON.stringify(await snap())===JSON.stringify(frozen),'portrait return preserves run');
          await page.screenshot({path:`${out}/${width}x${height}-returned-paused.png`});
          await tap('#resume-button');check(await state()==='playing','explicit resume only');
          check((await counts()).run_start===beforeEvents.run_start,'resume does not duplicate play count');
        }
      }else{
        check(await page.locator('#portrait-notice').isHidden(),'fine pointer PC exempt');
        await page.keyboard.down('ArrowRight');check((await snap()).horizontal===1,'PC keyboard works');await page.keyboard.up('ArrowRight');
      }
      if(!mobile||Math.max(width,height)>1000)await tap('#pause-button');
      else if(await state()==='playing')await tap('#pause-button');
      await tap('#title-button');
      await tap('#tutorial-explain-button');
      check(await page.locator('#arcade-training').isVisible(),'instructions reachable');
      if(mobile&&Math.max(width,height)<=1000){
        const portrait=page.viewportSize();await page.setViewportSize({width:portrait.height,height:portrait.width});await page.waitForTimeout(80);
        check(await page.locator('#portrait-notice').isVisible(),'notice replaces modal instructions');
        await page.setViewportSize(portrait);await page.waitForTimeout(80);
        check(await page.locator('#arcade-training').isVisible(),'instructions restored');
      }
      await tap('#tutorial-close-button');await tap('#tutorial-again-button');
      if(mobile&&Math.max(width,height)<=1000){
        const portrait=page.viewportSize();const practice=await page.evaluate(()=>window.__tutorialDebug.snapshot().practice);
        await page.setViewportSize({width:portrait.height,height:portrait.width});await page.waitForTimeout(500);
        const held=await page.evaluate(()=>window.__tutorialDebug.snapshot().practice);
        check(held.step===practice.step,'practice step preserved');
        await page.waitForTimeout(300);
        check(JSON.stringify(await page.evaluate(()=>window.__tutorialDebug.snapshot().practice))===JSON.stringify(held),'practice clock and world frozen in landscape');
        await page.setViewportSize(portrait);await page.waitForTimeout(80);
        const pausedPractice=await page.evaluate(()=>window.__tutorialDebug.snapshot().practice);
        await page.waitForTimeout(300);
        check(JSON.stringify(await page.evaluate(()=>window.__tutorialDebug.snapshot().practice))===JSON.stringify(pausedPractice),'practice awaits explicit resume');
        await tap('#tutorial-resume-button');
        check(await page.locator('#tutorial-resume-button').count()===0,'practice resumes with fresh button');
      }
      await tap('#tutorial-close-button');
      await tap('#play-button');
      if(width===390&&height===844){
        await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='ending',{},{timeout:20000});
        await page.setViewportSize({width:844,height:390});await page.waitForTimeout(50);
        check(await state()==='ending','ending transition suspended');
        const ending=await snap(),endingCounts=await counts(),endingBest=await best();
        await page.waitForTimeout(700);
        check(await state()==='ending'&&JSON.stringify(await snap())===JSON.stringify(ending),'ending clock and timer remain frozen');
        await page.setViewportSize({width:390,height:844});
        await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='result');
        check(JSON.stringify(await counts())===JSON.stringify(endingCounts)&&await best()===endingBest,'ending rotation does not repeat record completion');
      }else await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',{},{timeout:20000});
      const score=await page.locator('#result-score').innerText(),resultBest=await best(),resultEvents=await counts();
      check(Number(resultBest)>=Number(score.replace(/[^0-9.]/g,'')),'natural result and BEST consistent');
      if(mobile&&Math.max(width,height)<=1000){
        const portrait=page.viewportSize();await page.setViewportSize({width:portrait.height,height:portrait.width});await page.waitForTimeout(80);await page.setViewportSize(portrait);await page.waitForTimeout(80);
        check(await state()==='result'&&await page.locator('#result-score').innerText()===score&&await best()===resultBest,'result survives rotation');
        check(JSON.stringify(await counts())===JSON.stringify(resultEvents),'result rotation adds no run or completion events');
      }
      await page.screenshot({path:`${out}/${width}x${height}-result.png`,fullPage:true});
      check(row.errors.length===0,'no JavaScript exceptions');check(row.writes.length===0,'no external writes');
      row.pass=true;
    }
  }catch(e){row.pass=false;row.failure=e.message;await page.screenshot({path:`${out}/${width}x${height}-FAIL.png`}).catch(()=>{});}
  rows.push(row);await fs.writeFile(out+'/results.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({width,height,mobile,pass:row.pass,checks:row.checks.length,failure:row.failure}));await context.close();
}}finally{await browser.close();}
if(rows.some(r=>!r.pass))process.exitCode=1;
