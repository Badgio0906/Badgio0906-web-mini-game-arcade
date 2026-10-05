import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const observe=process.env.GAME017_MODIFIER_OBSERVE==='1';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),record={observeOnly:observe};
const read=()=>page.evaluate(()=>window.__arcadeDebug.snapshot());
async function until(phase){await page.waitForFunction(phase=>window.__arcadeDebug.snapshot().phase===phase,phase);}
async function stable(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function point(p){await stable();return page.evaluate(p=>{const c=document.getElementById('rain-canvas'),b=c.getBoundingClientRect(),s=Math.min(b.width/c.width,b.height/c.height);return{x:b.x+(b.width-c.width*s)/2+(58+p.x*.884)*s,y:b.y+(b.height-c.height*s)/2+(116+p.z*(c.height-212)/600)*s};},p);}
try{
 await context.addInitScript(()=>localStorage.setItem('web-mini-arcade:v1:game017:tutorialCompleted','true'));
 await page.goto('http://127.0.0.1:5181/game017.html');await page.locator('#play-button').click();await until('rain');
 await page.locator('#accelerate-button').click({modifiers:['Shift']});record.afterShiftButton=await read();assert.equal(record.afterShiftButton.phase,'rain');
 const b=await page.locator('#rain-canvas').boundingBox();await page.keyboard.down('Shift');await page.mouse.click(b.x+100,b.y+100);await page.keyboard.up('Shift');record.afterShiftCanvas=await read();
 if(observe){record.observation=record.afterShiftCanvas.phase==='rise'?'canvas activated while Shift-button did not':'no activation';}
 else{
  assert.equal(record.afterShiftCanvas.phase,'rain');await page.locator('#accelerate-button').click();await until('plan');
  const a=await point({x:70,z:300}),q=await point({x:220,z:200});await page.keyboard.down('Shift');await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(q.x,q.y);await page.mouse.up();await page.keyboard.up('Shift');record.afterShiftDrag=await read();assert.equal(record.afterShiftDrag.route.length,1);
  const path=await page.evaluate(()=>window.__arcadeDebug.inspection().safeRoute);const pts=[];for(const p of path)pts.push(await point(p));await page.mouse.move(pts[0].x,pts[0].y);await page.mouse.down();for(const p of pts.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();await until('clear');record.clear=await read();assert.ok(record.clear.score>=1000);record.status='PASS';
 }
}catch(error){record.error=String(error);process.exitCode=1;}finally{await context.close();await browser.close();await writeFile('docs/game017/QA/'+(observe?'MODIFIER_BEFORE.json':'MODIFIER_RETEST.json'),JSON.stringify(record,null,2)+'\n');}
console.log(JSON.stringify({observeOnly:observe,status:record.status,observation:record.observation,error:record.error}));
