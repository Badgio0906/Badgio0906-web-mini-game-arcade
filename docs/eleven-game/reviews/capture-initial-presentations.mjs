import { chromium } from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.ARCADE_REVIEW_URL??'http://localhost:5181';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});const records=[];
try{
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});const kind=viewport.width>700?'desktop':'mobile';
 for(const n of [7,8,10,11]){
  const id=`game${String(n).padStart(3,'0')}`;const folder=`docs/eleven-game/screenshots/${id}`;mkdirSync(folder,{recursive:true});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/${id}.html`);await page.locator('#play-button').click();await page.locator('#tutorial-practice-button').click();
  if(n===7){await page.locator('[data-practice-action="board"]').click();await page.waitForTimeout(1300);await page.locator('[data-practice-action="reject"]').click();}
  if(n===8){await page.keyboard.down('ArrowRight');await page.locator('#arcade-training[data-phase="success"]').waitFor();await page.keyboard.up('ArrowRight');}
  if(n===10){await page.locator('[data-practice-action="action"]').click();await page.waitForTimeout(1850);await page.locator('[data-practice-action="action"]').click();}
  if(n===11)await page.locator('[data-practice-action="unko"]').click();
  await page.locator('#tutorial-start-button').click();await page.locator('#app[data-state="playing"]').waitFor();await page.waitForTimeout(150);
  await page.screenshot({path:`${folder}/${kind}-gameplay.png`});await page.locator('#stage').screenshot({path:`${folder}/${kind}-stage.png`});
  records.push({id,viewport,errors,phase:await page.locator('#app').getAttribute('data-state'),stage:await page.locator('#stage').boundingBox(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 await page.close();
}
writeFileSync('docs/eleven-game/screenshots/initial-capture.json',JSON.stringify(records,null,2));console.log(JSON.stringify(records));
}finally{await browser.close();}
