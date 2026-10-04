import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { immediatePendingBounds } from './helpers/ten-layout';
import type { ParkingInspection, ParkingSnapshot } from '../../src/games/game006/contracts';
type Diagnostic = { gameId: string; snapshot(): ParkingSnapshot; inspection(): ParkingInspection; state(): string; telemetry(): Array<{ name: string; data: Record<string, unknown> }> };
const read = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.inspection());
const events = (page: Page) => page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.telemetry());
const sizes = [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]];
function errorsFor(page: Page) {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); }); return errors;
}
async function visible(page: Page, selectors: string[], actions: string[] = []) {
  const v = page.viewportSize()!;
  for (const selector of selectors) {
    await expect(page.locator(selector)).toBeVisible(); const b = (await page.locator(selector).boundingBox())!;
    expect(b.x, selector).toBeGreaterThanOrEqual(-1); expect(b.y, selector).toBeGreaterThanOrEqual(-1);
    expect(b.x + b.width, selector).toBeLessThanOrEqual(v.width + 1); expect(b.y + b.height, selector).toBeLessThanOrEqual(v.height + 1);
    if (actions.includes(selector)) { expect(b.width, selector).toBeGreaterThanOrEqual(43.5); expect(b.height, selector).toBeGreaterThanOrEqual(43.5); }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
}
async function act(page: Page, mobile: boolean) { if (mobile) await page.locator('#action-button').tap(); else await page.keyboard.press('Space'); }
const observedNativeLead = new WeakMap<Page, { angle: number; power: number }>();
/** Read the visible target rectangle, wait on real gauges, then send native input. Never set control/pose/time. */
async function park(page: Page) {
  await expect.poll(async () => (await read(page)).phase, { timeout: 12_000 }).toBe('angle');
  const before = await read(page); const { start, slot } = before.layout; const turn = slot.rotation - start.rotation;
  const curvature = Math.abs(turn) < 1e-9 ? 0 : (Math.cos(start.rotation) - Math.cos(slot.rotation)) / (slot.x - start.x);
  const distance = Math.abs(turn) < 1e-9 ? start.y - slot.y : turn / curvature;
  const angle = Math.atan(curvature * 110) * 180 / Math.PI; const power = (distance - 120) / 220;
  const lead = observedNativeLead.get(page) ?? { angle: .08, power: .08 }; observedNativeLead.set(page, lead);
  const readiness = async (phase: 'angle' | 'power', wanted: number) => {
    // RAF reads only public gauges; native Space remains the sole action. A tiny return avoids per-frame geometry IPC.
    const ready = await page.evaluate(({phase,wanted,lead}) => new Promise<{value:number;period:number}|null>(resolve => {
      let prior: number | undefined; const began=performance.now();
      function poll() {
        const s=(window as unknown as {__arcadeDebug:Diagnostic}).__arcadeDebug.snapshot();
        if(!s.alive || s.phase!==phase || performance.now()-began>35_000){resolve(null);return;}
        const value=phase==='angle'?s.steeringDegrees:s.power, increasing=prior===undefined||value>=prior;prior=value;
        const period=phase==='angle'?Math.max(18,24-s.parked*.2):Math.max(7,9-s.parked*.08);
        const speed=phase==='angle'?38*2*Math.PI/period*Math.sqrt(Math.max(0,1-(value/38)**2)):2*Math.PI/period*Math.sqrt(Math.max(0,value*(1-value)));
        if(increasing&&Math.abs(value+speed*lead-wanted)<(phase==='angle'?.2:.005)){resolve({value,period});return;}
        requestAnimationFrame(poll);
      }requestAnimationFrame(poll);
    }),{phase,wanted,lead:lead[phase]});
    expect(ready,`${phase} ordinary gauge readiness`).not.toBeNull();await page.keyboard.press('Space');
    const lockedSnapshot=await read(page);const locked=phase==='angle'?lockedSnapshot.lockedSteering:lockedSnapshot.lockedPower;expect(locked).not.toBeNull();
    // Estimate observed active gauge time between readiness and the native lock, using public values only.
    const gaugeTime=(value:number)=>Math.acos(Math.max(-1,Math.min(1,phase==='angle'?-value/38:1-2*value)))*ready!.period/(2*Math.PI);
    const actualLead=Math.max(0,gaugeTime(locked!)-gaugeTime(ready!.value));
    const usedLead=lead[phase];lead[phase]=Math.max(.005,Math.min(.2,.35*usedLead+.65*actualLead));
    console.info(`Parking native ${phase}: wanted ${wanted}, locked ${locked}, observed lead ${actualLead}, next ${lead[phase]}`);
  };
  await readiness('angle',angle);await expect.poll(async()=>(await read(page)).phase).toBe('power');
  await readiness('power',power);
  await expect.poll(async () => (await read(page)).parked, { timeout: 12_000, intervals: [30] }).toBe(before.parked + 1);
  expect((await read(page)).alive).toBe(true);
}
async function fail(page: Page, mobile = false) {
  await expect.poll(async () => (await read(page)).phase).toBe('angle');
  await act(page, mobile); await expect.poll(async () => (await read(page)).phase).toBe('power');
  await act(page, mobile); await expect.poll(async () => (await read(page)).alive, { timeout: 12_000 }).toBe(false);
}

test('Parking native two-stage input, primary touch, pause, mute and cached pagehide preserve the actual car', async ({ page, isMobile }, info) => {
  const errors = errorsFor(page); await page.goto('/game006.html'); await page.locator('#play-button').click();
  expect(await page.evaluate(() => (window as unknown as { __arcadeDebug: Diagnostic }).__arcadeDebug.gameId)).toBe('game006');
  await expect.poll(async()=>(await read(page)).alive).toBe(true);
  expect((await read(page)).pose).toMatchObject({ width: 42, height: 70 });
  await page.keyboard.press('Shift+Space'); expect((await read(page)).phase).toBe('angle');
  if (isMobile) {
    await page.evaluate(()=>{const records:unknown[]=[];(window as unknown as{__qaPointerRecords:unknown[]}).__qaPointerRecords=records;for(const type of ['pointerdown','pointercancel'])document.addEventListener(type,event=>{const p=event as PointerEvent;records.push({type,id:p.pointerId,primary:p.isPrimary,button:p.button,shift:p.shiftKey,alt:p.altKey,ctrl:p.ctrlKey,meta:p.metaKey,target:(p.target as HTMLElement).tagName,inStage:!!(p.target as Element).closest('#stage'),phase:(window as unknown as{__arcadeDebug:Diagnostic}).__arcadeDebug.snapshot().phase});},{capture:true});});
    const box = (await page.locator('#stage').boundingBox())!; const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width*.3, y: box.y + box.height*.5, id: 1 }, { x: box.x + box.width*.7, y: box.y + box.height*.5, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
    const pointerRecords=await page.evaluate(()=>(window as unknown as{__qaPointerRecords:Array<{type:string;primary:boolean;button:number;shift:boolean;alt:boolean;ctrl:boolean;meta:boolean;inStage:boolean}>}).__qaPointerRecords);
    await info.attach('native-touch-events',{body:JSON.stringify(pointerRecords),contentType:'application/json'});
    const eligible=pointerRecords.filter(p=>p.type==='pointerdown'&&p.primary&&p.button===0&&!p.shift&&!p.alt&&!p.ctrl&&!p.meta&&p.inStage);
    const primary=pointerRecords.filter(p=>p.type==='pointerdown'&&p.primary&&p.button===0);
    for(const p of primary)expect(p.inStage,'advertised board tap must not hit a transparent overlay').toBe(true);
    expect(eligible.length).toBeLessThanOrEqual(1);
    if(eligible.length===0){expect((await read(page)).phase).toBe('angle');await page.locator('#stage').tap();}
    const pointerPath=info.outputPath('actual-primary-pointer.json');await writeFile(pointerPath,JSON.stringify({pointerRecords,eligible:eligible.length,after:await read(page)},null,2));await info.attach('actual-primary-pointer',{path:pointerPath,contentType:'application/json'});

  } else await page.keyboard.press('Space');
  expect((await read(page)).phase).toBe('power'); expect((await read(page)).lockedPower).toBeNull();
  await page.locator('#pause-button').click(); const paused = await read(page); await page.waitForTimeout(250); expect(await read(page)).toEqual(paused);
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');
  const original = page.viewportSize()!;
  for (const [width,height] of sizes) { await page.setViewportSize({width,height}); await visible(page,['#stage','.pause-ticket','#resume-button','#title-button'],['#resume-button','#title-button']); expect(await read(page)).toEqual(paused); }
  await page.setViewportSize(original); await page.locator('#resume-button').click();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  await expect(page.locator('#resume-button')).toBeVisible(); expect((await events(page)).filter(e=>e.name==='run_end'||e.name==='quit')).toHaveLength(0);
  await page.locator('#title-button').click(); await expect(page.locator('#credit-count')).toHaveText('3');
  const journal = await events(page); for (const name of ['run_start','run_end','run_duration','quit']) expect(journal.filter(e=>e.name===name),name).toHaveLength(1);
  expect(journal.every(e=>e.data.game_id==='game006')).toBe(true);
  await page.reload(); await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true'); expect(errors).toEqual([]);
  await info.attach('native-control-state',{body:JSON.stringify({paused,journal}),contentType:'application/json'});
});

test('Parking three ordinary misses charge on terminal frame once; zero/refill pending controls fit and best survives reload', async ({ page },info) => {
  test.skip(info.project.name!=='desktop'); const errors=errorsFor(page); await page.goto('/game006.html'); await page.locator('#play-button').click();
  for(let remaining=2;remaining>=0;remaining--) {
    await fail(page); await expect(page.locator('#credit-count')).toHaveText(String(remaining),{timeout:200});
    if(remaining) {await expect(page.locator('#retry-button')).toBeVisible();await page.locator('#retry-button').click();}
  }
  await expect(page.locator('#reward-button')).toBeVisible();
  const resultLayouts=[];for(const [width,height] of sizes) {await page.setViewportSize({width,height}); await visible(page,['.result-ticket','.result-reason','#result-score','#reward-button','#title-button'],['#reward-button','#title-button']);resultLayouts.push({width,height,card:await page.locator('.result-ticket').boundingBox()});}
  await page.screenshot({path:info.outputPath('earned-zero-568x320.png')});
  const before=await events(page); for(const name of ['run_start','run_end','run_duration','score','credit_used']) expect(before.filter(e=>e.name===name),name).toHaveLength(3);
  expect(before.filter(e=>e.name==='credit_zero')).toHaveLength(1); expect(before.filter(e=>e.name==='reward_offer_shown')).toHaveLength(1);
  expect(before.filter(e=>e.name==='run_duration').every(e=>e.data.reason==='over' && ['outside','collision'].includes(String(e.data.failure_reason)))).toBe(true);
  await page.locator('#reward-button').click();const pending=await immediatePendingBounds(page,['.reward-ticket','#reward-button','#title-button','.stub-note']);
  await page.evaluate(()=>{for(let n=0;n<8;n++)document.querySelector<HTMLButtonElement>('#reward-button')?.click();});
  await expect(page.locator('#credit-count')).toHaveText('3');const after=await events(page);
  for(const name of ['reward_requested','reward_granted','reward_offer_shown'])expect(after.filter(e=>e.name===name),name).toHaveLength(1);
  await page.reload();await expect(page.locator('#credit-count')).toHaveText('3');await expect(page.locator('#best-value')).toHaveText('0');
  await page.goto('/game003.html');await expect(page.locator('#credit-count')).toHaveText('3');await expect(page.locator('#best-value')).toHaveText('0'); expect(errors).toEqual([]);const proof=info.outputPath('actual-three-deaths-zero-refill.json');await writeFile(proof,JSON.stringify({resultLayouts,pending,before,after,errors},null,2));await info.attach('actual-three-deaths-zero-refill',{path:proof,contentType:'application/json'});
});

test('Parking repaired terminal retains an actual earned NEW BEST and native retry resets the fresh car', async({page},info)=>{
  test.skip(info.project.name !== 'desktop'); const errors=errorsFor(page);
  await page.goto('/game006.html'); await page.locator('#play-button').click(); await page.locator('#stage').focus();
  await park(page); const earned=await read(page); expect(earned.parked).toBe(1); expect(earned.score).toBeGreaterThanOrEqual(100);
  await fail(page); await expect(page.locator('#retry-button')).toBeVisible(); await expect(page.locator('.new-best')).toBeVisible();
  await expect(page.locator('#credit-count')).toHaveText('2'); await expect(page.locator('#best-value')).toHaveText(String(earned.score));
  const layouts=[];const original=page.viewportSize()!;
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await visible(page,['.result-ticket','.new-best','#result-score','#result-best','#retry-button','#title-button'],['#retry-button','#title-button']);layouts.push({width,height,card:await page.locator('.result-ticket').boundingBox()});}
  await page.setViewportSize(original);const beforeRetry=await events(page);for(const name of['run_start','run_end','run_duration','score','credit_used'])expect(beforeRetry.filter(event=>event.name===name),name).toHaveLength(1);
  await page.locator('#retry-button').click();expect(await read(page)).toMatchObject({alive:true,parked:0,score:0,mode:'normal',modeMultiplier:1,pending:null,phase:'angle',lockedSteering:null,lockedPower:null});
  await expect(page.locator('#credit-count')).toHaveText('2');await expect(page.locator('#best-value')).toHaveText(String(earned.score));expect(errors).toEqual([]);
  const path=info.outputPath('actual-small-newbest-retry.json');await writeFile(path,JSON.stringify({earned,layouts,beforeRetry,afterRetry:await read(page),errors},null,2));await info.attach('actual-small-newbest-retry',{path,contentType:'application/json'});
});

