import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/game015/review-artifacts/hud-recheck';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:320,height:568},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[],records=[];const points=new Map();let input=0;
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const training=()=>page.evaluate(()=>window.__tutorialDebug.snapshot());
const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),s:window.__arcadeDebug.inspection()}));
async function until(fn){let start=Date.now();while(!await fn()){if(Date.now()-start>15000)throw Error('Native practice timeout');await page.waitForTimeout(25);}}
async function point(sel,id){let r=await page.locator(sel).boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2,id};}
async function direction(v){if(v===input)return;if(points.has(1)){points.delete(1);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[...points.values()]});}if(v){points.set(1,await point(`[data-practice-action="${v<0?'left':'right'}"]`,1));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});}input=v;}
async function drop(practice=true){points.set(2,await point(practice?'[data-practice-action="action"]':'#drop-button',2));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...points.values()]});let end=points.get(2);points.delete(2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[end]});}
async function shot(name){await page.screenshot({path:`${out}/${name}.png`});records.push({name,runtime:await read(),training:await training()});}
try{
 await page.goto('http://127.0.0.1:5181/game015.html');await page.locator('#play-button').tap();await page.locator('#tutorial-practice-button').tap();await shot('320-practice-step1');
 await drop();await until(async()=>(await training()).practice.step===1);await direction(1);await drop();await page.waitForTimeout(450);await shot('320-practice-steering');await until(async()=>(await training()).practice.step===2);await direction(0);await drop();await page.waitForTimeout(600);await shot('320-practice-safe-fall');await until(async()=>(await training()).practice.step===3);await shot('320-practice-ghost');await until(async()=>(await training()).phase==='success');await page.locator('#tutorial-start-button').tap();await shot('320-live-main');
 await drop(false);await page.waitForTimeout(470);await shot('320-live-fall');await until(async()=>{let r=await read();return r.s.player.grounded;});
 records.push({name:'320-geometry',geometry:await page.evaluate(()=>({canvas:document.querySelector('#fall-canvas').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('.fall-controls button')].map(b=>({id:b.id,bounds:b.getBoundingClientRect().toJSON()})),documentHeight:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight}}))});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(120);await shot('844-live-landscape');await drop(false);await page.waitForTimeout(450);await shot('844-live-landscape-fall');await page.locator('#pause-button').tap();
}finally{try{await direction(0);}catch{}records.push({name:'errors',errors});await writeFile(`${out}/HUD_RECHECK.json`,JSON.stringify({method:'Fresh320x568 ordinary native4-step practice andDROP, viewportresize844x390 actualmain; no storage/player/time/score injection',records},null,2)+'\n');await cdp.detach();await context.close();await browser.close();console.log('ALL contexts closed',JSON.stringify(errors));}
