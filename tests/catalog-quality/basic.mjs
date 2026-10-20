// Bounded normal-UI audit. No game state, clock or scores are injected.
import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gameCatalog} from '../../src/data/gameCatalog.ts';
const base=process.env.QA_BASE||'http://127.0.0.1:4952/';
const out=process.env.QA_OUT;
if(!out)throw Error('QA_OUT must be a new evidence directory');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const rows=JSON.parse(await readFile(out+'/basic.json','utf8').catch(()=>'[]'));
const sizes=[[1440,900],[390,844],[320,568],[844,390]];
async function snapshot(page){return page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,text:document.body.innerText,overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth,state:document.querySelector('#app')?.getAttribute('data-state'),canvas:[...document.querySelectorAll('canvas')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,internal:[e.width,e.height]};}),buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,text:e.textContent.trim().slice(0,90),disabled:e.disabled})),images:[...document.images].map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0}))}));}
try{for(const [width,height] of sizes)for(const game of gameCatalog.filter(g=>!process.env.QA_IDS||process.env.QA_IDS.split(',').includes(g.id))){
 if(rows.some(r=>r.id===game.id&&r.width===width))continue;
 const mobile=width<1000,context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{localStorage.setItem('game100garage:analytics-consent:v1','denied');window.__auditNative=[];addEventListener('message',e=>{if(e.data?.channel==='game100-native-record')window.__auditNative.push({kind:e.data.kind,game:e.data.game_id});});});
 const row={id:game.id,width,height,actions:[],errors:[],consoleErrors:[],blocked:[],reached:[],limits:[]};
 await context.route('**/*',r=>{if(!r.request().url().startsWith(base)){row.blocked.push({method:r.request().method(),url:r.request().url()});return r.abort();}return r.continue();});
 const page=await context.newPage();page.setDefaultTimeout(1600);page.on('pageerror',e=>row.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});page.on('dialog',d=>d.accept());
 async function click(selector){const es=page.locator(selector);for(let i=0;i<await es.count();i++){const e=es.nth(i);if(await e.isVisible()&&await e.isEnabled()){try{if(mobile)await e.tap();else await e.click();row.actions.push(selector);return true;}catch{}}}return false;}
 try{
  const t=Date.now(),response=await page.goto(new URL(game.route,base).href,{waitUntil:'domcontentloaded',timeout:30000});row.http=response.status();
  await page.waitForTimeout(350);row.title=await snapshot(page);row.readyObservedMs=Date.now()-t;row.reached.push('rendered-title');
  if(game.id==='game032')await page.locator('#loading').waitFor({state:'hidden',timeout:20000});
  row.started=await click('#play-button, #play, button[data-action="play"]');
  await page.waitForTimeout(350);
  if(['game012','game013','game014'].includes(game.id)){
   const frame=await (await page.locator('#legacy-game-frame').elementHandle()).contentFrame();
   await frame.waitForURL(/game\.html\?/, {timeout:45000});await frame.waitForFunction(()=>!document.getElementById('status'),null,{timeout:45000});
   const canvas=frame.locator('#canvas');await canvas.waitFor({state:'visible',timeout:45000});
   if(game.id==='game013'){
    const b=await canvas.boundingBox(),s=Math.min(b.width/1280,b.height/720),position={x:(b.width-1280*s)/2+240*s,y:(b.height-720*s)/2+490*s};
    if(mobile)await canvas.tap({position});else await canvas.click({position});
   }else if(mobile)await canvas.tap();else{await canvas.focus();await page.keyboard.press(game.id==='game014'?'Space':'Enter');}
   await page.waitForTimeout(600);row.native={url:frame.url(),canvas:await canvas.boundingBox(),events:await page.evaluate(()=>window.__auditNative)};row.reached.push('native-loaded-and-input');
   await page.screenshot({path:out+`/${game.id}-${width}-native.png`});
   row.nativeReturn=await click('#legacy-menu-return');
  }else{
   if(game.id==='game018')await click('#start-button');
   if(['game002','game003','game006','game008','game015','game017','game019'].includes(game.id)){
    await click('#skip-practice-button, #practice-play-button');
    for(const k of ['ArrowLeft','ArrowRight','Space']){await page.keyboard.down(k);await page.waitForTimeout(130);await page.keyboard.up(k);}row.actions.push('keyboard-left-right-space');
   }
   const specific={game002:'#stage canvas, #game-canvas canvas',game005:'#left-button, #right-button',game006:'#action-button',game008:'#stage canvas',game009:'#stage button',game011:'#left-button, #right-button',game015:'#left-button, #right-button, #drop-button',game016:'[data-hand]',game018:'#control-button',game019:'#jump-button',game020:'#hint-button',game022:'#stock-button',game023:'[data-kana]',game024:'[data-dir]',game025:'#board button',game027:'#shoot-button',game032:'#action',game033:'#launch',game034:'#candidates button',game035:'#ice'};
   if(specific[game.id]){row.majorTouch=await click(specific[game.id]);await page.waitForTimeout(250);}
   row.reached.push('bounded-input-attempt');
  }
  row.play=await snapshot(page);
  if(['game002','game005','game006','game008','game009','game011','game016','game018','game023','game027'].includes(game.id))await page.screenshot({path:out+`/${game.id}-${width}.png`});
  row.pause=await click('#pause-button, #pause');
  row.returned=await click('#menu-portal, #legacy-portal-return, a.arcade-portal-return, #portal-link, a[href="./index.html"]');
  if(row.returned){await page.waitForTimeout(150);row.returnUrl=page.url();row.returned=new URL(page.url()).pathname==='/index.html';}
  row.limits.push('Full win/result/retry not claimed by this bounded basic audit; see deep-play review.');
 }catch(e){row.failure=e.message.split('\n')[0];await page.screenshot({path:out+`/${game.id}-${width}-observation.png`}).catch(()=>{});}
 rows.push(row);await context.close();await writeFile(out+'/basic.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({id:row.id,width,http:row.http,started:row.started,overflow:row.play?.overflow,returned:row.returned,failure:row.failure,errors:row.errors}));
}}finally{await browser.close();}
