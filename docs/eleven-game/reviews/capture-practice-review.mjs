import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Independent reviewer harness. No storage/model mutation, DOM event dispatch,
// controller actions, score/time overrides, or QA implementation imports.
// Run only after the parent's exclusive frozen-runtime/browser handoff.
const base = process.env.REVIEW_BASE_URL;
if (!base) throw Error('Set REVIEW_BASE_URL to the explicitly released frozen candidate.');
const device = process.argv[2] ?? 'desktop';
const touch = device === 'mobile';
const viewport = touch ? { width:390, height:844 } : { width:1440, height:900 };
const ids = process.argv.slice(3);
const games = ids.length ? ids : Array.from({length:11},(_,i)=>`game${String(i+1).padStart(3,'0')}`);
const out = 'docs/eleven-game/screenshots';
await mkdir(out,{recursive:true});
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context = await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});
const page = await context.newPage();
const records = [{kind:'candidate',base,device,viewport,nativeInputsOnly:true,readonlyOracle:true,humanSkillOrComprehensionEvidence:false}];
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const training=()=>page.evaluate(()=>window.__tutorialDebug?.snapshot());
const runtime=()=>page.evaluate(()=>{const d=window.__arcadeDebug??window.__orbitDebug;return d?{state:d.state(),snapshot:d.snapshot(),inspection:d.inspection?.(),events:d.telemetry()}:null;});
const button=async selector=>page.locator(selector)[touch?'tap':'click']();
const action=async value=>button(`[data-practice-action="${value}"]`);
async function until(predicate,timeout=12000){const began=Date.now();while(!(await predicate())){if(Date.now()-began>timeout)throw Error('Native review progression timeout');await page.waitForTimeout(40);}}
async function capture(id,name){
  await page.evaluate(()=>document.fonts.ready);
  const path=`${out}/${id}-${device}-${name}.png`;await page.screenshot({path});
  const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
    entries:[...document.querySelectorAll('dialog[open],dialog[open] button,#play-button,#retry-button,#title-button,#portal-link,.arcade-portal-back,#mute-button,#pause-button,#game-canvas,#stage')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{id:e.id,tag:e.tagName,text:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height,display:s.display};})}));
  records.push({kind:'capture',game:id,name,path,geometry,training:await training(),runtime:await runtime()});
}
async function practice(id){
  // Mechanical completion times are captured separately from explanation dwell;
  // neither is a novice-human reading/learning-time measurement.
  const started=Date.now();
  switch(id){
    case 'game001': await action('action');break;
    case 'game002': await action('left');await until(async()=>(await training()).practice.step===1);await action('right');break;
    case 'game003': await until(async()=>{const s=(await training()).practice;return s.x>190&&s.x<420;});await action('action');break;
    case 'game004': await until(async()=>(await training()).practice.phase==='recall');await action('cell-0');await page.waitForTimeout(250);await action('cell-4');break;
    case 'game005': await action('right');await capture(id,'practice-forgiving-mistake');await action('left');await page.waitForTimeout(300);await action('right');break;
    case 'game006': await action('action');await page.waitForTimeout(500);await capture(id,'practice-angle-locked');await action('action');break;
    case 'game007': await action('board');await until(async()=>(await training()).practice.phase==='practice'&&(await training()).practice.step===1);await capture(id,'practice-overload-arithmetic');await action('reject');break;
    case 'game008': {
      const r=await page.locator('[data-practice-action="right"]').boundingBox();
      const cdp=touch?await context.newCDPSession(page):null;
      // Chromium native touch input, not dispatchEvent or controller mutation.
      // Headless emulation does not measure physical phone input latency.
      if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});records.push({kind:'inputAttribution',game:id,input:'Chromium native held touch via CDP; physical phone latency unmeasured'});}
      else {const r=await page.locator('[data-practice-action="right"]').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();}
      await until(async()=>(await training()).phase==='success');
      if(touch){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else await page.mouse.up();break;
    }
    case 'game009': await action('stamp-other');await capture(id,'practice-forgiving-mistake');await action('stamp-red');break;
    case 'game010': await action('action');await until(async()=>(await training()).practice.practicePoints>=19);await capture(id,'practice-work-and-cue');await action('action');break;
    case 'game011': await action('ukon');await capture(id,'practice-forgiving-mistake');await action('unko');break;
    default:throw Error(`Unknown game ${id}`);
  }
  await until(async()=>(await training()).phase==='success');
  records.push({kind:'mechanicalPracticeCompletion',game:id,wallMs:Date.now()-started,training:await training(),runtime:await runtime(),humanLearningTiming:false});
}
try{
  await page.goto(`${base}/index.html`);await page.locator('.game-card').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const portalEntries=await page.locator('.game-card').evaluateAll(cards=>cards.map(e=>({game:e.dataset.gameId,title:e.querySelector('h2')?.textContent,english:e.querySelector('.game-english')?.textContent,tagline:e.querySelector('p')?.textContent,href:e.getAttribute('href'),thumbnail:e.querySelector('img')?.getAttribute('src')})));
  records.push({kind:'actualPortalCatalog',entries:portalEntries});
  for(let i=0;i<portalEntries.length;i++){await page.locator('.game-card').nth(i).scrollIntoViewIfNeeded();await page.waitForFunction(i=>{const image=document.querySelectorAll('.game-card img')[i];return image?.complete&&image.naturalWidth>0;},i);}
  for(const [name,index] of [['top',0],['middle',5],['last',10]]){
    await page.locator('.game-card').nth(index).scrollIntoViewIfNeeded();await page.waitForTimeout(180);const path=`${out}/portal-${device}-${name}.png`;await page.screenshot({path});records.push({kind:'portalCapture',name,path});
  }
  const portalPath=`${out}/portal-${device}-full.png`;await page.screenshot({path:portalPath,fullPage:true});records.push({kind:'portalFullCapture',path:portalPath});
  for(const id of games){
    await page.goto(`${base}/index.html`);await page.locator(`.game-card[data-game-id="${id}"]`).scrollIntoViewIfNeeded();await button(`.game-card[data-game-id="${id}"]`);await page.locator('#play-button').waitFor();await page.waitForTimeout(300);await capture(id,'title');
    await button('#play-button');await until(async()=>(await training())?.phase==='explanation');await page.waitForTimeout(1000);await capture(id,'explanation');
    await button('#tutorial-practice-button');await page.waitForTimeout(300);await capture(id,'practice');
    await practice(id);await capture(id,'practice-success');
    await button('#tutorial-start-button');await until(async()=>(await runtime())?.state==='playing');await page.waitForTimeout(250);await capture(id,'fresh-gameplay');
    await button('#pause-button');await capture(id,'fresh-paused');await button('#title-button');
    await button('#play-button');await until(async()=>(await runtime())?.state==='playing');
    records.push({kind:'repeatDirectStart',game:id,training:await training(),runtime:await runtime()});
    await button('#pause-button');await button('#title-button');
    await button('#tutorial-again-button');await until(async()=>(await training()).phase==='explanation');await capture(id,'practice-again');await button('#tutorial-close-button');
    const link=page.locator('#portal-link,.arcade-portal-back').first();await link[touch?'tap':'click']();await page.waitForURL(/(?:\/|\/index\.html)$/);
    records.push({kind:'nativePortalReturn',game:id,url:page.url()});
  }
}catch(error){records.push({kind:'reviewHarnessFailure',message:String(error),url:page.url(),training:await training(),runtime:await runtime()});throw error;}
finally{records.push({kind:'pageErrors',errors});await writeFile(`${out}/${device}-PRACTICE_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
