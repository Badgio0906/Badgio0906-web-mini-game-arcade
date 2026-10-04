import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { arcadeSizes, assertNoWalletEvents, errorsOn, geometry, nativeButton, runtime, seedStoredZero } from './helpers/eleven-arcade';

async function correct(page:Page,touch=false){
  const before=(await runtime(page)).inspection;expect(before.answerSide).not.toBeNull();
  if(touch)await page.locator(`#${before.answerSide}-button`).tap();
  else await page.keyboard.press(before.answerSide==='left'?'ArrowLeft':'ArrowRight');
  const after=(await runtime(page)).inspection;expect(after.alive,'ordinary quiz answer must remain alive').toBe(true);expect(after.score-before.score).toBe(before.pointsPerCorrect);
  return{before,after};
}

test('Quiz ordinary image/text answers reach both final modes, preserve untimed reading, release READY fairly and update independent records',async({page,isMobile},info)=>{
  test.skip(info.project.name==='mobile-landscape');test.setTimeout(150_000);const errors=errorsOn(page),records=[];
  await seedStoredZero(page,'game011',true);await page.goto('./game011.html');await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  for(const mode of ['unko','ukon']){
    const initial=(await runtime(page)).inspection;expect(initial).toMatchObject({phase:'image_answer',deadline:2,score:0});
    for(let i=0;i<10;i++)records.push(await correct(page,isMobile));
    expect((await runtime(page)).inspection).toMatchObject({phase:'text_intro',imageCorrect:10,score:1000});await nativeButton(page,'#continue-button',isMobile);
    for(let i=0;i<10;i++){
      const reading=(await runtime(page)).inspection;expect(reading).toMatchObject({phase:'text_read',remaining:null,choices:null});
      await expect(page.locator('.answer-choices')).not.toBeVisible();
      if(i===0){
        await page.waitForTimeout(1000);expect((await runtime(page)).inspection).toMatchObject({phase:'text_read',score:1000,roundId:reading.roundId,alive:true});
        // READY activates on release: a held native gesture cannot secretly spend the two-second window.
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
        expect((await runtime(page)).inspection).toMatchObject({phase:'text_read',score:1100,remaining:null});await page.mouse.up();
      }else if(isMobile)await page.locator('#ready-button').tap();else await page.locator('#ready-button').click();
      const ready=(await runtime(page)).inspection;expect(ready).toMatchObject({phase:'text_answer',deadline:2,textCorrect:i,score:1000+100*i});
      expect(ready.roundId).toBeGreaterThan(reading.roundId);expect(ready.remaining).toBeGreaterThan(0);
      // Fresh native answer has no artificial post-READY cooldown. Pointer input also checks real labels.
      await nativeButton(page,`#${ready.answerSide}-button`,isMobile);
      expect((await runtime(page)).inspection).toMatchObject({alive:true,textCorrect:i+1,score:1000+100*(i+1)});
    }
    const choice=(await runtime(page)).inspection;expect(choice).toMatchObject({phase:'final_choice',score:2000,textCorrect:10,choices:null});
    await page.waitForTimeout(800);expect((await runtime(page)).inspection).toMatchObject({phase:'final_choice',score:2000,roundId:choice.roundId});
    await nativeButton(page,`#${mode}-mode-button`,isMobile);if(!isMobile)await page.locator('#left-button').focus();
    for(let i=0;i<12;i++)records.push(await correct(page,isMobile));
    const earned=(await runtime(page)).inspection;expect(earned).toMatchObject({phase:'final_answer',finalMode:mode,finalStreak:12,score:4400,deadline:1.5});
    const wrong=earned.answerSide==='left'?'right':'left';
    if(isMobile)await nativeButton(page,`#${wrong}-button`,true);else await page.keyboard.press(wrong==='left'?'ArrowLeft':'ArrowRight');
    await expect(page.locator('#retry-button')).toBeVisible();await expect(page.locator('#result-score')).toHaveText('4400');await expect(page.locator('#best-value')).toHaveText('4400');await expect(page.locator('#best-final-value')).toHaveText('12');
    records.push({earned,ended:await runtime(page)});
    if(mode==='unko')await page.locator('#retry-button').click();
  }
  const journal=(await runtime(page)).events;expect(journal.filter(e=>e.name==='run_start')).toHaveLength(2);expect(journal.filter(e=>e.name==='run_end')).toHaveLength(2);assertNoWalletEvents(journal);
  if(!isMobile){
    const viewport=page.viewportSize()!;
    for(const[width,height]of arcadeSizes){await page.setViewportSize({width,height});
      records.push({phase:'actual-final4400-result',width,height,geometry:await geometry(page,['.result-ticket','#result-score','.result-details','.result-comment','#retry-button','#title-button'],['#retry-button','#title-button'])});
      const line=await page.locator('#result-score').evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);return{lines:r.getClientRects().length,text:e.textContent};});expect(line).toEqual({lines:1,text:'4400'});
    }
    await page.setViewportSize(viewport);
  }
  await page.reload();await expect(page.locator('#best-value')).toHaveText('4400');await expect(page.locator('#best-final-value')).toHaveText('12');expect(errors).toEqual([]);
  await info.attach('actual-quiz-three-phases',{body:JSON.stringify({records,journal,errors}),contentType:'application/json'});
});

