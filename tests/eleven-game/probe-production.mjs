import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// Execute only after final build + exclusive browser release. Relative dist is tested at both mounts.
const mounts=(process.env.ELEVEN_STATIC_URLS??'http://127.0.0.1:4191/,http://127.0.0.1:4192/repo/').split(',').map(s=>s.trim().replace(/\/?$/,'/'));
const reportPath=process.env.ELEVEN_STATIC_REPORT??'docs/eleven-game/QA/PRODUCTION_ROOT_SUBPATH_AUDIT.json';
const remote=mounts.some(mount=>!['127.0.0.1','localhost','[::1]'].includes(new URL(mount).hostname));
const sessionProxy=remote?(process.env.HTTPS_PROXY??process.env.HTTP_PROXY):undefined;
const numbers=process.env.ELEVEN_STATIC_GAME_NUMBERS?process.env.ELEVEN_STATIC_GAME_NUMBERS.split(',').map(Number):Array.from({length:12},(_,i)=>i);
assert.ok(numbers.length>0&&numbers.every(n=>Number.isInteger(n)&&((n>=0&&n<=11)||n===15)),'explicit valid route numbers');
const expectedCatalog=Number(process.env.ELEVEN_EXPECTED_CATALOG_COUNT??14);
assert.ok(Number.isInteger(expectedCatalog)&&expectedCatalog>=11,'expected real catalog count');
const records=[],browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],...(sessionProxy?{proxy:{server:sessionProxy}}:{})});
try{
  for(const mount of mounts)for(const number of numbers){
    const id=number?`game${String(number).padStart(3,'0')}`:'portal',route=number?`${id}.html`:'index.html';
    const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
    const errors=[],jobs=[],bodyUrls=new Set();let collectingBodies=true;
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
    page.on('response',r=>{
      if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);if(!/^https?:/.test(r.url()))return;
      const requested=r.request().resourceType(),mime=r.headers()['content-type']??'';
      const kind=requested==='script'?'script':requested==='font'||/^font\//.test(mime)||/\.woff2?(?:\?|$)/.test(r.url())?'font':requested==='image'||/^image\//.test(mime)||/\.webp(?:\?|$)/.test(r.url())?'image':null;
      // First-load accounting reads each URL once. Cached reload responses may have no CDP body.
      if(kind&&collectingBodies&&!bodyUrls.has(r.url())){bodyUrls.add(r.url());jobs.push(r.body().then(body=>({url:r.url(),kind,status:r.status(),bodyBytes:body.length,phaser:kind==='script'&&/WebGLRenderer|__PHASER__|Phaser v|Phaser\.Game/.test(body.toString('utf8'))})).catch(e=>{errors.push(`${r.url()} ${e}`);return null;}));}
    });
    try{
      if(number)await page.addInitScript(id=>{const prefix=id==='game001'?'orbit-shift:v1:':`web-mini-arcade:v1:${id}:`;localStorage.setItem(prefix+'credits','0');localStorage.setItem(prefix+'tutorialCompleted','true');},id);
      const response=await page.goto(new URL(route,mount).href);assert.equal(response.status(),200,`${id} direct HTTP`);
      if(number)await page.locator('#play-button').waitFor({state:'visible'});
      else{
        assert.equal(await page.locator('.game-card').count(),expectedCatalog);
        for(const image of await page.locator('.game-card img').all())await image.scrollIntoViewIfNeeded();
      }
      await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>undefined)));});await page.waitForLoadState('networkidle');
      const observed=await page.evaluate(()=>({
        hooks:'__arcadeDebug'in window||'__orbitDebug'in window||'__tutorialDebug'in window,
        fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),
        resources:performance.getEntriesByType('resource').map(r=>({url:r.name,encoded:r.encodedBodySize,decoded:r.decodedBodySize,transfer:r.transferSize})),
        images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),
      }));
      const unique=[...new Map((await Promise.all(jobs)).filter(Boolean).map(r=>[r.url,r])).values()];
      collectingBodies=false; // Keep HTTP/runtime checks active; later gameplay/reload traffic is not first-load accounting.
      const totals=Object.fromEntries(['script','image','font'].map(kind=>{const entries=unique.filter(r=>r.kind===kind),timing=observed.resources.filter(r=>entries.some(e=>e.url===r.url));return[kind,{count:entries.length,bodyBytes:entries.reduce((s,r)=>s+r.bodyBytes,0),encodedBytes:timing.reduce((s,r)=>s+r.encoded,0),decodedBytes:timing.reduce((s,r)=>s+r.decoded,0),transferBytes:timing.reduce((s,r)=>s+r.transfer,0)}];}));
      const phaser=[1,2,3,6].includes(number);assert.equal(observed.hooks,false,`${id} no production diagnostics`);assert.deepEqual(errors,[],`${id} HTTP/runtime errors`);
      assert.ok(totals.script.count>0);assert.ok(totals.script.bodyBytes<=(phaser?2_000_000:300_000),`${id} unchanged script ceiling`);assert.equal(unique.some(r=>r.phaser),phaser,`${id} actual engine body`);
      assert.ok(observed.images.every(i=>i.complete&&i.width>0&&i.height>0),`${id} decoded HTML images`);
      if(number!==1){assert.ok(totals.font.count>0,`${id} local font fetched`);assert.ok(observed.fonts.some(f=>f.family.replaceAll('"','').replaceAll("'",'')==='Arcade Rounded'&&f.status==='loaded'),`${id} local font loaded`);}
      const basePath=new URL(mount).pathname;
      for(const resource of unique)assert.ok(new URL(resource.url).pathname.startsWith(basePath),`${id} resource escaped ${basePath}: ${resource.url}`);
      if(number){
        await page.locator('#play-button').click();await page.locator('#pause-button:not(:disabled)').waitFor({state:'visible'});await page.locator('#pause-button').click();await page.locator('#resume-button').waitFor({state:'visible'});
        assert.equal(await page.locator('#arcade-training').isVisible(),false,`${id} completed tutorial immediate real PLAY`);assert.equal(await page.locator('#reward-button').isVisible(),false,`${id} stored zero has no reward gate`);
        await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');await Promise.all(jobs);
        await page.reload();await page.locator('#play-button').waitFor({state:'visible'});
        await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');await Promise.all(jobs);
        const back=page.locator('.arcade-portal-back');assert.ok([basePath,`${basePath}index.html`].includes(new URL(await back.getAttribute('href'),page.url()).pathname));await back.click();await page.locator('.game-card').first().waitFor({state:'visible'});
        assert.equal(await page.locator('.game-card').count(),expectedCatalog);
        await page.waitForLoadState('networkidle');await Promise.all(jobs);assert.deepEqual(errors,[],`${id} refresh/return errors`);
      }
      records.push({mount,id,route,phaser,totals,unique,...observed,errors:[...errors]});console.log(`${mount}${route}: ${totals.script.bodyBytes} JS / ${totals.image.bodyBytes} images / ${totals.font.bodyBytes} fonts; PASS`);
    }finally{await context.close();}
  }
  await mkdir(dirname(reportPath),{recursive:true});await writeFile(reportPath,JSON.stringify({checkedUtc:new Date().toISOString(),mounts,numbers,expectedCatalog,records},null,2)+'\n');
}finally{await browser.close();}
