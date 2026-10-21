// Game036 normal-input browser probe. Start a dev server first, e.g. `npx vite --port 4956 --strictPort`.
// GAME036_BASE=http://127.0.0.1:4956 GAME036_REPORT=docs/game036/QA/<run> node tests/game036/browser.mjs
import {chromium} from '@playwright/test';import fs from 'node:fs';import path from 'node:path';
const dir=process.env.GAME036_REPORT||`docs/game036/QA/browser-${new Date().toISOString().replace(/[:.]/g,'-')}`;fs.mkdirSync(dir,{recursive:true});
const base=process.env.GAME036_BASE||'http://127.0.0.1:4956',browser=await chromium.launch({executablePath:process.env.GAME036_CHROMIUM||undefined,headless:true}),results=[];
const check=(v,message)=>{if(!v)throw Error(message);};
try{for(const viewport of [{width:1365,height:900,name:'desktop'},{width:390,height:844,name:'phone'},{width:320,height:640,name:'small'},{width:844,height:390,name:'landscape'}]){
 const touch=viewport.name!=='desktop',context=await browser.newContext({viewport,hasTouch:touch,isMobile:viewport.name==='phone'||viewport.name==='small'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await context.route('**/*',r=>/googlesyndication|google-analytics|googletagmanager|analytics.game100garage/.test(r.request().url())?r.abort():r.continue());
 const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game036:state')??'null')),state=()=>page.locator('#app').getAttribute('data-state'),model=()=>page.evaluate(()=>window.__game036);
 const press=async id=>{if(touch)await page.locator('#'+id).tap();else await page.locator('#'+id).click();};
 try{await page.goto(base+'/game036.html');const deny=page.locator('#analytics-settings-host #deny');if(await deny.count())await deny.click();await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,viewport.name+'-title.png')});check(await state()==='title','title first');
  // Practice: the shown pink pair dropped where it spawns forms the staged two-chain.
  await page.locator('#practice').click();check(await state()==='play','practice playing');await page.waitForTimeout(250);const pre=await model();check(pre.training&&pre.game.piece.a===0,'practice pink pair');await page.screenshot({path:path.join(dir,viewport.name+'-practice-preview.png')});
  await press('drop');await page.waitForTimeout(450);await page.screenshot({path:path.join(dir,viewport.name+'-practice-chain.png')});await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,viewport.name+'-practice-chain2.png')});
  await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',null,{timeout:6000});check((await page.locator('#menu').innerText()).includes('2連鎖'),'practice two-chain completed by normal input');check(((await save())?.best??0)===0,'practice excluded from best');await page.screenshot({path:path.join(dir,viewport.name+'-practice-clear.png')});
  await page.waitForTimeout(500);await page.locator('#play').click();check(await state()==='play','production run');
  const well=await page.locator('.well').boundingBox(),pad=await page.locator('.pad').boundingBox();check(well.x>=0&&well.y>=0&&well.x+well.width<=viewport.width+1&&well.y+well.height<=viewport.height+1,'board inside viewport '+JSON.stringify(well));check(pad.y+pad.height<=viewport.height+1&&pad.x+pad.width<=viewport.width+1,'pad inside viewport '+JSON.stringify(pad));
  for(const id of ['left','ccw','drop','cw','right']){const b=await page.locator('#'+id).boundingBox();check(b.width>=44&&b.height>=44,id+' >=44px');}
  // Normal input: move, rotate and hard-drop with the pad (touch) or keyboard (desktop) until the stack tops out.
  let n=0;while(await state()==='play'&&n++<120){const m=await model();if(m.game.phase!=='drop'){await page.waitForTimeout(60);continue;}
   if(touch){if(n%2)await press('cw');await press('drop');}else{if(n%2)await page.keyboard.press('ArrowUp');await page.keyboard.press('Space');}
   if(n===3)await page.screenshot({path:path.join(dir,viewport.name+'-play.png')});await page.waitForTimeout(40);}
  await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',null,{timeout:30000});const end=await save(),text=await page.locator('#menu').innerText();check(end.runs===1&&end.snapshot===null&&end.best>=0,'run recorded once');check(text.includes('もう1回'),'retry offered');await page.screenshot({path:path.join(dir,viewport.name+'-result.png')});
  await page.locator('#menu-title').click({force:true}).catch(()=>{});check(await state()==='result','fresh result ignores the carried-over tap');await page.waitForTimeout(500);await page.keyboard.press('Enter');check(await state()==='play','Enter on focused retry restarts');
  // Pause + resume via button, and reload resume from the saved board.
  await page.locator('#pause').click();check(await state()==='paused','pause');await page.reload();await page.waitForTimeout(250);check(await state()==='paused','reload resumes into pause');await page.waitForTimeout(500);await page.locator('#resume').click();check(await state()==='play','resume');
  check(!errors.length,'no page errors '+errors.join(' | '));results.push({viewport:viewport.name,pass:true,score:end.best});
 }catch(error){results.push({viewport:viewport.name,pass:false,error:String(error?.message??error),errors});await page.screenshot({path:path.join(dir,viewport.name+'-failure.png')}).catch(()=>{});}finally{await context.close();}
}}finally{await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({base,at:new Date().toISOString(),results},null,1));console.log(JSON.stringify(results,null,1));}
if(results.some(r=>!r.pass))process.exitCode=1;
