import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {gameCatalog} from '../../src/data/gameCatalog.ts';
const out=process.env.NAV_QA_OUT;if(!out)throw Error('Unique output required');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={at:new Date().toISOString(),base:process.env.NAV_BASE||'http://127.0.0.1:5173/',views:[],errors:[],provenance:'Simulated desktop/mobile viewports; source-backed layout measurement. No production POST; human play/physical devices untested.'};
try{for(const viewport of [{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}]){
 const context=await browser.newContext({viewport,isMobile:viewport.width!==1300,hasTouch:viewport.width!==1300});await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await context.route('**/*',r=>r.request().method()==='POST'||!r.request().url().startsWith(report.base)?r.abort():r.continue());
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 for(const g of gameCatalog){
  await page.goto(new URL(g.route,report.base).href,{waitUntil:'domcontentloaded'});await page.waitForTimeout(g.id==='game031'?700:120);
  await page.waitForSelector('.arcade-game-header .arcade-portal-return');
  const layout=await page.locator('.arcade-game-header .arcade-portal-return').evaluate(a=>{
   const b=a.getBoundingClientRect(),h=a.closest('header').getBoundingClientRect();let overlaps=[];
   for(const el of a.closest('header').querySelectorAll('button,a')){if(el===a||!el.getClientRects().length)continue;const r=el.getBoundingClientRect();if(r.width&&r.height&&b.left<r.right-1&&b.right>r.left+1&&b.top<r.bottom-1&&b.bottom>r.top+1)overlaps.push(el.id||el.className);}
   return {text:a.textContent,href:a.href,x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,headerBottom:h.bottom,overlaps,hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('a')===a,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  report.views.push({gameId:g.id,viewport,layout});
  if(viewport.width===390||['game001','game015','game018','game019','game031','game012'].includes(g.id))await page.screenshot({path:`${out}/${g.id}-${viewport.width}.png`});
 }
 await context.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');
}}finally{await browser.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');}
const bad=report.views.filter(v=>{const b=v.layout;return b.height<44||b.x<0||b.right>v.viewport.width||b.bottom>b.headerBottom+1||!b.hit||b.overlaps.length||b.text!=='← ゲーム一覧へ';});console.log({views:report.views.length,bad:bad.map(v=>({gameId:v.gameId,viewport:v.viewport,layout:v.layout})),errors:report.errors});if(bad.length||report.errors.length)process.exitCode=1;
