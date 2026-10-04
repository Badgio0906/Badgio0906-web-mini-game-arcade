import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// Start only after the parent grants the exclusive browser slot on a frozen candidate.
// Every state read is observational. Native inputs drive all practice and gameplay.
const base=process.env.GAME015_URL??'http://127.0.0.1:5181/';
const reportPath=process.env.GAME015_REPORT??'docs/game015/QA/NATIVE_PROBE.json';
const sizes=[[1920,1080],[1440,900],[390,844],[320,568],[844,390]];
const prefix='web-mini-arcade:v1:game015:';
const records=[];
const remote=!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname);
const proxy=remote?(process.env.HTTPS_PROXY??process.env.HTTP_PROXY):undefined;
export const read=page=>page.evaluate(()=>{const d=window.__arcadeDebug;return{state:d.state(),snapshot:d.snapshot(),inspection:d.inspection(),events:d.telemetry()};});
export const training=page=>page.evaluate(()=>window.__tutorialDebug.snapshot());
export async function until(page,predicate,description,timeout=12000){
  const stop=Date.now()+timeout;let last;
  while(Date.now()<stop){last=await read(page);if(predicate(last))return last;await page.waitForTimeout(30);}
  throw Error(`${description}: ${JSON.stringify(last)}`);
}
export async function nativeButton(page,selector,touch){
  const target=page.locator(selector);await target.waitFor({state:'visible'});
  if(touch)await target.tap();else await target.click();
}
export async function hold(page,selector,key,touch,observe){
  if(!touch){await page.keyboard.down(key);try{return await observe();}finally{await page.keyboard.up(key);} }
  const r=await page.locator(selector).boundingBox();assert.ok(r,'held-touch target');
  const cdp=await page.context().newCDPSession(page);
  try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});return await observe();}
  finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
}
export async function geometry(page,selectors,actions){
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const sample=await page.evaluate(selectors=>({width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
    entries:selectors.map(selector=>{const e=document.querySelector(selector);if(!e)return{selector,missing:true};const b=e.getBoundingClientRect(),s=getComputedStyle(e),clips=[];
      for(let a=e.parentElement;a;a=a.parentElement){const style=getComputedStyle(a),x=['hidden','clip','auto','scroll'].includes(style.overflowX),y=['hidden','clip','auto','scroll'].includes(style.overflowY);if(!x&&!y)continue;
        const r=a.getBoundingClientRect(),sx=a.offsetWidth?r.width/a.offsetWidth:1,sy=a.offsetHeight?r.height/a.offsetHeight:1;clips.push({x,y,left:r.left+a.clientLeft*sx,top:r.top+a.clientTop*sy,right:r.left+(a.clientLeft+a.clientWidth)*sx,bottom:r.top+(a.clientTop+a.clientHeight)*sy,id:a.id});}
      return{selector,missing:false,visible:s.display!=='none'&&!['hidden','collapse'].includes(s.visibility),text:e.textContent,disabled:e.disabled,x:b.x,y:b.y,width:b.width,height:b.height,clips};})}),selectors);
  assert.ok(sample.docWidth<=sample.width+1,'document horizontal overflow');
  if(!await page.locator('dialog[open]').count())assert.ok(sample.docHeight<=sample.height+1,'document vertical overflow');
  for(const e of sample.entries){assert.ok(!e.missing&&e.visible&&e.width>0&&e.height>0,e.selector);assert.ok(e.x>=-1&&e.y>=-1&&e.x+e.width<=sample.width+1&&e.y+e.height<=sample.height+1,`${e.selector} viewport clipping`);
    if(actions.includes(e.selector)){assert.ok(e.width>=43.5&&e.height>=43.5,`${e.selector}44px`);for(const c of e.clips){if(c.x)assert.ok(e.x>=c.left-1&&e.x+e.width<=c.right+1,`${e.selector} clipped x by ${c.id}`);if(c.y)assert.ok(e.y>=c.top-1&&e.y+e.height<=c.bottom+1,`${e.selector} clipped y by ${c.id}`);}}}
  return sample;
}
export async function wallet(page){return page.evaluate(prefix=>{try{return Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith(prefix)).map(k=>[k,localStorage.getItem(k)]));}catch{return{unavailable:true};}},prefix);}

