import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base=process.env.GAME029_BASE??'http://127.0.0.1:4929';
const sources=['game029.html',...fs.readdirSync('src/games/game029').sort().map(f=>`src/games/game029/${f}`)];
const hash=crypto.createHash('sha256').update(sources.map(f=>`${f}\n${crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')}`).join('\n')).digest('hex');
const run=new Date().toISOString().replaceAll(':','-');const out=process.env.GAME029_REPORT??`docs/game029/QA/${hash.slice(0,12)}/${run}`;
if(fs.existsSync(out))throw new Error('Unique new output directory required');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];let livePage=null,liveViewport=null,liveErrors=[];
try{
 for(const v of [{name:'desktop',width:1365,height:900},{name:'phone',width:390,height:844},{name:'small-phone',width:320,height:844},{name:'landscape',width:844,height:390}]){
  const context=await browser.newContext({viewport:v,isMobile:v.name!=='desktop',hasTouch:v.name!=='desktop'});const page=await context.newPage();livePage=page;liveViewport=v;const errors=[];liveErrors=errors;await page.addInitScript(()=>{window.__qaInput=[];for(const name of ['pointerdown','pointerup','pointercancel','lostpointercapture','click','keydown','keyup'])document.addEventListener(name,e=>{window.__qaInput.push({type:name,target:e.target?.id??'',key:e.key??null,pointer:e.pointerId??null,state:document.querySelector('#app')?.dataset.state??null});window.__qaInput=window.__qaInput.slice(-40);},true);});page.on('pageerror',e=>errors.push(e.message));
  await page.route(/analytics\.game100garage|google-analytics|googlesyndication|doubleclick/,r=>r.abort());
  await page.goto(`${base}/game029.html`);const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();
  await page.screenshot({path:path.join(out,`${v.name}-title.png`)});
  const tap=async id=>{if(v.name==='desktop')await page.locator(id).click();else await page.locator(id).tap();};
  await tap('#play');await tap('#cast');await page.waitForFunction(()=>document.querySelector('#phase')?.textContent?.includes('巻き上げ中'),{timeout:12000});
  // Readonly saved-model fixture is not used to steer; ordinary right/left keys or a water drag only.
  if(v.name==='desktop'){await page.keyboard.down('ArrowLeft');await page.waitForTimeout(550);await page.keyboard.up('ArrowLeft');await page.keyboard.down('ArrowRight');await page.waitForTimeout(1100);await page.keyboard.up('ArrowRight');}
  else{const b=await page.locator('#water').boundingBox();const cdp=await context.newCDPSession(page);const y=b.y+b.height*.6;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.3,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*.8,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await page.screenshot({path:path.join(out,`${v.name}-winding.png`)});
  await tap('#pause');const depth=await page.locator('#depth').textContent();await page.waitForTimeout(350);if(await page.locator('#depth').textContent()!==depth)throw new Error('Pause progressed');await page.screenshot({path:path.join(out,`${v.name}-paused.png`)});await tap('#resume');
  await page.waitForFunction(()=>document.querySelector('#phase')?.textContent?.includes('個回収'),{timeout:12000});await page.screenshot({path:path.join(out,`${v.name}-returned.png`)});
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game029:save')));if(initial.model.casts!==1)throw new Error('Return count not1');
  await page.reload();if(!await page.locator('#restore').isVisible())throw new Error('Missing continuation');await tap('#restore');await tap('#resume');const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game029:save')));if(initial.model.balance!==restored.model.balance)throw new Error('Deposit repeated');
  await tap('#finish');await page.screenshot({path:path.join(out,`${v.name}-result.png`)});const terminal=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game029:save')));if(terminal.finishes!==1||terminal.model!==null)throw new Error('Finish not terminal');
  await tap('#retry');await tap('#cast');await tap('#pause');await tap('#to-title');await page.reload();if(await page.locator('#restore').count())throw new Error('Abandoned resurrected');
  await tap('#practice');await page.waitForFunction(()=>document.querySelector('#phase')?.textContent?.includes('練習'));await page.waitForTimeout(800);if(v.name==='desktop'){await page.keyboard.down('ArrowLeft');await page.waitForTimeout(150);await page.keyboard.up('ArrowLeft');}else{const b=await page.locator('#water').boundingBox();await page.touchscreen.tap(b.x+b.width*150/360,b.y+b.height*.5);}
  await page.waitForSelector('#app[data-state="practice-result"]',{timeout:12000});await page.screenshot({path:path.join(out,`${v.name}-practice.png`)});const afterPractice=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game029:save')));if(afterPractice.finishes!==terminal.finishes||afterPractice.best!==terminal.best)throw new Error('Practice modified normal statistics');
  if(errors.length)throw new Error(errors.join(';'));results.push({viewport:v,pass:true,caught:initial.model.lastCaught,score:initial.model.score,pageerrors:errors,normalNative:true,physicalDevice:false});await context.close();
 }
}catch(error){if(livePage&&!livePage.isClosed()){await livePage.screenshot({path:path.join(out,'failure-viewport.png')});const observation=await livePage.evaluate(()=>{const raw=localStorage.getItem('web-mini-arcade:v1:game029:save');const saved=raw?JSON.parse(raw):null;if(saved){saved.runId=null;saved.resultId=null;saved.reported=[];}return {state:document.querySelector('#app')?.dataset.state,phase:document.querySelector('#phase')?.textContent,buttons:[...document.querySelectorAll('button')].map(b=>({id:b.id,disabled:b.disabled,rect:{x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}})),trace:window.__qaInput,saved};});fs.writeFileSync(path.join(out,'failure-observation.json'),JSON.stringify({viewport:liveViewport,errors:liveErrors,observation},null,2));}fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(error),results},null,2));throw error;}
finally{await browser.close();fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({sourceHash:hash,sourceFiles:sources,run,base,results,fixture:'No model/state injection. Ordinary native input; read-only local save assertions.',humanPlaytest:false},null,2));}
console.log(JSON.stringify({out,results}));