test('Quiz native held/repeated arrows never carry an answer across questions; exact wall deadline blocks a late native answer',async({page},info)=>{
  test.skip(info.project.name!=='desktop');const errors=errorsOn(page);await seedStoredZero(page,'game011',true);await page.goto('./game011.html');await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  const first=(await runtime(page)).inspection;const key=first.answerSide==='left'?'ArrowLeft':'ArrowRight';
  await page.keyboard.down(key);await page.keyboard.down(key);await page.keyboard.up(key);
  expect((await runtime(page)).inspection).toMatchObject({imageCorrect:1,score:100,phase:'image_answer'});
  await page.waitForTimeout(150);expect((await runtime(page)).inspection).toMatchObject({alive:true,imageCorrect:1,score:100,phase:'image_answer'});
  await page.locator('#pause-button').click();const paused=(await runtime(page)).inspection;await page.waitForTimeout(1100);expect((await runtime(page)).inspection).toEqual(paused);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));expect((await runtime(page)).events.filter(e=>e.name==='run_end'||e.name==='quit')).toEqual([]);
  await page.locator('#resume-button').click();await expect(page.locator('#retry-button')).toBeVisible({timeout:3000});
  // Ended phases expose no live countdown; retain the exact consumed two-second deadline.
  const expired=(await runtime(page)).inspection;expect(expired).toMatchObject({alive:false,score:100,phase:'ended',remaining:null,deadline:2,answerElapsed:2});
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


