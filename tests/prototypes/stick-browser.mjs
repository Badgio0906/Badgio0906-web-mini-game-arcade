import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const out = 'docs/prototypes/stick-balance/QA';
const report = {kind:'Native keyboard/CDP touch, virtual clock; technical evidence, not human feel',runs:[]};
for (const [name,width,height] of [['desktop',1366,900],['phone',390,844]]) {
 const page = await browser.newPage({viewport:{width,height},isMobile:name==='phone',hasTouch:name==='phone'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const epoch = new Date('2026-10-06T00:00:00Z');
 await page.clock.install({time:epoch});await page.goto('http://localhost:5173/prototype-stick.html');await page.clock.pauseAt(new Date(epoch.getTime()+10000));
 await page.click('#start');
 let key='',stage=-1;const samples=[];const extra=new Set();
 // Feedback selects a direction every100ms; no setters or state injection.
 for(let i=0;i<560;i++) {
  const s=await page.evaluate(()=>window.__stick);
  if(s.over) throw new Error(`${name} controller failed at ${s.time}`);
  const direction=await page.evaluate(async()=>{const {step}=await import('/src/prototypes/stick-balance/model.ts');const candidates=[-1,0,1].map(input=>{const s={...window.__stick};for(let i=0;i<12;i++)step(s,input);return {input,cost:(s.angle+.8*s.omega)**2+.0002*s.v*s.v};});candidates.sort((a,b)=>a.cost-b.cost);return candidates[0].input;});
  const next=direction===0?'':direction>0?'ArrowRight':'ArrowLeft';
  if(next!==key){if(key)await page.keyboard.up(key);if(next)await page.keyboard.down(next);key=next;}
  await page.clock.runFor(100);
  for(const [label,at] of [['warning',10.5],['shortening',13.2]])if(s.time>=at&&!extra.has(label)){await page.screenshot({path:`${out}/${name}-${label}.png`});extra.add(label);}
  if(s.stage!==stage && s.time>(s.stage?12*s.stage+2.5:0)) {
   stage=s.stage;await page.screenshot({path:`${out}/${name}-stage-${stage+1}.png`});samples.push(s);
  }
 }
 if(key)await page.keyboard.up(key);
 const before=await page.evaluate(()=>window.__stick.time);await page.click('#pause');await page.clock.runFor(5000);
 assert.equal(await page.evaluate(()=>window.__stick.time),before);
 await page.screenshot({path:`${out}/${name}-paused.png`});
 await page.click('#start');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.clock.runFor(2000);
 assert.equal(await page.evaluate(()=>window.__stick.mode),'paused');
 await page.click('#start');await page.setViewportSize({width:width-10,height});await page.clock.runFor(1000);
 assert.equal(await page.evaluate(()=>window.__stick.mode),'paused');await page.click('#start');
 // No-input loss, score freeze, three independent retries.
 await page.clock.runFor(12000);assert.equal(await page.evaluate(()=>window.__stick.mode),'over');
 await page.screenshot({path:`${out}/${name}-fall.png`});
 for(let i=0;i<3;i++) {await page.click('#start');const s=await page.evaluate(()=>window.__stick);assert.ok(s.time<.2);assert.equal(s.input,0);await page.clock.runFor(5000);assert.equal(await page.evaluate(()=>window.__stick.mode),'over');}
 if(name==='phone') {
  await page.click('#start');
  const session=await page.context().newCDPSession(page);
  const box=await page.locator('#right').boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
  const oldX=await page.evaluate(()=>window.__stick.x);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.clock.runFor(160);
  assert.equal(await page.evaluate(()=>window.__stick.input),1);
  assert.ok(await page.evaluate(()=>window.__stick.x)>oldX);
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-120,y:y-160}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(50);
  assert.equal(await page.evaluate(()=>window.__stick.input),0);assert.equal(await page.evaluate(()=>scrollY),0);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await page.evaluate(()=>window.__stick.input),0);
 }
 assert.deepEqual(errors,[]);report.runs.push({name,samples,errors,pause:true,blur:true,resize:true,retries:3,touch:name==='phone'});await page.close();
}
await browser.close();writeFileSync(`${out}/BROWSER.json`,JSON.stringify(report,null,2));console.log('PASS native inputs, 5 stages, pause/blur/resize, loss/retry, touch capture/cancel');
