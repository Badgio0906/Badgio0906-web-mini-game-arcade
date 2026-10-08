import { getRecordDefinition } from '../data/recordDefinitions';

const DATABASE='game100-record-current-v1',STORE='markers';
export interface CurrentRuleMarker {boardId:string;rulesetId:string;modeId:string;value:number;sourceStamp:string;sourceValueAtCapture:number;updatedAt:string;}
function open():Promise<IDBDatabase|null>{
  return new Promise(resolve=>{try{
    if(typeof indexedDB==='undefined'){resolve(null);return;}
    const request=indexedDB.open(DATABASE,1);let settled=false;
    const finish=(db:IDBDatabase|null)=>{if(settled){db?.close();return;}settled=true;clearTimeout(timer);resolve(db);};
    const timer=setTimeout(()=>finish(null),2000);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
    request.onsuccess=()=>finish(request.result);request.onerror=()=>finish(null);request.onblocked=()=>finish(null);
  }catch{resolve(null);}});
}
export async function readCurrentRule(gameId:string):Promise<unknown>{
  const db=await open();if(!db)return null;
  return new Promise(resolve=>{try{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(gameId);let value:unknown=null;
    request.onsuccess=()=>{value=request.result??null;};tx.oncomplete=()=>{db.close();resolve(value);};tx.onabort=()=>{db.close();resolve(null);};tx.onerror=()=>{};
  }catch{db.close();resolve(null);}});
}
/** One atomic read/maximum/write per game; never writes the original game's BEST. */
export async function storeCurrentRule(gameId:string,value:number):Promise<void>{
  if(!['game015','game019'].includes(gameId))return;
  const def=getRecordDefinition(gameId);if(!def||!Number.isSafeInteger(value)||value<0||value>def.maxValue)return;
  const db=await open();if(!db)return;
  await new Promise<void>(resolve=>{try{
    const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.get(gameId);
    request.onsuccess=()=>{try{
      const sourceStamp=localStorage.getItem(`web-mini-arcade:v1:${gameId}:${gameId==='game015'?'best':'bestHeightDm'}`);
      if(sourceStamp===null||!/^\d+$/.test(sourceStamp))return;
      const source=Number(sourceStamp);if(!Number.isSafeInteger(source)||source<0||source>def.maxValue)return;
      const old=request.result as Partial<CurrentRuleMarker>|undefined;
      const matches=old?.boardId===def.boardId&&old.rulesetId===def.rulesetId&&old.modeId===def.modeId&&typeof old.sourceValueAtCapture==='number'&&source>=old.sourceValueAtCapture&&Number.isSafeInteger(old.value)&&old.value!>=0;
      store.put({boardId:def.boardId!,rulesetId:def.rulesetId,modeId:def.modeId,value:Math.max(matches?old!.value!:0,value),sourceStamp,sourceValueAtCapture:source,updatedAt:new Date().toISOString()} satisfies CurrentRuleMarker,gameId);
    }catch{tx.abort();}};
    tx.oncomplete=()=>{db.close();window.dispatchEvent(new Event('game100:records:changed'));try{localStorage.setItem('game100:records:current-notice:v1',crypto.randomUUID());}catch{}resolve();};
    tx.onabort=()=>{db.close();resolve();};tx.onerror=()=>{};
  }catch{db.close();resolve();}});
}
