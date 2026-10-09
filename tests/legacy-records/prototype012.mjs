import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
const out=process.env.LEGACY_QA_OUT;if(!out)throw Error('unique LEGACY_QA_OUT required');await mkdir(out,{recursive:false});
const report={at:new Date().toISOString(),source:'012 full source export with exact Godot4.5.1',provenance:'Isolated compiled build on simulated production origin, ordinary native Enter/touch, existing before build from pinned arcade HEAD. No external POST; automation records are not production.',checks:[],notifications:[],errors:[],posts:0};
const check=(pass,name,details={})=>{report.checks.push({name,pass:!!pass,...details});if(!pass)throw Error(name);};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});let page;
const media={'.html':'text/html','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.png':'image/png','.webp':'image/webp','.json':'application/json','.woff2':'font/woff2'};
try{
 const context=await browser.newContext({viewport:{width:1300,height:900}});page=await context.newPage();let before=true;
 await context.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');window.__nativeObserved=[];window.addEventListener('message',e=>{if(e.data?.channel==='game100-native-record')window.__nativeObserved.push(e.data);});});
 await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(req.method()==='POST'){report.posts++;return route.abort();}if(url.origin!=='https://game100garage.com')return route.abort();try{
   const relative='public'+url.pathname;const body=before&&url.pathname.startsWith('/games/yokodori-days/')?execFileSync('git',['show','488916c:'+relative],{maxBuffer:48*1024*1024}):await readFile(resolve('dist','.'+decodeURIComponent(url.pathname)));
   await route.fulfill({body,contentType:media[extname(url.pathname)]||'application/octet-stream'});
 }catch{return route.fulfill({status:404,body:'not in fixture'});}});
 page.on('pageerror',e=>report.errors.push(e.message));
 const boot=async()=>{await page.goto('https://game100garage.com/games/yokodori-days/index.html');await page.getByRole('button',{name:'すぐ遊ぶ',exact:true}).click();const f=page.frameLocator('#legacy-game-frame');await f.locator('#status').waitFor({state:'hidden',timeout:45000});await f.locator('#canvas').focus();await page.waitForTimeout(200);return f;};
 let f=await boot();await page.waitForTimeout(1000);await page.screenshot({path:out+'/before-desktop-title.png'});report.oldRuns=[];
 for(let attempt=0;attempt<8;attempt++){
  await f.locator('#canvas').focus();await page.keyboard.press('Enter');await page.waitForTimeout(3000);await page.keyboard.press('Enter');await page.waitForTimeout(350);await page.keyboard.press('Enter');await page.waitForTimeout(1000);const path=out+'/before-desktop-result-'+attempt+'.png';await page.screenshot({path});const ocr=execFileSync('tesseract',[path,'stdout','--psm','11'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});const values=(ocr.match(/\b0{2,}\d{2,4}\b/g)||[]).map(Number);report.oldRuns.push({attempt,ocrValues:values,image:path});if(values.some(v=>v>0)){await page.screenshot({path:out+'/before-desktop-result.png'});break;}
 }
 await page.waitForTimeout(1500);
 before=false;f=await boot();await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='legacy_best'));await page.screenshot({path:out+'/after-desktop-title.png'});const imported=await page.evaluate(()=>window.__nativeObserved.find(p=>p.kind==='legacy_best'));check(imported.value>0,'genuine positive old native ConfigFile imported without rewriting',{value:imported.value});
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='start'));await page.waitForTimeout(3000);await page.keyboard.press('Enter');await page.waitForTimeout(350);await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='result'),null,{timeout:12000});
 const messages=await page.evaluate(()=>window.__nativeObserved),result=messages.find(p=>p.kind==='result');report.notifications=messages.map(({session,run_result_id,...p})=>p);
 check(result&&Number.isSafeInteger(result.value),'native final result observed',{value:result.value});check(messages.filter(p=>p.kind==='result').length===1,'one native finalized notification per RUN');
 await page.locator('#legacy-record-result').getByText('記録共有：準備中',{exact:true}).waitFor({state:'visible'});check(await page.getByRole('button',{name:'この記録を共有',exact:true}).count()===0,'public sharing preparing disabled');await page.screenshot({path:out+'/after-desktop-result.png'});
 // Browser-originating synthetic attacks only; isolated webdriver prevents any eligible external result.
 await page.evaluate(p=>window.postMessage({...p,value:999999},location.origin),result);await page.waitForTimeout(50);
 await f.locator('#canvas').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__nativeObserved.filter(p=>p.kind==='start').length===2);check(await page.locator('#legacy-record-result').isHidden(),'native retry removes result controls');await page.screenshot({path:out+'/after-desktop-retry.png'});
 await page.getByRole('link',{name:'← ゲームセンターへ',exact:true}).click();await page.waitForTimeout(350);
 const text=await page.locator('[data-game-id="game012"] .card-records').innerText();check(!text.includes('未対応')&&!text.includes('取得できません')&&!text.includes('記録なし'),'Portal consumes confirmed native record');report.portal012=text;await page.screenshot({path:out+'/after-desktop-portal.png'});
 await page.reload();await page.waitForTimeout(400);check((await page.locator('[data-game-id="game012"] .card-records').innerText())===text,'Portal mirror survives reload');
 await page.goto('https://game100garage.com/games/yokodori-days/index.html');await page.getByRole('button',{name:'すぐ遊ぶ',exact:true}).click();await page.waitForFunction(()=>window.__nativeObserved.some(p=>p.kind==='legacy_best'),null,{timeout:45000});check((await page.evaluate(()=>window.__nativeObserved.find(p=>p.kind==='legacy_best').value))>=imported.value,'native original high_score.cfg persists after reload');check(report.posts===0,'no external QA POST');check(report.errors.length===0,'no JavaScript exception');report.status='PASS';await context.close();
}catch(e){report.status='FAIL';report.error=e.message;if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}
finally{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2));await browser.close();}
