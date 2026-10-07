import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../../', import.meta.url).pathname;
const origin = process.env.SHOE018_ORIGIN || 'http://127.0.0.1:5418';
const label = process.env.SHOE018_LABEL || 'local-capture';
const publicMode = origin.startsWith('https:');
const fixturesMode = !publicMode && !process.env.SHOE018_NO_FIXTURES;
const out = root + 'docs/game018/revision03/QA/' + label;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'], ...(publicMode ? {proxy:{server:process.env.HTTPS_PROXY}} : {}) });
const report = { origin, label, mode: fixturesMode ? 'exact-render-fixtures-plus-native-input' : 'native-input', profiles: [] };
try {
 for (const profile of [{name:'desktop',width:1365,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}]) {
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.touch,isMobile:profile.touch});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-07T04:00:00Z')});await page.clock.pauseAt(new Date('2026-10-07T04:00:01Z'));
  const input=async selector=>profile.touch?page.locator(selector).tap():page.locator(selector).click();
  const captures=[];
  const drawing=()=>page.evaluate(()=>{const cv=document.querySelector('#shoe-canvas'),p=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0,total=0;for(let i=3;i<p.length;i+=400){total++;if(p[i]===255)n++;}return {opaqueRatio:n/total,phase:document.querySelector('#app').dataset.phase};});
  const shot=async name=>{
   const before=await drawing();await page.clock.runFor(48);let painted=await drawing();
   if(painted.opaqueRatio<.95){await page.clock.runFor(48);painted=await drawing();}
   assert(painted.opaqueRatio>.95,'painted canvas '+name);
   await page.screenshot({path:out+'/'+profile.name+'-'+name+'.png'});captures.push({name,before,painted});
  };
  const load=async()=>{await page.goto(origin+'/game018.html');await page.clock.runFor(32);const deny=page.getByRole('button',{name:'許可しない',exact:true});if(await deny.count())await deny.click();await input('#play-button');await input('#start-button');};
  await load();await page.clock.runFor(1400);await shot('native-angle85');await input('#control-button');await page.clock.runFor(720);await shot('native-spin');
  if(fixturesMode){
   await page.evaluate(async()=>{const {ShoeBoard}=await import('/src/games/game018/ShoeBoard.ts');window.__fixtureBoard=new ShoeBoard(document.querySelector('#shoe-canvas'));});
   await page.clock.runFor(32);
   const fixtures=[... [5,45,85].map(angle=>({name:'angle'+angle,phase:'angle',angle,spin:0})),... [1,0,-1].map(spin=>({name:'spin'+(spin>0?'left':spin<0?'right':'neutral'),phase:'spin',angle:45,spin})),{name:'spin-lock',phase:'spin-lock',angle:45,spin:-1},{name:'power',phase:'power',angle:45,spin:-1}, {name:'kick-release',phase:'kick',angle:85,spin:1}];
   for(const fixture of fixtures){
    await page.evaluate(async fixture=>{
     const {ShoeRun}=await import('/src/games/game018/ShoeRun.ts');
     const run=new ShoeRun();run.start(0);Object.assign(run,{phase:fixture.phase,angle:fixture.angle,spin:fixture.spin,power:55,time:fixture.phase==='kick'?.7:2});
     run.locked={angle:fixture.phase==='angle'?null:fixture.angle,spin:['spin','angle'].includes(fixture.phase)?null:fixture.spin,power:fixture.phase==='kick'?80:null};
     if(fixture.phase==='kick'){run.phaseStart=0;run.phaseDuration=1;}
     window.__fixtureBoard.render(run,2000,{reducedMotion:true});
    },fixture);
    await page.locator('#shoe-canvas').screenshot({path:out+'/'+profile.name+'-'+fixture.name+'.png'});
   }
   await page.evaluate(()=>{window.__fixtureBoard.destroy();delete window.__fixtureBoard;});
  }
  await load();await page.clock.runFor(700);if(!publicMode&&!profile.touch)await page.keyboard.press('Space');else await input('#control-button');await page.clock.runFor(720);if(!publicMode&&!profile.touch)await page.keyboard.press('Enter');else await input('#control-button');await page.clock.runFor(320);await shot('native-power');
  await page.clock.runFor(300);await input('#control-button');await page.clock.runFor(400);await shot('native-kick');await page.clock.runFor(500);assert.equal(await page.locator('#app').getAttribute('data-phase'),'flight');await shot('native-flight');
  for(let i=0;i<80 && await page.locator('#app').getAttribute('data-state')!=='result';i++)await page.clock.runFor(1000);
  assert.equal(await page.locator('#app').getAttribute('data-state'),'result');await shot('native-result');await input('#retry-button');await page.clock.runFor(32);assert.equal(await page.locator('#app').getAttribute('data-phase'),'angle');await shot('native-retry');
  const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight}));assert(geometry.scrollWidth<=geometry.width+1);assert.deepEqual(errors,[]);
  report.profiles.push({input:profile.touch?'tap':publicMode?'click':'click + Space + Enter',name:profile.name,status:'PASS',errors,geometry,captures,fixtures:fixturesMode?9:0,native:['angle85','spin','power','kick','flight','result','retry']});await context.close();console.log(label,profile.name,'PASS');
 }
} finally {await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
