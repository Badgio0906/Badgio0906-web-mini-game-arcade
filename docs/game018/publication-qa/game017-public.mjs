import {createHash} from 'node:crypto';import {readFile} from 'node:fs/promises';
const outdir=process.env.PUBLIC_QA_OUT||'docs/game018/publication-qa/public-attempt-01';await mkdir(outdir,{recursive:true});
// Game017 compatibility replay for the18-game candidate, adapted from its frozen production probe.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const mounts=[process.env.PUBLIC_MOUNT];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],proxy:{server:process.env.HTTPS_PROXY||process.env.HTTP_PROXY}});
const records=[];
try{
 for(const mount of mounts)for(const profile of [{name:'desktop',width:1440,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.touch,hasTouch:profile.touch});
  const page=await context.newPage(),errors=[],resources=[],jobs=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(['script','font','image','stylesheet','document'].includes(r.request().resourceType()))jobs.push(r.body().then(b=>resources.push({url:r.url(),kind:r.request().resourceType(),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex'),phaser:r.request().resourceType()==='script'&&/WebGLRenderer|Phaser v/.test(b.toString())})).catch(e=>{if(!/closed|No resource|No data/.test(e.message))errors.push('resource body: '+e.message);}));});

 async function portalEntry(id,title){
  const response=await page.goto(new URL('index.html',mount).href);assert.equal(response.status(),200);
  await page.locator('.game-card').first().waitFor();assert.equal(await page.locator('.game-card').count(),18);
  for(const [g,t] of [['017','雨って避けたら濡れないよね ～RAINSHIFT～'],['018','靴とばそ ～SHOE FLY HIGH!～']]){
   const card=page.locator('.game-card').filter({hasText:t});assert.equal(await card.count(),1);
   assert.equal(new URL(await card.getAttribute('href'),page.url()).pathname,new URL('game'+g+'.html',mount).pathname);
   await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());assert.deepEqual(await card.locator('img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[640,360]);
  }
  await page.screenshot({path:outdir+'/portal-'+id+'-'+profile.name+'.png',fullPage:true});
  const card=page.locator('.game-card').filter({hasText:title});await card.scrollIntoViewIfNeeded();await card.click();await page.locator('#play-button').waitFor();
  const reload=await page.reload();assert.equal(reload.status(),200);await page.locator('#play-button').waitFor();
  await page.screenshot({path:outdir+'/game'+id+'-'+profile.name+'-title.png'});
 }
  const button=async id=>profile.touch?page.locator(id).tap():page.locator(id).click();
  const phase=async p=>page.waitForFunction(p=>document.getElementById('app').dataset.phase===p,p);
  const state=async s=>page.waitForFunction(s=>document.getElementById('app').dataset.state===s,s);
  async function stable(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
  async function geom(){
   await stable();const r=await page.evaluate(()=>({w:innerWidth,h:innerHeight,dw:document.documentElement.scrollWidth,dh:document.documentElement.scrollHeight,targets:[...document.querySelectorAll('button,a')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&getComputedStyle(e).visibility!=='hidden').map(e=>{const b=e.getBoundingClientRect();return {id:e.id||e.textContent,x:b.x,y:b.y,w:b.width,h:b.height};})}));
   assert.ok(r.dw<=r.w+1&&r.dh<=r.h+1);for(const e of r.targets)assert.ok(e.w>=43.5&&e.h>=43.5&&e.x>=-1&&e.y>=-1&&e.x+e.w<=r.w+1&&e.y+e.h<=r.h+1,e.id);return r;
  }
  try{
   await portalEntry('017','雨って避けたら濡れないよね ～RAINSHIFT～');await page.evaluate(()=>document.fonts.ready);assert.equal(await page.title(),'雨って避けたら濡れないよね ～RAINSHIFT～');
   assert.equal(await page.evaluate(()=>('__arcadeDebug'in window)),false);const title=await geom();
   await button('#play-button');await state('explanation');await geom();await button('#tutorial-practice-button');await phase('rain');await button('#accelerate-button');await phase('plan');await stable();
   // Fixed tutorial route chosen from its visible three rain markers, no diagnostic oracle.
   const path=[{x:70,z:300},{x:250,z:170},{x:850,z:170},{x:930,z:300}];
   const pts=await page.evaluate(path=>{const c=document.getElementById('rain-canvas'),b=c.getBoundingClientRect(),s=Math.min(b.width/c.width,b.height/c.height);return path.map(p=>({x:b.x+(b.width-c.width*s)/2+(58+p.x*.884)*s,y:b.y+(b.height-c.height*s)/2+(116+p.z*(c.height-212)/600)*s}));},path);
   if(profile.touch){const c=await context.newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...pts[0],id:9}]});for(const p of pts.slice(1))await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:9}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
   else{await page.mouse.move(pts[0].x,pts[0].y);await page.mouse.down();for(const p of pts.slice(1))await page.mouse.move(p.x,p.y);await page.mouse.up();}
   await state('practice-complete');assert.equal(await page.locator('#score-value').textContent(),'0');await geom();await button('#tutorial-start-button');await state('playing');
   await phase('rain');await button('#accelerate-button');await phase('plan');const planning=await geom();await button('#pause-button');await state('paused');const timer=await page.locator('#timer-value').textContent();await page.waitForTimeout(200);assert.equal(await page.locator('#timer-value').textContent(),timer);await button('#resume-button');
   await state('result');assert.ok((await page.locator('#menu').textContent()).includes('GOALまで届いていません'));const result=await geom();await page.screenshot({path:outdir+'/game017-'+profile.name+'-result.png'});await button('#retry-button');await state('playing');assert.equal(await page.locator('#score-value').textContent(),'0');await button('#pause-button');await button('#title-button');
   await button('#mute-button');await page.waitForFunction(()=>document.getElementById('mute-button').textContent==='音 OFF');await page.reload();await page.locator('#play-button').waitFor();assert.equal(await page.locator('#mute-button').textContent(),'音 OFF');
   await page.waitForLoadState('networkidle');await Promise.all(jobs);const loaded=[...new Map(resources.map(r=>[r.url,r])).values()];const fonts=await page.evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status})));
   assert.ok(fonts.some(f=>f.family.replaceAll('"','')==='Arcade Rounded'&&f.status==='loaded'));assert.ok(loaded.some(r=>r.kind==='font'));assert.ok(!loaded.some(r=>r.phaser));assert.ok(loaded.filter(r=>r.kind==='script').reduce((s,r)=>s+r.bytes,0)<300000);
   assert.ok(loaded.every(r=>new URL(r.url).pathname.startsWith(new URL(mount).pathname)));
   const apiCalls=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('openrouter')||r.name.includes('decisions')).map(r=>r.name));assert.deepEqual(apiCalls,[]);
   await button('#portal-link');await page.locator('.game-card').first().waitFor();assert.equal(await page.locator('.game-card').count(),18);
   const card=page.locator('.game-card').filter({hasText:'雨って避けたら濡れないよね'});assert.equal(await card.count(),1);const image=card.locator('img');await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());assert.deepEqual(await image.evaluate(i=>[i.naturalWidth,i.naturalHeight]),[640,360]);await card.click();await page.locator('#play-button').waitFor();
   assert.deepEqual(errors,[]);records.push({mount,profile,status:'PASS',title,planning,result,resources:loaded,fonts,apiCalls,forcedRuntimeWrites:false,productionDiagnosticOracle:false,errors});console.log(mount+' '+profile.name+' PASS');
  }catch(e){await page.screenshot({path:outdir+'/game017-FAILURE-'+profile.name+'.png'});records.push({mount,profile,status:'FAIL',error:String(e),errors});process.exitCode=1;}
  finally{await Promise.all(jobs);await context.close();}
 }
}finally{await browser.close();await mkdir('docs/game018/publication-qa',{recursive:true});await writeFile(outdir+'/GAME017_PUBLIC.json',JSON.stringify({records},null,2)+'\n');}
