import { recordBoards } from '../../src/data/recordDefinitions';
import type { Env, Database } from './types';
const boards = () => recordBoards.filter(board => board.publicEnabled);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RECEIPT = /^[0-9a-f]{64}$/;
const MAX_BODY = 8192;
const obj = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).every(key => keys.includes(key)) && keys.every(key => Object.hasOwn(value,key));
const whole = (value: unknown,max=Number.MAX_SAFE_INTEGER): value is number => typeof value==='number' && Number.isSafeInteger(value) && value>=0 && value<=max;
const id = (value: unknown): value is string => typeof value==='string' && UUID.test(value);
const receipt = (value:unknown): value is string => typeof value==='string' && RECEIPT.test(value);
function json(value: unknown,status=200,origin?:string,cache=false,extra:Record<string,string>={}) {
 const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':cache?'public, max-age=60, must-revalidate':'no-store','X-Content-Type-Options':'nosniff',Vary:'Origin',...extra};
 if(origin){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin';}
 return new Response(JSON.stringify(value),{status,headers});
}
const error=(code:string,status:number,origin?:string)=>json({error:code},status,origin,false,status===429?{'Retry-After':'60','Access-Control-Expose-Headers':'Retry-After'}:{});
async function hash(value:string) {return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function authorize(request:Request,env:Env,origin?:string) {
 if(!env.ANALYTICS_ADMIN_TOKEN)return error('admin_not_configured',503,origin);
 const header=request.headers.get('Authorization')??'';
 if(!header.startsWith('Bearer ')||header.length>4096)return error('unauthorized',401,origin);
 const a=await hash(header.slice(7)),b=await hash(env.ANALYTICS_ADMIN_TOKEN);let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);
 if(mismatch)return error('unauthorized',401,origin);
}
async function body(request:Request,origin?:string):Promise<Record<string,unknown>|Response> {
 if(!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('Content-Type')??''))return error('unsupported_content_type',415,origin);
 const length=request.headers.get('Content-Length');if(length&&(!/^\d+$/.test(length)||Number(length)>MAX_BODY))return error('body_too_large',413,origin);
 if(!request.body)return error('invalid_json',400,origin);
 const reader=request.body.getReader();let timeout:ReturnType<typeof setTimeout>|undefined;
 const read=(async()=>{const chunks:Uint8Array[]=[];let bytes=0;try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>MAX_BODY){await reader.cancel();return error('body_too_large',413,origin);}chunks.push(value);}const out=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){out.set(chunk,offset);offset+=chunk.length;}const parsed:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(out));return obj(parsed)?parsed:error('invalid_json',400,origin);}catch{return error('invalid_json',400,origin);}finally{reader.releaseLock();}})();
 const expired=new Promise<Response>(resolve=>{timeout=setTimeout(()=>{void reader.cancel();resolve(error('body_timeout',408,origin));},5000);});
 try{return await Promise.race([read,expired]);}finally{clearTimeout(timeout);}
}
async function initialize(db:Database) {
 const now=new Date().toISOString();
 await db.batch(boards().flatMap(b=>[db.prepare('INSERT INTO record_boards(board_id,game_id,metric_id,ruleset_id,mode_id,direction,storage_scale,public_enabled,collected_since) VALUES(?,?,?,?,?,?,?,1,?) ON CONFLICT(board_id) DO NOTHING').bind(b.boardId,b.gameId,b.metricId,b.rulesetId,b.modeId,b.direction,b.storageScale,now),db.prepare('INSERT INTO record_leaderboard_revisions(board_id,revision) VALUES(?,0) ON CONFLICT(board_id) DO NOTHING').bind(b.boardId)]));
}
interface Row {participant_id:string|null;id:string;submission_key:string;run_result_id:string;board_id:string;value:number;received_at:string;status:string;metadata_json:string;content_hash:string;receipt_hash:string;inspection_reason:string|null;expires_at:string|null;}
const readKey=async(db:Database,key:string)=>(await db.prepare('SELECT * FROM record_submissions WHERE submission_key=?').bind(key).all<Row>()).results[0];
const answer=(row:Row,duplicate:boolean,origin?:string)=>json({submission_key:row.submission_key,status:row.status,received_at:row.received_at,duplicate},duplicate?200:row.status==='pending'?202:201,origin);

