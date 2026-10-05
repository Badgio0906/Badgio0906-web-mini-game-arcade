import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { ChargeRun } from '../../src/games/game019/ChargeRun.ts';
import { createAuthoredLevel } from '../../src/games/game019/authoredLevel.ts';
import { STEP, PPM } from '../../src/games/game019/chargeTypes.ts';
const out = process.env.GAME019_LEVEL_OUT ?? 'docs/game019/revision-02/QA/model-level';
fs.mkdirSync(out, { recursive: true });
const charges = [...new Set([80, 90, ...Array.from({ length: 66 }, (_, i) => 50 + i * 10)])];
export function jump(run, ms, direction) {
  run.setDirection(direction); assert.equal(run.beginCharge(), true);
  for(let i=0;i<Math.round(ms/1000/STEP);i++) run.update(STEP);
  assert.equal(run.releaseCharge(), true);
  for(let i=0;i<3000&&!run.player.grounded&&run.alive;i++) run.update(STEP);
  assert.equal(run.player.grounded, true);
  return run.snapshot();
}
export function follow(route, delay=0) {
  const events=[], r=new ChargeRun(createAuthoredLevel(),e=>events.push(e)), replay=[];
  if(delay)for(let i=0;i<Math.round(delay/STEP);i++)r.update(STEP);
  for(const target of route) {
    if(target==='root-top') { // Accepted pilot's positioning hop.
      const s=jump(r,80,1); replay.push({charge_ms:80,direction:1,target:s.player.ledgeId,landing_x:s.player.x,landing_height:s.height,preparation:true});
    }
    let plans=[];
    const seek=()=> {
      const targetLedge=r.snapshot().ledges.find(l=>l.id===target);
      plans=charges.flatMap(ms=>[-1,0,1].map(direction=>r.forecast(ms,direction))).filter(f=>f.landing?.id===target || target==='sky-start'&&f.sea)
       .map(f=>{const margin=f.landing?Math.min(f.landing.x-targetLedge.x,targetLedge.x+targetLedge.width-f.landing.x):100;
         const jitter=[-20,20].map(delta=>r.forecast(Math.max(0,Math.min(700,f.chargeMs+delta)),f.direction));
         return {...f,score:margin+(jitter.every(x=>x.landing?.id===target||target==='sky-start'&&x.sea)?100:0)-(f.bump?120:0)};}).sort((a,b)=>b.score-a.score);
    };
    seek();
    if(!plans.length) { // A small, real hop can change the next takeoff position.
      let found=null;
      for(const direction of [-1,1])for(const ms of [50,80,100,120]) {
        const prep=r.forecast(ms,direction);
        if(prep.landing?.id!==r.player.ledgeId||prep.bump)continue;
        const clone=new ChargeRun(createAuthoredLevel());
        if(delay)for(let i=0;i<Math.round(delay/STEP);i++)clone.update(STEP);
        for(const p of replay)jump(clone,p.charge_ms,p.direction);
        jump(clone,ms,direction);
        const successes=charges.flatMap(v=>[-1,0,1].map(d=>clone.forecast(v,d))).filter(f=>f.landing?.id===target||target==='sky-start'&&f.sea);
        if(successes.length){found={ms,direction};break;}
      }
      if(found){const s=jump(r,found.ms,found.direction);replay.push({charge_ms:found.ms,direction:found.direction,target:s.player.ledgeId,landing_x:s.player.x,landing_height:s.height,preparation:true});seek();}
    }
    if(!plans.length)throw new Error(`No route from ${r.player.ledgeId} x=${r.player.x.toFixed(2)} ${r.player.y/PPM} to ${target}`);
    const choice=plans[0], s=jump(r,choice.chargeMs,choice.direction);
    assert.equal(s.player.ledgeId,target);
    replay.push({charge_ms:choice.chargeMs,direction:choice.direction,target,landing_x:s.player.x,landing_height:s.height,predicted:choice,wind:s.wind?.id??null});
  }
  return {run:r,events,replay};
}
export const well=['first','brick','under-beam','takeoff','root-top','brick-narrow','catch-25','cracked-step','moss-low','moss-turn','timber-long','timber-short','timber-nub','rest-edge','catch-50','root-gap-top','bucket-approach','old-bucket','bucket-return','fork-start'];
export const tail=['fork-join','upper-moss','last-crack','light-root','exit-stone','sky-start','cloud-left','flag-east','east-cloud','rising-base','rising-top','west-flag-cloud','west-cloud','heavy-base','heavy-top','sky-catch','sky-rest-top','strong-east-base','strong-east-top','bird-perch','bird-high','ice-rise-base','ice-rise-top','ice-heavy-step','star-catch','star-west','last-star-base','last-star','space-goal'];
export function main() {
const start=new Date().toISOString();
const sourceHashes=Object.fromEntries(['ChargeRun.ts','chargeTypes.ts','authoredLevel.ts'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(`src/games/game019/${file}`)).digest('hex')]));
const safe=follow([...well,'fork-safe-low','catch-75','fork-safe-high',...tail]);
fs.writeFileSync(`${out}/safe-path.json`,JSON.stringify({start,end:new Date().toISOString(),sourceHashes,replay:safe.replay,events:safe.events,summary:safe.run.snapshot()},null,2));
console.log(JSON.stringify({safe:true,jumps:safe.run.jumps,seconds:safe.run.time,height:safe.run.player.y/PPM}));
const risk=follow([...well,'fork-risk',...tail]);
fs.writeFileSync(`${out}/risk-path.json`,JSON.stringify({start,end:new Date().toISOString(),sourceHashes,replay:risk.replay,events:risk.events,summary:risk.run.snapshot()},null,2));
console.log(JSON.stringify({risk:true,jumps:risk.run.jumps,seconds:risk.run.time,height:risk.run.player.y/PPM}));

