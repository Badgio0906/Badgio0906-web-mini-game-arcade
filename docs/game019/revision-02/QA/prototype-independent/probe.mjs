import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out=process.env.GAME019_PROTO_OUT??'docs/game019/revision-02/QA/prototype-independent';
const url=process.env.GAME019_PROTO_URL??'http://127.0.0.1:5196/tests/game019/prototype.html';
const sources=['src/games/game019/ChargeRun.ts','src/games/game019/chargeTypes.ts','src/games/game019/ChargeInput.ts','src/games/game019/ChargeBoard.ts','src/games/game019/prototypeLevel.ts','src/games/game019/prototypeMain.ts','tests/game019/prototype.html','src/games/game019/frogPixels.ts'];
const hashes=async()=>Object.fromEntries(await Promise.all(sources.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const before=await hashes(); const started=new Date().toISOString(); await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}); const records=[];
const read=p=>p.evaluate(()=>window.__chargeTrial);
async function until(p,fn,label,limit=10000){const end=Date.now()+limit;let s;while(Date.now()<end){s=await read(p);if(fn(s))return s;await p.waitForTimeout(12);}throw Error(label+': '+JSON.stringify(s.run));}
class Input{
 constructor(p,t){this.p=p;this.t=t;this.contacts=new Map();this.direction=0;}
 async contact(id,sel){this.cdp??=await this.p.context().newCDPSession(this.p);if(sel){const b=await this.p.locator(sel).boundingBox();assert.ok(b);this.contacts.set(id,{id,x:b.x+b.width/2,y:b.y+b.height/2});await this.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...this.contacts.values()]});}else{const old=this.contacts.get(id);this.contacts.delete(id);if(old)await this.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[old]});}}
 async dir(d){if(d===this.direction)return;if(this.t){if(this.direction)await this.contact(2,null);if(d)await this.contact(2,d<0?'#left-button':'#right-button');}else{if(this.direction)await this.p.keyboard.up(this.direction<0?'ArrowLeft':'ArrowRight');if(d)await this.p.keyboard.down(d<0?'ArrowLeft':'ArrowRight');}this.direction=d;}
 async down(){if(this.t)await this.contact(1,'#jump-button');else await this.p.keyboard.down('Space');}
 async up(){if(this.t)await this.contact(1,null);else await this.p.keyboard.up('Space');}
 async jump(ms,d){await this.dir(d);await this.down();await this.p.waitForTimeout(Math.max(25,ms-(this.t?30:0)));await this.up();await until(this.p,s=>s.run.phase!=='charging','release launch');await this.dir(0);const landed=await until(this.p,s=>s.run.player.grounded||s.run.clear,'landing');return {requestedMs:ms,requestedDirection:d,event:landed.events.filter(e=>e.type==='jump').at(-1),end:landed.run,events:landed.events};}
 async close(){await this.dir(0);await this.up();await this.cdp?.detach();}
}
async function restart(p,t){await (t?p.locator('#restart-button').tap():p.locator('#restart-button').click());await until(p,s=>s.run.jumps===0&&s.run.phase==='grounded','reset');await p.locator('#trial-canvas').focus();}
try{for(const profile of [{name:'desktop',width:1440,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}]){
 const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.touch,isMobile:profile.touch});const p=await ctx.newPage();const r={profile,flat:[],air:[],route:[],failures:[],maxUp:[],errors:[]};records.push(r);p.on('pageerror',e=>r.errors.push(e.message));p.on('console',e=>{if(e.type()==='error'&&!e.location().url.endsWith('/favicon.ico'))r.errors.push(e.text());});const input=new Input(p,profile.touch);const click=s=>profile.touch?p.locator(s).tap():p.locator(s).click();const shot=n=>p.screenshot({path:`${out}/${profile.name}-${n}.png`});
 try{
 await p.goto(url);await p.locator('#trial-canvas').focus();await shot('flat-start');
 r.geometry=await p.evaluate(()=>['#trial-canvas','#left-button','#jump-button','#right-button'].map(selector=>{const q=document.querySelector(selector).getBoundingClientRect();return{selector,x:q.x,y:q.y,w:q.width,h:q.height,right:q.right,bottom:q.bottom,vw:innerWidth,vh:innerHeight};}));
 for(const q of r.geometry){assert.ok(q.x>=0&&q.y>=0&&q.right<=q.vw+1&&q.bottom<=q.vh+1);if(q.selector.includes('button'))assert.ok(q.w>=44&&q.h>=44);}
 for(const ms of [80,400,700]){await restart(p,profile.touch);const j=await input.jump(ms,1);r.flat.push(j);}
 assert.ok(r.flat[0].end.maxHeight<1.5);assert.ok(r.flat[1].end.maxHeight>3&&r.flat[1].end.maxHeight<6);assert.ok(r.flat[2].end.maxHeight>8.5);assert.ok(r.flat[0].end.player.x>195&&r.flat[0].end.player.x<231);
 // Holding well past maximum never auto-launches; changing direction while charging sets release direction.
 await restart(p,profile.touch);await input.dir(-1);await input.down();await until(p,s=>s.run.chargeMs>=700,'max hold');await p.waitForTimeout(250);r.maxHeld=(await read(p)).run;assert.equal(r.maxHeld.jumps,0);assert.equal(r.maxHeld.phase,'charging');await input.dir(1);await input.up();const switched=await until(p,s=>s.run.jumps===1,'switch release');assert.equal(switched.events.filter(e=>e.type==='jump').at(-1).data.jump_direction,1);await input.dir(0);await until(p,s=>s.run.player.grounded,'switch land');r.releaseDirection=switched.events.filter(e=>e.type==='jump').at(-1);
 // Compare zero vs weak assist on the same flat jump, steering opposite only after takeoff.
 for(const weak of [false,true]){if((await read(p)).weak!==weak)await click('#assist-button');await restart(p,profile.touch);await input.dir(1);await input.down();await p.waitForTimeout(400);await input.up();await input.dir(0);const launch=await until(p,s=>s.run.phase==='rising','assist launch');await input.dir(-1);await p.waitForTimeout(250);const mid=await read(p);await shot(weak?'weak-assist-flight':'zero-assist-flight');await input.dir(0);const end=await until(p,s=>s.run.player.grounded,'assist land');r.air.push({weak,launch:launch.run,mid:mid.run,end:end.run});if(!weak)assert.equal(mid.run.player.vx,launch.run.player.vx);else assert.ok(mid.run.player.vx<launch.run.player.vx-4);}
 if((await read(p)).weak)await click('#assist-button');await click('#stage-button');await shot('stage-start');
 const route=[[450,-1,'first'],[450,1,'brick'],[375,-1,'under-beam'],[450,1,'takeoff'],[80,1,'takeoff'],[700,-1,'root-top']];
 // First try an insufficient charge and demonstrate learning via a changed charge, same stage.
 const tooShort=await input.jump(250,-1);r.failures.push({case:'first-too-short',...tooShort});assert.equal(tooShort.end.player.ledgeId,'bottom');
 await restart(p,profile.touch);const first=await input.jump(450,-1);assert.equal(first.end.player.ledgeId,'first');r.route.push(first);await shot('first-corrected');
 for(const [ms,d,id]of route.slice(1)){const j=await input.jump(ms,d);r.route.push(j);assert.equal(j.end.player.ledgeId,id,`route ${id}`);await shot('route-'+id+'-'+ms);}
 assert.ok(r.route.at(-1).end.clear);
 // Re-run to the beam and compare maximum charge against controlled medium.
 await restart(p,profile.touch);for(const [ms,d]of route.slice(0,2))await input.jump(ms,d);const maxBeam=await input.jump(700,-1);r.failures.push({case:'maximum-at-low-beam',...maxBeam});assert.ok(maxBeam.events.some(e=>e.type==='ceiling_bump'));assert.ok(!maxBeam.end.clear);
 // At takeoff omit the short reposition: visible sideways failure should lose multiple sections.
 await restart(p,profile.touch);for(const [ms,d]of route.slice(0,4))await input.jump(ms,d);const noPosition=await input.jump(700,-1);r.failures.push({case:'omit-position-adjustment',...noPosition});assert.ok(noPosition.end.lastLanding.loss>=10);assert.ok(noPosition.end.alive);await shot('deep-fall');
 // Different failure at an earlier jump returns to a catch, not the bottom.
 await restart(p,profile.touch);for(const [ms,d]of route.slice(0,4))await input.jump(ms,d);const shortAtTop=await input.jump(350,-1);r.failures.push({case:'short-at-top',...shortAtTop});await shot('short-fall');assert.ok(shortAtTop.end.alive);
 await restart(p,profile.touch);for(let k=0;k<8;k++){const j=await input.jump(700,0);r.maxUp.push(j);assert.ok(!j.end.clear);}await shot('max-up-stalls');assert.ok(Math.max(...r.maxUp.map(j=>j.end.height))<13.9);
 // A second usable timing establishes a band, rather than a hard-coded single millisecond answer.
 await restart(p,profile.touch);const alternative=await input.jump(425,-1);r.alternative=alternative;assert.equal(alternative.end.player.ledgeId,'first');
 assert.deepEqual(r.errors,[]);r.status='PASS';
 }catch(e){r.status='FAIL';r.error=e.stack;process.exitCode=1;r.last=await read(p).catch(()=>null);await shot('FAIL').catch(()=>{});}finally{await input.close().catch(()=>{});await ctx.close();console.log(profile.name,r.status,r.error?.slice(0,160)??'');await writeFile(`${out}/report.json`,JSON.stringify({started,url,sourceBefore:before,records,limits:'Native input with read-only diagnostics. Technical/design evaluation; no human fun or physical device test.'},null,2));}
 }}finally{await browser.close();const after=await hashes();await writeFile(`${out}/SOURCE_SUMMARY.json`,JSON.stringify({started,finished:new Date().toISOString(),before,after,stable:JSON.stringify(before)===JSON.stringify(after)},null,2));assert.deepEqual(after,before);}
