import { expect, test, type Page } from '@playwright/test';
import { enterSortPlay } from './helpers/sort-flow';

type Diagnostics = { state(): string; snapshot(): {time:number;alive:boolean;sorted:number}; practice():{step:number;complete:boolean}; telemetry():Array<{name:string}> };
const inspect = (page:Page) => page.evaluate(() => {
  const d=(window as unknown as {__arcadeDebug:Diagnostics}).__arcadeDebug;
  return {state:d.state(),run:d.snapshot(),practice:d.practice(),events:d.telemetry().map(e=>e.name)};
});
async function noRunEffects(page:Page) {
  const d=await inspect(page);
  expect(d.run).toMatchObject({time:0,alive:false,sorted:0});
  for(const event of ['run_start','run_end','run_duration','score','credit_used','sorted_count','rule_change_count']) expect(d.events.filter(e=>e===event),event).toHaveLength(0);
  await expect(page.locator('#credit-count')).toHaveText('3');
  await expect(page.locator('#best-value')).toHaveText('9');
  expect(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game005:best'))).toBe('9');
}

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('web-mini-arcade:v1:game005:best','9'));
  await page.goto('/game005.html');
});

test('Sort mandatory explanation and two untimed native examples preserve credit, best and all run events until explicit start',async({page,isMobile})=>{
  if(isMobile) await page.locator('#play-button').tap(); else await page.locator('#play-button').click();
  expect((await inspect(page)).state).toBe('tutorial');
  await expect(page.locator('.tutorial-card')).toContainText('左か右');
  await expect(page.locator('.tutorial-card')).toContainText('ルールが変わる');
  await expect(page.locator('.tutorial-card')).toContainText('まちがい');
  await expect(page.locator('.tutorial-card')).toContainText('PC');
  await expect(page.locator('.tutorial-card')).toContainText('スマホ');
  await noRunEffects(page);
  await page.locator('#practice-button').click();
  await expect(page.locator('.example-parcel')).toHaveClass(/round/);
  await page.locator('#practice-right-button').click();
  expect((await inspect(page)).practice).toEqual({step:0,complete:false});
  await expect(page.locator('#practice-feedback')).toContainText('もう一度');
  await page.waitForTimeout(900); await noRunEffects(page);
  if(isMobile) await page.locator('#practice-left-button').tap(); else await page.keyboard.press('ArrowLeft');
  expect((await inspect(page)).practice).toEqual({step:1,complete:false});
  await expect(page.locator('.example-parcel')).toHaveClass(/angular/);
  if(isMobile) await page.locator('#practice-right-button').tap(); else await page.keyboard.press('d');
  expect((await inspect(page)).practice).toEqual({step:2,complete:true});
  await expect(page.locator('#practice-left-button')).toBeDisabled();
  await noRunEffects(page);
  await page.locator('#begin-button').click();
  expect((await inspect(page)).state).toBe('playing');
  expect((await inspect(page)).events.filter(e=>e==='run_start')).toHaveLength(1);
  await page.keyboard.press('Enter');
  expect((await inspect(page)).events.filter(e=>e==='run_start')).toHaveLength(1);
  await expect(page.locator('#credit-count')).toHaveText('3');
});

test('Sort practice cached pagehide, held keys and return-to-title do not create terminal runs or consume credit',async({page},info)=>{
  test.skip(info.project.name!=='desktop');
  await page.locator('#play-button').click(); await page.locator('#practice-button').click();
  await page.locator('#practice-left-button').focus(); await page.keyboard.down('Space');
  await page.keyboard.down('ArrowLeft'); await page.keyboard.down('ArrowLeft');
  expect((await inspect(page)).practice.step).toBe(1);
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('Space');
  // The held native activation belonged to the removed first example, not the next item.
  expect((await inspect(page)).practice.step).toBe(1);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  await page.waitForTimeout(250); expect((await inspect(page)).practice.step).toBe(1); await noRunEffects(page);
  await page.keyboard.press('ArrowRight'); await noRunEffects(page);
  await page.locator('#title-button').click(); expect((await inspect(page)).state).toBe('title'); await noRunEffects(page);
  await enterSortPlay(page);
  expect((await inspect(page)).events.filter(e=>e==='run_start')).toHaveLength(1);
});

test('Sort tutorial native Enter/Space activates one actual run and held repeat cannot begin again',async({page},info)=>{
  test.skip(info.project.name!=='desktop');
  await page.locator('#play-button').focus(); await page.keyboard.press('Enter');
  expect((await inspect(page)).state).toBe('tutorial'); await noRunEffects(page);
  await page.locator('#begin-button').focus(); await page.keyboard.down('Space'); await page.keyboard.down('Space');
  await noRunEffects(page); await page.keyboard.up('Space');
  expect((await inspect(page)).state).toBe('playing');
  expect((await inspect(page)).events.filter(e=>e==='run_start')).toHaveLength(1);
});
