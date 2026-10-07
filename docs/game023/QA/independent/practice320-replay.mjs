import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const out='/workspace/arcade-classic-five/docs/game023/QA/independent';
const groups=[[...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'],[...'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゔ'],[...'ぁぃぅぇぉっゃゅょゎゕゖー']];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const reports=[];
try{for(const [run,delay]of [0,0,200,200].entries()){
const context=await browser.newContext({viewport:{width:320,height:640},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto('http://127.0.0.1:5233/game023.html');await page.waitForTimeout(230);await page.locator('#analytics-settings-host').locator('#deny').click();await page.locator('#practice-button').click();await page.waitForTimeout(230);
await page.evaluate(()=>{window.__reviewEvents=[];for(const type of ['pointerdown','pointerup','pointercancel','click'])document.addEventListener(type,event=>{const node=event.target instanceof HTMLElement?event.target.closest('button'):null;if(node)window.__reviewEvents.push({type,at:performance.now(),detail:event.detail,kana:node.dataset.kana,group:node.dataset.group,id:node.id,state:document.getElementById('app').dataset.state,scrollY});},true);});
const trace=[];for(const [step,answer]of ['おにぎり','きゃべつ'].entries()){
 if(step){if(await page.locator('#app').getAttribute('data-state')!=='result')break;await page.waitForTimeout(230);await page.locator('#next-button').click();await page.waitForTimeout(230);}
 for(const kana of answer){const group=groups.findIndex(g=>g.includes(kana));if(await page.locator(`[data-group="${group}"]`).getAttribute('aria-selected')!=='true')await page.locator(`[data-group="${group}"]`).click();if(delay)await page.waitForTimeout(delay);await page.locator(`[data-kana="${kana}"]`).tap();if(delay)await page.waitForTimeout(delay);trace.push(await page.evaluate(({step,kana})=>({step,kana,state:document.getElementById('app').dataset.state,feedback:document.getElementById('feedback').textContent,letters:[...document.querySelectorAll('.letter')].map(n=>n.textContent),events:window.__reviewEvents.slice(-6)}),{step,kana}));}
}
await page.screenshot({path:`${out}/320-replay-${run}-delay${delay}.png`,fullPage:true});reports.push({run,delay,trace,events:await page.evaluate(()=>window.__reviewEvents),state:await page.locator('#app').getAttribute('data-state')});await context.close();}
await writeFile(`${out}/practice320-replay.json`,JSON.stringify({at:new Date().toISOString(),provenance:'Compiled native touch practice; passive read-only event instrumentation; no model injection',reports},null,2));}finally{await browser.close();}
