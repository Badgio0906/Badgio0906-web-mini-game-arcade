import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const sizes=[[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const records=[];const errors=[];
try{
 for(const language of['ja','en'])for(const[width,height]of sizes){
  const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('web-mini-arcade:v1:game005:credits','0'));await page.goto(`${process.env.QA_BASE_URL??'http://127.0.0.1:5175'}/game005.html`);await page.locator('#reward-button').waitFor();await page.evaluate(()=>document.fonts.ready);if(language==='en')await page.locator('#language-en-button').click();
  await page.locator('#reward-button').click();
  const observation=await page.evaluate(()=>{const selectors=['.reward-card','.stub-note','#reward-button','#title-button'];return {state:window.__arcadeDebug.state(),model:window.__arcadeDebug.inspection(),credits:document.querySelector('#credit-count').textContent,language:document.querySelector('#app').dataset.language,fontReady:document.fonts.status,document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},boxes:selectors.map(selector=>{const e=document.querySelector(selector),b=e.getBoundingClientRect();return{selector,text:e.textContent,disabled:e.disabled,x:b.x,y:b.y,width:b.width,height:b.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth};})};});
  if(observation.state!=='reward'||observation.model.alive||observation.model.time!==0||observation.credits!=='0')throw Error(`Pending fixture not captured ${JSON.stringify(observation)}`);
  for(const b of observation.boxes){if(b.x< -1||b.y< -1||b.x+b.width>width+1||b.y+b.height>height+1)throw Error(`Outsideviewport ${width}x${height} ${language} ${JSON.stringify(b)}`);if(b.selector.includes('button')&&(b.width<43.5||b.height<43.5||!b.disabled||b.scrollWidth>b.clientWidth+1))throw Error(`Controlbounds ${JSON.stringify(b)}`);}
  if(observation.document.width>width||observation.document.height>height)throw Error(`Documentoverflow ${width}x${height} ${language}`);
  records.push({width,height,language,origin:'saved-zero-credit-fixture; actual native rewarded Stub request; no forced ending',...observation});
  if((width===320&&height===568)||(width===568&&height===320)){await mkdir('docs/ten-game/screenshots/game005',{recursive:true});await page.screenshot({path:`docs/ten-game/screenshots/game005/qa-fixture-${language}-${width}x${height}-pending.png`});}
  await context.close();
 }
 if(errors.length)throw Error(JSON.stringify(errors));
}finally{await writeFile('docs/ten-game/QA/GAME005_PENDING_LAYOUTS.json',JSON.stringify({checkedUtc:new Date().toISOString(),records,errors},null,2));await browser.close();}
console.log(JSON.stringify({records:records.length,errors}));