test('Quiz RESUME releases hidden menu focus synchronously so the first immediate native arrow answers exactly once',async({page,isMobile},info)=>{
  test.skip(info.project.name==='mobile-landscape');
  const errors=errorsOn(page);await seedStoredZero(page,'game011',true);await page.goto('./game011.html');
  await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  const initial=(await runtime(page)).inspection;expect(initial).toMatchObject({phase:'image_answer',deadline:2,score:0});
  await page.locator('#pause-button').click();const paused=(await runtime(page)).inspection;
  const resume=page.locator('#resume-button');await resume.focus();await expect(resume).toBeFocused();
  const box=(await resume.boundingBox())!,x=box.x+box.width/2,y=box.y+box.height/2;
  const key=initial.answerSide==='left'?'ArrowLeft':'ArrowRight',virtualKey=key==='ArrowLeft'?37:39;
  // A capture-only observer records real browser input. It never changes focus, the model or the clock.
  await page.evaluate(()=>{
    const rows:unknown[]=[];(window as unknown as {__qaResumeEvents:unknown[]}).__qaResumeEvents=rows;
    for(const type of ['click','keydown'])document.addEventListener(type,event=>{
      if(type==='keydown'&&!(event as KeyboardEvent).key.startsWith('Arrow'))return;
      const target=event.target as HTMLElement;
      rows.push({type,time:performance.now(),target:target.id||target.tagName,key:(event as KeyboardEvent).key??null,
        focus:(document.activeElement as HTMLElement)?.id||document.activeElement?.tagName,
        path:event.composedPath().filter(node=>node instanceof HTMLElement).map(node=>(node as HTMLElement).id||(node as HTMLElement).tagName)});
    },true);
  });
  const cdp=await page.context().newCDPSession(page);
  try{
    // Coordinates/session/key are all cached before RESUME. No wait or diagnostic roundtrip between resume and answer.
    if(isMobile){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }else{
      await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
    }
    await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey});
    await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey,autoRepeat:true});
    await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey});
  }finally{await cdp.detach();}
  const after=await runtime(page),rows=await page.evaluate(()=>(window as unknown as {__qaResumeEvents:any[]}).__qaResumeEvents);
  expect(after.state).toBe('playing');expect(after.inspection).toMatchObject({alive:true,phase:'image_answer',imageCorrect:1,score:100});
  const clicked=rows.find(row=>row.type==='click'&&row.path.includes('resume-button'));
  const answered=rows.find(row=>row.type==='keydown');expect(clicked).toBeTruthy();expect(answered).toBeTruthy();
  expect(answered.time-clicked.time,'first answer is immediate, without an added post-resume grace period').toBeGreaterThanOrEqual(0);
  expect(answered.time-clicked.time).toBeLessThan(16);expect(answered.path).not.toContain('resume-button');expect(answered.focus).not.toBe('resume-button');
  expect(after.events.filter(event=>event.name==='resume')).toHaveLength(1);expect(after.events.filter(event=>event.name==='run_end')).toHaveLength(0);
  assertNoWalletEvents(after.events);expect(errors).toEqual([]);
  const proof=info.outputPath('actual-quiz-immediate-resume-focus.json');
  writeFileSync(proof,JSON.stringify({input:isMobile?'native touch RESUME plus immediate native Arrow':'native mouse RESUME plus immediate native Arrow',initial,paused,after,rows,errors},null,2));
  await info.attach('actual-quiz-immediate-resume-focus',{path:proof,contentType:'application/json'});
});


test('Quiz FINAL MODE releases hidden choice focus so the first immediate native arrow earns 200 exactly once',async({page,isMobile},info)=>{
  test.skip(info.project.name==='mobile-landscape');test.setTimeout(90_000);
  const errors=errorsOn(page),records=[];await seedStoredZero(page,'game011',true);await page.goto('./game011.html');
  await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  for(const mode of ['unko','ukon']){
    for(let i=0;i<10;i++)await correct(page,isMobile);
    await nativeButton(page,'#continue-button',isMobile);
    for(let i=0;i<10;i++){await nativeButton(page,'#ready-button',isMobile);await correct(page,isMobile);}
    const before=await runtime(page);expect(before.inspection).toMatchObject({phase:'final_choice',score:2000,remaining:null});
    const button=page.locator(`#${mode}-mode-button`);await button.focus();await expect(button).toBeFocused();
    const box=(await button.boundingBox())!,x=box.x+box.width/2,y=box.y+box.height/2;
    await page.evaluate(()=>{
      const rows:unknown[]=[];(window as unknown as {__qaModeEvents:unknown[]}).__qaModeEvents=rows;
      for(const type of ['click','keydown'])document.addEventListener(type,event=>{
        if(type==='keydown'&&!(event as KeyboardEvent).key.startsWith('Arrow'))return;
        const target=event.target as HTMLElement;
        rows.push({type,time:performance.now(),target:target.id||target.tagName,key:(event as KeyboardEvent).key??null,
          focus:(document.activeElement as HTMLElement)?.id||document.activeElement?.tagName,
          path:event.composedPath().filter(node=>node instanceof HTMLElement).map(node=>(node as HTMLElement).id||(node as HTMLElement).tagName)});
      },true);
    });
    const cdp=await page.context().newCDPSession(page);
    try{
      if(isMobile){
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }else{
        await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
        await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
      }
      // Newly shuffled answer is read once. No waits, focus repair, model writes or input grace.
      const side=await page.evaluate(()=>(window as unknown as {__arcadeDebug:{inspection:()=>{answerSide:string}}}).__arcadeDebug.inspection().answerSide);
      const key=side==='left'?'ArrowLeft':'ArrowRight',virtualKey=side==='left'?37:39;
      await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey});
      await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey,autoRepeat:true});
      await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:virtualKey,nativeVirtualKeyCode:virtualKey});
    }finally{await cdp.detach();}
    const after=await runtime(page),rows=await page.evaluate(()=>(window as unknown as {__qaModeEvents:any[]}).__qaModeEvents);
    expect(after.inspection).toMatchObject({alive:true,phase:'final_answer',finalMode:mode,score:2200,finalStreak:1,deadline:1.5});
    const clicked=rows.find(row=>row.type==='click'&&row.path.includes(`${mode}-mode-button`)),answered=rows.find(row=>row.type==='keydown');
    expect(clicked).toBeTruthy();expect(answered).toBeTruthy();expect(answered.time-clicked.time).toBeGreaterThanOrEqual(0);expect(answered.time-clicked.time).toBeLessThan(16);
    expect(answered.path).not.toContain(`${mode}-mode-button`);expect(answered.focus).not.toBe(`${mode}-mode-button`);
    records.push({mode,before,after,rows,modeToFirstArrowMilliseconds:answered.time-clicked.time});
    await nativeButton(page,after.inspection.answerSide==='left'?'#right-button':'#left-button',isMobile);
    await expect(page.locator('#retry-button')).toBeVisible();if(mode==='unko')await nativeButton(page,'#retry-button',isMobile);
  }
  const events=(await runtime(page)).events;expect(events.filter(event=>event.name==='run_start')).toHaveLength(2);expect(events.filter(event=>event.name==='run_end')).toHaveLength(2);assertNoWalletEvents(events);expect(errors).toEqual([]);
  const proof=info.outputPath('actual-quiz-immediate-mode-focus.json');writeFileSync(proof,JSON.stringify({input:isMobile?'native touch MODE plus immediate native Arrow':'native mouse MODE plus immediate native Arrow',records,events,errors},null,2));
  await info.attach('actual-quiz-immediate-mode-focus',{path:proof,contentType:'application/json'});
});


