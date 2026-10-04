import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { arcadeSizes, errorsOn, geometry, runtime, seedStoredZero } from './helpers/eleven-arcade';

test('Elevator native RIGHT boards and LEFT refuses; real weight arithmetic and unloading remain readable at eight sizes',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(80_000);const errors=errorsOn(page),records=[];
  await seedStoredZero(page,'game007',true);await page.goto('./game007.html');await page.locator('#play-button').click();
  await expect(page.locator('#right-button')).toBeEnabled();await expect(page.locator('.free-kg')).toHaveText('450');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async()=>{const s=(await runtime(page)).snapshot;return s.floor===2&&s.phase==='boarding';}).toBe(true);
  await page.locator('#pause-button').click();const frozen=(await runtime(page)).snapshot;
  expect(frozen.load).toBe(65);await expect(page.locator('.free-kg')).toHaveText('385');
  await expect(page.locator('.equation-current')).toHaveText('65');await expect(page.locator('.equation-party')).toHaveText('90');await expect(page.locator('.projected-kg')).toHaveText('155');
  await expect(page.locator('.next-party span')).toContainText('240kg');await expect(page.locator('.next-unload')).toContainText('4F');
  const layoutIssues:string[]=[];
  for(const[width,height]of arcadeSizes){
    await page.setViewportSize({width,height});
    try{
      records.push({phase:'paused-real-weight',width,height,geometry:await geometry(page,['#load-value','.free-kg','.party-kg','.weight-projection','.projected-kg','.next-party','.next-unload','.pause-note','#resume-button','#title-button'],['#resume-button','#title-button'])});
      expect((await runtime(page)).snapshot).toEqual(frozen);
    }catch(error){const message=`game007/paused-real-weight/${width}x${height}: ${String(error)}`;layoutIssues.push(message);records.push({phase:'paused-real-weight',width,height,error:message});await page.screenshot({path:info.outputPath(`paused-weight-${width}x${height}-finding.png`)});}
  }
  const layoutPath=info.outputPath('actual-elevator-weight-layouts.json');
  writeFileSync(layoutPath,JSON.stringify({frozen,records,layoutIssues,errors},null,2));await info.attach('actual-weight-layouts',{path:layoutPath,contentType:'application/json'});
  expect(layoutIssues,'all eight real-weight layout findings retained').toEqual([]);
  await page.setViewportSize({width:1440,height:900});await page.locator('#resume-button').click();await expect(page.locator('#left-button')).toBeEnabled();await page.keyboard.press('ArrowLeft');
  await expect.poll(async()=>{const s=(await runtime(page)).snapshot;return s.floor===3&&s.phase==='boarding';}).toBe(true);
  expect((await runtime(page)).snapshot.load).toBe(65);await page.keyboard.press('ArrowLeft');
  await expect.poll(async()=>{const s=(await runtime(page)).snapshot;return s.floor===4&&s.lastUnloaded.length>0;},{intervals:[20]}).toBe(true);
  await page.locator('#pause-button').click();const delivered=(await runtime(page)).snapshot;
  expect(delivered.load).toBe(0);await expect(page.locator('.unload-note')).toContainText('65 kg');await expect(page.locator('.unload-note')).toContainText('降りました');
  expect(errors).toEqual([]);await info.attach('actual-weight-and-unload',{body:JSON.stringify({frozen,delivered,records,events:(await runtime(page)).events,errors}),contentType:'application/json'});
});

test('Coffee actual liquid slope is attributed to its cup and all distance/remaining/arrow information stays inside the game window',async({page},info)=>{
  test.skip(info.project.name!=='desktop');const errors=errorsOn(page),records=[];
  await seedStoredZero(page,'game008',true);await page.goto('./game008.html');await page.locator('#play-button').click();
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(650);await page.keyboard.up('ArrowLeft');await page.locator('#pause-button').click();
  const frozen=(await runtime(page)).snapshot;expect(frozen.distance).toBeGreaterThan(0);
  const observed=await page.locator('.balance-readout').evaluate(e=>({cup:Number((e as HTMLElement).dataset.cup),tilt:Number((e as HTMLElement).dataset.surfaceTilt),side:(e as HTMLElement).dataset.side}));
  const cup=frozen.cups.find((c:any)=>c.id===observed.cup);expect(cup).toBeTruthy();expect(observed.tilt).toBeCloseTo(cup.surfaceTilt,2);
  const side=Math.abs(cup.surfaceTilt)<.08?'center':cup.surfaceTilt>0?'left':'right';expect(observed.side).toBe(side);
  await expect(page.locator('.tilt-direction')).toContainText(side==='center'?'中央':side==='left'?'左':'右');await expect(page.locator('.tilt-owner')).toContainText(cup.name);
  await expect(page.locator('.walk-distance')).toHaveText(String(frozen.distance));
  for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});
    const selectors=['.walk-window','.walk-distance','.balance-readout','.tilt-direction','.tilt-meter','.cup-meters'];
    const layout=await geometry(page,selectors);
    const details=await page.evaluate(()=>{
      const window=document.querySelector('.walk-window')!,w=window.getBoundingClientRect();
      return{font:parseFloat(getComputedStyle(document.querySelector('.walk-distance')!).fontSize),nodes:['.walk-distance','.balance-readout','.cup-meters'].map(selector=>{const e=document.querySelector(selector)!,r=e.getBoundingClientRect();return{selector,descendant:window.contains(e),left:r.left-w.left,right:r.right-w.right,top:r.top-w.top,bottom:r.bottom-w.bottom};})};
    });
    expect(details.font).toBeGreaterThanOrEqual(height<=350||width<=360?26:width<701||height<501?30:40);
    for(const item of details.nodes){expect(item.descendant,item.selector).toBe(true);expect(item.left,item.selector).toBeGreaterThanOrEqual(-1);expect(item.top,item.selector).toBeGreaterThanOrEqual(-1);expect(item.right,item.selector).toBeLessThanOrEqual(1);expect(item.bottom,item.selector).toBeLessThanOrEqual(1);}
    records.push({width,height,layout,details});expect((await runtime(page)).snapshot).toEqual(frozen);
  }
  expect(errors).toEqual([]);await info.attach('actual-coffee-in-game-hud',{body:JSON.stringify({frozen,observed,records,errors}),contentType:'application/json'});
});

test('Meeting uses two distinct generated foreground images through real LISTEN/WORK inputs without extra image loads',async({page},info)=>{
  test.skip(info.project.name!=='desktop');const errors=errorsOn(page),images:Array<{url:string;status:number;bytes:number}>=[],pending:Promise<void>[]=[];
  page.on('response',response=>{if(/foreground-(listen|work)\.webp(?:\?|$)/.test(response.url()))pending.push(response.body().then(body=>{images.push({url:response.url(),status:response.status(),bytes:body.length});}));});
  await seedStoredZero(page,'game010',true);await page.goto('./game010.html');await page.locator('#play-button').click();
  for(let i=0;i<10;i++){await page.locator('#toggle-button').click();expect((await runtime(page)).snapshot.mode).toBe(i%2===0?'work':'listen');}
  await page.locator('#pause-button').click();await Promise.all(pending);
  expect(images).toHaveLength(2);expect(new Set(images.map(i=>i.url)).size).toBe(2);for(const image of images){expect(image.status).toBe(200);expect(image.bytes).toBeGreaterThan(1000);}
  expect((await runtime(page)).snapshot.alive).toBe(true);expect(errors).toEqual([]);await info.attach('actual-generated-foreground-loads',{body:JSON.stringify({images,snapshot:(await runtime(page)).snapshot,errors}),contentType:'application/json'});
});
