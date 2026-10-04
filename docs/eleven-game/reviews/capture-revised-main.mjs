import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Exclusive frozen-runtime reviewer slot only. Normal native input plus readonly
// inspection; no controller calls, seeded state, simulated time, or DOM overrides.
const base=process.env.REVIEW_BASE_URL;if(!base)throw Error('An explicitly released frozen REVIEW_BASE_URL is required.');
const device=process.argv[2]??'desktop',game=process.argv[3];if(!['game007','game008','game010'].includes(game))throw Error('Choose game007/game008/game010');
const touch=device==='mobile',viewport=touch?{width:390,height:844}:{width:1440,height:900};
const out=`docs/eleven-game/screenshots/${game}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1}),page=await context.newPage();
const errors=[],records=[{kind:'candidate',base,device,game,viewport,nativeInput:true,readonlyOracle:true,humanFunOrSkillEvidence:false}];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),hud:[...document.querySelectorAll('.load-readout,.weight-projection,.party-current,.unload-note,.balance-readout,.in-game-distance,.cup-meter,.boss-caption,.attention-label')].map(e=>({class:e.className,text:e.textContent,dataset:{...e.dataset}}))}));
const native=selector=>page.locator(selector)[touch?'tap':'click']();
const training=()=>page.evaluate(()=>window.__tutorialDebug.snapshot());
async function until(fn,timeout=12000){const began=Date.now();while(!(await fn())){if(Date.now()-began>timeout)throw Error('Native progression timeout');await page.waitForTimeout(35);}}
async function shot(name){const path=`${out}/independent-${device}-${name}.png`;await page.screenshot({path});records.push({kind:'capture',name,path,...await read()});}
async function held(selector,key,ms){
  if(!touch){await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);return;}
  const r=await page.locator(selector).boundingBox(),cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await page.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
async function begin(){
  await page.goto(`${base}/${game}.html`);await native('#play-button');await native('#tutorial-practice-button');
  if(game==='game007'){await native('[data-practice-action="board"]');await until(async()=>{const s=await training();return s.practice.step===1&&s.practice.phase==='practice';});await native('[data-practice-action="reject"]');}
  if(game==='game008'){await held('[data-practice-action="right"]','ArrowRight',900);}
  if(game==='game010'){await native('[data-practice-action="action"]');await until(async()=>(await training()).practice.practicePoints>=19);await native('[data-practice-action="action"]');}
  await until(async()=>(await training()).phase==='success');await native('#tutorial-start-button');await until(async()=>(await read()).state==='playing');
}
let heldKey=0;
async function balance(direction){
  if(touch){if(direction)await native(direction<0?'#left-button':'#right-button');return;}
  if(direction===heldKey)return;if(heldKey)await page.keyboard.up(heldKey<0?'ArrowLeft':'ArrowRight');if(direction)await page.keyboard.down(direction<0?'ArrowLeft':'ArrowRight');heldKey=direction;
}
try{
  await begin();await shot('fresh-main');
  if(game==='game007'){
    for(let floor=1;floor<=3;floor++){
      await until(async()=>{const s=(await read()).inspection;return s.floor===floor&&s.phase==='boarding';});
      if(floor===2)await shot('actual-65-plus90');
      const before=await read();if(touch)await native('#right-button');else await page.keyboard.press('ArrowRight');records.push({kind:'ordinaryBoard',before,after:await read()});
    }
    await until(async()=>{const s=(await read()).inspection;return s.floor===4&&s.phase==='boarding';});await shot('actual-unload65-and-overload185');
    const before=await read();if(touch)await native('#right-button');else await page.keyboard.press('ArrowRight');await page.waitForTimeout(70);await shot('actual-overload-warning');records.push({kind:'naturalOverload',before,after:await read()});
  }
  if(game==='game008'){
    const neutral=await read();await held('#left-button','ArrowLeft',650);const leftInput=await read();await shot('actual-liquid-after-left');await held('#right-button','ArrowRight',650);const rightInput=await read();await shot('actual-liquid-after-right');records.push({kind:'actualOppositeCorrections',neutral,leftInput,rightInput,instantMonotonicCenteringClaim:false});
    if(touch){await held('#right-button','ArrowRight',20000);}
    else{
      const began=Date.now(),seen=new Set();let choices=0;
      while(Date.now()-began<200000){
        const o=await read(),s=o.inspection;if(!s.alive)break;
        if(o.state==='milestone'){await balance(0);choices++;await shot(choices===1?'earned500-choice':'earned1000-choice');const before=await read();await native('#accept-button');records.push({kind:'ordinaryCupChoice',before,after:await read()});continue;}
        if(s.cupCount>1&&!seen.has(s.cupCount)){seen.add(s.cupCount);await balance(0);await page.waitForTimeout(300);await shot(`earned${s.cupCount}-cups`);records.push({kind:'actualPerCupLiquid',...await read()});}
        const trainNeutral=s.preview?.type==='train'&&s.preview.onsetTime-s.time<.5||s.activeEvent?.type==='train'&&s.time-s.activeEvent.onsetTime<.4;
        const direction=s.distance>1030?1:trainNeutral?0:Math.abs(s.bodyLean)>.025||Math.abs(s.bodyVelocity)>.035?Math.sign(-s.bodyLean*4-s.bodyVelocity*2):0;
        await balance(direction);await page.waitForTimeout(45);
      }
      await balance(0);records.push({kind:'ordinaryFeedbackRouteEnd',choices,...await read()});if(choices!==2)throw Error('Two genuinely earned extra-cup choices were not reached');
    }
  }
  if(game==='game010'){
    const seen=new Set();await page.waitForTimeout(250);await shot('actual-listen-foreground');if(touch)await native('#toggle-button');else await page.keyboard.press('Space');await page.waitForTimeout(350);await shot('actual-work-foreground');
    const began=Date.now();let fail=false;
    while(Date.now()-began<35000){
      const o=await read(),s=o.inspection;if(!s.alive)break;
      const wanted=fail?'work':s.phase==='answer'||s.phase==='cue'&&s.currentCue?.kind==='question'?'listen':'work';
      if(s.mode!==wanted){if(touch)await native('#toggle-button');else await page.keyboard.press('Space');records.push({kind:'ordinaryAttentionToggle',before:o,wanted,after:await read()});}
      if(s.phase==='cue'&&!seen.has(s.currentCue.kind)){seen.add(s.currentCue.kind);await shot(`actual-${s.currentCue.kind}-foreground-cue`);}
      if(seen.size===2&&s.phase==='talk')fail=true;
      await page.waitForTimeout(40);
    }
    records.push({kind:'actualCueKinds',seen:[...seen]});if(seen.size!==2)throw Error('Actual question and feint not both observed');
  }
  await until(async()=>(await read()).state==='result',30000);await shot('natural-result');records.push({kind:'naturalResult',text:await page.locator('#overlay').innerText(),...await read()});
  const began=Date.now();await native('#retry-button');await until(async()=>(await read()).state==='playing');records.push({kind:'ordinaryUnlimitedRetry',wallMs:Date.now()-began,training:await training(),...await read()});
}catch(error){records.push({kind:'harnessFailure',message:String(error),...await read()});throw error;}
finally{if(heldKey)await page.keyboard.up(heldKey<0?'ArrowLeft':'ArrowRight');records.push({kind:'finalDiagnostics',errors,events:await page.evaluate(()=>window.__arcadeDebug?.telemetry())});await writeFile(`${out}/independent-${device}-MAIN_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
