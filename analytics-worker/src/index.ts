import { ANALYTICS_MAX_BODY_BYTES, isAnalyticsBatch } from '../../src/data/analyticsEnvelope';
import { computeMetrics, summarizeGames, unpack } from './aggregate';
import type { AggregateDay, Database, Env, Period, StoredEvent } from './types';
const PRODUCTION_ORIGINS = new Set(['https://game100garage.com','https://www.game100garage.com']);
export function allowedOrigin(origin:string|null,env:Env):boolean {
 if(!origin)return false;if(PRODUCTION_ORIGINS.has(origin))return true;
 if(env.ENVIRONMENT!=='development')return false;
 try {const url=new URL(origin);return ['http:','https:'].includes(url.protocol)&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.origin===origin;}catch{return false;}
}
function response(value:unknown,status=200,origin?:string){const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(origin){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin';}return new Response(JSON.stringify(value),{status,headers});}
function error(code:string,status:number,origin?:string){return response({error:code},status,origin);}
function integer(value:string|undefined,fallback:number,max:number):number{const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=max?n:fallback;}
function retention(env:Env){return {rawDays:integer(env.RAW_RETENTION_DAYS,90,365),aggregateMonths:integer(env.AGGREGATE_RETENTION_MONTHS,13,36)};}
export function rawCutoff(env:Env,now=Date.now()):Date {
 const date=new Date(now-retention(env).rawDays*86400000);if(date.getUTCHours()||date.getUTCMinutes()||date.getUTCSeconds()||date.getUTCMilliseconds())date.setUTCDate(date.getUTCDate()+1);date.setUTCHours(0,0,0,0);return date;
}
async function readBody(request:Request):Promise<string|null>{
 const length=request.headers.get('Content-Length');if(length&&(Number(length)>ANALYTICS_MAX_BODY_BYTES||!/^\d+$/.test(length)))return null;
 if(!request.body)return '';const reader=request.body.getReader(),parts:Uint8Array[]=[];let bytes=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>ANALYTICS_MAX_BODY_BYTES){await reader.cancel();return null;}parts.push(value);}}finally{reader.releaseLock();}
 const merged=new Uint8Array(bytes);let offset=0;for(const p of parts){merged.set(p,offset);offset+=p.length;}return new TextDecoder('utf-8',{fatal:true}).decode(merged);
}
const columns=['event_id','received_at','occurred_at','schema_version','browser_id','visit_id','session_id','run_id','game_id','event_name','game_version','rules_version','presentation_version','device_class','input_type','page','utm_source','utm_medium','utm_campaign','utm_content','utm_term','environment','data_json'];
async function ingest(request:Request,env:Env,origin:string){
 if(!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('Content-Type')??''))return error('unsupported_content_type',415,origin);
 let raw:string|null;try{raw=await readBody(request);}catch{return error('invalid_json',400,origin);}if(raw===null)return error('body_too_large',413,origin);
 let batch:unknown;try{batch=JSON.parse(raw);}catch{return error('invalid_json',400,origin);}
 const now=Date.now();if(!isAnalyticsBatch(batch,now))return error('invalid_batch',400,origin);
 if(env.ENVIRONMENT!=='development'&&batch.events.some(e=>e.environment!=='production'))return error('nonproduction_event',400,origin);
 if(env.RATE_LIMITER){const ip=request.headers.get('CF-Connecting-IP')??'unknown';const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));const key=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');if(!(await env.RATE_LIMITER.limit({key})).success)return error('rate_limited',429,origin);}
 const received=new Date(now).toISOString();const statements=batch.events.map(e=>env.DB.prepare(`INSERT OR IGNORE INTO events (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).bind(e.event_id,received,e.occurred_at,e.schema_version,e.browser_id,e.visit_id,e.session_id,e.run_id,e.game_id,e.event_name,e.game_version,e.rules_version,e.presentation_version,e.device_class,e.input_type,e.page,e.data.utm_source??null,e.data.utm_medium??null,e.data.utm_campaign??null,e.data.utm_content??null,e.data.utm_term??null,e.environment,JSON.stringify(e.data)));
 const results=await env.DB.batch(statements);const inserted=results.reduce((n,r)=>n+(r.meta?.changes??0),0);
 return response({accepted:inserted,duplicates:batch.events.length-inserted},202,origin);
}
function validDate(value:string|null):string|null{if(!value)return null;const n=Date.parse(value);if(!Number.isFinite(n))return null;return new Date(n).toISOString();}
function getPeriod(url:URL,env:Env,now=Date.now()):Period|null{
 const to=validDate(url.searchParams.get('to'))??new Date(now).toISOString();
 const from=validDate(url.searchParams.get('from'))??new Date(Date.parse(to)-7*86400000).toISOString();
 if((url.searchParams.has('to')&&!validDate(url.searchParams.get('to')))||(url.searchParams.has('from')&&!validDate(url.searchParams.get('from'))))return null;
 const span=Date.parse(to)-Date.parse(from);if(span<=0||span>retention(env).rawDays*86400000||Date.parse(to)>now+300000)return null;
 return {from,to:new Date(Math.min(Date.parse(to),now)).toISOString()};
}
async function authorize(request:Request,expected:string|undefined,notConfigured:string,origin?:string):Promise<Response|undefined>{
 if(!expected)return error(notConfigured,503,origin);
 const header=request.headers.get('Authorization')??'';if(!header.startsWith('Bearer '))return error('unauthorized',401,origin);
 const supplied=header.slice(7);const enc=new TextEncoder();const a=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(supplied))),b=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(expected)));let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];if(mismatch)return error('unauthorized',401,origin);
}
/** Shared aggregate-only reader. Route handlers select their own credential before calling it. */
async function aggregate(request:Request,env:Env,gameId?:string,origin?:string){
 const url=new URL(request.url);const period=getPeriod(url,env);if(!period)return error('invalid_period',400,origin);
 const environment=url.searchParams.get('environment')??'production';if(!['production','development','qa','synthetic'].includes(environment))return error('invalid_environment',400,origin);
 const includeRetired=url.searchParams.get('include_retired')==='1';
 if(gameId!==undefined&&!/^game(?:00[1-9]|01[0-9]|02[0-9]|03[01])$/.test(gameId))return error('unknown_game',404,origin);
 const versionFilters:Record<string,string>={};
 const conditions=['occurred_at >= ?','occurred_at < ?','environment = ?'];const args:unknown[]=[period.from,period.to,environment];
 // Read all games for cross-game analysis; the selected game's display is filtered afterwards.
 if(!includeRetired&&gameId!=='game010')conditions.push("game_id <> 'game010'");
 for(const key of ['game_version','rules_version','presentation_version']){const val=url.searchParams.get(key);if(val){if(!/^[a-zA-Z0-9_.-]{1,40}$/.test(val))return error('invalid_version',400,origin);versionFilters[key]=val;}}
 const result=await env.DB.prepare(`SELECT ${columns.filter(c=>!c.startsWith('utm_')).join(',')} FROM events WHERE ${conditions.join(' AND ')} ORDER BY occurred_at,event_id LIMIT 20001`).bind(...args).all<StoredEvent>();
 if(result.results.length>20000)return error('range_too_large',422,origin);
 const context=unpack(result.results),events=context.filter(e=>Object.entries(versionFilters).every(([key,value])=>e[key as keyof typeof e]===value)),games=summarizeGames(events,period,includeRetired||gameId==='game010',context);
 const historyEnd=new Date(period.to);const partialEdgeDays=period.from.slice(11)!=='00:00:00.000Z'||period.to.slice(11)!=='00:00:00.000Z';if(historyEnd.getUTCHours()||historyEnd.getUTCMinutes()||historyEnd.getUTCSeconds()||historyEnd.getUTCMilliseconds())historyEnd.setUTCDate(historyEnd.getUTCDate()+1);
 const archived=await env.DB.prepare(`SELECT day,game_id,environment,game_version,rules_version,presentation_version,metrics_json FROM daily_aggregates WHERE day >= ? AND day < ? AND environment = ?${!includeRetired&&gameId!=='game010'?" AND game_id <> 'game010'":''}${gameId?' AND game_id = ?':''}${Object.keys(versionFilters).map(key=>` AND ${key} = ?`).join('')} ORDER BY day,game_id LIMIT 10001`).bind(period.from.slice(0,10),historyEnd.toISOString().slice(0,10),environment,...(gameId?[gameId]:[]),...Object.values(versionFilters)).all<Omit<AggregateDay,'metrics'>&{metrics_json:string}>();
 if(archived.results.length>10000)return error('history_range_too_large',422,origin);
 const settings=retention(env),rawWindowFrom=rawCutoff(env).toISOString();const payload={schema_version:1,generated_at:new Date().toISOString(),period,environment,
 coverage:{scope:'consented-observed-events',raw_retention_days:settings.rawDays,aggregate_retention_months:settings.aggregateMonths,event_count:events.length,query_truncated:false,raw_period_complete:period.from>=rawWindowFrom,duration_unit:'seconds',
  raw_window_from:rawWindowFrom,missing:['consent_not_granted','legacy_uninstrumented','unobserved_page_exit','censored_runs','unreported_milestones'],
  cohort_limits:'Return cohorts need their full follow-up inside the requested period. Continuation is within observed browser+visit+game. Missing page_exit never means boredom. Large fall uses lost progress >=10m, not jump-apex descent. Its recovery rate counts observed same-RUN continuation, not regained height; sampled-jump omissions make this a lower bound.',
  history_limits:'Daily archives are complete UTC calendar-day totals; partial UTC edge-day totals are not exact requested-period totals. Daily observed browser/visit counts cannot be added to obtain period distinct counts. Archived aggregates cannot reconstruct individual continuation or return cohorts.'},
 history:{granularity:'UTC-calendar-day',partial_edge_days:partialEdgeDays,daily:archived.results.map(({metrics_json,...day})=>({...day,metrics:JSON.parse(metrics_json)}))}};
 return response(gameId?{...payload,game:games.find(g=>g.game_id===gameId)}:{...payload,summary:computeMetrics(events,context,period),games},200,origin);
}
/** Archives whole UTC days before deleting raw events. No individual IDs leave the events table. */
export async function applyRetention(db:Database,env:Env,now=Date.now()){
 const {aggregateMonths}=retention(env);const cutoff=rawCutoff(env,now);
 const archiveCutoff=new Date(now);archiveCutoff.setUTCMonth(archiveCutoff.getUTCMonth()-aggregateMonths);const today=new Date(now).toISOString().slice(0,10);
 const aggregate=`INSERT INTO daily_aggregates(day,game_id,environment,game_version,rules_version,presentation_version,metrics_json)
 SELECT substr(occurred_at,1,10),game_id,environment,game_version,rules_version,presentation_version,
 json_object('event_count',COUNT(*),'observed_browser_count',COUNT(DISTINCT browser_id),'visit_count',COUNT(DISTINCT browser_id||':'||visit_id),
 'portal_view_count',SUM(event_name IN ('portal_view','portal_open')),'game_card_impressions',SUM(event_name='game_card_impression'),'game_card_clicks',SUM(event_name='game_card_click'),
 'game_starts',SUM(event_name='game_launch'),'run_count',COUNT(DISTINCT CASE WHEN event_name='run_start' AND run_id IS NOT NULL THEN browser_id||':'||visit_id||':'||session_id||':'||run_id END),
 'run_end_count',COUNT(DISTINCT CASE WHEN event_name='run_end' AND run_id IS NOT NULL THEN browser_id||':'||visit_id||':'||session_id||':'||run_id END),
 'best_updates',SUM(event_name='best_update'),'client_error_count',SUM(event_name='client_error'))
 FROM events WHERE occurred_at < ? GROUP BY substr(occurred_at,1,10),game_id,environment,game_version,rules_version,presentation_version
 ON CONFLICT(day,game_id,environment,game_version,rules_version,presentation_version) DO UPDATE SET metrics_json=excluded.metrics_json`;
 await db.batch([db.prepare(aggregate).bind(today+'T00:00:00.000Z'),db.prepare('DELETE FROM events WHERE occurred_at < ?').bind(cutoff.toISOString()),db.prepare('DELETE FROM daily_aggregates WHERE day < ?').bind(archiveCutoff.toISOString().slice(0,10))]);
 return {raw_cutoff:cutoff.toISOString(),aggregate_cutoff:archiveCutoff.toISOString().slice(0,10)};
}
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url),origin=request.headers.get('Origin'),cors=origin&&allowedOrigin(origin,env)?origin:undefined;
  try{
   if(request.method==='GET'&&url.pathname==='/v1/health'){await env.DB.prepare('SELECT COUNT(*) AS ok FROM events WHERE 0').all();return response({status:'ok',schema_version:2,environment:env.ENVIRONMENT??'production'},200,cors);}
   if(url.pathname.startsWith('/v1/codex/')){
    // Deliberately GET-only, with no fallback to admin authentication or future admin routes.
    if(request.method!=='GET')return error('method_not_allowed',405);
    if(origin&&!cors)return error('invalid_origin',403);
    if(url.pathname!=='/v1/codex/summary'&&!/^\/v1\/codex\/game\/[^/]+$/.test(url.pathname))return error('not_found',404);
    const denied=await authorize(request,env.ANALYTICS_CODEX_TOKEN,'codex_not_configured');if(denied)return denied;
    return await aggregate(request,env,url.pathname==='/v1/codex/summary'?undefined:url.pathname.split('/').at(-1));
   }
   if(url.pathname.startsWith('/v1/admin/')){if(request.method==='OPTIONS'&&cors)return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Authorization','Access-Control-Max-Age':'600',Vary:'Origin'}});if(origin&&!cors)return error('invalid_origin',403);if(request.method!=='GET')return error('method_not_allowed',405,cors);if(url.pathname!=='/v1/admin/summary'&&!/^\/v1\/admin\/game\/[^/]+$/.test(url.pathname))return error('not_found',404,cors);const denied=await authorize(request,env.ANALYTICS_ADMIN_TOKEN,'admin_not_configured',cors);if(denied)return denied;return await aggregate(request,env,url.pathname==='/v1/admin/summary'?undefined:url.pathname.split('/').at(-1),cors);}
   if(url.pathname!=='/v1/events')return error('not_found',404,cors);
   if(!cors)return error('invalid_origin',403);
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600',Vary:'Origin'}});
   if(request.method!=='POST')return error('method_not_allowed',405,cors);
   return await ingest(request,env,cors);
  }catch{return error('service_unavailable',503,cors);}
 },
 async scheduled(_controller:unknown,env:Env):Promise<void>{await applyRetention(env.DB,env);}
};
