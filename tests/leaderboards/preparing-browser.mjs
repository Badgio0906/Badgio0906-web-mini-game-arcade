import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.LEADERBOARDS_QA_OUT, base=process.env.LEADERBOARDS_BASE_URL||'http://127.0.0.1:5173';
if(!out)throw Error('Provide unique LEADERBOARDS_QA_OUT');await mkdir(out,{recursive:false});
const report={at:new Date().toISOString(),base,provenance:'Actual HTTP(S) portal with no records endpoint; Chromium viewport simulation, no physical devices',checks:[],recordsRequests:[],postAttempts:0,errors:[]};
const check=(pass,name,detail={})=>{report.checks.push({pass:!!pass,name,...detail});if(!pass)throw Error(name);};
const proxy=(()=>{if(!base.startsWith('https://'))return;const value=process.env.HTTPS_PROXY||process.env.https_proxy;if(!value)return;const u=new URL(value);return{server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)};})();
const browser=await chromium.launch({proxy,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const viewport of [{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}]){
 const context=await browser.newContext({viewport}),page=await context.newPage();
 await context.route('**/*',r=>{if(r.request().method()==='POST'){report.postAttempts++;return r.abort();}return r.continue();});page.on('pageerror',e=>report.errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/v1/records/'))report.recordsRequests.push({method:r.method(),url:r.url()});});
 await page.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await page.goto(base,{waitUntil:'networkidle'});
 check(await page.locator('.leaderboard-button').count()===20,'20 TOP10 buttons while backend preparing',{viewport});
 check(await page.evaluate(()=>localStorage.getItem('game100:records:participant-credential:v1'))===null,'ranking view never creates credentials',{viewport});
 check(await page.locator('.game-card').count()===30,'30 active game cards',{viewport});
 const button=page.locator('[data-game-id=game001] .leaderboard-button');await button.click();
 await page.locator('.leaderboard-status').filter({hasText:'ランキング準備中'}).waitFor();
 check(page.url()===base,'TOP10 never launches the game',{viewport});
 check(await page.locator('.leaderboard-list li').count()===0,'preparing contains no fabricated ranking',{viewport});
 check(await page.locator('#leaderboard-title').evaluate(e=>e===document.activeElement),'heading focus',{viewport});
 await page.screenshot({path:`${out}/preparing-${viewport.width}x${viewport.height}.png`});await page.keyboard.press('Escape');
 check(await button.evaluate(e=>e===document.activeElement),'Esc focus restore',{viewport});
 await button.click();await page.locator('.leaderboard-status').filter({hasText:'ランキング準備中'}).waitFor();await page.getByRole('button',{name:'閉じる',exact:true}).click();
 check(await button.evaluate(e=>e===document.activeElement),'close button focus restore after reopening',{viewport});
 await context.close();
 }check(report.recordsRequests.length===0&&report.postAttempts===0,'no records endpoint means zero GET or POST');check(report.errors.length===0,'no JS errors');report.result='PASS';
}catch(e){report.result='FAIL';report.error=e.message;}finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');}
console.log({out,result:report.result,error:report.error,checks:report.checks.length});if(report.result!=='PASS')process.exitCode=1;
