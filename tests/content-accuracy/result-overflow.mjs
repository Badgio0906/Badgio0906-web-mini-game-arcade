// Verify that the longer result heading leaves every end breakdown reachable.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4964/',out=process.env.QA_OUT;if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),r={};
try{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await c.route('**/*',x=>x.request().url().startsWith(base)?x.continue():x.abort());const p=await c.newPage(),s=await c.newCDPSession(p);
await p.goto(base+'game035.html',{waitUntil:'networkidle'});await p.locator('#play').tap();
for(let i=0;i<3;i++){const e=p.locator('#ice');await e.scrollIntoViewIfNeeded();const q=await e.boundingBox(),x=q.x+q.width*.5,y=q.y+q.height*.55;await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await s.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+10,y:y+60,id:1}]});await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('#app').dataset.state==='aim');await p.locator('#finish-end').tap();if(i<2)await p.locator('#next').tap();}
assert.equal(await p.locator('#app').getAttribute('data-state'),'result');r.heading=await p.locator('#menu h2').innerText();assert(r.heading.includes('3エンド'));assert.equal(await p.locator('#menu ol li').count(),3);
const li=p.locator('#menu ol li').last();await li.scrollIntoViewIfNeeded();r.geometry=await li.evaluate(e=>{const d=e.closest('dialog'),l=e.getBoundingClientRect(),q=d.getBoundingClientRect();return{li:l.toJSON(),dialog:q.toJSON(),clientHeight:d.clientHeight,scrollHeight:d.scrollHeight,scrollTop:d.scrollTop,overflow:getComputedStyle(d).overflowY,text:e.textContent};});
assert(r.geometry.li.top>=r.geometry.dialog.top&&r.geometry.li.bottom<=r.geometry.dialog.bottom);assert(await li.isVisible());await p.screenshot({path:out+'/game035-390-breakdown.png'});await p.locator('#retry').tap();assert.equal(await p.locator('#app').getAttribute('data-state'),'aim');r.pass=true;await c.close();
}catch(e){r.pass=false;r.failure=e.message;}finally{await b.close();await writeFile(out+'/REPORT.json',JSON.stringify(r,null,2)+'\n');}console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1;
