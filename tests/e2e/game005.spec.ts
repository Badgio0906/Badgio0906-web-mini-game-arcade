import { enterSortPlay } from './helpers/sort-flow';
import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import type { SortInspection, SortSide } from '../../src/games/game005/contracts';

type Diagnostic = { gameId: string; inspection(): SortInspection; state(): string; telemetry(): Array<{name:string;data:Record<string,string|number|boolean>}> };
const read = (page: Page) => page.evaluate(() => (window as unknown as {__arcadeDebug:Diagnostic}).__arcadeDebug.inspection());
const events = (page: Page) => page.evaluate(() => (window as unknown as {__arcadeDebug:Diagnostic}).__arcadeDebug.telemetry());
async function ready(page: Page) { await expect.poll(async () => (await read(page)).phase,{timeout:10_000,intervals:[10]}).toBe('sorting'); }
async function send(page: Page, side: SortSide, touch=false, letter=false) {
  if (touch) { const b=(await page.locator('#stage').boundingBox())!; await page.locator('#stage').tap({position:{x:b.width*(side==='left'?.25:.75),y:b.height*.55}}); }
  else await page.keyboard.press(letter ? side==='left'?'a':'d' : side==='left'?'ArrowLeft':'ArrowRight');
}
async function correct(page: Page,touch=false) {
  await ready(page); const run=await read(page); await send(page,run.expectedSide!,touch,run.sorted%2===1);
  await expect.poll(async () => (await read(page)).sorted,{timeout:1000}).toBe(run.sorted+1); return run;
}
async function wrong(page: Page,touch=false) {
  await ready(page); const run=await read(page); await send(page,run.expectedSide==='left'?'right':'left',touch);
  await expect.poll(async () => (await read(page)).alive,{timeout:500}).toBe(false); return run;
}
async function fits(page: Page, selectors: string[]) {
  const v=page.viewportSize()!;
  for(const selector of selectors){const b=(await page.locator(selector).boundingBox())!;expect(b,selector).not.toBeNull();expect(b.x,selector).toBeGreaterThanOrEqual(-1);expect(b.y,selector).toBeGreaterThanOrEqual(-1);expect(b.x+b.width,selector).toBeLessThanOrEqual(v.width+1);expect(b.y+b.height,selector).toBeLessThanOrEqual(v.height+1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
}

test('Sort ordinary keys/half taps act once, reject dispatch/held repeats, pause deadline and persist mute',async({page,isMobile},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('/game005.html');await enterSortPlay(page);await ready(page);
  expect(await page.evaluate(()=>(window as unknown as {__arcadeDebug:Diagnostic}).__arcadeDebug.gameId)).toBe('game005');
  const first=await read(page);
  if(isMobile){await send(page,first.expectedSide!,true);await send(page,first.expectedSide!,true);await ready(page);}
  else{
    const key=first.expectedSide==='left'?'ArrowLeft':'ArrowRight';
    await page.keyboard.down(key);await page.keyboard.down(key);await ready(page);
    await page.keyboard.down(key);expect((await read(page)).sorted).toBe(1);await page.keyboard.up(key);
  }
  expect((await read(page)).sorted).toBe(1);
  await correct(page,isMobile);await ready(page);
  await page.locator('#mute-button').click();await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');
  await page.locator('#pause-button').click();const stopped=await read(page);await page.waitForTimeout(230);expect((await read(page)).time).toBe(stopped.time);expect((await read(page)).remaining).toBe(stopped.remaining);
  await expect(page.locator('.sort-board')).toHaveAttribute('data-paused','true');
  await expect(page.locator('.parcel')).toHaveCSS('animation-play-state','paused');
  const original=page.viewportSize()!;const sizes=isMobile?[info.project.name==='mobile-portrait'?{width:320,height:568}:{width:568,height:320}]:[{width:1280,height:720},{width:1024,height:768}];
  for(const size of sizes){await page.setViewportSize(size);await fits(page,['#stage','#resume-button','#title-button']);await page.screenshot({path:`artifacts/qa-game005-${info.project.name}-${size.width}-paused.png`});}
  await page.setViewportSize(original);await page.locator('#resume-button').click();await expect.poll(async()=>(await read(page)).time).toBeGreaterThan(stopped.time);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#resume-button')).toBeVisible();await page.locator('#title-button').click();await expect(page.locator('#credit-count')).toHaveText('3');
  const ended=await events(page);expect(ended.every(e=>e.data.game_id==='game005')).toBe(true);expect(ended.filter(e=>e.name==='run_end')).toHaveLength(1);expect(ended.filter(e=>e.name==='run_duration')).toHaveLength(1);
  await page.reload();await expect(page.locator('#mute-button')).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);
});

test('Sort forty normal decisions cross all rules and reversals, preserve rule-change pause and save high-score feedback at eight requested sizes',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(120_000);
  await page.addInitScript(()=>{const key='web-mini-arcade:v1:game005:credits';if(localStorage.getItem(key)===null)localStorage.setItem(key,'1');});
  await page.goto('/game005.html');await page.locator('#language-en-button').click();await enterSortPlay(page);const seen=new Set<string>();
  for(let n=0;n<40;n++){
    const run=await correct(page);seen.add(`${run.rule.dimension}:${run.rule.inverted}`);
    if(n===7){
      await expect.poll(async()=>(await read(page)).phase,{intervals:[10]}).toBe('rule_change');const change=await read(page);expect(change.parcel).toBeNull();expect(change.rule.dimension).toBe('brightness');
      await expect(page.locator('.rule-banner')).toBeVisible();await expect(page.locator('.rule-banner')).toContainText('RULE CHANGE');
      await send(page,'left');await send(page,'right');expect((await read(page)).sorted).toBe(8);
      await page.locator('#pause-button').click();const paused=await read(page);await page.waitForTimeout(230);expect((await read(page)).phaseRemaining).toBe(paused.phaseRemaining);expect((await read(page)).time).toBe(paused.time);await page.locator('#resume-button').click();
    }
  }
  expect(seen).toEqual(new Set(['shape:false','brightness:false','size:false','symbol:false','shape:true']));
  await ready(page);const final=await read(page);expect(final.rule).toMatchObject({dimension:'brightness',inverted:true});expect(final.ruleChanges).toBe(5);
  await expect(page.locator('.rule-dimension')).toContainText('REVERSE');
  await expect(page.locator('.rule-left')).toContainText(final.rule.leftLabel);await expect(page.locator('.rule-right')).toContainText(final.rule.rightLabel);
  const bad=await wrong(page);await expect(page.locator('#credit-count')).toHaveText('0',{timeout:200});await expect(page.locator('.new-best')).toBeVisible();await expect(page.locator('#best-value')).toHaveText('40');
  await expect(page.locator('.correct-direction')).toContainText(bad.expectedSide!.toUpperCase());
  await page.evaluate(()=>document.fonts.ready);const resultLayouts=[];
  for(const size of[{width:1366,height:900},{width:1920,height:1080},{width:1440,height:900},{width:1280,height:720},{width:1024,height:768},{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:568,height:320}]){
    await page.setViewportSize(size);await fits(page,['#stage','.result-card','#reward-button','#title-button','.result-note']);for(const id of ['#reward-button','#title-button']){const box=(await page.locator(id).boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(43.5);expect(box.width).toBeGreaterThanOrEqual(43.5);}
    resultLayouts.push({size,card:await page.locator('.result-card').boundingBox(),reward:await page.locator('#reward-button').boundingBox(),title:await page.locator('#title-button').boundingBox()});
    await page.screenshot({path:`artifacts/qa-game005-forty-sorted-${size.width}-${size.height}.png`});
    if(size.width===320){await mkdir('docs/ten-game/screenshots/game005',{recursive:true});await page.screenshot({path:'docs/ten-game/screenshots/game005/qa-earned-en40-320x568-result.png'});}
  }
  const tracked=await events(page);expect(tracked.filter(e=>e.name==='sorted_count')).toHaveLength(1);expect(tracked.filter(e=>e.name==='rule_change_count')).toHaveLength(1);
  const path=info.outputPath('earned-en40-result-layouts.json');await writeFile(path,JSON.stringify({resultLayouts,tracked,earned:true},null,2));await info.attach('earned-en40-result-layouts',{path,contentType:'application/json'});
  await page.reload();await expect(page.locator('#best-value')).toHaveText('40');await expect(page.locator('#credit-count')).toHaveText('0');
});

test('Sort wrong/timeout/wrong naturally consume three credits once, retry fast and reward once with isolated persistence',async({page},info)=>{
  test.skip(info.project.name!=='desktop');await page.goto('/game005.html');await enterSortPlay(page);
  await correct(page);await wrong(page);await expect(page.locator('#credit-count')).toHaveText('2',{timeout:200});await expect(page.locator('#retry-button')).toBeEnabled();await page.locator('#retry-button').click();
  await expect.poll(async()=>(await read(page)).alive,{timeout:10_000,intervals:[30]}).toBe(false);await expect(page.locator('#credit-count')).toHaveText('1',{timeout:200});await expect(page.locator('.result-heading')).toContainText('時間切れ');await expect(page.locator('#retry-button')).toBeEnabled();await page.locator('#retry-button').click();
  await wrong(page);await expect(page.locator('#credit-count')).toHaveText('0',{timeout:200});
  const before=await events(page);for(const name of ['run_start','run_end','run_duration','score','credit_used','sorted_count','rule_change_count'])expect(before.filter(e=>e.name===name),name).toHaveLength(3);expect(before.filter(e=>e.name==='credit_zero')).toHaveLength(1);expect(before.filter(e=>e.name==='reward_offer_shown')).toHaveLength(1);
  await expect(page.locator('#reward-button')).toBeEnabled();await page.locator('#reward-button').click();await expect(page.locator('#reward-button')).toBeDisabled();await page.evaluate(()=>{for(let n=0;n<8;n++)document.querySelector<HTMLButtonElement>('#reward-button')?.click();});
  await expect(page.locator('#credit-count')).toHaveText('3');const after=await events(page);expect(after.filter(e=>e.name==='reward_requested')).toHaveLength(1);expect(after.filter(e=>e.name==='reward_granted')).toHaveLength(1);expect(after.filter(e=>e.name==='reward_offer_shown')).toHaveLength(1);
  await page.reload();await expect(page.locator('#best-value')).toHaveText('1');await expect(page.locator('#credit-count')).toHaveText('3');await page.goto('/game004.html');await expect(page.locator('#best-value')).toHaveText('0');await expect(page.locator('#credit-count')).toHaveText('3');
});

test('Sort mobile zero-credit feedback/touch reward fit standard and compact layouts',async({page},info)=>{
  test.skip(info.project.name==='desktop');await page.addInitScript(()=>localStorage.setItem('web-mini-arcade:v1:game005:credits','1'));
  await page.goto('/game005.html');await enterSortPlay(page, true);await correct(page,true);await wrong(page,true);await expect(page.locator('#reward-button')).toBeEnabled();
  await page.evaluate(()=>document.fonts.ready);const records=[];
  const original=page.viewportSize()!;for(const size of[original,info.project.name==='mobile-portrait'?{width:320,height:568}:{width:568,height:320}]){await page.setViewportSize(size);await fits(page,['#stage','.result-card','#reward-button','#title-button','.result-note']);records.push({size,card:await page.locator('.result-card').boundingBox()});await page.screenshot({path:`artifacts/qa-game005-${info.project.name}-${size.width}-zero.png`});if(size.width===320){await mkdir('docs/ten-game/screenshots/game005',{recursive:true});await page.screenshot({path:'docs/ten-game/screenshots/game005/qa-earned-ja1-320x568-result.png'});}}
  await page.locator('#reward-button').tap();await expect(page.locator('#reward-button')).toBeDisabled();
  await fits(page,['.reward-card','#reward-button','#title-button','.stub-note']);
  for(const id of ['#reward-button','#title-button'])expect((await page.locator(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  await page.screenshot({path:`artifacts/qa-game005-${info.project.name}-reward-pending.png`});
  records.push({pending:true,card:await page.locator('.reward-card').boundingBox(),reward:await page.locator('#reward-button').boundingBox(),title:await page.locator('#title-button').boundingBox()});
  if(info.project.name==='mobile-portrait')await page.screenshot({path:'docs/ten-game/screenshots/game005/qa-earned-ja1-320x568-pending.png'});
  const path=info.outputPath('earned-JA-zero-and-pending.json');await writeFile(path,JSON.stringify({records,earned:true},null,2));await info.attach('earned-JA-zero-and-pending',{path,contentType:'application/json'});
  await expect(page.locator('#credit-count')).toHaveText('3');await expect(page.locator('#play-button')).toBeVisible();
});

test('Sort saved zero offer and cached pagehide preserve deadline without duplicate terminal events',async({page},info)=>{
  test.skip(info.project.name!=='desktop');await page.goto('/game005.html');await enterSortPlay(page);await ready(page);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(page.locator('#resume-button')).toBeVisible();const paused=await read(page);await page.waitForTimeout(230);expect((await read(page)).remaining).toBe(paused.remaining);expect((await events(page)).filter(e=>e.name==='run_end')).toHaveLength(0);
  await page.locator('#resume-button').click();await wrong(page);expect((await events(page)).filter(e=>e.name==='run_end')).toHaveLength(1);expect((await events(page)).filter(e=>e.name==='run_duration')).toHaveLength(1);
  await page.evaluate(()=>localStorage.setItem('web-mini-arcade:v1:game005:credits','0'));await page.reload();await expect(page.locator('#reward-button')).toBeVisible();expect((await events(page)).filter(e=>e.name==='reward_offer_shown')).toHaveLength(1);await page.locator('#reward-button').click();await expect(page.locator('#credit-count')).toHaveText('3');expect((await events(page)).filter(e=>e.name==='reward_offer_shown')).toHaveLength(1);
});

test('Sort simultaneous primary/secondary touch sends one parcel and cannot enqueue the next',async({page},info)=>{
  test.skip(info.project.name!=='mobile-portrait');await page.goto('/game005.html');await enterSortPlay(page, true);await ready(page);const run=await read(page);const b=(await page.locator('#stage').boundingBox())!;const primary=run.expectedSide==='left'?.25:.75;const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*primary,y:b.y+b.height*.55,id:1},{x:b.x+b.width*(1-primary),y:b.y+b.height*.55,id:2}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await ready(page);expect((await read(page)).sorted).toBe(1);expect((await read(page)).alive).toBe(true);
});

test('Sort native buttons activate once and held Space cannot release into a new parcel after an arrow sort',async({page},info)=>{
  test.skip(info.project.name!=='desktop');await page.goto('/game005.html');await enterSortPlay(page);await ready(page);
  const first=await read(page);await page.locator(`#${first.expectedSide}-button`).focus();await page.keyboard.down('Space');
  await send(page,first.expectedSide!);await ready(page);await page.keyboard.up('Space');
  expect((await read(page)).sorted).toBe(1);expect((await read(page)).alive).toBe(true);
  const second=await read(page);await page.locator(`#${second.expectedSide}-button`).focus();await page.keyboard.press('Enter');await ready(page);
  expect((await read(page)).sorted).toBe(2);
  const third=await read(page);await page.locator(`#${third.expectedSide}-button`).click();await ready(page);await page.waitForTimeout(280);
  expect((await read(page)).sorted).toBe(3);expect((await read(page)).alive).toBe(true);
});

test('Sort defaults to Japanese, preserves practice/live state across EN toggles and stores only its language preference', async ({ page, isMobile }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const key = 'web-mini-arcade:v1:game005:english';
    if (localStorage.getItem(key) === null) localStorage.setItem(key, 'corrupt-language');
    localStorage.setItem('web-mini-arcade:v1:game004:credits', '2');
    localStorage.setItem('web-mini-arcade:v1:game004:english', 'false');
  });
  await page.goto('/game005.html');
  await expect(page.locator('#app')).toHaveAttribute('data-language', 'ja');
  await expect(page.locator('#language-ja-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.rule-left b')).toHaveText('丸い'); await expect(page.locator('.rule-right b')).toHaveText('角ばっている');
  await page.locator('#language-en-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-language', 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#play-button')).toContainText('Start sorting');
  await page.locator('#play-button').click(); await expect(page.locator('.tutorial-card')).toContainText('Rules change');
  await expect(page.locator('#phase-label')).toHaveText('READY');
  await expect(page.locator('.tutorial-card')).toContainText('A mistake or timeout');
  await page.locator('#practice-button').click();
  if (isMobile) await page.locator('#practice-left-button').tap(); else await page.keyboard.press('ArrowLeft');
  const practiceBefore = await page.evaluate(() => (window as unknown as { __arcadeDebug: { practice(): { step: number; complete: boolean } } }).__arcadeDebug.practice());
  expect(practiceBefore).toEqual({ step: 1, complete: false });
  await expect(page.locator('#phase-label')).toHaveText('READY');
  const trainingEvents = await events(page);
  await page.locator('#language-ja-button').click(); await expect(page.locator('.tutorial-card h2')).toContainText('角ばった');
  await expect(page.locator('#phase-label')).toHaveText('準備OK');
  await page.locator('#language-en-button').click(); await expect(page.locator('.tutorial-card h2')).toContainText('angular');
  await expect(page.locator('#phase-label')).toHaveText('READY');
  expect(await page.evaluate(() => (window as unknown as { __arcadeDebug: { practice(): unknown } }).__arcadeDebug.practice())).toEqual(practiceBefore);
  expect(await events(page)).toEqual(trainingEvents);
  expect(await read(page)).toMatchObject({ alive: false, time: 0, sorted: 0 });
  await expect(page.locator('#credit-count')).toHaveText('3'); await expect(page.locator('#best-value')).toHaveText('0');
  if (isMobile) await page.locator('#practice-right-button').tap(); else await page.keyboard.press('ArrowRight');
  await expect(page.locator('.tutorial-card h2')).toHaveText('Both correct!'); await page.locator('#begin-button').click();
  await correct(page, isMobile); await ready(page); await page.locator('#pause-button').click();
  const frozen = await read(page); const pausedEvents = await events(page);
  await page.locator('#language-ja-button').click(); await expect(page.locator('#sorted-label')).toHaveText('仕分け数');
  await page.locator('#language-en-button').click(); await expect(page.locator('#sorted-label')).toHaveText('SORTED');
  await expect(page.locator('#resume-button')).toHaveText(/RESUME/);
  await page.waitForTimeout(250); expect(await read(page)).toEqual(frozen); expect(await events(page)).toEqual(pausedEvents);
  await page.locator('#mute-button').click(); await expect(page.locator('#mute-button')).toContainText('Sound OFF');
  await page.locator('#resume-button').click(); await wrong(page, isMobile); await expect(page.locator('#retry-button')).toBeEnabled();
  await expect(page.locator('.result-heading')).toContainText('Wrong side!');
  const resultBefore = await read(page); const endEvents = await events(page);
  await page.locator('#language-ja-button').click(); await expect(page.locator('.result-heading')).toContainText('そっちじゃなかった');
  await page.locator('#language-en-button').click(); await expect(page.locator('.correct-direction')).toContainText('Correct:');
  expect(await read(page)).toEqual(resultBefore); expect(await events(page)).toEqual(endEvents);
  await expect(page.locator('#credit-count')).toHaveText('2'); await expect(page.locator('#best-value')).toHaveText('1');
  for (const name of ['run_start', 'run_end', 'credit_used', 'score']) expect(endEvents.filter(event => event.name === name), name).toHaveLength(1);
  await page.reload(); await expect(page.locator('#language-en-button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#mute-button')).toContainText('Sound OFF'); await expect(page.locator('#best-value')).toHaveText('1');
  expect(await page.evaluate(() => ({ language: localStorage.getItem('web-mini-arcade:v1:game005:english'), credits: localStorage.getItem('web-mini-arcade:v1:game004:credits'), otherLanguage: localStorage.getItem('web-mini-arcade:v1:game004:english') }))).toEqual({ language: 'true', credits: '2', otherLanguage: 'false' });
  expect(errors).toEqual([]);
  await info.attach('language-state-preservation', { body: JSON.stringify({ practiceBefore, frozen, resultBefore, endEvents, errors }, null, 2), contentType: 'application/json' });
});

test('Sort Japanese ordinary decisions show all eight rules and both languages keep enlarged readable mappings at eight sizes', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop'); test.setTimeout(150_000);
  const pairs = { shape: ['丸い','角ばっている'], brightness: ['明るい','暗い'], size: ['小さい','大きい'], symbol: ['○','×'] };
  const seen = new Set<string>(); const layouts = [];
  await page.goto('/game005.html'); await enterSortPlay(page);
  for (let n = 0; n < 65; n++) {
    await ready(page); const current = await read(page); const pair = pairs[current.rule.dimension];
    await expect(page.locator('.rule-left b')).toHaveText(pair[current.rule.inverted ? 1 : 0]);
    await expect(page.locator('.rule-right b')).toHaveText(pair[current.rule.inverted ? 0 : 1]);
    await expect(page.locator('.rule-left small')).toContainText('← 左'); await expect(page.locator('.rule-right small')).toContainText('右 →');
    if (current.rule.inverted) await expect(page.locator('.rule-dimension')).toContainText('左右反転');
    seen.add(`${current.rule.dimension}:${current.rule.inverted}`);
    if (n === 40) {
      await page.locator('#pause-button').click(); const frozen = await read(page); const original = page.viewportSize()!;
      for (const [width, height] of [[1920,1080],[1440,900],[1280,720],[1024,768],[390,844],[320,568],[844,390],[568,320]]) {
        await page.setViewportSize({ width, height });
        for (const language of ['en','ja']) {
          await page.locator(`#language-${language}-button`).click();
          await fits(page, ['.rule-strip', '.rule-left', '.rule-right', '#language-ja-button', '#language-en-button', '#resume-button', '#title-button']);
          for (const id of ['#language-ja-button','#language-en-button','#resume-button','#title-button']) expect((await page.locator(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
          const typography = await page.locator('.rule-left b').evaluate(element => ({ fontSize: parseFloat(getComputedStyle(element).fontSize), width: element.clientWidth, scrollWidth: element.scrollWidth, text: element.textContent }));
          expect(typography.fontSize).toBeGreaterThanOrEqual(13); expect(typography.scrollWidth).toBeLessThanOrEqual(typography.width + 1);
          layouts.push({ width, height, language, typography });
          expect(await read(page)).toEqual(frozen);
        }
      }
      await page.setViewportSize(original); await page.locator('#resume-button').click();
    }
    await correct(page);
  }
  expect(seen).toEqual(new Set(['shape:false','brightness:false','size:false','symbol:false','shape:true','brightness:true','size:true','symbol:true']));
  await wrong(page); await expect(page.locator('#retry-button')).toBeVisible();
  await expect(page.locator('#best-value')).toHaveText('65'); await expect(page.locator('#credit-count')).toHaveText('2');
  await expect(page.locator('.correct-direction')).toContainText('正解は');
  await info.attach('actual-Japanese-eight-rules-layouts', { body: JSON.stringify({ seen: [...seen], layouts }, null, 2), contentType: 'application/json' });
});
