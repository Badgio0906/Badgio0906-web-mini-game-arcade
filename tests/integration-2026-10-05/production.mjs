import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const bases=(process.env.ARCADE_BASES??'http://127.0.0.1:4191/,http://127.0.0.1:4192/repo/arcade/').split(',');
const out=process.env.ARCADE_REPORT_DIR??'docs/integration-2026-10-05/QA/production';
const ads=process.env.ARCADE_ADS==='1';
const profiles=[{name:'desktop',width:1440,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}];
const routes=[...Array.from({length:11},(_,i)=>`game${String(i+1).padStart(3,'0')}.html`),...[15,16,17,18,19].map(i=>`game${String(i).padStart(3,'0')}.html`),...['yokodori-days','tachibana-task-heaven','finger-heart-challenge'].map(s=>`games/${s}/index.html`)];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),records=[];
try {for(const base of bases)for(const profile of profiles){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.touch,hasTouch:profile.touch,acceptDownloads:true});
 // Validate the ownership tag and layout with an inert external script. Network policy excludes Google ad hosts.
 if(ads)await context.route('https://pagead2.googlesyndication.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:'/* ownership verification loader stub for layout QA */'}));
 const page=await context.newPage(),errors=[],record={base,profile,adsLoaderStub:ads,routes:[]};records.push(record);
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});page.on('requestfailed',r=>errors.push(`${r.failure()?.errorText} ${r.url()}`));
 try{
  assert.equal((await page.goto(base)).status(),200);await page.locator('.game-card').last().waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.game-card').count(),19);assert.equal(await page.locator('#game-count').textContent(),'19');
  assert.equal(await page.locator('.game-tag').count(),76);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'portal overflow');
  for(const card of await page.locator('.game-card').all()){await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());assert.deepEqual(await card.locator('img').evaluate(i=>[i.naturalWidth,i.naturalHeight]),[640,360]);}
  if(ads){const tag=page.locator('head script[src*="adsbygoogle.js"]');assert.equal(await tag.count(),1);assert.equal(await tag.getAttribute('src'),'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2598150338179299');assert.equal(await tag.getAttribute('crossorigin'),'anonymous');assert.ok(await tag.evaluate(e=>e.async));}
  await page.locator('.play-records summary').click();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-play-records').click()]);const payload=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(payload.provenance,'device-local-observed-events');assert.equal(payload.gameCatalog.length,19);assert.ok(payload.events.length<=400);record.export={schemaVersion:payload.schemaVersion,events:payload.events.length,scope:payload.scope};
  await page.locator('.game-card').first().scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${records.length}-${profile.name}-portal.png`});
  for(const route of routes){const response=await page.goto(new URL(route,base).href);assert.equal(response.status(),200);await page.locator('#play-button').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');for(const id of ['#play-button','#tutorial-explain-button','#tutorial-again-button'])assert.ok(await page.locator(id).isVisible(),route+' '+id);
    assert.equal(await page.evaluate(()=>['__arcadeDebug','__orbitDebug','__game019','__tutorialDebug'].some(k=>k in window)),false,'production diagnostics '+route);
    if(route==='game019.html'){await page.locator('#play-button').click();await page.locator('[data-size="medium"]').first().waitFor();await page.waitForTimeout(200);await page.locator('[data-direction="-1"]').click();await page.locator('[data-size="medium"]').click();await page.waitForTimeout(300);if(records.length===1 && process.env.ARCADE_CAPTURE_THUMB==='1')await page.locator('#frog-canvas').screenshot({path:'assets/portal/thumbnails/game019-jump-source.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'frog viewport');await page.screenshot({path:`${out}/${records.length}-${profile.name}-frog.png`});}
    record.routes.push({route,title:await page.title(),status:'PASS'});
  }
  assert.deepEqual(errors,[]);record.status='PASS';console.log(base,profile.name,'19 routes PASS');
 }catch(e){record.status='FAIL';record.error=e.message;process.exitCode=1;await page.screenshot({path:`${out}/${records.length}-FAIL.png`}).catch(()=>{});console.log(base,profile.name,'FAIL',e.message.slice(0,160));}finally{record.errors=errors;await context.close();await writeFile(`${out}/report.json`,JSON.stringify({records,limits:'HTTP/assets/catalog/options/export verification; physical-device performance and human enjoyment not assessed. Google loader is inert when adsLoaderStub is true.'},null,2)+'\n');}
}}finally{await browser.close();}