study();
for(const [file,hash] of Object.entries(sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`src/games/game019/${file}`)).digest('hex'),hash,`source changed: ${file}`);
}
export function study() {
const result={start:new Date().toISOString(), maxOnly:{}, bucketPhases:[],fallExamples:[],tolerance:[], recovery:{}, status:'pending'};
const queue=[[]],seen=new Set();let ceiling=0, maxLanding=0;
while(queue.length&&seen.size<400){const route=queue.shift(),r=new ChargeRun(createAuthoredLevel());for(const d of route)jump(r,700,d); const key=`${r.player.ledgeId}:${Math.round(r.player.x/2)}:${Math.round(r.player.vx/4)}`;if(seen.has(key))continue;seen.add(key);maxLanding=Math.max(maxLanding,r.player.y/24);ceiling=Math.max(ceiling,r.maxHeight);if(route.length>=20)continue;for(const d of[-1,0,1])queue.push([...route,d]);}
assert(maxLanding<20);result.maxOnly={search:'all 3 directions, 700ms only, depth 20, 2px/4vx state bins',states:seen.size,maxLanding,maxPeak:ceiling,queued:queue.length,passed:maxLanding<20,notAnExhaustiveMathematicalProof:true};
for(const delay of [0,1.1,2.2,3.3]){const {run,replay}=follow(well.slice(0,well.indexOf('old-bucket')+1),delay);result.bucketPhases.push({initialWait:delay,time:run.time,x:run.player.x,ledge:run.player.ledgeId,lastJump:replay.at(-1)});assert.equal(run.player.ledgeId,'old-bucket');}
const examples=[{name:'one small step back',route:well.slice(0,well.indexOf('timber-nub')+1),ms:150,d:1},{name:'medium pilot failure',route:well.slice(0,4),ms:300,d:-1},{name:'pilot deep failure',route:well.slice(0,4),ms:700,d:-1},{name:'50m catch',route:well.slice(0,well.indexOf('root-gap-top')+1),ms:300,d:-1},{name:'risk misses the 75m shelf',route:[...well,'fork-risk'],ms:100,d:-1}];
for(const ex of examples){const {run,events}=follow(ex.route);const start=run.player.y/24;const s=jump(run,ex.ms,ex.d);assert(run.alive);assert(run.beginCharge());run.cancelCharge();result.fallExamples.push({name:ex.name,start,end:s.height,loss:start-s.height,landing:s.player.ledgeId,alive:s.alive,event:events.filter(e=>e.type==='catch_ledge_used').at(-1)??null});}
const safe=JSON.parse(fs.readFileSync(`${out}/safe-path.json`));const risk=JSON.parse(fs.readFileSync(`${out}/risk-path.json`));
const visited=new Set(['bottom']);
for(const [name,proof]of[['safe',safe],['risk',risk]]){const r=new ChargeRun(createAuthoredLevel());for(const p of proof.replay){visited.add(p.target);const forecasts=[-20,20].map(delta=>r.forecast(Math.max(0,Math.min(700,p.charge_ms+delta)),p.direction));result.tolerance.push({route:name,target:p.target,charge:p.charge_ms,direction:p.direction,jitter20ms:forecasts.map(f=>({landing:f.landing?.id??null,sea:f.sea,bump:f.bump})),bothSameTarget:forecasts.every(f=>f.landing?.id===p.target||p.target==='sky-start'&&f.sea)});jump(r,p.charge_ms,p.direction);}assert(r.clear);}
const excluded=['sea-shore'];const missing=createAuthoredLevel().ledges.filter(l=>!visited.has(l.id)&&!excluded.includes(l.id)).map(l=>l.id);assert.deepEqual(missing,[]);result.recovery={visitedPhysicalFootings:[...visited],except:excluded,missing,reason:'Both complete public-input paths contain a subsequent real jump after every visited footing; shore is transition scenery, final star terminates RUN. This does not prove every arbitrary edge pose.'};
assert.deepEqual(result.fallExamples.map(x=>Number(x.loss.toFixed(1))),[1.1,3.7,10.3,7.2,27.5]);
assert.equal(result.fallExamples[3].landing,'catch-50');
result.end=new Date().toISOString();result.status='PASS';fs.writeFileSync(`${out}/model-study.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,maxOnly:result.maxOnly,bucketPhases:result.bucketPhases.map(x=>({wait:x.initialWait,x:x.x})),fallExamples:result.fallExamples,tolerant:result.tolerance.filter(t=>t.bothSameTarget).length,total:result.tolerance.length}));

}
if(process.argv[1]?.endsWith('level-plan.mjs'))main();
