import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const device=process.argv[2]??'desktop';if(!['desktop','mobile'].includes(device))throw Error('Choose desktop or mobile');
const touch=device==='mobile';const viewport=touch?{width:390,height:844}:{width:1920,height:1080};
const baseUrl=process.env.REVIEW_BASE_URL??'http://127.0.0.1:5175';const out='docs/ten-game/screenshots/game005';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});const page=await context.newPage();
const records=[{type:'runtime',baseUrl,snapshot:'/workspace/scratch/ten-existing-frozen',device,viewport}];const errors=[];page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),language:window.__arcadeDebug.language(),practice:window.__arcadeDebug.practice(),credit:document.querySelector('#credit-count').textContent,runStarts:window.__arcadeDebug.telemetry().filter(e=>e.name==='run_start'||e.event==='run_start'||e.type==='run_start').length}));
const action=async id=>page.locator(`#${id}`)[touch?'tap':'click']();
const shot=async name=>{const path=`${out}/${device}-${name}.png`;await page.screenshot({path});records.push({type:'capture',name,path,...await read()});};
const language=async lang=>{const before=await read();await action(`language-${lang}-button`);records.push({type:'languageChange',before,after:await read()});};
try{
 await page.goto(`${baseUrl}/game005.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(400);await shot('title-ja-default');
 await action('play-button');await page.waitForTimeout(350);await shot('tutorial-ja');await language('en');await shot('tutorial-en');
 await action('practice-button');await action('practice-right-button');await shot('practice-wrong-en');await action('practice-left-button');await shot('practice-angular-en');await language('ja');await shot('practice-angular-ja');await action('practice-right-button');await shot('practice-complete-ja');await action('begin-button');
 const started=Date.now();const seen=new Set();let changeShot=false;
 while(Date.now()-started<60000){const o=await read();let s=o.inspection;if(o.state==='paused'){await action('resume-button');continue;}if(!s.alive)break;
  if(s.phase==='rule_change'&&s.sorted===32&&!changeShot){changeShot=true;await shot('reverse-change');}
  if(s.phase==='sorting'){
   const key=s.rule.dimension+':'+s.rule.inverted;
   if(!seen.has(key)){seen.add(key);await page.waitForTimeout(230);await language('ja');await shot(`${s.rule.dimension}-${s.rule.inverted?'reverse':'normal'}-ja`);await language('en');await shot(`${s.rule.dimension}-${s.rule.inverted?'reverse':'normal'}-en`);
    records.push({type:'ruleGeometry',dimension:s.rule.dimension,inverted:s.rule.inverted,data:await page.evaluate(()=>{const info={};for(const selector of['.rule-strip','.rule-left b','.rule-right b','.conveyor','.language-controls']){const e=document.querySelector(selector);const b=e.getBoundingClientRect();info[selector]={text:e.textContent,width:b.width,height:b.height,fontSize:getComputedStyle(e).fontSize,x:b.x,y:b.y};}return info;})});
   }
   s=(await read()).inspection;const side=s.sorted>=33?(s.expectedSide==='left'?'right':'left'):s.expectedSide;await action(`${side}-button`);
  }
  await page.waitForTimeout(12);
 }
 const final=await read();if(final.inspection.alive||final.inspection.sorted!==33)throw Error('Localization run did not naturally end after33 correct parcels');
 await page.locator('#retry-button').waitFor();await page.waitForTimeout(350);await shot('result-en');await language('ja');await shot('result-ja');await language('en');
 records.push({type:'earnedResult',text:await page.locator('.result-card').innerText(),...await read()});await page.reload();await page.locator('#play-button').waitFor();await page.waitForTimeout(350);await shot('title-en-persisted');records.push({type:'persistedLanguage',...await read(),best:await page.locator('#best-value').innerText()});
 records.push({type:'finalEvents',events:await page.evaluate(()=>window.__arcadeDebug.telemetry()),errors,normalInputOnly:true,readonlyOracle:true,humanSkillEvidence:false});
}catch(error){records.push({type:'captureError',message:String(error),...await read()});throw error;}
finally{await writeFile(`${out}/${device}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
console.log(JSON.stringify({device,errors,normalInputOnly:true,readonlyOracle:true}));
