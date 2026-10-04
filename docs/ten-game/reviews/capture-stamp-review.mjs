import{openReview}from'./capture-ordinary-session.mjs';const r=await openReview('009',5179);const{page,records,read,button,shot,touch}=r;let choices=0,paused=false;const began=Date.now();
try{
 await button('play-button');
 while(Date.now()-began<120000){const o=await read(),s=o.inspection;if(!s.alive)break;
  if(o.state==='milestone'){choices++;await shot(`cleanup-${choices}-choice`);if(choices===1)await r.offerViewports('cleanup-choice');const before=await read();await page.waitForTimeout(1100);const after=await read();records.push({type:'choiceFreeze',before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection)});await button(choices===3?'clean-button':'continue-button');records.push({type:'choiceAccepted',before,...await read()});await page.waitForTimeout(200);await shot(`after-cleanup-${choices}`);continue;}
  if(s.phase==='searching'){
   if(!paused&&s.correct===3){paused=true;await r.pauseProof();await shot('gameplay');continue;}
   if(s.correct>=23){await shot('maximum-clutter-desk');const wrong=s.objects.find(x=>!s.matchingIds.includes(x.id));records.push({type:'ordinaryWrongPick',id:wrong.id,...o});await button(`object-${wrong.id}`);continue;}
   // The exact matching IDs are read-only oracle planning, not visual-search skill proof.
   await page.waitForTimeout(s.correct<4?1600:350);const before=await read();if(before.inspection.phase!=='searching')continue;const id=before.inspection.matchingIds[0];records.push({type:'ordinaryOraclePick',id,input:!touch&&before.inspection.correct===0?'native Tab + Enter':'native click/tap',...before});if(!touch&&before.inspection.correct===0){for(let n=0;n<30;n++){if(await page.evaluate(id=>document.activeElement?.id===`object-${id}`,id))break;await page.keyboard.press('Tab');}if(!await page.evaluate(id=>document.activeElement?.id===`object-${id}`,id))throw Error('Native Tab did not reach requested stamp');await page.keyboard.press('Enter');}else await button(`object-${id}`);
   if(s.correct===11)await shot('clutter-gameplay');
  }
  await page.waitForTimeout(35);
 }
 const final=await read();if(final.inspection.alive||choices<3)throw Error('Missing earned cleanup risk/clean route');await r.endRecord();await r.retry();
 if(touch){await page.waitForFunction(()=>window.__arcadeDebug.state()==='result',{timeout:20000});records.push({type:'naturalTimeout',...await read()});await page.waitForTimeout(350);await shot('timeout-result');await r.retry();const s=(await read()).inspection;const wrong=s.objects.find(x=>!s.matchingIds.includes(x.id));await button(`object-${wrong.id}`);await page.waitForFunction(()=>window.__arcadeDebug.state()==='result');records.push({type:'additionalNaturalWrong',...await read()});await r.refill();}
 records.push({type:'complete',wallMs:Date.now()-began});await r.close();
}catch(error){await r.close(error);throw error;}
