import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const output = 'docs/game017/review-artifacts/feel';
await mkdir(output, { recursive: true });
const started = new Date().toISOString();
const freeze = JSON.parse(await readFile('docs/game017/SOURCE_FREEZE.json', 'utf8'));
async function sourceAudit() {
  const changed = [];
  for (const [path, expected] of Object.entries(freeze.files)) {
    const actual = createHash('sha256').update(await readFile(path)).digest('hex');
    if (actual !== expected) changed.push({ path, expected, actual });
  }
  return { sourceHash: freeze.source_hash, checkedFiles: Object.keys(freeze.files).length, changed };
}
const before = await sourceAudit();
assert.equal(before.changed.length, 0, 'review source differs from final freeze');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const records = [];
const read = page => page.evaluate(() => { const d = window.__arcadeDebug; return { state: d.state(), snapshot: d.snapshot(), inspection: d.inspection(), events: d.telemetry() }; });
async function raf(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function until(page, predicate, label, ms = 10000) {
  const end = Date.now() + ms; let last;
  while (Date.now() < end) { last = await read(page); if (predicate(last)) return last; await page.waitForTimeout(15); }
  throw Error(label + ': ' + JSON.stringify(last.snapshot));
}
async function coordinates(page, point) {
  return page.evaluate(point => { const canvas = document.getElementById('rain-canvas'), b = canvas.getBoundingClientRect(), h = canvas.height, scale = Math.min(b.width / 1000, b.height / h); return { x: b.left + (b.width - 1000 * scale) / 2 + (58 + point.x * .884) * scale, y: b.top + (b.height - h * scale) / 2 + (116 + point.z * ((h - 212) / 600)) * scale }; }, point);
}
function segmentDistance(p, a, b) { const dx=b.x-a.x,dz=b.z-a.z, l=dx*dx+dz*dz, t=l ? Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0; return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz); }
function pathDistance(p,path) { return Math.min(...path.slice(1).map((b,i)=>segmentDistance(p,path[i],b))); }
async function drag(page, touch, path, midpointCapture) {
  await raf(page); const points = [];
  for (const p of path) points.push(await coordinates(page,p));
  assert.ok(points.length >= 3, 'touch gesture requires at least two moves');
  const client = touch ? await page.context().newCDPSession(page) : null;
  let midpoint;
  try {
    if (touch) await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...points[0],id:7}]});
    else { await page.mouse.move(points[0].x,points[0].y); await page.mouse.down(); }
    for (let i=1;i<points.length;i++) {
      const p=points[i];
      if (touch) await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:7}]});
      else await page.mouse.move(p.x,p.y);
      if (i===Math.floor(points.length/2)) { midpoint=await read(page); if(midpointCapture) await midpointCapture(); }
    }
    if (touch) await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); else await page.mouse.up();
  } finally { if(client) await client.detach(); }
  return midpoint;
}
let failure = false;
try {
  for(const profile of [{name:'desktop',width:1440,height:900,touch:false},{name:'phone',width:390,height:844,touch:true}]) {
    const context = await browser.newContext({ viewport:{width:profile.width,height:profile.height},hasTouch:profile.touch,isMobile:profile.touch });
    const page = await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());}); page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    const record={profile,captures:[],practice:{},rounds:[]};
    const button=async id=>profile.touch?page.locator(id).tap():page.locator(id).click();
    const capture=async name=>{await raf(page);const path=output+'/'+profile.name+'-'+name+'.png';await page.screenshot({path});record.captures.push(path);};
    async function activate(label) {
      const rain=await until(page,r=>r.snapshot.phase==='rain',label+' rain');
      await button('#accelerate-button');
      const rise=await read(page); await capture(label+'-rise');
      const plan=await until(page,r=>r.snapshot.phase==='plan',label+' plan');
      await raf(page);
      return {rainSnapshot:rain.snapshot,riseSnapshot:rise.snapshot,planSnapshot:plan.snapshot};
    }
    async function success(label,path) {
      const midpoint=await drag(page,profile.touch,path,()=>capture(label+'-mid-route'));
      const lower=await read(page); await capture(label+'-lower');
      await until(page,r=>r.snapshot.phase==='dash',label+' dash');
      const samples=[];
      for(let i=0;i<5;i++) {
        await page.waitForTimeout(170);const r=await read(page);samples.push({phase:r.snapshot.phase,position:r.snapshot.position,dashTime:r.snapshot.dashTime,distanceFromDrawnPath:pathDistance(r.snapshot.position,r.snapshot.route)});
        if(i===1)await capture(label+'-dash-afterimages');
      }
      const clear=await until(page,r=>r.snapshot.phase==='clear',label+' clear');
      await capture(label+'-clear');
      assert.ok(samples.every(s=>s.distanceFromDrawnPath<1e-7),'dash left drawn polyline');
      return {midpoint:midpoint.snapshot,lower:lower.snapshot,samples,clear:clear.snapshot};
    }
    try {
      await page.goto((process.env.GAME017_URL||'http://127.0.0.1:5181/')+'game017.html');
      await capture('title'); await button('#play-button'); await capture('explanation'); await button('#tutorial-practice-button');
      record.practice.activation=await activate('practice'); await capture('practice-plan');
      const practice=await read(page);const practiceHazard=practice.inspection.rain.find(r=>r.dangerous);
      await drag(page,profile.touch,[{x:70,z:300},{x:180,z:300},practiceHazard.impact,{x:830,z:300},{x:930,z:300}]);
      const practiceFail=await until(page,r=>r.state==='practice-failure','recoverable practice collision');await capture('practice-failure');
      assert.equal(practiceFail.snapshot.score,0);assert.ok(!practiceFail.events.some(e=>e.name==='run_start'||e.name==='run_end'));
      record.practice.failure=practiceFail.snapshot;
      await button('#practice-retry-button');await until(page,r=>r.snapshot.phase==='plan','practice retry');await raf(page);
      const retry=await read(page);assert.ok(retry.snapshot.remaining>4.6);record.practice.retry=retry.snapshot;
      record.practice.success=await success('practice-retry',retry.inspection.safeRoute);
      assert.equal((await read(page)).state,'practice-complete');assert.equal((await read(page)).snapshot.score,0);
      await button('#tutorial-start-button');
      for(let round=1;round<=6;round++) {
        const label='round'+round, activation=await activate(label), r=await read(page);
        assert.equal(r.snapshot.round,round);await capture(label+'-plan');
        const recordRound={round,activation,inspection:r.inspection,execution:await success(label,r.inspection.safeRoute)};
        if(round<4)assert.deepEqual(r.inspection.wind,{x:0,z:0});else assert.ok(r.inspection.wind.x!==0||r.inspection.wind.z!==0);
        if(round===6)assert.ok(r.inspection.rain.some(drop=>drop.radius===27));
        assert.equal(recordRound.execution.clear.streak,round);assert.ok(recordRound.execution.clear.score>=1000*round);
        record.rounds.push(recordRound);
      }
      await until(page,r=>r.snapshot.round===7&&r.snapshot.phase==='rain','round7');await button('#accelerate-button');await until(page,r=>r.snapshot.phase==='plan','round7 plan');await raf(page);
      const r=await read(page),hazard=r.inspection.rain.find(drop=>drop.dangerous);
      await drag(page,profile.touch,[{x:70,z:300},{x:150,z:300},hazard.impact,{x:840,z:300},{x:930,z:300}]);
      const end=await until(page,r=>r.state==='result','real game collision');await capture('failure-result');assert.equal(end.snapshot.result.reason,'rain');
      record.failure=end.snapshot;record.endEvents=end.events.filter(e=>e.name==='run_end'||e.name==='score');
      await button('#retry-button');const retried=await read(page);assert.equal(retried.snapshot.score,0);assert.equal(retried.snapshot.round,1);record.retry=retried.snapshot;await capture('retry-warning');
      await button('#pause-button');await capture('retry-paused');await button('#title-button');await capture('return-title');
      assert.deepEqual(errors,[]);record.status='PASS';
    }catch(error){record.status='FAIL';record.error=String(error);record.last=await read(page).catch(()=>null);failure=true;await capture('failure-diagnostic').catch(()=>{});}
    finally{record.errors=errors;records.push(record);console.log(profile.name+' '+record.status+(record.error?' '+record.error:''));await context.close();}
  }
}finally{await browser.close();}
const after=await sourceAudit();if(after.changed.length)failure=true;
await writeFile(output+'/report.json',JSON.stringify({started,finished:new Date().toISOString(),before,after,profiles:records,nativeMouseOrCDPTouch:true,readonlySafeRouteOracle:true,forcedRuntimeWrites:false,humanFunOrPhysicalFeelClaim:false},null,2)+'\n');
if(failure)process.exitCode=1;
