import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import worker, { applyRetention } from '../../analytics-worker/src/index';
import { computeMetrics, summarizeGames } from '../../analytics-worker/src/aggregate';
import { ANALYTICS_SCHEMA_VERSION, isAnalyticsBatch, sanitizeAnalyticsData, type AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';
import { gameCatalog, historicalGameCatalog } from '../../src/data/gameCatalog';
import type { Database, D1Statement, Env } from '../../analytics-worker/src/types';
const now=Date.now(),iso=(delta=0)=>new Date(now+delta).toISOString();
function event(extra:Partial<AnalyticsEnvelope>={}):AnalyticsEnvelope{return {schema_version:ANALYTICS_SCHEMA_VERSION,event_id:randomUUID(),occurred_at:iso(),game_id:'game019',game_version:'2',rules_version:'2',presentation_version:'2',browser_id:'0f354005-c693-4cb8-8bbb-a45ca3346db0',visit_id:'visit1',session_id:'session1',run_id:'run1',event_name:'run_start',environment:'production',device_class:'mobile',input_type:'touch',page:'game019.html',data:{},...extra};}
const open:DatabaseSync[]=[];
function database():Database&{sqlite:DatabaseSync}{
 const sqlite=new DatabaseSync(':memory:');open.push(sqlite);sqlite.exec(readFileSync(new URL('../../analytics-worker/migrations/0001_events.sql',import.meta.url),'utf8'));
 function prepare(sql:string):D1Statement{let values:unknown[]=[];const api:D1Statement={bind(...v){values=v;return api;},async all(){return {results:sqlite.prepare(sql).all(...values as never[]) as never[]};},async run(){const result=sqlite.prepare(sql).run(...values as never[]);return {results:[],meta:{changes:Number(result.changes)}};}};return api;}
 return {sqlite,prepare,async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
}
afterEach(()=>{for(const db of open.splice(0))db.close();});
function env():Env&{DB:ReturnType<typeof database>}{return {DB:database(),ENVIRONMENT:'production',ANALYTICS_ADMIN_TOKEN:'synthetic-test-only-admin',ANALYTICS_CODEX_TOKEN:'synthetic-test-only-codex'};}
function post(events:unknown[],origin='https://game100garage.com'){return new Request('https://telemetry.example/v1/events',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({schema_version:2,events})});}
function admin(path='/v1/admin/summary'){return new Request('https://telemetry.example'+path,{headers:{Authorization:'Bearer synthetic-test-only-admin'}});}
function codex(path='/v1/codex/summary',token='synthetic-test-only-codex',method='GET'){return new Request('https://telemetry.example'+path,{method,headers:token?{Authorization:`Bearer ${token}`}:{}});}
describe('Codex aggregate-only access',()=>{
 it('registers020 ingestion and anonymized admin/Codex detail without accepting future IDs',async()=>{
  const e=env(),browser=randomUUID(),visit=randomUUID(),session=randomUUID(),run=randomUUID();
  const base={game_id:'game020',page:'game020.html',game_version:'fixture020',rules_version:'1',presentation_version:'1',browser_id:browser,visit_id:visit,session_id:session,run_id:run};
  const events=[event({...base,occurred_at:iso(-18000)}),...['tile_pair','hint','undo','reshuffle'].map((action,i)=>event({...base,occurred_at:iso(-17000+i*1000),event_name:'specific_game_events',data:{event:action,remaining:22,steps:1,first_id:3,second_id:7}})),event({...base,occurred_at:iso(-1000),event_name:'run_end',data:{outcome:'clear',seconds:17,score:12,unit:'pairs'}})];
  const ingest=await worker.fetch(post(events),e);expect(ingest.status).toBe(202);expect(await ingest.json()).toEqual({accepted:6,duplicates:0});
  const stored=e.DB.sqlite.prepare("SELECT data_json FROM events WHERE game_id='game020' AND event_name='specific_game_events' ORDER BY occurred_at").all();
  expect(stored.map(row=>JSON.parse(String(row.data_json)).event)).toEqual(['tile_pair','hint','undo','reshuffle']);
  for(const request of [admin('/v1/admin/game/game020'),codex('/v1/codex/game/game020')]){
   const response=await worker.fetch(request,e);expect(response.status).toBe(200);const text=await response.text(),body=JSON.parse(text);
   expect(body.game).toMatchObject({game_id:'game020',status:'active',run_count:1,measured_duration_count:1,median_run_duration:17});
   expect(body.game.funnel.map((step:{step:string})=>step.step)).toEqual(['run_start','run_end']);
   for(const key of ['browser_id','visit_id','session_id','run_id','event_id','ip','user_agent'])expect(text).not.toContain(`"${key}"`);
   for(const id of [browser,visit,session,run,...events.map(row=>row.event_id)])expect(text).not.toContain(id);
  }
  for(const request of [admin('/v1/admin/game/game031'),codex('/v1/codex/game/game031')])expect((await worker.fetch(request,e)).status).toBe(404);
  expect((await worker.fetch(post([event({...base,game_id:'game031',page:'game031.html'})]),e)).status).toBe(400);
 });
 it.each(gameCatalog.filter(game=>game.releaseOrder>=21))('registers classic $id through strict ingest and anonymous aggregate detail',async game=>{
  const e=env(),browser=randomUUID(),run=randomUUID(),base={game_id:game.id,page:game.id+'.html',browser_id:browser,run_id:run,rules_version:'1',presentation_version:'prototype-1'};
  const rows=[event({...base,data:{difficulty:'normal',first:true,assisted:false}}),event({...base,event_name:'specific_game_events',data:{event:'hint',hints:1,undos:0}}),event({...base,event_name:'run_end',data:{outcome:'clear',completed:true,seconds:12}})];
  expect((await worker.fetch(post(rows),e)).status).toBe(202);
  for(const req of [admin('/v1/admin/game/'+game.id),codex('/v1/codex/game/'+game.id)]){
   const response=await worker.fetch(req,e);expect(response.status).toBe(200);const text=await response.text();expect(JSON.parse(text).game.run_count).toBe(1);for(const id of [browser,run,...rows.map(row=>row.event_id)])expect(text).not.toContain(id);
  }
 });
 it('requires the dedicated token and isolates admin credentials in both directions',async()=>{
  const e=env();
  for(const token of ['','wrong-fixture','synthetic-test-only-admin'])expect((await worker.fetch(codex(undefined,token),e)).status).toBe(401);
  for(const path of ['/v1/admin/summary','/v1/admin/game/game019'])expect((await worker.fetch(codex(path),e)).status).toBe(401);
  expect((await worker.fetch(codex(),e)).status).toBe(200);
  delete e.ANALYTICS_CODEX_TOKEN;
  expect((await worker.fetch(codex(),e)).status).toBe(503);
  expect((await worker.fetch(admin(),e)).status).toBe(200);
  e.ANALYTICS_CODEX_TOKEN='synthetic-test-only-codex';delete e.ANALYTICS_ADMIN_TOKEN;
  expect((await worker.fetch(codex(),e)).status).toBe(200);
 });
 it('only exposes the two GET routes and cannot write or use future admin routes',async()=>{
  const e=env();
  for(const path of ['/v1/codex/summary','/v1/codex/game/game019']){
   for(const method of ['POST','PUT','PATCH','DELETE','HEAD','OPTIONS'])expect((await worker.fetch(codex(path,undefined,method),e)).status).toBe(405);
  }
  for(const path of ['/v1/codex/events','/v1/codex/export','/v1/codex/game/game019/extra','/v1/codex/game/game999'])expect((await worker.fetch(codex(path),e)).status).toBe(404);
  expect(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM events').get()?.n).toBe(0);
 });
 it('reuses admin metrics and filters without returning individual identifiers or headers',async()=>{
  const e=env(),row=event({occurred_at:iso(-1000),visit_id:randomUUID(),session_id:randomUUID(),run_id:randomUUID()});await worker.fetch(post([row]),e);
  const query=`?from=${iso(-7*86400000)}&to=${iso()}&environment=production&game_version=2&rules_version=2&presentation_version=2`;
  for(const suffix of ['/summary','/game/game019']){
   const adminResult=await worker.fetch(admin('/v1/admin'+suffix+query),e);
   const result=await worker.fetch(codex('/v1/codex'+suffix+query),e);expect(result.status).toBe(200);expect(result.headers.get('Cache-Control')).toBe('no-store');
   const text=await result.text(),body=JSON.parse(text),baseline=await adminResult.json() as Record<string,unknown>;
   delete body.generated_at;delete baseline.generated_at;expect(body).toEqual(baseline);
   for(const key of ['browser_id','visit_id','session_id','run_id','event_id','ip','ip_address','user_agent','user-agent'])expect(text).not.toContain(`"${key}"`);
   for(const value of [row.browser_id,row.visit_id,row.session_id,row.run_id!,row.event_id,e.ANALYTICS_CODEX_TOKEN!,e.ANALYTICS_ADMIN_TOKEN!])expect(text).not.toContain(value);
  }
  const empty=await worker.fetch(codex('/v1/codex/game/game019?game_version=missing'),e);expect((await empty.json() as {game:{run_count:number}}).game.run_count).toBe(0);
 });
 it('preserves production defaults, retired exclusions and explicit game010 detail',async()=>{
  const e=env();await worker.fetch(post([event({occurred_at:iso(-1000)})]),e);
  const summary=await worker.fetch(codex(),e),body=await summary.json() as {environment:string;games:{game_id:string}[]};
  expect(body.environment).toBe('production');expect(body.games).toHaveLength(gameCatalog.length);expect(body.games.some(g=>g.game_id==='game010')).toBe(false);
  const retired=await worker.fetch(codex('/v1/codex/summary?include_retired=1'),e);expect((await retired.json() as {games:unknown[]}).games).toHaveLength(historicalGameCatalog.length);
  const detail=await worker.fetch(codex('/v1/codex/game/game010'),e);expect((await detail.json() as {game:{status:string}}).game.status).toBe('retired');
 });
 it('rejects invalid or oversized periods, environments, versions and disallowed origins',async()=>{
  const e=env();
  for(const query of ['from=bad','to=bad','environment=bad','game_version=bad%20version','rules_version=bad!','presentation_version=bad!','from='+iso(-91*86400000),'from='+iso()+'&to='+iso(-1000),'to='+iso(600000)])expect((await worker.fetch(codex('/v1/codex/summary?'+query),e)).status).toBe(400);
  expect((await worker.fetch(new Request('https://telemetry.example/v1/codex/summary',{headers:{Origin:'https://invalid.example',Authorization:'Bearer synthetic-test-only-codex'}}),e)).status).toBe(403);
 });
});
describe('external analytics boundary',()=>{
 it('validates strict envelope and documented data, excluding free text and URL query',()=>{
  expect(isAnalyticsBatch({schema_version:2,events:[event()]},now)).toBe(true);
  for(const invalid of [event({game_id:'game010'}),event({event_name:'made_up' as never}),event({occurred_at:'2026-02-31T01:00:00.000Z'}),event({data:{email:'someone@example.test'}}),event({data:{phase:'https://site/?secret=yes'}}),event({data:{score:Infinity}}),event({environment:['production'] as never}),{...event(),ip:'127.0.0.1'}])expect(isAnalyticsBatch({schema_version:2,events:[invalid]},now)).toBe(false);
  expect(isAnalyticsBatch({schema_version:2,events:Array.from({length:51},()=>event())},now)).toBe(false);
  expect(sanitizeAnalyticsData({email:'a@example.test',stack:'private',message:'raw free text',phase:'playing',score:2,extra:{nested:true},jump_direction:-1,attempt_id:3})).toEqual({phase:'playing',score:2,jump_direction:-1,attempt_id:3});
 });
 it('rejects absent/bad origins, nonproduction fixtures and oversized chunked bodies',async()=>{
  const e=env();expect((await worker.fetch(post([event()],'http://localhost:5173'),e)).status).toBe(403);
  expect((await worker.fetch(new Request('https://telemetry.example/v1/events',{method:'POST'}),e)).status).toBe(403);
  expect((await worker.fetch(post([event({environment:'synthetic'})]),e)).status).toBe(400);
  const request=new Request('https://telemetry.example/v1/events',{method:'POST',headers:{Origin:'https://game100garage.com','Content-Type':'application/json'},body:' '.repeat(65537)});expect((await worker.fetch(request,e)).status).toBe(413);
  expect((await worker.fetch(post([event({data:{email:'not-allowed'}})]),e)).status).toBe(400);
  expect(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM events').get()?.n).toBe(0);
 });
 it('inserts actual SQLite schema and deduplicates event UUIDs',async()=>{
  const e=env(),row=event();const first=await worker.fetch(post([row]),e);expect(first.status).toBe(202);expect(await first.json()).toEqual({accepted:1,duplicates:0});
  const second=await worker.fetch(post([row,row]),e);expect(await second.json()).toEqual({accepted:0,duplicates:2});
  expect(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM events').get()?.n).toBe(1);
 });
 it('requires admin Bearer auth and returns aggregates without browser/visit/session/run IDs',async()=>{
  const e=env();await worker.fetch(post([event()]),e);
  expect((await worker.fetch(new Request('https://telemetry.example/v1/admin/summary'),e)).status).toBe(401);
  const result=await worker.fetch(admin(),e);expect(result.status).toBe(200);const text=await result.text();expect(text).not.toContain('0f354005-c693-4cb8-8bbb-a45ca3346db0');expect(text).not.toContain('session1');expect(text).not.toContain('visit1');expect(text).not.toContain('"run_id":"run1"');
  const detail=await worker.fetch(admin('/v1/admin/game/game019'),e);expect((await detail.json() as {game:{run_count:number}}).game.run_count).toBe(1);
  const preflight=await worker.fetch(new Request('https://telemetry.example/v1/admin/summary',{method:'OPTIONS',headers:{Origin:'https://game100garage.com'}}),e);expect(preflight.headers.get('Access-Control-Allow-Headers')).toBe('Authorization');
 });
 it('computes variable continuation denominators and censored RUN duration',()=>{
  const rows=[event({occurred_at:iso(-5000)}),event({event_name:'run_end',occurred_at:iso(-4000),data:{seconds:12,outcome:'over',failure_reason:'short'}}),event({event_name:'run_start',run_id:'run2',occurred_at:iso(-3000)}),event({event_name:'run_start',run_id:'run3',occurred_at:iso(-2000)}),event({event_name:'run_start',browser_id:'fff54005-c693-4cb8-8bbb-a45ca3346db0',visit_id:'visit2',occurred_at:iso(-1000)})];
  const metrics=computeMetrics(rows,rows,{from:iso(-86400000),to:iso()});expect(metrics.run_count).toBe(4);expect(metrics.second_run_rate).toEqual({numerator:1,denominator:2,rate:.5,sample_size_small:true});expect(metrics.third_run_rate.denominator).toBe(1);expect(metrics.third_run_rate.rate).toBe(1);expect(metrics.measured_duration_count).toBe(1);expect(metrics.median_run_duration).toBe(12);expect(metrics.failure_retry_rate.rate).toBe(1);
 });
 it('tracks large fall continuation within the same frog RUN, not as an ended RUN',()=>{
  const rows=[event({occurred_at:iso(-5000)}),event({event_name:'specific_game_events',occurred_at:iso(-4000),data:{event:'fall_end',fall_distance:14,progress_lost:11,attempt_id:2}}),event({event_name:'specific_game_events',occurred_at:iso(-3000),data:{event:'post_fall_continue',attempt_id:3}}),event({event_name:'specific_game_events',occurred_at:iso(-2000),data:{event:'section_reached',height:50,section_from:50}})];
  const period={from:iso(-86400000),to:iso()};const m=computeMetrics(rows,rows,period);expect(m.run_count).toBe(1);expect(m.large_fall_recovery_rate.rate).toBe(1);expect(m.measured_duration_count).toBe(0);expect(summarizeGames(rows,period).find(g=>g.game_id==='game019')?.funnel.find(f=>f.step==='50m')?.numerator).toBe(1);
 });
 it('distinguishes browser and visit continuation, matched CTR and true cross-game movement',()=>{
  const b=event().browser_id;const rows=[event({occurred_at:iso(-9000),event_name:'game_card_impression',run_id:null}),event({occurred_at:iso(-8000),event_name:'game_card_click',run_id:null}),event({occurred_at:iso(-7000),event_name:'game_card_click',run_id:null}),event({occurred_at:iso(-6000),event_name:'game_launch',run_id:null}),event({occurred_at:iso(-5000)}),event({occurred_at:iso(-4000),game_id:'game018',page:'game018.html',run_id:'shoe1'}),event({occurred_at:iso(-3000),visit_id:'visit2'})];
  const m=computeMetrics(rows.filter(e=>e.game_id==='game019'),rows,{from:iso(-86400000),to:iso()});expect(m.ctr.rate).toBe(1);expect(m.game_card_clicks).toBe(2);expect(m.second_run_rate.rate).toBe(0);expect(m.browser_second_run_rate.rate).toBe(1);expect(m.cross_game_rate).toEqual({numerator:1,denominator:2,rate:.5,sample_size_small:true});expect(m.observed_browser_count).toBe(1);const site=computeMetrics(rows,rows,{from:iso(-86400000),to:iso()});expect(site.average_runs_per_visit).toBe(1.5);expect(JSON.stringify(m)).not.toContain(b);
 });
 it('uses earliest launch for A→B→A and preserves different-version context',async()=>{
  const e=env();const rows=[event({occurred_at:iso(-9000)}),event({game_id:'game018',page:'game018.html',game_version:'1',occurred_at:iso(-8000),run_id:'shoe1'}),event({occurred_at:iso(-7000),run_id:'run2'})];await worker.fetch(post(rows),e);
  const result=await worker.fetch(admin('/v1/admin/game/game019?game_version=2'),e);const json=await result.json() as {game:{cross_game_rate:{rate:number}}};expect(json.game.cross_game_rate.rate).toBe(1);
 });
 it('counts lost progress rather than ordinary jump apex descent as a large fall',()=>{
  const rows=[event({occurred_at:iso(-4000)}),event({event_name:'specific_game_events',occurred_at:iso(-3000),data:{event:'fall_end',fall_distance:14,progress_lost:0,attempt_id:1}}),event({event_name:'specific_game_events',occurred_at:iso(-2000),data:{event:'post_fall_continue'}})];const m=computeMetrics(rows,rows,{from:iso(-86400000),to:iso()});expect(m.large_fall_count).toBe(0);expect(m.large_fall_recovery_rate.rate).toBeNull();
 });
 it('excludes the exclusive final UTC day and filters archived versions',async()=>{
  const e=env();const end=new Date(now);end.setUTCHours(0,0,0,0);end.setUTCDate(end.getUTCDate()-1);const from=new Date(end);from.setUTCDate(from.getUTCDate()-2);const middle=new Date(from);middle.setUTCDate(middle.getUTCDate()+1);
  for(const [day,version] of [[middle.toISOString().slice(0,10),'2'],[end.toISOString().slice(0,10),'2'],[middle.toISOString().slice(0,10),'1']])e.DB.sqlite.prepare('INSERT INTO daily_aggregates VALUES(?,?,?,?,?,?,?)').run(day,'game019','production',version,'2','2','{"run_count":1}');
  const res=await worker.fetch(admin(`/v1/admin/game/game019?from=${from.toISOString()}&to=${end.toISOString()}&game_version=2`),e);const body=await res.json() as {history:{daily:unknown[];partial_edge_days:boolean;granularity:string}};expect(body.history.daily).toHaveLength(1);expect(body.history.partial_edge_days).toBe(false);expect(body.history.granularity).toBe('UTC-calendar-day');
 });
 it('archives identifier-free daily metrics and deletes expired raw/aggregate rows',async()=>{
  const e=env();const old=event({occurred_at:iso(-100*86400000)}),recent=event();
  for(const row of [old,recent])e.DB.sqlite.prepare('INSERT INTO events(event_id,received_at,occurred_at,schema_version,browser_id,visit_id,session_id,run_id,game_id,event_name,game_version,rules_version,presentation_version,device_class,input_type,page,environment,data_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(row.event_id,iso(),row.occurred_at,2,row.browser_id,row.visit_id,row.session_id,row.run_id,row.game_id,row.event_name,'2','2','2','mobile','touch',row.page,'production','{}');
  e.DB.sqlite.prepare('INSERT INTO daily_aggregates VALUES(?,?,?,?,?,?,?)').run('2020-01-01','game019','production','1','1','1','{}');
  await applyRetention(e.DB,e,now);expect(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM events').get()?.n).toBe(1);const archives=e.DB.sqlite.prepare('SELECT * FROM daily_aggregates').all();expect(archives).toHaveLength(1);expect(JSON.stringify(archives)).not.toContain(old.browser_id);expect(JSON.parse(String(archives[0].metrics_json)).run_count).toBe(1);
  await applyRetention(e.DB,e,now+86400000);expect(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM daily_aggregates WHERE day = ?').get(old.occurred_at.slice(0,10))?.n).toBe(1);
 });
});
