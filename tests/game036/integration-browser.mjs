// Compiled site, ordinary DOM input and read-only local saves; no model/time injection.
import {chromium} from '@playwright/test';import{mkdir,writeFile}from'node:fs/promises';import assert from'node:assert/strict';
const section=process.env.GAME036_SECTION||'all';
const base=process.env.GAME036_BASE||'http://127.0.0.1:4981',out=process.env.GAME036_REPORT;if(!out)throw Error('GAME036_REPORT required');await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),rows=[];
async function context(viewport,denied=true){const c=await b.newContext({viewport,hasTouch:viewport.width<1000,isMobile:viewport.width<1000});if(denied)await c.addInitScript(()=>localStorage.setItem('game100garage:analytics-consent:v1','denied'));await c.route('**/*',r=>r.request().url().startsWith(base)&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());return c;}
try{
if(['all','layout'].includes(section))for(const[width,height]of[[390,844],[375,667],[320,568],[844,390],[932,430],[667,375],[1440,900]]){
 const r={name:`layout-${width}x${height}`,errors:[]},c=await context({width,height}),p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));
 try{await p.goto(base+'/game036.html');await p.waitForTimeout(500);await p.locator('#play').click();
 r.document=await p.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,scrollY}));assert(r.document.width<=width&&r.document.height<=height+1,JSON.stringify(r.document));
 r.board=await p.locator('.well').boundingBox();r.pad=await p.locator('.pad').boundingBox();r.settings=await p.locator('#analytics-settings-host #settings').boundingBox();
 for(const q of[r.board,r.pad,r.settings])assert(q&&q.x>=0&&q.y>=0&&q.x+q.width<=width+1&&q.y+q.height<=height+1);
 if(width<height&&width<=650)assert(Math.abs(r.board.x+r.board.width/2-width/2)<1,'portrait board centered');
 r.buttons={};for(const id of['left','ccw','drop','cw','right']){const q=await p.locator('#'+id).boundingBox();assert(q.width>=44&&q.height>=44);r.buttons[id]=q;}
 await p.screenshot({path:out+`/${width}x${height}-play.png`});await p.locator('#analytics-settings-host #settings').click();assert(await p.locator('#analytics-settings-host #deny').isVisible());r.settingsUsable=true;r.pass=r.errors.length===0;
 }catch(e){r.pass=false;r.failure=e.message;}finally{rows.push(r);await c.close();console.log(JSON.stringify({name:r.name,pass:r.pass,failure:r.failure}));}}
// The same Enter/Space must activate the focused pad, not the board's drop shortcut.
if(['all','flow'].includes(section)){
 const r={name:'keyboard-save-result-portal',errors:[]},c=await context({width:1440,height:900}),p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('web-mini-arcade:v1:game036:state')));
 try{await p.goto(base+'/game036.html');assert.equal(await p.evaluate(()=>typeof window.__game036),'undefined','compiled build contains no DEV model hook');await p.waitForTimeout(500);
 await p.locator('#practice').click();await p.locator('#drop').click();await p.waitForTimeout(500);await p.screenshot({path:out+'/actual-practice-frame.png'});await p.getByRole('heading',{name:'2連鎖、できました！',exact:true}).waitFor();assert.equal((await save()).runs,0);assert.equal((await save()).best,0);r.practiceExcluded=true;
 await p.waitForTimeout(500);await p.locator('#play').click();await p.locator('#left').focus();await p.keyboard.press('Enter');await p.locator('#pause').click();let s=await save();assert.equal(s.snapshot.piece.x,1);assert.equal(s.snapshot.pieces,0);r.enterMovesLeft=true;
 await p.waitForTimeout(500);await p.locator('#resume').click();await p.locator('#cw').focus();await p.keyboard.press('Space');await p.locator('#pause').click();s=await save();assert.equal(s.snapshot.piece.rot,1);assert.equal(s.snapshot.pieces,0);r.spaceRotates=true;
 const board=s.snapshot.board;await p.reload();assert.equal(await p.locator('#app').getAttribute('data-state'),'paused');assert.deepEqual((await save()).snapshot.board,board);await p.waitForTimeout(500);await p.locator('#resume').click();
 // Stack using real Space inputs until the actual game ends; no score is injected.
 for(let i=0;i<180&&await p.locator('#app').getAttribute('data-state')==='play';i++){await p.keyboard.press('Space');await p.waitForTimeout(90);}
 assert.equal(await p.locator('#app').getAttribute('data-state'),'result');s=await save();assert.equal(s.runs,1);assert.equal(s.snapshot,null);r.score=s.best;await p.screenshot({path:out+'/actual-result.png'});
 await p.waitForTimeout(500);await p.locator('#menu-portal').click();await p.waitForURL('**/index.html');const card=p.locator('[data-game-id="game036"]');await card.waitFor();await p.waitForFunction(()=>document.querySelector('[data-game-id="game036"] .card-records dd')?.textContent!=='読み込み中');
 assert.equal(await p.locator('.game-card').count(),27);assert((await card.innerText()).includes('027'));assert.equal(await card.locator('.card-records dd').first().innerText(),s.best.toLocaleString()+' 点');assert.equal(await card.locator('.leaderboard-button').count(),0);assert((await card.innerText()).includes('全体比較なし'));await p.reload();assert.equal(await card.locator('.card-records dd').first().innerText(),s.best.toLocaleString()+' 点');r.confirmedBestSurvivesReload=true;await p.screenshot({path:out+'/portal.png'});assert.equal(r.errors.length,0);r.pass=true;
 }catch(e){r.pass=false;r.failure=e.message;await p.screenshot({path:out+'/input-failure.png'}).catch(()=>{});}finally{rows.push(r);await c.close();console.log(JSON.stringify(r));}}
if(['all','consent'].includes(section))for(const choice of['allow','deny','later','privacy'].filter(choice=>!process.env.GAME036_CONSENT_CHOICE||choice===process.env.GAME036_CONSENT_CHOICE)){
 const r={name:'fresh-consent-'+choice},c=await context({width:390,height:844},false),p=await c.newPage();
 try{await p.goto(base+'/game036.html');const h=p.locator('#analytics-settings-host');if(choice==='privacy'){await h.locator('.panel a').click();await p.waitForURL('**/privacy.html');await p.goBack();await p.locator('#app[data-state="title"]').waitFor();}
 else{await h.locator('#'+(choice==='allow'?'grant':choice)).click();await p.waitForTimeout(500);await p.locator('#play').click();assert.equal(await p.locator('#app').getAttribute('data-state'),'play');if(choice==='allow'){await h.locator('#settings').click();await h.locator('#deny').click();assert.equal(await p.evaluate(()=>localStorage.getItem('game100garage:analytics-consent:v1')),'denied');}}
 r.pass=true;}catch(e){r.pass=false;r.failure=e.message;}finally{rows.push(r);await c.close();console.log(JSON.stringify(r));}}
}finally{await b.close();await writeFile(out+'/RESULTS.json',JSON.stringify({base,at:new Date().toISOString(),rows},null,2)+'\n');}
if(rows.some(r=>!r.pass))process.exitCode=1;
