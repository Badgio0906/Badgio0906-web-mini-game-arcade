import { describe, expect, it } from 'vitest';
import { FISH, type FishCatch } from '../../src/games/game032/FishingModel';
import { FishingCatchRecordsStore, FISH_HISTORY_LIMIT, FISH_RECORDS_KEY, FISH_RECORDS_RAW_LIMIT, validateFishRecords } from '../../src/games/game032/CatchRecords';
import { FISHING_BEST_KEY } from '../../src/games/game032/Save';

const day = (number:number) => new Date(Date.UTC(2026,9,10,0,0,number)).toISOString();
function fish(id:FishCatch['fishId']='oikawa', size=12):FishCatch {
  const definition=FISH.find(f=>f.id===id)!;
  return {fishId:id,name:definition.name,sizeCm:size,points:100,rare:definition.rareBonus>0,
    big:(size-definition.minCm)/(definition.maxCm-definition.minCm)>=.8,spotId:'shallows',distance:'near',method:'bait'};
}
function backend() {
  const data=new Map<string,string>();
  return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
}
function persisted() {
  const storage=backend(),store=new FishingCatchRecordsStore(storage);
  store.record(fish(),'standard',day(1));
  return {storage,store,save:JSON.parse(storage.data.get(FISH_RECORDS_KEY)!)};
}
describe('Game032 immediately saved species records, independent of outing BEST',()=>{
  it('starts empty with no data and immediately saves the first standard landing',()=>{
    const storage=backend(),store=new FishingCatchRecordsStore(storage);
    expect(store.records()).toEqual([]);
    expect(store.record(fish(),'standard',day(1))).toBe(true);
    expect(store.records()[0]).toMatchObject({fishId:'oikawa',maxSizeCm:12,caughtAt:day(1),latestCaughtAt:day(1),count:1});
    expect(new FishingCatchRecordsStore(storage).records()).toEqual(store.records());
  });
  it('never writes practice fish, even with no previous standard record',()=>{
    const storage=backend(),store=new FishingCatchRecordsStore(storage);
    expect(store.record(fish(),'practice',day(1))).toBe(false);
    expect(storage.data.size).toBe(0);
  });
  it('records a larger fish with its own catch date, retaining totals and recent history',()=>{
    const {store}=persisted();
    store.record(fish('oikawa',16),'standard',day(2));
    store.record(fish('oikawa',10),'standard',day(3));
    expect(store.records()[0]).toMatchObject({maxSizeCm:16,caughtAt:day(2),latestCaughtAt:day(3),count:3});
    expect(store.recentCatches().map(r=>r.catch.sizeCm)).toEqual([12,16,10]);
  });
  it('keeps the first maximum date on an equal-size catch',()=>{
    const {store}=persisted();store.record(fish(),'standard',day(2));
    expect(store.records()[0]).toMatchObject({caughtAt:day(1),latestCaughtAt:day(2),count:2});
  });
  it('counts identical same-millisecond catches separately',()=>{
    const {storage,store}=persisted();store.record(fish(),'standard',day(1));
    expect(store.recentCatches()).toHaveLength(2);
    expect(new FishingCatchRecordsStore(storage).recentCatches()).toHaveLength(2);
    expect(store.storageStatus).toBe('persistent');
  });
  it('keeps each species in definition order and provides immutable largest-fish gallery data',()=>{
    const storage=backend(),store=new FishingCatchRecordsStore(storage);
    for(const f of [...FISH].reverse())store.record(fish(f.id,f.maxCm),'standard',day(1));
    expect(store.records().map(r=>r.fishId)).toEqual(FISH.map(f=>f.id));
    expect(store.galleryCatches().map(f=>f.sizeCm)).toEqual(FISH.map(f=>f.maxCm));
    expect(Object.isFrozen(store.records())).toBe(true);
    expect(Object.isFrozen(store.records()[0])).toBe(true);
    expect(Object.isFrozen(store.galleryCatches()[0])).toBe(true);
    expect(Object.isFrozen(store.recentCatches()[0])).toBe(true);
  });
  it('bounds recent catches at 100 without losing the old species maximum or date',()=>{
    const storage=backend(),store=new FishingCatchRecordsStore(storage);
    store.record(fish('oikawa',18),'standard',day(0));
    for(let i=1;i<=150;i++)store.record(fish('oikawa',9),'standard',day(i));
    expect(store.recentCatches()).toHaveLength(FISH_HISTORY_LIMIT);
    expect(store.records()[0]).toMatchObject({maxSizeCm:18,caughtAt:day(0),count:151});
    const reloaded=new FishingCatchRecordsStore(storage);
    expect(reloaded.records()).toEqual(store.records());
    expect(storage.data.get(FISH_RECORDS_KEY)!.length).toBeLessThan(FISH_RECORDS_RAW_LIMIT);
  });
  it('preserves the old BEST bytes and never writes another storage key',()=>{
    const storage=backend();storage.data.set(FISHING_BEST_KEY,'original-BEST-byte-sequence');
    const store=new FishingCatchRecordsStore(storage);store.record(fish(),'standard',day(1));
    expect(storage.data.get(FISHING_BEST_KEY)).toBe('original-BEST-byte-sequence');
    expect([...storage.data.keys()]).toEqual([FISHING_BEST_KEY,FISH_RECORDS_KEY]);
  });
  it('retains the greatest latest date after device clock moves backwards',()=>{
    const {store}=persisted();store.record(fish('oikawa',16),'standard',day(0));
    expect(store.records()[0]).toMatchObject({caughtAt:day(0),latestCaughtAt:day(1),maxSizeCm:16});
    expect(validateFishRecords(JSON.parse(JSON.stringify({schemaVersion:1,species:store.records(),recent:store.recentCatches()})))).not.toBeNull();
  });
  it('refreshes another tab and safely combines sequential tab writes',()=>{
    const storage=backend(),left=new FishingCatchRecordsStore(storage),right=new FishingCatchRecordsStore(storage);
    left.record(fish(),'standard',day(1));right.record(fish('ugui',20),'standard',day(2));
    left.record(fish('oikawa',16),'standard',day(3));right.record(fish('oikawa',10),'standard',day(4));
    const reopened=new FishingCatchRecordsStore(storage);
    expect(reopened.records().map(r=>[r.fishId,r.count,r.maxSizeCm])).toEqual([['oikawa',3,16],['ugui',1,20]]);
    expect(reopened.recentCatches()).toHaveLength(4);
  });
  it('keeps verified page data when a write fails and reports memory-only status',()=>{
    const storage=backend();let fail=false;
    const store=new FishingCatchRecordsStore({...storage,setItem:(key,value)=>{if(fail)throw new Error('quota');storage.setItem(key,value);}});
    store.record(fish(),'standard',day(1));fail=true;store.record(fish('oikawa',16),'standard',day(2));
    expect(store.records()[0]).toMatchObject({count:2,maxSizeCm:16});
    expect(store.storageStatus).toBe('memory');expect(store.storageIssue).toBe('write_failed');
    expect(new FishingCatchRecordsStore(storage).records()[0].maxSizeCm).toBe(12);
    fail=false;store.record(fish('oikawa',10),'standard',day(3));
    expect(store.storageStatus).toBe('persistent');expect(store.storageIssue).toBeNull();
    expect(new FishingCatchRecordsStore(storage).records()[0].count).toBe(3);
  });
  it('survives denied reads and writes without discarding the current page catches',()=>{
    const store=new FishingCatchRecordsStore({getItem:()=>{throw new Error('denied');},setItem:()=>{throw new Error('denied');}});
    expect(store.storageIssue).toBe('read_failed');
    expect(store.record(fish(),'standard',day(1))).toBe(true);
    expect(store.records()[0].count).toBe(1);expect(store.storageStatus).toBe('memory');
  });
  it('retains page records if storage is cleared during this page session',()=>{
    const {storage,store}=persisted();storage.data.delete(FISH_RECORDS_KEY);
    expect(store.records()[0].maxSizeCm).toBe(12);expect(store.storageStatus).toBe('memory');
  });
  it.each(['{broken','null','[]',JSON.stringify({schemaVersion:2,species:[],recent:[]}), 'x'.repeat(FISH_RECORDS_RAW_LIMIT+1)])('rejects corrupted/oversized raw data without destroying it: %s',raw=>{
    const storage=backend();storage.data.set(FISH_RECORDS_KEY,raw);
    const store=new FishingCatchRecordsStore(storage);
    expect(store.records()).toEqual([]);expect(storage.data.get(FISH_RECORDS_KEY)).toBe(raw);
    expect(store.storageStatus).toBe('memory');expect(['invalid_data','read_failed']).toContain(store.storageIssue);
  });
  it('preserves verified records if later stored data becomes corrupt',()=>{
    const {storage,store}=persisted();storage.data.set(FISH_RECORDS_KEY,'{broken');
    expect(store.records()[0].maxSizeCm).toBe(12);expect(store.storageStatus).toBe('memory');
  });
  it.each([Number.NaN,Number.POSITIVE_INFINITY,7.9,18.1,12.05])('does not accept invalid fish size %s',size=>{
    const store=new FishingCatchRecordsStore(backend());
    expect(store.record(fish('oikawa',size),'standard',day(1))).toBe(false);
    expect(store.records()).toEqual([]);
  });
  it.each(['yesterday','2026-02-30T00:00:00.000Z','2026-10-10T00:00:00Z','2026-10-10T00:00:00.000+09:00'])('rejects noncanonical or impossible timestamp %s',date=>{
    expect(new FishingCatchRecordsStore(backend()).record(fish(),'standard',date)).toBe(false);
  });
  it('rejects unknown fish, stale display names, invalid metadata and arbitrary prototype properties',()=>{
    const store=new FishingCatchRecordsStore(backend());
    for(const invalid of [{...fish(),fishId:'unknown'},{...fish(),name:'injected'},{...fish(),points:Infinity},
      {...fish(),rare:true},{...fish(),method:'unknown'},{...fish(),spotId:'unknown'},JSON.parse(JSON.stringify(fish()).replace('"fishId"','"__proto__":{},"fishId"')),
      Object.assign(Object.create({inherited:true}),fish())])expect(store.record(invalid as FishCatch,'standard',day(1))).toBe(false);
  });
  it('rejects inconsistent save envelopes and does not return partially validated records',()=>{
    const {save}=persisted();
    const changes=[(v:any)=>v.species.push(v.species[0]),(v:any)=>v.species[0].count=Number.MAX_SAFE_INTEGER+1,
      (v:any)=>v.species[0].maxSizeCm=15,(v:any)=>v.species[0].latestCaughtAt=day(0),
      (v:any)=>v.recent[0].ordinal=0,(v:any)=>v.recent.push(v.recent[0]),(v:any)=>v.recent[0].catch.sizeCm=18,
      (v:any)=>v.species[0].extra='unknown',(v:any)=>v.recent=Array(FISH_HISTORY_LIMIT+1).fill(v.recent[0])];
    for(const change of changes){const copy=JSON.parse(JSON.stringify(save));change(copy);expect(validateFishRecords(copy)).toBeNull();}
  });
  it('rejects a new increment at the safe-integer limit without corrupting stored counters',()=>{
    const {storage,save}=persisted();save.species[0].count=Number.MAX_SAFE_INTEGER;
    storage.data.set(FISH_RECORDS_KEY,JSON.stringify(save));
    const store=new FishingCatchRecordsStore(storage);
    expect(store.record(fish(),'standard',day(2))).toBe(false);
    expect(store.records()[0].count).toBe(Number.MAX_SAFE_INTEGER);
    expect(validateFishRecords(JSON.parse(storage.data.get(FISH_RECORDS_KEY)!))).not.toBeNull();
  });
});
