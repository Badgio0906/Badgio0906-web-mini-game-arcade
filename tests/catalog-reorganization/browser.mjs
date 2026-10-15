import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
const out=process.env.CATALOG_QA_OUT;if(!out)throw Error('unique CATALOG_QA_OUT required');await mkdir(out,{recursive:true});
const dist=resolve(process.env.CATALOG_DIST||'dist'),live=process.env.CATALOG_LIVE==='1';
const raw=process.env.HTTPS_PROXY||process.env.https_proxy;
const proxy=live&&raw?(()=>{const u=new URL(raw);return{server:u.origin,username:decodeURIComponent(u.username),password:decodeURIComponent(u.password)}})():undefined;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={at:new Date().toISOString(),source:process.env.CATALOG_SOURCE,live,checks:[],errors:[],postAttempts:[],views:[]};
const active=[1,2,3,5,6,8,9,11,12,13,14,15,16,17,18,19,20,22,23,24,25,27,31,32].map(n=>`game${String(n).padStart(3,'0')}`);
const complete=['game001','game016','game018','game019','game020','game022','game023','game025','game032'];
const check=(pass,name,detail)=>{report.checks.push({pass:!!pass,name,detail});if(!pass)throw Error(name)};
try{for(const [width,height,prefix] of [[1440,900,'/'],[390,844,'/'],[320,720,'/'],[844,390,'/'],...(live?[]:[[390,844,'/Badgio0906-web-mini-game-arcade/']])]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1440,isMobile:width!==1440});
 await context.addInitScript(()=>{if(!localStorage.getItem('qa:seed')){localStorage.setItem('game100garage:favorites:v1',JSON.stringify(['game032','game026','game028','game029','game030']));localStorage.setItem('web-mini-arcade:v1:game026:snapshot','qa-unchanged-sentinel');localStorage.setItem('qa:seed','1')}});
 await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(req.method()!=='GET'){report.postAttempts.push(u.pathname);return route.abort()};if(u.hostname==='pagead2.googlesyndication.com')return route.fulfill({body:'',contentType:'application/javascript'});if(u.hostname==='analytics.game100garage.com')return route.fulfill({status:503,body:'QA offline fixture'});if(live)return route.continue();let path=u.pathname.slice(prefix.length)||'index.html';if(!u.pathname.startsWith(prefix)||u.hostname!=='game100garage.com')return route.fulfill({status:404,body:''});try{return route.fulfill({body:await readFile(resolve(dist,decodeURIComponent(path))),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:'missing'})}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(15000);
 await page.goto('https://game100garage.com'+prefix+'index.html');await page.locator('.game-card').first().waitFor();
 const deny=page.locator('#analytics-settings-host #deny');if(await deny.isVisible())await deny.click();
 const visible=()=>page.locator('.game-card:not([hidden])').evaluateAll(cs=>cs.map(c=>c.dataset.gameId));
 const numbers=()=>page.locator('.game-card').evaluateAll(cs=>Object.fromEntries(cs.map(c=>[c.dataset.gameId,c.querySelector('.game-number').textContent])));
 check((await visible()).length===24,'active24',{width,prefix});check((await visible())[0]==='game032','loaded favorite prioritized',{width});
 const initial=await numbers();check(active.every((id,i)=>initial[id]===String(i+1).padStart(3,'0')),'stable001–024',{width});
 check(JSON.stringify(await page.locator('.game-development-status--complete').evaluateAll(ss=>ss.map(s=>s.closest('article').dataset.gameId).sort()))===JSON.stringify([...complete].sort()),'exactly nine complete',{width});
 for(const id of ['game004','game007','game010','game021','game026','game028','game029','game030'])check(await page.locator(`[data-game-id=${id}]`).count()===0,'excluded '+id,{width});
 await page.locator('[data-game-id=game019] .favorite-button').click();check(await numbers().then(current=>active.every(id=>current[id]===initial[id])),'favorite preserves numbers',{width});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('game100garage:favorites:v1')));check(['game026','game028','game029','game030'].every(id=>saved.includes(id)),'hidden favorites preserved',{width});
 check(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game026:snapshot'))==='qa-unchanged-sentinel','unrelated save unchanged',{width});
 await page.locator('#discovery-panel > summary').click();
 await page.locator('[data-development-status=complete]').click();check((await visible()).length===9,'complete filter9',{width});check(await numbers().then(current=>active.every(id=>current[id]===initial[id])),'filter preserves numbers',{width});
 await page.locator('#clear-filters').click();check((await visible()).length===24,'clear restores24',{width});
 await page.evaluate(()=>scrollTo(0,0));const image=`${out}/${width}-${prefix==='/'?'root':'subpath'}.png`;await page.screenshot({path:image});report.views.push(image);
 await page.locator('[data-game-id=game008] .game-play').click();await page.locator('.arcade-portal-return').first().click();await page.locator('.game-card').first().waitFor();check((await visible()).length===24,'008 PLAY and return',{width});
 for(const id of ['004','007','010','021']){await page.goto('https://game100garage.com'+prefix+`game${id}.html`);check(await page.locator('h1').innerText()==='このゲームは公開を終了しました。','retired notice '+id,{width});check(await page.locator('canvas').count()===0,'no retired engine '+id,{width});await page.locator('a[href="./index.html"]').click();await page.locator('.game-card').first().waitFor();}
 if(width===390&&prefix==='/'){for(const id of ['026','028','029','030']){await page.goto('https://game100garage.com/'+`game${id}.html`);await page.waitForTimeout(500);check(await page.locator('canvas').count()>0||await page.locator('main button').count()>0,'hidden game UI '+id,{width});check(await page.locator('h1').allTextContents().then(xs=>!xs.includes('このゲームは公開を終了しました。')),'hidden playable route '+id,{width});}}
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow',{width});await context.close();
}check(report.errors.length===0,'no pageerrors',report.errors);check(report.postAttempts.length===0,'no production writes',report.postAttempts)}catch(e){report.failure=e.message;throw e}finally{await writeFile(`${out}/REPORT.json`,JSON.stringify(report,null,2));await browser.close()}
