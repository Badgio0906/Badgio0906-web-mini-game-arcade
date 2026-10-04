import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const game=process.argv[2];
if(!['game002','game003','game004','game005'].includes(game))throw Error('Choose one frozen game route');
const iteration=process.argv[3]??'1';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=process.argv[4]?JSON.parse(await readFile(`docs/visual/after/${game}-CAPTURE_RECORD.json`,'utf8')).filter(r=>r.device!==process.argv[4]):[];await mkdir('docs/visual/after',{recursive:true});
const inspect=page=>page.evaluate(()=>window.__arcadeDebug.inspection());
const selectedDevice=process.argv[4];
for(const[device,viewport,touch]of[['desktop',{width:1440,height:900},false],['mobile',{width:390,height:844},true]].filter(([name])=>!selectedDevice||name===selectedDevice)){
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5173/${game}.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(250);
 const shot=async suffix=>{const path=`docs/visual/after/${game}-${device}${suffix}.png`;await page.screenshot({path});records.push({game,iteration,device,viewport,suffix,path,inspection:await inspect(page)});};
 await shot('-title');await page.locator('#play-button')[touch?'tap':'click']();
 const started=Date.now();const shots=new Set();let snap;
 while(Date.now()-started<230000){
  snap=await inspect(page);const state=await page.evaluate(()=>window.__arcadeDebug.state());
  if(state==='paused'){await page.locator('#resume-button')[touch?'tap':'click']();continue;}
  if(!snap.alive)break;
  if(game==='game002'){
   for(const e of snap.enemies){
    if(['B','C'].includes(e.type)&&snap.time>=e.warningStart&&snap.time<e.changeStart&&!shots.has(e.type)){shots.add(e.type);await shot(`-${e.type}-warning`);}
    if(e.type==='D'&&snap.time>e.encounterTime-2.7&&!shots.has('D')){shots.add('D');await shot('-two-people');}
   }
   for(const n of[60,275,525,775])if(snap.distance>=n&&!shots.has(String(n))){shots.add(String(n));await shot(n===275?'':`-${n}m`);}
   const wave=snap.waves.find(w=>w.encounterTime>snap.time-.35);
   if(wave&&wave.encounterTime-snap.time<1.35&&wave.encounterTime-snap.time>.55&&!snap.moving){
    const target=snap.distance<800?(wave.blockedLanes.includes(snap.lane)?wave.safeLane:snap.lane):wave.blockedLanes[0];
    if(target!==snap.lane){if(touch){const box=await page.locator('#stage').boundingBox();await page.touchscreen.tap(box.x+box.width*(target>snap.lane?.8:.2),box.y+box.height*.8);}else await page.keyboard.press(target>snap.lane?'ArrowRight':'ArrowLeft');}
   }
  }else if(game==='game003'){
   if(snap.floors>=3&&snap.phase==='hanging'&&!shots.has('three')){shots.add('three');await shot('-3floors');}
   if(snap.floors>=8&&snap.phase==='hanging'&&!shots.has('eight')){shots.add('eight');await shot('');await shot('-8floors');}
   if(snap.perfectCount&&!shots.has('perfect')){shots.add('perfect');await shot('-perfect');}
   if(snap.phase==='hanging'&&snap.cargo){const dx=snap.cargo.x-snap.topCenter;const release=snap.floors<8?Math.abs(dx)<3.5:Math.abs(dx)>snap.stack.at(-1).width/2+13;if(release){if(touch)await page.locator('#drop-button').tap();else await page.keyboard.press('Space');}}
   if(snap.floors>=8&&snap.phase==='falling'&&Math.abs(snap.cargo?.rotation??0)>.08&&!shots.has('tip')){shots.add('tip');await shot('-tip');}
  }else if(game==='game004'){
   if(snap.phase==='watch'&&snap.highlightedCell!==null&&!shots.has('lit')){shots.add('lit');await shot('');await shot('-watch-lit');}
   if(snap.phase==='watch'&&snap.highlightedCell===null&&shots.has('lit')&&!shots.has('off')){shots.add('off');await shot('-watch-off');}
   if(snap.phase==='recall'){
    if(!shots.has('recall')){shots.add('recall');await shot('-recall');}
    const cell=snap.level>=6?(snap.expectedCell+1)%9:snap.expectedCell;await page.locator(`#cell-${cell}`)[touch?'tap':'click']();
   }
  }else{
   if(snap.phase==='rule_change'&&snap.sorted===32&&!shots.has('change')){shots.add('change');await shot('-reverse-change');}
   if(snap.phase==='sorting'){
    if(!shots.has(snap.rule.dimension+snap.rule.inverted)){shots.add(snap.rule.dimension+snap.rule.inverted);await page.waitForTimeout(300);snap=await inspect(page);await shot(`-${snap.rule.dimension}-${snap.rule.inverted?'reverse':'normal'}`);if(snap.sorted===8)await shot('');}
    const side=snap.sorted>=33?(snap.expectedSide==='left'?'right':'left'):snap.expectedSide;
    await page.locator(`#${side}-button`)[touch?'tap':'click']();
   }
  }
  await page.waitForTimeout(14);
 }
 if(snap.alive)throw Error(`${game}/${device} natural run did not end before limit`);
 await page.locator('#retry-button').waitFor();await page.waitForTimeout(350);await shot('-over');
 if(game==='game004'){await page.waitForTimeout(150);await shot('-replay');}
 records.push({game,iteration,device,errors,wallMs:Date.now()-started,normalInputOnly:true,readonlyOracle:true});
 await context.close();await writeFile(`docs/visual/after/${game}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify({game,device,iteration,final:snap,errors}));
}
await browser.close();
