import { nativeMaximum, type LegacyId } from './legacyProtocol';

const DB='game100-record-legacy-v1',STORE='mirrors';
export interface LegacyMirror {schema:1;gameId:LegacyId;rulesetId:'1';normal?:number;legacy?:number;ojt?:number;updatedAt:string;}
export type LegacyRead={status:'record'|'none'|'legacy'|'unavailable';value?:number;detail?:string};
const validNumber=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
export function validLegacyMirror(v:unknown,id:LegacyId):v is LegacyMirror{
  if(!v||typeof v!=='object'||Array.isArray(v))return false;
  const p=v as LegacyMirror;
  return p.schema===1&&p.gameId===id&&p.rulesetId==='1'&&typeof p.updatedAt==='string'&&Number.isFinite(Date.parse(p.updatedAt))&&
    (p.normal===undefined||validNumber(p.normal,nativeMaximum(id)))&&(p.legacy===undefined||validNumber(p.legacy,Number.MAX_SAFE_INTEGER))&&
    (p.ojt===undefined||id==='game013'&&validNumber(p.ojt,11400));
}
type OpenResult={status:'ready';db:IDBDatabase}|{status:'absent'|'unavailable'};
function open(write:boolean):Promise<OpenResult>{return new Promise(resolve=>{try{
  if(!globalThis.indexedDB){resolve({status:'unavailable'});return;}const req=indexedDB.open(DB,1);let done=false;
  const finish=(result:OpenResult)=>{if(done){if(result.status==='ready')result.db.close();return;}done=true;clearTimeout(timer);resolve(result);};
  const timer=setTimeout(()=>finish({status:'unavailable'}),2000);
  req.onupgradeneeded=()=>{if(!write){req.transaction?.abort();finish({status:'absent'});}else req.result.createObjectStore(STORE);};
  req.onsuccess=()=>finish({status:'ready',db:req.result});req.onerror=()=>finish({status:'unavailable'});req.onblocked=()=>finish({status:'unavailable'});
}catch{resolve({status:'unavailable'});}});}
/** Small, atomic maximum mirror; never writes or reads engine filesystem/save bytes. */
export async function mirrorNativeBest(id:LegacyId,kind:'legacy'|'normal'|'ojt',value:number):Promise<boolean>{
  const max=kind==='legacy'?Number.MAX_SAFE_INTEGER:nativeMaximum(id);
  if(value!==-1&&!validNumber(value,max)||kind==='ojt'&&id!=='game013')return false;
  const opened=await open(true);if(opened.status!=='ready')return false;const db=opened.db;
  return new Promise(resolve=>{try{
    const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),req=store.get(id);
    req.onsuccess=()=>{const old=req.result;const next:LegacyMirror=validLegacyMirror(old,id)?{...old}:{schema:1,gameId:id,rulesetId:'1',updatedAt:new Date().toISOString()};
      if(value>=0)next[kind]=Math.max(next[kind]??0,value);
      // A missing native file is not a new zero and never lowers another tab's confirmed maximum.
      next.updatedAt=new Date().toISOString();store.put(next,id);
    };
    tx.oncomplete=()=>{db.close();window.dispatchEvent(new Event('game100:records:changed'));try{localStorage.setItem('game100:records:legacy-notice:v1',crypto.randomUUID());}catch{}resolve(true);};
    tx.onabort=()=>{db.close();resolve(false);};tx.onerror=()=>{};
  }catch{db.close();resolve(false);}});
}
export async function readLegacyMirror(id:LegacyId):Promise<LegacyRead>{
  if(!globalThis.indexedDB)return {status:'unavailable',detail:'この環境では個人記録の保存を取得できません'};
  // Reading never creates the engine database or initializes a game's native save.
  const opened=await open(false);if(opened.status==='absent')return {status:'none'};if(opened.status!=='ready')return {status:'unavailable',detail:'この環境では記録の保存を取得できません'};const db=opened.db;
  return new Promise(resolve=>{try{
    const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(id);let result:LegacyRead={status:'none'};
    req.onsuccess=()=>{const p=req.result;if(p===undefined)return;if(!validLegacyMirror(p,id)){result={status:'unavailable',detail:'記録連携データの形式が不正です'};return;}
      if(id==='game012'&&(p.normal!==undefined||p.legacy!==undefined))result={status:'record',value:Math.max(p.normal??0,p.legacy??0),detail:'得点規則が一致する元保存BESTと確定記録の最大値（過去記録の共有はしません）'};
      else if(p.normal!==undefined)result={status:'record',value:p.normal,detail:'元ゲームで確認した通常記録'};
      else if(p.legacy!==undefined)result={status:'legacy',value:p.legacy,detail:`旧BEST ${p.legacy.toLocaleString('ja-JP')}点（OJT使用履歴不明・通常記録とは比較しません）`};
      else if(p.ojt!==undefined)result={status:'legacy',detail:`OJT補助ありBEST ${p.ojt.toLocaleString('ja-JP')}点・通常記録なし`};
    };
    tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=()=>{db.close();resolve({status:'unavailable'});};tx.onerror=()=>{};
  }catch{db.close();resolve({status:'unavailable'});}});
}
