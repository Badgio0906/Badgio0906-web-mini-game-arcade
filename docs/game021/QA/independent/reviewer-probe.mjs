import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173/game021.html';
const output=new URL('../compiled/',import.meta.url);
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
const results=[];
let context;
async function open(viewport={width:1365,height:1000}) {
  context=await browser.newContext({viewport});
  await context.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));
  await context.route(/analytics\.game100garage\.com|google-analytics\.com|googletagmanager\.com|pagead2\.googlesyndication\.com/,r=>r.fulfill({status:200,body:''}));
  const page=await context.newPage();
  page.on('pageerror',e=>results.push({pageerror:e.message}));
  await page.goto(base); const deny=page.getByRole('button',{name:'拒否',exact:true});if(await deny.isVisible())await deny.click();
  return page;
}
const pieces=page=>page.locator('.slot.green,.slot.amber').count();
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game021:state')));
async function drop(page,column){await page.locator(`[data-column="${column}"]`).click();await page.waitForTimeout(250);}
try {
  for(const difficulty of ['easy','normal','strong']) for(const first of ['first','second']){
    const page=await open();await page.locator('#difficulty-select').selectOption(difficulty);await page.locator('#first-select').selectOption(first);await page.locator('#start-button').click();
    const initial=first==='first'?0:1;
    await page.waitForFunction(n=>document.querySelectorAll('.slot.green,.slot.amber').length===n,initial);await page.waitForTimeout(260);
    await drop(page,2);await page.waitForFunction(n=>document.querySelectorAll('.slot.green,.slot.amber').length===n,initial+2);
    await page.locator('#hint-button').click();await page.locator('.column.hinted').waitFor();assert.equal(await pieces(page),initial+2);
    await page.locator('#undo-button').click();assert.equal(await pieces(page),initial);const snapshot=await saved(page);assert.equal(snapshot.saved.undos,1);assert.equal(snapshot.saved.hints,1);
    const runId=snapshot.saved.runId;assert.match(runId,/^[a-f0-9-]{36}$/i);await page.reload();await page.locator('#continue-button').waitFor();assert.equal(await page.locator('#app').getAttribute('data-state'),'title');await page.locator('#continue-button').click();assert.equal((await saved(page)).saved.runId,runId);assert.equal(await pieces(page),initial);
    await page.locator('#pause-button').click();await page.locator('#pause-title-button').click();await page.locator('#practice-button').click();await page.locator('#practice-play-button').click();await page.locator('#cancel-button').click();assert.match(await page.locator('#board-caption').textContent(),/練習/);await page.waitForTimeout(260);await drop(page,3);await page.locator('#training-start').waitFor();await page.locator('#training-start').click();await page.locator('#cancel-button').click();await page.locator('#training-start').waitFor();assert.match(await page.locator('#menu-title').textContent(),/つながった/);assert.deepEqual((await saved(page)).saved.moves,snapshot.saved.moves);
    results.push({difficulty,first,cpuResponse:true,hintDidNotMove:true,undoPair:true,runIdPreservedOnReload:true,practiceConfirmCanceledWithoutSavedBoardChange:true});await context.close();
  }
  const page=await open();await page.locator('#mode-select').selectOption('two');await page.locator('#start-button').click();await page.waitForTimeout(260);
  for(let i=0;i<6;i++)await drop(page,3);
  assert.equal(await page.locator('[data-column="3"]').isDisabled(),true);
  const focusColumn=await page.evaluate(()=>document.activeElement?.getAttribute('data-column'));assert.notEqual(focusColumn,'3');assert.notEqual(focusColumn,null);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.waitForTimeout(250);assert.equal(await pieces(page),7);
  await page.locator('#restart-button').click();await page.locator('#cancel-button').click();assert.equal(await pieces(page),7);
  await page.locator('#restart-button').click();await page.locator('#confirm-button').click();await page.waitForTimeout(260);assert.equal(await pieces(page),0);
  for(const c of [3,2,3,4,1,2,5])await drop(page,c);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL('desktop-thumbnail-source.png',output).pathname});
  const crop=await page.evaluate(()=>{const board=document.querySelector('.board-panel').getBoundingClientRect(),hud=document.querySelector('.hud').getBoundingClientRect();return {x:Math.floor(Math.min(board.left,hud.left)),y:Math.floor(hud.top),width:Math.ceil(Math.max(board.right,hud.right)-Math.min(board.left,hud.left)),height:Math.ceil(board.bottom-hud.top)};});
  results.push({sameDeviceFullColumnKeyboardRecovered:true,resetCancelPreserved:true,resetConfirmCleared:true,thumbnail:{path:'docs/game021/QA/compiled/desktop-thumbnail-source.png',viewport:{width:1365,height:1000},legalMoves:[3,2,3,4,1,2,5],crop}});
  await context.close();
} finally {await browser.close();await writeFile(new URL('reviewer-interaction.json',output),JSON.stringify({reviewer:'classic_review',observedAt:new Date().toISOString(),base,provenance:'Independent compiled native-input automation; no fixture state injection, DEV hook or hidden answer use; not human or physical-device play.',results},null,2)+'\n');}
