import { expect,test,type Page,type Frame } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { gameCatalog } from '../../src/data/gameCatalog';

const legacy=['yokodori-days','tachibana-task-heaven','finger-heart-challenge'] as const;
const route=(id:string)=>`./games/${id}/index.html`;
async function loaded(page:Page):Promise<Frame>{
  const handle=await page.locator('#legacy-game-frame').elementHandle(),frame=await handle!.contentFrame();expect(frame).not.toBeNull();
  await expect(frame!.locator('#canvas')).toBeVisible();await expect(frame!.locator('#status')).toHaveCount(0,{timeout:90_000});
  await frame!.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));return frame!;
}
async function point(frame:Frame,x:number,y:number,w=1280,h=720){
  const r=(await frame.locator('#canvas').boundingBox())!,scale=Math.min(r.width/w,r.height/h);
  return{x:r.x+(r.width-w*scale)/2+x*scale,y:r.y+(r.height-h*scale)/2+y*scale};
}
async function tapBoard(page:Page,frame:Frame,x:number,y:number,touch:boolean,w=1280,h=720){const p=await point(frame,x,y,w,h);if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);}
async function action(page:Page,frame:Frame,touch:boolean,key='Enter'){
  if(touch){const r=(await frame.locator('#canvas').boundingBox())!;await page.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.5);}else{await frame.locator('#canvas').focus();await page.keyboard.press(key);}
}
function observedErrors(page:Page){const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});return errors;}
async function returnPortal(page:Page,touch:boolean){
  const back=page.locator('#legacy-portal-return'),box=(await back.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(43.5);expect(box.height).toBeGreaterThanOrEqual(43.5);
  const frame=(await page.locator('#legacy-game-frame').boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(frame.y+1);
  if(touch)await back.tap();else await back.click();await expect(page.locator('.game-card')).toHaveCount(gameCatalog.length);
}

test('Original Yokodori Enter/tap starts, fails naturally while coworker works, retries and reloads with preserved UI',async({page,isMobile},info)=>{
  const errors=observedErrors(page);await page.goto(route('yokodori-days'));let frame=await loaded(page);
  const records=[];await frame.locator('#canvas').screenshot({path:info.outputPath('yokodori-original-title.png')});
  await action(page,frame,isMobile);await page.waitForTimeout(250);
  await frame.locator('#canvas').screenshot({path:info.outputPath('yokodori-native-playing.png')});
  await action(page,frame,isMobile);await page.waitForTimeout(1000);
  const over=info.outputPath('yokodori-natural-game-over.png');await frame.locator('#canvas').screenshot({path:over});
  const result=spawnSync('tesseract',[over,'stdout','--psm','11'],{encoding:'utf8'});expect(result.status).toBe(0);expect(result.stdout).toMatch(isMobile?/Enter/:/GAME\s*OVER/i);records.push({phase:'natural wrong-input GAME OVER',ocr:result.stdout});
  await action(page,frame,isMobile);await page.waitForTimeout(250);
  const retry=info.outputPath('yokodori-native-retry.png');await frame.locator('#canvas').screenshot({path:retry});
  const again=spawnSync('tesseract',[retry,'stdout','--psm','11'],{encoding:'utf8'});expect(again.status).toBe(0);expect(again.stdout).not.toMatch(/GAME\s*OVER/i);records.push({phase:'native retry',ocr:again.stdout});
  await page.reload();frame=await loaded(page);await frame.locator('#canvas').screenshot({path:info.outputPath('yokodori-reloaded-title.png')});
  await returnPortal(page,isMobile);expect(errors).toEqual([]);writeFileSync(info.outputPath('yokodori-native.json'),JSON.stringify({input:isMobile?'native touch':'native Enter',records,errors},null,2));
});

test('Original Tachibana keyboard/touch rhythm practice, scoring, pause, genuine misses and native retry remain intact',async({page,isMobile},info)=>{
  const errors=observedErrors(page);await page.goto(route('tachibana-task-heaven'));let frame=await loaded(page);
  const status=()=>frame.evaluate(()=>(window as any).TaskHeavenStatus);await expect.poll(async()=>(await status()).state).toBe('title');
  await tapBoard(page,frame,230,489,isMobile);await expect.poll(async()=>(await status()).state).toBe('help');
  await tapBoard(page,frame,295,597,isMobile);await expect.poll(async()=>(await status()).state).toBe('playing');
  expect((await status()).stage).toBe(0);
  if(!isMobile)await frame.locator('#canvas').focus();
  const notes=await Promise.all([1,2,3,4].map(async(channel,i)=>({channel,time:(10+i)*60/90,point:await point(frame,53+(channel-1)*208+(channel>2?22:0)+96,410)})));
  await frame.evaluate(()=>{(window as any).__migrationInputs=[];for(const kind of ['keydown','pointerdown'])window.addEventListener(kind,e=>(window as any).__migrationInputs.push({kind,key:(e as KeyboardEvent).key,target:(e.target as HTMLElement)?.id,clock:(window as any).TaskAudio.clock(),phase:(window as any).TaskHeavenStatus.phase}),true);});
  for(const note of notes){
    await frame.waitForFunction(target=>(window as any).TaskAudio.clock()>=target,note.time-.065,{polling:'raf',timeout:20_000});
    if(isMobile)await page.touchscreen.tap(note.point.x,note.point.y);else await page.keyboard.press(String(note.channel));
  }
  await expect.poll(async()=>(await status()).state,{timeout:20_000}).toBe('practice_result');const practice=await status(),inputs=await frame.evaluate(()=>(window as any).__migrationInputs);expect(practice.misses).toBe(0);expect(practice.score).toBeGreaterThan(0);
  await frame.locator('#canvas').screenshot({path:info.outputPath('tachibana-earned-practice.png')});
  await tapBoard(page,frame,640,416,isMobile);await expect.poll(async()=>(await status()).stage).toBe(1);
  if(isMobile)await tapBoard(page,frame,1207,48,true);else await page.keyboard.press('Escape');await expect.poll(async()=>(await status()).state).toBe('paused');
  const clock=await frame.evaluate(()=>(window as any).TaskAudio.clock());await page.waitForTimeout(350);expect(Math.abs(await frame.evaluate(()=>(window as any).TaskAudio.clock())-clock)).toBeLessThan(.025);
  await tapBoard(page,frame,640,376,isMobile);await expect.poll(async()=>(await status()).phase,{timeout:20_000}).toBe('answer');
  for(let i=0;i<18;i++){if(isMobile)await tapBoard(page,frame,53+3*208+22+96,410,true);else await page.keyboard.press('4');await page.waitForTimeout(20);if((await status()).state==='fail')break;}
  await expect.poll(async()=>(await status()).state,{timeout:20_000}).toBe('fail');const failed=await status();expect(failed.misses).toBeGreaterThanOrEqual(15);
  await frame.locator('#canvas').screenshot({path:info.outputPath('tachibana-genuine-game-over.png')});
  await tapBoard(page,frame,527,645,isMobile);await expect.poll(async()=>(await status()).state).toBe('playing');expect((await status()).stage).toBe(1);
  await page.reload();frame=await loaded(page);await expect.poll(async()=>(await status()).state).toBe('title');
  await tapBoard(page,frame,230,489,isMobile);await expect.poll(async()=>(await status()).state).toBe('playing');expect((await status()).stage).toBe(1);
  await returnPortal(page,isMobile);expect(errors).toEqual([]);writeFileSync(info.outputPath('tachibana-native.json'),JSON.stringify({input:isMobile?'native task-panel touch':'native1–4/Escape',practice,failed,inputs,errors},null,2));
});

test('Original Finger Heart normal URL remains uninstrumented; existing readonly QA observations prove native success/failure/retry/reload',async({page,isMobile},info)=>{
  const errors=observedErrors(page);await page.goto(route('finger-heart-challenge'));let frame=await loaded(page);
  expect(await frame.evaluate(()=>'__fingerHeart'in window)).toBe(false);await frame.locator('#canvas').screenshot({path:info.outputPath('finger-original-normal.png')});
  // Opt in to the original exported read-only observer. No Godot/source mutation or forced state.
  await frame.goto(new URL('game.html?qa=1',page.url()).href);await expect(frame.locator('#status')).toHaveCount(0,{timeout:90_000});
  const status=()=>frame.evaluate(()=>(window as any).__fingerHeart);await expect.poll(async()=>(await status())?.state).toBe(0);
  if(!isMobile)await frame.locator('#canvas').focus();
  const fingerBox=(await frame.locator('#canvas').boundingBox())!;
  const fingerInput=()=>isMobile?page.touchscreen.tap(fingerBox.x+fingerBox.width*.5,fingerBox.y+fingerBox.height*.5):page.keyboard.press('Space');
  await frame.waitForFunction(()=>(window as any).__fingerHeart?.state===0&&(window as any).__fingerHeart.hand===0,null,{polling:'raf',timeout:10_000});
  await fingerInput();await expect.poll(async()=>(await status()).score).toBe(1);
  // Wait for the next genuine non-heart pose. A second distinct press after
  // result_timer resumes is a real new answer, not an ignored duplicate.
  // Avoid treating automation IPC inside the 0.8s animation as player time.
  await frame.waitForFunction(()=>(window as any).__fingerHeart?.state===0&&(window as any).__fingerHeart.hand!==0,null,{polling:'raf',timeout:5000});
  expect((await status()).score).toBe(1);await fingerInput();await expect.poll(async()=>(await status()).state).toBe(3);const failed=await status();expect(failed.ending).toBe('Failure');expect(failed.score).toBe(1);
  await frame.locator('#canvas').screenshot({path:info.outputPath('finger-natural-failure.png')});
  const r=(await frame.locator('#canvas').boundingBox())!,retry=failed.retry;const x=r.x+(retry[0]+retry[2]/2)/failed.width*r.width,y=r.y+(retry[1]+retry[3]/2)/failed.height*r.height;
  if(isMobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);await expect.poll(async()=>(await status()).state).toBe(0);expect((await status()).score).toBe(0);
  await frame.goto(new URL('game.html?qa=1',page.url()).href);await expect(frame.locator('#status')).toHaveCount(0,{timeout:90_000});await expect.poll(async()=>(await status())?.state).toBe(0);expect((await status()).score).toBe(0);
  await page.reload();frame=await loaded(page);expect(await frame.evaluate(()=>'__fingerHeart'in window)).toBe(false);
  await returnPortal(page,isMobile);expect(errors).toEqual([]);writeFileSync(info.outputPath('finger-native.json'),JSON.stringify({input:isMobile?'native touch':'native Space',observer:'Original ?qa=1 readonly snapshots; normal URL has no hook',failed,errors},null,2));
});

for(const id of legacy)test(`${id}: original static export loads directly at root and subpath with actual WASM/PCK/audio resources`,async({browser},info)=>{
  test.skip(info.project.name!=='legacy-desktop');const records=[];
  for(const mount of(process.env.LEGACY_STATIC_URLS??'http://127.0.0.1:4193/,http://127.0.0.1:4194/repo/').split(',')){
    const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=observedErrors(page),resources:any[]=[];
    page.on('response',r=>{if(/\.(wasm|pck|js|wav)(?:\?|$)/.test(r.url()))resources.push({url:r.url(),status:r.status(),mime:r.headers()['content-type']});});
    try{
      const response=await page.goto(new URL(route(id),mount).href);expect(response!.status()).toBe(200);const frame=await loaded(page);
      expect(resources.some(r=>r.url.endsWith('.wasm')&&r.status===200&&r.mime==='application/wasm')).toBe(true);expect(resources.some(r=>r.url.endsWith('.pck')&&r.status===200)).toBe(true);
      expect(resources.every(r=>new URL(r.url).pathname.startsWith(new URL(mount).pathname))).toBe(true);
      await page.reload();await loaded(page);await returnPortal(page,false);expect(errors).toEqual([]);records.push({mount,resources,errors});
    }finally{await context.close();}
  }
  writeFileSync(info.outputPath(`${id}-static-root-subpath.json`),JSON.stringify(records,null,2));
});
