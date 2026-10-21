import { describe,it,expect } from 'vitest';
import { CLEARANCE, clearSegment, distance, hitsRect, length, safePath, selfCrosses, simplify } from '../../src/games/game030/Geometry';
import { LEVELS, PRACTICE, type Level } from '../../src/games/game030/Levels';
import { Route } from '../../src/games/game030/Route';
import { freshProgress, makeSnapshot, recordClear, SaveStore, validate } from '../../src/games/game030/Save';
const id='11111111-1111-4111-8111-111111111111';
const plain:Level={id:1,name:'test',start:{x:50,y:450},socket:{x:550,y:50},solution:[],hint:{x:100,y:450},obstacles:[],budget:2000};
describe('game030 original fixed-world route',()=>{
 it.each(LEVELS.map(l=>[l.id,l]))('stage %i has independently checkable safe solution and finger margin',(_,lev)=>{
  const l=lev as Level;expect(safePath(l.solution,l.obstacles,l.budget)).toBe(true);
  expect(length(l.solution)+70).toBeLessThanOrEqual(l.budget);
  for(let i=1;i<l.solution.length;i++)expect(clearSegment(l.solution[i-1],l.solution[i],l.obstacles,CLEARANCE+4)).toBe(true);
  const r=new Route(l);for(const p of l.solution.slice(1))r.move(p);expect(r.cleared).toBe(true);expect(distance(r.plug,l.socket)).toBe(0);
  if(l.alternate)expect(safePath(l.alternate,l.obstacles,l.budget)).toBe(true);
 });
 it('all20 authored routes tolerate bounded interior finger deviation and ordinary dense pointer sampling',()=>{
  for(const l of LEVELS){for(let sample=0;sample<12;sample++){
   const points=l.solution.map((p,i)=>i===0||i===l.solution.length-1?{...p}:{x:p.x+((sample+i)%3-1)*4,y:p.y+((sample*2+i)%3-1)*4});
   expect(safePath(points,l.obstacles,l.budget)).toBe(true);
  }
  const r=new Route(l);for(let i=1;i<l.solution.length;i++){
   const a=l.solution[i-1],b=l.solution[i],n=Math.ceil(distance(a,b)/4);
   for(let j=1;j<=n;j++)r.move({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});
  }expect(r.cleared).toBe(true);expect(r.points.length).toBeLessThan(20);
  }
 });
 it('late narrow shortcuts save real Euclidean length compared with wide safe alternatives',()=>{for(const n of[13,14,18,20]){const l=LEVELS[n-1];expect(l.alternate).toBeDefined();expect(length(l.alternate!)-length(l.solution)).toBeGreaterThan(30);for(let i=1;i<l.alternate!.length;i++)expect(clearSegment(l.alternate![i-1],l.alternate![i],l.obstacles,CLEARANCE+4)).toBe(true);}});
 it('practice is a real separate route',()=>{const r=new Route(PRACTICE);for(const p of PRACTICE.solution.slice(1))r.move(p);expect(r.cleared).toBe(true);expect(PRACTICE.id).toBe(0);});
 it('sweeps through thin furniture even when target is far beyond it',()=>{const r=new Route({...plain,obstacles:[{x:200,y:400,w:2,h:70,kind:'leg'}]});expect(r.move({x:550,y:450})).toBe('wall');expect(r.points).toHaveLength(1);});
 it('takes plug+cable thickness into account including corner tangency',()=>{expect(hitsRect({x:50,y:85},{x:300,y:85},{x:100,y:100,w:50,h:50,kind:'box'})).toBe(true);expect(clearSegment({x:50,y:100-CLEARANCE-1},{x:300,y:100-CLEARANCE-1},[{x:100,y:100,w:50,h:50,kind:'box'}])).toBe(true);});
 it('blocks a wall20units above the center where the visible plug prongs reach22.5',()=>{const r=new Route({...plain,start:{x:50,y:100},obstacles:[{x:80,y:60,w:40,h:20,kind:'box'}]});expect(r.move({x:150,y:100})).toBe('wall');expect(r.points).toHaveLength(1);});
 it('outside reentry cannot relocate the plug',()=>{const r=new Route(plain);expect(r.move({x:-200,y:450})).toBe('outside');expect(r.plug).toEqual(plain.start);});
 it('enforces budget before socket clear',()=>{const r=new Route({...plain,budget:100});expect(r.move({x:550,y:50})).toBe('length');expect(r.used).toBeCloseTo(100);expect(r.cleared).toBe(false);});
 it('only rewinds contiguous final segment, not remote prior segments',()=>{const r=new Route(plain);r.move({x:250,y:450});r.move({x:250,y:250});r.move({x:450,y:250});expect(r.move({x:100,y:450})).toBe('crossing');expect(r.points).toHaveLength(4);expect(r.move({x:350,y:250})).toBe('backtrack');expect(r.used).toBeCloseTo(500);expect(r.move({x:250,y:250})).toBe('backtrack');expect(r.points).toHaveLength(3);});
 it('forbids nonadjacent crossing and collinear overlap',()=>{expect(selfCrosses([{x:50,y:50},{x:150,y:150},{x:50,y:150},{x:150,y:50}])).toBe(true);expect(selfCrosses([{x:50,y:50},{x:200,y:50},{x:200,y:100},{x:100,y:50},{x:150,y:50}])).toBe(true);});
 it('simplification retains a corner whose shortcut cuts furniture',()=>{const points=[{x:50,y:150},{x:50,y:50},{x:200,y:50}];expect(simplify(points,[{x:80,y:80,w:40,h:40,kind:'box'}])).toEqual(points);});
 it('rejects corrupt/illegal saved routes and mismatched rules',()=>{const s=makeSnapshot(freshProgress(),null);expect(validate(s)).not.toBeNull();expect(validate({...s,rules_version:'2'})).toBeNull();expect(validate({...s,current:{stage:1,points:[LEVELS[0].start,{x:300,y:250}],cleared:false,reported:false,resultId:id,runId:null,hints:0,resets:0}})).toBeNull();});
 it('clears and unlocks exactly once independently from nullable observer',()=>{const r=new Route(LEVELS[0]);for(const p of r.level.solution.slice(1))r.move(p);const first=recordClear(freshProgress(),1,r.used,id);expect(first.updated).toBe(true);expect(first.progress.unlocked).toBe(2);expect(recordClear(first.progress,1,r.used,id).updated).toBe(false);const s=makeSnapshot(first.progress,{stage:1,points:r.points,cleared:true,reported:true,resultId:id,runId:null,hints:0,resets:0});expect(validate(s)).not.toBeNull();});
 it('save coordinates/length do not depend on display size or DPR',()=>{const r=new Route(LEVELS[2]);for(const p of r.level.solution.slice(1))r.move(p);const next=new Route(r.level);expect(next.restore(structuredClone(r.points),true)).toBe(true);expect(next.used).toBe(r.used);});
 it('denied writes retain fresh memory rather than stale backend',()=>{let raw=JSON.stringify(makeSnapshot(freshProgress(),null));const store=new SaveStore({getItem:()=>raw,setItem:()=>{throw Error('denied');}});expect(store.read()?.progress.unlocked).toBe(1);const next=freshProgress();next.best[0]=825;next.unlocked=2;next.clears=1;store.write(makeSnapshot(next,null));raw=JSON.stringify(makeSnapshot(freshProgress(),null));expect(store.read()?.progress.unlocked).toBe(2);});
 it('good memory survives invalid then older backend without a second read',()=>{
  let raw='{}',reads=0;const store=new SaveStore({getItem:()=>{reads++;return raw;},setItem:()=>{}});const good=freshProgress();good.clears=2;store.write(makeSnapshot(good,null));
  expect(store.read()?.progress.clears).toBe(2);raw=JSON.stringify(makeSnapshot({...freshProgress(),clears:1},null));expect(store.read()?.progress.clears).toBe(2);expect(reads).toBe(1);
 });
 it('denied writes latch once while every later value still updates memory',()=>{
  let attempts=0;const store=new SaveStore({getItem:()=>null,setItem:()=>{attempts++;throw Error('denied');}});for(let n=1;n<=3;n++)store.write(makeSnapshot({...freshProgress(),clears:n},null));
  expect(attempts).toBe(1);expect(store.read()?.progress.clears).toBe(3);
 });
 it('successful reads seed fallback and returned snapshots cannot mutate memory',()=>{
  let raw=JSON.stringify(makeSnapshot({...freshProgress(),clears:4},null));const store=new SaveStore({getItem:()=>raw,setItem:()=>{}});const read=store.read()!;read.progress.clears=99;raw='x'.repeat(500001);expect(store.read()?.progress.clears).toBe(4);raw=JSON.stringify(makeSnapshot(freshProgress(),null));expect(store.read()?.progress.clears).toBe(4);
 });
 it('invalid unlocks, reused local-result IDs and fake progress are rejected',()=>{const s=makeSnapshot(freshProgress(),null);s.progress.unlocked=2;expect(validate(s)).toBeNull();s.progress.unlocked=1;s.progress.reported=[id,id];expect(validate(s)).toBeNull();});
});
