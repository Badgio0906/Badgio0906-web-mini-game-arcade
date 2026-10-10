import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const base=process.env.GAME032_QA_URL??'http://127.0.0.1:4173';
const out=process.env.GAME032_QA_OUT;
if(!out)throw Error('Set unique GAME032_QA_OUT; existing evidence must not be overwritten');
await mkdir(out,{recursive:false});
const hashes={};for(const file of ['src/games/game032/main.ts','src/games/game032/FishingModel.ts','src/games/game032/Save.ts','src/games/game032/Projection.ts','src/games/game032/style.css','src/games/game032/RiverSound.ts','game032.html'])hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const report={kind:'independent browser automation; virtual active clock; synthetic QA, not human/physical device',url:base,source_hashes:hashes,started_at:new Date().toISOString(),checks:[],errors:[],post_attempts:0,viewport_cases:[]};
const check=(condition,name,data={})=>{report.checks.push({name,passed:!!condition,...data});if(!condition)throw Error(name);};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
let page,current='startup',touch;
async function screenshot(name){await page.screenshot({path:path.join(out,`${current}-${name}.png`),fullPage:true});}
async function phase(){return page.locator('#river').getAttribute('data-phase');}
async function waitPhase(target,seconds=45){for(let n=0;n<seconds*10;n++){if(await phase()===target)return;await page.clock.runFor(100);}throw Error(`waitPhase ${target}: ${await phase()}`);}
async function tapKey(key){await page.keyboard.down(key);await page.keyboard.up(key);}
async function actionHold(down){if(!touch){if(down)await page.keyboard.down('Space');else await page.keyboard.up('Space');return;}if(down){await page.locator('#action').scrollIntoViewIfNeeded();const r=await page.locator('#action').boundingBox();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});}else await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function cast(){await page.locator('#river').focus();await actionHold(true);await page.clock.runFor(180);check(await phase()==='charging',`${current}: charge from fresh input`);await actionHold(false);check(await phase()==='casting',`${current}: release casts`);}
async function seekBite(){for(let attempt=1;attempt<=6;attempt++){await cast();for(let n=0;n<150;n++){const p=await phase();if(p==='bite')return;if(p==='failed'){report.checks.push({name:`${current}: ordinary cast attempt ${attempt} returned no catch`,passed:true,status:await page.locator('#status').innerText()});await screenshot(`cast-no-catch-${attempt}`);await waitPhase('idle',5);break;}await page.clock.runFor(100);}}throw Error('No bite in six ordinary casts');}
async function fight(){let holding=false;for(let n=0;n<500&&await phase()==='fight';n++){const pulling=await page.locator('#river').getAttribute('data-pulling')==='true';if(!pulling&&!holding){await actionHold(true);holding=true;}if(pulling&&holding){await actionHold(false);holding=false;}await page.clock.runFor(100);}if(holding)await actionHold(false);return await phase();}
try {
for(const viewport of [{name:'pc',width:1280,height:900},{name:'phone',width:390,height:844},{name:'small',width:320,height:740},{name:'landscape',width:844,height:390}]){
 current=viewport.name;const context=await browser.newContext({viewport,hasTouch:viewport.name!=='pc'});
 await context.route('**/*',async route=>{if(route.request().method()==='POST'){report.post_attempts++;await route.abort();}else await route.continue();});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push({viewport:current,message:e.message}));await page.goto(`${base}/game032.html`);await page.locator('#play').waitFor();
 const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();
 await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);await page.clock.install();touch=current==='pc'?undefined:await context.newCDPSession(page);await screenshot('title');
 await page.locator('#practice').click();check(await page.locator('#app').getAttribute('data-state')==='practice',`${current}: optional practice starts`);
 await screenshot('practice');
 await page.locator('#river').focus();await page.keyboard.down('Space');await page.clock.runFor(200);await tapKey('Escape');
 check(await page.locator('#app').getAttribute('data-state')==='paused',`${current}: Escape pauses held charge`);
 const time=await page.locator('#time').innerText();await page.clock.runFor(5000);check(await page.locator('#time').innerText()===time,`${current}: pause freezes clock`);
 await page.locator('#resume').click();await page.keyboard.up('Space');await page.clock.runFor(20);check(await phase()==='idle',`${current}: resume does not inherit held charge`);
 // DOM-dispatched cancellation is an explicit synthetic edge fixture, not a real finger test.
 await page.locator('#action').scrollIntoViewIfNeeded();const cancelRect=await page.locator('#action').boundingBox();await page.mouse.move(cancelRect.x+cancelRect.width/2,cancelRect.y+cancelRect.height/2);await page.mouse.down();await page.clock.runFor(120);
 await page.locator('#action').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',button:0,isPrimary:true});await page.mouse.up();await page.clock.runFor(20);
 check(await phase()==='idle',`${current}: canceled pointer cannot cast`);
 await seekBite();await screenshot('bite');await tapKey('Enter');
 check(await phase()==='fight',`${current}: Enter hooks during visible bite`);await screenshot('fight');
 const outcome=await fight();check(outcome==='landed',`${current}: release on pull / hold on calm lands`,{outcome});await screenshot('land');
 const practiceScore=Number(await page.locator('#score').innerText());check(practiceScore>0,`${current}: practice exercises real catch`);
 check(await page.evaluate(()=>localStorage.getItem('web-mini-arcade:v1:game032:best:standard:r1'))===null,`${current}: practice has no BEST write`);
 await page.locator('#pause').click();await page.locator('#pause-title').click();await page.locator('#play').click();
 check(await page.locator('#score').innerText()==='0',`${current}: practice score excluded from new standard`);
 check(await page.locator('#time').innerText()==='5:00',`${current}: standard starts five minutes`);await page.clock.runFor(50);
 check(!/:60$/.test(await page.locator('#time').innerText()),`${current}: countdown has valid seconds`);
 await screenshot('play');
 const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));check(overflow.scroll<=overflow.width,`${current}: no horizontal document overflow`,overflow);
 for(const id of ['left','right','action']){const rect=await page.locator(`#${id}`).boundingBox();check(rect&&rect.height>=44&&rect.width>=44,`${current}: ${id} target at least 44 CSS px`,{rect});}
 if(current==='pc'){
  await seekBite();await tapKey('Enter');check(await fight()==='landed','pc: standard catch');
  const standardScore=Number(await page.locator('#score').innerText());check(standardScore>0,'pc: successful standard has points');
  await page.clock.runFor(300000);check(await page.locator('#app').getAttribute('data-state')==='result','pc: five active minutes result');await screenshot('result');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game032:best:standard:r1')));check(saved.score===standardScore,'pc: completed BEST persisted exactly once',{score:saved.score});
  await page.locator('#again').click();check(await phase()==='idle'&&await page.locator('#score').innerText()==='0','pc: retry fresh run');
  await page.reload();await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);check((await page.locator('#best').innerText()).includes(String(standardScore)),'pc: reload retains completed BEST');
 }
 await page.locator('#portal').click();await page.waitForURL(/(?:index\.html|\/)$/);check(!page.url().includes('game032'),current+': Portal return');
 report.viewport_cases.push({viewport,passed:true});await context.close();
}
// Separate scripted-RNG display regression, explicitly synthetic rather than ordinary catch odds.
current='same-species-fixture';const fixtureContext=await browser.newContext({viewport:{width:1280,height:900}});
await fixtureContext.route('**/*',async route=>{if(route.request().method()==='POST'){report.post_attempts++;await route.abort();}else await route.continue();});
page=await fixtureContext.newPage();touch=undefined;await page.goto(`${base}/game032.html`);const fixtureDeny=page.getByRole('button',{name:'許可しない',exact:true});if(await fixtureDeny.count())await fixtureDeny.click();await page.waitForFunction(()=>!document.querySelector('#play')?.disabled);await page.clock.install();
await page.evaluate(()=>{let draw=0;const values=[0,0,0,.1,0,0,0,.9];Math.random=()=>values[draw++%values.length];});await page.locator('#practice').click();
const journals=[];for(let n=0;n<2;n++){if(n)await waitPhase('idle',3);await seekBite();await tapKey('Enter');check(await fight()==='landed',`fixture catch ${n+1} landed`);journals.push(await page.locator('#latest-fish').innerText());await screenshot(`catch-${n+1}`);}
check(journals[0].startsWith('オイカワ')&&journals[1].startsWith('オイカワ'),'scripted fixture catches same species');check(journals[0]!==journals[1],'same species different size journal refreshes',{journals});await fixtureContext.close();check(report.post_attempts===0,'all browser cases attempted zero POST');
}catch(e){report.failure={viewport:current,message:String(e.message)};if(page&&!page.isClosed()){await screenshot('failure');await writeFile(path.join(out,`${current}-failure-state.json`),JSON.stringify(await page.evaluate(()=>({url:location.href,state:document.querySelector('#app')?.getAttribute('data-state'),phase:document.querySelector('#river')?.getAttribute('data-phase'),time:document.querySelector('#time')?.textContent,status:document.querySelector('#status')?.textContent})),null,2));}process.exitCode=1;}
finally{report.finished_at=new Date().toISOString();report.success=!report.failure&&report.errors.length===0;await writeFile(path.join(out,'REPORT.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({output:out,passed:report.checks.filter(c=>c.passed).length,total:report.checks.length,success:report.success,failure:report.failure,post_attempts:report.post_attempts}));}
