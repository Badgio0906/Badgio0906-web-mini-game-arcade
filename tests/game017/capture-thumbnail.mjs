import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
try{
 await context.addInitScript(()=>localStorage.setItem('web-mini-arcade:v1:game017:tutorialCompleted','true'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5181/game017.html');await page.locator('#play-button').click();
 const read=()=>page.evaluate(()=>({snapshot:window.__arcadeDebug.snapshot(),inspection:window.__arcadeDebug.inspection()}));
 async function until(phase){for(let i=0;i<400;i++){const r=await read();if(r.snapshot.phase===phase)return r;await page.waitForTimeout(20);}throw Error(phase);}
 await until('rain');await page.locator('#accelerate-button').click();const plan=await until('plan');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const pts=await page.evaluate(path=>{const c=document.getElementById('rain-canvas'),b=c.getBoundingClientRect(),s=Math.min(b.width/c.width,b.height/c.height);return path.map(p=>({x:b.x+(b.width-c.width*s)/2+(58+p.x*.884)*s,y:b.y+(b.height-c.height*s)/2+(116+p.z*(c.height-212)/600)*s}));},plan.inspection.safeRoute.slice(0,34));
 await page.mouse.move(pts[0].x,pts[0].y);await page.mouse.down();for(const p of pts.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();
 await page.evaluate(()=>document.fonts.ready);const state=await read();assert.equal(state.snapshot.phase,'plan');assert.ok(state.snapshot.route.length>30);
 await mkdir('assets/portal/thumbnails',{recursive:true});await page.screenshot({path:'assets/portal/thumbnails/game017-actual-source.png'});
 const metadata={captureUtc:new Date().toISOString(),viewport:[1440,900],phase:state.snapshot.phase,round:state.snapshot.round,snapshot:state.snapshot,input:'native mouse along read-only safe route; stopped before goal',forcedRuntimeWrites:false,errors};
 await writeFile('docs/game017/QA/THUMBNAIL_CAPTURE.json',JSON.stringify(metadata,null,2)+'\n');assert.deepEqual(errors,[]);
}finally{await context.close();await browser.close();}
