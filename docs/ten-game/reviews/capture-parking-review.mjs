import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const device=process.argv[2]??'desktop'; if(!['desktop','mobile'].includes(device))throw Error('Choose desktop or mobile');
const feedbackOnly=process.argv[3]==='feedback';const fileDevice=feedbackOnly?`${device}-feedback-recheck`:device;
const touch=device==='mobile',viewport=touch?{width:390,height:844}:{width:1920,height:1080};
const baseUrl=process.env.REVIEW_BASE_URL??'http://127.0.0.1:5176',out='docs/ten-game/screenshots/game006';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});const page=await context.newPage();
const records=[{type:'runtime',baseUrl,snapshot:'/workspace/scratch/ten006-frozen',device,viewport}];const errors=[];page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>({browserAt:performance.now(),state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),credit:document.querySelector('#credit-count').textContent}));
let actionPoint;const button=async id=>page.locator(`#${id}`)[touch?'tap':'click']();const act=async()=>{if(!touch)return page.keyboard.press('Space');return page.touchscreen.tap(actionPoint.x,actionPoint.y);};
const shot=async name=>{const path=`${out}/${fileDevice}-${name}.png`;await page.screenshot({path});records.push({type:'capture',name,path,...await read()});};
// A read-only geometric oracle derives an arc from the visible slot/start poses.
// No expected-answer hook, model mutation, time acceleration or human skill claim.
const target=s=>{const a=s.layout.start,b=s.layout.slot,turn=b.rotation-a.rotation,chord=Math.hypot(b.x-a.x,b.y-a.y);const k=Math.abs(turn)<1e-7?0:2*Math.sin(turn/2)/chord;const distance=k===0?chord:turn/k;return{degrees:Math.atan(k*110)*180/Math.PI,power:(distance-120)/220,distance};};
const angleSoon=s=>-38*Math.cos((s.phaseTime+(touch?.025:.008))*2*Math.PI/Math.max(18,24-s.parked*.2));
const powerSoon=s=>(1-Math.cos((s.phaseTime+(touch?.025:.008))*2*Math.PI/Math.max(7,9-s.parked*.08)))/2;
const started=Date.now(),shots=new Set();let lastParked=0,choice=false,pauseProof=false;let drivingProof=false;
try{
 await page.goto(`${baseUrl}/game006.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(400);await shot('title');await page.evaluate(()=>{const records=[];for(const type of['pointerdown','pointerup','click'])document.addEventListener(type,event=>{if(event.target.closest?.('#action-button')){const s=window.__arcadeDebug.snapshot();records.push({type,at:performance.now(),gameTime:s.time,phase:s.phase,steering:s.steeringDegrees,power:s.power});}},true);window.__feelInputObservations=()=>structuredClone(records);});await button('play-button');if(touch){const b=await page.locator('#action-button').boundingBox();actionPoint={x:b.x+b.width/2,y:b.y+b.height/2};}
 while(Date.now()-started<360000){
  const o=await read(),s=o.inspection;if(!s.alive)break;
  if(s.parked!==lastParked){records.push({type:'parkAccepted',...o});lastParked=s.parked;console.log(JSON.stringify({device,parked:s.parked,score:s.score,gameTime:s.time,mode:s.mode}));}
  if(o.state==='milestone'){
   if(choice)throw Error('Repeated10parking offer');choice=true;await shot('10cars-choice');const before=await read();
   if(touch){const b=await page.locator('#stage').boundingBox();await page.touchscreen.tap(b.x+b.width*.02,b.y+b.height*.95);}else await page.keyboard.press('Space');
   await page.waitForTimeout(1100);const after=await read();records.push({type:'choiceFreeze',before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection)});
   await button('forbidden-button');records.push({type:'choiceAccepted',before,...await read()});await shot('forbidden-first');continue;
  }
  if(!feedbackOnly&&s.parked===0&&s.phase==='angle'&&s.phaseTime>2&&!shots.has('opening')){shots.add('opening');await shot('first-angle');}
  if(!feedbackOnly&&s.phase==='power'&&s.parked===0&&!shots.has('power')){shots.add('power');await shot('first-power');}
  if(!feedbackOnly&&s.phase==='driving'&&s.parked===0&&!drivingProof){drivingProof=true;const before=await read();if(touch){const b=await page.locator('#stage').boundingBox();await page.touchscreen.tap(b.x+b.width*.02,b.y+b.height*.95);}else await act();await page.waitForTimeout(160);await shot('first-driving');records.push({type:'ignoredDuringDriving',before,after:await read()});}
  if(!feedbackOnly&&s.phase==='parked'&&s.parked===1&&!shots.has('park-feedback')){shots.add('park-feedback');await shot('first-park-feedback');}
  if(!feedbackOnly&&s.phase==='driving'&&s.layout.templateId!=='straight'&&!shots.has('curved-motion')){shots.add('curved-motion');const before=await read();await shot('angled-drive-1');await page.waitForTimeout(230);await shot('angled-drive-2');records.push({type:'actualCurvedMotion',before,after:await read()});}
  if(!feedbackOnly&&s.parked>=1&&s.phase==='angle'&&!pauseProof){pauseProof=true;await button('pause-button');const before=await read();await page.waitForTimeout(650);const after=await read();await button('resume-button');records.push({type:'pauseFreeze',before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection),resumed:await read()});await shot('gameplay');continue;}
  if(s.mode==='forbidden'&&s.parked>=11&&s.phase==='angle'&&!shots.has('forbidden-earned')){shots.add('forbidden-earned');await shot('forbidden-earned');}
  const t=target(s);const intentionalFailure=touch?s.parked>=2&&(!feedbackOnly||s.layout.templateId!=='straight'):s.parked>=12;
  if(touch&&(s.phase==='angle'||s.phase==='power'&&!intentionalFailure)){
   // Browser RAF observes fresh readiness; only a small signal crosses IPC.
   // The subsequent input still uses the native touchscreen, never DOM dispatch.
   const ready=await page.evaluate(({phase,targetDegrees,targetPower})=>new Promise(resolve=>{
    const started=performance.now();let prior;
    function poll(){const s=window.__arcadeDebug.snapshot();if(!s.alive||s.phase!==phase||performance.now()-started>30000){resolve(null);return;}
     const value=phase==='angle'?s.steeringDegrees:s.power;const increasing=prior===undefined||value>=prior;prior=value;
     const speed=phase==='angle'?38*2*Math.PI/Math.max(18,24-s.parked*.2)*Math.sqrt(Math.max(0,1-(value/38)**2)):2*Math.PI/Math.max(7,9-s.parked*.08)*Math.sqrt(Math.max(0,value*(1-value)));
     const wanted=phase==='angle'?targetDegrees:targetPower;const predicted=value+speed*.025;
     if(increasing&&Math.abs(predicted-wanted)<(phase==='angle'?.3:.008)){resolve({at:performance.now(),time:s.time,phase,value,predicted,wanted});return;}
     requestAnimationFrame(poll);
    }requestAnimationFrame(poll);
   }),{phase:s.phase,targetDegrees:t.degrees,targetPower:t.power});
   if(!ready)throw Error('Minimal native readiness timed out or phase changed');records.push({type:'nativeMinimalReadiness',target:t,...ready});await act();continue;
  }
  if(s.phase==='angle'){
   const wanted=t.degrees+(intentionalFailure&&!touch?(t.degrees>=0?-11:11):0);
   if(Math.abs(angleSoon(s)-wanted)<(touch?.35:.28)){records.push({type:'nativeAngle',time:s.time,parked:s.parked,target:t,steering:s.steeringDegrees,intentionalFailure});await act();}
  }else if(s.phase==='power'){
   if(intentionalFailure&&touch||Math.abs(powerSoon(s)-t.power)<.008){records.push({type:'nativePower',time:s.time,parked:s.parked,target:t,power:s.power,intentionalFailure});await act();}
  }
  await page.waitForTimeout(10);
 }
 const final=await read();if(final.inspection.alive||(!touch&&!choice)||final.inspection.parked<(touch?2:12))throw Error('Required natural parking flow was not completed');
 await page.locator('#retry-button').waitFor();await page.waitForTimeout(350);await shot('result');records.push({type:'earnedResult',feedbackOnly,text:await page.locator('.result-ticket').innerText(),wallMs:Date.now()-started,...await read()});
 const retryAt=Date.now();await button('retry-button');await page.waitForFunction(()=>window.__arcadeDebug.state()==='playing');records.push({type:'retryReset',wallMs:Date.now()-retryAt,...await read()});await shot('retry-reset');
 if(touch&&!feedbackOnly){
  for(let n=0;n<2;n++){await act();await act();await page.waitForFunction(()=>window.__arcadeDebug.state()==='result');await page.waitForTimeout(380);records.push({type:'additionalNaturalFailure',...await read()});if(n===0)await button('retry-button');}
  await shot('no-credit');await button('reward-button');await shot('reward-pending');await page.waitForFunction(()=>window.__arcadeDebug.state()==='title');await shot('refilled');
 }
 records.push({type:'inputObservations',events:await page.evaluate(()=>window.__feelInputObservations())});
 records.push({type:'finalEvents',events:await page.evaluate(()=>window.__arcadeDebug.telemetry()),errors,normalInputOnly:true,readonlyOracle:true,humanSkillEvidence:false});
}catch(error){records.push({type:'captureError',message:String(error),inputObservations:await page.evaluate(()=>window.__feelInputObservations?.()??[]),...await read()});throw error;}
finally{await writeFile(`${out}/${fileDevice}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
console.log(JSON.stringify({device,wallMs:Date.now()-started,errors}));
