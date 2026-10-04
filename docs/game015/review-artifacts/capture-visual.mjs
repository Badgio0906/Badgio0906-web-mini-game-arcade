import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out='docs/game015/review-artifacts/visual';await mkdir(out,{recursive:true});
const base='http://127.0.0.1:5181';
for(const device of ['desktop','mobile']){
 const touch=device==='mobile',viewport=touch?{width:390,height:844}:{width:1440,height:900};
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch,deviceScaleFactor:1});
 const page=await context.newPage(),cdp=touch?await context.newCDPSession(page):null;
 const errors=[],records=[],points=new Map();let input=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),snapshot:window.__arcadeDebug.inspection(),focus:document.activeElement?.id}));
 const training=()=>page.evaluate(()=>window.__tutorialDebug.snapshot());
 const native=sel=>page.locator(sel)[touch?'tap':'click']();
 async function until(fn,ms=15000){let start=Date.now();while(!await fn()){if(Date.now()-start>ms)throw Error('Native progression timeout');await page.waitForTimeout(25);}}
 async function point(sel,id){let r=await page.locator(sel).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2,id};}
 async function direction(v,practice=false){
  if(v===input)return;
  if(touch){if(points.has(1)){points.delete(1);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[...points.values()]});}if(v){points.set(1,await point(practice?`[data-practice-action="${v<0?'left':'right'}"]`:`#${v<0?'left':'right'}-button`,1));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});}}
  else{if(input)await page.keyboard.up(input<0?'ArrowLeft':'ArrowRight');if(v)await page.keyboard.down(v<0?'ArrowLeft':'ArrowRight');}input=v;
 }
 async function drop(practice=false){
  if(!touch){await page.keyboard.press('Space');return;}
  points.set(2,await point(practice?'[data-practice-action="action"]':'#drop-button',2));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});let ended=points.get(2);points.delete(2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[ended]});
 }
 async function shot(name){let path=`${out}/${device}-${name}.png`;await page.screenshot({path});records.push({kind:'capture',name,path,...await read()});}
 async function ready(){await until(async()=>{let r=await read();return !r.snapshot.alive||r.snapshot.player.grounded&&r.snapshot.player.stunRemaining===0;});}
 async function oneDrop(){await ready();let before=await read();await drop();await until(async()=>{let r=await read();return !r.snapshot.alive||r.snapshot.player.grounded&&r.snapshot.player.platformId!==before.snapshot.player.platformId;});records.push({kind:'nativeLanding',snapshot:(await read()).snapshot});}
 try{
  await page.goto(`${base}/game015.html`);await page.locator('#play-button').waitFor();await shot('title');
  await native('#play-button');await page.screenshot({path:`${out}/${device}-explanation.png`});await native('#tutorial-practice-button');await page.screenshot({path:`${out}/${device}-practice.png`});
  await drop(true);await until(async()=>(await training()).practice.step===1);await direction(1,true);await drop(true);await page.waitForTimeout(500);await page.screenshot({path:`${out}/${device}-practice-steering.png`});
  await until(async()=>(await training()).practice.step===2);await direction(0,true);await drop(true);await until(async()=>(await training()).practice.step===3);await page.screenshot({path:`${out}/${device}-practice-ghost.png`});await until(async()=>(await training()).phase==='success');await page.screenshot({path:`${out}/${device}-success.png`});records.push({kind:'nativePracticeComplete',practice:await training(),runtime:await read()});
  await native('#tutorial-start-button');await shot('main');
  const geometry=await page.evaluate(()=>{let c=document.querySelector('#fall-canvas');return{canvas:{width:c.width,height:c.height,bounds:c.getBoundingClientRect().toJSON(),imageRendering:getComputedStyle(c).imageRendering,smoothing:c.getContext('2d').imageSmoothingEnabled},controls:['left-button','drop-button','right-button'].map(id=>({id,bounds:document.getElementById(id).getBoundingClientRect().toJSON(),visible:getComputedStyle(document.getElementById(id)).display})),document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}};});records.push({kind:'actualGeometry',...geometry});
  await drop();await page.waitForTimeout(300);await shot('fall-frame1');await page.waitForTimeout(100);await shot('fall-frame2');await ready();for(let i=0;i<5;i++)await oneDrop();await shot('hard-nice');
  await ready();await native('#pause-button');await shot('paused');await native('#resume-button');
  const start=Date.now();while((await read()).snapshot.alive&&Date.now()-start<25000){await direction(1);let r=await read();if(r.snapshot.player.grounded&&r.snapshot.player.stunRemaining===0)await drop();await page.waitForTimeout(35);}await direction(0);
  await until(async()=>(await read()).state==='result');await shot('natural-result');records.push({kind:'actualResultText',text:await page.locator('#overlay').innerText()});
  await native('#retry-button');await native('#pause-button');await native('#title-button');await page.locator('.arcade-portal-back').click();await page.locator('[data-game-id="game015"]').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
  await page.screenshot({path:`${out}/${device}-portal015.png`});const card=page.locator('[data-game-id="game015"]');await card.screenshot({path:`${out}/${device}-portal-card015.png`});records.push({kind:'actualPortal015',text:await card.innerText(),image:await card.locator('img').evaluate(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight}))});
  await card[touch?'tap':'click']();await page.locator('#play-button').waitFor();records.push({kind:'nativePortalLaunch',url:page.url()});
 }catch(e){records.push({kind:'failure',message:String(e)});throw e;}
 finally{try{await direction(0);}catch{}records.push({kind:'diagnostics',errors});await writeFile(`${out}/${device}-VISUAL_RECORD.json`,JSON.stringify({base,viewport,method:'Ordinary native keyboard/mouse/CDP touch, read-only snapshots, no storage/model/clock injection',records},null,2)+'\n');if(cdp)await cdp.detach();await context.close();await browser.close();console.log(`${device}: contexts closed; errors=${errors.length}`);}
}