interface Participant {participant_id:string;public_label:string;status:string;}
const participantByHash=async(db:Database,digest:string)=>(await db.prepare('SELECT participant_id,public_label,status FROM record_participants WHERE credential_hash=?').bind(digest).all<Participant>()).results[0];
async function register(request:Request,env:Env,origin:string) {
 const data=await body(request,origin);if(data instanceof Response)return data;
 if(!exact(data,['schema_version','credential'])||data.schema_version!==1||!receipt(data.credential))return error('invalid_participant',400,origin);
 const digest=await hash(data.credential),prior=await participantByHash(env.DB,digest);
 const answerParticipant=(p:Participant)=>p.status==='active'?json({schema_version:1,public_label:p.public_label},200,origin):error('invalid_credential',401,origin);
 if(prior)return answerParticipant(prior);
 // Public decimal labels are independently randomized, never derived from credentials/IDs.
 for(let attempt=0;attempt<8;attempt++){
  const random=crypto.getRandomValues(new Uint32Array(2));
  const label='ガレージ住人 '+[...random].map(n=>String(n%1000000).padStart(6,'0')).join('');
  try{await env.DB.prepare('INSERT INTO record_participants(participant_id,public_label,credential_hash,created_at) VALUES(?,?,?,?) ON CONFLICT DO NOTHING').bind(crypto.randomUUID(),label,digest,new Date().toISOString()).run();}
  catch(cause){if(cause instanceof Error&&cause.message.includes('records_registration_rate_limited'))return error('rate_limited',429,origin);throw cause;}
  const participant=await participantByHash(env.DB,digest);if(participant)return answerParticipant(participant);
 }
 return error('participant_unavailable',503,origin);
}

