import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const records=[];
const style=element=>{const s=getComputedStyle(element);return{background:s.backgroundImage,color:s.color,opacity:s.opacity,transition:s.transitionDuration,boxShadow:s.boxShadow,classes:element.className};};
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
function minimumContrast(cue){
  const text=cue.color.match(/[\d.]+/g).slice(0,3).map(Number);
  const stops=[...cue.background.matchAll(/rgba?\(([^)]+)\)/g)].map(m=>m[1].match(/[\d.]+/g).slice(0,3).map(Number));
  assert(stops.length,'no measurable CSS gradient color stops');const a=luminance(text);
  return Math.min(...stops.map(rgb=>{const b=luminance(rgb);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}));
}
try{
  for(const viewport of [{width:1440,height:900},{width:320,height:568}]){
    const context=await browser.newContext({viewport,hasTouch:viewport.width<700});const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto('http://127.0.0.1:5173/game004.html');await page.locator('#play-button').click();
    await page.waitForFunction(()=>window.__arcadeDebug.inspection().highlightedCell!==null);
    const cell=await page.evaluate(()=>window.__arcadeDebug.inspection().highlightedCell);const cue=await page.locator(`#cell-${cell}`).evaluate(style);
    assert.match(cue.classes,/is-lit/);assert.equal(cue.opacity,'1');assert(minimumContrast(cue)>=4.5,'lit key text lacks4.5contrast');
    await page.waitForFunction(()=>{const s=window.__arcadeDebug.inspection();return s.phase==='watch'&&s.highlightedCell===null;},null,{polling:10});
    const off=await page.locator(`#cell-${cell}`).evaluate(style);assert(!off.classes.includes('is-lit'));assert.notEqual(off.background,cue.background);assert(off.transition.split(',').every(v=>parseFloat(v)===0),'cue retains CSS transition during dark gap');
    await page.waitForFunction(()=>window.__arcadeDebug.inspection().phase==='recall');
    const expected=await page.evaluate(()=>window.__arcadeDebug.inspection().expectedCell);await page.locator(`#cell-${(expected+1)%9}`).click();
    await page.waitForFunction(()=>!!document.querySelector('.is-replay'),null,{polling:10});const replay=await page.locator('.is-replay').evaluate(style);
    assert.equal(replay.opacity,'1');assert.equal(replay.background,cue.background,'replay brightness differs from WATCH');assert(minimumContrast(replay)>=4.5,'replay text lacks4.5contrast');
    assert.equal(await page.locator('#credit-count').textContent(),'2');assert.deepEqual(errors,[]);
    records.push({viewport,cell,cue,off,replay,cueContrast:minimumContrast(cue),replayContrast:minimumContrast(replay),errors});await context.close();
    console.log(`Echo${viewport.width}×${viewport.height}: real cue/off/replay contrast PASS`);
  }
}finally{
  await browser.close();await writeFile('docs/visual/ECHO_CUE_AUDIT.json',JSON.stringify(records,null,2)+'\n');
}
