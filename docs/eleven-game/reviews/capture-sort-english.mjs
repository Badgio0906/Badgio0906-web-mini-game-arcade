import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Fresh-context optional language flow, driven solely by visible native controls.
const base=process.env.REVIEW_BASE_URL;if(!base)throw Error('Supply the explicitly released frozen REVIEW_BASE_URL.');
const device=process.argv[2]??'desktop',touch=device==='mobile',viewport=touch?{width:390,height:844}:{width:1440,height:900};
const out='docs/eleven-game/screenshots/game005';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1}),page=await context.newPage();
const records=[{kind:'candidate',base,device,viewport,nativeInputOnly:true,freshContext:true}],errors=[];page.on('pageerror',e=>errors.push(e.message));
const native=selector=>page.locator(selector)[touch?'tap':'click']();
const read=()=>page.evaluate(()=>({lang:document.documentElement.lang,language:window.__arcadeDebug?.language(),state:window.__arcadeDebug?.state(),snapshot:window.__arcadeDebug?.snapshot(),training:window.__tutorialDebug?.snapshot(),phaseLabel:document.querySelector('#phase-label')?.textContent,events:window.__arcadeDebug?.telemetry()}));
async function shot(name){const path=`${out}/independent-${device}-en-${name}.png`;await page.screenshot({path});records.push({kind:'capture',name,path,...await read()});}
try{
  await page.goto(`${base}/index.html`);await native('.game-card[data-game-id="game005"]');await native('#language-en-button');await shot('title');
  await native('#play-button');await shot('explanation');
  const explanation=await page.locator('#arcade-training').innerText();if(!explanation.includes('Use the rule')||!explanation.includes('Try the controls'))throw Error('English explanation missing');
  await native('#tutorial-practice-button');await shot('practice');await native('[data-practice-action="left"]');await native('[data-practice-action="right"]');
  await page.waitForFunction(()=>window.__tutorialDebug.snapshot().phase==='success');await shot('success');await native('#tutorial-start-button');
  await page.waitForFunction(()=>window.__arcadeDebug.state()==='playing');await page.waitForTimeout(230);await shot('fresh-main');
  const before=await read();if(before.lang!=='en'||before.language!=='en'||before.training.completed!==true)throw Error('Language/completion lost at real start');
  await native('#pause-button');await native('#title-button');await page.reload();await shot('persisted-title');
  if((await read()).language!=='en')throw Error('English not persisted on normal reload');await native('#play-button');await page.waitForFunction(()=>window.__arcadeDebug.state()==='playing');
  records.push({kind:'normalReloadDirectEnglishStart',...await read()});
}catch(error){records.push({kind:'harnessFailure',message:String(error),...await read()});throw error;}
finally{records.push({kind:'pageErrors',errors});await writeFile(`${out}/independent-${device}-EN_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
