import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const out=process.env.GAME031_QA_OUT;
if(!out)throw Error('unique GAME031_QA_OUT is required');
try{await access(out);throw Error('output directory already exists; do not overwrite prior evidence');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const base=new URL(process.env.GAME031_URL||'http://127.0.0.1:4311/game031.html');
if(!['127.0.0.1','localhost'].includes(base.hostname))throw Error('synthetic stress is local-only');
const hashes={};for(const path of ['src/games/game031/Save.ts','src/games/game031/World.ts','src/games/game031/Engine.ts','src/games/game031/Physics.ts','tests/game031/storage-browser.mjs'])hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const report={startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes:hashes,
  provenance:'synthetic browser stress and explicit storage fault injection; not ordinary mining or production data',
  conditions:{browser:'headless Chromium',renderer:'SwiftShader launch flags; storage-only harness has no 3D rendering',viewport:{width:1280,height:900},origin:base.origin,physicalPhone:false},steps:[],errors:[]};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let context,page;
const checkpoint=async()=>{await writeFile(out+'/REPORT.json',JSON.stringify(report,null,2)+'\n');};
async function run(name,body,arg){
  const startedAt=new Date().toISOString();
  try{const result=await page.evaluate(body,arg);report.steps.push({name,startedAt,result:'PASS',...result});await checkpoint();}
  catch(e){report.steps.push({name,startedAt,result:'FAIL',error:String(e)});await checkpoint();throw e;}
}
try{
  context=await browser.newContext({viewport:report.conditions.viewport});
  await context.route('**/__game031-storage-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Game031 synthetic IndexedDB stress</title><h1>Native IndexedDB fixture</h1><p>No gameplay or production telemetry is loaded.</p>'}));
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base.origin+'/__game031-storage-fixture');
  await page.evaluate(async()=>{
    const {World}=await import('/src/games/game031/World.ts'),{SaveStore,parseBackup}=await import('/src/games/game031/Save.ts'),{Engine}=await import('/src/games/game031/Engine.ts');
    const equal=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label);};
    const fixture=count=>{
      const world=new World(3031,{x:128,y:64,z:128},'fixture-'+count),engine=new Engine(world);engine.inventory[1]=count;
      const targets=[];
      for(let i=0;i<count;i++){
        const p=Math.floor(i/2),x=2+p%124,z=2+Math.floor(p/124),y=i%2?60:3,b=world.get(x,y,z),after=b===0?1:0;
        if(!world.set(x,y,z,after))throw Error('fixture edit rejected');
        if(after===0){engine.inventory[b]++;engine.stats.mined++;if(!engine.stats.found.includes(b))engine.stats.found.push(b);}
        else{engine.inventory[1]--;engine.stats.placed++;}
        targets.push({x,y,z,id:after});
      }
      return {world,engine,targets};
    };
    const snap=(f)=>({schemaVersion:1,generatorVersion:1,blockVersion:1,worldId:f.world.worldId,seed:f.world.seed,dimensions:{...f.world.dimensions},revision:f.world.revision,
      savedAt:new Date().toISOString(),player:structuredClone(f.engine.player),inventory:[...f.engine.inventory],selected:f.engine.selected,stats:structuredClone(f.engine.stats),chunks:f.world.exportDiffs()});
    const rawRead=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('game100garage-game031',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('worlds','readonly'),q=tx.objectStore('worlds').get('current');let data; q.onsuccess=()=>data=q.result;tx.oncomplete=()=>{db.close();resolve(data);};tx.onabort=()=>reject(Error('raw_read_failed'));};r.onerror=()=>reject(Error('raw_open_failed'));});
    const rawWrite=value=>new Promise((resolve,reject)=>{const r=indexedDB.open('game100garage-game031',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('worlds','readwrite');tx.objectStore('worlds').put(value,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(Error('raw_write_failed'));};r.onerror=()=>reject(Error('raw_open_failed'));});
    window.storageFixture={World,Engine,SaveStore,parseBackup,equal,fixture,snap,rawRead,rawWrite,store:new SaveStore()};
  });
  for(const count of [1000,5000,10000])await run('native-roundtrip-'+count,async count=>{
    const q=window.storageFixture,t0=performance.now(),f=q.fixture(count),generationAndEditsMs=performance.now()-t0,s=q.snap(f),bytes=new TextEncoder().encode(JSON.stringify(s)).byteLength;
    const startSave=performance.now();await q.store.save(s);const saveMs=performance.now()-startSave;
    const startLoad=performance.now(),loaded=await q.store.load(),loadMs=performance.now()-startLoad;q.equal(loaded,s,'snapshot mismatch');
    const startRestore=performance.now(),world=new q.World(loaded.seed,loaded.dimensions,loaded.worldId);world.applyDiffs(loaded.chunks);
    for(const t of f.targets)if(world.get(t.x,t.y,t.z)!==t.id)throw Error('restored voxel mismatch');
    const engine=new q.Engine(world,loaded.player,loaded.inventory,loaded.stats);q.equal(engine.inventory,s.inventory,'inventory mismatch');q.equal(engine.stats,s.stats,'statistics mismatch');q.equal(world.exportDiffs(),s.chunks,'final diff mismatch');
    q.equal(q.parseBackup(JSON.stringify(loaded)),loaded,'backup roundtrip mismatch');
    window.storageFixture.lastGood=s;
    return {modifiedVoxels:count,modifiedChunks:s.chunks.length,mined:s.stats.mined,placed:s.stats.placed,serializedBackupBytes:bytes,actualIndexedDBAllocatedBytes:null,generationAndEditsMs,saveMs,loadMs,worldRestoreAndComparisonMs:performance.now()-startRestore};
  },count);
  await run('revert-to-generated-terrain',async()=>{
    const q=window.storageFixture,f=q.fixture(1000);
    for(const t of f.targets)if(!f.world.set(t.x,t.y,t.z,f.world.baseAt(t.x,t.y,t.z)))throw Error('revert rejected');
    if(f.world.exportDiffs().length)throw Error('reverted edits persisted as history');
    const s=q.snap(f);await q.store.save(s);q.equal((await q.store.load()).chunks,[],'reverted chunks nonempty');
    return {editedThenRevertedVoxels:1000,remainingDiffChunks:0};
  });
  await run('save-snapshot-captured-before-later-edit',async()=>{
    const q=window.storageFixture,f=q.fixture(1),s=q.snap(f),captured=structuredClone(s),saving=q.store.save(s);
    f.world.set(3,3,3,0);s.inventory[1]++;s.stats.mined++;s.chunks[0].cells[1]=8;
    await saving;q.equal(await q.store.load(),captured,'later edits skewed saved snapshot');
    return {capturedRevision:captured.revision,liveWorldRevision:f.world.revision};
  });
  for(const quota of [false,true])await run(quota?'quota-fault-in-native-transaction':'native-transaction-abort-old-world-held',async quota=>{
    const q=window.storageFixture,old=q.snap(q.fixture(2));await q.store.save(old);const next=q.snap(q.fixture(4));next.worldId='replacement-fixture';
    const original=IDBDatabase.prototype.transaction;let injected=false;
    IDBDatabase.prototype.transaction=function(...args){const tx=original.apply(this,args);if(!injected&&args[1]==='readwrite'){injected=true;queueMicrotask(()=>{if(quota)Object.defineProperty(tx,'error',{value:new DOMException('synthetic quota fault','QuotaExceededError')});tx.abort();});}return tx;};
    let code=null;
    try{await q.store.save(next);}catch(e){code=e.code;}finally{IDBDatabase.prototype.transaction=original;}
    if(code!==(quota?'quota_exceeded':'write_failed'))throw Error('wrong abort outcome: '+code);
    q.equal(await q.store.load(),old,'aborted write replaced old snapshot');
    return {code,previousWorldIdHeld:true,faultInjection:quota?'Synthetic error code on a truly aborted native transaction; actual quota exhaustion not exercised':'Actual native tx.abort after put; not real data corruption'};
  },quota);
  await run('denied-open-fault-injection',async()=>{
    const q=window.storageFixture,old=await q.store.load(),denied=new q.SaveStore({open(){throw new DOMException('synthetic security denial','SecurityError');}});
    let code;try{await denied.save(old);}catch(e){code=e.code;}if(code!=='storage_denied')throw Error('denied storage reported success');
    q.equal(await q.store.load(),old,'denied open changed valid database');return {code,faultInjection:'SecurityError opening stub; actual browser permission denial not exercised'};
  });
  await run('native-open-blocked',async()=>{
    const q=window.storageFixture,name='game031-native-blocked-fixture';
    const held=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('worlds');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('blocked fixture initial open'));});
    let opened=false;const factory={open(){const r=indexedDB.open(name,2);r.addEventListener('success',()=>{opened=true;});return r;}};
    const blocked=new q.SaveStore(factory);let code;
    try{await blocked.load();}catch(e){code=e.code;}finally{held.close();}
    if(code!=='storage_blocked')throw Error('native blocked open result: '+code);
    await new Promise(resolve=>setTimeout(resolve,40));
    return {code,nativeUpgradeBlocked:true,lateOpenObserved:opened,faultInjection:'Separate native v1 connection holds v2 upgrade; factory redirects fixed SaveStore open to fixture DB'};
  });
  await run('corrupt-stored-data-preserved-and-exportable',async()=>{
    const q=window.storageFixture,old=await q.store.load(),corrupt=structuredClone(old);corrupt.inventory[1]=-1;await q.rawWrite(corrupt);
    let code;try{await q.store.load();}catch(e){code=e.code;}if(code!=='invalid_save')throw Error('corrupt save accepted');
    q.equal(await q.rawRead(),corrupt,'reader erased or changed corrupt record');q.equal(JSON.parse(await q.store.exportStoredBackup()),corrupt,'corrupt backup lost');
    await q.store.save(old);q.equal(await q.store.load(),old,'explicit good backup restore failed');return {code,corruptRecordUntouched:true,explicitRestorationOfGoodBackup:true};
  });
  await run('bad-backup-import-keeps-existing-world',async()=>{
    const q=window.storageFixture,old=await q.store.load(),bad=structuredClone(old);bad.generatorVersion=999;
    let code;try{const imported=q.parseBackup(JSON.stringify(bad));await q.store.save(imported);}catch(e){code=e.code;}
    if(code!=='unsupported_generator')throw Error('bad backup accepted');q.equal(await q.store.load(),old,'bad import replaced old');return {code,oldWorldHeld:true};
  });
  await run('invalid-restored-position-safe-return',async()=>{
    const q=window.storageFixture,s=await q.store.load();s.player.position={x:-100,y:999,z:999};s.player.velocity={x:100,y:-100,z:100};await q.store.save(s);
    const loaded=await q.store.load(),world=new q.World(loaded.seed,loaded.dimensions,loaded.worldId);world.applyDiffs(loaded.chunks);const engine=new q.Engine(world,loaded.player,loaded.inventory,loaded.stats);
    q.equal(engine.player.position,world.spawn,'invalid position not returned safely');q.equal(engine.inventory,s.inventory,'return changed inventory');q.equal(world.exportDiffs(),s.chunks,'return changed terrain');return {safeReturn:true,inventoryAndTerrainHeld:true};
  });
  if(report.errors.length)throw Error('unexpected page errors');
  report.result='PASS';await page.screenshot({path:out+'/storage-fixture-complete.png'});
}catch(e){
  report.result='FAIL';report.error=String(e);await page?.screenshot({path:out+'/first-failure.png'}).catch(()=>{});
  report.failureState=await page?.evaluate(async()=>({url:location.href,ready:!!window.storageFixture,stored:window.storageFixture?await window.storageFixture.rawRead().catch(()=>null):null})).catch(()=>null);
}finally{report.finishedAt=new Date().toISOString();await checkpoint();await context?.close();await browser.close();}
console.log(JSON.stringify({out,result:report.result,error:report.error}));if(report.result!=='PASS')process.exitCode=1;
