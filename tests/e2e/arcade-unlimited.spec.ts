import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { arcadeGames, arcadeSizes, assertNoWalletEvents, errorsOn, geometry, nativeButton, runtime, seedStoredZero, storagePrefix } from './helpers/eleven-arcade';

/** Short natural failures exercise the unrestricted retry contract; no model/time/score writes. */
async function naturalFailure(page:Page,id:string):Promise<void>{
  if(id==='game003'){
    const end=Date.now()+100_000;
    while(Date.now()<end){const s=(await runtime(page)).inspection;if(!s.alive)break;
      if(s.phase==='hanging'&&s.cargo){
        const top=s.stack.at(-1)??s.foundation;
        // The first three deliberately friendly crates must be genuinely placed first.
        // Later release on either exposed side beyond the actual support edge, avoiding
        // the old one-sided oracle which could wait forever after the top drifted right.
        const outsideSupport=Math.abs(s.cargo.x-top.x)>top.width/2+12;
        if(s.floors<3||outsideSupport)await nativeButton(page,'#drop-button');
      }
      await page.waitForTimeout(35);
    }
  }else if(id==='game004'){
    await expect.poll(async()=>(await runtime(page)).inspection.phase).toBe('recall');
    const wanted=(await runtime(page)).inspection.expectedCell;await page.locator(`#cell-${(wanted+1)%9}`).click();
  }else if(id==='game005'){
    const correct=(await runtime(page)).inspection.expectedSide;
    await page.locator(correct==='left'?'#right-button':'#left-button').click();
  }else if(id==='game006'){
    await page.locator('#action-button').click();await page.locator('#action-button').click();
  }else if(id==='game007'){
    const end=Date.now()+40_000;
    while(Date.now()<end){const s=(await runtime(page)).snapshot;if(!s.alive)break;
      if(s.phase==='boarding')await page.locator('#right-button').click();
      await page.waitForTimeout(30);
    }
  }else if(id==='game008'){
    await page.locator('#stage').click({position:{x:5,y:5}});await page.keyboard.down('ArrowRight');
    await expect.poll(async()=>(await runtime(page)).snapshot.alive,{timeout:35_000,intervals:[50]}).toBe(false);await page.keyboard.up('ArrowRight');
  }else if(id==='game009'){
    const s=(await runtime(page)).inspection;
    const wrong=s.objects.find((o:any)=>!s.matchingIds.includes(o.id));expect(wrong).toBeTruthy();await page.locator(`#object-${wrong.id}`).click();
  }else if(id==='game010'){
    await page.locator('#toggle-button').click();
  }else if(id==='game011'){
    const s=(await runtime(page)).inspection;await page.locator(s.answerSide==='left'?'#right-button':'#left-button').click();
  }
  // Orbit and Workday collide naturally without input. Their original mechanics stay intact.
  await expect(page.locator('#retry-button')).toBeVisible({timeout:105_000});
}

for(const id of arcadeGames){
  test(`${id}: saved zero credits allows three genuine endings and retries without wallet or reward activity`,async({page},info)=>{
    test.skip(info.project.name!=='desktop');test.setTimeout(330_000);const errors=errorsOn(page);
    await seedStoredZero(page,id,true);await page.goto(`./${id}.html`);await page.locator('#play-button').click();
    await expect.poll(async()=>(await runtime(page)).state).toBe('playing');await expect(page.locator('#arcade-training')).not.toBeVisible();
    // Phaser/Quiz assets may still be finishing their legitimate cold-start gate.
    await expect.poll(async()=>(await runtime(page)).snapshot.alive).toBe(true);
    const responsive:unknown[]=[],layoutIssues:string[]=[];
    const collectLayout=async(phase:string,selectors:string[])=>{
      for(const[width,height]of arcadeSizes){
        await page.setViewportSize({width,height});
        try{responsive.push({id,phase,width,height,geometry:await geometry(page,selectors,selectors)});}
        catch(error){const message=`${id}/${phase}/${width}x${height}: ${String(error)}`;layoutIssues.push(message);responsive.push({id,phase,width,height,error:message});await page.screenshot({path:info.outputPath(`${phase}-${width}x${height}-finding.png`)});}
      }
      const path=info.outputPath('actual-pause-result-layouts.json');
      writeFileSync(path,JSON.stringify({responsive,layoutIssues},null,2));
      await info.attach(`actual-${phase}-layouts`,{path,contentType:'application/json'});
      expect(layoutIssues,'all actual phase findings retained').toEqual([]);
      await page.setViewportSize({width:1366,height:900});
    };
    await page.locator('#pause-button').click();
    await expect.poll(async()=>(await runtime(page)).state).toBe('paused');
    const paused=(await runtime(page)).snapshot;
    await collectLayout('paused',['#resume-button','#title-button','.arcade-portal-back','#mute-button']);
    expect((await runtime(page)).snapshot.time).toBe(paused.time);
    await page.locator('#resume-button').click();
    await expect.poll(async()=>(await runtime(page)).state).toBe('playing');
    const endings=[];
    for(let i=0;i<3;i++){
      await naturalFailure(page,id);const ended=await runtime(page);endings.push(ended.snapshot);
      expect(ended.snapshot.alive).toBe(false);assertNoWalletEvents(ended.events);
      if(id==='game003')expect(['fall','collapse']).toContain(ended.snapshot.outcome);
      if(id==='game008'){
        const timing=page.locator('.result-details>div').filter({has:page.locator('dt',{hasText:/^TIME$/})});
        await expect(timing.locator('dt')).toHaveText('TIME');await expect(timing.locator('dd')).toHaveText(/^\d+\.\d s$/);
        expect(await page.locator('.result-note').textContent()).not.toMatch(/CREDIT|\d\/3/);
        const proof=info.outputPath(`actual-coffee-credit-free-result-${i+1}.json`);
        writeFileSync(proof,JSON.stringify({ended,text:await page.locator('.result-note').textContent(),timing:await timing.textContent()},null,2));
        await info.attach(`actual-coffee-credit-free-result-${i+1}`,{path:proof,contentType:'application/json'});
      }
      expect(ended.events.filter(e=>e.name==='run_end')).toHaveLength(i+1);expect(ended.events.filter(e=>e.name==='run_start')).toHaveLength(i+1);
      await expect(page.locator('#reward-button')).not.toBeVisible();
      for(const label of await page.locator('.credit-label,.credits').all())await expect(label).not.toBeVisible();
      expect(await page.evaluate(key=>localStorage.getItem(key),`${storagePrefix(id)}credits`)).toBe('0');
      if(i===0)await collectLayout('result',['#retry-button','#title-button','.arcade-portal-back','#mute-button']);
      if(i<2){await page.locator('#retry-button').click();await expect.poll(async()=>(await runtime(page)).snapshot.alive).toBe(true);}
    }
    const journal=(await runtime(page)).events;
    for(const name of['run_end','run_duration','score'])expect(journal.filter(e=>e.name===name),name).toHaveLength(3);
    expect(journal.filter(e=>e.name==='retry')).toHaveLength(2);expect(journal.every(e=>e.data.game_id===id)).toBe(true);
    const best=await page.locator('#best-value').textContent();await page.reload();await expect(page.locator('#best-value')).toHaveText(best!);
    await page.locator('#play-button').click();await expect.poll(async()=>(await runtime(page)).state).toBe('playing');
    expect(errors).toEqual([]);await info.attach('actual-unlimited-retries',{body:JSON.stringify({endings,journal,best,responsive,errors}),contentType:'application/json'});
  });
}
