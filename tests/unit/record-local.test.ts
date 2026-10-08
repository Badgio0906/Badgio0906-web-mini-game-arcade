import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest';
import {readLocalRecord,localRecordSourceStamp,CURRENT_RECORDS_KEY} from '../../src/records/localRecords';
import {getRecordDefinition} from '../../src/data/recordDefinitions';
const p=(id:string)=>`web-mini-arcade:v1:${id}:`;
let saved:Map<string,string>;
beforeEach(()=>{saved=new Map();const storage={getItem:(k:string)=>saved.get(k)??null};vi.stubGlobal('localStorage',storage);vi.stubGlobal('window',{localStorage:storage});});
afterEach(()=>vi.unstubAllGlobals());
const set=(id:string,key:string,data:unknown)=>saved.set(p(id)+key,JSON.stringify(data));
describe('read-only local record adapters',()=>{
  it('distinguishes no key, valid zero, malformed and denied access',async()=>{
    expect((await readLocalRecord('game001')).status).toBe('none');
    saved.set('orbit-shift:v1:best','0');expect(await readLocalRecord('game001')).toMatchObject({status:'record',value:0});
    for(const malformed of ['','NaN','-1','1.1','Infinity','"42"','9'.repeat(20)]){saved.set('orbit-shift:v1:best',malformed);expect((await readLocalRecord('game001')).status).toBe('unavailable');}
    vi.stubGlobal('window',{get localStorage(){throw new Error('denied');}});expect((await readLocalRecord('game001')).status).toBe('unavailable');
  });
  it('reads score instead of distance, floors instead of bonus and canonical shoe decimeters',async()=>{
    saved.set(p('game002')+'best','1000');saved.set(p('game002')+'bestScore','1280');
    saved.set(p('game003')+'rules2:best','9');saved.set(p('game003')+'rules2:bestBonus','5000');
    saved.set(p('game018')+'bestDistanceDecimeters','124801');
    expect((await readLocalRecord('game002')).value).toBe(1280);expect((await readLocalRecord('game003')).value).toBe(9);expect((await readLocalRecord('game018')).value).toBe(124801);
  });
  it('does not substitute legacy keys and rereads after source deletion',async()=>{
    saved.set(p('game006')+'best','800');expect((await readLocalRecord('game006')).status).toBe('legacy');
    saved.set(p('game006')+'best-rules-v2','100');expect((await readLocalRecord('game006')).value).toBe(100);
    saved.delete(p('game006')+'best-rules-v2');expect((await readLocalRecord('game006')).status).toBe('legacy');
    saved.clear();expect((await readLocalRecord('game006')).status).toBe('none');
  });
  it('does not promote reused 015 best to the current rules without a bound marker',async()=>{
    const def=getRecordDefinition('game015')!;saved.set(p('game015')+'best','900');
    expect((await readLocalRecord('game015')).status).toBe('legacy');expect(localRecordSourceStamp('game015')).toBe('900');
    const entry={boardId:def.boardId,rulesetId:def.rulesetId,modeId:def.modeId,sourceStamp:'900',value:72};
    saved.set(CURRENT_RECORDS_KEY,JSON.stringify({game015:entry}));expect((await readLocalRecord('game015')).value).toBe(72);
    saved.set(p('game015')+'best','0');expect((await readLocalRecord('game015')).status).toBe('legacy');
    saved.delete(p('game015')+'best');expect((await readLocalRecord('game015')).status).toBe('none');
  });
  it('selects only snake speed4 BEST, refuses unknown rules and impossible food count',async()=>{
    set('game024','state',{game_id:'game024',rules_version:'1',stats:{best:{4:0,6:20,8:100}}});
    expect((await readLocalRecord('game024')).value).toBe(0);
    set('game024','state',{game_id:'game024',rules_version:'2',stats:{best:{4:2,6:20,8:100}}});expect((await readLocalRecord('game024')).status).toBe('legacy');
    set('game024','state',{game_id:'game024',rules_version:'1',stats:{best:{4:398,6:20,8:100}}});expect((await readLocalRecord('game024')).status).toBe('unavailable');
  });
  it('keeps old random-level frog best separate from authored charge-jump rules',async()=>{
    const def=getRecordDefinition('game019')!;saved.set(p('game019')+'bestHeightDm','1800');
    expect((await readLocalRecord('game019')).status).toBe('legacy');expect(localRecordSourceStamp('game019')).toBe('1800');
    saved.set(CURRENT_RECORDS_KEY,JSON.stringify({game019:{boardId:def.boardId,rulesetId:'2',modeId:def.modeId,sourceStamp:'1800',value:534}}));
    expect((await readLocalRecord('game019')).value).toBe(534);
    saved.set(p('game019')+'bestHeightDm','2001');expect((await readLocalRecord('game019')).status).toBe('unavailable');
  });
  it('reads existing noncompetitive counters without inventing victories or times',async()=>{
    saved.set(p('game020')+'clearedBoards','12');expect((await readLocalRecord('game020')).value).toBe(12);
    set('game021','state',{game_id:'game021',rules_version:'1',stats:{'cpu:normal:first:unassisted':{wins:2,losses:4,draws:1}}});expect((await readLocalRecord('game021')).value).toBe(7);
    set('game022','session',{game_id:'game022',rules_version:'klondike-v1',stats:{clears:3}});expect((await readLocalRecord('game022')).value).toBe(3);
    set('game025','snapshot',{game_id:'game025',rules_version:'1',save_version:2,elapsedMs:10,stats:{won:8}});expect((await readLocalRecord('game025')).value).toBe(8);
    set('game026','snapshot',{save_version:1,active:null,stats:{matches:9}});expect((await readLocalRecord('game026')).value).toBe(9);
    set('game027','state',{game_id:'game027',rules_version:'1',stats:{games:11}});expect((await readLocalRecord('game027')).value).toBe(11);
    set('game028','state',{version:1,stats:{bestRally:15}});expect((await readLocalRecord('game028')).value).toBe(15);
    set('game029','save',{version:1,best:600,finishes:12});expect((await readLocalRecord('game029')).value).toBe(600);
    set('game030','snapshot',{game_id:'game030',rules_version:'1',save_version:1,progress:{best:[12,11,...Array(18).fill(null)]}});expect((await readLocalRecord('game030')).value).toBe(2);
  });
  it('uses known encountered word IDs, not bounded reportedLedger as a lifetime win count',async()=>{
    set('game023','question',{game_id:'game023',rules_version:'1',history:['w_food_001'],reportedLedger:Array(200).fill('x')});
    // Use an actual data ID, whose category is intentionally not guessed.
    const {words}=await import('../../src/games/game023/words');set('game023','question',{game_id:'game023',rules_version:'1',history:[words[0].word_id,words[1].word_id]});
    expect((await readLocalRecord('game023')).value).toBe(2);
    set('game023','question',{game_id:'game023',rules_version:'1',history:['invented']});expect((await readLocalRecord('game023')).status).toBe('unavailable');
  });
  it('never fills legacy Godot or retired games with fictitious zero',async()=>{
    for(const id of ['game012','game013','game014','game010'])expect((await readLocalRecord(id)).status).toBe('unavailable');
  });
});

