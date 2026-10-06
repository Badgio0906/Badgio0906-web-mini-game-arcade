import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const epoch=new Date('2026-10-06T00:00:00Z');await page.clock.install({time:epoch});await page.goto('http://localhost:5173/prototype-stick.html');await page.clock.pauseAt(new Date(epoch.getTime()+10000));
const results=[];
for(let run=0;run<2;run++){
 await page.click('#start');
 while(Math.abs((await page.evaluate(()=>window.__stick)).angle)<.56)await page.clock.runFor(50);
 const danger=await page.evaluate(()=>window.__stick);let key='',recovered=false;
 await page.screenshot({path:`docs/prototypes/stick-balance/QA/recovery-${run}-danger.png`});
 for(let i=0;i<50;i++){
  const s=await page.evaluate(()=>window.__stick);if(s.over){console.log({run,danger,s});throw new Error('Recovery failed');}
  if(Math.abs(s.angle)<.18&&Math.abs(s.omega)<.6){recovered=true;break;}
  const direction=await page.evaluate(async()=>{const {step}=await import('/src/prototypes/stick-balance/model.ts');return [-1,0,1].map(input=>{const s={...window.__stick};for(let i=0;i<12;i++)step(s,input);return {input,cost:(s.angle+.8*s.omega)**2+.0002*s.v*s.v};}).sort((a,b)=>a.cost-b.cost)[0].input;});
  const next=direction===0?'':direction>0?'d':'a';
  if(next!==key){if(key)await page.keyboard.up(key);if(next)await page.keyboard.down(next);key=next;}await page.clock.runFor(100);
 }
 assert.ok(recovered);await page.screenshot({path:`docs/prototypes/stick-balance/QA/recovery-${run}-saved.png`});if(key)await page.keyboard.up(key);
 results.push({danger,recovered:await page.evaluate(()=>window.__stick)});await page.clock.runFor(12000);
}
await browser.close();writeFileSync('docs/prototypes/stick-balance/QA/RECOVERY.json',JSON.stringify(results,null,2));console.log('PASS recovery from both signs beyond .56rad via A/D');
