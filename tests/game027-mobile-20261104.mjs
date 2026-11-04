import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const reports=[];
try {
for (const [width,height] of [[390,844],[320,720],[844,390],[1280,900]]) {
 const page=await browser.newPage({viewport:{width,height}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5178/game027.html');await page.getByRole('button',{name:'許可しない',exact:true}).click();await page.locator('#play-button').click();
 const before=await page.evaluate(()=>window.__game027.angle);
 const rect=await page.locator('#table').boundingBox();
 await page.mouse.move(rect.x+rect.width*.7,rect.y+rect.height*.5);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.35,rect.y+rect.height*.2);await page.mouse.up();
 const state=await page.evaluate(()=>({angle:window.__game027.angle,challenge:window.__game027.challenge,overflow:document.documentElement.scrollWidth>innerWidth,power:document.getElementById('power').getBoundingClientRect().toJSON(),shot:document.getElementById('shoot-button').getBoundingClientRect().toJSON()}));
 if(state.angle===before||!state.challenge||state.overflow||state.power.height<44||state.shot.right>width||state.shot.bottom>height)throw Error(`027 layout/drag ${width}: ${JSON.stringify(state)}`);
 await page.screenshot({path:`docs/game027/mobile-20261104/QA/play-${width}.png`});
 await page.locator('#pause-button').click(); await page.reload();await page.locator('#resume-button').waitFor();await page.locator('#resume-button').click();
 if(!(await page.evaluate(()=>window.__game027.challenge)))throw Error('challenge resume lost');
 await page.locator('#pause-button').click();await page.locator('#title-button').click();await page.locator('#mode-choice').selectOption('cpu');await page.locator('#play-button').click();
 if(await page.evaluate(()=>window.__game027.challenge))throw Error('standard unexpectedly challenge');
 if(errors.length)throw Error(errors.join('\n'));reports.push({game:'027',width,height,drag:true,challengeResume:true,standardMode:true,...state,errors});await page.close();
}
for(const [width,height] of [[390,844],[320,720],[844,390],[1280,900]]){
 const page=await browser.newPage({viewport:{width,height}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5179/game051.html');await page.locator('#play').click();
 for(let step=1;step<=3;step++){if(!(await page.locator('.guide-card h2').textContent()).includes(`${step} / 3`))throw Error('missing guide step');if(step<3)await page.locator('#guide-next').click();}
 await page.screenshot({path:`docs/game051/mobile-20261104/QA/guide-${width}.png`});
 await page.locator('#guide-play').click();
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,stage:document.querySelector('canvas').getBoundingClientRect().toJSON(),pads:[...document.querySelectorAll('.pads button')].map(el=>el.getBoundingClientRect().toJSON())}));
 if(state.overflow||state.pads.some(p=>p.height<44||p.right>width||p.bottom>height))throw Error(`051 layout ${width}: ${JSON.stringify(state)}`);
 await page.screenshot({path:`docs/game051/mobile-20261104/QA/play-${width}.png`});
 await page.locator('#pause').click();await page.locator('#resume').click();
 if(errors.length)throw Error(errors.join('\n'));reports.push({game:'051',width,height,onboardingSteps:3,...state,errors});await page.close();
}
writeFileSync('docs/game027/mobile-20261104/QA/browser.json',JSON.stringify(reports.filter(r=>r.game==='027'),null,2));writeFileSync('docs/game051/mobile-20261104/QA/browser.json',JSON.stringify(reports.filter(r=>r.game==='051'),null,2));
console.log(JSON.stringify(reports.map(({game,width,height})=>({game,width,height,passed:true}))));
} finally {await browser.close();}
