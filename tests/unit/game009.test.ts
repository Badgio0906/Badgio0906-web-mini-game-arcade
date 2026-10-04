import { describe,expect,it } from 'vitest';
import { StampRun,matchesRequest,calculateDeskLayout,deadlineAt } from '../../src/games/game009/StampRun';
import type { DeskObject,StampEvent,StampRequest } from '../../src/games/game009/contracts';
const seeded=(seed:number)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function start(seed=1,events:StampEvent[]=[]){const run=new StampRun(event=>events.push(event),seeded(seed));run.start();return run;}
function advance(run:StampRun){for(let n=0;n<100&&run.snapshot().phase==='feedback';n++)run.step(.01);expect(['searching','choice']).toContain(run.snapshot().phase);}
function correct(run:StampRun){const s=run.inspection();expect(s.matchingIds.length).toBeGreaterThan(0);expect(run.pick(s.matchingIds[0])).toBe(true);advance(run);}
function five(run:StampRun){for(let n=0;n<5;n++)correct(run);expect(run.snapshot().pending).toBe('cleanup');}

describe('Stamp visible matching, real desk geometry and cleanup choice',()=>{
 it('all four requested variants match only their color AND shape, and tools cannot masquerade as matching stamps',()=>{
  let id=0;for(const color of['red','blue']as const)for(const shape of['round','square']as const){const request:StampRequest={color,shape,text:'visible target'};
   for(const otherColor of['red','blue']as const)for(const otherShape of['round','square']as const){const object:DeskObject={id:id++,kind:'stamp',color:otherColor,shape:otherShape,rotation:6,stackCount:1,placement:0};expect(matchesRequest(object,request)).toBe(otherColor===color&&otherShape===shape);expect(matchesRequest({...object,kind:'paper'},request)).toBe(false);}
  }
 });
 it('any visible matching duplicate is accepted, including the later duplicate rather than a hidden designated ID',()=>{
  const seen=new Set<string>();let duplicates=0;
  for(let seed=1;seed<=5;seed++){const run=start(seed);for(let n=0;n<100;n++){if(run.snapshot().pending)run.choose('continue');const s=run.inspection();seen.add(`${s.request.color}:${s.request.shape}`);const actual=s.objects.filter(object=>matchesRequest(object,s.request)).map(object=>object.id);expect(s.matchingIds).toEqual(actual);const chosen=actual.at(-1)!;if(actual.length>1)duplicates++;expect(run.pick(chosen)).toBe(true);expect(run.snapshot().correct).toBe(n+1);advance(run);}}
  expect(duplicates).toBeGreaterThan(50);expect(seen).toEqual(new Set(['red:round','red:square','blue:round','blue:square']));
 });
 it('feedback ignores rapid/stale picks; a real wrong object or elapsed deadline ends exactly once with honest expected IDs',()=>{
  const events:StampEvent[]=[];const run=start(3,events);const first=run.inspection();run.pick(first.matchingIds[0]);for(const object of first.objects)expect(run.pick(object.id)).toBe(false);expect(run.snapshot().correct).toBe(1);advance(run);expect(run.pick(first.matchingIds[0])).toBe(false);expect(run.snapshot().alive).toBe(true);
  const now=run.inspection();const wrong=now.objects.find(object=>!matchesRequest(object,now.request))!;expect(run.pick(wrong.id)).toBe(true);const ending=run.inspection();expect(run.result()).toMatchObject({outcome:'wrong',correct:1,picked:{id:wrong.id},matchingIds:now.matchingIds});for(let n=0;n<50;n++){run.step(.05);expect(run.pick(now.matchingIds[0])).toBe(false);}expect(run.inspection()).toEqual(ending);expect(events.filter(event=>event.type==='mistake')).toHaveLength(1);
  run.start();for(let n=0;n<9/.05+2&&run.snapshot().alive;n++)run.step(.05);expect(run.result()).toMatchObject({outcome:'timeout',correct:0,picked:null});expect(events.filter(event=>event.type==='timeout')).toHaveLength(1);
 });
 it('five correct stamps freeze the desk/time; cleaning really reduces clutter and resets only the future multiplier',()=>{
  const events:StampEvent[]=[];const dirty=start(2,events),clean=start(2);five(dirty);five(clean);const frozen=dirty.inspection();expect(frozen).toMatchObject({correct:5,clutterLevel:5,multiplier:1,phase:'choice',alive:true});
  for(let n=0;n<100;n++){dirty.step(.05);expect(dirty.pick(frozen.matchingIds[0])).toBe(false);}expect(dirty.inspection()).toEqual(frozen);expect(dirty.result()).toBeNull();
  expect(dirty.choose('continue')).toBe(true);expect(dirty.choose('clean')).toBe(false);expect(clean.choose('clean')).toBe(true);expect(dirty.snapshot()).toMatchObject({score:frozen.score,clutterLevel:8,multiplier:1.25});expect(clean.snapshot()).toMatchObject({score:frozen.score,clutterLevel:0,multiplier:1});expect(dirty.snapshot().clutterCount).toBeGreaterThan(clean.snapshot().clutterCount);expect(dirty.snapshot().objects.length).toBeGreaterThan(clean.snapshot().objects.length);
  const prior=dirty.snapshot().score;correct(dirty);expect(dirty.snapshot().score-prior).toBe(188);for(let n=0;n<4;n++)correct(dirty);const beforeClean=dirty.snapshot();expect(dirty.choose('clean')).toBe(true);expect(dirty.snapshot().score).toBe(beforeClean.score);expect(dirty.snapshot().clutterLevel).toBe(beforeClean.clutterLevel-6);expect(dirty.snapshot().multiplier).toBe(1);const old=dirty.snapshot().score;correct(dirty);expect(dirty.snapshot().score-old).toBe(150);expect(events.filter(event=>event.type==='milestone')).toHaveLength(2);expect(events.filter(event=>event.type==='choice')).toHaveLength(2);
 });
 it('native pixel hit rectangles remain large, inside the desk and pairwise nonoverlapping even when their inner art rotates',()=>{
  const run=start();for(let n=0;n<80;n++){if(run.snapshot().pending)run.choose('continue');correct(run);}if(run.snapshot().pending)run.choose('continue');const objects=run.snapshot().objects;const original=structuredClone(objects);expect(objects).toHaveLength(12);
  for(const width of[92,220,280,300,320,390,548,600,1024,1440,1920]){const layout=calculateDeskLayout(objects,width);expect(layout.bounds).toHaveLength(objects.length);if(width>=280&&width<=390)expect(layout.height).toBeLessThanOrEqual(260);if(width===548)expect(layout.height).toBeLessThanOrEqual(180);for(const b of layout.bounds){expect(b.width).toBeGreaterThanOrEqual(64);expect(b.height).toBeGreaterThanOrEqual(72);expect(b.left).toBeGreaterThanOrEqual(0);expect(b.top).toBeGreaterThanOrEqual(0);expect(b.left+b.width).toBeLessThanOrEqual(width);expect(b.top+b.height).toBeLessThanOrEqual(layout.height);}for(let i=0;i<layout.bounds.length;i++)for(let j=i+1;j<layout.bounds.length;j++){const a=layout.bounds[i],b=layout.bounds[j];const gapX=Math.max(b.left-a.left-a.width,a.left-b.left-b.width);const gapY=Math.max(b.top-a.top-a.height,a.top-b.top-b.height);expect(Math.max(gapX,gapY)).toBeGreaterThanOrEqual(2-1e-8);}}
  expect(objects).toEqual(original);
 });
 it('speed bonus uses active search time, deadlines have a floor, and dirty-growth score/memory remain bounded over1000 picks',()=>{
  const quick=start(),slow=start();const first=slow.snapshot();for(let n=0;n<90;n++)slow.step(.05);quick.pick(quick.inspection().matchingIds[0]);slow.pick(slow.inspection().matchingIds[0]);expect(quick.snapshot().lastPoints).toBe(150);expect(slow.snapshot().lastPoints).toBeGreaterThanOrEqual(124);expect(slow.snapshot().lastPoints).toBeLessThanOrEqual(125);expect(first.deadline).toBe(9);expect(deadlineAt(1000)).toBe(4.5);
  const events:StampEvent[]=[];const run=start(5,events);let maxCount=0;
  for(let n=0;n<1000;n++){if(run.snapshot().pending)run.choose('continue');correct(run);const s=run.snapshot();maxCount=Math.max(maxCount,s.objectCount);expect(s.objects.length).toBeLessThanOrEqual(12);expect(s.objectCount).toBe(s.objects.reduce((sum,object)=>sum+object.stackCount,0));expect(s.clutterLevel).toBeLessThanOrEqual(24);expect(s.multiplier).toBeLessThanOrEqual(3);}
  expect(maxCount).toBe(30);expect(run.snapshot()).toMatchObject({correct:1000,clutterLevel:24,multiplier:3,alive:true});expect(events.filter(event=>event.type==='milestone')).toHaveLength(200);expect(events.filter(event=>event.type==='choice')).toHaveLength(199);
 });
 it('read-only copies cannot change target/desk/result and retry clears multiplier, growth and stale IDs',()=>{
  const run=start();const initial=run.inspection();const copy=run.inspection();copy.request.color=copy.request.color==='red'?'blue':'red';copy.objects[0].stackCount=999;copy.matchingIds.length=0;expect(run.inspection()).toEqual(initial);
  for(const dt of[NaN,Infinity,-1,0])run.step(dt);expect(run.inspection()).toEqual(initial);run.step(99);expect(run.snapshot().time).toBeCloseTo(.05,8);run.pick(run.snapshot().objects.find(object=>!matchesRequest(object,run.snapshot().request))!.id);const result=run.result()!;result.request.text='changed';result.matchingIds.length=0;expect(run.result()!.request.text).not.toBe('changed');expect(run.result()!.matchingIds.length).toBeGreaterThan(0);
  run.start();expect(run.snapshot()).toMatchObject({correct:0,score:0,time:0,multiplier:1,clutterLevel:0,pending:null});expect(run.snapshot().objects).toHaveLength(7);
 });
});
