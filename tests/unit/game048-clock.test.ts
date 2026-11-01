import{expect,it}from'vitest';
import{FixedClock}from'../../src/games/game048/clock';
import{create,letGo,step,HZ}from'../../src/games/game048/game';

it('flushes old fixed steps before an arriving release, then applies it on the next tick',()=>{
 const s=create(),clock=new FixedClock(0,HZ);let pending=false;const anchors:(number|null)[]=[];
 const tick=()=>{if(pending){letGo(s);pending=false;}step(s);anchors.push(s.rope.anchor);return true;};
 clock.advance(16,tick,()=>{throw Error('unexpected gap');});pending=true;
 expect(s.tick).toBe(3);expect(s.rope.anchor).toBe(0);
 clock.advance(17,tick,()=>{});
 expect(s.tick).toBe(4);expect(anchors).toEqual([0,0,0,null]);
});
it('never rewinds when a queued rAF timestamp predates an already flushed input',()=>{
 const clock=new FixedClock(0,240);let ticks=0;const tick=()=>{ticks++;return true;};
 clock.advance(12,tick,()=>{});clock.advance(8,tick,()=>{});clock.advance(16,tick,()=>{});
 expect(ticks).toBe(3);clock.advance(1000/60,tick,()=>{});expect(ticks).toBe(4);
});
it('retains fractional time across input and render flushes without double counting',()=>{
 const run=(times:number[])=>{const clock=new FixedClock(0,240);let ticks=0;for(const t of times)clock.advance(t,()=>{ticks++;return true;},()=>{});return ticks;};
 expect(run([2,3,7,11,16,23,37,44,99,100])).toBe(24);
 expect(run([100])).toBe(24);
});
it('keeps exact500ms allowed and pauses a gap above500ms without advancing physics',()=>{
 let ticks=0,gaps=0;const clock=new FixedClock(0,240),tick=()=>{ticks++;return true;};
 clock.advance(500,tick,()=>gaps++);expect(ticks).toBe(120);expect(gaps).toBe(0);
 clock.advance(1001,tick,()=>gaps++);expect(ticks).toBe(120);expect(gaps).toBe(1);
 clock.advance(1006,tick,()=>gaps++);expect(ticks).toBe(121);
});
it('reset discards pre-pause fractional time and never catches up the paused interval',()=>{
 const clock=new FixedClock(0,240);let ticks=0;const tick=()=>{ticks++;return true;};
 clock.advance(3,tick,()=>{});clock.reset(1000);clock.advance(1002,tick,()=>{});expect(ticks).toBe(0);
 clock.advance(1005,tick,()=>{});expect(ticks).toBe(1);
});
it('stops a flush immediately at a terminal step and discards remaining catchup',()=>{
 const clock=new FixedClock(0,240);let ticks=0;
 clock.advance(100,()=>{ticks++;return false;},()=>{});expect(ticks).toBe(1);
 clock.reset(200);clock.advance(202,()=>{ticks++;return true;},()=>{});expect(ticks).toBe(1);
});
