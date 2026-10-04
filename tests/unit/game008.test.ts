import { describe, expect, it } from 'vitest';
import { CoffeeRun, spillRateFor, MAX_SPILL_PERCENT_PER_SECOND, HAZARD_WARNING_SECONDS } from '../../src/games/game008/CoffeeRun';
import type { CoffeeEvent } from '../../src/games/game008/contracts';
const seeded=(seed:number)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const DT=1/120;
function balance(run:CoffeeRun){const s=run.snapshot();const error=s.bodyLean+.4*s.bodyVelocity;run.setInput(error>.035?-1:error<-.035?1:0);}
function drive(run:CoffeeRun, condition:()=>boolean,budget=120){for(let n=0;n<budget/DT&&run.snapshot().alive&&!run.snapshot().pending&&!condition();n++){balance(run);run.step(DT);}expect(condition(),JSON.stringify(run.inspection())).toBe(true);}
function start(seed=1,events:CoffeeEvent[]=[]){const run=new CoffeeRun(event=>events.push(event),seeded(seed));run.start();return run;}
function triple(seed=1,events:CoffeeEvent[]=[]){const run=start(seed,events);drive(run,()=>run.snapshot().pending==='second_cup');run.choose('accept');drive(run,()=>run.snapshot().pending==='third_cup');run.choose('accept');return run;}

