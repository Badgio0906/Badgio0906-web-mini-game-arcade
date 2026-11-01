import{it,expect}from'vitest';
import{createWaves,DEFAULT_SEED}from'../../src/games/game040/waves';
it('authored free-flight occupancy plus every possible live bullet stays below80 without deleting gameplay objects',()=>{
 // An input-independent conservative bound: suction/kills only remove dust sooner;
 // a dead can's pending secondary replaces it for at most60ms, including near-danger deaths.
 const points:{at:number;delta:number}[]=[];
 for(const e of createWaves(DEFAULT_SEED)){
  const vy=e.vy??0,vx=e.vx??0,end=e.kind==='can'?436:510;
  let seconds=vy>0?(end-e.y)/vy:Infinity;
  if(vx>0)seconds=Math.min(seconds,(520-e.x)/vx);
  if(vx<0)seconds=Math.min(seconds,(-40-e.x)/vx);
  points.push({at:e.atMs,delta:1},{at:Math.min(60000,e.atMs+Math.max(0,seconds)*1000+(e.kind==='can'?60:0)),delta:-1});
 }
 points.sort((a,b)=>a.at-b.at||b.delta-a.delta);let live=0,peak=0;
 for(const p of points){live+=p.delta;peak=Math.max(peak,live);}
 const maxBullets=Math.ceil(800/125);
 expect(peak+maxBullets).toBeLessThanOrEqual(80);
});
