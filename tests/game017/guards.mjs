import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/game017/QA';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
const selected = (process.env.GAME017_GUARD_CASES || 'mouse,practice,memory').split(',');
const read = page => page.evaluate(() => ({ state: window.__arcadeDebug.state(), snapshot: window.__arcadeDebug.snapshot(), inspection: window.__arcadeDebug.inspection(), events: window.__arcadeDebug.telemetry() }));
async function until(page, predicate, label) { for(let i=0;i<500;i++){const r=await read(page);if(predicate(r))return r;await page.waitForTimeout(20);}throw Error(label); }
async function stable(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function point(page, p) { await stable(page); return page.evaluate(p => {const c=document.getElementById('rain-canvas'),b=c.getBoundingClientRect(),scale=Math.min(b.width/c.width,b.height/c.height);return {x:b.x+(b.width-c.width*scale)/2+(58+.884*p.x)*scale,y:b.y+(b.height-c.height*scale)/2+(116+p.z*(c.height-212)/600)*scale};},p); }
async function draw(page, path, touch) {
 const pts=[];for(const p of path)pts.push(await point(page,p));
 if(touch){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...pts[0],id:4}]});for(const p of pts.slice(1))await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:4}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
 else{await page.mouse.move(pts[0].x,pts[0].y);await page.mouse.down();for(const p of pts.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();}
}
async function open({touch=false,denied=false,complete=true}={}) {
 const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1440,height:900},hasTouch:touch,isMobile:touch});
 await context.addInitScript(({denied,complete})=>{if(denied)Object.defineProperty(window,'localStorage',{get(){throw new DOMException('QA storage denied','SecurityError');}});else{localStorage.setItem('web-mini-arcade:v1:game017:credits','0');if(complete)localStorage.setItem('web-mini-arcade:v1:game017:tutorialCompleted','true');}},{denied,complete});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5181/game017.html');await stable(page);
 await page.evaluate(()=>{window.__qa017Journal=[];for(const type of ['pointerdown','pointerup','click','lostpointercapture','touchstart','touchend','touchcancel','mousedown','mouseup'])document.addEventListener(type,e=>window.__qa017Journal.push({type,id:e.pointerId,isPrimary:e.isPrimary,target:e.target.id,state:window.__arcadeDebug.state(),phase:window.__arcadeDebug.snapshot().phase,time:performance.now(),trusted:e.isTrusted,prevented:e.defaultPrevented,x:e.clientX,y:e.clientY}),true);});
 return {context,page,errors,button:async id=>touch?page.locator(id).tap():page.locator(id).click()};
}
try{
 // Held pointer across camera phases; disconnected start; erasing/pause preserve deadline.
 if(selected.includes('mouse')) {
 const {context,page,errors,button}=await open();
 try{
  await page.locator('#play-button').click({button:'right'});assert.equal((await read(page)).state,'title');await page.keyboard.press('Escape');
  await page.locator('#play-button').click({modifiers:['Control']});assert.equal((await read(page)).state,'title');
  await page.locator('#play-button').dblclick();
  assert.equal((await read(page)).events.filter(e=>e.name==='run_start').length,1);
  const stage=await page.locator('#rain-canvas').boundingBox();
  await page.mouse.click(stage.x+20,stage.y+20);assert.equal((await read(page)).snapshot.phase,'warning');
  await until(page,r=>r.snapshot.phase==='rain','rain');await page.mouse.move(stage.x+100,stage.y+100);await page.mouse.down();
  await until(page,r=>r.snapshot.phase==='plan','plan');const goal=await point(page,{x:930,z:300});
  await page.mouse.move(goal.x,goal.y);await page.mouse.up();assert.equal((await read(page)).snapshot.route.length,1,'held activation cannot draw');
  await draw(page,[{x:500,z:200},{x:930,z:300}],false);assert.equal((await read(page)).snapshot.route.length,1,'far start rejected');
  const route=(await read(page)).inspection.safeRoute;
  await draw(page,route.slice(0,4),false);assert.ok((await read(page)).snapshot.route.length>1);
  const beforeErase=(await read(page)).snapshot.remaining;await button('#erase-button');const erased=await read(page);
  assert.equal(erased.snapshot.route.length,1);assert.ok(erased.snapshot.remaining<=beforeErase);assert.ok(erased.snapshot.remaining>beforeErase-.3);
  await draw(page,route.slice(0,4),false);await button('#pause-button');const frozen=await read(page);await page.waitForTimeout(150);
  assert.deepEqual((await read(page)).snapshot,frozen.snapshot);await button('#resume-button');
  await stable(page);await draw(page,route.slice(3),false);await until(page,r=>r.snapshot.phase==='clear','continued route clear');
  await until(page,r=>r.snapshot.round===2&&r.snapshot.phase==='rain','round 2');await button('#accelerate-button');await until(page,r=>r.snapshot.phase==='plan','second plan');
  // Explicit browser lifecycle fixture exercises actual listeners, never the model.
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await read(page)).state,'paused');await button('#resume-button');
  await until(page,r=>r.state==='result','uncompleted timeout');const end=await read(page);assert.equal(end.snapshot.result.reason,'unfinished');
  assert.equal(end.events.filter(e=>e.name==='run_end').length,1);await button('#retry-button');assert.equal((await read(page)).snapshot.round,1);
  await button('#pause-button');await button('#title-button');assert.equal((await read(page)).events.filter(e=>e.name==='run_end').length,2);
  assert.deepEqual(errors,[]);records.push({case:'native-mouse-phase-route-deadline-quit-guards',status:'PASS',end,errors});
 }finally{await context.close();}
 // Touch practice collision retries at the same planning step, never spends/starts a RUN.
 }
 if(selected.includes('practice')) {
 const touch=await open({touch:true,complete:false});
 try{
  await touch.button('#play-button');await touch.button('#tutorial-practice-button');await until(touch.page,r=>r.snapshot.phase==='rain','practice rain');await touch.button('#accelerate-button');await until(touch.page,r=>r.snapshot.phase==='plan','practice plan');
  await draw(touch.page,[{x:70,z:300},{x:500,z:300},{x:930,z:300}],true);const fail=await until(touch.page,r=>r.state==='practice-failure','practice failure');
  assert.equal(fail.snapshot.result.reason,'rain');assert.equal(fail.snapshot.score,0);assert.ok(!fail.events.some(e=>['run_start','run_end','credit_used','score'].includes(e.name)));
  await touch.button('#practice-retry-button');const retry=await until(touch.page,r=>r.state==='practice' && r.snapshot.phase==='plan','practice retry click');assert.equal(retry.snapshot.phase,'plan');assert.ok(retry.snapshot.remaining>4.8);
  await draw(touch.page,retry.inspection.safeRoute,true);await until(touch.page,r=>r.state==='practice-complete','practice recovery');assert.deepEqual(touch.errors,[]);
  records.push({case:'native-touch-practice-collision-same-step-recovery',status:'PASS',fail,retry,errors:touch.errors});
 }catch(e){records.push({case:'practice-failure-diagnostic',error:String(e),stack:e.stack,last:await read(touch.page),journal:await touch.page.evaluate(()=>window.__qa017Journal)});await touch.page.screenshot({path:out+'/GUARD_PRACTICE_FAILURE.png'});throw e;}finally{await touch.context.close();}
 }
 // Game integration with the existing storage-denied memory fallback.
 if(selected.includes('memory')) {
 const memory=await open({denied:true,complete:false});
 try{
  await memory.button('#play-button');await memory.button('#tutorial-practice-button');await until(memory.page,r=>r.snapshot.phase==='rain','memory practice');await memory.button('#accelerate-button');await until(memory.page,r=>r.snapshot.phase==='plan','memory plan');await draw(memory.page,(await read(memory.page)).inspection.safeRoute,false);await until(memory.page,r=>r.state==='practice-complete','memory practice clear');
  await memory.button('#tutorial-start-button');await until(memory.page,r=>r.snapshot.phase==='rain','memory main');await memory.button('#accelerate-button');await until(memory.page,r=>r.snapshot.phase==='plan','memory main plan');await draw(memory.page,(await read(memory.page)).inspection.safeRoute,false);
  await until(memory.page,r=>r.snapshot.phase==='clear','memory clear');await until(memory.page,r=>r.state==='result','memory missed next acceleration');
  assert.ok(Number(await memory.page.locator('#best-value').textContent())>=1000);await memory.button('#retry-button');assert.equal((await read(memory.page)).state,'playing');
  assert.ok(Number(await memory.page.locator('#best-value').textContent())>=1000);await memory.page.reload();assert.equal(await memory.page.locator('#best-value').textContent(),'0');await memory.button('#play-button');await memory.page.locator('#tutorial-practice-button').waitFor();
  assert.deepEqual(memory.errors,[]);records.push({case:'storage-denied-memory-best-retry-and-reload',status:'PASS',errors:memory.errors});
 }finally{await memory.context.close();}
 }
}catch(error){records.push({status:'FAIL',error:String(error)});process.exitCode=1;}
finally{await browser.close();await mkdir(out,{recursive:true});await writeFile(out+'/INPUT_LIFECYCLE_GUARDS.json',JSON.stringify({records,forcedModelWrites:false,lifecycleFixture:'synthetic window blur exercises listener; not physical focus or human Feel proof',nativeInput:'mouse and CDP touch; read-only route oracle'},null,2)+'\n');}
console.log(records.map(r=>r.case+' '+r.status).join('\n'));
