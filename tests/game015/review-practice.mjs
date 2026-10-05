import ts from 'typescript';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const modules=new Map();
function load(file){file=resolve(file);if(modules.has(file))return modules.get(file).exports;const m={exports:{}};modules.set(file,m);const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>load(resolve(dirname(file),name+'.ts')),m,m.exports);return m.exports;}
const {FallPractice}=load('src/arcade/FallPractice.ts'),practice=new FallPractice(),records=[];
for(let step=0;step<3;step++){
  const start=practice.snapshot();assert.equal(start.step,step);assert.equal(start.grounded,true);practice.drop();practice.setInput(step===1?1:step===2?-1:0);
  let release=null,landing=null;
  for(let frame=0;frame<1200;frame++){
    practice.update(.005);const s=practice.snapshot();
    if(step>0&&frame===90){release=s;practice.setInput(0);}
    if(s.phase==='landed'){landing=s;break;}
  }
  assert.ok(landing,`step${step} requires an actual safe landing`);assert.equal(landing.ghost,false);assert.ok(landing.fallDistance<6);
  if(step===1){assert.ok(release.vx>0);assert.ok(landing.x>release.x,'release preserves inertial drift');}
  records.push({step,start,release,landing});
  for(let frame=0;frame<250&&practice.snapshot().step===step;frame++)practice.update(.005);
}
assert.equal(practice.snapshot().step,3);assert.equal(practice.snapshot().ghost,true);
let splat=null;for(let frame=0;frame<1200&&!practice.snapshot().complete;frame++){practice.update(.005);if(practice.snapshot().phase==='splat')splat=practice.snapshot();}
assert.ok(splat&&splat.cause==='scroll'&&splat.fallDistance===0&&splat.cameraY>0);assert.equal(practice.snapshot().complete,true);assert.equal(practice.snapshot().step,4);records.push({step:3,splat,completed:practice.snapshot()});
writeFileSync(process.env.GAME015_PRACTICE_REVIEW??'docs/game015/revision-02/QA/PRACTICE_PUBLIC_INPUT_REVIEW.json',JSON.stringify({checkedUtc:new Date().toISOString(),scope:'Isolated lesson, public drop/setInput/update only. No production run or score. Pure simulation, not browser evidence.',records},null,2)+'\n');console.log('4 actual lesson phases: safe lands0–2, right/left-release inertia, ghost scroll demo PASS');
