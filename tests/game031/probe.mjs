import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const out=process.env.GAME031_QA_OUT;if(!out)throw Error('uniqueGAME031_QA_OUTrequired');await mkdir(out,{recursive:true});
const base=process.env.GAME031_URL||'http://127.0.0.1:4311/game031.html';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={at:new Date().toISOString(),base,source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceStatus:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),steps:[],errors:[]};
let context,page;
try{
 context=await browser.newContext({viewport:{width:1280,height:900}});page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.route(/analytics\.game100garage\.com|googlesyndication\.com|google-analytics\.com/,r=>r.abort());
 await page.goto(base);await page.getByRole('button',{name:'すぐ遊ぶ',exact:true}).click();await page.waitForFunction(()=>window.__DIG_PLACE_QA__?.read()?.state==='playing');await page.waitForTimeout(1000);
 const read=()=>page.evaluate(()=>window.__DIG_PLACE_QA__.read());report.steps.push({step:'start',state:await read()});await page.screenshot({path:out+'/desktop-start.png'});
 await page.keyboard.down('KeyF');await page.waitForTimeout(1300);await page.keyboard.up('KeyF');report.steps.push({step:'held-dig',state:await read()});await page.screenshot({path:out+'/desktop-dig.png'});
 await page.keyboard.press('KeyG');report.steps.push({step:'place',state:await read()});await page.keyboard.press('Space');await page.waitForTimeout(220);report.steps.push({step:'jump',state:await read()});await page.waitForTimeout(600);
 await page.getByRole('button',{name:'休憩',exact:true}).click();await page.getByRole('button',{name:'保存してタイトル',exact:true}).click();await page.waitForFunction(()=>document.getElementById('app').dataset.state==='title');report.steps.push({step:'saved-title',state:await read()});await page.reload();await page.getByRole('button',{name:'続きから',exact:true}).click();await page.waitForFunction(()=>window.__DIG_PLACE_QA__?.read()?.state==='playing');report.steps.push({step:'reloaded',state:await read()});await page.screenshot({path:out+'/desktop-restored.png'});
 const before=report.steps.find(x=>x.step==='saved-title').state,after=await read();if(JSON.stringify(before.inventory)!==JSON.stringify(after.inventory)||before.stats.mined!==after.stats.mined||before.stats.placed!==after.stats.placed)throw Error('save restore mismatch');
 if(report.errors.length)throw Error('pageerror:'+report.errors.join(';'));report.result='PASS';
}catch(e){report.result='FAIL';report.error=String(e);if(page){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});report.failureState=await page.evaluate(()=>window.__DIG_PLACE_QA__?.read()).catch(()=>null);}}finally{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');await context?.close();await browser.close();}
console.log(JSON.stringify({result:report.result,error:report.error,out}));if(report.result!=='PASS')process.exitCode=1;
