import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE||'http://127.0.0.1:4961/',out=process.env.QA_OUT;if(!out)throw Error('QA_OUT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const rows=[];
try{for(const [slug,id] of [['yokodori-days','012'],['tachibana-task-heaven','013'],['finger-heart-challenge','014']])for(const [width,height] of [[390,844],[320,568],[844,390],[1440,900]]){
 const c=await b.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});await c.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');window.__native=[];addEventListener('message',e=>{if(e.data?.channel==='game100-native-record')window.__native.push(e.data.kind);});});
 const row={id,width,height,errors:[],blocked:[]};await c.route('**/*',r=>{if(!r.request().url().startsWith(base)){row.blocked.push(r.request().method());return r.abort();}return r.continue();});
 const p=await c.newPage();p.on('pageerror',e=>row.errors.push(e.message));
 try{await p.goto(base+'games/'+slug+'/index.html');
 if(id==='012'&&width<height&&width<600){
  await p.getByRole('heading',{name:'横向きで遊んでください',exact:true}).waitFor();assert.equal(await p.locator('#legacy-game-frame').getAttribute('src'),null);row.orientationGuide=true;
 }else{
 await p.locator('#play-button').click();const f=await(await p.locator('#legacy-game-frame').elementHandle()).contentFrame();await f.waitForURL(/game\.html/);await f.waitForFunction(()=>!document.getElementById('status'),null,{timeout:45000});await p.waitForTimeout(500);
 const cv=f.locator('#canvas');row.canvas=await cv.evaluate(e=>{const r=e.getBoundingClientRect();return{internal:[e.width,e.height],x:r.x,y:r.y,width:r.width,height:r.height,frame:[innerWidth,innerHeight]};});
 if(id==='012'){assert.deepEqual(row.canvas.internal,[960,540]);assert(Math.abs(row.canvas.width/row.canvas.height-16/9)<.01);assert(row.canvas.x>=-.5&&row.canvas.y>=-.5);assert(row.canvas.x+row.canvas.width<=row.canvas.frame[0]+.5&&row.canvas.y+row.canvas.height<=row.canvas.frame[1]+.5);}
 if(id==='013'&&width<height){row.orientationGuide=true;}else{
  if(id==='013'){const r=await cv.boundingBox(),s=Math.min(r.width/1280,r.height/720);await cv.click({position:{x:(r.width-1280*s)/2+240*s,y:(r.height-720*s)/2+490*s}});}else if(width<1000)await cv.tap();else{await cv.focus();await p.keyboard.press(id==='012'?'Enter':'Space');}
  await p.waitForTimeout(700);row.events=await p.evaluate(()=>window.__native);assert(row.events.includes('start'),'native RUN actually started');
 }
 await p.screenshot({path:out+`/game${id}-${width}.png`});await p.locator('#legacy-menu-return').click();
 }
 if(row.orientationGuide)await p.screenshot({path:out+`/game${id}-${width}.png`});await p.locator('#legacy-portal-return').click();await p.waitForURL('**/index.html');row.returned=true;assert.equal(row.errors.length,0);row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;await p.screenshot({path:out+`/game${id}-${width}-failure.png`}).catch(()=>{});}
 rows.push(row);await c.close();await writeFile(out+'/REPORT.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({id,width,pass:row.pass,failure:row.failure}));
}}finally{await b.close();}if(rows.some(r=>!r.pass))process.exitCode=1;
