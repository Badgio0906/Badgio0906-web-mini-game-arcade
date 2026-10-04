import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { immediatePendingBounds } from './helpers/ten-layout';
import type { ElevatorInspection, ElevatorSide } from '../../src/games/game007/contracts';
type Diagnostic = { gameId: string; inspection(): ElevatorInspection; state(): string; telemetry(): Array<{ name: string; data: Record<string, unknown> }> };
const read = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.inspection());
const events = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.telemetry());
const sizes = [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]];
function errorsFor(page: Page) { const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});return errors; }
async function fits(page: Page, selectors: string[], actions: string[]=[]) {
  const v=page.viewportSize()!;for(const selector of selectors){await expect(page.locator(selector)).toBeVisible();const b=(await page.locator(selector).boundingBox())!;expect(b.x,selector).toBeGreaterThanOrEqual(-1);expect(b.y,selector).toBeGreaterThanOrEqual(-1);expect(b.x+b.width,selector).toBeLessThanOrEqual(v.width+1);expect(b.y+b.height,selector).toBeLessThanOrEqual(v.height+1);if(actions.includes(selector)){expect(b.width,selector).toBeGreaterThanOrEqual(43.5);expect(b.height,selector).toBeGreaterThanOrEqual(43.5);}}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
}
async function input(page: Page, side: ElevatorSide, mobile=false) { if(mobile)await page.locator(side==='accept'?'#right-button':'#left-button').tap();else await page.keyboard.press(side==='accept'?'ArrowRight':'ArrowLeft'); }
async function turn(page: Page, side: ElevatorSide, mobile=false) {
  await expect.poll(async()=>(await read(page)).phase).toBe('boarding');const before=await read(page);await input(page,side,mobile);
  if(before.load+(side==='accept'?before.currentParty.kg:0)<=450)await expect.poll(async()=>(await read(page)).floor,{timeout:10_000,intervals:[30]}).toBe(before.floor+1);
  else await expect.poll(async()=>(await read(page)).alive,{timeout:200}).toBe(false);
  return before;
}
async function overload(page: Page,mobile=false){for(let n=0;n<4;n++)await turn(page,'accept',mobile);expect(await read(page)).toMatchObject({alive:false,floor:4,load:635,excessKg:185});}

test('Elevator native directions preserve real NEXT/unload, reject dispatch bursts and pause all door/decision clocks',async({page,isMobile},info)=>{
  const errors=errorsFor(page);await page.goto('/game007.html');await page.locator('#play-button').click();
  expect(await page.evaluate(()=>(window as unknown as {__arcadeDebug:Diagnostic}).__arcadeDebug.gameId)).toBe('game007');
  expect(await read(page)).toMatchObject({floor:1,load:0,currentParty:{kg:65,destination:4},nextParty:{kg:90,destination:6}});
  await expect(page.locator('.party-kg')).toContainText('65');await expect(page.locator('.next-party span')).toContainText('90');
  await page.keyboard.press('Shift+ArrowRight');expect((await read(page)).load).toBe(0);
  await input(page,'accept',isMobile);const departed=await read(page);expect(departed.load).toBe(65);
  const burstPoint=isMobile?(await page.locator('#right-button').boundingBox())!:null;
  // Locator.tap waits for disabled controls to re-enable; raw native taps deliberately exercise the current dispatch.
  for(let n=0;n<3;n++){if(burstPoint)await page.touchscreen.tap(burstPoint.x+burstPoint.width/2,burstPoint.y+burstPoint.height/2);else await page.keyboard.press('ArrowRight');}expect((await read(page)).load).toBe(65);
  await page.locator('#pause-button').click();const paused=await read(page);await page.waitForTimeout(250);expect(await read(page)).toEqual(paused);
  await page.locator('#mute-button').click();const original=page.viewportSize()!;
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await fits(page,['#stage','.pause-note','#resume-button','#title-button'],['#resume-button','#title-button']);expect(await read(page)).toEqual(paused);}
  await page.setViewportSize(original);await page.locator('#resume-button').click();await expect.poll(async()=>(await read(page)).phase).toBe('boarding');
  expect((await read(page)).currentParty).toEqual(departed.nextParty);await turn(page,'accept',isMobile);await turn(page,'refuse',isMobile);
  const four=await read(page);expect(four).toMatchObject({floor:4,load:90,deliveredPeople:1,currentParty:{kg:305,destination:6}});
  await expect(page.locator('.next-unload')).toContainText('6');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(page.locator('#resume-button')).toBeVisible();
  expect((await events(page)).filter(e=>e.name==='run_end'||e.name==='quit')).toHaveLength(0);
  await page.locator('#title-button').click();await expect(page.locator('#credit-count')).toHaveText('3');
  const journal=await events(page);for(const name of['run_start','run_end','run_duration','quit'])expect(journal.filter(e=>e.name===name),name).toHaveLength(1);expect(journal.every(e=>e.data.game_id==='game007')).toBe(true);
  await page.reload();await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);await info.attach('actual-native-elevator',{body:JSON.stringify({paused,four,journal}),contentType:'application/json'});
});

