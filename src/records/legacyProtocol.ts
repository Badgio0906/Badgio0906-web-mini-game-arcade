import { getRecordDefinition } from '../data/recordDefinitions';

export const LEGACY_CHANNEL='game100-native-record';
export const legacyIds=['game012','game013','game014'] as const;
export type LegacyId=typeof legacyIds[number];
export type LegacyKind='legacy_best'|'current_best'|'start'|'result'|'storage_error'|'scope_end';
export interface LegacyMessage {channel:typeof LEGACY_CHANNEL; schema:1; game_id:LegacyId; session:string; kind:LegacyKind; ruleset_id:'1'; mode_id:'normal'|'ojt'; practice:boolean; value?:number; run_result_id?:string;}
export const nativeMaximum=(id:LegacyId)=>id==='game013'?11400:id==='game014'?25:Number.MAX_SAFE_INTEGER;
export const isUuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
/** Exact primitive schema. Origin/window/session checks are separately mandatory. */
export function validateLegacyMessage(input:unknown,gameId:string,session:string):LegacyMessage|null{
  if(!input||typeof input!=='object'||Array.isArray(input)||!legacyIds.includes(gameId as LegacyId))return null;
  const p=input as Record<string,unknown>;
  if(typeof p.kind!=='string')return null;
  const common=['channel','schema','game_id','session','kind','ruleset_id','mode_id','practice'];
  const withValue=['legacy_best','current_best','result'].includes(String(p.kind)),withRun=['start','result'].includes(String(p.kind));
  const fields=[...common,...(withValue?['value']:[]),...(withRun?['run_result_id']:[])];
  if(Object.keys(p).length!==fields.length||Object.keys(p).some(k=>!fields.includes(k)))return null;
  if(p.channel!==LEGACY_CHANNEL||p.schema!==1||p.game_id!==gameId||!isUuid(session)||p.session!==session||p.ruleset_id!=='1'||typeof p.practice!=='boolean')return null;
  if(!['legacy_best','current_best','start','result','storage_error','scope_end'].includes(String(p.kind)))return null;
  if(p.mode_id!=='normal'&&(gameId!=='game013'||p.mode_id!=='ojt'))return null;
  if(['legacy_best','current_best','storage_error','scope_end'].includes(p.kind)&&p.mode_id!=='normal')return null;
  if(withRun&&!isUuid(p.run_result_id))return null;
  if(withValue){const max=p.kind==='legacy_best'?Number.MAX_SAFE_INTEGER:nativeMaximum(gameId as LegacyId);if(typeof p.value!=='number'||!Number.isSafeInteger(p.value)||p.value<(p.kind==='result'?0:-1)||p.value>max)return null;}
  return p as unknown as LegacyMessage;
}
export function legacyBoardMatches(id:LegacyId){const d=getRecordDefinition(id);return !!d&&d.rulesetId==='1'&&d.modeId==='normal';}
