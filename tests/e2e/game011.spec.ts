import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { arcadeSizes, assertNoWalletEvents, errorsOn, geometry, nativeButton, runtime, seedStoredZero } from './helpers/eleven-arcade';

async function correct(page:Page,touch=false){
  const before=(await runtime(page)).inspection;expect(before.answerSide).not.toBeNull();
  if(touch)await page.locator(`#${before.answerSide}-button`).tap();
  else await page.keyboard.press(before.answerSide==='left'?'ArrowLeft':'ArrowRight');
  const after=(await runtime(page)).inspection;expect(after.alive,'ordinary quiz answer must remain alive').toBe(true);expect(after.score-before.score).toBe(before.phase==='image_answer'?100:before.phase==='text_answer'?150:250);
  return{before,after};
}

test('Quiz ordinary image/text answers reach both final modes, preserve untimed reading, release READY fairly and update independent records',async({page,isMobile},info)=>{
  test.skip(info.project.name==='mobile-landscape');test.setTimeout(150_000);const errors=errorsOn(page),records=[];
  await seedStoredZero(page,'game011',true);await page.goto('./game011.html');await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  for(const mode of ['unko','ukon']){
    const initial=(await runtime(page)).inspection;expect(initial).toMatchObject({phase:'image_answer',deadline:5,score:0});
    records.push(await correct(page,isMobile));await expect(page.locator('#continue-button')).toBeVisible();
    const warning=(await runtime(page)).inspection;await page.waitForTimeout(1100);const waited=(await runtime(page)).inspection;
    expect(waited).toMatchObject({phase:'speed_warning',score:100,remaining:null,choices:null});expect(waited.roundId).toBe(warning.roundId);await expect(page.locator('.answer-choices')).not.toBeVisible();
    await nativeButton(page,'#continue-button',isMobile);
    for(let i=1;i<10;i++)records.push(await correct(page,isMobile));
    expect((await runtime(page)).inspection).toMatchObject({phase:'text_intro',imageCorrect:10,score:1000});await nativeButton(page,'#continue-button',isMobile);
    for(let i=0;i<10;i++){
      const reading=(await runtime(page)).inspection;expect(reading).toMatchObject({phase:'text_read',remaining:null,choices:null});
      await expect(page.locator('.answer-choices')).not.toBeVisible();
      if(i===0){
        await page.waitForTimeout(1000);expect((await runtime(page)).inspection).toMatchObject({phase:'text_read',score:1000,roundId:reading.roundId,alive:true});
        // READY activates on release: a held native gesture cannot secretly spend the .8-second window.
        if(isMobile){
          const box=(await page.locator('#ready-button').boundingBox())!,cdp=await page.context().newCDPSession(page);
          try{
            await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});
            await page.waitForTimeout(1000);
            expect((await runtime(page)).inspection).toMatchObject({phase:'text_read',score:1000,remaining:null});
          }finally{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
        }else{
          await page.locator('#ready-button').focus();await page.keyboard.down('Space');await page.waitForTimeout(1000);
          expect((await runtime(page)).inspection).toMatchObject({phase:'text_read',score:1000,remaining:null});await page.keyboard.up('Space');
        }
      }else if(i===1&&!isMobile){
        const box=(await page.locator('#ready-button').boundingBox())!;
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(1000);
        expect((await runtime(page)).inspection).toMatchObject({phase:'text_read',score:1150,remaining:null});await page.mouse.up();
      }else if(isMobile)await page.locator('#ready-button').tap();else await page.locator('#ready-button').click();
      const ready=(await runtime(page)).inspection;expect(ready).toMatchObject({phase:'text_answer',deadline:.8,textCorrect:i,score:1000+150*i});
      expect(ready.roundId).toBeGreaterThan(reading.roundId);expect(ready.remaining).toBeGreaterThan(0);
      // Fresh native answer has no artificial post-READY cooldown. Pointer input also checks real labels.
      await nativeButton(page,`#${ready.answerSide}-button`,isMobile);
      expect((await runtime(page)).inspection).toMatchObject({alive:true,textCorrect:i+1,score:1000+150*(i+1)});
    }
    const choice=(await runtime(page)).inspection;expect(choice).toMatchObject({phase:'final_choice',score:2500,textCorrect:10,choices:null});
    await page.waitForTimeout(800);expect((await runtime(page)).inspection).toMatchObject({phase:'final_choice',score:2500,roundId:choice.roundId});
    await nativeButton(page,`#${mode}-mode-button`,isMobile);if(!isMobile)await page.locator('#left-button').focus();
    for(let i=0;i<12;i++)records.push(await correct(page,isMobile));
    const earned=(await runtime(page)).inspection;expect(earned).toMatchObject({phase:'final_answer',finalMode:mode,finalStreak:12,score:5500,deadline:.5});
    const wrong=earned.answerSide==='left'?'right':'left';
    if(isMobile)await nativeButton(page,`#${wrong}-button`,true);else await page.keyboard.press(wrong==='left'?'ArrowLeft':'ArrowRight');
    await expect(page.locator('#retry-button')).toBeVisible();await expect(page.locator('#result-score')).toHaveText('5500');await expect(page.locator('#best-value')).toHaveText('5500');await expect(page.locator('#best-final-value')).toHaveText('12');
    records.push({earned,ended:await runtime(page)});
    if(mode==='unko')await page.locator('#retry-button').click();
  }
  const journal=(await runtime(page)).events;expect(journal.filter(e=>e.name==='run_start')).toHaveLength(2);expect(journal.filter(e=>e.name==='run_end')).toHaveLength(2);assertNoWalletEvents(journal);
  if(!isMobile){
    const viewport=page.viewportSize()!;
    for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});
      records.push({phase:'actual-final5500-result',width,height,geometry:await geometry(page,['.result-ticket','#result-score','.result-details','.result-comment','#retry-button','#title-button'],['#retry-button','#title-button'])});
      const line=await page.locator('#result-score').evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return{lines:r.getClientRects().length,text:e.textContent};});expect(line).toEqual({lines:1,text:'5500'});
    }
    await page.setViewportSize(viewport);
  }
  await page.reload();await expect(page.locator('#best-value')).toHaveText('5500');await expect(page.locator('#best-final-value')).toHaveText('12');expect(errors).toEqual([]);
  await info.attach('actual-quiz-three-phases',{body:JSON.stringify({records,journal,errors}),contentType:'application/json'});
});

