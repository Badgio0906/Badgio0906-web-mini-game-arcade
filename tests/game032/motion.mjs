import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out=process.env.GAME032_QA_OUT,base=process.env.GAME032_QA_URL??'http://127.0.0.1:4432';
if(!out)throw Error('Unique output required');await mkdir(out,{recursive:false});
const report={kind:'real-clock browser automated movement/cast/hook/reel motion; not human play or audio hearing',started_at:new Date().toISOString(),events:[],errors:[],post_attempts:0};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let context,page;
try{
context=await browser.newContext({viewport:{width:1280,height:900},recordVideo:{dir:out,size:{width:1280,height:900}}});
await context.route('**/*',async r=>{if(r.request().method()==='POST'){report.post_attempts++;await r.abort();}else await r.continue();});
page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(`${base}/game032.html`);const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);await page.locator('#practice').click();await page.locator('#river').focus();
const started=performance.now();await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(400);await page.keyboard.up('ArrowLeft');await page.keyboard.down('Space');await page.waitForTimeout(200);await page.keyboard.up('Space');
let holding=false,lastPhase;while(performance.now()-started<9000){const phase=await page.locator('#river').getAttribute('data-phase');if(phase!==lastPhase){report.events.push({at_ms:Math.round(performance.now()-started),phase});lastPhase=phase;}if(phase==='bite'){await page.keyboard.press('Enter');}if(phase==='fight'){const pulling=await page.locator('#river').getAttribute('data-pulling')==='true';if(!pulling&&!holding){await page.keyboard.down('Space');holding=true;report.events.push({at_ms:Math.round(performance.now()-started),action:'reel_down'});}if(pulling&&holding){await page.keyboard.up('Space');holding=false;report.events.push({at_ms:Math.round(performance.now()-started),action:'reel_release'});}}await page.waitForTimeout(50);}
if(holding)await page.keyboard.up('Space');report.gameplay_wall_ms=Math.round(performance.now()-started);const video=page.video();await context.close();report.video=await video.path();report.success=report.errors.length===0&&report.post_attempts===0;
}catch(e){report.success=false;report.failure=e.message;}
finally{report.finished_at=new Date().toISOString();await browser.close();await writeFile(path.join(out,'REPORT.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
