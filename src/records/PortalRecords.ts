import { getRecordDefinition, type RecordDefinition } from '../data/recordDefinitions';
import { readLocalRecord } from './localRecords';
import { PublicBests, recordsEndpoint, type PublicBestState } from './PublicBests';

export function formatRecordValue(value:number, definition:RecordDefinition):string {
  return `${(value/definition.storageScale).toLocaleString('ja-JP',{minimumFractionDigits:definition.displayPrecision,maximumFractionDigits:definition.displayPrecision})} ${definition.unit}`;
}
export function publicStateLabel(state:PublicBestState, definition:RecordDefinition):string {
  if(!definition.publicEnabled)return ['game012','game013','game014'].includes(definition.gameId)?'未対応（旧作品）':'全体比較なし';
  const board=state.boards.get(definition.boardId);
  if(state.status==='preparing')return '準備中';
  if(state.status==='loading')return '読み込み中';
  if(state.status==='failed')return '取得できません';
  if(!board)return '取得できません';
  if(board.value===null)return state.status==='stale'?'前回取得：記録なし':'まだ記録なし';
  return `${state.status==='stale'?'前回取得：':''}${formatRecordValue(board.value,definition)}`;
}
export function installPortalRecords(gallery:HTMLElement){
  const api=new PublicBests(),cards=new Map<string,{local:HTMLElement;everyone:HTMLElement;condition:HTMLElement}>();let localRevision=0;
  for(const card of gallery.querySelectorAll<HTMLElement>('.game-card')){
    const id=card.dataset.gameId!,def=getRecordDefinition(id);if(!def)continue;
    const box=document.createElement('div');box.className='card-records';box.id=`records-${id}`;
    const list=document.createElement('dl');
    const row=(label:string)=>{const pair=document.createElement('div'),name=document.createElement('dt'),value=document.createElement('dd');name.textContent=label;pair.append(name,value);list.append(pair);return value;};
    const local=row(def.localLabel),everyone=row(def.publicEnabled?'みんなのBEST':'全体比較');local.textContent='読み込み中';everyone.textContent=publicStateLabel(api.getState(),def);
    const condition=document.createElement('p');condition.className='record-condition';condition.textContent=`${def.metricLabel} · ${def.modeLabel}`;
    box.append(list,condition);card.querySelector('.game-image')!.after(box);card.setAttribute('aria-describedby',box.id);cards.set(id,{local,everyone,condition});
  }
  const localRefresh=async()=>{
    const rev=++localRevision;
    await Promise.all([...cards].map(async([id,views])=>{const d=getRecordDefinition(id)!,record=await readLocalRecord(id);if(rev!==localRevision)return;views.local.textContent=record.status==='record'&&record.value!==undefined?formatRecordValue(record.value,d):record.status==='none'?'記録なし':record.status==='legacy'?'現行記録なし':'取得できません';views.local.title=record.detail??'';}));
  };
  const publicRefresh=async()=>{const state=await api.refresh();for(const[id,views]of cards){const def=getRecordDefinition(id)!;views.everyone.textContent=publicStateLabel(state,def);const date=def.publicEnabled&&state.fetchedAt?`取得日時：${new Date(state.fetchedAt).toLocaleString('ja-JP')}`:'';views.everyone.title=date;views.condition.textContent=`${def.metricLabel} · ${def.modeLabel}${date?` · ${date}`:''}`;}};
  const refresh=()=>{void localRefresh();void publicRefresh();};refresh();
  let timer:number|undefined;
  const startRefresh=()=>{if(recordsEndpoint&&timer===undefined)timer=window.setInterval(()=>{if(document.visibilityState==='visible')void publicRefresh();},61000);};
  startRefresh();
  window.addEventListener('pageshow',()=>{startRefresh();refresh();});
  window.addEventListener('pagehide',()=>{clearInterval(timer);timer=undefined;});
  window.addEventListener('storage',()=>void localRefresh());
  window.addEventListener('game100:records:changed',()=>void localRefresh());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  return {refresh};
}