test('Quiz native held/repeated arrows never carry an answer across questions; exact wall deadline blocks a late native answer',async({page},info)=>{
  test.skip(info.project.name!=='desktop');const errors=errorsOn(page);await seedStoredZero(page,'game011',true);await page.goto('./game011.html');await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  const first=(await runtime(page)).inspection;const key=first.answerSide==='left'?'ArrowLeft':'ArrowRight';
  await page.keyboard.down(key);await page.keyboard.down(key);await page.keyboard.up(key);
  expect((await runtime(page)).inspection).toMatchObject({imageCorrect:1,score:100,phase:'speed_warning'});
  await page.locator('#continue-button').click();await page.waitForTimeout(150);expect((await runtime(page)).inspection).toMatchObject({alive:true,imageCorrect:1,score:100,phase:'image_answer'});
  await page.locator('#pause-button').click();const paused=(await runtime(page)).inspection;await page.waitForTimeout(1100);expect((await runtime(page)).inspection).toEqual(paused);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));expect((await runtime(page)).events.filter(e=>e.name==='run_end'||e.name==='quit')).toEqual([]);
  await page.locator('#resume-button').click();await expect(page.locator('#retry-button')).toBeVisible({timeout:3000});
  // Ended phases expose no live countdown; retain the exact consumed one-second deadline.
  const expired=(await runtime(page)).inspection;expect(expired).toMatchObject({alive:false,score:100,phase:'ended',remaining:null,deadline:1,answerElapsed:1});
  await page.keyboard.press(expired.answerSide==='left'?'ArrowLeft':'ArrowRight');expect((await runtime(page)).inspection.score).toBe(100);
  const endedEvents=(await runtime(page)).events.filter(e=>e.name==='run_end');
  expect(endedEvents).toHaveLength(1);expect(endedEvents[0].data.reason).toBe('timeout');expect(errors).toEqual([]);
  const proofPath=info.outputPath('actual-quiz-deadline-and-repeat.json');
  writeFileSync(proofPath,JSON.stringify({first,paused,expired,events:(await runtime(page)).events,errors},null,2));
  await info.attach('actual-quiz-deadline-and-repeat',{path:proofPath,contentType:'application/json'});
});

test('Quiz actual initial question, pause and earned wrong-result retain full readable information and 44px actions at eight sizes',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(60_000);const errors=errorsOn(page),records=[];
  await seedStoredZero(page,'game011',true);await page.goto('./game011.html');await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  await page.locator('#pause-button').click();const paused=(await runtime(page)).inspection;
  for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});records.push({phase:'paused',width,height,geometry:await geometry(page,['#stage','.pause-ticket','#resume-button','#title-button'],['#resume-button','#title-button'])});expect((await runtime(page)).inspection).toEqual(paused);}
  await page.setViewportSize({width:1440,height:900});await page.locator('#resume-button').click();const q=(await runtime(page)).inspection;await page.locator(q.answerSide==='left'?'#right-button':'#left-button').click();await expect(page.locator('#retry-button')).toBeVisible();
  for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});records.push({phase:'natural-result',width,height,geometry:await geometry(page,['.result-ticket','#result-score','.result-details','.result-comment','#retry-button','#title-button'],['#retry-button','#title-button'])});}
  expect(errors).toEqual([]);await info.attach('actual-quiz-responsive',{body:JSON.stringify({records,paused,ended:await runtime(page),errors}),contentType:'application/json'});
});