async function titleLayout(browser,size){
  const touch=size[0]<1000,context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(`${m.text()} ${m.location().url??''}`);});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
  try{
    // Stored-zero is an explicit fixture for the disabled CREDIT contract; no run is forced.
    await page.addInitScript(prefix=>localStorage.setItem(prefix+'credits','0'),prefix);
    const response=await page.goto(new URL('game015.html',base).href);assert.equal(response.status(),200);
    await page.locator('#play-button').waitFor({state:'visible'});
    const actions=['#play-button','#tutorial-again-button','#mute-button','.arcade-portal-back'];
    const title=await geometry(page,actions,actions);
    const canvas=await page.locator('#fall-canvas').evaluate(c=>({width:c.width,height:c.height,rendering:getComputedStyle(c).imageRendering,rect:{width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}}));
    assert.equal(canvas.width,256);assert.equal(canvas.height,448);assert.equal(canvas.rendering,'pixelated');
    assert.deepEqual(errors,[]);return{size,touch,title,canvas,errors};
  }finally{await context.close();}
}

async function waitTraining(page,predicate,label,timeout=12000){const stop=Date.now()+timeout;let last;while(Date.now()<stop){last=await training(page);if(predicate(last))return last;await page.waitForTimeout(25);}throw Error(`${label}: ${JSON.stringify(last)}`);}
async function practiceFlow(page,touch,denied=false){
  const before=await read(page),saved=await wallet(page),landings=[];
  await nativeButton(page,'#play-button',touch);assert.equal(await page.locator('#arcade-training').getAttribute('data-phase'),'explanation');
  const explanation=await geometry(page,['#tutorial-practice-button','#tutorial-close-button'],['#tutorial-practice-button','#tutorial-close-button']);
  await nativeButton(page,'#tutorial-practice-button',touch);
  const practiceLayout=await geometry(page,['#tutorial-canvas','[data-practice-action="left"]','[data-practice-action="action"]','[data-practice-action="right"]'],['[data-practice-action="left"]','[data-practice-action="action"]','[data-practice-action="right"]']);
  for(let step=0;step<3;step++){
    await waitTraining(page,s=>s.practice.step===step&&s.practice.fall.phase==='grounded',`practice${step} start`);
    if(step===1){
      await nativeButton(page,'[data-practice-action="action"]',touch);
      const released=await hold(page,'[data-practice-action="right"]','ArrowRight',touch,async()=>{return waitTraining(page,s=>s.practice.fall.phase==='falling'&&s.practice.fall.vx>80&&s.practice.fall.x>=112,'practice right acceleration and useful travel');});
      const landed=await waitTraining(page,s=>s.practice.step===step&&s.practice.fall.phase==='landed','practice right released landing');
      assert.ok(landed.practice.fall.x>released.practice.fall.x,'lesson learns continued drift after release');landings.push({step,released:released.practice.fall,landing:landed.practice.fall});
    }else{await nativeButton(page,'[data-practice-action="action"]',touch);const landed=await waitTraining(page,s=>s.practice.step===step&&s.practice.fall.phase==='landed',`practice${step} actual landing`);landings.push({step,landing:landed.practice.fall});}
    assert.ok(landings.at(-1).landing.grounded&&landings.at(-1).landing.fallDistance<6,'real safe lesson landing');
  }
  const ghost=await waitTraining(page,s=>s.practice.fall.phase==='splat','ghost long fall demonstration');assert.ok(ghost.practice.fall.ghost&&ghost.practice.fall.fallDistance>=9);
  await page.locator('#arcade-training[data-phase="success"]').waitFor({state:'visible'});
  const trained=await read(page),afterSaved=await wallet(page);
  for(const name of ['run_start','run_end','score','credit_used','reward_requested'])assert.equal(trained.events.filter(e=>e.name===name).length,before.events.filter(e=>e.name===name).length,`practice isolated${name}`);
  assert.equal(trained.snapshot.time,before.snapshot.time);assert.equal(trained.snapshot.score,before.snapshot.score);
  assert.equal(afterSaved[prefix+'best'],saved[prefix+'best']);if(denied)assert.equal(afterSaved.unavailable,true);else{assert.equal(afterSaved[prefix+'credits'],'0');assert.notEqual(afterSaved[prefix+'tutorialCompleted'],'true','completion saved only by explicit real-start');}
  await nativeButton(page,'#tutorial-start-button',touch);const started=await until(page,s=>s.state==='playing'&&s.snapshot.alive,'first real run');
  assert.equal(started.events.filter(e=>e.name==='run_start').length,1);if(!denied)assert.equal((await wallet(page))[prefix+'tutorialCompleted'],'true');
  return{explanation,practiceLayout,landings,ghost:ghost.practice.fall,started};
}
async function multiTouchDrop(page){
  const right=await page.locator('#right-button').boundingBox(),drop=await page.locator('#drop-button').boundingBox();assert.ok(right&&drop);
  const first={x:right.x+right.width/2,y:right.y+right.height/2,id:1},second={x:drop.x+drop.width/2,y:drop.y+drop.height/2,id:2};
  await page.evaluate(()=>{window.__qaFallPointers=[];for(const name of ['pointerdown','pointerup','pointercancel'])document.addEventListener(name,e=>window.__qaFallPointers.push({name,id:e.pointerId,type:e.pointerType,primary:e.isPrimary,target:e.target.id}),true);});
  const cdp=await page.context().newCDPSession(page);let remaining,afterDropReleaseEvents;
  try{
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});await until(page,s=>s.snapshot.horizontal===1,'primary steering hold');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});await until(page,s=>s.snapshot.phase==='falling','second-finger DROP');
    // CDP touchEnd identifies the contacts being released, not the still-held ones.
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[second]});remaining=await read(page);afterDropReleaseEvents=await page.evaluate(()=>window.__qaFallPointers);assert.equal(remaining.snapshot.horizontal,1,'lifting DROP preserves primary steering');
  }finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[first]});await cdp.detach();}
  assert.equal((await read(page)).snapshot.horizontal,0,'last touch releases input');
  const events=await page.evaluate(()=>window.__qaFallPointers);assert.ok(events.some(e=>e.name==='pointerdown'&&e.type==='touch'&&e.primary&&e.target==='right-button'));assert.ok(events.some(e=>e.name==='pointerdown'&&e.type==='touch'&&!e.primary&&e.target==='drop-button'));assert.ok(afterDropReleaseEvents.some(e=>e.name==='pointerup'&&e.target==='drop-button'));assert.equal(afterDropReleaseEvents.some(e=>e.name==='pointerup'&&e.target==='right-button'),false,'steering pointer has not been released');return{events,afterDropReleaseEvents,remaining};
}
async function actualFailure(page,touch,denied=false){
  // Position at the edge of the real starting support, then skip the narrow rows.
  // The full-width catch yields a real fatal long landing; no model writes.
  await hold(page,'#left-button','ArrowLeft',touch,()=>until(page,s=>s.snapshot.player.x<61,'edge positioning'));
  await page.waitForTimeout(350);let s=await read(page);
  if(s.snapshot.player.grounded)await nativeButton(page,'#drop-button',touch);
  const stop=Date.now()+15000;let ended;while(Date.now()<stop){const current=await read(page);if(current.state==='result'){ended=current;break;}if(current.state==='playing'&&current.snapshot.player.grounded&&current.snapshot.player.stunRemaining===0)await nativeButton(page,'#drop-button',touch);await page.waitForTimeout(30);}assert.ok(ended,'natural fatal fall must finish');
  assert.equal(ended.snapshot.alive,false);assert.equal(ended.snapshot.lastLanding.kind,'fatal');
  assert.ok(ended.snapshot.lastLanding.fallDistance>=9);assert.equal(ended.events.filter(e=>e.name==='run_end').length,1);
  assert.ok((await page.locator('.death-reason').innerText()).includes('着地衝撃'));
  const displayed=await page.locator('.death-reason').innerText();assert.ok(displayed.includes(ended.snapshot.lastLanding.fallDistance.toFixed(1)),'actual death distance explained');
  assert.equal(ended.events.filter(e=>e.name==='credit_used'||e.name.startsWith('reward_')).length,0);
  if(denied)assert.equal((await wallet(page)).unavailable,true);else assert.equal((await wallet(page))[prefix+'credits'],'0');return ended;
}
async function nativeFlow(browser,size){
  let progress={};
  const touch=size[0]<1000,context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(`${m.text()} ${m.location().url??''}`);});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
  try{
    await page.addInitScript(prefix=>{if(localStorage.getItem(prefix+'credits')===null)localStorage.setItem(prefix+'credits','0');},prefix);
    await page.goto(new URL('game015.html',base).href);await page.locator('#play-button').waitFor({state:'visible'});
    const tutorial=await practiceFlow(page,touch);
    const playing=await geometry(page,['#fall-canvas','#left-button','#drop-button','#right-button','#mute-button','#pause-button'],['#left-button','#drop-button','#right-button','#mute-button','#pause-button']);
    const activeCanvas=playing.entries.find(e=>e.selector==='#fall-canvas');if(size[0]>=1000)assert.ok(activeCanvas.height>=size[1]*.8&&activeCanvas.height<=size[1]*.9,'large desktop effective game height');
    const multiTouch=touch?await multiTouchDrop(page):null;if(!touch)await nativeButton(page,'#drop-button',false);await until(page,s=>s.snapshot.phase==='falling','real DROP');
    await nativeButton(page,'#pause-button',touch);const paused=await until(page,s=>s.state==='paused','pause');assert.equal(paused.snapshot.player.grounded,false,'pause is exercised during actual descent');await page.waitForTimeout(400);const frozen=await read(page);assert.deepEqual(frozen.snapshot,paused.snapshot,'paused physics, camera, platform timers frozen');
    const pausedLayout=await geometry(page,['#resume-button','#title-button'],['#resume-button','#title-button']);
    await nativeButton(page,'#mute-button',touch);const muted=await page.locator('#mute-button').getAttribute('aria-pressed');assert.equal(muted,'true');
    await nativeButton(page,'#resume-button',touch);const beforeInput=await read(page);
    // First native control immediately after RESUME must reach the playing model.
    await hold(page,'#right-button','ArrowRight',touch,()=>until(page,s=>s.snapshot.player.vx>10,'first post-resume horizontal input'));
    const accelerating=await read(page);assert.ok(accelerating.snapshot.player.x>beforeInput.snapshot.player.x);const releaseX=accelerating.snapshot.player.x;await page.waitForTimeout(80);const drifting=await read(page);assert.ok(drifting.snapshot.player.x>releaseX&&drifting.snapshot.player.vx>0,'air drift after release');
    const reverse=await hold(page,'#left-button','ArrowLeft',touch,()=>until(page,s=>s.snapshot.phase==='falling'&&s.snapshot.horizontal===-1&&s.snapshot.player.vx<drifting.snapshot.player.vx*.7,'opposite-input air braking'));assert.ok(reverse.snapshot.player.vx<drifting.snapshot.player.vx);
    const safe=await until(page,s=>s.snapshot.player.grounded,'first actual safe landing');assert.equal(safe.snapshot.lastLanding.kind,'safe');
    await nativeButton(page,'#pause-button',touch);await until(page,s=>s.state==='paused','header pause');await nativeButton(page,'#pause-button',touch);await until(page,s=>s.state==='playing','header resume');
    const headerInput=await hold(page,'#left-button','ArrowLeft',touch,()=>until(page,s=>s.snapshot.player.vx< -5,'first native input after header resume'));assert.equal(headerInput.snapshot.horizontal,-1);
    if(!touch){await nativeButton(page,'#pause-button',false);await nativeButton(page,'#pause-button',false);await page.keyboard.down('s');try{await until(page,s=>s.snapshot.phase==='falling','S from focused header resume');await until(page,s=>s.snapshot.player.grounded,'S real landing');await page.keyboard.down('s');await page.waitForTimeout(100);assert.equal((await read(page)).snapshot.player.grounded,true,'held/repeated S is not a queued future DROP');}finally{await page.keyboard.up('s');}}
    await nativeButton(page,'#mute-button',touch);assert.equal(await page.locator('#mute-button').getAttribute('aria-pressed'),'false');
    await hold(page,'#right-button','d',touch,()=>until(page,s=>s.snapshot.player.vx>5,'first D/native-right after mute'));
    const beforeNativeSpace=await read(page);if(!touch)await page.keyboard.press('Space');else await nativeButton(page,'#mute-button',true);
    assert.equal(await page.locator('#mute-button').getAttribute('aria-pressed'),'true','focused mute Space/tap toggles sound');assert.equal((await read(page)).snapshot.player.grounded,true,'focused mute Space does not DROP');assert.equal((await read(page)).events.filter(e=>e.name==='run_start').length,beforeNativeSpace.events.filter(e=>e.name==='run_start').length);
    if(!touch){await page.keyboard.press('ArrowDown');await until(page,s=>s.snapshot.phase==='falling','ArrowDown from focused mute');await until(page,s=>s.snapshot.player.grounded,'ArrowDown real landing');}
    const ended=await actualFailure(page,touch);
    const resultLayout=await geometry(page,['#result-score','.death-reason','#retry-button','#title-button'],['#retry-button','#title-button']);
    await page.screenshot({path:reportPath.replace(/\.json$/,'')+`-${size.join('x')}-result.png`});
    const best=ended.snapshot.score;assert.equal(Number((await wallet(page))[prefix+'best']),best);
    await nativeButton(page,'#retry-button',touch);const retry=await until(page,s=>s.state==='playing'&&s.snapshot.alive,'retry');assert.equal(retry.snapshot.score,0);assert.equal(retry.snapshot.niceDrops,0);assert.equal(retry.events.filter(e=>e.name==='run_start').length,2);
    await page.reload();await page.locator('#play-button').waitFor({state:'visible'});assert.equal(Number(await page.locator('#best-value').innerText()),best);assert.equal(await page.locator('#mute-button').getAttribute('aria-pressed'),muted);
    await nativeButton(page,'#play-button',touch);await until(page,s=>s.state==='playing','completed tutorial immediate play');assert.equal(await page.locator('#arcade-training').isVisible(),false);
    progress={size,touch,tutorial,playing,multiTouch,pausedLayout,headerInput,ended,resultLayout,retry};
    await nativeButton(page,'.arcade-portal-back',touch);await page.locator('.game-card').first().waitFor({state:'visible'});assert.equal(await page.locator('.game-card').count(),15);await page.waitForLoadState('networkidle');
    assert.deepEqual(errors,[]);return{size,touch,tutorial,playing,multiTouch,pausedLayout,headerInput,ended,resultLayout,retry,errors};
  }catch(error){const file=reportPath.replace(/\.json$/,'')+`-${size.join('x')}-FAIL-${Date.now()}`;await page.screenshot({path:file+'.png'}).catch(()=>{});const diagnostic=await read(page).catch(()=>null);await writeFile(file+'.json',JSON.stringify({size,message:error.message,progress,diagnostic,errors},null,2));throw error;}finally{await context.close();}
}
async function storageDenied(browser){
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(`${m.text()} ${m.location().url??''}`);});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
  try{
    await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Storage denied by QA browser policy','SecurityError');}}));
    await page.goto(new URL('game015.html',base).href);await page.locator('#play-button').waitFor({state:'visible'});
    const tutorial=await practiceFlow(page,false,true),ended=await actualFailure(page,false,true);assert.ok(ended.snapshot.score>0);assert.equal(Number(await page.locator('#best-value').innerText()),ended.snapshot.score);
    await nativeButton(page,'#retry-button',false);await until(page,s=>s.state==='playing'&&s.snapshot.alive,'memory fallback retry');assert.equal(Number(await page.locator('#best-value').innerText()),ended.snapshot.score);
    await page.reload();await page.locator('#play-button').waitFor({state:'visible'});await nativeButton(page,'#play-button',false);assert.equal(await page.locator('#arcade-training').getAttribute('data-phase'),'explanation','denied storage cannot persist completion across reload');
    assert.deepEqual(errors,[]);return{scenario:'storage-denied',tutorial,ended,scope:'Real initial practice and natural failure/retry with session memory; reload intentionally needs practice again because storage is inaccessible',errors};
  }finally{await context.close();}
}
async function main(){
  let failure=null;const mode=process.env.GAME015_PROBE_MODE??'native';assert.ok(['title-layout','native'].includes(mode));
  await mkdir(dirname(reportPath),{recursive:true});
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],...(proxy?{proxy:{server:proxy}}:{})});
  try{for(const size of sizes){const record=mode==='native'?await nativeFlow(browser,size):await titleLayout(browser,size);records.push({scenario:mode,...record});console.log(`${size.join('x')}: ${mode} PASS`);}if(mode==='native'){records.push(await storageDenied(browser));console.log('storage denied: real practice/landing/retry memory fallback PASS');}}
  catch(error){failure={message:error.message,stack:error.stack};throw error;}finally{await browser.close();await writeFile(reportPath,JSON.stringify({checkedUtc:new Date().toISOString(),base,mode,failure,records},null,2)+'\n');}
}
if(import.meta.url===new URL(`file://${process.argv[1]}`).href)await main();
