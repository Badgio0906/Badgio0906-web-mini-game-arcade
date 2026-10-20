// Text-only acceptance against a compiled local site; external traffic is blocked.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4964/',out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),rows=[];
try{for(const width of [1440,390]){
 const c=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
 await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await c.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await c.newPage(),row={width,errors:[]};p.on('pageerror',e=>row.errors.push(e.message));
 try{await p.goto(base+'game002.html',{waitUntil:'networkidle'});
 await p.locator('#how-button')[width===390?'tap':'click']();
 const text=await p.locator('#how-dialog').innerText();
 assert(text.includes('ぶつかるとゲーム終了。無料で何度でも再挑戦できます。'));
 assert(!text.includes('CREDIT')&&!text.includes('Reward Stub'));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
 await p.screenshot({path:out+`/game002-${width}-help.png`});row.help=text;
 await p.locator('#how-ok-button')[width===390?'tap':'click']();
 await p.getByRole('button',{name:'すぐ遊ぶ',exact:true})[width===390?'tap':'click']();await p.waitForTimeout(500);
 assert.equal(await p.locator('#app').getAttribute('data-state'),'playing');
 await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowLeft');
 await p.screenshot({path:out+`/game002-${width}-play.png`});
 row.started=true;assert.equal(row.errors.length,0);row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;}
 finally{await c.close();rows.push(row);}
}}finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');}
console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
