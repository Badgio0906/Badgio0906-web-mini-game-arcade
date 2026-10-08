import { getRecordDefinition } from '../data/recordDefinitions';
import { wordById } from '../games/game023/words';
import { readCurrentRule } from './currentRules';

export interface LocalRecord {
  status: 'record' | 'none' | 'legacy' | 'unavailable';
  value?: number;
  label?: string;
  detail?: string;
}
export const CURRENT_RECORDS_KEY = 'game100:records:current:v1';
const prefix = (id: string) => `web-mini-arcade:v1:${id}:`;
const scalarKeys: Readonly<Record<string,string>> = {
  game001:'orbit-shift:v1:best', game002:prefix('game002')+'bestScore',
  game003:prefix('game003')+'rules2:best', game004:prefix('game004')+'best',
  game005:prefix('game005')+'best', game006:prefix('game006')+'best-rules-v2',
  game007:prefix('game007')+'best:transport:v2', game008:prefix('game008')+'best-delivery-v2',
  game009:prefix('game009')+'bestRules2', game011:prefix('game011')+'best:v2',
  game015:prefix('game015')+'best', game016:prefix('game016')+'best',
  game017:prefix('game017')+'best', game018:prefix('game018')+'bestDistanceDecimeters',
  game019:prefix('game019')+'bestHeightDm', game020:prefix('game020')+'clearedBoards',
};
const jsonKeys: Readonly<Record<string,string>> = {
  game021:'state',game022:'session',game023:'question',game024:'state',game025:'snapshot',
  game026:'snapshot',game027:'state',game028:'state',game029:'save',game030:'snapshot',
};
export const localRecordStorageKeys: readonly string[] = Object.freeze([
  ...Object.values(scalarKeys), ...Object.entries(jsonKeys).map(([id,key])=>prefix(id)+key),
  ...['game003','game006','game007','game008','game009','game011','game019'].map(id=>prefix(id)+'best'),
  CURRENT_RECORDS_KEY,
]);
const natural = (v: unknown, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= max;
const object = (v: unknown): v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const missing = (): LocalRecord => ({status:'none'});
const bad = (detail='このブラウザの保存を取得できません'): LocalRecord => ({status:'unavailable',detail});
const old = (detail='現行ルールの記録なし'): LocalRecord => ({status:'legacy',detail});
function scalar(raw: string | null, max: number): number | null {
  if(raw===null || !/^\d+$/.test(raw))return null;
  const v=Number(raw);return natural(v,max)?v:null;
}

/** Reused keys need a current-rule marker. Never expose world/save data. */
export function localRecordSourceStamp(gameId: string): string | null {
  if(!['game015','game019'].includes(gameId))return null;
  try {const raw=localStorage.getItem(scalarKeys[gameId]);return scalar(raw,getRecordDefinition(gameId)!.maxValue)===null?null:raw;}
  catch{return null;}
}

async function readScalar(gameId: string, backend: Storage): Promise<LocalRecord> {
  const def=getRecordDefinition(gameId)!;
  const raw=backend.getItem(scalarKeys[gameId]);
  if(raw===null){
    if(['game003','game006','game007','game008','game009','game011','game019'].includes(gameId)&&backend.getItem(prefix(gameId)+'best')!==null)return old();
    return missing();
  }
  const value=scalar(raw,def.maxValue);if(value===null)return bad('保存された記録の形式が不正です');
  if(['game015','game019'].includes(gameId)){
    let entry=await readCurrentRule(gameId);
    if(!entry){const mapRaw=backend.getItem(CURRENT_RECORDS_KEY);if(!mapRaw)return old('旧ルールと現行ルールを判別できない記録です');if(mapRaw.length>100000)return bad();let map:unknown;try{map=JSON.parse(mapRaw);}catch{return bad();}entry=object(map)?map[gameId]:null;}
    if(!object(entry)||entry.boardId!==def.boardId||entry.rulesetId!==def.rulesetId||entry.modeId!==def.modeId||entry.sourceStamp!==backend.getItem(scalarKeys[gameId])||!natural(entry.value,def.maxValue))return old();
    return {status:'record',value:entry.value};
  }
  return {status:'record',value};
}

function readJSON(gameId: string, backend: Storage): LocalRecord {
  const raw=backend.getItem(prefix(gameId)+jsonKeys[gameId]);if(raw===null)return missing();
  if(raw.length>20000000)return bad('保存された記録が大きすぎます');
  let data:unknown;try{data=JSON.parse(raw);}catch{return bad('保存された記録の形式が不正です');}
  if(!object(data))return bad();
  const def=getRecordDefinition(gameId)!;
  if(['game021','game022','game023','game024','game025','game027','game030'].includes(gameId)){
    if(data.game_id!==gameId)return bad('別のゲームの保存です');
    if(data.rules_version!==def.rulesetId)return old();
  }
  if(['game026','game028','game029'].includes(gameId)&&data[gameId==='game026'?'save_version':'version']!==1)return old();
  if(gameId==='game025'&&data.save_version!==2 || gameId==='game030'&&data.save_version!==1)return old();
  let value:unknown;
  const stats=data.stats;
  switch(gameId){
    case 'game021':{
      if(!object(stats)||Object.keys(stats).length>24)return bad();
      let total=0;
      for(const [key,s]of Object.entries(stats)){
        if(!/^(cpu|two):(easy|normal|strong):(first|second):(assisted|unassisted)$/.test(key)||!object(s)||!['wins','losses','draws'].every(k=>natural(s[k],1000000)))return bad();
        total+=(s.wins as number)+(s.losses as number)+(s.draws as number);
      }
      value=total;break;
    }
    case 'game022':value=object(stats)?stats.clears:undefined;break;
    case 'game023':{
      if(!Array.isArray(data.history)||data.history.length>wordById.size||!data.history.every(id=>typeof id==='string'&&wordById.has(id))||new Set(data.history).size!==data.history.length)return bad();
      value=data.history.length;break;
    }
    case 'game024':{
      if(!object(stats)||!object(stats.best)||![4,6,8].every(s=>natural((stats.best as Record<string,unknown>)[s],397)))return bad();
      value=stats.best['4'];break;
    }
    case 'game025':value=object(stats)?stats.won:undefined;break;
    case 'game026':{
      if(data.active!==null&&(!object(data.active)||data.active.game_id!==gameId))return bad();
      if(object(data.active)&&data.active.rules_version!==def.rulesetId)return old();
      value=object(stats)?stats.matches:undefined;break;
    }
    case 'game027':value=object(stats)?stats.games:undefined;break;
    case 'game028':value=object(stats)?stats.bestRally:undefined;break;
    case 'game029':value=data.best;break;
    case 'game030':{
      const progress=data.progress;
      if(!object(progress)||!Array.isArray(progress.best)||progress.best.length!==20||!progress.best.every(n=>n===null||typeof n==='number'&&Number.isFinite(n)&&n>0))return bad();
      value=progress.best.filter(n=>n!==null).length;break;
    }
  }
  return natural(value,def.maxValue)?{status:'record',value}:bad('保存された記録の数値が不正です');
}

/** Metadata only: no Snapshot/chunks/seed/world generation or game runtime imports. */
async function readWorldMetadata(): Promise<LocalRecord> {
  const factory=globalThis.indexedDB;if(!factory)return bad('世界の保存を取得できません');
  return new Promise(resolve=>{
    let settled=false,db:IDBDatabase|undefined;
    const finish=(result:LocalRecord)=>{if(settled)return;settled=true;clearTimeout(timer);db?.close();resolve(result);};
    const timer=setTimeout(()=>finish(bad('世界の保存の取得が時間切れです')),3000);
    let request:IDBOpenDBRequest;try{request=factory.open('game100garage-game031');}catch{finish(bad());return;}
    // Reading a portal card never initializes or upgrades a game database.
    request.onupgradeneeded=()=>{request.transaction?.abort();finish(missing());};
    request.onerror=()=>finish(bad());request.onblocked=()=>finish(bad('世界の保存を開けません'));
    request.onsuccess=()=>{
      db=request.result;if(settled){db.close();return;}
      if(!db.objectStoreNames.contains('worlds')){finish(bad());return;}
      let tx:IDBTransaction;try{tx=db.transaction('worlds','readonly');}catch{finish(bad());return;}
      const store=tx.objectStore('worlds'),meta=store.get('record-current'),exists=store.getKey('current');
      let result:LocalRecord=bad(),hasWorld=false;
      exists.onsuccess=()=>{hasWorld=exists.result!==undefined;};
      meta.onsuccess=()=>{
        const v:unknown=meta.result;
        if(v===undefined){result=old('保存した世界を開いて保存すると、採掘数を表示できます');return;}
        if(!object(v)||v.gameId!=='game031'){result=bad();return;}
        if(v.rulesetId!=='1'||v.schemaVersion!==1||v.generatorVersion!==1||v.blockVersion!==1){result=old();return;}
        result=natural(v.mined)&&natural(v.revision)&&typeof v.savedAt==='string'&&Number.isFinite(Date.parse(v.savedAt))?{status:'record',value:v.mined}:bad();
      };
      tx.oncomplete=()=>finish(hasWorld?result:missing());tx.onabort=()=>finish(bad());tx.onerror=()=>{};
    };
  });
}

/** Stateless, read-only adapters: deletion/reset takes effect on the next read. */
export async function readLocalRecord(gameId: string): Promise<LocalRecord> {
  const def=getRecordDefinition(gameId);if(!def)return bad('記録定義がありません');
  if(['game012','game013','game014'].includes(gameId))return bad('この旧作品の記録はポータル未対応です');
  let result:LocalRecord;
  if(gameId==='game031')result=await readWorldMetadata();
  else try{const backend=window.localStorage;result=scalarKeys[gameId]?await readScalar(gameId,backend):readJSON(gameId,backend);}catch{result=bad();}
  return {...result,label:def.localLabel};
}
