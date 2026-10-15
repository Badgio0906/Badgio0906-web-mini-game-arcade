import {describe,it,expect} from 'vitest';
import {TowerRun,artPairPoints} from '../../src/games/game003/TowerRun';
function place(r:TowerRun,x:number){r.move(x);r.drop();const n=r.stack.length;for(let t=0;t<1200&&r.alive&&r.stack.length===n;t++)r.step(1/120);}
describe('Game003 physical art scoring',()=>{
 it('does not grant art for centered stacking, tiny alternation, idle time or repeated release',()=>{
  const r=new TowerRun(()=>{},()=>0);r.start();for(const x of [300,302,298]){if(r.alive)place(r,x);}expect(r.snapshot().artPairs).toBe(0);expect(r.snapshot().artScore).toBe(0);const before=r.snapshot().bonusScore;for(let n=0;n<200;n++)r.step(1/120);expect(r.snapshot().bonusScore).toBe(before);
 });
 it('awards a disjoint artistic counterweight only after real L-shape contact and recovered COM',()=>{const r=new TowerRun(()=>{},()=>0);r.start();for(const x of [340,340,300]){place(r,x);expect(r.alive,JSON.stringify(r.inspection())).toBe(true);}expect(r.snapshot().artPairs).toBe(1);expect(r.inspection().recentArtPair!.recoveryPixels).toBeGreaterThanOrEqual(8);expect(r.snapshot().artScore).toBeGreaterThan(180);const before=r.snapshot().artScore;for(let n=0;n<200;n++)r.step(1/120);expect(r.snapshot().artScore).toBe(before);});
 it('scores recovery with bounded streak and a single multiplier',()=>{for(const recovery of [8,18,50])for(const streak of [1,5,100]){const base=artPairPoints(.2,-.3,recovery,1,streak);expect(base).toBeGreaterThan(180);expect(base).toBeLessThanOrEqual(370);expect(artPairPoints(.2,-.3,recovery,3,streak)).toBe(base*3);}});
 it('emits score only at actual stable contact acceptance and does not count a flying shape',()=>{
  const r=new TowerRun(()=>{},()=>0);r.start();r.drop();for(let n=0;n<30;n++)r.step(1/120);expect(r.snapshot()).toMatchObject({floors:0,artScore:0,precisionScore:0});for(let n=0;n<800&&r.stack.length===0;n++)r.step(1/120);expect(r.snapshot()).toMatchObject({floors:1,perfectCount:1,precisionScore:100});
 });
});
