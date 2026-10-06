import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const [name,width,height] of [['desktop',1366,900],['phone',390,844]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:name==='phone',hasTouch:name==='phone'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const epoch=new Date('2026-10-07T00:00:00Z');await p.clock.install({time:epoch});await p.goto('http://localhost:5173/prototype-stick.html');await p.clock.pauseAt(new Date(epoch.getTime()+10000));await p.click('#start');
 await p.keyboard.down('d');await p.clock.runFor(160);await p.keyboard.up('d');const moved=await p.evaluate(()=>window.__stick);assert.ok(moved.x>0);await p.screenshot({path:`docs/prototypes/stick-balance/hand-revision/QA/${name}-moving.png`});
 await p.clock.runFor(10000);assert.equal(await p.evaluate(()=>window.__stick.mode),'over');await p.click('#start');assert.equal(await p.evaluate(()=>window.__stick.mode),'playing');assert.equal(await p.evaluate(()=>window.__stick.input),0);
 assert.deepEqual(errors,[]);results.push({name,moved,loss:true,retry:true,errors});await p.close();
}
await browser.close();writeFileSync('docs/prototypes/stick-balance/hand-revision/QA/SMOKE.json',JSON.stringify(results,null,2));console.log('PASS desktop/phone native movement, fall, retry, no page errors');
