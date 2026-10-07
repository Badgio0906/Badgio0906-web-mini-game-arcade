import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.SHOE018_COMPILED_REPORT_DIR || new URL('../../docs/game018/revision03/QA/compiled-native/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const origin=process.env.SHOE018_COMPILED_ORIGIN||'http://127.0.0.1:5518';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={origin,mode:'compiled-normal-clock-native-input-no-fixture-or-debug',profiles:[]};
try{
 for(const profile of [{name:'desktop',width:1365,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.touch,isMobile:profile.touch});
  const page=await context.newPage(),errors=[],record={name:profile.name,runs:[],captures:[]};page.on('pageerror',e=>errors.push(e.message));
  const input=async id=>profile.touch?page.locator(id).tap():page.locator(id).click();
  const phase=async name=>page.waitForFunction(name=>document.querySelector('#app').dataset.phase===name,name,{timeout:60000});
  const capture=async name=>{
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const drawing=await page.evaluate(()=>{const canvas=document.querySelector('#shoe-canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let opaque=0,total=0;for(let i=3;i<pixels.length;i+=400){total++;if(pixels[i]===255)opaque++;}return {opaqueRatio:opaque/total,phase:document.querySelector('#app').dataset.phase};});
   assert(drawing.opaqueRatio>.95,'canvas must be painted: '+name);
   await page.screenshot({path:out+profile.name+'-'+name+'.png'});record.captures.push({name,...drawing});
  };
  await page.goto(origin+'/game018.html');await page.getByRole('button',{name:'許可しない',exact:true}).click();
  assert.equal(await page.evaluate(()=>('__arcadeDebug' in window)),false);
  await input('#play-button');await input('#start-button');
  for(let i=0;i<2;i++){
   await phase('angle');await page.waitForTimeout(i?650:1320);await capture('run'+i+'-angle');
   if(i===1&&!profile.touch)await page.keyboard.press('Space');else await input('#control-button');
   await phase('spin');await page.waitForTimeout(i?1100:400);await capture('run'+i+'-spin');
   if(i===1&&!profile.touch)await page.keyboard.press('Enter');else await input('#control-button');
   await phase('power');await page.waitForTimeout(200);await capture('run'+i+'-power');
   const locks=await page.locator('.locked-values').count()?await page.locator('.locked-values').innerText():await page.locator('#spin-value').innerText();
   await page.waitForTimeout(120);await input('#control-button');await phase('kick');await page.waitForTimeout(350);await capture('run'+i+'-kick');
   await phase('flight');await capture('run'+i+'-flight');
   await page.waitForFunction(()=>document.querySelector('#app').dataset.state==='result',null,{timeout:90000});await capture('run'+i+'-result');
   const score=await page.locator('#result-score').innerText();assert(Number(score.replaceAll(',',''))>0);record.runs.push({index:i,input:profile.touch?'tap':i?'Space + Enter + click':'click',locks,score});
   await input('#retry-button');await phase('angle');await capture('run'+i+'-retry');console.log(profile.name,'native run',i,'PASS');
  }
  assert.deepEqual(errors,[]);record.errors=errors;record.status='PASS';report.profiles.push(record);await context.close();
 }
}finally{await browser.close();await writeFile(out+'report.json',JSON.stringify(report,null,2)+'\n');}
