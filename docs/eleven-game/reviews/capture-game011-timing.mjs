import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Read-only question oracle + normal native inputs demonstrate reachability;
// this is not human recognition, memory, reaction-time, or fun evidence.
const base=process.env.REVIEW_BASE_URL;
if(!base)throw Error('Set the explicitly released frozen REVIEW_BASE_URL.');
const device=process.argv[2]??'desktop',touch=device==='mobile';
const viewport=touch?{width:390,height:844}:{width:1440,height:900};
const out='docs/eleven-game/screenshots/game011';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
const page=await context.newPage(),errors=[],records=[{kind:'candidate',base,device,viewport,readonlyOracle:true,nativeInput:true,humanRecognitionEvidence:false}];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),loading:document.querySelector('.unko-board')?.dataset.loading,active:document.activeElement?.id}));
const native=selector=>page.locator(selector)[touch?'tap':'click']();
async function holdNative(selector){
  if(!touch){await page.locator(selector).focus();await page.keyboard.down('Space');return async()=>page.keyboard.up('Space');}
  const r=await page.locator(selector).boundingBox();const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});
  return async()=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();};
}
async function waitPhase(phase){await page.waitForFunction(phase=>window.__arcadeDebug.inspection().phase===phase,phase);}
async function shot(name){const path=`${out}/independent-${device}-${name}.png`;await page.screenshot({path});records.push({kind:'capture',name,path,...await read()});}
async function answer({opposite=false,pointer=false}={}){
  const before=await read();let side=before.inspection.answerSide;if(!side)throw Error('Question has no readonly answer side');
  if(opposite)side=side==='left'?'right':'left';
  if(pointer||touch)await native(`#${side}-button`);else await page.keyboard.press(side==='left'?'ArrowLeft':'ArrowRight');
  const after=await read();records.push({kind:'ordinaryAnswer',before,side,opposite,input:pointer||touch?'native button':'native arrow',after});
  if(!opposite){const points=before.inspection.question.kind==='image'?100:before.inspection.question.kind==='text'?150:250;if(after.inspection.score!==before.inspection.score+points)throw Error('Correct native answer did not advance the real score');}
  else if(after.inspection.phase!=='ended')throw Error('Natural wrong answer did not end the run');
}
try{
  await page.goto(`${base}/game011.html`);await native('#play-button');await native('#tutorial-practice-button');await native('[data-practice-action="unko"]');await native('#tutorial-start-button');
  await page.waitForFunction(()=>document.querySelector('.unko-board')?.dataset.loading==='false'&&window.__arcadeDebug.inspection().alive);
  await page.evaluate(()=>{
    window.__independentInputEvents=[];
    for(const type of ['keydown','keyup','pointerdown','pointerup','click'])document.addEventListener(type,e=>{window.__independentInputEvents.push({type,time:performance.now(),key:e.key,code:e.code,pointerType:e.pointerType,target:e.target.id,phase:window.__arcadeDebug.inspection().phase,round:window.__arcadeDebug.inspection().roundId});},{capture:true});
  });
  await shot('first-image');records.push({kind:'firstImageDeadline',...await read()});
  await answer({pointer:true});await waitPhase('speed_warning');await shot('speed-warning');
  // Space on PC / Chromium held touch on phone: release begins the next clock.
  const continueRelease=await holdNative('#continue-button');const holdStart=await read();await page.waitForTimeout(1050);const holdEnd=await read();
  records.push({kind:'continueHeldBeforeRelease',input:touch?'native held touch emulation':'native held Space',holdStart,holdEnd});await continueRelease();await waitPhase('image_answer');
  for(let i=2;i<=10;i++){
    const current=await read();if(current.inspection.deadline!==1)throw Error('Image2–10 actual deadline must be1s');
    if(i===2)await shot('one-second-image');
    // Q2 pointer answer retains focus while Q3 remains in the same visible grid;
    // Q3 Arrow therefore tests the actual focused-answer mixed-input path.
    await answer({pointer:touch||i===2});
  }
  await waitPhase('text_intro');await shot('text-intro');await native('#continue-button');await waitPhase('text_read');await shot('untimed-text-read');
  const readyRelease=await holdNative('#ready-button');const readyDown=await read();await page.waitForTimeout(1200);const readyStillHeld=await read();
  records.push({kind:'readyHeldGuard',readyDown,readyStillHeld});
  if(readyStillHeld.inspection.phase!=='text_read'||readyStillHeld.inspection.choices!==null)throw Error('Held READY revealed timed choices before release');
  await readyRelease();await waitPhase('text_answer');const released=await read();records.push({kind:'readyReleased',input:touch?'native held touch emulation':'native held Space',...released});
  if(released.inspection.deadline!==.8)throw Error('Text deadline must be real0.8s');await answer({pointer:touch});
  for(let i=2;i<=10;i++){
    await waitPhase('text_read');const before=await read();await page.waitForTimeout(i===2?900:80);const after=await read();records.push({kind:'untimedRead',before,after});
    await native('#ready-button');await waitPhase('text_answer');if((await read()).inspection.deadline!==.8)throw Error('Text deadline mismatch');await answer({pointer:touch});
  }
  await waitPhase('final_choice');await shot('earned-final-choice');const frozenBefore=await read();await page.waitForTimeout(800);const frozenAfter=await read();records.push({kind:'untimedFinalChoice',frozenBefore,frozenAfter});
  await native(touch?'#ukon-mode-button':'#unko-mode-button');await waitPhase('final_answer');
  // Freeze only through the normal visible PAUSE control for a legible image;
  // a screenshot RPC is not a human0.5s response measurement.
  await native('#pause-button');const finalPauseBefore=await read();await page.waitForTimeout(650);await shot('half-second-final-paused');const finalPauseAfter=await read();records.push({kind:'nativeHalfSecondPause',finalPauseBefore,finalPauseAfter});await native('#resume-button');
  for(let i=1;i<=5;i++){
    const before=await read();if(before.inspection.deadline!==.5)throw Error('Final deadline must be real0.5s');
    await answer({pointer:touch});
  }
  // Let a genuine half-second deadline expire, rather than forcing Game Over.
  await page.waitForFunction(()=>window.__arcadeDebug.state()==='result');await shot('earned-final-timeout-result');records.push({kind:'earnedTerminal',text:await page.locator('.result-ticket').innerText(),...await read()});
  const terminal=await read();if(terminal.inspection.imageCorrect!==10||terminal.inspection.textCorrect!==10||terminal.inspection.finalStreak!==5||terminal.inspection.score!==3750)throw Error('Expected ten images/ten texts/five genuinely earned final answers');
  const began=Date.now();await native('#retry-button');await page.waitForFunction(()=>window.__arcadeDebug.inspection().phase==='image_answer'&&window.__arcadeDebug.inspection().alive);records.push({kind:'nativeRetryReset',wallMs:Date.now()-began,...await read()});
  await answer({opposite:true,pointer:touch});await page.waitForFunction(()=>window.__arcadeDebug.state()==='result');await shot('earned-wrong-result');
  records.push({kind:'earnedWrong',text:await page.locator('.result-ticket').innerText(),...await read()});
}catch(error){records.push({kind:'harnessFailure',message:String(error),...await read()});throw error;}
finally{
  records.push({kind:'finalDiagnostics',errors,events:await page.evaluate(()=>window.__arcadeDebug?.telemetry()),nativeEventTimeline:await page.evaluate(()=>window.__independentInputEvents??[])});
  await writeFile(`${out}/independent-${device}-TIMING_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();
}