test('Elevator three real overloads charge before650ms warning, lock navigation and refill exactly once with bounded cards',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(150_000);const errors=errorsFor(page);await page.goto('/game007.html');await page.locator('#play-button').click();
  for(let remaining=2;remaining>=0;remaining--){await overload(page);await expect(page.locator('#credit-count')).toHaveText(String(remaining),{timeout:200});await expect(page.locator('#app')).toHaveAttribute('data-state','ending');await expect(page.locator('.overload-banner')).toBeVisible();await expect(page.locator('#brand-button')).toBeDisabled();await expect(page.locator('#pause-button')).toBeDisabled();
    const ended=await read(page);await page.keyboard.press('Escape');await page.keyboard.press('ArrowRight');expect(await read(page)).toEqual(ended);
    if(remaining){await expect(page.locator('#retry-button')).toBeVisible();await page.locator('#retry-button').click();}}
  await expect(page.locator('#reward-button')).toBeVisible();await expect(page.locator('.result-reason')).toContainText('635');
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await fits(page,['.result-note','.result-reason','#result-score','#elevator-title','#reward-button','#title-button'],['#reward-button','#title-button']);}
  const before=await events(page);for(const name of['run_start','run_end','run_duration','score','credit_used'])expect(before.filter(e=>e.name===name),name).toHaveLength(3);expect(before.filter(e=>e.name==='credit_zero')).toHaveLength(1);expect(before.filter(e=>e.name==='reward_offer_shown')).toHaveLength(1);
  await page.locator('#reward-button').click();await immediatePendingBounds(page,['.reward-note','.stub-note','#reward-button','#title-button','#brand-button']);
  await page.evaluate(()=>{for(let n=0;n<8;n++)document.querySelector<HTMLButtonElement>('#reward-button')?.click();});await expect(page.locator('#credit-count')).toHaveText('3');const after=await events(page);for(const name of['reward_requested','reward_granted','reward_offer_shown'])expect(after.filter(e=>e.name===name),name).toHaveLength(1);
  const best=await page.locator('#best-value').textContent();expect(Number(best)).toBeGreaterThan(0);await page.reload();await expect(page.locator('#best-value')).toHaveText(best!);await expect(page.locator('#credit-count')).toHaveText('3');await page.goto('/game006.html');await expect(page.locator('#best-value')).toHaveText('0');await expect(page.locator('#credit-count')).toHaveText('3');expect(errors).toEqual([]);
});

test('Elevator primary two-finger boarding and native held approval cannot enqueue a later turn',async({page},info)=>{
  test.skip(info.project.name!=='mobile-portrait');await page.goto('/game007.html');await page.locator('#play-button').tap();const b=(await page.locator('#stage').boundingBox())!;const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.8,y:b.y+b.height*.5,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.8,y:b.y+b.height*.5,id:1},{x:b.x+b.width*.2,y:b.y+b.height*.5,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  await expect.poll(async()=>(await read(page)).phase).toBe('boarding');expect(await read(page)).toMatchObject({floor:2,load:65});
  await page.locator('#right-button').focus();await page.keyboard.down('Space');await page.keyboard.press('ArrowLeft');await expect.poll(async()=>(await read(page)).phase).toBe('boarding');const frozen=await read(page);await page.keyboard.up('Space');expect((await read(page)).floor).toBe(frozen.floor);expect((await read(page)).phase).toBe('boarding');expect((await read(page)).load).toBe(frozen.load);
});

test('Elevator ordinary deliveries reach a frozen20F fast choice; actual future value multiplies and retry resets',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(180_000);const errors=errorsFor(page);await page.goto('/game007.html');await page.locator('#play-button').click();await page.locator('#stage').focus();
  for(let floor=1;floor<20;floor++)await turn(page,floor===19?'accept':'refuse');await expect(page.locator('#fast-button')).toBeVisible();const frozen=await read(page);expect(frozen).toMatchObject({floor:20,pending:'floor20',phase:'choice',alive:true,mode:'normal'});expect(frozen.score).toBeGreaterThan(0);
  await page.keyboard.down('Space');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await page.waitForTimeout(350);expect(await read(page)).toEqual(frozen);const layouts=[];const original=page.viewportSize()!;
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await fits(page,['.choice-note','#normal-button','#fast-button','#title-button'],['#normal-button','#fast-button','#title-button']);expect(await read(page)).toEqual(frozen);layouts.push({width,height,card:await page.locator('.choice-note').boundingBox()});}
  await page.setViewportSize(original);await page.locator('#fast-button').click();await page.keyboard.up('Space');expect(await read(page)).toMatchObject({mode:'fast',scoreMultiplier:1.5,score:frozen.score,pending:null});await expect(page.locator('#mode-label')).toContainText('×1.5');
  const deliveredBefore=frozen.deliveredPeople+frozen.deliveredCargo;let delivery:ElevatorInspection|undefined;
  for(let n=0;n<8&&!delivery;n++){const before=await turn(page,'refuse');const after=await read(page);const floorPoints=before.load>0?Math.round((10+Math.round(before.load/450*20))*1.5):0;const deliveryPoints=Math.round(after.lastUnloaded.reduce((sum,p)=>sum+p.value,0)*1.5);expect(after.score-before.score).toBe(floorPoints+deliveryPoints);if(after.deliveredPeople+after.deliveredCargo>deliveredBefore)delivery=after;}
  expect(delivery).toBeDefined();
  for(let n=0;n<40&&(await read(page)).alive;n++)await turn(page,'accept');await expect(page.locator('#retry-button')).toBeVisible();await expect(page.locator('#credit-count')).toHaveText('2');
  const final=await read(page),journal=await events(page);for(const name of['milestone_reached','escalation_offered','escalation_accepted','run_end','run_duration','credit_used'])expect(journal.filter(e=>e.name===name),name).toHaveLength(1);expect(Number(await page.locator('#best-value').textContent())).toBe(final.score);
  await page.locator('#retry-button').click();expect(await read(page)).toMatchObject({floor:1,score:0,mode:'normal',scoreMultiplier:1,pending:null});expect(errors).toEqual([]);const path=info.outputPath('actual20F-fast.json');await writeFile(path,JSON.stringify({frozen,delivery,final,layouts,journal,errors},null,2));await info.attach('actual20F-fast',{path,contentType:'application/json'});
});
