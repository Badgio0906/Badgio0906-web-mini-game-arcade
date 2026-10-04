import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base=process.env.REVIEW_BASE_URL;if(!base)throw Error('Explicitly released frozen candidate required.');
const device=process.argv[2]??'desktop',touch=device==='mobile',viewport=touch?{width:390,height:844}:{width:1440,height:900};
const out='docs/game015/review-artifacts';await mkdir(out,{recursive:true});await mkdir('docs/game015/QA',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1}),page=await context.newPage();
const cdp=touch?await context.newCDPSession(page):null,points=new Map();let input=0;
const records=[{kind:'candidate',base,device,viewport,readonlyOracle:true,nativeInputs:true,noSeedOrMutation:true,humanSkillEvidence:false}],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),s:window.__arcadeDebug.inspection(),focus:document.activeElement?.id,status:document.querySelector('#live-status')?.textContent}));
const training=()=>page.evaluate(()=>window.__tutorialDebug.snapshot());
const native=selector=>page.locator(selector)[touch?'tap':'click']();
async function until(fn,budget=15000){const began=Date.now();while(!await fn()){if(Date.now()-began>budget)throw Error('Normal progression timeout');await page.waitForTimeout(25);}}
async function point(selector,id){const r=await page.locator(selector).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2,id};}
async function direction(value,practice=false){
 if(value===input)return;
 if(touch){if(points.has(1)){points.delete(1);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[...points.values()]});}if(value){points.set(1,await point(practice?`[data-practice-action="${value<0?'left':'right'}"]`:`#${value<0?'left':'right'}-button`,1));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});}}
 else{if(input)await page.keyboard.up(input<0?'ArrowLeft':'ArrowRight');if(value)await page.keyboard.down(value<0?'ArrowLeft':'ArrowRight');}input=value;
}
async function drop(practice=false){
 const selector=practice?'[data-practice-action="action"]':'#drop-button';
 if(!touch){await page.keyboard.press('Space');return;}
 points.set(2,await point(selector,2));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});const ended=points.get(2);points.delete(2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[ended]});
}
async function shot(name){const path=`${out}/${device}-${name}.png`;await page.screenshot({path});records.push({kind:'capture',name,path,...await read()});}
async function ready(){await until(async()=>{const r=await read();return !r.s.alive||r.s.player.grounded&&r.s.player.stunRemaining===0;});}
async function oneDrop(){await ready();const before=await read();await drop();await until(async()=>{const r=await read();return !r.s.alive||r.s.player.grounded&&r.s.player.platformId!==before.s.player.platformId;});records.push({kind:'actualLanding',before,after:await read()});}
try{
 await page.goto(`${base}/game015.html`);await shot('title');await native('#play-button');await page.screenshot({path:`${out}/${device}-explanation.png`});await native('#tutorial-practice-button');
 records.push({kind:'practiceStart',training:await training()});await page.screenshot({path:`${out}/${device}-practice-step1.png`});await drop(true);
 await until(async()=>(await training()).practice.step===1);await direction(1,true);await drop(true);await page.waitForTimeout(500);records.push({kind:'nativePracticeAirSteering',training:await training()});await page.screenshot({path:`${out}/${device}-practice-step2-air.png`});
 await until(async()=>(await training()).practice.step===2);await direction(0,true);await drop(true);await until(async()=>(await training()).practice.step===3);await page.screenshot({path:`${out}/${device}-practice-ghost.png`});await until(async()=>(await training()).phase==='success');records.push({kind:'practiceComplete',training:await training(),runtime:await read()});await native('#tutorial-start-button');await shot('fresh-main');
 if(!touch){
  await native('#pause-button');await native('#pause-button');const before=await read();await direction(1);await page.waitForTimeout(150);const after=await read();records.push({kind:'repairedHeaderResumeArrow',before,after});if(after.s.horizontal!==1||after.s.player.x<=before.s.player.x)throw Error('Header resume still blocks native Arrow');await direction(0);
  await native('#mute-button');await direction(-1);await page.waitForTimeout(100);const muteAfter=await read();records.push({kind:'repairedMuteArrow',after:muteAfter});if(muteAfter.s.horizontal!==-1)throw Error('Mute focus blocks native Arrow');await direction(0);await native('#mute-button');
  await native('#pause-button');await native('#title-button');await native('#play-button');
 }
 // First broad landing, with a real falling canvas frame exported for thumbnail.
 if(!touch)await page.keyboard.down('Space');else await drop();
 await page.waitForTimeout(570);const frame=await page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),canvas:document.querySelector('#fall-canvas').toDataURL('image/png'),dimensions:{width:document.querySelector('#fall-canvas').width,height:document.querySelector('#fall-canvas').height}}));
 if(frame.inspection.phase!=='falling')throw Error('Requested actual falling thumbnail frame not in flight');
 if(!touch){await writeFile('docs/game015/QA/game015-actual-fall.png',Buffer.from(frame.canvas.split(',')[1],'base64'));const{canvas,...metadata}=frame;await writeFile('docs/game015/QA/game015-actual-fall.json',JSON.stringify({method:'Unmodified actual browser-rendered native canvas export after normal DROP',viewport,...metadata},null,2)+'\n');}
 await shot('actual-fall');await page.waitForTimeout(650);if(!touch)await page.keyboard.up('Space');await ready();const firstLanding=await read();records.push({kind:'firstSafeHeldDrop',...firstLanding});if(firstLanding.s.depth>4||firstLanding.s.lastLanding?.kind!=='safe')throw Error('Held DROP queued an unintended extra departure');
 // Neutral early authored bend deliberately skips one row: genuine8.6m HARD/NICE.
 for(let i=0;i<5;i++)await oneDrop();const hard=await read();records.push({kind:'earnedEarlyHardNice',...hard});if(hard.s.lastLanding?.kind!=='hard'||!hard.s.lastLanding.nice)throw Error('Expected actual early-bend HARD/NICE landing');await shot('earned-hard-nice');await ready();
 await drop();await direction(1);await page.waitForTimeout(180);const held=await read();await direction(0);await page.waitForTimeout(100);const released=await read();await direction(-1);await page.waitForTimeout(200);const reversed=await read();await direction(0);records.push({kind:'actualInertia',held,released,reversed});
 if(!(held.s.player.vx>0&&released.s.player.vx>0&&released.s.player.x>held.s.player.x&&reversed.s.player.vx<released.s.player.vx))throw Error('Native acceleration/release/braking not observed');await ready();await shot('after-native-inertia');
 await native('#pause-button');const pausedBefore=await read();await page.waitForTimeout(450);const pausedAfter=await read();records.push({kind:'nativePause',pausedBefore,pausedAfter});if(pausedBefore.s.time!==pausedAfter.s.time)throw Error('Paused physics clock advanced');await shot('paused');await native('#resume-button');
 if(!touch){
  const began=Date.now(),seen=new Set(),landed=new Set();let target=null,groundAt=0,loggedMilestone=false;
  while(Date.now()-began<600000){
   const r=await read(),s=r.s;if(!s.alive)throw Error('Native safe-route oracle failed before1000m');
   const band=s.depth>=1000?1000:s.depth>=600?600:s.depth>=500?500:s.depth>=300?300:s.depth>=100?100:0;
   if(band&&!seen.has(band)){seen.add(band);await direction(0);await shot(`earned-depth-${band}`);}
   if(s.milestones.includes(1000)&&!loggedMilestone){loggedMilestone=true;records.push({kind:'actual1000Live',...r});}
   if(s.depth>1010){records.push({kind:'actualContinuation',wallMs:Date.now()-began,...r});break;}
   if(s.player.grounded){
    await direction(0);
    if(!landed.has(s.player.platformId)){landed.add(s.player.platformId);groundAt=s.time;records.push({kind:'nativeSafeRouteLanding',landing:s.lastLanding,depth:s.depth,time:s.time});}
    if(s.player.stunRemaining===0&&s.time-groundAt>=.20){
     target=s.platforms.filter(p=>!p.gone&&p.route&&p.y>s.player.y+.01).sort((a,b)=>a.y-b.y)[0];if(!target)throw Error('No visible/available next safe route');
     await drop();
    }
   }else if(target){
    const p=s.platforms.find(p=>p.id===target.id)??target;const aim=Math.max(p.x+16,Math.min(p.x+p.width-16,s.player.x));
    // Near-edge aim with actual velocity feedback; no simulated state/time.
    const desired=Math.max(-85,Math.min(85,(aim-s.player.x)*4));const value=s.player.vx<desired-5?1:s.player.vx>desired+5?-1:0;await direction(value);
   }
   await page.waitForTimeout(30);
  }
  await direction(0);if(!loggedMilestone)throw Error('No genuinely earned live1000m continuation observed');
 }
 // Deliberately use wall-side route with ordinary steering and DROP until a
 // real overlong normal-platform impact. No force-end API or course injection.
 const fatalBegan=Date.now();while((await read()).s.alive&&Date.now()-fatalBegan<20000){await direction(1);const r=await read();if(r.s.player.grounded&&r.s.player.stunRemaining===0)await drop();await page.waitForTimeout(35);}await direction(0);
 await until(async()=>(await read()).state==='result');await shot('natural-fatal-result');records.push({kind:'actualFatalResult',text:await page.locator('#overlay').innerText(),...await read()});
 const result=await read();if(result.s.lastLanding?.kind!=='fatal'||!result.status)throw Error('Natural fatal landing not recorded');const began=Date.now();await native('#retry-button');await until(async()=>(await read()).state==='playing');records.push({kind:'nativeRetry',wallMs:Date.now()-began,...await read()});await native('#pause-button');await native('#title-button');await page.reload();records.push({kind:'bestReload',...await read()});await page.locator('.arcade-portal-back').click();records.push({kind:'nativePortalReturn',url:page.url(),knownThumbnailIntegrationPending:true});
}catch(error){records.push({kind:'reviewFailure',message:String(error),...await read()});throw error;}
finally{await direction(0);records.push({kind:'diagnostics',errors});await writeFile(`${out}/${device}-FEEL_RECORD.json`,JSON.stringify(records,null,2)+'\n');if(cdp)await cdp.detach();await context.close();await browser.close();}
