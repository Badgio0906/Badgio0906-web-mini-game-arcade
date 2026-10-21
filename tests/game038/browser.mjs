// Game038 normal-input browser probe. Start a dev server first, e.g. `npx vite --port 4957 --strictPort`.
// GAME038_BASE=http://127.0.0.1:4957 GAME038_REPORT=docs/game038/QA/<run> node tests/game038/browser.mjs
import {chromium} from '@playwright/test';import fs from 'node:fs';import path from 'node:path';
const dir=process.env.GAME038_REPORT||`docs/game038/QA/browser-${new Date().toISOString().replace(/[:.]/g,'-')}`;fs.mkdirSync(dir,{recursive:true});
const base=process.env.GAME038_BASE||'http://127.0.0.1:4957',browser=await chromium.launch({executablePath:process.env.GAME038_CHROMIUM||undefined,headless:true}),results=[];
const check=(v,message)=>{if(!v)throw Error(message);};const HOSTILE='<i>ひかり</i>&amp;';
try{for(const viewport of [{width:1365,height:900,name:'desktop'},{width:390,height:844,name:'phone'},{width:320,height:640,name:'small'},{width:844,height:390,name:'landscape'}]){
 const touch=viewport.name!=='desktop',context=await browser.newContext({viewport,hasTouch:touch,isMobile:viewport.name==='phone'||viewport.name==='small'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await context.route('**/*',r=>/googlesyndication|google-analytics|googletagmanager|analytics.game100garage/.test(r.request().url())?r.abort():r.continue());
 const state=()=>page.locator('#app').getAttribute('data-state'),model=()=>page.evaluate(()=>window.__game038),save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game038:state')??'null'));
 const tap=async sel=>{const l=page.locator(sel);if(touch)await l.tap();else await l.click();};const settle=()=>page.waitForTimeout(480);
 // Drive decisions with normal clicks until the career ends (or the practice card appears).
 const drive=async(shotName)=>{const shot=new Set();const snap=async kind=>{if(shotName&&!shot.has(kind)){shot.add(kind);await page.screenshot({path:path.join(dir,`${viewport.name}-${kind}.png`)});}};for(let n=0;n<1500;n++){const st=await state();if(st==='card')return;const m=await model();
   if(st==='decide'){await settle();const note=page.locator('#note');if(await note.count()){await note.fill(m.career?.pending?.kind==='end'?'おつかれさま！':'たのしい');await snap(m.career?.pending?.kind==='end'?'ending':'question');await tap('#answer');}else if(await page.locator('#real').count()){return 'practice-end';}else{await snap('decision');await tap('#choice-0');}continue;}
   if(st==='paused'){await settle();await tap(await page.locator('#start').count()?'#start':'#resume');continue;}
   if(st==='play'&&shotName&&(await model()).speed!==0)await tap('#speed-next');await page.waitForTimeout(60);}throw Error('career did not finish');};
 try{await page.goto(base+'/game038.html');const deny=page.locator('#analytics-settings-host #deny');if(await deny.count())await deny.click();await settle();await page.screenshot({path:path.join(dir,viewport.name+'-title.png')});check(await state()==='title','title first');
  // Practice: six months, then straight to the real setup.
  await tap('#practice');check(await state()==='paused','practice debut card');await settle();await tap('#start');await tap('#speed-4');
  check(await drive('')==='practice-end','practice reaches its end card');check(((await save())?.runs??0)===0,'practice not counted');await tap('#real');check(await state()==='setup','practice leads to setup');
  // Real debut with a free-typed (hostile) name and a chosen genre.
  await page.locator('#name').fill(HOSTILE);await page.locator('.genre:has(input[value=song])').click();check(await page.locator('input[value=song]').isChecked(),'genre selected by click');await page.screenshot({path:path.join(dir,viewport.name+'-setup.png')});await tap('#debut');
  check(await state()==='paused','debut card shown');const debut=await model();check(debut.career.aim==='song'&&debut.career.name.includes('ひかり')&&!debut.career.name.includes('<'),'name and aim taken from input');await page.screenshot({path:path.join(dir,viewport.name+'-debut.png')});await settle();await tap('#start');check(await state()!=='paused','started');
  for(let i=0;i<40&&await state()!=='play';i++){await settle();if(await page.locator('#choice-0').count())await tap('#choice-0');}if(await state()==='play'){await tap('#speed-pause');check((await model()).paused,'pause button stops time');await page.waitForTimeout(300);await tap('#focus-rest');check((await model()).career.focus==='rest','focus button switches');await page.screenshot({path:path.join(dir,viewport.name+'-play.png'),fullPage:true});await tap('#speed-1');}
  // Reload resumes the same career into the pause dialog.
  const before=(await model()).career.month;await page.reload();await settle();check(await state()==='paused','reload resumes paused');check((await model()).career.month===before,'same month after reload');
  await tap('#resume');await tap('#speed-next');await drive('real');
  check(await state()==='card','record card');const card=await page.locator('#card-body').innerText();check(card.includes('6万人中')&&card.includes('ひかり')&&card.includes('おつかれさま'),'card content');check(await page.evaluate(()=>!window.__xss&&!document.querySelector('#card-body img')),'name rendered as text');
  const end=await save();check(end.runs===1&&end.history.length===1&&end.snapshot===null&&end.bestRank>=1,'run recorded once');await page.screenshot({path:path.join(dir,viewport.name+'-card.png'),fullPage:true});
  for(const id of ['again','copy','card-title']){const b=await page.locator('#'+id).boundingBox();check(b.height>=44&&b.x>=0&&b.x+b.width<=viewport.width+1,id+' size/inside');}
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  await tap('#again');check(await state()==='setup','again returns to setup with name kept');check((await page.locator('#name').inputValue())===end.lastName,'last name prefilled');
  check(!errors.length,'no page errors '+errors.join(' | '));results.push({viewport:viewport.name,pass:true,months:end.history[0].months,peak:end.history[0].peakSubs,rank:end.history[0].rank,reason:end.history[0].reason,aim:end.history[0].aim,direction:end.history[0].direction});
 }catch(error){results.push({viewport:viewport.name,pass:false,error:String(error?.message??error),errors});await page.screenshot({path:path.join(dir,viewport.name+'-failure.png')}).catch(()=>{});}finally{await context.close();}
}}finally{await browser.close();fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify({base,at:new Date().toISOString(),results},null,1));console.log(JSON.stringify(results,null,1));}
if(results.some(r=>!r.pass))process.exitCode=1;
