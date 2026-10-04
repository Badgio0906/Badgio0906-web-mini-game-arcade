import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Run only after the relevant global freeze. Observes ordinary startup, not FPS.
const routes=process.argv.slice(2).length?process.argv.slice(2):['game002','game003','game004','game005'];
const base=process.env.VISUAL_QA_BASE_URL??'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const reports=[];
try{
  for(const game of routes){
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();const errors=[];const requests=[];const images=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('requestfailed',request=>errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response',response=>{
      if(response.status()>=400)errors.push(`HTTP ${response.status()}: ${response.url()}`);
      requests.push({url:response.url(),type:response.request().resourceType(),status:response.status()});
      if(response.request().resourceType()==='image'&&response.status()===200){
        images.push((async()=>({url:response.url(),body:await response.body()}))().catch(e=>({url:response.url(),error:String(e)})));
      }
    });
    await page.goto(`${base}/${game}.html`);await page.locator('#play-button').click();
    // Phaser preload can begin after PLAY; wait for real scene/board initialization.
    await page.waitForFunction(()=>!!document.querySelector('canvas,.echo-grid,.sort-board'));
    await page.waitForLoadState('networkidle');await page.waitForTimeout(250);
    const inspected=[];
    for(const item of await Promise.all(images)){
      if(item.error){errors.push(item.error);continue;}
      const size=await page.evaluate(async bytes=>{
        const image=await createImageBitmap(new Blob([new Uint8Array(bytes)]));
        const result={width:image.width,height:image.height};image.close();return result;
      },Array.from(item.body));
      inspected.push({url:item.url,encodedBytes:item.body.length,...size,baseRgbaBytes:size.width*size.height*4});
    }
    const unique=[...new Map(inspected.map(item=>[item.url,item])).values()];
    const report={game,base,errors,requests,images:unique,imageBytes:unique.reduce((n,item)=>n+item.encodedBytes,0),baseRgbaBytes:unique.reduce((n,item)=>n+item.baseRgbaBytes,0),note:'Actual startup images only; lazy later variants can load on demand. RGBA bytes are pixel arithmetic, not measured GPU allocation. This probe is not a physical phone FPS claim.'};
    reports.push(report);await context.close();
    console.log(`${game}: ${unique.length} images, ${report.imageBytes} encoded bytes, ${errors.length} errors`);
    if(errors.length||unique.some(item=>item.width>2048||item.height>2048)||report.imageBytes>1.5*1024*1024)process.exitCode=1;
  }
}finally{
  await browser.close();await writeFile('docs/visual/LOADED_ASSET_AUDIT.json',JSON.stringify(reports,null,2)+'\n');
}
