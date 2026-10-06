import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/seven-games-2026-10-06/game006/QA/smoke';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const report=[];
for(const [name,width,height,mobile] of [['desktop',1440,900,false],['phone',390,844,true],['narrow',320,568,true],['landscape',844,390,true]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5206/game006.html');await page.waitForFunction(()=>window.__arcadeDebug);await page.screenshot({path:`${out}/${name}-title.png`});
 const title=await page.locator('#play-button,#tutorial-explain-button,#tutorial-again-button,.arcade-portal-back,#mute-button').evaluateAll(es=>es.map(e=>({id:e.id||e.className,text:e.textContent,rect:e.getBoundingClientRect().toJSON()})));
 await page.locator('#tutorial-again-button').click();await page.waitForTimeout(200);await page.screenshot({path:`${out}/${name}-practice.png`});
 await page.locator('#brand-button').click();await page.locator('#play-button').click();await page.waitForTimeout(200);await page.screenshot({path:`${out}/${name}-playing.png`});
 report.push({name,title,errors,snapshot:await page.evaluate(()=>window.__arcadeDebug.inspection())});await context.close();
}
await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