test('Quiz cumulative rounds20/21/50/51 expose exact deadline points and preserve legacy score records',async({page},info)=>{
  test.skip(info.project.name!=='desktop');test.setTimeout(90_000);
  const errors=errorsOn(page),records=[];await seedStoredZero(page,'game011',true);
  await page.addInitScript(()=>{const k='web-mini-arcade:v1:game011:best';if(localStorage.getItem(k)===null)localStorage.setItem(k,'12345');});
  await page.goto('./game011.html');await expect(page.locator('#best-value')).toHaveText('0');await expect(page.locator('.title-ticket')).toContainText('旧BEST 12345');
  await page.locator('#play-button').click();await expect(page.locator('#left-button')).toBeEnabled();
  for(let i=0;i<10;i++)await correct(page);await nativeButton(page,'#continue-button');
  for(let i=0;i<10;i++){await nativeButton(page,'#ready-button');const s=(await runtime(page)).inspection;expect(s).toMatchObject({questionNumber:11+i,deadline:2,pointsPerCorrect:100});await correct(page);}
  await nativeButton(page,'#unko-mode-button');
  for(let i=0;i<30;i++){const s=(await runtime(page)).inspection;expect(s).toMatchObject({questionNumber:21+i,deadline:1.5,pointsPerCorrect:200});if(i===0||i===29)records.push(s);await correct(page);}
  const q51=(await runtime(page)).inspection;expect(q51).toMatchObject({questionNumber:51,deadline:.5,pointsPerCorrect:500,score:8000});await expect(page.locator('.question-status')).toContainText('+500点');records.push(await correct(page));
  const q52=(await runtime(page)).inspection;expect(q52).toMatchObject({questionNumber:52,score:8500});await page.keyboard.press(q52.answerSide==='left'?'ArrowRight':'ArrowLeft');await expect(page.locator('#retry-button')).toBeVisible();
  const saved=await page.evaluate(()=>({legacy:localStorage.getItem('web-mini-arcade:v1:game011:best'),current:localStorage.getItem('web-mini-arcade:v1:game011:best:v2')}));expect(saved).toEqual({legacy:'12345',current:'8500'});
  await page.reload();await expect(page.locator('#best-value')).toHaveText('8500');await expect(page.locator('.title-ticket')).toContainText('旧BEST 12345');expect(errors).toEqual([]);
  await info.attach('actual-quiz-v2-thresholds',{body:JSON.stringify({records,q51,q52,saved,errors}),contentType:'application/json'});
});
