import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.PHASE1_QA_OUTPUT||'artifacts/adsense-content-phase1',base=process.env.PHASE1_QA_BASE||'http://127.0.0.1:4922/';
await fs.mkdir(out+'/screenshots',{recursive:true});
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const routes=['index.html','about.html','games/yokodori-days/index.html','games/tachibana-task-heaven/index.html','games/finger-heart-challenge/index.html','game025.html','game032.html'];
const results=[];
async function test(route,width,prefix=''){
 const mobile=width<1000,ctx=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile});
 const errors=[],consoleErrors=[],blocked=[];
 await ctx.route('**/*',r=>{const q=r.request();if(!q.url().startsWith(base)){blocked.push({method:q.method(),url:q.url()});return r.abort();}return r.continue();});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 const name=route.replaceAll('/','-').replace('.html','')+'-'+width+(prefix?'-subpath':'');
 const row={name,route,width,prefix,errors,consoleErrors,blocked};
 const click=async locator=>{const href=await locator.getAttribute('href');const dest=href&&new URL(href,page.url()).href;if(mobile)await locator.tap();else await locator.click();if(dest)await page.waitForURL(dest);};
 async function later(){const l=page.locator('#analytics-settings-host').locator('#later');if(await l.isVisible())await click(l);}
 async function snap(){return page.evaluate(()=>({text:document.body.innerText,overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth,headings:[...document.querySelectorAll('h1,h2')].map(e=>e.textContent),font:getComputedStyle(document.body).fontFamily}));}
 try{
 const resp=await page.goto(base+prefix+route,{waitUntil:'networkidle'});assert.equal(resp.status(),200);await later();await page.evaluate(()=>document.fonts.ready);
 row.title=await snap();assert.equal(row.title.overflow,0);
 assert(!row.title.text.includes('�'));
 await page.screenshot({path:out+'/screenshots/'+name+'-title.png',fullPage:route==='about.html'});
 if(route==='index.html'){
  assert.equal(await page.locator('.game-card').count(),27);assert.equal(await page.locator('.game-development-status--complete').count(),9);
  row.gameLinks=await page.locator('.game-play').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
  const visible=()=>page.locator('.game-card:visible').evaluateAll(es=>es.map(e=>e.dataset.gameId));
  const all=await visible();await click(page.locator('#discovery-panel > summary'));await click(page.locator('#tag-picker > summary'));
  await click(page.locator('#tag-options [data-tag-id="reflex"]'));await click(page.locator('#tag-options [data-tag-id="short"]'));row.or=await visible();await click(page.locator('[data-mode="and"]'));row.and=await visible();assert(row.and.length<=row.or.length);
  await click(page.locator('#clear-filters'));assert.deepEqual(await visible(),all);
  await click(page.locator('[data-development-status="complete"]'));assert.equal((await visible()).length,9);await click(page.locator('#clear-filters'));
  await click(page.locator('[data-game-id="game035"] .favorite-button'));assert.deepEqual(await visible(),all);await page.reload({waitUntil:'networkidle'});await later();assert.equal((await visible())[0],'game035');assert.equal((await visible()).length,27);row.filterFavorites=true;
  await click(page.locator('.footer-links a[href="./about.html"]'));assert.equal(new URL(page.url()).pathname,'/'+prefix+'about.html');await click(page.locator('.about-return'));assert.equal(new URL(page.url()).pathname,'/'+prefix+'index.html');row.aboutRoundTrip=true;
 }else if(route==='about.html'){
  const issue=page.locator('.about-issue-link');assert.equal(await issue.getAttribute('href'),'https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/issues/new/choose');
  row.linkSize=await issue.boundingBox();assert(row.linkSize.height>=44);
  await click(page.locator('a[href="./privacy.html"]'));assert.equal(new URL(page.url()).pathname,'/'+prefix+'privacy.html');assert.equal((await page.locator('body').innerText()).includes('プライバシー'),true);
  await page.goto(base+prefix+route);await click(page.locator('.about-return'));assert.equal(new URL(page.url()).pathname,'/'+prefix+'index.html');row.returned=true;
 }else if(route.startsWith('games/')){
  row.meta=await page.locator('meta[name="description"]').getAttribute('content');
  const initial=await page.locator('#legacy-start').innerText();assert(initial.includes('すぐ遊ぶ'));assert(initial.includes('PCは'));
  await click(page.locator('#tutorial-explain-button'));assert(await page.locator('#title-button').isVisible());await click(page.locator('#title-button'));assert.equal(await page.locator('#legacy-start').innerText(),initial);
  await click(page.locator('#tutorial-again-button'));assert(await page.locator('#practice-sample').isVisible());await click(page.locator('#title-button'));assert.equal(await page.locator('#legacy-start').innerText(),initial);row.shellRestore=true;
  await click(page.locator('#play-button'));
  const frame=await (await page.locator('#legacy-game-frame').elementHandle()).contentFrame();assert(frame,'native iframe attached');await frame.waitForURL(/game\.html\?/);
  await frame.waitForFunction(()=>!document.getElementById('status'),{},{timeout:45000});
  await frame.locator('#canvas').waitFor({state:'visible'});await page.waitForTimeout(1200);
  row.nativeReady=true;row.frameUrl=frame.url();
  await page.screenshot({path:out+'/screenshots/'+name+'-native.png'});
  const canvas=frame.locator('#canvas');if(mobile)await canvas.tap();else{await canvas.click();await page.keyboard.press(route.includes('tachibana')?'Digit1':route.includes('finger')?'Space':'Enter');}await page.waitForTimeout(250);row.nativeInput=mobile?'touch':'keyboard';
  await click(page.locator('#legacy-menu-return'));assert.equal(await page.locator('#legacy-start').innerText(),initial);assert.equal(await page.locator('#legacy-game-frame').getAttribute('src'),null);
  await click(page.locator('#legacy-portal-return'));assert.equal(new URL(page.url()).pathname,'/'+prefix+'index.html');row.returned=true;
 }else{
  if(route==='game025.html')assert(!row.title.text.includes('作者の試遊・実機評価はまだ'));
  if(route==='game032.html'){assert(row.title.text.includes('完成版'));await page.locator('#loading').waitFor({state:'hidden'});}
  await click(page.locator('#play'));await page.waitForTimeout(400);
  row.play=await snap();assert.equal(row.play.overflow,0);assert.equal(await page.locator('#menu').isVisible(),false);
  await page.screenshot({path:out+'/screenshots/'+name+'-play.png'});
  if(route==='game025.html')await click(page.locator('#board button').first());
  await click(page.locator('#pause'));await click(page.locator('#menu-portal'));assert.equal(new URL(page.url()).pathname,'/'+prefix+'index.html');row.returned=true;
 }
 assert.equal(errors.length,0);assert.equal(blocked.filter(q=>q.method!=='GET'&&q.method!=='HEAD').length,0);row.pass=true;
 }catch(e){row.pass=false;row.failure=e.message;await page.screenshot({path:out+'/screenshots/'+name+'-failure.png',fullPage:true}).catch(()=>{});}
 results.push(row);console.log(JSON.stringify({name,pass:row.pass,failure:row.failure,native:row.nativeReady,errors}));await ctx.close();await fs.writeFile(out+'/browser.json',JSON.stringify(results,null,2));
}
try{for(const width of [1440,390,320])for(const route of routes)await test(route,width);for(const route of ['index.html','about.html','games/finger-heart-challenge/index.html'])if(process.env.PHASE1_QA_SUBPATH)await test(route,390,process.env.PHASE1_QA_SUBPATH);}finally{await browser.close();}
if(results.some(r=>!r.pass))process.exitCode=1;
