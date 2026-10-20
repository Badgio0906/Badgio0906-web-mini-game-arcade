// Additional compiled containment/input lifecycle: DPR 3, shell practice,
// rotation and genuine native failure/retry. No binary or model injection.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4962/',out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),report={};
try{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
await c.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');window.__native=[];addEventListener('message',e=>{if(e.data?.channel==='game100-native-record')window.__native.push(e.data);});});
await c.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());const p=await c.newPage();report.errors=[];p.on('pageerror',e=>report.errors.push(e.message));
await p.goto(base+'games/yokodori-days/index.html');await p.locator('#tutorial-explain-button').tap();
assert((await p.locator('#legacy-start').innerText()).includes('遊び方'));
await p.locator('#tutorial-again-button').tap();
for(let i=0;i<2;i++){await p.waitForFunction(()=>document.querySelector('#practice-sample')?.textContent.includes('よそ見中'));await p.locator('#practice-action').tap();if(i===0)await p.waitForFunction(()=>document.querySelector('#practice-sample')?.textContent.includes('作業中'));}
await p.getByText('できました！',{exact:true}).waitFor();assert.equal(await p.evaluate(()=>window.__native.length),0);report.shellPractice=true;
await p.locator('#play-button').tap();const f=await(await p.locator('#legacy-game-frame').elementHandle()).contentFrame();await f.waitForURL(/game\.html/);await f.waitForFunction(()=>!document.getElementById('status'),null,{timeout:45000});
const canvas=f.locator('#canvas');await p.waitForTimeout(500);
const geometry=async()=>canvas.evaluate(e=>{const r=e.getBoundingClientRect();return{width:e.width,height:e.height,rect:r.toJSON(),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio};});
report.portrait=await geometry();assert.equal(report.portrait.dpr,3);assert.equal(report.portrait.width,960);assert.equal(report.portrait.height,540);
await canvas.tap();await p.waitForFunction(()=>window.__native.some(e=>e.kind==='start'));
await p.waitForTimeout(250);await canvas.tap();await p.waitForFunction(()=>window.__native.some(e=>e.kind==='result'),null,{timeout:10000});
report.result=await p.evaluate(()=>window.__native.find(e=>e.kind==='result').value);await p.screenshot({path:out+'/portrait-result.png'});
await canvas.tap();await p.waitForFunction(()=>window.__native.filter(e=>e.kind==='start').length===2);await p.locator('#legacy-record-result').waitFor({state:'hidden'});report.retry=true;
await p.setViewportSize({width:844,height:390});await p.waitForTimeout(500);report.landscape=await geometry();assert.equal(report.landscape.width,960);assert.equal(report.landscape.height,540);assert(Math.abs(report.landscape.rect.width/report.landscape.rect.height-16/9)<.01);
await p.screenshot({path:out+'/rotated-landscape.png'});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(400);report.backPortrait=await geometry();assert.equal(report.backPortrait.width,960);assert.equal(report.backPortrait.height,540);
await p.locator('#legacy-menu-return').tap();await p.locator('#legacy-portal-return').tap();await p.waitForURL('**/index.html');report.returned=true;assert.equal(report.errors.length,0);report.pass=true;await c.close();
}catch(e){report.pass=false;report.failure=e.message;}finally{await b.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
