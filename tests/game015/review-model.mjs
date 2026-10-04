import ts from 'typescript';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
// Pure-model review only: legal controls; no internal field/score/time writes.
const cache=new Map();
function load(file){file=resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);
  const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',js)(name=>load(resolve(dirname(file),name+'.ts')),m,m.exports);return m.exports;}
const {FallRun}=load('src/games/game015/FallRun.ts');
const {platformX}=load('src/games/game015/generation.ts');
const {GRAVITY:G,TERMINAL_VELOCITY:T}=load('src/games/game015/types.ts');
const seedRandom=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function remainingFlight(d,v){const accelerationDistance=(T*T-v*v)/(2*G);return d<=accelerationDistance?(-v+Math.sqrt(v*v+2*G*d))/G:(T-v)/G+(d-accelerationDistance)/T;}
const targetDepth=Number(process.env.GAME015_MODEL_DEPTH??1200),seeds=(process.env.GAME015_MODEL_SEEDS??'1,7,42').split(',').map(Number),records=[];
for(const seed of seeds){const events=[],run=new FallRun(e=>events.push(e),seedRandom(seed));run.start();let maxPlatforms=0,frames=0,target=null;
  while(run.snapshot().alive&&run.snapshot().depth<targetDepth&&frames<400000){
    const s=run.snapshot(),p=s.player;maxPlatforms=Math.max(maxPlatforms,s.platforms.length);
    if(p.grounded){
      const support=s.platforms.find(v=>v.id===p.platformId);const next=s.platforms.filter(v=>v.route&&!v.gone&&v.y>p.y+.001).sort((a,b)=>a.y-b.y)[0];assert.ok(next,'a visible safe next route');target=next;
      // Reposition on full-width catches; narrow supports launch settled to the next legal row.
      if(support.width===256&&Math.abs(p.x-(next.x+next.width/2))>3){const error=next.x+next.width/2-p.x;run.setHorizontal(Math.abs(error-p.vx*.2)<3?0:error-p.vx*.2>0?1:-1);}
      else if(Math.abs(p.vx)>4&&support.type!=='crumble')run.setHorizontal(0);
      else{run.setHorizontal(0);run.drop();}
    }else{
      if(!target||target.y<=p.y)target=s.platforms.filter(v=>v.route&&!v.gone&&v.y>=p.y).sort((a,b)=>a.y-b.y)[0];assert.ok(target,'no blind fall');
      const current=s.platforms.find(v=>v.id===target.id)??target;const arrival=s.time+remainingFlight(Math.max(0,current.y-p.y),p.vy),cx=platformX(current,arrival)+current.width/2;
      const error=cx-p.x,correction=error-p.vx*.25;run.setHorizontal(Math.abs(correction)<2?0:correction>0?1:-1);
    }
    run.step(.025);frames++;
  }
  const snapshot=run.snapshot(),ending=run.result();assert.ok(snapshot.alive&&snapshot.depth>=targetDepth,`seed${seed} safe route ended: ${JSON.stringify(ending)}`);
  assert.equal(events.filter(e=>e.type==='milestone').length,targetDepth>=1000?1:0);assert.equal(ending,null,'1000 is not terminal');assert.ok(maxPlatforms<80,'bounded platform resources');
  records.push({seed,targetDepth,depth:snapshot.depth,time:snapshot.time,frames,maxPlatforms,landings:events.filter(e=>e.type==='landing').length,milestones:events.filter(e=>e.type==='milestone'),platformKinds:[...new Set(events.filter(e=>e.type==='landing').map(e=>e.landing.platformType))],result:ending});
}
mkdirSync('docs/game015/QA',{recursive:true});writeFileSync('docs/game015/QA/INDEPENDENT_MODEL_ROUTE.json',JSON.stringify({checkedUtc:new Date().toISOString(),policy:'Legal setHorizontal/drop/step only. Seeded movement/braking observer; no state/time/score injection. Pure-model evidence, not browser/human evidence.',records},null,2)+'\n');console.log(JSON.stringify(records,null,2));
