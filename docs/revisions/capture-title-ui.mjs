import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const game=process.argv[2];
if(!['game002','game003','game004','game005'].includes(game))throw Error('Choose one frozen game route');
const iteration=process.argv[3]??'1';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=process.argv[4]?JSON.parse(await readFile(`docs/revisions/after/${game}-CAPTURE_RECORD.json`,'utf8')).filter(r=>r.device!==process.argv[4]):[];await mkdir('docs/revisions/after',{recursive:true});
const inspect=page=>page.evaluate(()=>window.__arcadeDebug.inspection());
const selectedDevice=process.argv[4];
for(const[device,viewport,touch]of[['desktop',{width:1920,height:1080},false],['mobile',{width:390,height:844},true]].filter(([name])=>!selectedDevice||name===selectedDevice)){
 const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5173/${game}.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(250);
 const shot=async suffix=>{const path=`docs/revisions/after/${game}-${device}${suffix}.png`;await page.screenshot({path});records.push({game,iteration,device,viewport,suffix,path,inspection:await inspect(page)});};
 await shot('-title');await page.locator('#play-button')[touch?'tap':'click']();
 if(game==='game005'){
  await shot('-tutorial');records.push({game,device,type:'tutorialText',text:await page.locator('.tutorial-card').innerText()});
  await page.locator('#practice-button')[touch?'tap':'click']();await shot('-practice-round');
  const practiceRead=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),practice:window.__arcadeDebug.practice(),snapshot:window.__arcadeDebug.snapshot(),credit:document.querySelector('#credit-count').textContent,events:window.__arcadeDebug.telemetry()}));
  const before=await practiceRead();await page.locator('#practice-right-button')[touch?'tap':'click']();await page.waitForTimeout(850);const wrong=await practiceRead();await shot('-practice-wrong');
  await page.locator('#practice-left-button')[touch?'tap':'click']();await shot('-practice-angular');await page.locator('#practice-right-button')[touch?'tap':'click']();await shot('-practice-complete');const complete=await practiceRead();records.push({game,device,type:'practiceNoDebitNoClock',before,wrong,complete});
  await page.locator('#begin-button')[touch?'tap':'click']();
 }
 const boxes=await page.evaluate(()=>{const o={};for(const q of['#stage','canvas','.echo-grid','.conveyor','.parcel','#app']){const b=document.querySelector(q)?.getBoundingClientRect();o[q]=b?{x:b.x,y:b.y,width:b.width,height:b.height}:null;}return o;});records.push({game,device,viewport,type:'playingGeometry',boxes});
 if(game==='game002'){
  await page.waitForFunction(()=>window.__arcadeDebug.inspection().time>=7.5);
  if(touch){const b=await page.locator('#stage').boundingBox();await page.touchscreen.tap(b.x+b.width*.2,b.y+b.height*.8);}else await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(()=>window.__arcadeDebug.inspection().time>=9.4);const early=await inspect(page);await shot('-early-safe');records.push({game,device,type:'earlyAvoidance',inspection:early});
  await page.locator('#brand-button')[touch?'tap':'click']();await page.locator('#play-button')[touch?'tap':'click']();
  await page.waitForFunction(()=>window.__arcadeDebug.inspection().time>=8.4);
  if(touch){const b=await page.locator('#stage').boundingBox();await page.touchscreen.tap(b.x+b.width*.2,b.y+b.height*.8);}else await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(()=>window.__arcadeDebug.inspection().dodges===1);const late=await inspect(page);await shot('-first-nice');records.push({game,device,type:'lateAvoidance',inspection:late});
 }
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
   for(const n of[60,275])if(snap.distance>=n&&!shots.has(String(n))){shots.add(String(n));await shot(n===275?'':`-${n}m`);}
   const wave=snap.waves.find(w=>w.encounterTime>snap.time-.35);
   if(wave&&wave.encounterTime-snap.time<.78&&wave.encounterTime-snap.time>.39&&!snap.moving){
    const target=snap.distance<340?(wave.blockedLanes.includes(snap.lane)?wave.safeLane:snap.lane):wave.blockedLanes[0];
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
    const cell=snap.level>=8?(snap.expectedCell+1)%9:snap.expectedCell;await page.locator(`#cell-${cell}`)[touch?'tap':'click']();
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
 records.push({game,device,type:'earnedResult',text:await page.locator('.result-card').innerText(),inspection:await inspect(page)});
 if(game==='game003'||game==='game004'){
  await page.evaluate(game=>{const label=document.createElement('div');label.textContent='LAYOUT TEXT FIXTURE — NOT AN EARNED AWARD';Object.assign(label.style,{position:'fixed',top:'0',right:'0',background:'#fff',color:'#111',fontSize:'10px',padding:'2px',zIndex:'99999',pointerEvents:'none'});document.body.append(label);if(game==='game003')document.querySelector('#building-title').textContent='超スーパーエグゼクティブウルトラ神大工';else{const comment=document.querySelector('#memory-comment');comment.firstChild.textContent='人類上位クラスの記憶力かもしれません（わが家の子供調べ）';}},game);
  await shot('-long-text-layout-fixture');records.push({game,device,type:'longTextLayoutOnlyNotEarned',inspection:await inspect(page),geometry:await page.evaluate(()=>{const c=document.querySelector('.result-card').getBoundingClientRect();return{card:{x:c.x,y:c.y,width:c.width,height:c.height,bottom:c.bottom},viewport:{width:innerWidth,height:innerHeight},buttons:[...document.querySelectorAll('.result-actions button')].map(e=>{const b=e.getBoundingClientRect();return{id:e.id,height:b.height,bottom:b.bottom};})};})});
 }
 records.push({game,iteration,device,errors,wallMs:Date.now()-started,normalInputOnly:true,readonlyOracle:true});
 await context.close();await writeFile(`docs/revisions/after/${game}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify({game,device,iteration,final:snap,errors}));
}
await browser.close();
