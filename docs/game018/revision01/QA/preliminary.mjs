import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report=[];
try {
 for(const profile of [{name:'desktop',width:1440,height:900},{name:'phone',width:390,height:844},{name:'small',width:320,height:640}]){
  const context=await browser.newContext({viewport:profile,hasTouch:profile.name!=='desktop',isMobile:profile.name!=='desktop'}),page=await context.newPage();const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5181/game018.html'); await page.screenshot({path:`docs/game018/revision01/QA/${profile.name}-title.png`});
  await page.locator('#play-button').click();await page.locator('#start-button').click();await page.waitForTimeout(650);await page.locator('#control-button').click();await page.waitForFunction(()=>document.querySelector('#app').dataset.phase==='spin');await page.waitForTimeout(230);await page.screenshot({path:`docs/game018/revision01/QA/${profile.name}-spin.png`});
  await page.locator('#control-button').click();await page.waitForFunction(()=>document.querySelector('#app').dataset.phase==='power');await page.waitForTimeout(620);await page.locator('#control-button').click();await page.waitForTimeout(250);await page.screenshot({path:`docs/game018/revision01/QA/${profile.name}-kick.png`});
  await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',{timeout:35000});await page.screenshot({path:`docs/game018/revision01/QA/${profile.name}-result.png`});
  report.push({profile:profile.name,errors,result:await page.locator('#result-score').textContent(),scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth)});
  await context.close();
 }
}finally{await browser.close();await writeFile('docs/game018/revision01/QA/preliminary.json',JSON.stringify(report,null,2));}
