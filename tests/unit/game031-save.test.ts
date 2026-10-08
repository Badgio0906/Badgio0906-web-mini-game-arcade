import { describe, expect, it, vi } from 'vitest';
import { MAX_BACKUP_BYTES, parseBackup, SaveStore, validateSnapshot } from '../../src/games/game031/Save';
import { type Snapshot } from '../../src/games/game031/Types';
import { World } from '../../src/games/game031/World';

function snapshot(count=0,dimensions={x:128,y:64,z:128}):Snapshot {
  const world=new World(3031,dimensions,'local-fixture');
  let changed=0;
  for(let y=2;y<dimensions.y-2&&changed<count;y++)for(let z=2;z<dimensions.z-2&&changed<count;z++)for(let x=2;x<dimensions.x-2&&changed<count;x++) {
    if(world.set(x,y,z,world.get(x,y,z)===0?2:0))changed++;
  }
  expect(changed).toBe(count);
  return {schemaVersion:1,generatorVersion:1,blockVersion:1,worldId:world.worldId,seed:world.seed,dimensions,revision:world.revision,
    savedAt:'2026-10-07T23:00:00.000Z',player:{position:{...world.spawn},velocity:{x:0,y:0,z:0},yaw:0,pitch:0,grounded:true},
    inventory:[0,count,0,0,0,0,0,0,0,0],selected:1,stats:{mined:count,placed:0,maxDepth:0,activeSeconds:12,found:count?[1]:[]},chunks:world.exportDiffs()};
}

/** A transaction-contract fixture, not a substitute for the native browser IndexedDB QA. */
function storageFixture(initial:unknown=null) {
  let committed=new Map<string,unknown>(initial===null?[]:[['current',structuredClone(initial)]]),failNext=false,denied=false;
  const calls:Array<{mode:string;key:string;operation:string}>=[];
  const db={objectStoreNames:{contains:()=>true},close:()=>{},onversionchange:null,
    transaction:(_store:string,mode:string)=>{
      const tx:any={oncomplete:null,onabort:null,onerror:null,error:null};
      const pending=new Map(committed);let changed=false,request:any;
      tx.objectStore=()=>({
        get:(key:string)=>{calls.push({mode,key,operation:'get'});request={result:structuredClone(committed.get(key)),onsuccess:null};return request;},
        put:(value:unknown,key:string)=>{calls.push({mode,key,operation:'put'});pending.set(key,structuredClone(value));changed=true;return {};},
        delete:(key:string)=>{calls.push({mode,key,operation:'delete'});pending.delete(key);changed=true;return {};},
      });
      queueMicrotask(()=>{
        if(failNext){failNext=false;tx.error=new DOMException('fixture quota','QuotaExceededError');tx.onabort?.();return;}
        if(request)request.onsuccess?.();
        if(changed)committed=pending;
        tx.oncomplete?.();
      });
      return tx;
    },
  };
  const factory={open:(name:string,version:number)=>{
    expect(name).toBe('game100garage-game031');expect(version).toBe(1);
    if(denied)throw new DOMException('fixture denied','SecurityError');
    const request:any={result:db,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};
    queueMicrotask(()=>request.onsuccess?.());return request;
  }} as unknown as IDBFactory;
  return {factory,calls,failNext:()=>{failNext=true;},deny:()=>{denied=true;},current:()=>structuredClone(committed.get('current')??null),metadata:()=>structuredClone(committed.get('record-current'))};
}

