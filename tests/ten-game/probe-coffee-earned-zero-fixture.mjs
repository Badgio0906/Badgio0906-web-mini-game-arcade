import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
// Result receipt /numeric header only. The idle cup canvas remains100%; no model writes.
const source=await readFile('src/games/game008/main.ts','utf8');
const proof=JSON.parse(await readFile('docs/ten-game/QA/GAME008_INITIAL_NATIVE_FINDING.json','utf8'));
const scenarios=[{terminal:proof.terminalRuns.at(-1),credits:0,title:'コーヒー初心者',sourceProof:'GAME008_INITIAL_NATIVE_FINDING.json',suffix:'zero'}];
if(process.argv.includes('--both')){const journal=JSON.parse(await readFile('docs/ten-game/screenshots/game008/mobile-CAPTURE_RECORD.json','utf8'));const earned=journal.find(r=>r.type==='earnedResult');assert.equal(earned.inspection.score,1810);scenarios.push({terminal:earned.inspection,credits:2,title:'会長も部長も任せろ',sourceProof:'../screenshots/game008/mobile-CAPTURE_RECORD.json',suffix:'threecups'});}
const template=source.match(/overlay\.innerHTML = `(<article class="receipt result-note">[\s\S]*?)`;/)[1];
const titleButton=source.match(/const titleButton = '(.*?)';/)[1];
const primary=(id,text)=>`<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const sizes=process.argv.includes('--all')?[[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]]:[[320,568]];
const records=[];const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 await mkdir('docs/ten-game/screenshots/game008',{recursive:true});
 for(const scenario of scenarios){
  const terminal=scenario.terminal;assert.equal(terminal.alive,false);const depleted=terminal.cups.find(c=>c.remaining<=0);assert.ok(depleted);
  const result={...terminal,emptyCupName:depleted.name,reason:`${depleted.name}のコーヒーが空になりました。`};
  const html=new Function('result','best','newBest','credits','primary','titleButton','coffeeTitle',`return \`${template}\`;`)(result,result.score,true,{credits:scenario.credits},primary,titleButton,()=>scenario.title);
  const presentation={attrs:{state:'result',scoreDigits:String(result.score).length.toString(),cups:String(result.cupCount),phase:'ended'},ids:{'credit-count':String(scenario.credits),'credit-dots':Array.from({length:3},(_,i)=>i<scenario.credits?'●':'○').join(' '),'distance-value':String(Math.floor(result.distance)),'score-value':String(result.score),'best-value':String(result.score),'mode-label':`${result.cupCount}カップ · ×${result.multiplier}`,'phase-label':`${depleted.name}が0%。散歩はここまで。`}};
  for(const[width,height]of sizes){
  const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  try{
   await page.goto('http://127.0.0.1:5178/game008.html');await page.locator('#play-button').waitFor();await page.evaluate(()=>document.fonts.ready);
   const initial=await page.evaluate(()=>({model:window.__arcadeDebug.snapshot(),events:window.__arcadeDebug.telemetry()}));
   await page.evaluate(({html,presentation})=>{
    const app=document.querySelector('#app');document.querySelector('#overlay').innerHTML=html;document.querySelector('#overlay').hidden=false;
    // Preserve presentation values against idle RAF, without changing or intercepting game callbacks.
    const present=()=>{
     for(const[k,v]of Object.entries(presentation.attrs))if(app.dataset[k]!==v)app.dataset[k]=v;
     for(const[id,text]of Object.entries(presentation.ids)){const node=document.getElementById(id);if(node.textContent!==text)node.textContent=text;}
    };
    present();new MutationObserver(present).observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-state','data-score-digits','data-cups','data-phase']});
   },{html,presentation});
   const geometry=await page.evaluate(actionSelector=>{
    const selectors=['#stage','.coffee-board','.coffee-controls','.cafe-receipt','.walk-window','.cup-meters','.result-note','.result-reason','.new-best','#result-score','.result-score>span','.result-score','.result-details','.final-cups','#coffee-title',actionSelector,'#title-button','.result-note>small','.walk-caption','.cafe-footer'];
    const boxes=selectors.map(selector=>{const el=document.querySelector(selector),r=el.getBoundingClientRect(),style=getComputedStyle(el);return{selector,text:el.textContent,x:r.x,y:r.y,width:r.width,height:r.height,visible:style.display!=='none'&&!['hidden','collapse'].includes(style.visibility)};});
    const score=document.querySelector('#result-score'),range=document.createRange();range.selectNodeContents(score);
    return{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,inactiveControls:{display:getComputedStyle(document.querySelector('.coffee-controls')).display,disabled:[...document.querySelectorAll('.coffee-controls button')].every(button=>button.disabled)},boxes,scoreText:{text:score.textContent,fontSize:getComputedStyle(score).fontSize,fragments:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))}};
   },scenario.credits?'#retry-button':'#reward-button');
   const after=await page.evaluate(()=>({model:window.__arcadeDebug.snapshot(),events:window.__arcadeDebug.telemetry()}));
   const record={kind:'Retained earned result receipt /numeric-header geometry-only replay; idle cup canvas/meter100% is not actual terminal-liquid evidence; no model writes',width,height,sourceProof:scenario.sourceProof,result,credits:scenario.credits,geometry,initial,after,errors};records.push(record);
   // Save even failed diagnostic bounds and images; a recorded observation is not a PASS.
   await writeFile('docs/ten-game/QA/GAME008_REPAIRED_ZERO_LAYOUT_FIXTURE.json',JSON.stringify(records,null,2)+'\n');
   if(width<=390||height<=390)await page.screenshot({path:`docs/ten-game/screenshots/game008/qa-render-only-earned${result.score}-${scenario.suffix}-${width}x${height}-result.png`});
   for(const box of geometry.boxes){
    if(box.selector==='.coffee-controls'&&((width<=360&&height>=501)||height<=500)){assert.equal(box.visible,false,'only inactive steering controls intentionally removed in compact portrait /landscape result');continue;}
    if(box.selector==='.cafe-footer'&&height<=500){assert.equal(box.visible,false,'inherited compact landscape footer is intentionally hidden');continue;}
    assert.ok(box.visible&&box.width>0&&box.height>0,JSON.stringify(box));assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1,JSON.stringify(box));
    if(box.selector.endsWith('-button'))assert.ok(box.width>=44&&box.height>=44,JSON.stringify(box));
   }
   assert.equal(geometry.documentWidth,width);assert.ok(geometry.documentHeight<=height+1,JSON.stringify({width,height,documentHeight:geometry.documentHeight}));
   assert.equal(geometry.scoreText.text,String(result.score));assert.equal(new Set(geometry.scoreText.fragments.map(r=>Math.round(r.y))).size,1,'Primary score stays on one visual line');
   const box=selector=>geometry.boxes.find(b=>b.selector===selector),score=box('#result-score'),column=box('.result-score'),caption=box('.result-score>span'),metrics=box('.result-details');
   assert.ok(geometry.scoreText.fragments.every(r=>r.x>=score.x-1&&r.x+r.width<=score.x+score.width+1),'Score digits fit allocation');
   assert.ok(caption.x>=column.x-1&&caption.y>=column.y-1&&caption.x+caption.width<=column.x+column.width+1&&caption.y+caption.height<=column.y+column.height+1,'SCORE caption fits its column');
   assert.ok(column.x+column.width<=metrics.x+1||metrics.x+metrics.width<=column.x+1||column.y+column.height<=metrics.y+1||metrics.y+metrics.height<=column.y+1,'Score and metrics do not overlap');
   const status=box('.walk-caption'),cups=box('.cup-meters'),receipt=box('.result-note');const apart=(a,b)=>a.x+a.width<=b.x+1||b.x+b.width<=a.x+1||a.y+a.height<=b.y+1||b.y+b.height<=a.y+1;assert.ok(apart(status,cups),'Status caption must not cover cup readings');assert.ok(apart(status,receipt),'Status caption must not cover receipt information');
   for(const[id,text]of Object.entries(presentation.ids))assert.equal(await page.locator(`#${id}`).textContent(),text);
   if((width<=360&&height>=501)||height<=500){assert.equal(geometry.inactiveControls.display,'none');assert.equal(geometry.inactiveControls.disabled,true);}if(width<=360&&height>=501)assert.equal(box('.walk-window').height,155);
   assert.deepEqual(after,initial);assert.deepEqual(errors,[]);record.passed=true;
   await writeFile('docs/ten-game/QA/GAME008_REPAIRED_ZERO_LAYOUT_FIXTURE.json',JSON.stringify(records,null,2)+'\n');
  }catch(error){let record=records.at(-1);if(!record||record.width!==width||record.height!==height||record.result.score!==result.score){record={kind:'DOM-fixture harness failure before geometry observation; no gameplay finding',width,height,result,credits:scenario.credits};records.push(record);}record.passed=false;record.error=String(error);await writeFile('docs/ten-game/QA/GAME008_REPAIRED_ZERO_LAYOUT_FIXTURE.json',JSON.stringify(records,null,2)+'\n');console.error(`${result.score} ${width}x${height}: ${String(error)}`); }finally{await context.close();}
  }
 }
 assert.ok(records.every(record=>record.passed),`${records.filter(record=>!record.passed).length} geometry observations failed`);
 console.log(`PASS ${records.length} retained earned-result DOM geometry fixtures; actions>=44; model/events unchanged`);
}finally{await browser.close();}
