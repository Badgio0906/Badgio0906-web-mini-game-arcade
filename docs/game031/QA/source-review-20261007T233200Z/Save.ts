import { CHUNK, type ChunkDiff, type Dimensions, type Player, type Snapshot, type WorldStats } from './Types';
import { protectedAt } from './World';

export const MAX_BACKUP_BYTES=16*1024*1024;
const MAX_INTEGER=Number.MAX_SAFE_INTEGER;
export class SaveError extends Error {
  constructor(readonly code:string) { super(code); this.name='SaveError'; }
}
const fail=(code='invalid_save'):never=>{throw new SaveError(code);};
const object=(value:unknown):Record<string,unknown>=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return fail();
  return value as Record<string,unknown>;
};
const integer=(value:unknown,max=MAX_INTEGER):number=>{
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0||value>max)return fail();
  return value;
};
const finite=(value:unknown):number=>{
  if(typeof value!=='number'||!Number.isFinite(value))return fail();
  return value;
};
const vector=(raw:unknown)=>{const v=object(raw);return {x:finite(v.x),y:finite(v.y),z:finite(v.z)};};

/** Validate and copy untrusted data before either importing or starting an async save. */
export function validateSnapshot(raw:unknown):Snapshot {
  const r=object(raw);
  if(r.schemaVersion!==1)fail('unsupported_schema');
  if(r.generatorVersion!==1)fail('unsupported_generator');
  if(r.blockVersion!==1)fail('unsupported_blocks');
  if(typeof r.worldId!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(r.worldId))fail();
  const seed=integer(r.seed,0xffffffff),revision=integer(r.revision);
  const d=object(r.dimensions);
  const dimensions:Dimensions={x:integer(d.x,128),y:integer(d.y,64),z:integer(d.z,128)};
  if(!((dimensions.x===128&&dimensions.y===64&&dimensions.z===128)||
       (dimensions.x===32&&dimensions.y===32&&dimensions.z===32)))fail('unsupported_dimensions');
  if(typeof r.savedAt!=='string'||r.savedAt.length>32||!Number.isFinite(Date.parse(r.savedAt))||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(r.savedAt))fail();
  const p=object(r.player);
  const player:Player={position:vector(p.position),velocity:vector(p.velocity),yaw:finite(p.yaw),pitch:finite(p.pitch),grounded:false};
  if(typeof p.grounded!=='boolean'||Math.abs(player.pitch)>Math.PI/2)fail();
  player.grounded=p.grounded as boolean;
  // Finite positions inside solids/outside the world are restored to the safe return pad by Physics.
  if(!Array.isArray(r.inventory)||r.inventory.length!==10)fail();
  const inventory=(r.inventory as unknown[]).map(n=>integer(n,0x7fffffff));
  if(inventory[0]!==0||inventory[9]!==0)fail();
  const selected=integer(r.selected,8);if(selected<1)fail();
  const s=object(r.stats);
  if(!Array.isArray(s.found)||s.found.length>8)fail();
  const found=(s.found as unknown[]).map(n=>integer(n,8));
  if(found.some(n=>n<1)||new Set(found).size!==found.length)fail();
  const stats:WorldStats={mined:integer(s.mined),placed:integer(s.placed),maxDepth:finite(s.maxDepth),activeSeconds:finite(s.activeSeconds),found};
  if(stats.maxDepth<0||stats.maxDepth>dimensions.y||stats.activeSeconds<0)fail();
  const maxChunks=Math.ceil(dimensions.x/CHUNK)*Math.ceil(dimensions.y/CHUNK)*Math.ceil(dimensions.z/CHUNK);
  if(!Array.isArray(r.chunks)||r.chunks.length>maxChunks)fail();
  const chunkKeys=new Set<string>();
  const chunks:ChunkDiff[]=(r.chunks as unknown[]).map(rawChunk=>{
    const c=object(rawChunk);
    if(typeof c.key!=='string'||!/^(0|[1-9]\d*),(0|[1-9]\d*),(0|[1-9]\d*)$/.test(c.key)||chunkKeys.has(c.key))fail();
    const key=c.key as string;chunkKeys.add(key);
    const [cx,cy,cz]=key.split(',').map(Number);
    if(cx!>=Math.ceil(dimensions.x/CHUNK)||cy!>=Math.ceil(dimensions.y/CHUNK)||cz!>=Math.ceil(dimensions.z/CHUNK))fail();
    if(!Array.isArray(c.cells)||c.cells.length===0||c.cells.length>8192||c.cells.length%2!==0)fail();
    const cells:number[]=[],indices=new Set<number>();
    for(let i=0;i<(c.cells as unknown[]).length;i+=2) {
      const local=integer((c.cells as unknown[])[i],4095),id=integer((c.cells as unknown[])[i+1],8);
      if(indices.has(local))fail();indices.add(local);
      // World indexes local cells as x + 16*(z + 16*y).
      const x=cx!*CHUNK+local%CHUNK,z=cz!*CHUNK+Math.floor(local/CHUNK)%CHUNK,y=cy!*CHUNK+Math.floor(local/(CHUNK*CHUNK));
      if(x<=0||z<=0||y<=0||x>=dimensions.x-1||z>=dimensions.z-1||y>=dimensions.y||protectedAt(seed,dimensions,x,y,z))fail('protected_save_cell');
      cells.push(local,id);
    }
    return {key,cells};
  });
  return {schemaVersion:1,generatorVersion:1,blockVersion:1,worldId:r.worldId as string,seed,dimensions,revision,savedAt:r.savedAt as string,player,inventory,selected,stats,chunks};
}

