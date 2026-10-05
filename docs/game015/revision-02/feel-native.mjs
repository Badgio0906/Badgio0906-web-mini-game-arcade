import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out='docs/game015/revision-02/review-artifacts/feel';
await mkdir(out,{recursive:true});
const files=execFileSync('rg',['--files','src','public','game015.html']).toString().trim().split('\n').sort();
async function freeze(){const rows=[];for(const path of files)rows.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});return {rows,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};}
const before=await freeze();await writeFile(out+'/SOURCE_FREEZE.json',JSON.stringify(before,null,2));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={started:new Date().toISOString(),before:before.sha256,profiles:[]};
const read=page=>page.evaluate(()=>({state:window.__arcadeDebug.state(),s:window.__arcadeDebug.snapshot(),practice:window.__tutorialDebug?.snapshot()?.practice,events:window.__arcadeDebug.telemetry()}));
async function wait(page,test,label,ms=10000){const end=Date.now()+ms;while(Date.now()<end){const r=await read(page);if(test(r))return r;await page.waitForTimeout(30);}throw Error(label);}
for(const mobile of [false,true]){
const name=mobile?'phone':'desktop',context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile}),page=await context.newPage();
const record={name,errors:[],practice:[],runs:[]};report.profiles.push(record);
page.on('pageerror',e=>record.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.errors.push(m.text())});
const click=async selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
const capture=async label=>page.screenshot({path:out+'/'+name+'-'+label+'.png'});
let direction=0,point=null,training=false;const cdp=mobile?await context.newCDPSession(page):null;
async function steer(dir){if(dir===direction)return;if(mobile){if(point)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point]});point=null;if(dir){const selector=training?'#arcade-training [data-practice-action="'+(dir>0?'right':'left')+'"]':dir>0?'#right-button':'#left-button';const b=await page.locator(selector).boundingBox();point={x:b.x+b.width/2,y:b.y+b.height/2,id:1};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});}}else{if(direction)await page.keyboard.up(direction>0?'ArrowRight':'ArrowLeft');if(dir)await page.keyboard.down(dir>0?'ArrowRight':'ArrowLeft');}direction=dir;}
try{
await page.goto('http://127.0.0.1:5181/game015.html');await capture('title');await click('#play-button');await click('#tutorial-practice-button');training=true;
for(const step of [0,1,2]){await wait(page,r=>r.practice?.step===step,'practice step');await click('#arcade-training [data-practice-action="action"]');if(step)await steer(step===1?1:-1);await wait(page,r=>r.practice?.step===step&&r.practice.fall.phase==='landed','practice landing');await steer(0);record.practice.push((await read(page)).practice.fall);await capture('practice-'+step);await wait(page,r=>r.practice?.step>step,'practice next');}
await wait(page,r=>r.practice?.fall?.cause==='scroll','ghost death');await capture('practice-scroll');await page.locator('#tutorial-start-button').waitFor();await click('#tutorial-start-button');training=false;
await wait(page,r=>r.state==='playing','start');const idleStart=(await read(page)).s;await wait(page,r=>r.state==='result','idle ceiling');record.runs.push({mode:'idle',start:idleStart,end:await read(page)});await capture('idle-result');
const retryAt=Date.now();await click('#retry-button');await wait(page,r=>r.state==='playing','retry');record.retryWallMs=Date.now()-retryAt;
let lastGround=null;const centerEnd=Date.now()+20000;while(Date.now()<centerEnd){const r=await read(page);if(r.state==='result')break;if(r.s.player.grounded&&r.s.player.platformId!==lastGround){lastGround=r.s.player.platformId;await click('#drop-button');}await page.waitForTimeout(35);}
record.runs.push({mode:'center-only-drop',end:await read(page)});await capture('center-result');
if((await read(page)).state!=='result')throw Error('center-only did not fail');await click('#retry-button');await wait(page,r=>r.state==='playing','safe retry');
const samples=[];let lastPlatform=null,lastCaptured=null;const deadline=Date.now()+40000;
while(Date.now()<deadline){const r=await read(page),s=r.s;if(r.state==='result')throw Error('guided safe route ended '+JSON.stringify(s));if(s.depth>=85)break;const p=s.player,current=s.platforms.find(v=>v.id===p.platformId),next=s.platforms.filter(v=>v.route&&!v.gone&&v.y>p.y+.01).sort((a,b)=>a.y-b.y)[0];if(!next)throw Error('no next');const target=p.grounded?current.x+current.width/2:next.x+next.width/2,command=(target-p.x)*5-p.vx*1.8;await steer(command>4?1:command<-4?-1:0);if(p.grounded&&Math.abs(target-p.x)<6&&Math.abs(p.vx)<10&&!p.stunRemaining){await steer(0);samples.push({time:s.time,depth:s.depth,x:p.x,nextX:next.x+next.width/2,pattern:next.pattern,top:s.topRemaining,speed:s.scrollSpeed});await click('#drop-button');}if(s.lastLanding&&lastPlatform!==s.lastLanding.platformId){lastPlatform=s.lastLanding.platformId;samples.push({landing:s.lastLanding});}if(s.phase==='falling'&&s.depth>15&&lastCaptured===null){await capture('falling');lastCaptured=s.time;}await page.waitForTimeout(25);}
await steer(0);const safe=await read(page);await capture('safe-85m');await click('#pause-button');const paused=await read(page);await page.waitForTimeout(300);const pausedAfter=await read(page);record.pauseUnchanged=JSON.stringify(paused.s)===JSON.stringify(pausedAfter.s);await capture('pause');await click('#resume-button');await wait(page,r=>r.state==='result','stop at depth death',15000);record.runs.push({mode:'guided-then-stop',safe:safe.s,samples,end:await read(page)});await capture('safe-stop-result');
await click('#retry-button');await wait(page,r=>r.state==='playing','risky retry');await steer(1);await click('#drop-button');await wait(page,r=>r.state==='result','rightward risky death',12000);await steer(0);record.runs.push({mode:'unbraked-right-drop',end:await read(page)});await capture('risky-result');
record.status='PASS';
}catch(e){record.status='FAIL';record.error=e.message;await capture('FAIL').catch(()=>{});}finally{await steer(0).catch(()=>{});await cdp?.detach();await context.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(name,record.status,record.error??'');}
}
await browser.close();const after=await freeze();report.after=after.sha256;report.changedFiles=after.rows.filter((r,i)=>r.sha256!==before.rows[i]?.sha256).map(r=>r.path);report.finished=new Date().toISOString();report.limits='Native keyboard/click/touch and readonly diagnostics; guided route is oracle input, not human fun/reflex, physical device or sound evaluation.';await writeFile(out+'/report.json',JSON.stringify(report,null,2));