describe('Game031 coherent, versioned local save',()=>{
  it('commits lightweight portal metadata with the same world transaction, preserving it on failure and deleting both keys',async()=>{
    const f=storageFixture(),store=new SaveStore(f.factory),first=snapshot(1),next=snapshot(2);
    await store.save(first);
    expect(f.metadata()).toEqual({gameId:'game031',rulesetId:'1',schemaVersion:1,generatorVersion:1,blockVersion:1,revision:first.revision,savedAt:first.savedAt,mined:1,placed:0,maxDepth:0,activeSeconds:12});
    expect(Object.keys(f.metadata() as object)).not.toContain('seed');expect(Object.keys(f.metadata() as object)).not.toContain('worldId');
    f.failNext();await expect(store.save(next)).rejects.toMatchObject({code:'quota_exceeded'});
    expect(f.current()).toEqual(first);expect((f.metadata() as {mined:number}).mined).toBe(1);
    await store.remove();expect(f.current()).toBeNull();expect(f.metadata()).toBeUndefined();
  });
  it('notifies local portal listeners only after commit, with no saved-world detail',async()=>{
    const events:Event[]=[],f=storageFixture(),store=new SaveStore(f.factory);
    vi.stubGlobal('window',{dispatchEvent:(event:Event)=>{events.push(event);return true;}});
    try {
      await store.save(snapshot(1));expect(events.map(e=>e.type)).toEqual(['game100:records:changed']);
      expect('detail' in events[0]).toBe(false);
      f.failNext();await expect(store.save(snapshot(2))).rejects.toMatchObject({code:'quota_exceeded'});expect(events).toHaveLength(1);
      await store.remove();expect(events).toHaveLength(2);
    }finally{vi.unstubAllGlobals();}
  });
  it('an optional notification failure cannot fail a successfully committed world',async()=>{
    const f=storageFixture(),store=new SaveStore(f.factory),s=snapshot(1);
    vi.stubGlobal('window',{dispatchEvent:()=>{throw new Error('fixture listener failure');}});
    try {await expect(store.save(s)).resolves.toBeUndefined();expect(await store.load()).toEqual(s);}
    finally{vi.unstubAllGlobals();}
  });
  it.each([1000,5000,10000])('restores %i final voxel differences and associated inventory exactly (synthetic fixture)',count=>{
    const source=snapshot(count),restored=parseBackup(JSON.stringify(source));
    expect(restored).toEqual(source);
    const world=new World(restored.seed,restored.dimensions,restored.worldId);world.applyDiffs(restored.chunks);
    expect(world.exportDiffs()).toEqual(source.chunks);
    expect(restored.chunks.reduce((n,c)=>n+c.cells.length/2,0)).toBe(count);
  });
  it('copies a snapshot before async work; later edits cannot mutate the captured inventory/terrain',async()=>{
    const f=storageFixture(),store=new SaveStore(f.factory),s=snapshot(1),expected=structuredClone(s);
    const saving=store.save(s);s.inventory[1]=999;s.chunks[0]!.cells[1]=8;s.stats.mined=999;
    await saving;expect(await store.load()).toEqual(expected);
    expect(f.calls.filter(c=>c.operation==='put')).toEqual([{mode:'readwrite',key:'current',operation:'put'},{mode:'readwrite',key:'record-current',operation:'put'}]);
  });
  it('failed transaction preserves the last successful coherent snapshot; later explicit save can succeed',async()=>{
    const old=snapshot(1),next=snapshot(2),f=storageFixture(old),store=new SaveStore(f.factory);
    f.failNext();await expect(store.save(next)).rejects.toMatchObject({code:'quota_exceeded'});
    expect(f.current()).toEqual(old);expect(await store.load()).toEqual(old);
    await store.save(next);expect(await store.load()).toEqual(next);
  });
  it('read failure rejects instead of reporting missing/saved data',async()=>{
    const f=storageFixture(snapshot(1)),store=new SaveStore(f.factory);f.failNext();
    await expect(store.load()).rejects.toMatchObject({code:'quota_exceeded'});
  });
  it('save denial rejects and does not pretend to save or alter the memory snapshot',async()=>{
    const f=storageFixture(),store=new SaveStore(f.factory),s=snapshot();f.deny();
    await expect(store.save(s)).rejects.toMatchObject({code:'storage_denied'});expect(f.current()).toBeNull();
  });
  it('absence of IndexedDB is a readable failure',async()=>{
    await expect(new SaveStore().load()).rejects.toMatchObject({code:'storage_unavailable'});
  });
  it('an unsupported stored generator stays intact and can still be exported',async()=>{
    const raw={...snapshot(),generatorVersion:2},f=storageFixture(raw),store=new SaveStore(f.factory);
    await expect(store.load()).rejects.toMatchObject({code:'unsupported_generator'});
    expect(JSON.parse((await store.exportStoredBackup())!)).toEqual(raw);expect(f.current()).toEqual(raw);
  });
  it('failed import validation never replaces the existing stored world',async()=>{
    const old=snapshot(1),f=storageFixture(old),store=new SaveStore(f.factory);
    await expect(store.save({...snapshot(2),selected:99})).rejects.toMatchObject({code:'invalid_save'});
    expect(await store.load()).toEqual(old);expect(f.calls.some(c=>c.operation==='put')).toBe(false);
  });
  it('supports prototype32³ but refuses practice12×8×12 saves',()=>{
    expect(validateSnapshot(snapshot(20,{x:32,y:32,z:32})).dimensions).toEqual({x:32,y:32,z:32});
    expect(()=>validateSnapshot({...snapshot(),dimensions:{x:12,y:8,z:12}})).toThrow('unsupported_dimensions');
  });
  it('retains finite invalid restored positions for safe-return handling instead of discarding a world',()=>{
    const s=snapshot();s.player.position={x:-20,y:200,z:999};expect(validateSnapshot(s).player.position).toEqual(s.player.position);
  });
  it.each([
    (s:any)=>{s.seed=-1;},(s:any)=>{s.seed=2**32;},(s:any)=>{s.revision=NaN;},
    (s:any)=>{s.schemaVersion=2;},(s:any)=>{s.blockVersion=2;},(s:any)=>{s.dimensions.y=128;},
    (s:any)=>{s.inventory[1]=-1;},(s:any)=>{s.inventory[1]=1.5;},(s:any)=>{s.inventory[0]=1;},(s:any)=>{s.inventory[9]=1;},
    (s:any)=>{s.inventory[1]=2**31;},(s:any)=>{s.selected=0;},(s:any)=>{s.savedAt='not a date';},
    (s:any)=>{s.player.position.x=Infinity;},(s:any)=>{s.player.pitch=10;},(s:any)=>{s.player.grounded='yes';},
    (s:any)=>{s.stats.activeSeconds=-1;},(s:any)=>{s.stats.found=[1,1];},(s:any)=>{s.stats.found=[9];},
    (s:any)=>{s.chunks=[s.chunks[0],s.chunks[0]];},(s:any)=>{s.chunks[0].cells.push(...s.chunks[0].cells);},
    (s:any)=>{s.chunks[0].cells[0]=4096;},(s:any)=>{s.chunks[0].cells[1]=9;},(s:any)=>{s.chunks[0].key='8,0,0';},
    (s:any)=>{s.chunks[0].key='00,0,0';},(s:any)=>{s.chunks[0].cells.pop();},
  ])('rejects invalid metadata, IDs and chunk coordinates before mutation (%#)',change=>{
    const s=snapshot(1);change(s);expect(()=>validateSnapshot(s)).toThrow();
  });
  it('rejects border and protected return-platform cell edits',()=>{
    const s=snapshot();s.chunks=[{key:'0,0,0',cells:[0,0]}];expect(()=>validateSnapshot(s)).toThrow('protected_save_cell');
    s.chunks=[{key:'4,3,4',cells:[16*4,1]}];expect(()=>validateSnapshot(s)).toThrow('protected_save_cell');
  });
  it('rejects oversized or executable non-JSON backups',()=>{
    expect(()=>parseBackup(' '.repeat(MAX_BACKUP_BYTES+1))).toThrow('backup_too_large');
    expect(()=>parseBackup('(()=>globalThis.hacked=true)()')).toThrow('invalid_backup_json');
  });
  it('explicit remove is a transaction and does not resurrect an old saved world',async()=>{
    const f=storageFixture(snapshot(1)),store=new SaveStore(f.factory);await store.remove();expect(await store.load()).toBeNull();
  });
});
