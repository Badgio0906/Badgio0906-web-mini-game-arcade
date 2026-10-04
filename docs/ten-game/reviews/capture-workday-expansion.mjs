import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const device=process.argv[2]??'desktop';
if(!['desktop','mobile'].includes(device))throw Error('Choose desktop or mobile');
const viewport=device==='desktop'?{width:1920,height:1080}:{width:390,height:844};
const touch=device==='mobile';
const baseUrl=process.env.REVIEW_BASE_URL??'http://127.0.0.1:5174';
const out='docs/ten-game/screenshots/game002';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
const page=await context.newPage();const records=[];const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),credit:document.querySelector('#credit-count').textContent}));
const shot=async(name)=>{const path=`${out}/${device}-${name}.png`;await page.screenshot({path});records.push({type:'capture',name,path,...await read()});};
const action=async(id)=>page.locator(`#${id}`)[touch?'tap':'click']();
const move=async(direction)=>{if(touch){const b=await page.locator('#stage').boundingBox();await page.touchscreen.tap(b.x+b.width*(direction===1?.8:.2),b.y+b.height*.8);}else await page.keyboard.press(direction===1?'ArrowRight':'ArrowLeft');};
records.push({type:'runtime',baseUrl,snapshot:'/workspace/scratch/ten002-frozen',viewport,device});
await page.goto(`${baseUrl}/game002.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(350);await shot('title');
await action('play-button');
const started=Date.now();const seen=new Set();let firstBike;
try{
 while(Date.now()-started<420000){
  const observation=await read();const s=observation.inspection;
  if(observation.state==='paused'){await action('resume-button');continue;}
  if(observation.state==='milestone'){
   const name=s.pending;await shot(`${name}-choice`);const before=await read();
   if(touch){const b=await page.locator('#stage').boundingBox();for(const side of[.03,.97])await page.touchscreen.tap(b.x+b.width*side,b.y+b.height*.8);}else{await move(-1);await move(1);}
   await page.waitForTimeout(1100);const after=await read();
   records.push({type:'choiceFreeze',milestone:name,before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection),normalMovementIgnored:JSON.stringify(before.inspection)===JSON.stringify(after.inspection)});
   if(name==='company')await action(touch?'company-button':'journey-button');
   else if(name==='bike')await action('bike-button');
   else throw Error(`Unknown native milestone ${name}`);
   records.push({type:'choiceAccepted',milestone:name,...await read()});
   continue;
  }
  if(!s.alive)break;
  for(const threshold of[30,980,1050,1500,1950,2050,2200])if(s.distance>=threshold&&!seen.has(threshold)){seen.add(threshold);await shot(`${threshold}m`);}
  if(s.travel==='bike'&&!firstBike){firstBike={wall:Date.now(),inspection:s};await shot('bike-first');}
  // Read-only wave plan; ordinary movement starts conservatively from the visible approach.
  // e.y avoids confusing a speed-scaled travel clock with elapsed run seconds in bike mode.
  const waves=s.waves.map(w=>({wave:w,enemies:s.enemies.filter(e=>e.waveId===w.id&&!e.passed&&e.y<494+32)})).filter(w=>w.enemies.length);
  waves.sort((a,b)=>Math.max(...b.enemies.map(e=>e.y))-Math.max(...a.enemies.map(e=>e.y)));
  const approaching=waves[0];
  if(approaching&&!s.moving){const y=Math.max(...approaching.enemies.map(e=>e.y));if(y>=310&&y<455){
   let target=s.lane;
   if(s.travel==='bike'&&s.distance>=2200)target=approaching.wave.blockedLanes[0];
   else if(approaching.wave.blockedLanes.includes(s.lane))target=approaching.wave.safeLane;
   if(target!==s.lane){const direction=target>s.lane?1:-1;await move(direction);records.push({type:'nativeMove',gameTime:s.time,distance:s.distance,travel:s.travel,waveId:approaching.wave.id,source:s.lane,target,direction});}
  }}
  await page.waitForTimeout(18);
 }
 const final=await read();if(final.inspection.alive)throw Error('Run did not naturally finish within capture limit');
 if(!touch&&!firstBike)throw Error('Oracle run ended before reaching bike; milestone review incomplete');
 if(touch&&final.inspection.outcome!=='clear')throw Error('Phone run did not earn the office clear; branch review incomplete');
 await page.locator('#retry-button').waitFor();await page.waitForTimeout(350);await shot('result');
 records.push({type:'earnedResult',wallMs:Date.now()-started,text:await page.locator('.result-card').innerText(),...await read()});
 if(firstBike)records.push({type:'bikeInterval',first:firstBike.inspection,last:final.inspection});
 if(!touch){
  for(let n=0;n<2;n++){const retryAt=Date.now();await action('retry-button');await page.waitForFunction(()=>window.__arcadeDebug.state()==='playing');records.push({type:'retryLatency',wallMs:Date.now()-retryAt});await page.waitForFunction(()=>window.__arcadeDebug.state()==='result',{timeout:30000});await page.waitForTimeout(400);records.push({type:'naturalIdleFailure',...await read()});}
  await shot('no-credit');await action('reward-button');await shot('reward-pending');await page.waitForFunction(()=>window.__arcadeDebug.state()==='title'&&document.querySelector('#credit-count').textContent==='3');await shot('refilled');
 }
 records.push({type:'finalEvents',events:await page.evaluate(()=>window.__arcadeDebug.telemetry()),errors,normalInputOnly:true,readonlyOracle:true,humanSkillEvidence:false});
}catch(error){records.push({type:'captureError',message:String(error),...await read()});throw error;}
finally{await writeFile(`${out}/${device}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
console.log(JSON.stringify({device,wallMs:Date.now()-started,errors,normalInputOnly:true,readonlyOracle:true}));
