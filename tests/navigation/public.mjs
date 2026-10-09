// Published UI with actual resources/public GETs; every write is blocked.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {gameCatalog} from '../../src/data/gameCatalog.ts';
const out=process.env.NAV_QA_OUT,sha=process.env.RECORDS_EXPECTED_COMMIT;
if(!out||!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Unique output and commit required');
await mkdir(out,{recursive:false});
const raw=process.env.HTTPS_PROXY||process.env.https_proxy;
const proxy=raw?(()=>{const u=new URL(raw);return {server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}})():undefined;
const b=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='https://game100garage.com/';
const report={at:new Date().toISOString(),expected_commit:sha,checks:[],errors:[],post_attempts:0,provenance:'Actual published resources and public GETs. Ordinary PLAY and return inputs, simulated viewports, consent denied, no scores or production writes.'};
const check=(p,name,extra={})=>{report.checks.push({pass:!!p,name,...extra});if(!p)throw Error(name)};
let page;
try{for(const viewport of [{width:1300,height:900},{width:390,height:844},{width:320,height:720},{width:844,height:390}]){
 const touch=viewport.width!==1300,c=await b.newContext({viewport,hasTouch:touch,isMobile:touch});
 await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
 await c.route('**/*',r=>{if(r.request().method()==='POST'){report.post_attempts++;return r.abort()}return r.continue()});
 page=await c.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(e.message));
 const portal=async()=>{await page.goto(base+'index.html?qa='+sha.slice(0,12),{waitUntil:'domcontentloaded'});await page.waitForSelector('.game-play')};
 await portal();
 const cards=await page.locator('.game-card').evaluateAll(cs=>cs.map(c=>{const p=c.querySelector('.game-play'),t=c.querySelector('.leaderboard-button');return {id:c.dataset.gameId,order:[...c.children].map(n=>n.className),color:getComputedStyle(p).backgroundColor,height:p.getBoundingClientRect().height,secondary:!t||parseFloat(getComputedStyle(t).fontSize)<parseFloat(getComputedStyle(p).fontSize)&&getComputedStyle(t).backgroundColor!==getComputedStyle(p).backgroundColor}}));
 check(cards.length===30&&await page.locator('.leaderboard-button').count()===20,'30 PLAY / 20 TOP10',{viewport});
 for(const card of cards)check(card.order[0]==='game-image-link'&&card.order[1]==='card-records'&&card.order[2]==='game-play'&&card.order[3]==='game-copy-link'&&card.color==='rgb(239, 190, 79)'&&card.height>=44&&card.secondary,'published card '+card.id,{viewport});
 await page.screenshot({path:`${out}/portal-${viewport.width}.png`});
 for(const g of viewport.width===1300||viewport.width===390?gameCatalog:[gameCatalog[0]]){
  await portal();const play=page.locator(`[data-game-id=${g.id}] .game-play`);await play.scrollIntoViewIfNeeded();if(touch)await play.tap();else{await play.focus();await page.keyboard.press('Enter')}
  await page.waitForURL(new URL(g.route,base).href);const back=page.locator('.arcade-game-header .arcade-portal-return');await back.waitFor();
  const geometry=await back.evaluate(a=>{const r=a.getBoundingClientRect();return {text:a.textContent,height:r.height,x:r.x,y:r.y,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')===a,href:a.href}});
  check(geometry.text==='← ゲーム一覧へ'&&geometry.height>=44&&geometry.hit&&geometry.href===base+'index.html','published return '+g.id,{viewport,...geometry});
  if(touch)await back.tap();else{await back.focus();await page.keyboard.press('Enter')}
  await page.waitForURL(base+'index.html');check(true,'published actual arrival '+g.id,{viewport});
 }
 await c.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');
}check(!report.post_attempts&&!report.errors.length,'no POST or script exceptions');report.result='PASS'}catch(e){report.result='FAIL';report.failure=e.message;process.exitCode=1;if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{})}finally{await b.close();await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n')}
console.log({result:report.result,checks:report.checks.length,failure:report.failure});
