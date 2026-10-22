// Real keyboard input; inspect only readonly DEV diagnostics. No game-state/time injection.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4941/',out=process.env.QA_OUT;if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),rows=[];
try{for(const mode of['practice','main'])for(const key of['Enter',' ']){
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await c.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const p=await c.newPage(),r={mode,key};
 try{await p.goto(base+'game015.html');if(mode==='practice'){await p.locator('#tutorial-again-button').click();await p.locator('[data-practice-action="action"]').focus();}else{await p.locator('#play-button').click();await p.locator('#drop-button').focus();}await p.keyboard.down(key);await p.setViewportSize({width:844,height:390});await p.waitForTimeout(80);await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);
  r.before=await p.evaluate(mode=>mode==='practice'?window.__tutorialDebug.snapshot().practicePaused:document.querySelector('#app').dataset.state==='paused',mode);await p.keyboard.down(key);await p.waitForTimeout(100);await p.keyboard.up(key);await p.waitForTimeout(100);r.after=await p.evaluate(mode=>mode==='practice'?window.__tutorialDebug.snapshot().practicePaused:document.querySelector('#app').dataset.state==='paused',mode);await p.screenshot({path:out+'/'+mode+'-'+(key===' '?'Space':key)+'.png'});assert(r.before&&r.after,'held key must not resume after rotation');
  await p.locator(mode==='practice'?'#tutorial-resume-button':'#resume-button').focus();await p.keyboard.press(key);assert.equal(await p.evaluate(mode=>mode==='practice'?window.__tutorialDebug.snapshot().practicePaused:document.querySelector('#app').dataset.state==='paused',mode),false,'fresh keyboard resumes');r.pass=true;
 }catch(e){r.pass=false;r.error=String(e.message);}finally{rows.push(r);await c.close();}
}}finally{await b.close();await writeFile(out+'/RESULTS.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));}if(rows.some(r=>!r.pass))process.exitCode=1;
