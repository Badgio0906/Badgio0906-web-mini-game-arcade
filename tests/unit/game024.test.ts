import { describe,it,expect } from 'vitest';
import { createSnake,enqueue,step,placeFood, type SnakeState } from '../../src/games/game024/model';
import { SnakeClock } from '../../src/games/game024/clock';
import { blankSave,validateSave,SnakeSaveStore,captureSave } from '../../src/games/game024/save';
const fresh = () => createSnake(24);
const fixture = (patch:Partial<SnakeState>) => ({...fresh(),...patch});
describe('Game024 classic rules',()=>{
  it('starts with length 3 and seeded free food',()=>{ const s=fresh(); expect(s.size).toBe(20); expect(s.body).toHaveLength(3); expect(s).toEqual(fresh()); expect(s.body).not.toContainEqual(s.food); });
  it('forbids immediate reverse and duplicate direction',()=>{ const s=fresh(); expect(enqueue(s,'left')).toBe(s); expect(enqueue(s,'right')).toBe(s); });
  it('right-up-left is two ticks; validates against queue tail and bounds queue',()=>{
    let s=enqueue(enqueue(fresh(),'up'),'left'); expect(s.queue).toEqual(['up','left']); expect(enqueue(s,'down')).toBe(s);
    expect(enqueue(enqueue(fresh(),'up'),'down').queue).toEqual(['up']);
    s=step(s); expect(s.body[0]).toEqual({x:10,y:9}); expect(s.direction).toBe('up');
    s=step(s); expect(s.body[0]).toEqual({x:9,y:9}); expect(s.direction).toBe('left');
  });
  it('wall ends once without wrapping or modifying body',()=>{const s=fixture({body:[{x:19,y:10},{x:18,y:10},{x:17,y:10}]}); const dead=step(s); expect(dead.outcome).toBe('wall'); expect(dead.body).toEqual(s.body); expect(step(dead)).toBe(dead); });
  it('self collision ends while vacating tail is legal',()=>{
    const body=[{x:1,y:1},{x:1,y:2},{x:0,y:2},{x:0,y:1}];
    expect(step(fixture({body,direction:'left'})).outcome).toBe('playing');
    expect(step(fixture({body,direction:'down'})).outcome).toBe('self');
  });
  it('growth retains the tail and adds exactly one',()=>{const s=fixture({food:{x:11,y:10}}), n=step(s); expect(n.body).toHaveLength(4); expect(n.body.at(-1)).toEqual(s.body.at(-1)); expect(n.foods).toBe(1); expect(n.body).not.toContainEqual(n.food); });
  it('remaining one cell is bounded, dense fill clears with no food',()=>{
    const body=[]; for(let y=0;y<20;y++) for(let i=0;i<20;i++){ const x=y%2?19-i:i; if(x||y)body.push({x,y}); }
    expect(placeFood(body,20,1).food).toEqual({x:0,y:0});
    const s=fixture({body,food:{x:0,y:0},direction:'left',foods:396}); const n=step(s);
    expect(n.outcome).toBe('clear');expect(n.body).toHaveLength(400);expect(n.food).toBeNull();expect(step(n)).toBe(n);
    expect(placeFood(n.body,20,1).food).toBeNull();
  });
  it('food never uses occupied cells over many seeds',()=>{for(let seed=0;seed<300;seed++){const s=createSnake(seed);expect(s.body).not.toContainEqual(s.food);}});
});
describe('Game024 fixed clock',()=>{
  for(const hz of [30,60,120]) for(const speed of [4,6,8] as const) it(`${speed} cells/sec at ${hz}Hz`,()=>{const c=new SnakeClock(speed);let ticks=0;c.resume();for(let i=0;i<=hz*10;i++)c.frame(i*1000/hz,()=>{ticks++;return true;});expect(ticks).toBe(speed*10);expect(c.elapsed).toBeCloseTo(10000);});
  it('pause/resume ignores inactive wall time and retains partial tick',()=>{const c=new SnakeClock(4);let ticks=0;c.resume();c.frame(0,()=>true);c.frame(100,()=>true);c.pause();c.frame(5000,()=>true);c.resume();c.frame(10000,()=>true);c.frame(10150,()=>{ticks++;return true;});expect(ticks).toBe(1);expect(c.elapsed).toBe(250);});
  it('long frames pause with zero backlog movement; restart resets',()=>{const c=new SnakeClock(8);let ticks=0;c.resume();c.frame(0,()=>true);expect(c.frame(5000,()=>{ticks++;return true;})).toBe('gap');expect(ticks).toBe(0);c.resume();c.frame(9000,()=>true);c.frame(9125,()=>{ticks++;return true;});expect(ticks).toBe(1);c.restart();expect(c.elapsed).toBe(0);expect(c.remainder).toBe(0);});
  it('a slow normal frame steps sequentially and stops immediately at death',()=>{const c=new SnakeClock(8);let ticks=0;c.resume();c.frame(0,()=>true);c.frame(500,()=>{ticks++;return ticks<2;});expect(ticks).toBe(2);c.frame(600,()=>{ticks++;return true;});expect(ticks).toBe(2);});

});
describe('Game024 atomic save boundary',()=>{
  const active=()=>({...blankSave(),snapshot:fresh(),run:{id:'00000000-0000-4000-8000-000000000024',active:true,reported:false,freshFoods:0}});
  it('round-trips valid state without changing reported statistics',()=>{expect(validateSave(active())).toEqual(active());});
  it('rejects corrupt identity, body, food, queue, speed, clock, stats, flag',()=>{
    const cases=[(s:any)=>s.game_id='game020',(s:any)=>s.rules_version='2',(s:any)=>s.snapshot.body[1]=s.snapshot.body[0],(s:any)=>s.snapshot.body[1]={x:0,y:0},(s:any)=>s.snapshot.food=s.snapshot.body[0],(s:any)=>s.snapshot.direction='up',(s:any)=>s.run.id='not-an-analytics-id',(s:any)=>s.snapshot.queue=['left'],(s:any)=>s.snapshot.queue=['up','left','down'],(s:any)=>s.speed=5,(s:any)=>s.clock.remainder=250,(s:any)=>s.clock.elapsed=-1,(s:any)=>s.stats.best[4]=400,(s:any)=>s.run.reported=true];
    for(const mutate of cases){const s=active();mutate(s);expect(validateSave(s)).toBeNull();}
  });
  it('denied writes stay playable and use latest memory, not stale backend',()=>{const store=new SnakeSaveStore({getItem:()=>JSON.stringify(blankSave()),setItem:()=>{throw new Error('denied');}});store.write(active());expect(store.read()).toEqual(active());});
  it('late pagehide after Portal quit retains BEST/stats and cannot reactivate snapshot',()=>{
    const ended={...active(),snapshot:null,run:{...active().run,active:false,reported:true},stats:{best:{4:12,6:7,8:3},runs:2,clears:0}};
    const captured=captureSave(ended,fresh(),4,{remainder:10,elapsed:3000});
    expect(captured.snapshot).toBeNull();expect(validateSave(captured)).toEqual(captured);
    const store=new SnakeSaveStore({getItem:()=>null,setItem:()=>{}});store.write(captured);expect(store.read().stats).toEqual(ended.stats);expect(store.read().run.reported).toBe(true);
  });
  it('early collision in a slow frame saves a valid terminal result and retains BEST/runs on reload',()=>{
    let snake=fixture({body:[{x:19,y:10},{x:18,y:10},{x:17,y:10}],food:{x:0,y:0}});
    let saved={...active(),speed:8 as const,snapshot:snake,stats:{best:{4:9,6:7,8:12},runs:3,clears:0}};
    let raw:string|null=null;const backend={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
    const store=new SnakeSaveStore(backend),clock=new SnakeClock(8);let ticks=0;
    clock.resume();clock.frame(0,()=>true);clock.frame(500,()=>{
      ticks++;snake=step(snake);
      // main.tick persists, then result records once and persists during this callback.
      saved=captureSave(saved,snake,8,{remainder:clock.remainder,elapsed:clock.elapsed}) as typeof saved;store.write(saved);
      if(snake.outcome!=='playing'){
        saved.run.active=false;saved.run.reported=true;saved.stats.runs++;
        saved=captureSave(saved,snake,8,{remainder:clock.remainder,elapsed:clock.elapsed}) as typeof saved;store.write(saved);
        clock.pause();saved=captureSave(saved,snake,8,{remainder:clock.remainder,elapsed:clock.elapsed}) as typeof saved;store.write(saved);return false;
      }return true;
    });
    expect(ticks).toBe(1);expect(snake.outcome).toBe('wall');expect(clock.remainder).toBe(375);
    expect(saved.clock.remainder).toBe(0);expect(validateSave(saved)).toEqual(saved);
    const restored=new SnakeSaveStore(backend).read();expect(restored.snapshot?.outcome).toBe('wall');
    expect(restored.stats).toEqual({best:{4:9,6:7,8:12},runs:4,clears:0});
    expect(restored.run.active).toBe(false);expect(restored.run.reported).toBe(true);
  });
  it('invalid JSON falls back safely',()=>{const store=new SnakeSaveStore({getItem:()=>'{broken',setItem:()=>{}});expect(store.read()).toEqual(blankSave());});
});
