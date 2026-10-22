// Offline non-loopback HTTP-origin fixture. Never disables secure-context checks.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=process.env.QA_OUT,dist=path.resolve(process.env.QA_DIST||'dist'),base='http://192.0.2.15:8443/';
if(!out)throw Error('QA_OUT required');await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await c.newPage(),r={fixture:'local compiled bytes served into a non-secure HTTP origin; not an actual Windows/iPhone connection',errors:[],blockedWrites:0};
await c.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');if(localStorage.getItem('web-mini-arcade:v1:game015:bestR04')===null)localStorage.setItem('web-mini-arcade:v1:game015:bestR04','777');});
await c.route('**/*',async x=>{
 const q=x.request();if(!q.url().startsWith(base)||!['GET','HEAD'].includes(q.method())){if(!['GET','HEAD'].includes(q.method()))r.blockedWrites++;return x.abort();}
 try{const file=path.join(dist,decodeURIComponent(new URL(q.url()).pathname));const body=await fs.readFile(file);return x.fulfill({status:200,body,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});}catch{return x.fulfill({status:404,body:'Not found'});}
});
p.on('pageerror',e=>r.errors.push(e.message));
try{
 await p.goto(base+'game015.html');r.apis=await p.evaluate(()=>({origin:location.origin,isSecureContext,randomUUID:typeof crypto.randomUUID==='function',getRandomValues:typeof crypto.getRandomValues==='function',subtle:!!crypto.subtle}));
 assert(!r.apis.isSecureContext&&!r.apis.randomUUID&&r.apis.getRandomValues);
 await p.locator('#play-button').tap();assert.equal(await p.locator('#app').getAttribute('data-state'),'playing');
 const box=await p.locator('#left-button').boundingBox();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
 const cdp=await c.newCDPSession(p),drop=await p.locator('#drop-button').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:drop.x+drop.width/2,y:drop.y+drop.height/2}]});
 assert.equal(await p.locator('#drop-button').getAttribute('data-held'),'true');await p.setViewportSize({width:844,height:390});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);
 assert.equal(await p.locator('#app').getAttribute('data-state'),'paused');assert.equal(await p.locator('#drop-button').getAttribute('data-held'),'false');await p.setViewportSize({width:390,height:844});await p.locator('#resume-button').tap();
 const d=await p.locator('#drop-button').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:2,x:d.x+d.width/2,y:d.y+d.height/2}]});await p.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',null,{timeout:25000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 r.best=await p.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game015:bestR04'));assert(Number(r.best)>=777);await p.reload();await p.locator('#play-button').waitFor();assert.equal(await p.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game015:bestR04')),r.best);
 await p.screenshot({path:out+'/insecure-origin-title.png'});assert.equal(r.errors.length,0);r.pass=true;
}catch(e){r.pass=false;r.failure=e.message;await p.screenshot({path:out+'/FAIL.png'});}
finally{await c.close();await b.close();await fs.writeFile(out+'/REPORT.json',JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({pass:r.pass,apis:r.apis,failure:r.failure}));}
if(!r.pass)process.exitCode=1;
