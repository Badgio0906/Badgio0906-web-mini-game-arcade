import{chromium}from'@playwright/test';import{writeFile}from'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1920,height:1080}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const proof={normalInputOnly:true,seededCredits:false,forcedEnd:false,readonlyInspection:true,humanSkillEvidence:false,baseUrl:'http://127.0.0.1:5178'};
try{
 await page.goto('http://127.0.0.1:5178/game008.html');await page.locator('#play-button').click();await page.keyboard.down('ArrowRight');
 await page.waitForFunction(()=>window.__arcadeDebug.state()==='result',null,{timeout:60000});await page.keyboard.up('ArrowRight');await page.waitForTimeout(350);
 Object.assign(proof,await page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),credit:document.querySelector('#credit-count').textContent,meters:[...document.querySelectorAll('.cup-meter')].map(e=>({name:e.querySelector('span').textContent,percent:e.querySelector('strong').textContent,empty:e.classList.contains('is-empty'),color:getComputedStyle(e.querySelector('strong')).color})),receipt:document.querySelector('.result-note').innerText,events:window.__arcadeDebug.telemetry()})));
 await page.screenshot({path:'docs/ten-game/screenshots/game008/desktop-final-native-empty-meter.png'});
 if(proof.inspection.cups[0].remaining!==0||proof.meters[0].percent!=='0%'||!proof.meters[0].empty||proof.credit!=='2')throw Error('Actual empty meter does not match result/credit');proof.pass=true;
}catch(error){proof.pass=false;proof.failure=String(error);throw error;}finally{proof.errors=errors;await writeFile('docs/ten-game/screenshots/game008/EMPTY_METER_NATIVE_RECHECK.json',JSON.stringify(proof,null,2)+'\n');await context.close();await browser.close();}
