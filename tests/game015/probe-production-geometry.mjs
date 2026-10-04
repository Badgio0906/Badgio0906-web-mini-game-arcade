import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { geometry,nativeButton } from './probe.mjs';

// Only run after the parent's final build and exclusive browser release.
// First-load byte accounting belongs to the shared final production collector.
const mounts=(process.env.GAME015_STATIC_URLS??'http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/').split(',').map(s=>s.trim().replace(/\/?$/,'/'));
const path=process.env.GAME015_STATIC_REPORT??'docs/game015/QA/PRODUCTION_GEOMETRY.json';
const sizes=[[1920,1080],[1440,900],[390,844],[320,568],[844,390]],records=[];
const remote=mounts.some(m=>!['localhost','127.0.0.1','[::1]'].includes(new URL(m).hostname));
const proxy=remote?(process.env.HTTPS_PROXY??process.env.HTTP_PROXY):undefined;
await mkdir(dirname(path),{recursive:true});let failure=null;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],...(proxy?{proxy:{server:proxy}}:{})});
try{
  for(const mount of mounts)for(const size of sizes){
    const touch=size[0]<1000,context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>errors.push(`${r.url()} ${r.failure()?.errorText}`));
    try{
      // Explicit saved-completion/stored-zero fixture tests production's direct PLAY.
      await page.addInitScript(()=>{localStorage.setItem('web-mini-arcade:v1:game015:tutorialCompleted','true');localStorage.setItem('web-mini-arcade:v1:game015:credits','0');});
      const response=await page.goto(new URL('game015.html',mount).href);assert.equal(response.status(),200);
      await page.locator('#play-button').waitFor({state:'visible'});
      const title=await geometry(page,['#play-button','#tutorial-again-button','#mute-button','.arcade-portal-back'],['#play-button','#tutorial-again-button','#mute-button','.arcade-portal-back']);
      await nativeButton(page,'#play-button',touch);await page.locator('#app[data-state="playing"]').waitFor({state:'visible'});
      assert.equal(await page.locator('#arcade-training').isVisible(),false);
      const playing=await geometry(page,['#fall-canvas','#left-button','#drop-button','#right-button','#pause-button','#mute-button'],['#left-button','#drop-button','#right-button','#pause-button','#mute-button']);
      const observed=await page.evaluate(()=>{const canvas=document.querySelector('#fall-canvas');return{width:canvas.width,height:canvas.height,rendering:getComputedStyle(canvas).imageRendering,liveCanvases:document.querySelectorAll('#fall-canvas').length,hooks:['__arcadeDebug','__orbitDebug','__tutorialDebug'].filter(k=>k in window),resources:performance.getEntriesByType('resource').map(r=>r.name)};});
      assert.equal(observed.width,256);assert.equal(observed.height,448);assert.equal(observed.rendering,'pixelated');assert.equal(observed.liveCanvases,1);assert.deepEqual(observed.hooks,[]);
      const canvas=playing.entries.find(e=>e.selector==='#fall-canvas');if(size[0]>=1000)assert.ok(canvas.height>=size[1]*.8&&canvas.height<=size[1]*.9,'desktop actual play height80–90%');
      const basePath=new URL(mount).pathname;for(const url of observed.resources)if(new URL(url).origin===new URL(mount).origin)assert.ok(new URL(url).pathname.startsWith(basePath),`asset escaped mount: ${url}`);
      await nativeButton(page,'#pause-button',touch);await page.locator('#app[data-state="paused"]').waitFor({state:'visible'});
      const paused=await geometry(page,['#resume-button','#title-button'],['#resume-button','#title-button']);
      await nativeButton(page,'#title-button',touch);await page.locator('#play-button').waitFor({state:'visible'});
      await page.reload();await page.locator('#play-button').waitFor({state:'visible'});
      const back=page.locator('.arcade-portal-back'),target=new URL(await back.getAttribute('href'),page.url());assert.ok([basePath,basePath+'index.html'].includes(target.pathname));await nativeButton(page,'.arcade-portal-back',touch);await page.locator('.game-card').first().waitFor({state:'visible'});assert.equal(await page.locator('.game-card').count(),15);await page.waitForLoadState('networkidle');assert.deepEqual(errors,[]);
      records.push({mount,size,touch,title,playing,paused,observed,errors});console.log(`${mount} ${size.join('x')}: production geometry/PLAY/pause/reload/return PASS`);
    }finally{await context.close();}
  }
}catch(error){failure={message:error.message,stack:error.stack};throw error;}finally{await browser.close();await writeFile(path,JSON.stringify({checkedUtc:new Date().toISOString(),scope:'Native production PLAY/pause and actual CSS/canvas observations; saved onboarding completion is explicitly a storage fixture, not a newly earned tutorial.',mounts,failure,records},null,2)+'\n');}
