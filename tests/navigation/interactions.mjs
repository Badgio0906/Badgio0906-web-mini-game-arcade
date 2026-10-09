import {chromium} from '@playwright/test';import {mkdir,writeFile} from 'node:fs/promises';import {gameCatalog} from '../../src/data/gameCatalog.ts';
const out=process.env.NAV_QA_OUT;if(!out)throw Error('Unique output required');await mkdir(out,{recursive:true});const base=process.env.NAV_BASE||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={at:new Date().toISOString(),base,checks:[],states:[],errors:[],limitations:[],provenance:'Ordinary inputs with read-only state observations. Simulated Chromium desktop/mobile. No production score or analytics submission.'};
const check=(p,name,data={})=>{report.checks.push({pass:!!p,name,...data});if(!p)throw Error(name);};
let page;
const seen=async(id,label,viewport)=>{const a=page.locator('dialog:modal .arcade-modal-return, .arcade-game-header .arcade-portal-return').last();const v=await a.evaluate(a=>{const b=a.getBoundingClientRect();return {hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('a')===a,y:b.y,height:b.height};});check(v.hit&&v.height>=44&&v.y>=0,'return reachable '+id+' '+label,{viewport,...v});report.states.push({id,label,viewport});};
const nav=async(method)=>{const a=page.locator('dialog:modal .arcade-modal-return, .arcade-game-header .arcade-portal-return').last();if(method==='keyboard'){await a.focus();await page.keyboard.press('Enter');}else await a[method]();await page.waitForURL(new URL('index.html',base).href);};
const open=async g=>{await page.goto(new URL(g.route,base).href,{waitUntil:'domcontentloaded'});await page.waitForSelector('.arcade-game-header .arcade-portal-return');await page.waitForTimeout(80);};
async function clickFirst(selectors){for(const selector of selectors){const e=page.locator(selector).first();if(await e.isVisible().catch(()=>false)&&await e.isEnabled()){await e.click();return selector;}}return null;}
const games=process.env.NAV_IDS?gameCatalog.filter(g=>process.env.NAV_IDS.split(',').includes(g.id)):gameCatalog;
const widths=process.env.NAV_WIDTHS?.split(',').map(Number);
report.selection={games:games.map(g=>g.id),widths:widths||[1300,390]};
try{for(const viewport of [{width:1300,height:900},{width:390,height:844}].filter(v=>!widths||widths.includes(v.width))){
 const context=await browser.newContext({viewport,hasTouch:viewport.width===390,isMobile:viewport.width===390});await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await context.route('**/*',r=>r.request().method()==='POST'||!r.request().url().startsWith(base)?r.abort():r.continue());page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));
 for(const g of games){
  await open(g);await seen(g.id,'title',viewport);await nav('keyboard');check(page.url()===new URL('index.html',base).href,'title keyboard arrival '+g.id,{viewport});
  await open(g);const help=await clickFirst(['#tutorial-explain-button','#explain-button','#explain','#help','#how-button']);
  if(help){await page.waitForTimeout(80);await seen(g.id,'explanation',viewport);await nav(viewport.width===390?'tap':'click');}
  await open(g);const training=await clickFirst(['#tutorial-again-button','#practice-button','#practice','#train','#training']);
  if(training){await page.waitForTimeout(150);await seen(g.id,'practice',viewport);await page.screenshot({path:`${out}/practice-${g.id}-${viewport.width}.png`});
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-game-arcade:telemetry:v1')||'[]').filter(e=>e.name==='run_start').length);
   const a=page.locator('dialog:modal .arcade-modal-return, .arcade-game-header .arcade-portal-return').last();await a.focus();await page.keyboard.press('Space');
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-game-arcade:telemetry:v1')||'[]').filter(e=>e.name==='run_start').length);check(before===after,'focused return Space starts no RUN '+g.id,{viewport});await nav('keyboard');
  }
  await open(g);const play=await clickFirst(['#play-button','#play','#new-world','#new-game']);
  if(play){
   if(g.id==='game018'){await page.locator('#start-button').click();}
   if(g.id==='game016'){const skip=page.getByRole('button',{name:'すぐ遊ぶ',exact:true});if(await skip.isVisible().catch(()=>false))await skip.click();}
   await page.waitForTimeout(g.id==='game031'?1200:100);
   await seen(g.id,'after-start',viewport);
   const pause=await clickFirst(['#pause-button','#pause']);
   if(pause){await page.waitForTimeout(80);await seen(g.id,'pause',viewport);}
   await nav(viewport.width===390?'tap':'click');check(page.url()===new URL('index.html',base).href,'started game actual return '+g.id,{viewport});
  }else report.limitations.push({id:g.id,viewport,unreached:'main-start-selector'});
 }
 await context.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');
}check(!report.errors.length,'no page errors');report.result='PASS';}catch(e){report.result='FAIL';report.failure=e.message;if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');}console.log({result:report.result,checks:report.checks.length,states:report.states.length,failure:report.failure,limitations:report.limitations});if(report.result!=='PASS')process.exitCode=1;
