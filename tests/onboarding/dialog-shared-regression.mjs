import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const base=process.env.AUDIT_URL??'http://127.0.0.1:5186';
const out='docs/adsense/shared-practice-dialog-20261022/shared-compiled';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const cases=[];
// Current shared-dialog consumers plus Game003's dedicated dialog using the same CSS.
// Game004 is retired; 006/008/009 use dedicated onboarding, not this dialog.
for(const id of ['002','003','011','015']) for(const viewport of [{width:390,height:844},{width:844,height:390}]) cases.push({id,viewport});
for(const id of ['001','005']) for(const viewport of [{width:320,height:568},{width:667,height:375},{width:1440,height:900}]) cases.push({id,viewport});
const results=[];
for(const {id,viewport} of cases) {
 const c=await browser.newContext({viewport,hasTouch:true});
 await c.route('**/*',r=>r.request().url().startsWith(base+'/')&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 const p=await c.newPage(),r={id,viewport,errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
 const inspect=()=>p.locator('#arcade-training').evaluate(d=>({open:d.open,display:getComputedStyle(d).display,rect:d.getBoundingClientRect().toJSON(),columns:getComputedStyle(d).gridTemplateColumns,focus:document.activeElement.id}));
 try {
  await p.goto(`${base}/game${id}.html`);await p.locator('#tutorial-explain-button').tap();
  await p.locator('#tutorial-practice-button').tap();r.open=await inspect();
  if(viewport.height<=500 && r.open.display!=='grid') throw Error('Landscape grid missing');
  if(id==='015') {
   // Keep a genuine practice pointer held while another finger closes the dialog.
   const b=await p.locator('[data-practice-action="right"]').boundingBox();
   await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();
  }
  await p.locator('#tutorial-close-button').tap();await p.mouse.up();r.closed=await inspect();
  if(r.closed.open||r.closed.display!=='none'||r.closed.rect.width!==0) throw Error('Closed dialog visible');
  if(r.closed.focus!=='tutorial-explain-button') throw Error('Explanation focus not restored');
  await p.locator('#tutorial-again-button').tap();await p.keyboard.press('Escape');r.escape=await inspect();
  if(r.escape.display!=='none') throw Error('Reopen/Escape did not hide dialog');
  await p.locator('#play-button').tap();await p.waitForFunction(()=>document.querySelector('#app').dataset.state==='playing',{},{timeout:3000});
  r.started=true;
  await p.locator('.arcade-portal-back').first().tap();await p.waitForURL(`${base}/index.html`);
  if(r.errors.length)throw Error('JavaScript exceptions');r.pass=true;
 }catch(e){r.pass=false;r.failure=e.message;}
 results.push(r);console.log(id,`${viewport.width}x${viewport.height}`,r.pass?'PASS':r.failure);await c.close();
}
await browser.close();writeFileSync(`${out}/results.json`,JSON.stringify({base,results},null,2)+'\n');
console.log(JSON.stringify({passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length}));
if(results.some(r=>!r.pass))process.exitCode=1;
