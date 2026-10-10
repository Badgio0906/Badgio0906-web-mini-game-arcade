import { getRecordDefinition } from '../data/recordDefinitions';
import type { RecordSubmission } from './protocol';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
/** Client queues are untrusted too. Reject extra fields before any outbound fetch. */
export function safeSubmission(input:unknown):RecordSubmission|null {
  if(!object(input)||!exact(input,['schema_version','submission_key','run_result_id','game_id','board_id','ruleset_id','game_build','environment','value','withdrawal_receipt','allowed_result_metadata']))return null;
  if(typeof input.game_id!=='string')return null;const d=getRecordDefinition(input.game_id);
  if(!d?.publicEnabled||input.schema_version!==1||input.environment!=='production'||!uuid(input.submission_key)||!uuid(input.run_result_id)||input.board_id!==d.boardId||input.ruleset_id!==d.rulesetId||typeof input.game_build!=='string'||!/^[a-zA-Z0-9_.-]{1,80}$/.test(input.game_build)||typeof input.value!=='number'||!Number.isSafeInteger(input.value)||input.value<0||input.value>d.maxValue||typeof input.withdrawal_receipt!=='string'||!/^[a-f0-9]{64}$/.test(input.withdrawal_receipt))return null;
  const m=input.allowed_result_metadata;
  if(!object(m)||!exact(m,['finalized','mode_id','assistance','duration_ms','outcome'])||m.finalized!==true||m.mode_id!==d.modeId||m.assistance!==d.assistancePolicy||typeof m.duration_ms!=='number'||!Number.isSafeInteger(m.duration_ms)||m.duration_ms<0||m.duration_ms>86400000||typeof m.outcome!=='string'||!['complete','quit','milestone'].includes(m.outcome))return null;
  if(d.gameId==='game032'&&(m.outcome!=='complete'||m.duration_ms<300000))return null;
  return {schema_version:1,submission_key:input.submission_key as string,run_result_id:input.run_result_id as string,game_id:d.gameId,board_id:d.boardId,ruleset_id:d.rulesetId,game_build:input.game_build,environment:'production',value:input.value,withdrawal_receipt:input.withdrawal_receipt,allowed_result_metadata:{finalized:true,mode_id:d.modeId,assistance:d.assistancePolicy,duration_ms:m.duration_ms,outcome:m.outcome as 'complete'|'quit'|'milestone'}};
}
