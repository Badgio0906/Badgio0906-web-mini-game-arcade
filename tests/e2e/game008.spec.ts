import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import type { CoffeeInspection, CoffeeDirection } from '../../src/games/game008/contracts';
import { immediatePendingBounds, insideViewport, runtimeErrors, tenSizes } from './helpers/ten-layout';
type Debug={gameId:string;inspection():CoffeeInspection;telemetry():Array<{name:string;data:Record<string,unknown>}>};
const read=(page:Page)=>page.evaluate(()=>(window as unknown as{__arcadeDebug:Debug}).__arcadeDebug.inspection());
const events=(page:Page)=>page.evaluate(()=>(window as unknown as{__arcadeDebug:Debug}).__arcadeDebug.telemetry());
async function assertTerminalMeters(page:Page,s:CoffeeInspection){
  expect(s.alive).toBe(false);expect(s.phase).toBe('ended');
  const emptyCup=s.cups.find(c=>c.remaining<=0);expect(emptyCup,'an actual depleted cup must explain the ending').toBeDefined();
  await expect(page.locator('.result-reason')).toContainText(`${emptyCup!.name}が0%`);
  await expect(page.locator('.final-cups')).toContainText(`${emptyCup!.name} 0%`);
  const rendered=[];
  for(const cup of s.cups){
    const meter=page.locator(`.cup-meter[data-cup="${cup.id}"]`);
    const expected=cup.remaining<=0?'0%':`${Math.max(1,Math.ceil(cup.remaining))}%`;
    await expect(meter.locator('strong'),`${cup.name} terminal HUD matches actual remaining liquid`).toHaveText(expected);
    if(cup.remaining<=0)await expect(meter).toHaveClass(/\bis-empty\b/);else await expect(meter).not.toHaveClass(/\bis-empty\b/);
    rendered.push({cupId:cup.id,name:cup.name,remaining:cup.remaining,text:await meter.locator('strong').textContent(),empty:await meter.evaluate(el=>el.classList.contains('is-empty'))});
  }
  return{emptyCupId:emptyCup!.id,emptyCupName:emptyCup!.name,cups:rendered};
}
async function empty(page:Page){await page.locator('#stage').focus();await page.keyboard.down('ArrowRight');await expect.poll(async()=>(await read(page)).alive,{timeout:25_000,intervals:[40]}).toBe(false);await page.keyboard.up('ArrowRight');await expect(page.locator('.result-note')).toBeVisible();const ended=await read(page);const terminalMeterProof=await assertTerminalMeters(page,ended);return{...ended,terminalMeterProof};}
// Read-only balancing policy uses the same observable body lean/velocity as pure tests. Every correction is a native held key.
async function balanceToChoice(page:Page, milestone:'second_cup'|'third_cup'){
  let held:CoffeeDirection=0;const started=Date.now();await page.locator('#stage').focus();
  while(Date.now()-started<180_000){const s=await read(page);expect(s.alive,'ordinary balancing must survive to the requested offer').toBe(true);if(s.pending){expect(s.pending).toBe(milestone);break;}
    const error=s.bodyLean+.4*s.bodyVelocity;const next:CoffeeDirection=error>.035?-1:error<-.035?1:0;
    if(next!==held){if(held)await page.keyboard.up(held===-1?'ArrowLeft':'ArrowRight');if(next)await page.keyboard.down(next===-1?'ArrowLeft':'ArrowRight');held=next;}await page.waitForTimeout(25);
  }
  if(held)await page.keyboard.up(held===-1?'ArrowLeft':'ArrowRight');expect((await read(page)).pending).toBe(milestone);return read(page);
}
async function acceptCup(page:Page){
  // Observe the same native event after app's choice handler, before any following RAF.
  // This makes exact preservation meaningful without freezing or changing the game clock.
  await page.evaluate(()=>{const win=window as unknown as{__arcadeDebug:Debug;__qaCoffeeChosen?:CoffeeInspection};delete win.__qaCoffeeChosen;document.addEventListener('click',()=>{win.__qaCoffeeChosen=win.__arcadeDebug.inspection();},{once:true});});
  await page.locator('#accept-button').click();
  const chosen=await page.evaluate(()=>(window as unknown as{__qaCoffeeChosen?:CoffeeInspection}).__qaCoffeeChosen);
  expect(chosen).toBeDefined();return chosen!;
}

