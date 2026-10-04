import{chromium}from'@playwright/test';import{mkdir,writeFile}from'node:fs/promises';
export async function openReview(game,port){
 const device=process.argv[2]??'desktop';if(!['desktop','mobile'].includes(device))throw Error('Choose desktop/mobile');
 const touch=device==='mobile',viewport=touch?{width:390,height:844}:{width:1920,height:1080};
 const baseUrl=process.env.REVIEW_BASE_URL??`http://127.0.0.1:${port}`,out=`docs/ten-game/screenshots/game${game}`;await mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,deviceScaleFactor:1});const page=await context.newPage();
 const records=[{type:'runtime',device,viewport,baseUrl,normalInputOnly:true,readonlyOracle:true,humanSkillEvidence:false}],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const read=()=>page.evaluate(()=>({state:window.__arcadeDebug.state(),inspection:window.__arcadeDebug.inspection(),credit:document.querySelector('#credit-count').textContent}));
 const button=id=>page.locator(`#${id}`)[touch?'tap':'click']();
 const shot=async name=>{const path=`${out}/${device}-${name}.png`;await page.screenshot({path});const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,boxes:[...document.querySelectorAll('#stage,.choice-note,.result-note,#left-button,#right-button,#toggle-button,#play-button,#retry-button,#reward-button,#title-button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return{selector:e.id||e.className,x:r.x,y:r.y,width:r.width,height:r.height};})}));records.push({type:'capture',name,path,layout,...await read()});};
 await page.goto(`${baseUrl}/game${game}.html`);await page.locator('#play-button').waitFor();await page.waitForTimeout(350);await shot('title');
 return{device,touch,page,records,errors,read,button,shot,
  async pauseProof(){await button('pause-button');const before=await read();await page.waitForTimeout(650);const after=await read();records.push({type:'pauseFreeze',before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection)});await button('resume-button');},
  async offerViewports(label, includeTouch=false){if(touch&&!includeTouch)return;const before=await read();for(const[width,height]of[[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]]){await page.setViewportSize({width,height});await page.waitForTimeout(70);await shot(`earned-${label}-${width}x${height}`);}await page.setViewportSize(viewport);const after=await read();records.push({type:'earnedOfferViewportObservations',label,before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection),qaCasePassClaim:false});},
  async endRecord(){await page.waitForFunction(()=>window.__arcadeDebug.state()==='result');await page.waitForTimeout(350);await shot('result');records.push({type:'earnedResult',text:await page.locator('.result-note').innerText(),...await read()});},
  async retry(){const began=Date.now();await button('retry-button');await page.waitForFunction(()=>window.__arcadeDebug.state()==='playing');records.push({type:'retryReset',wallMs:Date.now()-began,...await read()});},
  async refill(){await page.waitForTimeout(350);await shot('no-credit');await button('reward-button');await shot('reward-pending');await page.waitForFunction(()=>window.__arcadeDebug.state()==='title');await shot('refilled');},
  async close(error){if(error)records.push({type:'captureError',message:String(error),...await read()});records.push({type:'finalEvents',errors,events:await page.evaluate(()=>window.__arcadeDebug.telemetry())});await writeFile(`${out}/${device}-CAPTURE_RECORD.json`,JSON.stringify(records,null,2)+'\n');await context.close();await browser.close();}
 };
}