test('Parking ten actual target-gauge plays earn a frozen narrow-bay choice, prospective double score and reset on retry', async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(480_000); const errors=errorsFor(page);
  await page.goto('/game006.html');await page.locator('#play-button').click();await page.locator('#stage').focus();
  const journal: ParkingInspection[]=[];for(let n=0;n<10;n++){await park(page);const earned=await read(page);journal.push(earned);console.info(`Parking actual success ${earned.parked}: score ${earned.score}, ${earned.grade}`);}
  await expect(page.locator('#forbidden-button')).toBeVisible();const frozen=await read(page);
  expect(frozen).toMatchObject({parked:10,pending:'forbidden',mode:'normal',alive:true});expect(frozen.layout.slot).toMatchObject({width:50,height:82});
  await writeFile(info.outputPath('actual-ten-offer-prefix.json'),JSON.stringify({journal,frozen,errors},null,2));
  await page.keyboard.down('Space');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await page.waitForTimeout(350);expect(await read(page)).toEqual(frozen);
  const original=page.viewportSize()!;const layouts=[];
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await visible(page,['.milestone-ticket','.risk-terms','.milestone-ticket>small','#normal-button','#forbidden-button','#title-button'],['#normal-button','#forbidden-button','#title-button']);await expect(page.locator('.risk-terms')).toContainText('SCORE ×2');await expect(page.locator('.milestone-ticket>small')).toContainText('CREDIT消費なし');if(height<=390)await page.screenshot({path:info.outputPath(`earned-choice-${width}x${height}.png`)});expect(await read(page)).toEqual(frozen);layouts.push({width,height,card:await page.locator('.milestone-ticket').boundingBox()});}
  await page.setViewportSize(original);await page.locator('#forbidden-button').click();await page.keyboard.up('Space');
  expect(await read(page)).toMatchObject({mode:'forbidden',modeMultiplier:2,parked:10,score:frozen.score,pending:null,phase:'angle'});
  await page.waitForTimeout(350);expect((await read(page)).phase).toBe('angle');await park(page);const after=await read(page);
  const ordinaryPoints = after.grade === 'PERFECT PARK' ? 200 * after.streakMultiplier : after.grade === 'GREAT' ? 150 : 100;
  expect(after.score-frozen.score).toBe(ordinaryPoints * 2);expect(after.mode).toBe('forbidden');
  await writeFile(info.outputPath('actual-forbidden-award-prefix.json'),JSON.stringify({journal,frozen,after,actualIncrement:after.score-frozen.score,expectedIncrement:ordinaryPoints*2,layouts,errors},null,2));
  await expect(page.locator('#mode-label')).toContainText('×2');await fail(page);await expect(page.locator('#retry-button')).toBeVisible();await expect(page.locator('#credit-count')).toHaveText('2');
  expect(Number(await page.locator('#best-value').textContent())).toBe(after.score);
  for(const[width,height]of sizes){await page.setViewportSize({width,height});await visible(page,['.result-ticket','.result-reason','#result-score','#retry-button','#title-button'],['#retry-button','#title-button']);layouts.push({width,height,result:await page.locator('.result-ticket').boundingBox()});}
  await page.setViewportSize(original);
  const telemetry=await events(page);for(const name of ['milestone_reached','escalation_offered','escalation_accepted','run_end','run_duration','credit_used'])expect(telemetry.filter(e=>e.name===name),name).toHaveLength(1);
  await page.locator('#retry-button').click();expect(await read(page)).toMatchObject({parked:0,score:0,mode:'normal',modeMultiplier:1,pending:null});expect(errors).toEqual([]);
  const path=info.outputPath('actual-ten-parks.json');await writeFile(path,JSON.stringify({journal,frozen,after,layouts,telemetry,errors},null,2));await info.attach('actual-ten-parks',{path,contentType:'application/json'});
});