async function submit(request:Request,env:Env,origin:string) {
 const data=await body(request,origin);if(data instanceof Response)return data;
 const keys=['schema_version','submission_key','run_result_id','game_id','board_id','ruleset_id','game_build','environment','value','withdrawal_receipt','allowed_result_metadata'];
 if(!exact(data,keys)||data.schema_version!==1||!id(data.submission_key)||!id(data.run_result_id)||!receipt(data.withdrawal_receipt)||typeof data.game_build!=='string'||! /^[a-zA-Z0-9_.-]{1,80}$/.test(data.game_build)||data.environment!=='production')return error('invalid_submission',400,origin);
 const board=boards().find(b=>b.boardId===data.board_id);
 if(!board)return error('unknown_board',404,origin);
 if(data.game_id!==board.gameId||data.ruleset_id!==board.rulesetId||!whole(data.value,board.maxValue))return error('invalid_record_conditions',400,origin);
 const meta=data.allowed_result_metadata;
 if(!obj(meta)||!exact(meta,['finalized','mode_id','assistance','duration_ms','outcome'])||meta.finalized!==true||meta.mode_id!==board.modeId||typeof meta.assistance!=='string'||!['none','allowed'].includes(meta.assistance)||!whole(meta.duration_ms,86400000)||typeof meta.outcome!=='string'||!['complete','quit','milestone'].includes(meta.outcome))return error('invalid_result_metadata',400,origin);
 if(board.gameId==='game032'&&(meta.outcome!=='complete'||(meta.duration_ms as number)<300000))return error('invalid_fishing_outing',400,origin);
 if(board.assistancePolicy==='none'&&meta.assistance!=='none')return error('assistance_not_allowed',400,origin);
 const metadata=JSON.stringify({finalized:true,mode_id:meta.mode_id,assistance:meta.assistance,duration_ms:meta.duration_ms,outcome:meta.outcome});
 const credential=request.headers.get('X-Record-Credential');let participant:Participant|undefined;
 if(credential!==null){if(!receipt(credential))return error('invalid_credential',401,origin);participant=await participantByHash(env.DB,await hash(credential));if(!participant||participant.status!=='active')return error('invalid_credential',401,origin);}
 const receiptHash=await hash(data.withdrawal_receipt);
 const canonical=[data.game_id,data.board_id,data.ruleset_id,data.game_build,data.environment,data.value,data.run_result_id,metadata,receiptHash];
 // Legacy hashes remain byte-for-byte compatible; attributed retries bind their owner.
 if(participant)canonical.push(participant.participant_id);
 const contentHash=await hash(JSON.stringify(canonical));
 const previous=await readKey(env.DB,data.submission_key);
 if(previous)return previous.content_hash===contentHash?answer(previous,true,origin):error('submission_conflict',409,origin);
 if(env.RATE_LIMITER && !(await env.RATE_LIMITER.limit({key:'records-global-admission-v1'})).success)return error('rate_limited',429,origin);
 const now=new Date().toISOString(),status=board.pendingAbove!==null&&data.value>board.pendingAbove?'pending':'accepted';
 // Expiry retains the deduplication/withdrawal tombstone, removes optional result metadata.
 const expire=env.DB.prepare("UPDATE record_submissions SET status='rejected',metadata_json='{}',inspection_reason='pending_expired',expires_at=NULL WHERE status='pending' AND expires_at<=?").bind(now);
 let inserted=false;
 const insert=env.DB.prepare('INSERT OR IGNORE INTO record_submissions(id,submission_key,run_result_id,board_id,value,received_at,status,metadata_json,content_hash,receipt_hash,validation_version,inspection_reason,expires_at,participant_id) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,?,?)').bind(crypto.randomUUID(),data.submission_key,data.run_result_id,board.boardId,data.value,now,status,metadata,contentHash,receiptHash,status==='pending'?'unusually_large_value':null,status==='pending'?new Date(Date.now()+7*86400000).toISOString():null,participant?.participant_id??null);
 try{const results=await env.DB.batch([expire,insert]);inserted=(results[1]?.meta?.changes??0)>0;}catch(cause){const message=cause instanceof Error?cause.message:'';if(message.includes('records_rate_limited'))return error('rate_limited',429,origin);if(message.includes('records_pending_full'))return error('pending_capacity',429,origin);throw cause;}
 const row=await readKey(env.DB,data.submission_key);
 if(!row)return error('run_result_conflict',409,origin);
 if(row.content_hash!==contentHash)return error('submission_conflict',409,origin);
 return answer(row,!inserted,origin);
}
async function withdraw(request:Request,env:Env,origin:string) {
 const data=await body(request,origin);if(data instanceof Response)return data;
 if(!exact(data,['submission_key','withdrawal_receipt'])||!id(data.submission_key)||!receipt(data.withdrawal_receipt))return error('invalid_withdrawal',400,origin);
 const row=await readKey(env.DB,data.submission_key);if(!row||row.receipt_hash!==await hash(data.withdrawal_receipt))return error('withdrawal_not_found',404,origin);
 await env.DB.prepare("UPDATE record_submissions SET status='withdrawn',metadata_json='{}',inspection_reason='user_withdrawal',expires_at=NULL WHERE submission_key=? AND status<>'withdrawn'").bind(data.submission_key).run();
 return json({status:'withdrawn'},200,origin);
}
async function publicBests(env:Env,origin?:string) {
 // Both public views read the same projection in one SQLite statement/snapshot.
 const rows=(await env.DB.prepare(`SELECT b.board_id,b.collected_since,COALESCE(r.revision,0) AS revision,
  (SELECT pb.value FROM record_participant_bests pb JOIN record_participants p ON p.participant_id=pb.participant_id AND p.status='active'
   WHERE pb.board_id=b.board_id ORDER BY pb.rank_value,pb.received_at,pb.submission_id LIMIT 1) AS value
  FROM record_boards b LEFT JOIN record_leaderboard_revisions r ON r.board_id=b.board_id WHERE b.public_enabled=1`).all<{board_id:string;collected_since:string;revision:number;value:number|null}>()).results;
 return json({schema_version:1,definition_version:'1',generated_at:new Date().toISOString(),cache_ttl_seconds:60,boards:boards().map(board=>{const row=rows.find(r=>r.board_id===board.boardId);return {game_id:board.gameId,board_id:board.boardId,metric_id:board.metricId,value:row?.value??null,unit:board.unit,mode_label:board.modeLabel,ruleset_id:board.rulesetId,status:row?.value!==null&&row?.value!==undefined?'accepted':'empty',collected_since:row?.collected_since??null,revision:row?.revision??0};})},200,origin,true);
}
async function publicLeaderboard(env:Env,url:URL,origin?:string) {
 const query:[string,string][]=[];url.searchParams.forEach((value,key)=>query.push([key,value]));
 if(query.length!==1||query[0][0]!=='board_id'||!query[0][1])return error('invalid_query',400,origin);
 const board=boards().find(b=>b.boardId===query[0][1]);if(!board)return error('unknown_board',404,origin);
 const rows=(await env.DB.prepare(`SELECT r.revision,t.public_label,t.value,t.received_at FROM record_leaderboard_revisions r LEFT JOIN (
  SELECT pb.board_id,p.public_label,pb.value,pb.received_at,pb.rank_value,pb.submission_id FROM record_participant_bests pb
  JOIN record_participants p ON p.participant_id=pb.participant_id AND p.status='active'
  WHERE pb.board_id=? ORDER BY pb.rank_value,pb.received_at,pb.submission_id LIMIT 10
 ) t ON t.board_id=r.board_id WHERE r.board_id=? ORDER BY t.rank_value,t.received_at,t.submission_id`).bind(board.boardId,board.boardId).all<{revision:number;public_label:string|null;value:number|null;received_at:string|null}>()).results;
 const entries=rows.filter(row=>row.public_label!==null).map((row,index)=>({rank:index+1,public_label:row.public_label,value:row.value,received_at:row.received_at}));
 return json({schema_version:1,board_id:board.boardId,game_id:board.gameId,metric_label:board.metricLabel,mode_label:board.modeLabel,ruleset_id:board.rulesetId,direction:board.direction,unit:board.unit,generated_at:new Date().toISOString(),revision:rows[0]?.revision??0,cache_ttl_seconds:60,entries},200,origin,true);
}
async function review(request:Request,env:Env,origin:string|undefined,target:string,boardRecalculate=false) {
 const data=await body(request,origin);if(data instanceof Response)return data;
 if(!exact(data,boardRecalculate?['operation_key','reason']:['operation_key','decision','reason'])||!id(data.operation_key)||typeof data.reason!=='string'||data.reason.trim().length<1||data.reason.length>240||/[\x00-\x1f]/.test(data.reason)||!boardRecalculate&&(typeof data.decision!=='string'||!['accept','reject','revoke','restore'].includes(data.decision)))return error('invalid_review',400,origin);
 const digest=await hash(JSON.stringify([target,boardRecalculate?'recalculate':data.decision,data.reason]));
 const prior=(await env.DB.prepare('SELECT content_hash FROM record_moderation WHERE operation_key=?').bind(data.operation_key).all<{content_hash:string}>()).results[0];
 if(prior)return prior.content_hash===digest?json({status:'reviewed',duplicate:true},200,origin):error('operation_conflict',409,origin);
 const now=new Date().toISOString();
 if(boardRecalculate){if(!boards().some(b=>b.boardId===target))return error('unknown_board',404,origin);
  await env.DB.batch([
   env.DB.prepare("INSERT INTO record_moderation VALUES(?, ?, ?, 'board', 'recalculated', ?, ?) ON CONFLICT(operation_key) DO NOTHING").bind(data.operation_key,digest,target,data.reason,now),
   env.DB.prepare('DELETE FROM record_participant_bests WHERE board_id=?').bind(target),
   env.DB.prepare(`INSERT INTO record_participant_bests(board_id,participant_id,submission_id,value,rank_value,received_at)
    SELECT board_id,participant_id,id,value,rank_value,received_at FROM (
     SELECT s.board_id,s.participant_id,s.id,s.value,CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END AS rank_value,s.received_at,
      ROW_NUMBER() OVER(PARTITION BY s.participant_id ORDER BY CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at,s.id) AS n
     FROM record_submissions s JOIN record_boards b ON b.board_id=s.board_id JOIN record_participants p ON p.participant_id=s.participant_id AND p.status='active'
     WHERE s.board_id=? AND s.status='accepted'
    ) WHERE n=1`).bind(target),
   env.DB.prepare('UPDATE record_leaderboard_revisions SET revision=revision+1 WHERE board_id=?').bind(target),
   env.DB.prepare("INSERT INTO record_bests VALUES(?,NULL,0,?) ON CONFLICT(board_id) DO NOTHING").bind(target,now),
   env.DB.prepare('UPDATE record_bests SET submission_id=(SELECT submission_id FROM record_participant_bests WHERE board_id=? ORDER BY rank_value,received_at,submission_id LIMIT 1),revision=revision+1,updated_at=? WHERE board_id=?').bind(target,now,target)
  ]);
 }else{
  if(!id(target))return error('unknown_submission',404,origin);
  const transitions:Record<string,{from:string[];to:string}>={accept:{from:['pending'],to:'accepted'},reject:{from:['pending'],to:'rejected'},revoke:{from:['accepted'],to:'revoked'},restore:{from:['revoked','rejected'],to:'pending'}};
  const transition=transitions[String(data.decision)];
  const placeholders=transition.from.map(()=>'?').join(',');
  await env.DB.batch([env.DB.prepare(`INSERT INTO record_moderation(operation_key,content_hash,target_id,old_status,new_status,reason,occurred_at) SELECT ?,?,id,status,?,?,? FROM record_submissions WHERE id=? AND status IN (${placeholders}) ON CONFLICT(operation_key) DO NOTHING`).bind(data.operation_key,digest,transition.to,data.reason,now,target,...transition.from),env.DB.prepare(`UPDATE record_submissions SET status=?,inspection_reason=?,expires_at=? WHERE id=? AND status IN (${placeholders}) AND EXISTS(SELECT 1 FROM record_moderation WHERE operation_key=? AND content_hash=?)`).bind(transition.to,'operator_review',transition.to==='pending'?new Date(Date.now()+7*86400000).toISOString():null,target,...transition.from,data.operation_key,digest)]);
 }
 const outcome=(await env.DB.prepare('SELECT content_hash FROM record_moderation WHERE operation_key=?').bind(data.operation_key).all<{content_hash:string}>()).results[0];
 if(!outcome)return error('review_state_conflict',409,origin);if(outcome.content_hash!==digest)return error('operation_conflict',409,origin);
 return json({status:'reviewed',duplicate:false},200,origin);
}
export async function handleRecords(request:Request,env:Env,origin?:string):Promise<Response> {
 const url=new URL(request.url),path=url.pathname,isAdmin=path.startsWith('/v1/records/admin/');
 if(request.headers.has('Origin')&&!origin)return error('invalid_origin',403);
 if(request.method==='OPTIONS'){
  if(!origin)return error('invalid_origin',403);
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':isAdmin?'GET, POST, OPTIONS':'GET, POST, OPTIONS','Access-Control-Allow-Headers':isAdmin?'Authorization, Content-Type':'Content-Type, X-Record-Credential','Access-Control-Max-Age':'600',Vary:'Origin','Cache-Control':'no-store'}});
 }
 if(isAdmin){const denied=await authorize(request,env,origin);if(denied)return denied;}
 if(!isAdmin&&request.headers.has('Authorization'))return error('authorization_not_allowed',401,origin);
 if(env.RECORDS_ENABLED!=='true')return error('records_preparing',503,origin);
 if(request.headers.has('X-Record-Credential')&&path!=='/v1/records/submissions')return error('credential_not_allowed',400,origin);
 if(path!=='/v1/records/admin/submissions'&&path!=='/v1/records/public/leaderboard'&&url.search)return error('invalid_query',400,origin);
 if(!isAdmin&&request.method!=='GET'&&!origin)return error('invalid_origin',403);
 await initialize(env.DB);
 await env.DB.prepare("UPDATE record_submissions SET status='rejected',metadata_json='{}',inspection_reason='pending_expired',expires_at=NULL WHERE status='pending' AND expires_at<=?").bind(new Date().toISOString()).run();
 if(path==='/v1/records/participants')return request.method==='POST'?register(request,env,origin!):error('method_not_allowed',405,origin);
 if(path==='/v1/records/public/leaderboard')return request.method==='GET'?publicLeaderboard(env,url,origin):error('method_not_allowed',405,origin);
 if(path==='/v1/records/public/bests')return request.method==='GET'?publicBests(env,origin):error('method_not_allowed',405,origin);
 if(path==='/v1/records/submissions')return request.method==='POST'?submit(request,env,origin!):error('method_not_allowed',405,origin);
 if(path==='/v1/records/submissions/withdraw')return request.method==='POST'?withdraw(request,env,origin!):error('method_not_allowed',405,origin);
 if(path==='/v1/records/admin/submissions'){
  if(request.method!=='GET')return error('method_not_allowed',405,origin);
  let invalidQuery=false;url.searchParams.forEach((_value,key)=>{if(!['board_id','status','limit'].includes(key))invalidQuery=true;});
  if(invalidQuery)return error('invalid_query',400,origin);
  const board=url.searchParams.get('board_id'),status=url.searchParams.get('status'),limit=url.searchParams.get('limit')??'50';
  if(board&&!boards().some(b=>b.boardId===board)||status&&!['accepted','pending','rejected','revoked','withdrawn'].includes(status)||!/^\d+$/.test(limit)||Number(limit)<1||Number(limit)>100)return error('invalid_query',400,origin);
  const conditions:string[]=[],params:unknown[]=[];if(board){conditions.push('board_id=?');params.push(board);}if(status){conditions.push('status=?');params.push(status);}params.push(Number(limit));
  const rows=(await env.DB.prepare(`SELECT id,board_id,value,received_at,status,inspection_reason,metadata_json FROM record_submissions ${conditions.length?'WHERE '+conditions.join(' AND '):''} ORDER BY received_at DESC,id DESC LIMIT ?`).bind(...params).all()).results;
  return json({submissions:rows},200,origin);
 }
 const match=path.match(/^\/v1\/records\/admin\/(submissions\/([^/]+)\/review|boards\/([^/]+)\/recalculate)$/);
 if(match)return request.method==='POST'?review(request,env,origin,decodeURIComponent(match[2]??match[3]),!!match[3]):error('method_not_allowed',405,origin);
 return error('not_found',404,origin);
}
