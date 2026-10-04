import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const device=process.argv[2]??'desktop';if(!['desktop','mobile'].includes(device))throw Error('Choose desktop or mobile');
const touch=device==='mobile';const viewport=touch?{width:390,height:844}:{width:1920,height:1080};
const baseUrl=process.env.REVIEW_BASE_URL??'http://127.0.0.1:5175';
const out='docs/ten-game/screenshots/game003';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
const page=await context.newPage();const records=[{type:'runtime',baseUrl,snapshot:'/workspace/scratch/ten-existing-frozen',device,viewport}];const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),credit:document.querySelector('#credit-count').textContent}));
const action=async id=>page.locator(`#${id}`)[touch?'tap':'click']();
const drop=async()=>touch?action('drop-button'):page.keyboard.press('Space');
const shot=async name=>{const path=`${out}/${device}-${name}.png`;await page.screenshot({path});records.push({type:'capture',name,path,...await read()});};
// Read-only release planner: bounded inherited velocity and small wind predict the visible shadow.
// This is oracle input selection, not evidence of human timing skill or an injected landing.
const projection=s=>{const c=s.cargo;const t=Math.sqrt(2*Math.max(0,s.topY-c.y-c.height/2)/720);const decay=(1-Math.exp(-1.5*t))/1.5;const wind=s.floors<8?0:Math.sin(s.time*.37)*3;return c.x+Math.max(-3,Math.min(3,c.vx*.02))*decay+wind/1.5*(t-decay);};
await page.goto(`${baseUrl}/game003.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(350);await shot('title');await action('play-button');
const started=Date.now();let offeredFloors;let lastFloor=0;let modeProof=false;let pausedProof=false;const shots=new Set();
try{
 while(Date.now()-started<350000){
  const o=await read();const s=o.inspection;
  if(o.state==='paused'){await action('resume-button');continue;}
  if(o.state==='milestone'){
   if(offeredFloors!==undefined)throw Error('Milestone unexpectedly repeated');offeredFloors=s.floors;
   await shot('15m-choice');const before=await read();
   if(touch){const b=await page.locator('#stage').boundingBox();await page.touchscreen.tap(b.x+b.width*.02,b.y+b.height*.85);}else await page.keyboard.press('Space');
   await page.waitForTimeout(1100);const after=await read();records.push({type:'choiceFreeze',before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection)});
   await action(touch?'normal-button':'challenge-button');records.push({type:'choiceAccepted',before,...await read()});continue;
  }
  if(!s.alive)break;
  if(s.floors!==lastFloor){records.push({type:'acceptedFloor',...o});lastFloor=s.floors;}
  for(const n of[3,8,20])if(s.floors>=n&&s.phase==='hanging'&&!shots.has(n)){shots.add(n);await shot(`${n}floors`);}
  if(offeredFloors!==undefined&&s.phase==='hanging'&&!modeProof){modeProof=true;await shot(touch?'normal-continued':'c-mode-first');}
  if(offeredFloors!==undefined&&s.floors>offeredFloors&&!pausedProof&&s.phase==='hanging'){
   pausedProof=true;await action('pause-button');const before=await read();await page.waitForTimeout(650);const after=await read();await action('resume-button');records.push({type:'modePauseResume',before,after,resumed:await read()});continue;
  }
  if(offeredFloors!==undefined&&s.floors>=offeredFloors+3&&s.phase==='hanging'&&!shots.has('after')){shots.add('after');await shot('after-three-more');}
  if(s.phase==='hanging'&&s.cargo){
   const projected=projection(s);const intentionalMiss=offeredFloors!==undefined&&s.floors>=offeredFloors+3;
   const target=touch?300:Math.max(298,Math.min(302,s.topCenter));
   const predictedSoon=projected+s.cargo.vx*(touch?.025:.004);
   const release=intentionalMiss?Math.abs(s.cargo.x-s.topCenter)>s.stack.at(-1).width/2+13:Math.abs(predictedSoon-target)<(touch?3.8:3.2);
   if(release){records.push({type:'nativeDrop',gameTime:s.time,floors:s.floors,cMode:s.cMode,projection:projected,predictedSoon,target,intentionalMiss});await drop();}
  }
  await page.waitForTimeout(12);
 }
 const final=await read();if(final.inspection.alive||offeredFloors===undefined)throw Error('Run did not earn15m offer and naturally finish');
 await page.locator('#retry-button').waitFor();await page.waitForTimeout(350);await shot('result');records.push({type:'earnedResult',text:await page.locator('.result-card').innerText(),wallMs:Date.now()-started,...await read()});
 const retryAt=Date.now();await action('retry-button');await page.waitForFunction(()=>window.__arcadeDebug.state()==='playing');records.push({type:'retryReset',wallMs:Date.now()-retryAt,...await read()});await shot('retry-reset');
 records.push({type:'finalEvents',events:await page.evaluate(()=>window.__arcadeDebug.telemetry()),errors,normalInputOnly:true,readonlyOracle:true,humanSkillEvidence:false});
}catch(error){records.push({type:'captureError',message:String(error),...await read()});throw error;}
finally{await writeFile(`${out}/${device}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
console.log(JSON.stringify({device,wallMs:Date.now()-started,errors,normalInputOnly:true,readonlyOracle:true}));
