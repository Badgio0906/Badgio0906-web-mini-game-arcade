import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { arcadeGames, arcadeSizes, assertNoWalletEvents, errorsOn, finishPractice, geometry, nativeButton, practiceInput, runtime, seedStoredZero, storagePrefix, training, wallet } from './helpers/eleven-arcade';

for (const id of arcadeGames) {
  test(`${id}: first real practice is isolated, completion is deliberate, reload skips it and repeat practice stays separate`, async ({page,isMobile}, info) => {
    test.skip(info.project.name==='mobile-landscape');
    test.skip(info.project.name==='desktop' && (process.env.ELEVEN_SKIP_PASSED_DESKTOP_PRACTICE??'').split(',').includes(id), 'Retained earlier PASS on the same frozen runtime; no repeated native run');
    test.setTimeout(70_000);
    const errors=errorsOn(page);await seedStoredZero(page,id);await page.goto(`./${id}.html`);
    await expect(page.locator('#play-button')).toBeVisible();
    const initial=await runtime(page), initialWallet=await wallet(page,id), initialBest=await page.locator('#best-value').textContent(), initialScore=await page.locator('#score-value').textContent();
    expect(initial.snapshot.time).toBe(0);expect(Number.isFinite(Number(initialScore))).toBe(true);
    await nativeButton(page,'#play-button',isMobile);
    await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','explanation');
    expect((await training(page)).completed).toBe(false);
    expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(0);
    await nativeButton(page,'#tutorial-close-button',isMobile);
    expect((await training(page)).completed).toBe(false);
    await nativeButton(page,'#play-button',isMobile);await nativeButton(page,'#tutorial-practice-button',isMobile);
    await page.waitForTimeout(400);
    expect((await training(page)).phase).toBe('practice');expect((await runtime(page)).snapshot.time).toBe(0);
    await expect(page.locator('#score-value')).toHaveText(initialScore!);await expect(page.locator('#best-value')).toHaveText(initialBest!);
    expect(await wallet(page,id)).toEqual(initialWallet);
    if(id==='game005'){await practiceInput(page,'right',isMobile);expect((await training(page)).practice.step).toBe(0);}
    if(id==='game009'){await practiceInput(page,'stamp-other',isMobile);expect((await training(page)).practice.complete).toBe(false);}
    if(id==='game011'){await practiceInput(page,'ukon',isMobile);expect((await training(page)).practice.complete).toBe(false);}
    await finishPractice(page,id,isMobile);
    const success=await runtime(page), successTraining=await training(page);
    expect(successTraining.completed).toBe(false);expect(successTraining.practice.complete).toBe(true);
    expect(success.snapshot.time).toBe(0);expect(success.events.filter(e=>['run_start','run_end','run_duration','score','retry'].includes(e.name))).toEqual([]);
    assertNoWalletEvents(success.events);expect(await wallet(page,id)).toEqual(initialWallet);
    await geometry(page,['#arcade-training','#tutorial-start-button'],['#tutorial-start-button']);
    await page.waitForTimeout(300);expect((await runtime(page)).state).toBe('title');
    await nativeButton(page,'#tutorial-start-button',isMobile);
    await expect.poll(async()=>(await runtime(page)).state).toBe('playing');
    const begun=await runtime(page);expect(begun.events.filter(e=>e.name==='run_start')).toHaveLength(1);
    expect(begun.events.filter(e=>e.name==='tutorial_complete')).toHaveLength(1);assertNoWalletEvents(begun.events);
    expect((await wallet(page,id))[`${storagePrefix(id)}tutorialCompleted`]).toBe('true');
    expect((await wallet(page,id))[`${storagePrefix(id)}credits`]).toBe('0');
    await page.reload();await expect(page.locator('#play-button')).toBeVisible();
    await nativeButton(page,'#tutorial-again-button',isMobile);await nativeButton(page,'#tutorial-practice-button',isMobile);
    await finishPractice(page,id,isMobile);await nativeButton(page,'#tutorial-start-button',isMobile);
    await expect(page.locator('#play-button')).toBeVisible();expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(0);
    await expect(page.locator('#best-value')).toHaveText(initialBest!);
    await nativeButton(page,'#play-button',isMobile);
    await expect.poll(async()=>(await runtime(page)).state).toBe('playing');
    await expect(page.locator('#arcade-training')).not.toBeVisible();expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(1);
    expect(errors).toEqual([]);
    const proofPath=info.outputPath('independent-practice-isolation.json');
    writeFileSync(proofPath,JSON.stringify({id,project:info.project.name,initial,success,successTraining,begun,initialWallet,errors},null,2));
    await info.attach('independent-practice-isolation',{path:proofPath,contentType:'application/json'});
  });
}