export function parseBackup(text:string):Snapshot {
  if(typeof text!=='string'||text.length>MAX_BACKUP_BYTES||new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)fail('backup_too_large');
  let raw:unknown;
  try {raw=JSON.parse(text);} catch {return fail('invalid_backup_json');}
  return validateSnapshot(raw);
}
function storageError(error:DOMException|null|undefined,fallback:string):SaveError {
  return new SaveError(error?.name==='QuotaExceededError'?'quota_exceeded':error?.name==='SecurityError'?'storage_denied':fallback);
}

/** One transaction replaces a coherent snapshot; failures leave the last committed record intact. */
export class SaveStore {
  private opening:Promise<IDBDatabase>|null=null;
  constructor(private readonly factory:IDBFactory|undefined=globalThis.indexedDB) {}
  private open():Promise<IDBDatabase> {
    if(!this.factory)return Promise.reject(new SaveError('storage_unavailable'));
    if(this.opening)return this.opening;
    const pending=new Promise<IDBDatabase>((resolve,reject)=>{
      let request:IDBOpenDBRequest;
      try {request=this.factory!.open('game100garage-game031',1);}catch {reject(new SaveError('storage_denied'));return;}
      let settled=false;
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('worlds'))request.result.createObjectStore('worlds');};
      request.onsuccess=()=>{
        const db=request.result;
        if(settled){db.close();return;}
        settled=true;db.onversionchange=()=>{db.close();this.opening=null;};resolve(db);
      };
      request.onerror=()=>{if(!settled){settled=true;reject(storageError(request.error,'open_failed'));}};
      request.onblocked=()=>{if(!settled){settled=true;reject(new SaveError('storage_blocked'));}};
    });
    this.opening=pending;
    void pending.catch(()=>{if(this.opening===pending)this.opening=null;});
    return pending;
  }
  private async read():Promise<unknown|null> {
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      let tx:IDBTransaction;
      try {tx=db.transaction('worlds','readonly');}catch {reject(new SaveError('read_failed'));return;}
      let value:unknown=null;
      const request=tx.objectStore('worlds').get('current');
      request.onsuccess=()=>{value=request.result??null;};
      tx.oncomplete=()=>resolve(value);
      tx.onabort=()=>reject(storageError(tx.error,'read_failed'));
      tx.onerror=()=>{}; // Aborted transaction is the authoritative failure, never the request's success.
    });
  }
  async load():Promise<Snapshot|null> {const raw=await this.read();return raw===null?null:validateSnapshot(raw);}
  /** Preserves export access when an existing save's generator/schema is unsupported. */
  async exportStoredBackup():Promise<string|null> {const raw=await this.read();return raw===null?null:JSON.stringify(raw);}
  async save(snapshot:Snapshot):Promise<void> {
    const captured=validateSnapshot(snapshot);
    await this.write(store=>{store.put(captured,'current');});
  }
  async remove():Promise<void> {await this.write(store=>{store.delete('current');});}
  private async write(change:(store:IDBObjectStore)=>void):Promise<void> {
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      let tx:IDBTransaction;
      try {tx=db.transaction('worlds','readwrite');change(tx.objectStore('worlds'));}
      catch {reject(new SaveError('write_failed'));return;}
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(storageError(tx.error,'write_failed'));
      tx.onerror=()=>{};
    });
  }
}
