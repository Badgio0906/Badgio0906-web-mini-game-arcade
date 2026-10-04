import{openReview}from'./capture-ordinary-session.mjs';const r=await openReview('010',5180);const{page,touch,records,read,button,shot}=r;const began=Date.now(),seen=new Set();let choice=false,paused=false,togglePoint;
const toggle=()=>touch?page.touchscreen.tap(togglePoint.x,togglePoint.y):page.keyboard.press('Space');
try{
 await button('play-button');
 if(touch)togglePoint=await page.evaluate(()=>{const b=document.getElementById('toggle-button').getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
 while(Date.now()-began<150000){const o=await read(),s=o.inspection;if(!s.alive)break;
  if(o.state==='milestone'){choice=true;await shot('five-minutes-choice');await r.offerViewports('overtime-choice',true);const before=await read();await page.keyboard.press('Space');await page.waitForTimeout(1100);const after=await read();records.push({type:'choiceFreeze',before,after,same:JSON.stringify(before.inspection)===JSON.stringify(after.inspection)});await button('board-button');records.push({type:'choiceAccepted',before,...await read()});continue;}
  if(!paused&&s.time>10&&s.phase==='talk'){paused=true;await r.pauseProof();await shot('gameplay');continue;}
  if(s.phase==='cue'&&!seen.has(s.currentCue.kind)){seen.add(s.currentCue.kind);await shot(`cue-${s.currentCue.kind}`);records.push({type:'actualCue',...o});}
  if(s.meetingMode==='board'&&s.time>63&&!seen.has('board')){seen.add('board');await shot('board-gameplay');records.push({type:'futureDoubleScore',...o});}
  if(s.meetingMode==='board'&&s.phase==='talk'&&s.mode==='work'&&s.nextCue?.cueStart-s.time>1.4&&!seen.has('double-earned')){seen.add('double-earned');const before=await read();await page.waitForTimeout(1000);records.push({type:'actualDoubleWorkSecond',before,after:await read()});}
  // Native input responds to visible cue type. Feint is intentionally distinguishable, not hidden oracle foresight.
  const fail=choice&&s.time>74;const wanted=fail?'work':s.phase==='answer'||s.phase==='cue'&&s.currentCue.kind==='question'?'listen':'work';if(s.mode!==wanted){records.push({type:'ordinaryToggle',wanted,...o});await toggle();}
  await page.waitForTimeout(45);
 }
 const final=await read();if(final.inspection.alive||!choice)throw Error('Missing earned board choice and caught result');await r.endRecord();await r.offerViewports('earned-caught-result',true);await r.retry();
 if(touch){for(let n=0;n<2;n++){if((await read()).inspection.mode==='listen')await toggle();await page.waitForFunction(()=>window.__arcadeDebug.state()==='result',{timeout:20000});records.push({type:'additionalNaturalCaught',...await read()});await page.waitForTimeout(350);if(n===0)await r.retry();}await r.refill();}
 records.push({type:'complete',wallMs:Date.now()-began});await r.close();
}catch(error){await r.close(error);throw error;}
