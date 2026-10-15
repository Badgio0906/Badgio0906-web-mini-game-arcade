import {describe,it,expect} from 'vitest';
import {createSnake,step,enqueue,regenerateBoard,advanceTransition,reachableCells,TRANSITION_MS,type SnakeState} from '../../src/games/game024/model';
import {blankSave,validateSave,SnakeSaveStore,SAVE_KEY,LEGACY_SAVE_KEY} from '../../src/games/game024/save';
const eating=(s:SnakeState)=>({...s,food:{x:s.body[0].x+1,y:s.body[0].y}});
const active=(snapshot:SnakeState)=>({...blankSave(),snapshot,run:{id:null,active:true,reported:false,freshFoods:0}});
describe('Game024 seeded shifting boards',()=>{
  for(const threshold of [3,4,5,6,7])it(`changes after exactly ${threshold} foods and resamples`,()=>{
    let s={...createSnake(24),untilChange:threshold};
    for(let n=1;n<=threshold;n++){s=step(eating(s));expect(s.changes).toBe(n===threshold?1:0);expect(s.transitionMs).toBe(n===threshold?TRANSITION_MS:0);}
    expect(s.untilChange).toBeGreaterThanOrEqual(3);expect(s.untilChange).toBeLessThanOrEqual(7);expect(s.walls.length).toBeGreaterThan(0);
    expect(s.queue).toEqual([]);expect(enqueue(s,'up')).toBe(s);expect(step(s)).toBe(s);
  });
  it('resamples all five thresholds repeatedly instead of replaying a fixed layout order',()=>{
    const initial=new Set<number>(),next=new Set<number>(),layouts=new Set<string>();
    for(let seed=0;seed<250;seed++){
      let s=createSnake(seed);initial.add(s.untilChange);s=regenerateBoard(s);next.add(s.untilChange);layouts.add(JSON.stringify(s.walls));
      expect(s.walls.every(w=>!s.body.some(b=>b.x===w.x&&b.y===w.y))).toBe(true);
      expect(reachableCells(s.body,s.size,s.walls)).toContainEqual(s.food);
      for(let x=11;x<=13;x++)expect(s.walls).not.toContainEqual({x,y:10});
      const second=regenerateBoard(s);expect(second.untilChange).toBeGreaterThanOrEqual(3);expect(second.untilChange).toBeLessThanOrEqual(7);
      expect(second.walls).not.toEqual(s.walls);
    }
    expect([...initial].sort()).toEqual([3,4,5,6,7]);expect([...next].sort()).toEqual([3,4,5,6,7]);expect(layouts.size).toBeGreaterThan(100);
  });
  it('a real obstacle has the same wall collision as the perimeter',()=>{
    const s={...createSnake(1),walls:[{x:11,y:10}]};expect(step(s).outcome).toBe('wall');
  });
  it('clears stale turns and supplies a legal fresh corner exit after animation',()=>{
    const s=regenerateBoard({...createSnake(1),body:[{x:19,y:10},{x:18,y:10},{x:17,y:10}],queue:['down'],food:{x:19,y:11}});
    expect(s.queue).toEqual([]);const resumed=advanceTransition(s,TRANSITION_MS);expect(resumed.transitionExit).toBe('up');expect(step({...resumed,queue:[]}).outcome).toBe('playing');
  });
  it('bounded generation removes walls for long snakes, retains the final free cell and clears all 400',()=>{
    const body=[];for(let y=0;y<20;y++)for(let i=0;i<20;i++){const x=y%2?19-i:i;if(x||y)body.push({x,y});}
    const s=regenerateBoard({...createSnake(7),body,foods:396,direction:'left',food:{x:0,y:0},untilChange:1});
    expect(s.walls).toEqual([]);const complete=step(advanceTransition(s,TRANSITION_MS));expect(complete.outcome).toBe('clear');expect(complete.body).toHaveLength(400);expect(complete.food).toBeNull();
  });
  it('round-trips the exact animation remainder, layout, count and random continuation',()=>{
    let s=advanceTransition(regenerateBoard(createSnake(77)),220);const saved=active(s);expect(validateSave(saved)).toEqual(saved);
    const restored=validateSave(JSON.parse(JSON.stringify(saved)))!.snapshot!;expect(restored.transitionMs).toBe(430);expect(regenerateBoard(restored)).toEqual(regenerateBoard(s));
    const ready=advanceTransition(restored,430);expect(ready.transitionMs).toBe(0);expect(step(ready).ticks).toBe(s.ticks+1);
  });
  it('rejects overlapping walls and impossible random/animation values',()=>{
    for(const patch of [{walls:[{x:10,y:10}]},{untilChange:8},{transitionMs:651},{walls:[{x:30,y:0}]}])expect(validateSave(active({...createSnake(7),...patch}))).toBeNull();
  });
  it('keeps old snapshots/BEST bytes under their original key and separates new BEST',()=>{
    const raw=JSON.stringify({game_id:'game024',rules_version:'1',stats:{best:{4:90,6:60,8:40}},snapshot:{legacy:'untouched'}});
    const data=new Map([[LEGACY_SAVE_KEY,raw]]);const store=new SnakeSaveStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);}});
    expect(store.legacyBest()).toEqual({4:90,6:60,8:40});expect(store.read().stats.best[4]).toBe(0);store.write(active(createSnake(9)));expect(data.get(LEGACY_SAVE_KEY)).toBe(raw);expect(data.has(SAVE_KEY)).toBe(true);
  });
});
