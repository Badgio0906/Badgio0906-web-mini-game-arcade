import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { read, until, input, sequence, tutorial, settlePaint, geometry, stopAt } from '../../../tests/game018/helpers.mjs';
const output=process.env.GAME018_FEEL_DIR||'docs/game018/review-artifacts/feel';await mkdir(output,{recursive:true});
const started=new Date().toISOString();
const freeze=JSON.parse(await readFile(process.env.GAME018_FREEZE||'docs/game018/SOURCE_FREEZE.json','utf8'));
async function audit(){const changed=[];for(const [path,expected] of Object.entries(freeze.files)){const actual=createHash('sha256').update(await readFile(path)).digest('hex');if(actual!==expected)changed.push({path,expected,actual});}return{sourceHash:freeze.source_hash,files:Object.keys(freeze.files).length,changed};}
const before=await audit();assert.deepEqual(before.changed,[],'source differs from final freeze');
let browser=null;
const records=[];let failed=false;
const experiments=[
 {name:'sneaker-distance-normal',shoe:'sneaker',angle:[40,45],spin:[.4,.55],power:[80,88],route:'distance'},
 {name:'paper-sky-just',shoe:'paper',angle:[79,84],spin:[.5,.7],power:[99.5,100],route:'sky'},
 {name:'zori-distance-spin',shoe:'zori',angle:[40,45],spin:[.94,1],power:[80,88],route:'distance'},
 {name:'leather-ground-just',shoe:'leather',angle:[5,8],spin:[.78,.92],power:[99.5,100],route:'ground'},
 {name:'iron-ground-normal',shoe:'iron-geta',angle:[17,22],spin:[.72,.84],power:[80,88],route:'ground'},
 {name:'iron-ground-just',shoe:'iron-geta',angle:[17,22],spin:[.72,.84],power:[99.5,100],route:'ground'},
 {name:'iron-sky-just',shoe:'iron-geta',angle:[55,60],spin:[.72,.84],power:[99.5,100],route:'sky'},
];
try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const profile of[{name:'desktop',width:1440,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.touch,isMobile:profile.touch});
  context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(10000);
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  const record={profile,captures:[],experiments:[],practice:null,pureComparisons:[]};
  const capture=async name=>{const path=output+'/'+profile.name+'-'+name+'.png';console.log(profile.name+' capture '+name);let timer;try{await Promise.race([(async()=>{await settlePaint(page);await page.screenshot({path});})(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Capture watchdog3s: '+name)),3000);})]);record.captures.push(path);}finally{clearTimeout(timer);}};
  try{
   await page.goto((process.env.GAME018_URL||'http://127.0.0.1:5181/')+'game018.html');await capture('title');await geometry(page);
   record.practice=await tutorial(page,profile.touch,capture,()=>geometry(page));await capture('selection');await geometry(page);
   record.pureComparisons=await page.evaluate(()=>{
    const records=[];for(const shoeType of['paper','zori','sneaker','leather','iron-geta'])for(const preset of[{angle:20,spin:.8,power:85},{angle:20,spin:.8,power:100},{angle:45,spin:.45,power:85},{angle:80,spin:.65,power:100}]){const input={shoeType,...preset};const a=window.__arcadeDebug.simulate(input),b=window.__arcadeDebug.simulate(input);records.push({input,result:a.result,physicalDuration:a.physicalDuration,replayDuration:a.duration,deterministic:JSON.stringify(a)===JSON.stringify(b)});}return records;
   });assert.ok(record.pureComparisons.every(r=>r.deterministic));
   const profileExperiments=process.env.GAME018_FEEL_MODE==='targeted-retest'&&!profile.touch?experiments.filter(e=>e.name==='paper-sky-just'||e.name==='iron-sky-just'):experiments;
   for(const [index,e] of profileExperiments.entries()){
    if(index){await input(page,profile.touch,'#change-shoe-button');await until(page,r=>r.state==='selection','shoechange');}
    await input(page,profile.touch,'.shoe-card[data-shoe="'+e.shoe+'"]');await input(page,profile.touch,'#start-button');
    const entered=Date.now();assert.equal((await read(page)).snapshot.shoeType,e.shoe,'native shoe selection applied');await capture(e.name+'-angle-pose');
    const angleLock=await stopAt(page,profile.touch,'angle',...e.angle);await capture(e.name+'-angle-lock');
    await until(page,r=>r.snapshot.phase==='spin','spin');await capture(e.name+'-spin-zoom');
    const spinLock=await stopAt(page,profile.touch,'spin',...e.spin);
    await until(page,r=>r.snapshot.phase==='power','power');await capture(e.name+'-power-gauge');
    const powerLock=await stopAt(page,profile.touch,'power',...e.power);if(e.power[0]>=99.5)assert.ok(powerLock.snapshot.justMax,'native JUST MAX');
    assert.equal(powerLock.snapshot.route,e.route);if(powerLock.snapshot.justMax)await capture(e.name+'-just-max');
    await until(page,r=>r.snapshot.phase==='kick','kick');await capture(e.name+'-kick');
    const nativeInputs={angle:powerLock.snapshot.angle,spin:powerLock.snapshot.spin,power:powerLock.snapshot.power,shoeType:e.shoe};
    const expected=await page.evaluate(i=>{const t=window.__arcadeDebug.simulate(i);return{result:t.result,duration:t.duration,physicalDuration:t.physicalDuration,holds:t.holds};},nativeInputs);
    const samples=[],seen=new Set(),holdsSeen=new Set();const end=Date.now()+35000;let last,lastCaptureAt=0;
    while(Date.now()<end){
      last=await read(page);const s=last.snapshot;
      if(s.phase==='flight'){
       const p=last.projection;samples.push({flightElapsed:s.flightElapsed,position:s.position,velocity:s.velocity,rotation:s.rotation,projection:p,effects:s.effects,activeHold:s.activeHold});
       assert.ok(p.shoeX>=0&&p.shoeX<=p.width&&p.shoeY>=0&&p.shoeY<=p.height,'shoe remains in camera');
       if(s.activeHold&&!holdsSeen.has(s.activeHold.name)){holdsSeen.add(s.activeHold.name);assert.ok(Math.hypot(s.position.x-s.activeHold.position.x,s.position.y-s.activeHold.position.y)<1e-6,'hold stays at actual event location');await capture(e.name+'-hold-'+s.activeHold.name.replace(/[^a-z0-9]/gi,'-'));lastCaptureAt=Date.now();}
       for(const effect of s.effects){const key=effect.type+':'+effect.name;if(!seen.has(key)){seen.add(key);if(s.flightElapsed-effect.time<1.2){await capture(e.name+'-event-'+effect.name.replace(/[^a-z0-9]/gi,'-'));lastCaptureAt=Date.now();}}}
       if(samples.length===1||Date.now()-lastCaptureAt>4000){await capture(e.name+'-flight-'+samples.length);lastCaptureAt=Date.now();}
      }
      if(s.phase==='landing'&&!seen.has('LANDING')){seen.add('LANDING');await capture(e.name+'-landing');}
      if(last.state==='result')break;await page.waitForTimeout(60);
    }
    assert.equal(last.state,'result','throw lands in bounded replay');await capture(e.name+'-result');await geometry(page);
    assert.deepEqual(last.snapshot.result,expected.result,'native throw matches pure simulate using actual locked input');assert.ok(samples.length>20);if(process.env.GAME018_FEEL_MODE==='targeted-retest')assert.ok(expected.holds.every(h=>holdsSeen.has(h.name)),'every eligible sky hold observed');
    const experiment={scenario:e,angleLock:angleLock.snapshot,spinLock:spinLock.snapshot,powerLock:powerLock.snapshot,actualResult:last.snapshot.result,expected,elapsedWallSeconds:(Date.now()-entered)/1000,samples,observedEvents:[...seen],observedHolds:[...holdsSeen]};record.experiments.push(experiment);console.log(profile.name+' '+e.name+' '+last.snapshot.result.distance.toFixed(1)+'m '+last.snapshot.result.specials.join('|'));
   }
   const last=record.experiments.at(-1);await input(page,profile.touch,'#retry-button');const retried=await read(page);assert.equal(retried.snapshot.shoeType,last.scenario.shoe);assert.equal(retried.snapshot.phase,'angle');record.retry=retried.snapshot;await capture('retry');
   if(!profile.touch){await page.keyboard.press('Enter');await until(page,r=>r.snapshot.phase==='spin','keyboardangle');await page.keyboard.press('Space');await until(page,r=>r.snapshot.phase==='power','keyboardspin');await page.keyboard.press('Enter');await until(page,r=>['max','kick','flight'].includes(r.snapshot.phase),'keyboardpower');record.keyboard=(await read(page)).snapshot;}
   await input(page,profile.touch,'#pause-button');await capture('paused');await input(page,profile.touch,'#title-button');await capture('return-title');
   assert.deepEqual(errors,[]);record.status='PASS';
  }catch(error){failed=true;record.status='FAIL';record.error=String(error);record.last=await read(page).catch(()=>null);await capture('FAILURE').catch(()=>{});}
  finally{record.errors=errors;records.push(record);console.log(profile.name+' '+record.status);await context.close();}
 }
}catch(error){failed=true;records.push({status:'FAIL',fatal:String(error)});}finally{if(browser)await browser.close().catch(error=>{failed=true;records.push({status:'FAIL',browserCloseError:String(error)});});}
const after=await audit();if(after.changed.length)failed=true;
await writeFile(output+'/report.json',JSON.stringify({started,finished:new Date().toISOString(),before,after,profiles:records,nativeMouseOrCDPTouch:true,forcedRuntimeWrites:false,tutorialStorageShortcut:false,pureSimulationComparisonSeparate:true,humanEnjoymentClaim:false},null,2)+'\n');
if(failed)process.exitCode=1;
