import {describe,it,expect} from 'vitest';
import {FishingModel,FISH,SPOTS,type FishingInput} from '../../src/games/game032/FishingModel';
import {FishingBestStore,FISHING_BEST_KEY} from '../../src/games/game032/Save';

// Independent deterministic adversarial inputs; no private state, clock, browser or network hooks.
const DT=1/120;
function advance(m:FishingModel,seconds:number,input:FishingInput={}) {
  let left=seconds;while(left>1e-9){const dt=Math.min(DT,left);m.update(dt,input);left-=dt;}
}
function stepUntil(m:FishingModel,phase:string,limit=60) {
  for(let n=0;n<limit/DT;n++){if(m.snapshot.phase===phase)return;m.update(DT);}
  throw Error(`Expected ${phase}, received ${m.snapshot.phase}`);
}
function specimen(fishIndex:number) {
  const weights=SPOTS[3].weights,total=weights.reduce((a,b)=>a+b,0);
  const midpoint=(weights.slice(0,fishIndex).reduce((a,b)=>a+b,0)+weights[fishIndex]/2)/total;
  const draws=[0,0,midpoint,.9];let i=0;
  const m=new FishingModel({random:()=>draws[i++%draws.length]});
  advance(m,3.1,{right:true});expect(m.snapshot.spotId).toBe('pool');
  m.startCharge();advance(m,1.3);m.releaseCast();stepUntil(m,'bite');m.hook();
  expect(m.snapshot.fish?.id).toBe(FISH[fishIndex].id);return m;
}
function controlledFight(m:FishingModel) {
  const began=m.snapshot.elapsed;
  while(m.snapshot.phase==='fight'&&m.snapshot.elapsed-began<40){m.update(DT,{reeling:!m.snapshot.fishPulling});}
  return m.snapshot.elapsed-began;
}
function freshSmallFish(initialIdle=0) {
  const m=new FishingModel({random:()=>0});advance(m,initialIdle);m.startCharge();m.releaseCast();stepUntil(m,'bite');m.hook();return m;
}

describe('Independent all-species input policy comparison',()=>{
  for(let index=0;index<FISH.length;index++) {
    it(`${FISH[index].id}: read-and-release lands; always hold and never hold do not`,()=>{
      const deliberate=specimen(index);const fightSeconds=controlledFight(deliberate);
      expect(deliberate.snapshot.phase).toBe('landed');expect(deliberate.snapshot.catches).toHaveLength(1);
      expect(fightSeconds).toBeGreaterThan(4);expect(fightSeconds).toBeLessThan(20);
      const score=deliberate.snapshot.score;advance(deliberate,2);expect(deliberate.snapshot.score).toBe(score);
      expect(deliberate.drainEvents().filter(e=>e.type==='fish_landed')).toHaveLength(1);
      const held=specimen(index);while(held.snapshot.phase==='fight')held.update(DT,{reeling:true});
      expect(held.snapshot).toMatchObject({phase:'failed',failure:'line',score:0});
      const ignored=specimen(index);stepUntil(ignored,'failed',40);
      expect(ignored.snapshot).toMatchObject({failure:'escaped',score:0});
    });
  }
});

describe('Independent absolute deadline and input cancellation boundaries',()=>{
  it('completion one frame before expiry is counted once; the same catch one frame after expiry is omitted',()=>{
    const reference=freshSmallFish();controlledFight(reference);const landAt=reference.snapshot.elapsed;
    const before=freshSmallFish(300-landAt-2*DT);controlledFight(before);
    expect(before.snapshot.phase).toBe('landed');expect(before.snapshot.catches).toHaveLength(1);
    const score=before.snapshot.score;advance(before,4*DT);
    expect(before.snapshot).toMatchObject({phase:'ended',score,remaining:0});
    const after=freshSmallFish(300-landAt+2*DT);controlledFight(after);
    expect(after.snapshot).toMatchObject({phase:'ended',score:0,remaining:0});expect(after.snapshot.catches).toHaveLength(0);
    for(const m of [before,after]){advance(m,1);expect(m.drainEvents().filter(e=>e.type==='session_end')).toHaveLength(1);}
  });
  it('pause during every active phase freezes the same clock/state, and cancellation cannot emit a cast',()=>{
    for(const phase of ['idle','charging','casting','waiting','nibble','bite','fight']) {
      const m=new FishingModel({random:()=>0});
      if(phase!=='idle'){m.startCharge();if(phase!=='charging'){m.releaseCast();if(phase!=='casting'){stepUntil(m,phase==='fight'?'bite':phase);if(phase==='fight')m.hook();}}}
      if(phase==='charging')advance(m,.6);
      const elapsed=m.snapshot.elapsed,score=m.snapshot.score,power=m.snapshot.castPower;m.drainEvents();m.setPaused(true);
      for(let n=0;n<300;n++)m.update(.25,{left:true,right:true,reeling:true});
      expect(m.snapshot.elapsed).toBe(elapsed);expect(m.snapshot.score).toBe(score);expect(m.snapshot.castPower).toBe(power);
      expect(m.startCharge()).toBe(false);expect(m.releaseCast()).toBe(false);expect(m.hook()).toBe(false);
      m.setPaused(false);expect(m.snapshot.reeling).toBe(false);
      expect(m.drainEvents().some(e=>e.type==='cast_released'||e.type==='fish_landed'||e.type==='session_end')).toBe(false);
      if(phase==='charging'){expect(m.releaseCast()).toBe(false);expect(m.snapshot.phase).toBe('idle');}
    }
  });
  it('a cancelled cast requires a new down gesture; repeated releases cannot duplicate a cast',()=>{
    const m=new FishingModel();m.startCharge();advance(m,1);m.cancelInput();m.cancelInput();
    expect(m.releaseCast()).toBe(false);expect(m.snapshot.charge).toBe(0);expect(m.snapshot.phase).toBe('idle');
    m.startCharge();advance(m,.2);expect(m.releaseCast()).toBe(true);
    for(let n=0;n<100;n++)expect(m.releaseCast()).toBe(false);
    expect(m.drainEvents().filter(e=>e.type==='cast_released')).toHaveLength(1);
  });
});

describe('Independent terminal-only local persistence',()=>{
  it('practice success and partial standard success never write; complete standard survives a fresh store',()=>{
    const data=new Map<string,string>();let writes=0;
    const backend={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{writes++;data.set(k,v);}};
    const store=new FishingBestStore(backend),m=freshSmallFish();controlledFight(m);
    expect(store.record(m.snapshot.score,'practice',true)).toBe(false);
    expect(store.record(m.snapshot.score,'standard',m.snapshot.phase==='ended')).toBe(false);
    expect(writes).toBe(0);advance(m,300-m.snapshot.elapsed);
    expect(m.snapshot.phase).toBe('ended');expect(store.record(m.snapshot.score,'standard',true)).toBe(true);
    expect([...data.keys()]).toEqual([FISHING_BEST_KEY]);expect(new FishingBestStore(backend).best()).toBe(m.snapshot.score);
    expect(store.record(0,'standard',true)).toBe(false);expect(writes).toBe(1);
  });
  it('corrupt read and denied write preserve page-memory maximum while no fresh-store persistence is claimed',()=>{
    const backend={getItem:()=>'{broken',setItem:()=>{throw Error('quota');}};
    const store=new FishingBestStore(backend);expect(store.best()).toBeNull();expect(store.record(500,'standard',true)).toBe(true);
    expect(store.record(400,'standard',true)).toBe(false);expect(store.best()).toBe(500);expect(new FishingBestStore(backend).best()).toBeNull();
  });
});
