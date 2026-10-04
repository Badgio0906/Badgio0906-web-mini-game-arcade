import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Saved-zero UI fixtures exercise compact cards; they are not persistence tests.
// All actions are native, and the live model clock is read only.
const games=process.argv.slice(2).length?process.argv.slice(2):['game002','game003','game004','game005'];
const sizes=[[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=[];
async function check(page,selectors,state){
  // Read the whole short-lived pending state atomically; multiple protocol trips
  // can outlast its unchanged900ms Stub and inspect a detached title button.
  const sample=await page.evaluate(selectors=>({overflow:document.documentElement.scrollWidth>innerWidth,bounds:selectors.map(selector=>{const element=document.querySelector(selector);if(!element)return{selector,missing:true};const b=element.getBoundingClientRect();const at=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{selector,x:b.x,y:b.y,width:b.width,height:b.height,hit:at?.closest('button')===element,disabled:element.disabled};})}),selectors);
  const v=page.viewportSize();const bounds=[];
  for(const b of sample.bounds){
    const {selector}=b;assert(!b.missing&&b.width>0&&b.height>0,`${selector} not visible in ${state}`);
    assert(b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,`${selector} outside ${v.width}×${v.height} ${state}: ${JSON.stringify(b)}`);
    if(selector.includes('button')){
      assert(b.height>=43.5,`${selector} shorter than44px (${b.height}) in ${state}`);
      assert(b.hit,`${selector} covered at center in ${state}: ${JSON.stringify(b)}`);
    }
    bounds.push({selector,...b});
  }
  assert(!sample.overflow,'horizontal overflow');
  return bounds;
}
try{
  for(const game of games)for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<700||height<500,isMobile:width<700||height<500});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(game=>localStorage.setItem(`web-mini-arcade:v1:${game}:credits`,'0'),game);
    await page.goto(`http://127.0.0.1:5173/${game}.html`);await page.locator('#reward-button').waitFor();
    const title=await check(page,['#stage','.game-title','.game-title small','#reward-button','#mute-button'],'saved zero title');
    await page.locator('#reward-button').click();
    assert(await page.locator('#reward-button').isDisabled(),'pending reward action not locked');
    const pending=await check(page,['#stage','#reward-button','#title-button','#overlay small'],'reward pending');
    await page.waitForFunction(()=>document.querySelector('#credit-count').textContent==='3');await page.locator('#play-button').click();
    if(game==='game005'){
      const tutorial=await check(page,['#stage','.tutorial-card','#practice-button','#begin-button','#title-button'],'tutorial');
      await page.locator('#practice-button').click();
      const practice=await check(page,['#stage','.tutorial-card','#practice-left-button','#practice-right-button','#begin-button','#title-button'],'practice');
      const idle=await page.evaluate(()=>window.__arcadeDebug.snapshot());assert.equal(idle.time,0);assert.equal(idle.alive,false);
      await page.keyboard.press('ArrowLeft');await page.locator('#practice-right-button').focus();await page.keyboard.down('Space');await page.keyboard.press('ArrowRight');await page.keyboard.up('Space');
      const completed=await page.evaluate(()=>({run:window.__arcadeDebug.snapshot(),state:window.__arcadeDebug.state(),practice:window.__arcadeDebug.practice(),starts:window.__arcadeDebug.telemetry().filter(e=>e.name==='run_start').length}));
      assert.equal(completed.state,'practice','held native release started the real game');assert.equal(completed.practice.complete,true);assert.equal(completed.run.time,0);assert.equal(completed.starts,0);
      records.push({game,viewport:{width,height},tutorial,practice,completed});await page.locator('#begin-button').click();
    }
    await page.waitForFunction(()=>window.__arcadeDebug.snapshot().alive);await page.locator('#pause-button').click();
    const before=await page.evaluate(()=>window.__arcadeDebug.snapshot());
    const paused=await check(page,['#stage','#resume-button','#title-button','#mute-button'],'pause');
    await page.waitForTimeout(120);assert.equal((await page.evaluate(()=>window.__arcadeDebug.snapshot())).time,before.time,'model advances during pause');
    assert.deepEqual(errors,[],`${game} ${width}×${height}`);
    records.push({game,viewport:{width,height},title,pending,paused,errors});await context.close();
    console.log(`${game} ${width}×${height}: title/pending/pause controls PASS`);
  }
}finally{
  await browser.close();await writeFile('docs/revisions/CONTROL_AUDIT.json',JSON.stringify(records,null,2)+'\n');
}
