import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:320,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
let release;const gate=new Promise(r=>release=r);await page.route('**/mobile-assets/peace.webp',async route=>{await gate;await route.continue();});
await page.goto('http://localhost:5187/games/finger-heart-challenge/index.html',{waitUntil:'domcontentloaded'});await page.locator('#play').click();
if(await page.locator('#stop').isVisible())throw Error('Stop enabled before pose decoded');
await page.screenshot({path:'docs/game014/mobile-20261104/QA/delayed-pose-loading.png'});release();await page.locator('#stop').waitFor({state:'visible'});const actual=await page.locator('#hand').getAttribute('src');if(!actual.endsWith('/peace.webp'))throw Error('First judged pose differs from displayed sprite');await page.keyboard.press('Space');await page.getByText('RANK D · 0点',{exact:true}).waitFor();
await fs.writeFile('docs/game014/mobile-20261104/QA/delayed-images.json',JSON.stringify({loadingControlHidden:true,firstDisplayedPose:actual,wrongPoseEnds:true,errors},null,2));console.log('delayed sprite guard passed');await browser.close();
