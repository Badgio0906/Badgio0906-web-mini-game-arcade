// Technical QA only: reads DEV diagnostics for exposed legal moves, executes native buttons.
// It does not change game state via JavaScript and is not a human playtest.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.GAME022_URL ?? 'http://127.0.0.1:5173/game022.html?fixture=solvable';
const output = process.env.GAME022_REPORT ?? 'docs/game022/QA/browser-author-fixture';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
const sourceSelector=s=>`[data-source="${s.pile}"]${s.pile==='waste'?'':`[data-column="${s.column}"]`}${s.pile==='tableau'?`[data-index="${s.index}"]`:''}`;
try {
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await page.locator('#analytics-settings-host').locator('#deny').click();
  await page.selectOption('#deal-mode','daily');await page.locator('#play-button').click();
  await page.screenshot({path:`${output}/${viewport.width}-board.png`,fullPage:true});
  const solve=async()=>{for(let step=0;step<120;step++){const state=await page.evaluate(()=>window.__game022);if(state.state==='result')break;if(state.state!=='playing')throw Error(`Unexpected state ${state.state}`);const move=state.visibleMoves.find(m=>m.destination.pile==='foundation');if(move){await page.locator(sourceSelector(move.source)).click();await page.locator(`.pile[data-destination="foundation"][data-column="${move.destination.column}"]`).click();}else await page.locator('#stock-button').click();}const final=await page.evaluate(()=>window.__game022);if(final.snapshot.position.foundations.flat().length!==52||final.state!=='result')throw Error('Fixture did not finish via native inputs');return final;};
  const first=await solve();await page.screenshot({path:`${output}/${viewport.width}-result.png`,fullPage:true});
  await page.reload();await page.locator('#resume-saved-button').click();const restored=await page.evaluate(()=>window.__game022);if(restored.stats.clears!==1||restored.telemetry.some(e=>e.name==='run_start'))throw Error('Reload duplicated start or clear');
  await page.locator('#next-deal-button').click();const second=await solve();if(second.stats.clears!==1)throw Error('Daily retry duplicated clear');
  results.push({viewport,firstMoves:first.snapshot.position.moves,clearCount:second.stats.clears,restoredStartCount:restored.telemetry.filter(e=>e.name==='run_start').length,errors});await context.close();
 }
 await writeFile(`${output}/report.json`,JSON.stringify({at:new Date().toISOString(),url,provenance:'DEV original known-solvable 52-card fixture, read-only diagnosis plus native button inputs',results},null,2));
}finally{await browser.close();}
