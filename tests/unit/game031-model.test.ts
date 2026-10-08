import {describe,it,expect} from 'vitest';
import {BLOCKS} from '../../src/games/game031/Blocks';
import {World,protectedAt,spawnFor} from '../../src/games/game031/World';
import {Engine} from '../../src/games/game031/Engine';
import {freshPlayer,stepPlayer,bodyIntersects,safePlayer} from '../../src/games/game031/Physics';
import {raycast,lookDirection} from '../../src/games/game031/Ray';
const prototype={x:32,y:32,z:32};
const idle={forward:0,right:0,jump:false,dig:false};
describe('Game031 voxel model',()=>{
  it('keeps stable block IDs and defined material roles',()=>{
    expect(BLOCKS.map(b=>b.id)).toEqual([0,1,2,3,4,5,6,7,8,9]);
    expect(BLOCKS.filter(b=>b.placeable)).toHaveLength(8);expect(BLOCKS[9]?.breakable).toBe(false);
  });
  it('generates the final X128 Y64 Z128 deterministically, with all materials and cave sizes',()=>{
    const a=new World(314159,{x:128,y:64,z:128},'a'),b=new World(314159,{x:128,y:64,z:128},'b');
    const types=new Set<number>();let air=0,underground=0,mismatches=0;
    for(let y=0;y<64;y++)for(let z=0;z<128;z++)for(let x=0;x<128;x++){
      if(a.get(x,y,z)!==b.baseAt(x,y,z))mismatches++;types.add(a.get(x,y,z));
      if(y<44&&x>0&&x<127&&z>0&&z<127){underground++;if(a.get(x,y,z)===0)air++;}
    }
    expect(mismatches).toBe(0);
    expect([...types].sort((x,y)=>x-y)).toEqual([0,1,2,3,4,5,6,7,8,9]);
    expect(new Set(a.caves.map(c=>c.kind))).toEqual(new Set(['small','medium','large']));
    expect(air/underground).toBeLessThan(.15);expect(air).toBeGreaterThan(100);
    expect(a.referenceHeight).toBe(48);expect(a.spawn.y).toBe(49);
  });
  it('supports the 32 cube prototype and independent small practice world',()=>{
    for(const dimensions of [prototype,{x:12,y:8,z:12}]){
      const world=new World(7,dimensions);const player=freshPlayer(world);
      expect(world.get(Math.floor(player.position.x),Math.floor(player.position.y)-1,Math.floor(player.position.z))).toBe(9);
      expect(world.get(Math.floor(player.position.x),Math.floor(player.position.y),Math.floor(player.position.z))).toBe(0);
      expect(spawnFor(7,dimensions)).toEqual(world.spawn);
    }
  });
  it('protects finite borders and the return platform; restored edits validate before mutation',()=>{
    const world=new World(5,prototype);
    expect(world.get(-1,12,4)).toBe(9);expect(world.set(0,15,10,0)).toBe(false);
    expect(world.set(Math.floor(world.spawn.x),world.referenceHeight,Math.floor(world.spawn.z),0)).toBe(false);
    expect(protectedAt(5,prototype,Math.floor(world.spawn.x),world.referenceHeight+2,Math.floor(world.spawn.z))).toBe(true);
    expect(()=>world.applyDiffs([{key:'1,1,1',cells:[0,0,4096,1]}])).toThrow();
    expect(world.revision).toBe(0);
  });
  it('round trips final-state diffs and rejects stale chunk completion',()=>{
    const a=new World(4,prototype,'a'),b=new World(4,prototype,'b');
    const original=a.get(15,12,15);expect(original).not.toBe(0);a.dirty.clear();
    expect(a.set(15,12,15,0)).toBe(true);expect(a.dirty).toContain('1,0,0');expect(a.dirty).toContain('0,0,1');
    const revision=a.chunkRevisions.get('0,0,0')!;
    expect(a.clearDirty('0,0,0',revision-1)).toBe(false);
    b.applyDiffs(a.exportDiffs());expect(b.get(15,12,15)).toBe(0);
    a.set(15,12,15,original);expect(a.exportDiffs()).toEqual([]);
    expect(a.clearDirty('0,0,0',a.chunkRevisions.get('0,0,0')!)).toBe(true);
  });
  it('selects the nearest voxel and exact outward face, including negative direction and chunk borders',()=>{
    const w=new World(8,prototype);
    const hit=raycast(w,{x:10.5,y:24.5,z:10.5},{x:0,y:-1,z:0});
    expect(hit?.y).toBe(19);expect(hit?.normal).toEqual({x:0,y:1,z:0});
    expect(raycast(w,{x:10.5,y:30.5,z:10.5},{x:0,y:-1,z:0},2)).toBeNull();
    expect(lookDirection(0,0)).toEqual({x:-0,y:0,z:-1});
    expect(raycast(w,{x:-1,y:20,z:2},{x:1,y:0,z:0})).toBeNull();
  });
  it('mines and places atomically with conservation and no hitch multi-mine',()=>{
    const w=new World(9,prototype);const e=new Engine(w);
    const first={...e.target!};expect(first.block).toBe(1);
    e.update(4,{...idle,dig:true});expect(e.stats.mined).toBe(0);
    for(let i=0;i<5;i++)e.update(.05,{...idle,dig:true});
    expect(e.stats.mined).toBe(1);expect(e.inventory[1]).toBe(1);expect(w.get(first.x,first.y,first.z)).toBe(0);
    e.selected=1;expect(e.place().ok).toBe(true);expect(e.inventory[1]).toBe(0);expect(w.get(first.x,first.y,first.z)).toBe(1);
    expect(e.place().ok).toBe(false);expect(e.inventory[1]).toBe(0);
    e.resetInput();for(let i=0;i<7;i++)e.update(.05,{...idle,dig:true});
    expect(e.stats.found).toEqual([1]);expect(e.stats.mined).toBe(2);expect(e.stats.placed).toBe(1);
  });
  it('resets mining progress after aim change or release',()=>{
    const e=new Engine(new World(2,prototype));e.update(.1,{...idle,dig:true});expect(e.digProgress).toBeGreaterThan(0);
    e.player.yaw=Math.PI;e.update(.01,{...idle,dig:true});expect(e.digProgress).toBe(0);
    e.player.yaw=0;e.update(.1,{...idle,dig:true});e.update(.01,idle);expect(e.digProgress).toBe(0);
  });
  it('holds floors, slides along walls, jumps one block and prevents hitch tunneling',()=>{
    const w=new World(3,prototype);const p=freshPlayer(w);
    for(let i=0;i<120;i++)stepPlayer(w,p,{forward:0,right:0,jump:false},1/120);
    expect(p.position.y).toBeCloseTo(w.spawn.y,5);expect(p.grounded).toBe(true);
    w.set(18,20,20,3);w.set(18,21,20,3);
    stepPlayer(w,p,{forward:0,right:1,jump:false},10);expect(p.position.x).toBeLessThan(17.3);
    let highest=p.position.y;for(let i=0;i<80;i++){stepPlayer(w,p,{forward:0,right:0,jump:i===0},1/120);highest=Math.max(highest,p.position.y);}
    expect(highest-w.spawn.y).toBeGreaterThan(1);expect(bodyIntersects(p,Math.floor(p.position.x),Math.floor(p.position.y),Math.floor(p.position.z))).toBe(true);
    expect(safePlayer(w,{...p,position:{x:-2,y:0,z:0}}).position).toEqual(w.spawn);
  });

  it('rejects placement through the hidden body without losing inventory',()=>{
    const e=new Engine(new World(15,prototype));
    e.player.position.x+=4;e.player.pitch=-1.4;e.inventory[3]=2;e.selected=3;
    expect(e.place()).toEqual({ok:false,reason:'自分の身体に重なる場所です'});
    expect(e.inventory[3]).toBe(2);expect(e.stats.placed).toBe(0);
    e.player.position.y+=.7;e.player.velocity.y=2;
    expect(e.place().ok).toBe(false);expect(e.inventory[3]).toBe(2);
  });
  it('falls after the current canonical floor voxel is mined, before any render job',()=>{
    const e=new Engine(new World(16,prototype));e.player.position.x+=4;e.player.pitch=-1.4;
    for(let i=0;i<7;i++)e.update(.05,{...idle,dig:true});
    expect(e.stats.mined).toBe(1);
    const previous=e.player.position.y;
    e.update(.1,idle);expect(e.player.position.y).toBeLessThan(previous);
    expect(e.inventory[1]).toBe(1);
  });
  it('conserves stock through repeated dig/place cycles and removes reverted final-state diffs',()=>{
    const e=new Engine(new World(17,prototype));
    for(let cycle=0;cycle<100;cycle++){
      for(let i=0;i<7;i++)e.update(.05,{...idle,dig:true});
      expect(e.inventory[1]).toBe(1);expect(e.place().ok).toBe(true);
      expect(e.inventory[1]).toBe(0);expect(e.world.exportDiffs()).toEqual([]);
    }
    expect(e.stats.mined).toBe(100);expect(e.stats.placed).toBe(100);expect(e.stats.found).toEqual([1]);
  });
  it('returns exact face coordinates in both directions at a chunk boundary',()=>{
    const w=new World(18,prototype);w.set(15,24,10,3);
    const positive=raycast(w,{x:14,y:24.5,z:10.5},{x:1,y:0,z:0});
    expect(positive).toMatchObject({x:15,y:24,z:10,block:3,distance:1,normal:{x:-1,y:0,z:0}});
    const negative=raycast(w,{x:16,y:24.5,z:10.5},{x:-1,y:0,z:0});
    expect(negative).toMatchObject({x:15,y:24,z:10,block:3,normal:{x:1,y:0,z:0}});
    expect(negative?.distance).toBeCloseTo(0,12);
  });

  it('resolves a low ceiling and a full-height wall while preserving wall sliding',()=>{
    const w=new World(19,prototype),p=freshPlayer(w);p.position.x=20.5;
    for(let x=19;x<=21;x++)for(let z=19;z<=21;z++)w.set(x,22,z,3);
    let highest=p.position.y;
    for(let i=0;i<120;i++){stepPlayer(w,p,{forward:0,right:0,jump:i===0},1/120);highest=Math.max(highest,p.position.y);}
    expect(highest).toBeLessThanOrEqual(20.20001);expect(p.position.y).toBeCloseTo(20,5);
    for(let y=20;y<29;y++)for(let z=10;z<29;z++)w.set(22,y,z,3);
    for(let i=0;i<20;i++)stepPlayer(w,p,{forward:0,right:1,jump:false},10);
    expect(p.position.x).toBeCloseTo(21.7,5);
    const z=p.position.z;
    for(let i=0;i<30;i++)stepPlayer(w,p,{forward:1,right:1,jump:false},1/120);
    expect(p.position.z).toBeLessThan(z);expect(p.position.x).toBeCloseTo(21.7,5);
  });
  it('can jump onto a player-placed one-voxel step',()=>{
    const w=new World(20,prototype),p=freshPlayer(w);p.position.x=21;
    w.set(22,20,20,3);
    for(let i=0;i<36;i++)stepPlayer(w,p,{forward:0,right:1,jump:i===0},1/120);
    for(let i=0;i<70;i++)stepPlayer(w,p,{forward:0,right:0,jump:false},1/120);
    expect(p.position.x).toBeGreaterThan(22);expect(p.position.y).toBeCloseTo(21,5);expect(p.grounded).toBe(true);
  });
  it('recomputes stale displayed placement targets at action time',()=>{
    const e=new Engine(new World(21,prototype));e.inventory[3]=1;e.selected=3;
    e.target={x:100,y:100,z:100,block:3,normal:{x:0,y:1,z:0},distance:1};
    expect(e.place().ok).toBe(true);expect(e.inventory[3]).toBe(0);expect(e.stats.placed).toBe(1);
    expect(e.world.get(16,21,18)).toBe(3);
  });
  it('returns to the surface without changing inventory, terrain or statistics',()=>{
    const e=new Engine(new World(1,prototype));e.inventory[3]=15;e.stats.mined=10;
    e.world.set(4,12,4,0);const diffs=e.world.exportDiffs();e.player.velocity.y=-10;e.returnToSurface();
    expect(e.inventory[3]).toBe(15);expect(e.stats.mined).toBe(10);expect(e.world.exportDiffs()).toEqual(diffs);
    expect(e.player.velocity).toEqual({x:0,y:0,z:0});
  });
});