function worldFixture(meta:unknown,hasWorld=true){
  const calls:string[]=[];
  const db={close:()=>{},objectStoreNames:{contains:(s:string)=>s==='worlds'},transaction:()=>{
    const tx:Record<string,unknown>={};tx.objectStore=()=>({get:(key:string)=>{calls.push(`get:${key}`);const r:Record<string,unknown>={result:meta};queueMicrotask(()=>{(r.onsuccess as ()=>void)();});return r;},getKey:(key:string)=>{calls.push(`getKey:${key}`);const r:Record<string,unknown>={result:hasWorld?'current':undefined};queueMicrotask(()=>{(r.onsuccess as ()=>void)();queueMicrotask(()=>{(tx.oncomplete as ()=>void)();});});return r;}});return tx;
  }};
  vi.stubGlobal('indexedDB',{open:()=>{const r:Record<string,unknown>={result:db};queueMicrotask(()=>{(r.onsuccess as ()=>void)();});return r;}});
  return calls;
}
describe('world record metadata boundary',()=>{
  it('reads metadata and world existence only, with no terrain data',async()=>{
    const calls=worldFixture({gameId:'game031',rulesetId:'1',schemaVersion:1,generatorVersion:1,blockVersion:1,revision:3,savedAt:'2026-10-08T00:00:00Z',mined:1240});
    expect(await readLocalRecord('game031')).toMatchObject({status:'record',value:1240,label:'この世界の記録'});expect(calls).toEqual(['get:record-current','getKey:current']);
  });
  it('does not keep metadata after world removal, and explains old saves',async()=>{
    worldFixture(undefined);expect((await readLocalRecord('game031')).status).toBe('legacy');
    worldFixture({mined:1240},false);expect((await readLocalRecord('game031')).status).toBe('none');
    vi.stubGlobal('indexedDB',undefined);expect((await readLocalRecord('game031')).status).toBe('unavailable');
  });
});