describe('Coffee real liquid inertia, gradual overflow and earned cup choices',()=>{
 it('right acceleration moves the body right and fluid left; release retains inertia and short taps expire without queued input',()=>{
  const run=start();run.setInput(1);for(let n=0;n<18;n++)run.step(DT);const accelerated=run.snapshot();expect(accelerated.bodyLean).toBeGreaterThan(0);expect(accelerated.bodyVelocity).toBeGreaterThan(0);expect(accelerated.cups[0].liquidAngle).toBeLessThan(0);expect(accelerated.cups[0].liquidVelocity).toBeLessThan(0);
  run.setInput(0);run.step(DT);expect(run.snapshot().cups[0].liquidAngle).toBeLessThan(accelerated.cups[0].liquidAngle);expect(run.snapshot().bodyLean).toBeGreaterThan(accelerated.bodyLean);
  run.start();expect(run.tap(-1)).toBe(true);expect(run.snapshot().input).toBe(-1);for(let n=0;n<30;n++)run.step(DT);expect(run.snapshot().input).toBe(0);expect(run.inspection().tapRemaining).toBe(0);
  const before=run.inspection();for(const dt of[NaN,Infinity,-1,0])run.step(dt);expect(run.inspection()).toEqual(before);run.step(99);expect(run.snapshot().time-before.time).toBeCloseTo(.05,8);
 });
 it('overflow uses the drawn cross-section threshold, is symmetric, irreversible and never removes more than25 percent per second',()=>{
  const threshold=Math.atan(.2*82/62);expect(spillRateFor(100,0)).toBe(0);expect(spillRateFor(100,threshold-.001)).toBe(0);expect(spillRateFor(100,threshold+.001)).toBeGreaterThan(0);expect(spillRateFor(100,.5)).toBe(spillRateFor(100,-.5));expect(spillRateFor(100,1.2)).toBe(MAX_SPILL_PERCENT_PER_SECOND);
  const run=start();run.setInput(1);let partial=false;
  for(let n=0;n<90/DT&&run.snapshot().alive;n++){const before=run.snapshot().cups[0].remaining;run.step(DT);const after=run.snapshot().cups[0].remaining;expect(before-after).toBeGreaterThanOrEqual(-1e-9);expect(before-after).toBeLessThanOrEqual(25*DT+1e-8);if(after>0&&after<99)partial=true;}
  expect(partial).toBe(true);expect(run.result()).toMatchObject({outcome:'empty',emptyCupId:0,emptyCupName:'あなたの分'});
 });
 it('gentle public balance control survives repeated warned hazards while the same no-input route naturally empties',()=>{
  const idle=start(4);for(let n=0;n<90/DT&&idle.snapshot().alive;n++)idle.step(DT);expect(idle.snapshot().alive).toBe(false);
  const run=start(4);drive(run,()=>run.snapshot().pending==='second_cup');run.choose('decline');drive(run,()=>run.snapshot().time>=160,120);expect(run.snapshot().alive).toBe(true);expect(run.snapshot().distance).toBeGreaterThan(1700);expect(run.snapshot().cups[0].remaining).toBeGreaterThan(50);
 });
 it('500m freezes every cup/body/hazard/clock and declines once;2 cups alone unlock1000m, with prospective1.5x then2x',()=>{
  const events:CoffeeEvent[]=[];const one=start(2),two=start(2,events);for(const run of[one,two])drive(run,()=>run.snapshot().pending==='second_cup');const frozen=two.inspection();expect(frozen).toMatchObject({distance:500,score:500,input:0,cupCount:1,multiplier:1,alive:true});
  for(let n=0;n<60;n++){two.step(.05);expect(two.setInput(1)).toBe(false);expect(two.tap(-1)).toBe(false);}expect(two.inspection()).toEqual(frozen);expect(two.result()).toBeNull();
  expect(one.choose('decline')).toBe(true);expect(two.choose('accept')).toBe(true);expect(two.choose('accept')).toBe(false);expect(two.snapshot().cups[0]).toEqual(frozen.cups[0]);expect(two.snapshot()).toMatchObject({score:500,cupCount:2,multiplier:1.5,input:0});
  drive(one,()=>one.snapshot().distance>=1000);drive(two,()=>two.snapshot().pending==='third_cup');expect(one.snapshot().pending).toBeNull();expect(one.snapshot().score).toBe(1000);expect(two.snapshot()).toMatchObject({distance:1000,score:1250,pending:'third_cup'});
  const previous=two.snapshot();expect(two.choose('accept')).toBe(true);expect(two.snapshot().cups.slice(0,2)).toEqual(previous.cups);expect(two.snapshot()).toMatchObject({cupCount:3,multiplier:2,score:1250});drive(two,()=>two.snapshot().distance>=1500);expect(two.snapshot().score).toBeGreaterThanOrEqual(2250);expect(two.snapshot().score).toBeLessThan(2252);expect(two.snapshot().pending).toBeNull();expect(events.filter(event=>event.type==='milestone')).toHaveLength(2);expect(events.filter(event=>event.type==='choice')).toHaveLength(2);
 });
 it('three cups have genuinely independent frequencies/damping and dynamic liquid states, with no snapshot mutation leak',()=>{
  const run=triple();const before=run.snapshot();expect(before.cups.map(c=>c.frequency)).toEqual([4.2,3.4,5.3]);expect(before.cups.map(c=>c.damping)).toEqual([.52,.28,.12]);
  run.setInput(-1);for(let n=0;n<100;n++)run.step(DT);const s=run.snapshot();expect(new Set(s.cups.map(c=>c.liquidAngle.toFixed(5))).size).toBe(3);expect(new Set(s.cups.map(c=>c.liquidVelocity.toFixed(5))).size).toBe(3);
  const copy=run.inspection();copy.cups[0].remaining=-999;copy.hazards[0].onsetTime=-999;expect(run.snapshot().cups[0].remaining).toBeGreaterThanOrEqual(0);expect(run.inspection().hazards[0].onsetTime).toBeGreaterThan(0);
 });
 it('integer500/1000 score boundaries remain exact under varied legal frame durations, with prospective awards only',()=>{
  const scores=[];let fractionalTerminalObserved=false;
  for(const frames of[[1/60],[.013,.021,.0167],[.05,.011,.027]]){
   const run=start(2);
   const reach=(target:CoffeeRun,condition=()=>!!target.snapshot().pending)=>{for(let n=0;n<20_000&&target.snapshot().alive&&!condition();n++){balance(target);target.step(frames[n%frames.length]);}expect(condition()).toBe(true);expect(target.snapshot().alive).toBe(true);};
   reach(run);expect(run.snapshot()).toMatchObject({distance:500,score:500,pending:'second_cup'});run.choose('accept');
   reach(run);expect(run.snapshot()).toMatchObject({distance:1000,pending:'third_cup'});scores.push(run.snapshot().score);
   const before=run.snapshot().score;run.choose('accept');expect(run.snapshot().score).toBe(before);
   reach(run,()=>run.snapshot().distance>=1500);expect(run.snapshot()).toMatchObject({cupCount:3,multiplier:2,pending:null});
   // Public distance is floored; its final fraction can contribute at most one additional2x point.
   expect(run.snapshot().score).toBeGreaterThanOrEqual(2250);expect(run.snapshot().score).toBeLessThanOrEqual(2251);
   run.setInput(1);for(let n=0;n<20_000&&run.snapshot().alive;n++)run.step(frames[n%frames.length]);
   const terminal=run.result()!;expect(terminal).not.toBeNull();const displayedDistanceBase=1250+2*(terminal.distance-1000);
   expect(terminal.score).toBeGreaterThanOrEqual(displayedDistanceBase);expect(terminal.score).toBeLessThanOrEqual(displayedDistanceBase+1);fractionalTerminalObserved ||= terminal.score===displayedDistanceBase+1;
   run.start();expect(run.snapshot()).toMatchObject({distance:0,score:0,cupCount:1,multiplier:1});
   const single=start(2);reach(single);single.choose('decline');reach(single,()=>single.snapshot().distance>=1000);expect(single.snapshot()).toMatchObject({score:1000,cupCount:1,pending:null});
   const double=start(2);reach(double);double.choose('accept');reach(double);double.choose('decline');reach(double,()=>double.snapshot().distance>=1500);expect(double.snapshot()).toMatchObject({score:2000,cupCount:2,multiplier:1.5,pending:null});
  }
  expect(scores).toEqual([1250,1250,1250]);
  expect(fractionalTerminalObserved,'legal actual fractional-meter progress can earn the second point hidden by floored distance').toBe(true);
 });
 it('the first train shove follows its advertised seeded side before later oscillations reverse',()=>{
  const train=(side:-1|1)=>{let draw=0;const run=new CoffeeRun(()=>{},()=>draw++===4?(side===1?.9:.1):.1);run.start();drive(run,()=>run.snapshot().time>=37,40);return run;};
  const left=train(-1),right=train(1);const initialLeft=left.snapshot(),initialRight=right.snapshot();
  expect(initialLeft.bodyLean).toBeCloseTo(initialRight.bodyLean,8);expect(initialLeft.cups[0].liquidAngle).toBeCloseTo(initialRight.cups[0].liquidAngle,8);
  for(const run of[left,right]){run.setInput(0);for(let n=0;n<100;n++)run.step(.001);}
  const l=left.inspection(),r=right.inspection();expect(l.activeEvent).toMatchObject({type:'train',side:-1});expect(r.activeEvent).toMatchObject({type:'train',side:1});
  expect(r.bodyAcceleration-l.bodyAcceleration).toBeGreaterThan(.001);expect(r.bodyVelocity-l.bodyVelocity).toBeGreaterThan(0);expect(r.bodyLean-l.bodyLean).toBeGreaterThan(0);expect(r.cups[0].liquidAngle-l.cups[0].liquidAngle).toBeGreaterThan(0);
 });
 it('all five hazards give honest warning lead, do not overlap, and bound the queue across five long routes',()=>{
  const types=new Set<string>();
  for(let seed=1;seed<=5;seed++){const events:CoffeeEvent[]=[];const warnedAt=new Map<number,number>();const actualLead:number[]=[];let run!:CoffeeRun;run=new CoffeeRun(event=>{events.push(event);if(event.type==='warning')warnedAt.set(event.hazard.id,run.snapshot().time);if(event.type==='hazard')actualLead.push(run.snapshot().time-(warnedAt.get(event.hazard.id)??Infinity));},seeded(seed));run.start();let lastOnset=0;let maxQueue=0;let overlapped=false;
   for(let n=0;n<480/DT&&run.snapshot().alive;n++){if(run.snapshot().pending)run.choose('decline');balance(run);run.step(DT);const s=run.inspection();maxQueue=Math.max(maxQueue,s.hazards.length);if(s.hazards.filter(h=>s.time>=h.onsetTime&&s.time<h.onsetTime+h.duration).length>1)overlapped=true;}
   expect(maxQueue).toBeLessThanOrEqual(5);expect(overlapped).toBe(false);expect(actualLead.length).toBeGreaterThan(50);for(const lead of actualLead)expect(lead).toBeGreaterThanOrEqual(1.39);
   expect(run.snapshot().alive).toBe(true);expect(run.snapshot().distance).toBeGreaterThan(5000);
   const warned=new Map(events.filter((event):event is Extract<CoffeeEvent,{type:'warning'}>=>event.type==='warning').map(event=>[event.hazard.id,event.hazard]));for(const e of events)if(e.type==='hazard'){expect(warned.has(e.hazard.id)).toBe(true);expect(e.hazard.onsetTime-e.hazard.warningStart).toBeCloseTo(HAZARD_WARNING_SECONDS,8);expect(e.hazard.duration).toBeLessThanOrEqual(2.4);types.add(e.hazard.type);expect(e.hazard.onsetTime).toBeGreaterThan(lastOnset+4.7);lastOnset=e.hazard.onsetTime;}
  }
  expect(types).toEqual(new Set(['people','step','stop','door','train']));
 },30_000);
 it('one actual empty cup names that cup without wiping the other cups; terminal events deduplicate and reset removes extra cups',()=>{
  const events:CoffeeEvent[]=[];const run=triple(3,events);run.setInput(1);
  for(let n=0;n<90/DT&&run.snapshot().alive;n++)run.step(DT);const result=run.result()!;expect(result).not.toBeNull();expect(result.cups[result.emptyCupId].remaining).toBe(0);expect(result.emptyCupName).toBe(result.cups[result.emptyCupId].name);expect(result.cups.some(c=>c.remaining>0)).toBe(true);expect(result.reason).toContain(result.emptyCupName);
  const ended=run.inspection();for(let n=0;n<30;n++){run.step(.05);expect(run.tap(-1)).toBe(false);}expect(run.inspection()).toEqual(ended);expect(events.filter(event=>event.type==='empty')).toHaveLength(1);result.cups[0].remaining=-999;expect(run.result()!.cups[0].remaining).toBeGreaterThanOrEqual(0);
  run.start();expect(run.snapshot()).toMatchObject({distance:0,score:0,time:0,cupCount:1,multiplier:1,pending:null,input:0});expect(run.snapshot().cups[0].remaining).toBe(100);
 });
});
