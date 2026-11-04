import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const reports=[];
for(const [width,height] of [[390,844],[320,720],[1280,900]]){
 const context=await browser.newContext({viewport:{width,height}}); await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5536/game023.html');await page.waitForTimeout(220);await page.locator('#play-button').click();await page.waitForTimeout(220);
 const layout=await page.evaluate(()=>({keys:document.querySelectorAll('[data-kana]').length,bottom:document.querySelector('#keyboard').getBoundingClientRect().bottom,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight}));
 assert.equal(layout.keys,46);assert.equal(layout.scrollWidth,width);assert.ok(layout.bottom<=height,JSON.stringify(layout));
 await page.screenshot({path:`docs/game023/mobile-20261104/QA/${width}-playing.png`});
 const answerId=await page.evaluate(()=>window.__game023.question.word_id);
 // Word text comes from the scoped source, while inputs use normal visible controls.
 // Node cannot load TypeScript in older runtimes: use Vite's module URL to inspect immutable content.
 const reading=await page.evaluate(async id=>(await import('/src/games/game023/words.ts')).wordById.get(id).reading,answerId);
 for(const kana of new Set(reading)){
  const group=await page.evaluate(async kana=>(await import('/src/games/game023/words.ts')).kanaGroups.findIndex(g=>g.keys.includes(kana)),kana);
  await page.locator(`[data-group="${group}"]`).click();await page.locator(`[data-kana="${kana}"]`).click();
 }
 await page.waitForSelector('#next-button');const result=await page.evaluate(()=>window.__game023.round);assert.equal(result.index,1);assert.equal(result.solved,1);assert.ok(result.score>0);
 await page.reload();await page.waitForTimeout(230);assert.deepEqual(await page.evaluate(()=>window.__game023.round),result);
 await page.locator('#next-button').click();assert.equal(await page.evaluate(()=>window.__game023.round.index),2);
 reports.push({game:'023',width,height,layout,result,errors});assert.deepEqual(errors,[]);
 await page.goto('http://127.0.0.1:5536/game020.html');await page.locator('#attack-choice').check();await page.locator('#play-button').click();
 assert.equal(await page.locator('.tile').count(),12);await page.screenshot({path:`docs/game020/mobile-20261104/QA/${width}-mini.png`});
 while(await page.locator('.tile').count()){
  const pair=await page.evaluate(async ()=>(await import('/src/games/game020/PairBoard.ts')).solve(window.__game020.tiles)?.[0]);
  assert.ok(pair);for(const id of pair)await page.locator(`[data-tile-id="${id}"]`).click();await page.waitForTimeout(140);
 }
 assert.ok((await page.locator('#menu').innerText()).includes('点'));const challenge=await page.evaluate(()=>window.__game020.challenge);assert.ok(challenge.score>=600);
 reports.push({game:'020',width,height,challenge,errors});assert.deepEqual(errors,[]);await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));const page=await context.newPage();
await page.clock.install();await page.goto('http://127.0.0.1:5536/game020.html');await page.locator('#attack-choice').check();await page.locator('#play-button').click();
await page.clock.runFor(1000);await page.locator('#pause-button').click();const before=await page.evaluate(()=>window.__game020.elapsed);await page.clock.fastForward(90000);assert.equal(await page.evaluate(()=>window.__game020.state),'paused');assert.equal(await page.evaluate(()=>window.__game020.elapsed),before);
await page.locator('#resume-button').click();await page.clock.fastForward(60000);assert.equal(await page.evaluate(()=>window.__game020.state),'result');assert.ok((await page.locator('#menu').innerText()).includes('タイムアップ'));reports.push({game:'020',timerPauseAndExpiry:true});await context.close();
await writeFile('docs/game023/mobile-20261104/QA/browser.json',JSON.stringify({reports,syntheticBrowser:true,physicalDevice:false},null,2));await browser.close();console.log(JSON.stringify(reports));
