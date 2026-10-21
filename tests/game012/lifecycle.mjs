// DPR3 interruption, trusted native events and synthetic stale-message fixtures.
// No engine model, score or clock is injected.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4972/',out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),r={errors:[]};
try{const c=await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:3});
await c.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');localStorage.setItem('game012-preservation-fixture','keep');window.__native=[];addEventListener('message',e=>{if(e.isTrusted&&e.data?.channel==='game100-native-record')window.__native.push(e.data);});});
await c.route('**/*',x=>x.request().url().startsWith(base)&&['GET','HEAD'].includes(x.request().method())?x.continue():x.abort());
const p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));p.setDefaultTimeout(5000);
const mirror=()=>p.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('game100-record-legacy-v1',1);q.onupgradeneeded=()=>{q.transaction.abort();resolve(null);};q.onerror=()=>resolve(null);q.onsuccess=()=>{const d=q.result,t=d.transaction('mirrors','readonly'),get=t.objectStore('mirrors').get('game012');get.onsuccess=()=>{const v=get.result;d.close();resolve(v??null);};};}));
await p.goto(base+'games/yokodori-days/index.html');await p.locator('#tutorial-explain-button').tap();await p.locator('#tutorial-again-button').tap();
for(let i=0;i<2;i++){await p.waitForFunction(()=>document.querySelector('#practice-sample')?.textContent.includes('よそ見中'));await p.locator('#practice-action').tap();if(i===0)await p.waitForFunction(()=>document.querySelector('#practice-sample')?.textContent.includes('作業中'));}
await p.getByText('できました！',{exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.__native.length),0);r.shellPractice=true;
await p.locator('#play-button').tap();let f=p.frameLocator('#legacy-game-frame');await f.locator('#status').waitFor({state:'hidden',timeout:45000});await p.waitForTimeout(400);let cv=f.locator('#canvas');
r.canvas=await cv.evaluate(e=>({width:e.width,height:e.height,dpr:devicePixelRatio}));assert.deepEqual(r.canvas,{width:960,height:540,dpr:3});
await cv.tap();await p.waitForFunction(()=>window.__native.some(e=>e.kind==='start'));await p.waitForTimeout(250);await cv.tap();await p.waitForFunction(()=>window.__native.some(e=>e.kind==='result'),null,{timeout:10000});
r.realResult=await p.evaluate(()=>window.__native.find(e=>e.kind==='result').value);for(let i=0;i<20;i++){r.beforeMirror=await mirror();if(r.beforeMirror?.normal!==undefined)break;await p.waitForTimeout(100);}assert.equal(r.beforeMirror.normal,r.realResult);
await p.evaluate(()=>{window.__oldFrame=document.querySelector('#legacy-game-frame');window.__oldWindow=window.__oldFrame.contentWindow;window.__oldSession=new URL(window.__oldFrame.src).searchParams.get('records_session');});
// Keep a genuine native retry gesture down while rotating.
const s=await c.newCDPSession(p),box=await cv.boundingBox();await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await p.waitForFunction(()=>window.__native.filter(e=>e.kind==='start').length===2);
const resultCount=await p.evaluate(()=>window.__native.filter(e=>e.kind==='result').length);
await p.setViewportSize({width:390,height:844});await p.getByRole('heading',{name:'横向きで遊んでください',exact:true}).waitFor();assert.equal(await p.locator('#legacy-game-frame').count(),0);assert.equal(p.frames().filter(f=>f.url().includes('/game.html')).length,0);
r.detached=await p.evaluate(()=>({connected:window.__oldFrame.isConnected,windowClosed:window.__oldWindow.closed,src:window.__oldFrame.getAttribute('src')}));assert.equal(r.detached.connected,false);assert.equal(r.detached.windowClosed,true);assert.equal(r.detached.src,null);
await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.__native.filter(e=>e.kind==='result').length),resultCount);await p.screenshot({path:out+'/portrait-interrupted.png'});
// Synthetic OLD source/session events test receiver rejection, not engine play.
await p.evaluate(()=>{const start=window.__native.filter(e=>e.kind==='start').at(-1);window.__stale={...start,kind:'result',value:777};dispatchEvent(new MessageEvent('message',{origin:location.origin,source:window.__oldWindow,data:window.__stale}));});
await p.setViewportSize({width:844,height:390});await p.getByRole('button',{name:'もう一度遊ぶ',exact:true}).waitFor();await p.waitForTimeout(500);assert.equal(await p.locator('#legacy-game-frame').count(),0);assert.equal(await p.evaluate(()=>window.__native.filter(e=>e.kind==='start').length),2);
assert((await p.locator('#game012-interrupted').innerText()).includes('中断'));r.noAutomaticRestart=true;await p.screenshot({path:out+'/landscape-explicit-retry.png'});
await p.locator('#play-button').tap();f=p.frameLocator('#legacy-game-frame');await f.locator('#status').waitFor({state:'hidden',timeout:45000});cv=f.locator('#canvas');
r.fresh=await p.evaluate(()=>({sameElement:document.querySelector('#legacy-game-frame')===window.__oldFrame,newWindow:document.querySelector('#legacy-game-frame').contentWindow!==window.__oldWindow,newSession:new URL(document.querySelector('#legacy-game-frame').src).searchParams.get('records_session')!==window.__oldSession}));assert(Object.values(r.fresh).every(Boolean));
await p.evaluate(()=>dispatchEvent(new MessageEvent('message',{origin:location.origin,source:document.querySelector('#legacy-game-frame').contentWindow,data:window.__stale})));await p.waitForTimeout(300);r.afterMirror=await mirror();assert.equal(r.afterMirror.normal,r.beforeMirror.normal);r.syntheticStaleResultsRejected=true;assert.equal(await p.evaluate(()=>localStorage.getItem('game012-preservation-fixture')),'keep');
await cv.tap();await p.waitForFunction(()=>window.__native.filter(e=>e.kind==='start').length===3);await p.waitForTimeout(250);await cv.tap();await p.waitForFunction(n=>window.__native.filter(e=>e.kind==='result').length>n,resultCount,{timeout:10000});
await p.locator('#legacy-menu-return').tap();await p.locator('#legacy-portal-return').tap();await p.waitForURL('**/index.html');await p.waitForFunction(()=>document.querySelector('[data-game-id="game012"] .card-records dd')?.textContent==='0 点');await p.reload();await p.waitForFunction(()=>document.querySelector('[data-game-id="game012"] .card-records dd')?.textContent==='0 点');r.confirmedZeroSurvivesReload=true;assert.equal(r.errors.length,0);r.pass=true;await c.close();
}catch(e){r.pass=false;r.failure=e.message;}finally{await b.close();await writeFile(out+'/REPORT.json',JSON.stringify(r,null,2)+'\n');}console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1;
