import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const sizes=[[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=[];
async function geometry(page,selectors){
  const sample=await page.evaluate(selectors=>({overflow:document.documentElement.scrollWidth>innerWidth,bounds:selectors.map(selector=>{const e=document.querySelector(selector);if(!e)return{selector,missing:true};const r=e.getBoundingClientRect();const css=getComputedStyle(e);return{selector,x:r.x,y:r.y,width:r.width,height:r.height,display:css.display,font:css.fontFamily,text:e.textContent,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e};})}),selectors);
  const v=page.viewportSize();assert(!sample.overflow,'horizontal overflow');
  for(const b of sample.bounds){if(b.selector==='#clear-record'&&v.width>v.height&&v.height<=350){assert.equal(b.display,'none','optional clear row omission must be the documented compact presentation');assert(b.text.includes('95.6 s'),'historic clear time missing from result DOM');continue;}assert(!b.missing&&b.width>0&&b.height>0,`${b.selector} hidden`);assert(b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,`${b.selector} outside ${v.width}×${v.height}: ${JSON.stringify(b)}`);if(b.selector.endsWith('button')){assert(b.height>=43.5,`${b.selector} <44px`);assert(b.hit,`${b.selector} center covered`);}}
  return sample;
}
try{
  for(const game of ['game002','game003','game004','game005']){
    const context=await browser.newContext({viewport:{width:1920,height:1080}});const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(game=>{localStorage.setItem(`web-mini-arcade:v1:${game}:credits`,'1');if(game==='game002'){localStorage.setItem('web-mini-arcade:v1:game002:best','1000');localStorage.setItem('web-mini-arcade:v1:game002:cleared','true');localStorage.setItem('web-mini-arcade:v1:game002:clearTimeMs','95555');}},game);
    await page.goto(`http://127.0.0.1:5173/${game}.html`);await page.locator('#play-button').click();
    if(game==='game005')await page.locator('#begin-button').click();
    if(game==='game003'){
      await page.locator('#stage').focus();
      for(let n=0;n<3;n++){
        await page.waitForFunction(()=>{const r=window.__arcadeDebug.inspection();return r.phase==='hanging'&&Math.abs(r.cargo.x-r.topCenter)<2;},null,{timeout:30000});await page.keyboard.press('Space');
        await page.waitForFunction(n=>window.__arcadeDebug.snapshot().floors===n+1,n,{timeout:10000});
      }
      await page.waitForFunction(()=>{const r=window.__arcadeDebug.inspection();return r.phase==='hanging'&&r.cargo.x>410;},null,{timeout:30000});await page.keyboard.press('Space');
    } else if(game==='game004'){
      await page.waitForFunction(()=>window.__arcadeDebug.snapshot().phase==='recall');const expected=await page.evaluate(()=>window.__arcadeDebug.inspection().expectedCell);await page.locator(`#cell-${(expected+1)%9}`).click();
    } else if(game==='game005'){
      const expected=await page.evaluate(()=>window.__arcadeDebug.inspection().expectedSide);await page.keyboard.press(expected==='left'?'ArrowRight':'ArrowLeft');
    }
    await page.locator('#reward-button').waitFor({timeout:30000});
    const selectors=['#stage','.result-card','.result-game-title','#result-score','#reward-button','#title-button'];
    if(game==='game002') selectors.push('.dodge-details','#result-score-best','#clear-record');
    if(game==='game003') selectors.push('#building-title');
    if(game==='game004') selectors.push('#memory-comment','.correct-sequence');
    // Ordinary terminal result remains the behavioral evidence. Only display text is stressed;
    // this does not claim a naturally earned high rank or alter model / score / stored state.
    if(game==='game003')await page.locator('#building-title').evaluate(e=>e.textContent='超スーパーエグゼクティブウルトラ神大工');
    if(game==='game004')await page.locator('#memory-comment').evaluate(e=>{e.firstChild.textContent='人類上位クラスの記憶力かもしれません（わが家の子供調べ）';});
    for(const [width,height] of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(80);const layout=await geometry(page,selectors);records.push({game,viewport:{width,height},ordinaryResult:true,presentationStress:game==='game003'||game==='game004',layout,errors:[...errors]});}
    if(game==='game002'){
      assert.equal(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game002:clearTimeMs')),'95555');
      await page.locator('#title-button').click();
      const titleRecord=await page.locator('#clear-record').boundingBox();assert(titleRecord&&titleRecord.width>0&&titleRecord.height>0,'legacy clear record must remain visible on compact title');assert(titleRecord.y>=-1&&titleRecord.y+titleRecord.height<=320+1,'compact title record outside viewport');
      records.push({game,viewport:{width:568,height:320},compactTitleClearRecord:titleRecord,storedClearTimeMs:'95555'});
    }
    assert.deepEqual(errors,[],game);await context.close();console.log(`${game}: eight result layouts PASS`);
  }
}finally{await browser.close();await writeFile('docs/revisions/RESULT_LAYOUT_AUDIT.json',JSON.stringify(records,null,2)+'\n');}
