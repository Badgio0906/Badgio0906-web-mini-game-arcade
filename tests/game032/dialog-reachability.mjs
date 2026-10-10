import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out=process.env.GAME032_QA_OUT,base=process.env.GAME032_QA_URL??'http://127.0.0.1:4432';if(!out)throw Error('Unique output required');await mkdir(out,{recursive:false});
const report={kind:'independent dialog scrolling and actual button reachability',started_at:new Date().toISOString(),observations:[],errors:[],post_attempts:0};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let page;
try{
for(const v of [{name:'pc',width:1280,height:900},{name:'phone',width:390,height:844},{name:'small',width:320,height:740},{name:'landscape',width:844,height:390}].filter(v=>!process.env.GAME032_QA_ONLY_PC||v.name==='pc')){
const context=await browser.newContext({viewport:v,hasTouch:v.name!=='pc'});await context.route('**/*',async r=>{if(r.request().method()==='POST'){report.post_attempts++;await r.abort();}else await r.continue();});page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(`${base}/game032.html`);const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);await page.locator('#explain').click();
await page.locator('#menu').evaluate(m=>m.scrollTop=m.scrollHeight);await page.screenshot({path:path.join(out,`${v.name}-help-scrolled.png`),fullPage:true});
const targets=await page.evaluate(()=>['practice','play','back','menu-portal'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {id,rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom},withinViewport:r.y>=0&&r.bottom<=innerHeight,centerHit:!!hit&&(hit===e||e.contains(hit)),centerTarget:hit?.closest('button,a')?.id??hit?.tagName??null};}));
const note={viewport:v,targets,actualPractice:null};report.observations.push(note);
if(targets.find(t=>t.id==='practice').centerHit){try{if(v.name==='pc')await page.locator('#practice').click({timeout:2000});else await page.locator('#practice').tap({timeout:2000});note.actualPractice=await page.locator('#app').getAttribute('data-state');}catch(e){note.actualPracticeError=e.message;}}
if(process.env.GAME032_QA_RETURN&&note.actualPractice==='practice'){await page.locator('#pause').click();await page.locator('#pause-title').click();await page.locator('#explain').click();await page.locator('#menu').evaluate(m=>m.scrollTop=m.scrollHeight);await page.screenshot({path:path.join(out,`${v.name}-help-before-return.png`),fullPage:true});if(v.name==='pc')await page.locator('#menu-portal').click({timeout:2000});else await page.locator('#menu-portal').tap({timeout:2000});await page.waitForURL(/(?:index\.html|\/)$/,{timeout:2000});note.actualPortal=!page.url().includes('game032');await page.screenshot({path:path.join(out,`${v.name}-actual-portal-return.png`),fullPage:true});}
await context.close();
}
report.success=report.observations.every(o=>o.targets.every(t=>t.withinViewport&&t.centerHit)&&o.actualPractice==='practice'&&(!process.env.GAME032_QA_RETURN||o.actualPortal===true))&&report.errors.length===0&&report.post_attempts===0;
}catch(e){report.success=false;report.failure=e.message;}
finally{report.finished_at=new Date().toISOString();if(!report.success)process.exitCode=1;await browser.close();await writeFile(path.join(out,'REPORT.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