test('held practice input cannot automatically activate the newly focused real-start button',async({page},info)=>{
  test.skip(info.project.name!=='desktop');const errors=errorsOn(page);
  await seedStoredZero(page,'game011');await page.goto('./game011.html');await page.locator('#play-button').click();await page.locator('#tutorial-practice-button').click();
  const left=(await training(page)).practice.choiceLeft;
  await page.keyboard.down(left==='unko'?'ArrowLeft':'ArrowRight');
  await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','success');
  await page.waitForTimeout(300);await page.keyboard.up(left==='unko'?'ArrowLeft':'ArrowRight');
  expect((await runtime(page)).state).toBe('title');expect((await training(page)).completed).toBe(false);
  expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(0);
  await page.locator('#tutorial-start-button').click();expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(1);expect(errors).toEqual([]);
});

test('native Enter auto-repeat during successful practice cannot click the new real-start control',async({page},info)=>{
  test.skip(info.project.name!=='desktop');const errors=errorsOn(page);
  await seedStoredZero(page,'game011');await page.goto('./game011.html');await page.locator('#play-button').click();await page.locator('#tutorial-practice-button').click();
  await page.locator('[data-practice-action="unko"]').focus();await page.keyboard.down('Enter');
  await expect(page.locator('#arcade-training')).toHaveAttribute('data-phase','success');
  await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');
  expect((await training(page)).completed).toBe(false);expect((await runtime(page)).state).toBe('title');
  expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(0);
  await page.locator('#tutorial-start-button').click();expect((await runtime(page)).events.filter(e=>e.name==='run_start')).toHaveLength(1);expect(errors).toEqual([]);
});

test('all eleven explanation, practice and success controls fit the eight viewport sizes without reducing primary targets',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(180_000);const errors=errorsOn(page),records:unknown[]=[],issues:string[]=[];
  const collect=async(id:string,phase:string,width:number,height:number,selectors:string[],actions:string[])=>{
    try{records.push({id,phase,width,height,geometry:await geometry(page,selectors,actions)});}
    catch(error){const message=`${id}/${phase}/${width}x${height}: ${String(error)}`;issues.push(message);records.push({id,phase,width,height,error:message});await page.screenshot({path:info.outputPath(`${id}-${phase}-${width}x${height}-finding.png`)});}
  };
  for(const id of arcadeGames){
    await seedStoredZero(page,id);await page.goto(`./${id}.html`);
    for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});await collect(id,'active-title',width,height,['#play-button','#tutorial-again-button','.arcade-portal-back'],['#play-button','#tutorial-again-button','.arcade-portal-back']);}
    await page.setViewportSize({width:1440,height:900});await page.locator('#play-button').click();
    for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});await collect(id,'explanation',width,height,['#arcade-training','#tutorial-heading','#tutorial-practice-button','#tutorial-close-button'],['#tutorial-practice-button','#tutorial-close-button']);}
    await page.setViewportSize({width:1440,height:900});await page.locator('#tutorial-practice-button').click();
    // Practice layout is measured before inputs; scenario progress is earned afterward.
    for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});
      const actions=await page.locator('[data-practice-action]').evaluateAll(es=>es.map(e=>`[data-practice-action="${(e as HTMLElement).dataset.practiceAction}"]${e.hasAttribute('aria-label')?`[aria-label="${e.getAttribute('aria-label')}"]`:''}`));
      await collect(id,'practice',width,height,['#arcade-training','#practice-prompt',...actions],actions);
    }
    await page.setViewportSize({width:1440,height:900});await finishPractice(page,id);
    for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});await collect(id,'success',width,height,['#arcade-training','#tutorial-start-button'],['#tutorial-start-button']);}
    await page.locator('#tutorial-close-button').click();
  }
  const auditPath=info.outputPath('actual-onboarding-layouts.json');
  writeFileSync(auditPath,JSON.stringify({records,issues,errors},null,2));
  await info.attach('actual-onboarding-layouts',{path:auditPath,contentType:'application/json'});expect(errors).toEqual([]);expect(issues,'all viewport findings retained; no assertion is waived').toEqual([]);
});
