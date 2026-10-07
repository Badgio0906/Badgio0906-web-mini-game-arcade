import { chromium } from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
const out = 'docs/game020/QA/independent';
const sources = ['src/games/game020/PairBoard.ts','src/games/game020/main.ts','src/games/game020/style.css','src/games/game020/icons.ts','game020.html'];
const hashes = Object.fromEntries(sources.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const evidence = {reviewer:'pair020_review',started_at:new Date().toISOString(),source_hashes:hashes,measurements:[],operations:[],pageerrors:[]};
for (const [name,w,h,touch] of [['pc',1365,900,false],['phone',390,844,true],['small',320,740,true],['landscape',844,390,true]]) {
 const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch});
 await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await context.route('**/*',async route=>{const url=new URL(route.request().url()); if(url.hostname==='127.0.0.1') await route.continue(); else await route.abort();});
 const page=await context.newPage(); page.on('pageerror',e=>evidence.pageerrors.push({viewport:name,message:e.message}));
 const click=async s=>touch?await page.locator(s).tap():await page.locator(s).click();
 await page.goto('http://127.0.0.1:5420/game020.html');
 await page.screenshot({path:`${out}/${name}-title.png`,fullPage:true});
 await click('#play-button');
 const initial=await page.evaluate(()=>window.__game020);
 if(initial.remaining!==24)throw new Error('Expected 24');
 await page.screenshot({path:`${out}/${name}-24.png`,fullPage:true});
 const measures=await page.evaluate(()=>({viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],tiles:[...document.querySelectorAll('.tile')].map(e=>{const r=e.getBoundingClientRect(); return {id:e.dataset.tileId,free:e.dataset.free,x:r.x,y:r.y,w:r.width,h:r.height};}),controls:[...document.querySelectorAll('.controls button')].map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}));
 evidence.measurements.push({name,stage:'24',...measures});
 await click('#hint-button'); const hinted=await page.locator('.tile[data-hint="true"]').evaluateAll(es=>es.map(e=>e.dataset.tileId));
 await click(`[data-tile-id="${hinted[0]}"]`); await page.screenshot({path:`${out}/${name}-selected-hint.png`,fullPage:true});
 await click(`[data-tile-id="${hinted[1]}"]`); await page.waitForTimeout(170);
 if(await page.locator('#remaining-value').textContent()!=='22')throw new Error('Pair did not remove');
 await click('#undo-button'); if(await page.locator('#remaining-value').textContent()!=='24')throw new Error('Undo failed');
 await click('#shuffle-button');
 await click('#pause-button'); await click('#resume-button');
 await click('#next-button'); await click('#cancel-button');
 if(await page.locator('#remaining-value').textContent()!=='24')throw new Error('Cancel changed tiles');
 evidence.operations.push({viewport:name,pair:true,undo:true,shuffle:true,pause_resume:true,next_cancel:true});
 if(name==='pc') {
  await page.locator('.tile[data-free="true"]').first().focus(); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
  const state=await page.evaluate(()=>window.__game020); evidence.operations.push({viewport:name,keyboard_enter_arrow_space:true,remaining:state.remaining,selected:state.selected});
 }
 // Finish using visible hint UI and ordinary input only.
 let cleared=0;
 while(await page.locator('#app').getAttribute('data-state')==='playing') {
  await click('#hint-button'); const ids=await page.locator('.tile[data-hint="true"]').evaluateAll(es=>es.map(e=>e.dataset.tileId));
  if(ids.length!==2)throw new Error('No solution hint');
  // Clear an existing selection before following the suggested pair.
  const selected=await page.locator('.tile[aria-pressed="true"]').count(); if(selected) await click('.tile[aria-pressed="true"]');
  await click(`[data-tile-id="${ids[0]}"]`); await click(`[data-tile-id="${ids[1]}"]`); await page.waitForTimeout(170); if(++cleared>24)throw new Error('Loop');
 }
 await page.screenshot({path:`${out}/${name}-clear.png`,fullPage:true});
 evidence.operations.push({viewport:name,full_clear:true,clear_pairs:cleared});
 await click('#clear-title-button'); await page.locator('#size-choice').selectOption('regular'); await click('#play-button');
 await page.screenshot({path:`${out}/${name}-48.png`,fullPage:true});
 evidence.measurements.push({name,stage:'48',...(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],remaining:window.__game020.remaining})))});
 await click('#pause-button'); await click('#pause-title-button'); await click('#practice-button');
 const before=await page.evaluate(()=>({best:window.__game020.best,clears:window.__game020.clears}));
 for(let i=0;i<4;i++){ await click('#hint-button');const ids=await page.locator('.tile[data-hint="true"]').evaluateAll(es=>es.map(e=>e.dataset.tileId));await click(`[data-tile-id="${ids[0]}"]`);await click(`[data-tile-id="${ids[1]}"]`);await page.waitForTimeout(170);}
 const after=await page.evaluate(()=>({best:window.__game020.best,clears:window.__game020.clears,state:window.__game020.state}));
 if(before.best!==after.best||before.clears!==after.clears||after.state!=='result')throw new Error('Practice changed best or failed');
 evidence.operations.push({viewport:name,practice_clear:true,before,after});
 await context.close();
}
evidence.ended_at=new Date().toISOString();
const endHashes=Object.fromEntries(sources.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
evidence.source_frozen=JSON.stringify(hashes)===JSON.stringify(endHashes);evidence.end_source_hashes=endHashes;
fs.writeFileSync(`${out}/browser.json`,JSON.stringify(evidence,null,2)); await browser.close();
console.log(JSON.stringify({viewports:4,source_frozen:evidence.source_frozen,pageerrors:evidence.pageerrors.length}));