test('Coffee real keyboard/primary touch and release retain liquid inertia; pause/cached pagehide freeze all cups and clocks',async({page,isMobile},info)=>{
  const errors=runtimeErrors(page);await page.goto('/game008.html');await page.locator('#play-button').click();expect(await page.evaluate(()=>(window as unknown as{__arcadeDebug:Debug}).__arcadeDebug.gameId)).toBe('game008');await expect(page.locator('.cup-meter')).toHaveCount(1);
  await page.keyboard.press('Shift+ArrowRight');expect((await read(page)).input).toBe(0);
  if(isMobile){const b=(await page.locator('#stage').boundingBox())!;const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.8,y:b.y+b.height*.55,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.8,y:b.y+b.height*.55,id:1},{x:b.x+b.width*.2,y:b.y+b.height*.55,id:2}]});expect((await read(page)).input).toBe(1);await page.waitForTimeout(240);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.keyboard.down('ArrowRight');await page.waitForTimeout(240);await page.keyboard.up('ArrowRight');}
  const released=await read(page);expect(released.input).toBe(0);expect(released.bodyVelocity).toBeGreaterThan(0);expect(released.cups[0].liquidAngle).toBeLessThan(0);
  await page.locator('#pause-button').click();const paused=await read(page);await page.waitForTimeout(250);expect(await read(page)).toEqual(paused);await page.locator('#mute-button').click();const old=page.viewportSize()!;
  for(const[width,height]of tenSizes){await page.setViewportSize({width,height});await insideViewport(page,['.pause-note','#resume-button','#title-button'],['#resume-button','#title-button']);expect(await read(page)).toEqual(paused);}
  await page.setViewportSize(old);await page.locator('#resume-button').click();await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(page.locator('#resume-button')).toBeVisible();expect((await events(page)).filter(e=>e.name==='run_end'||e.name==='quit')).toHaveLength(0);await page.locator('#title-button').click();await expect(page.locator('#credit-count')).toHaveText('3');const journal=await events(page);for(const name of['run_start','run_end','run_duration','quit'])expect(journal.filter(e=>e.name===name),name).toHaveLength(1);expect(journal.every(e=>e.data.game_id==='game008')).toBe(true);await page.reload();await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);await info.attach('actual-coffee-native',{body:JSON.stringify({released,paused,journal}),contentType:'application/json'});
});

test('Coffee three actual empty cups consume each credit once, explain the cup, retain best and guard one Stub refill',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(120_000);const errors=runtimeErrors(page);await page.goto('/game008.html');await page.locator('#play-button').click();const results=[];
  for(let remaining=2;remaining>=0;remaining--){const result=await empty(page);expect(result.cups[0].remaining).toBe(0);await expect(page.locator('.result-reason')).toContainText(result.cups[0].name);await expect(page.locator('#credit-count')).toHaveText(String(remaining));results.push(result);if(remaining)await page.locator('#retry-button').click();}
  const layouts=[];for(const[width,height]of tenSizes){await page.setViewportSize({width,height});layouts.push({width,height,boxes:await insideViewport(page,['.result-note','#result-score','.final-cups','#coffee-title','#reward-button','#title-button'],['#reward-button','#title-button'])});}
  const before=await events(page);for(const name of['run_start','run_end','run_duration','score','credit_used'])expect(before.filter(e=>e.name===name),name).toHaveLength(3);for(const name of['credit_zero','reward_offer_shown'])expect(before.filter(e=>e.name===name),name).toHaveLength(1);
  await page.locator('#reward-button').click();await immediatePendingBounds(page,['.reward-note','.stub-note','#reward-button','#title-button','#brand-button']);await page.evaluate(()=>{for(let n=0;n<8;n++)document.querySelector<HTMLButtonElement>('#reward-button')?.click();});await expect(page.locator('#credit-count')).toHaveText('3');const journal=await events(page);for(const name of['reward_requested','reward_granted','reward_offer_shown'])expect(journal.filter(e=>e.name===name),name).toHaveLength(1);
  const best=await page.locator('#best-value').textContent();expect(Number(best)).toBeGreaterThan(0);await page.reload();await expect(page.locator('#best-value')).toHaveText(best!);await expect(page.locator('#credit-count')).toHaveText('3');await page.goto('/game007.html');await expect(page.locator('#best-value')).toHaveText('0');expect(errors).toEqual([]);const path=info.outputPath('actual-empty-refill.json');await writeFile(path,JSON.stringify({results,layouts,journal,errors},null,2));await info.attach('actual-empty-refill',{path,contentType:'application/json'});
});

