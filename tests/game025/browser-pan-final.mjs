import { chromium } from '@playwright/test';
import fs from 'node:fs';
const dir=process.env.GAME025_QA_DIR??'docs/game025/QA/browser-pan-final';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];const base=process.env.GAME025_BASE??'http://127.0.0.1:4173';
try {
for(const viewport of [{width:1365,height:900},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width<900});await context.route(/analytics\.game100garage\.com|google-analytics\.com|googletagmanager\.com|pagead2\.googlesyndication\.com/,r=>r.fulfill({status:200,body:''}));const page=await context.newPage();page.setDefaultTimeout(8000);const activate=target=>viewport.width<900?target.tap():target.click();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/game025.html');
 await page.locator('#analytics-settings-host').locator('#deny').click();await page.screenshot({path:`${dir}/${viewport.width}-title.png`,fullPage:true});
 await page.locator('#play').click();const beginnerSize=await page.locator('[data-cell="0"]').boundingBox();if(beginnerSize.width<44||beginnerSize.height<44)throw Error('tiny beginner');await activate(page.locator('[data-cell="40"]'));await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='playing');
 await page.locator('#flag-tool').click();const unopened=page.locator('.cell[data-open="false"]').first();const flagCell=await unopened.getAttribute('data-cell');await activate(unopened);if(await page.locator('.cell[data-flag="true"]').count()!==1)throw Error('flag');
 await page.locator('#hint').click();await page.screenshot({path:`${dir}/${viewport.width}-beginner.png`,fullPage:true});
 await page.locator('#pause').click();if(!(await page.locator('#board').evaluate(e=>e.inert)))throw Error('pause inert');await page.screenshot({path:`${dir}/${viewport.width}-pause.png`,fullPage:true});await page.locator('#resume').click();
 await page.reload();await page.locator('#restore').click();if(await page.locator('#app').getAttribute('data-state')!=='paused')throw Error('restore not paused');await page.locator('#resume').click();if(await page.locator(`[data-cell="${flagCell}"]`).getAttribute('data-flag')!=='true')throw Error('lost flags');
 await page.locator('#title').click();await page.locator('#practice').click();await activate(page.locator('[data-cell="40"]'));await activate(page.locator('[data-cell="40"]'));await page.locator('#open-tool').click();await activate(page.locator('[data-cell="40"]'));if(!(await page.locator('#status').textContent()).includes('練習できました'))throw Error('practice');await page.screenshot({path:`${dir}/${viewport.width}-practice.png`,fullPage:true});
 await page.locator('#title').click();await page.locator('#difficulty').selectOption('intermediate');await page.locator('#play').click();await activate(page.locator('[data-cell="0"]'));await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='playing');
 const size=await page.locator('[data-cell="0"]').boundingBox();if(size.width<44||size.height<44)throw Error('tiny intermediate');const overflow=await page.locator('#viewport').evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth}));
 await page.screenshot({path:`${dir}/${viewport.width}-intermediate.png`,fullPage:true});
 await page.locator('#mute').click();await page.locator('#pause').click();await page.locator('#resume').click();
 const current=await page.locator('.cell').first().getAttribute('data-cell');await page.locator(`[data-cell="${current}"]`).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('f');await page.keyboard.press('f');await page.keyboard.press('Space');
 await page.locator('#title').click();await page.locator('#play').click();await page.locator('[data-cell="0"]').dispatchEvent('pointerdown',{pointerId:1,isPrimary:true,button:0,clientX:0,clientY:0,pointerType:'touch'});await page.locator('[data-cell="0"]').dispatchEvent('pointercancel',{pointerId:1});await page.locator('[data-cell="0"]').dispatchEvent('pointerup',{pointerId:1,isPrimary:true,button:0,clientX:0,clientY:0,pointerType:'touch'});if(await page.locator('#opened').textContent()!=='0')throw Error('cancel opened');
 await activate(page.locator('[data-cell="0"]'));await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='playing');
 for(let attempt=0;attempt<256&&await page.locator('#app').getAttribute('data-state')==='playing';attempt++){const unopened=page.locator('.cell[data-open="false"][data-flag="false"]').first();await activate(unopened);}
 if(await page.locator('#app').getAttribute('data-state')!=='result')throw Error('no terminal outcome');await page.screenshot({path:`${dir}/${viewport.width}-result.png`,fullPage:true});
 await page.locator('#next').click();if(await page.locator('#opened').textContent()!=='0')throw Error('retry');
 if(errors.length)throw Error(errors.join('\n'));results.push({viewport,firstOpen:true,flags:true,hint:true,restorePaused:true,practice:true,cellInput:viewport.width<900?'native tap':'native mouse',beginnerCellWidth:beginnerSize.width,intermediateCellWidth:size.width,overflow,keyboard:true,pointercancel:true,nativeOutcome:true,retry:true,pageErrors:errors});await context.close();
}
fs.writeFileSync(`${dir}/report.json`,JSON.stringify({base,executedAt:new Date().toISOString(),provenance:'compiled Playwright native input, no state injection; pointercancel synthetic event boundary',results},null,2));console.log(JSON.stringify(results));

} finally { await browser.close(); }
