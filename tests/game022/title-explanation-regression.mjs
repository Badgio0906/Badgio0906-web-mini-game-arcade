// Native-input persistence regression; compares saved identity in memory without writing IDs to reports.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base=process.env.GAME022_BASE_URL??'http://127.0.0.1:4022/';
const output=resolve(process.env.GAME022_REGRESSION_REPORT??'/workspace/arcade-classic-five/docs/game022/QA/independent/title-explanation-browser');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
try {
 for(const origin of ['title','restored-run'])for(const exit of ['reload','portal']){
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
  await context.route(/google-analytics\.com|googletagmanager\.com|analytics\.game100garage\.com|pagead2\.googlesyndication\.com/,r=>r.fulfill({status:200,body:''}));
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(new URL('game022.html',base).href);
  await page.selectOption('#draw-mode','3');await page.locator('#play-button').click();
  await page.locator('#stock-button').click();await page.locator('#stock-button').click();
  // Runtime observer owns this UUID; comparisons stay in test-process memory and reports omit it.
  const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game022:session')));
  await page.reload();
  if(origin==='restored-run'){await page.locator('#resume-saved-button').click();await page.locator('#help-button').click();}else await page.locator('#explain-button').click();
  await page.screenshot({path:resolve(output,`${origin}-${exit}-explanation.png`)});
  if(exit==='reload')await page.reload();else{await page.locator('#menu-portal-link').click();await page.waitForURL(/index\.html/);}
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game022:session')));
  const validOriginalRun= /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(original.snapshot.analytics_run_id);
  results.push({origin,exit,validOriginalRun,seedPreserved:original.snapshot.seed===after.snapshot.seed,runIdPreserved:original.snapshot.analytics_run_id===after.snapshot.analytics_run_id,positionPreserved:JSON.stringify(original.snapshot.position)===JSON.stringify(after.snapshot.position),historyPreserved:JSON.stringify(original.snapshot.history)===JSON.stringify(after.snapshot.history),savedDraw:after.snapshot.draw,originalMoves:original.snapshot.position.moves,afterMoves:after.snapshot.position.moves,errors});
  await context.close();
 }
}finally{await browser.close();await writeFile(resolve(output,'report.json'),JSON.stringify({at:new Date().toISOString(),base,provenance:'independent native inputs; no source/model mutation; generated run identities compared only in memory',results},null,2)+'\n');}
console.log(JSON.stringify({results:results.map(r=>({origin:r.origin,exit:r.exit,preserved:r.seedPreserved&&r.runIdPreserved&&r.positionPreserved&&r.historyPreserved,errors:r.errors.length}))}));
if(results.some(r=>!r.validOriginalRun||!r.seedPreserved||!r.runIdPreserved||!r.positionPreserved||!r.historyPreserved||r.errors.length))process.exitCode=1;