test('Coffee native balancing earns500/1000 offers, freezes every independent liquid and prospectively scores additional cups',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(360_000);const errors=runtimeErrors(page);await page.goto('/game008.html');await page.locator('#play-button').click();const layouts=[];
  const second=await balanceToChoice(page,'second_cup');expect(second).toMatchObject({distance:500,score:500,cupCount:1,multiplier:1,input:0});await page.waitForTimeout(300);expect(await read(page)).toEqual(second);await page.keyboard.press('ArrowRight');expect(await read(page)).toEqual(second);await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));expect(await read(page)).toEqual(second);
  for(const[width,height]of tenSizes){await page.setViewportSize({width,height});layouts.push({milestone:'second',width,height,boxes:await insideViewport(page,['.choice-note','#decline-button','#accept-button','#title-button'],['#decline-button','#accept-button','#title-button'])});expect(await read(page)).toEqual(second);}
  await page.setViewportSize({width:1440,height:900});const secondChosen=await acceptCup(page);expect(secondChosen).toMatchObject({cupCount:2,multiplier:1.5,score:500,pending:null,input:0});expect(secondChosen.cups.slice(0,1)).toEqual(second.cups);await expect(page.locator('.cup-meter')).toHaveCount(2);await page.waitForTimeout(360);
  const third=await balanceToChoice(page,'third_cup');expect(third).toMatchObject({distance:1000,score:1250,cupCount:2,multiplier:1.5,input:0});await page.waitForTimeout(250);expect(await read(page)).toEqual(third);
  for(const[width,height]of tenSizes){await page.setViewportSize({width,height});layouts.push({milestone:'third',width,height,boxes:await insideViewport(page,['.choice-note','#decline-button','#accept-button','#title-button'],['#decline-button','#accept-button','#title-button'])});expect(await read(page)).toEqual(third);}
  await page.setViewportSize({width:1440,height:900});const chosen=await acceptCup(page);expect(chosen).toMatchObject({cupCount:3,multiplier:2,score:1250,pending:null,input:0});expect(chosen.cups.slice(0,2)).toEqual(third.cups);await expect(page.locator('.cup-meter')).toHaveCount(3);await page.waitForTimeout(360);
  const ended=await empty(page);await expect(page.locator('#credit-count')).toHaveText('2');const displayedDistanceBase=1250+(ended.distance-1000)*2;expect(ended.score).toBeGreaterThanOrEqual(displayedDistanceBase);expect(ended.score).toBeLessThanOrEqual(displayedDistanceBase+1);const journal=await events(page);for(const name of['milestone_reached','escalation_offered','escalation_accepted'])expect(journal.filter(e=>e.name===name),name).toHaveLength(2);for(const name of['run_end','run_duration','credit_used'])expect(journal.filter(e=>e.name===name),name).toHaveLength(1);expect(Number(await page.locator('#best-value').textContent())).toBe(ended.score);await page.locator('#retry-button').click();expect(await read(page)).toMatchObject({cupCount:1,multiplier:1,score:0,pending:null});expect(errors).toEqual([]);const path=info.outputPath('actual500-1000-cups.json');await writeFile(path,JSON.stringify({second,third,chosen,ended,layouts,journal,errors},null,2));await info.attach('actual500-1000-cups',{path,contentType:'application/json'});
});
