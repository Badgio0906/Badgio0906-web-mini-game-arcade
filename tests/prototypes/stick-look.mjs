import { chromium } from '@playwright/test';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for (const [name,width,height] of [['desktop',1366,900],['laptop',1366,768],['phone',390,844],['small',320,568],['landscape',844,390]]) {
 const page = await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700});
 await page.goto('http://localhost:5173/prototype-stick.html');
 await page.screenshot({path:`docs/prototypes/stick-balance/QA/${name}-ready.png`});
 await page.click('#start'); await page.waitForTimeout(700);
 await page.screenshot({path:`docs/prototypes/stick-balance/QA/${name}-play.png`});
 console.log(name,await page.evaluate(()=>({body:document.body.scrollWidth,height:innerHeight,control:document.querySelector('.controls').getBoundingClientRect().bottom,state:window.__stick})));
 await page.close();
}
await browser.close();
