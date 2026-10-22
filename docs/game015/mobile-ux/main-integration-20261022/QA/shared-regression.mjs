// Fixed local dev/preview server; no external requests or production telemetry.
import { chromium } from '/workspace/arcade-rain/node_modules/@playwright/test/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:5185';
const phase = process.env.AUDIT_PHASE ?? 'green';
const out = `/tmp/pr11-integration-20261022/${phase}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const results = [];
const sizes = { portrait: {width:390,height:844}, landscape: {width:844,height:390} };
const probe = page => page.evaluate(() => {
  const d = document.querySelector('#arcade-training'), play = document.querySelector('#play-button');
  const r = play?.getBoundingClientRect(), x = r ? r.x+r.width/2 : 0, y = r ? r.y+r.height/2 : 0;
  const hits = document.elementsFromPoint(x,y);
  return { open:d.open, display:getComputedStyle(d).display, rect:d.getBoundingClientRect().toJSON(),
    columns:getComputedStyle(d).gridTemplateColumns, phase:d.dataset.phase,
    playRect:r?.toJSON(), point:{x,y}, hits:hits.slice(0,8).map(e=>({tag:e.tagName,id:e.id,classes:e.className,insideDialog:d.contains(e)})),
    dialogBlocksPlay:d.contains(hits[0]), focus:document.activeElement?.id,
    appState:document.querySelector('#app').dataset.state,
    training:window.__tutorialDebug?.snapshot(), runtime:(window.__arcadeDebug??window.__orbitDebug)?.snapshot() };
});
for (const id of ['001','005']) for (const scenario of (process.env.AUDIT_EXTENDED ? ['landscape-success-title','landscape-success-play'] : ['portrait-close','landscape-close','rotate-close','closed-rotate','landscape-escape','portrait-escape','success-title','success-then-play'])) {
  if(process.env.AUDIT_SCENARIO && scenario!==process.env.AUDIT_SCENARIO) continue;
  const context = await browser.newContext({viewport:scenario.startsWith('landscape')?sizes.landscape:sizes.portrait,hasTouch:true,isMobile:true});
  await context.route('**/*', route => route.request().url().startsWith(base+'/') && ['GET','HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
  await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
  const page=await context.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const result={id,scenario,errors};
  try {
    await page.goto(`${base}/game${id}.html`);
    await page.locator('#tutorial-again-button').tap();
    if(scenario==='rotate-close') await page.setViewportSize(sizes.landscape);
    result.open=await probe(page);
    if(scenario==='rotate-close') await page.screenshot({path:`${out}/game${id}-open-landscape.png`});
    if(!result.open.open || (page.viewportSize().width>501 && result.open.display!=='grid')) throw Error('Open practice layout lost');
    if(scenario.includes('success')) {
      if(id==='001') await page.locator('[data-practice-action="action"]').tap();
      else {await page.locator('[data-practice-action="left"]').tap(); await page.locator('[data-practice-action="right"]').tap();}
      await page.locator('#tutorial-start-button').waitFor({timeout:8000});
      result.successLabel=await page.locator('#tutorial-start-button').textContent();
      await page.locator('#tutorial-start-button').tap();
    } else if(scenario.endsWith('escape')) await page.keyboard.press('Escape');
    else await page.locator('#tutorial-close-button').tap();
    if(scenario==='closed-rotate') await page.setViewportSize(sizes.landscape);
    result.closed=await probe(page);
    if(scenario==='rotate-close'||scenario==='portrait-close') await page.screenshot({path:`${out}/game${id}-${scenario}.png`});
    if(result.closed.open || result.closed.display!=='none'||result.closed.rect.width!==0||result.closed.dialogBlocksPlay) throw Error('Closed dialog remains visible or intercepts taps');
    if(result.closed.training?.active) throw Error('Practice remains active');
    if(result.closed.focus!=='tutorial-again-button') throw Error('Focus was not restored to practice trigger');
    if(scenario.endsWith('success-title')) {
      if(result.closed.appState!=='title') throw Error('Success should return to title');
      await page.locator('#tutorial-again-button').tap();
      await page.locator('#tutorial-close-button').tap();
      result.reopened=await probe(page);
      if(result.reopened.display!=='none') throw Error('Reopened practice failed to close');
    }
    await page.locator('#play-button').tap({timeout:1800});
    await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='playing',{},{timeout:2500});
    result.started=await probe(page);
    if(id==='001') result.laneBefore=await page.locator('#lane-value').textContent();
    // Actual post-practice input, no model setters or time manipulation.
    if(id==='001') {await page.keyboard.press('Space'); await page.waitForTimeout(80);}
    else {
      await page.waitForFunction(()=>document.querySelector('#app').dataset.phase==='sorting');
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(()=>document.querySelector('#app').dataset.phase!=='sorting',{},{timeout:800});
    }
    result.afterInput=await probe(page);
    if(id==='001') {
      result.laneAfter=await page.locator('#lane-value').textContent();
      if(result.laneBefore===result.laneAfter) throw Error('Real orbit HUD did not respond to input');
    }
    if(id==='001'&&result.started.runtime&&result.started.runtime.lane===result.afterInput.runtime.lane) throw Error('Real orbit input did not change lane');
    const back=page.locator('.arcade-portal-back').first();
    await back.tap(); await page.waitForURL(`${base}/index.html`);
    if(errors.length) throw Error('JavaScript exceptions');
    result.pass=true;
  } catch(e) {
    result.pass=false;result.failure=e.message;
    if(result.closed && result.closed.display!=='none') {
      try {await page.locator('#play-button').tap({timeout:1800});result.blockedStart=await probe(page);}
      catch(startError) {result.startFailure=startError.message;result.blockedStart=await probe(page);}
    }
  }
  results.push(result); console.log(`${id} ${scenario}: ${result.pass?'PASS':result.failure}`);
  await context.close();
}
await browser.close();
const record={phase,base,cssSha256:createHash('sha256').update(readFileSync('src/arcade/onboarding.css')).digest('hex'),results};
writeFileSync(`${out}/results.json`,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length}));
if(results.some(x=>!x.pass)) process.exitCode=1;
