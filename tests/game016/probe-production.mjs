import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {prefix,losingHand,keys,button,errorCollector,geometry,fixedPads} from './helpers.mjs';
// Run only on Root's final build and exclusive browser handoff. DOM observations only.
const mounts=(process.env.GAME016_STATIC_URLS??'http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/').split(','),report=process.env.GAME016_PRODUCTION_REPORT??'docs/game016/QA/PRODUCTION_PROBE.json';
const records=[];let failure=null;
await mkdir(dirname(report),{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 for(const base of mounts)for(const touch of [false,true]){
  const context=await browser.newContext({viewport:touch?{width:390,height:844}:{width:1440,height:900},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=errorCollector(page);const bodies=new Map(),jobs=[];let collectingBodies=true;
  page.on('response',r=>{const url=r.url(),type=r.request().resourceType();if(!collectingBodies||!url.startsWith('http')||bodies.has(url)||!['script','font','image'].includes(type))return;bodies.set(url,{url,type,status:r.status()});jobs.push(r.body().then(body=>{Object.assign(bodies.get(url),{bytes:body.length,phaser:type==='script'&&/Phaser\.Game|Phaser v3|\bPhaser\b/.test(body.toString())});}).catch(e=>{errors.push({url,bodyError:e.message});}));});
  try {
   await page.addInitScript(prefix=>localStorage.setItem(prefix+'credits','0'),prefix);
   const response=await page.goto(base);assert.equal(response.status(),200);await page.locator('.game-card').first().waitFor();assert.equal(await page.locator('.game-card').count(),16);
   await page.locator('.game-card[data-game-id="game016"]').scrollIntoViewIfNeeded();await page.waitForLoadState('networkidle');await Promise.all(jobs);await button(page,'.game-card[data-game-id="game016"]',touch);await page.locator('#play-button').waitFor({state:'visible'});assert.equal(new URL(page.url()).pathname,new URL('game016.html',base).pathname);
   const title=await geometry(page,['#play-button','#tutorial-again-button','#mute-button','.arcade-portal-back']);
   await button(page,'#play-button',touch);await button(page,'#tutorial-practice-button',touch);const practicePads=await fixedPads(page);
   for(const opponent of ['rock','scissors','paper'])await button(page,`#${losingHand[opponent]}-button`,touch);
   await button(page,'#tutorial-start-button',touch);await page.locator('#app[data-state="playing"] #opponent-hand').waitFor();const playing=await fixedPads(page);
   const opponent=await page.locator('#opponent-hand .hand-visual').getAttribute('data-hand');assert.ok(losingHand[opponent]);if(touch)await button(page,`#${losingHand[opponent]}-button`,true);else await page.keyboard.press(keys[losingHand[opponent]]);
   await page.waitForFunction(()=>document.querySelector('#score-value').textContent==='100');
   await button(page,'#pause-button',touch);await page.locator('#app[data-state="paused"]').waitFor();const paused=await geometry(page,['#resume-button','#title-button']);
   const hooks=await page.evaluate(()=>Object.keys(window).filter(k=>/^__(arcade|tutorial|orbit|fingerHeart)/.test(k)));assert.deepEqual(hooks,[]);
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.waitForLoadState('networkidle');await Promise.all(jobs);collectingBodies=false;
   const resources=[...bodies.values()],gameImages=resources.filter(r=>/assets\/game016\/hand-/.test(r.url));assert.equal(gameImages.length,3);assert.ok(gameImages.every(r=>r.status===200&&r.bytes>0));assert.ok(resources.some(r=>r.type==='font'&&r.bytes>0));assert.ok(!resources.some(r=>r.phaser),'native Game016 must not load Phaser');assert.ok(resources.filter(r=>r.type==='script').reduce((s,r)=>s+r.bytes,0)<=300000,'portal+Game016 unique JS budget');
   const saved=await page.evaluate(prefix=>({completed:localStorage.getItem(prefix+'tutorialCompleted'),credits:localStorage.getItem(prefix+'credits')}),prefix);assert.deepEqual(saved,{completed:'true',credits:'0'});
   await page.reload();await page.locator('#play-button').waitFor();await button(page,'#play-button',touch);await page.locator('#app[data-state="playing"] #opponent-hand').waitFor();await button(page,'#pause-button',touch);await button(page,'.arcade-portal-back',touch);await page.locator('.game-card').first().waitFor();assert.equal(await page.locator('.game-card').count(),16);await page.reload();await page.locator('.game-card').first().waitFor();assert.equal(await page.locator('.game-card').count(),16);assert.equal(context.pages().length,1);assert.deepEqual(errors,[]);
   records.push({base,touch,title,practicePads,playing,paused,opponent,saved,hooks,resources,errors});console.log(`${base} ${touch?'touch':'keyboard'} portal→real practice→correct→reload→return PASS`);
  }catch(e){await page.screenshot({path:report.replace(/\.json$/,'')+`-FAIL-${Date.now()}.png`}).catch(()=>{});throw e;}finally{await context.close();}
 }
}catch(e){failure={message:e.message,stack:e.stack};throw e;}finally{await browser.close();await writeFile(report,JSON.stringify({checkedUtc:new Date().toISOString(),status:failure?'failed':'passed',failure,records,limits:'Native inputs and public DOM; no production debug hooks or state writes. Storage credits0 fixture only. Resource bytes are unique URLs across portal+first game load, separate from Root per-route first-load accounting.'},null,2)+'\n');}
