const base=process.env.MOBILE_REVIEW_BASE??'http://localhost:4182';
import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
for(const width of [320,390]){
 const page=await browser.newPage({viewport:{width,height:844}});await page.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));let errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/game022.html`);await page.locator('#challenge-button').click();
 const metrics=await page.evaluate(()=>{const a=document.querySelector('#board-scroll'), b=document.querySelector('#card-board');return {scroll:a.scrollWidth,client:a.clientWidth,board:b.getBoundingClientRect().width,last:[...b.querySelectorAll('.tableau-column')].at(-1).getBoundingClientRect().right,view:innerWidth,clock:document.querySelector('#elapsed').textContent,challenge:window.__game022.challenge}});
 if(metrics.scroll>metrics.client||metrics.last>width||!metrics.challenge||metrics.clock!=='3:00')throw Error(JSON.stringify(metrics));
 await page.screenshot({path:`${process.cwd()}/docs/game022/mobile-20261104/QA/${width}-challenge.png`,fullPage:true});
 await page.locator('#pause-button').click();await page.locator('#pause-title-button').click();await page.locator('#play-button').click();let saved=await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game022:session'));
 await page.locator('#title-button').click();saved=await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game022:session'));await page.locator('#challenge-button').click();if(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game022:session'))!==saved)throw Error('challenge overwrote standard save');
 await page.goto(`${base}/game025.html`);await page.locator('#play').click();const mineMetrics=await page.evaluate(()=>{const a=document.querySelector('#viewport');return{scroll:a.scrollWidth,client:a.clientWidth,right:document.querySelector('#board').getBoundingClientRect().right}});if(mineMetrics.scroll>mineMetrics.client||mineMetrics.right>width)throw Error(JSON.stringify(mineMetrics));
 let cell=page.locator('[data-cell="0"]');await cell.hover();await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();if(!(await page.evaluate(()=>window.__game025.flags[0])))throw Error('hold did not flag');
 await page.waitForTimeout(500);cell=page.locator('[data-cell="0"]');await cell.hover();await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();if(await page.evaluate(()=>window.__game025.flags[0]))throw Error('hold did not unflag');
 await page.locator('[data-cell="40"]').click();await page.waitForFunction(()=>window.__game025.opened.some(Boolean));
 await page.screenshot({path:`${process.cwd()}/docs/game025/mobile-20261104/QA/${width}-beginner.png`,fullPage:true});
 await page.locator('#title').click();await page.locator('#difficulty').selectOption('mini');await page.locator('#board-mode').selectOption('daily');await page.locator('#play').click();
 const daily=await page.evaluate(()=>({open:window.__game025.opened,day:window.__game025.dailyId,guaranteed:window.__game025.guaranteed}));if(daily.open.length!==36||!daily.guaranteed||!daily.open.some(Boolean))throw Error(JSON.stringify(daily));
 await page.screenshot({path:`${process.cwd()}/docs/game025/mobile-20261104/QA/${width}-mini-daily.png`,fullPage:true});
 await page.locator('#retry').click();const daily2=await page.evaluate(()=>({open:window.__game025.opened,day:window.__game025.dailyId,guaranteed:window.__game025.guaranteed}));if(JSON.stringify(daily)!==JSON.stringify(daily2))throw Error('daily not deterministic');
 console.log(JSON.stringify({width,metrics,mineMetrics,daily,errors}));if(errors.length)throw Error(errors.join(';'));await page.close();
}
await browser.close();
