import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { gameCatalog } from '../../src/data/gameCatalog.ts';
const cwd=new URL('..',import.meta.url).pathname.replace(/\/$/,''),bin=cwd+'/node_modules/.bin/wrangler';
const state=cwd+'/.wrangler/test-'+randomUUID(),config='tests/wrangler.local.jsonc',base='http://127.0.0.1:8797';
const adminToken='local-synthetic-fixture-only',codexToken='local-codex-fixture-only';
mkdirSync(state,{recursive:true});
execFileSync(bin,['d1','migrations','apply','DB','--local','--config',config,'--persist-to',state],{cwd,env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'},stdio:'pipe'});
const child=spawn(bin,['dev','--local','--config',config,'--persist-to',state,'--port','8797','--var',`ANALYTICS_ADMIN_TOKEN:${adminToken}`,'--var',`ANALYTICS_CODEX_TOKEN:${codexToken}`],{cwd,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe'],detached:true});
let logs='';child.stdout.on('data',b=>logs=(logs+b).slice(-10000));child.stderr.on('data',b=>logs=(logs+b).slice(-10000));
const post=events=>fetch(base+'/v1/events',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:JSON.stringify({schema_version:2,events})});
try{
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(base+'/v1/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready,'local Worker not ready: '+logs.replaceAll(adminToken,'[fixture]').replaceAll(codexToken,'[fixture]'));
 const browser=randomUUID(),run=randomUUID();const common={schema_version:2,occurred_at:new Date(Date.now()-1000).toISOString(),game_id:'game019',game_version:'2',rules_version:'2',presentation_version:'2',browser_id:browser,visit_id:randomUUID(),session_id:randomUUID(),run_id:run,environment:'synthetic',device_class:'mobile',input_type:'touch',page:'game019.html'};
 const first={...common,event_id:randomUUID(),event_name:'run_start',data:{source:'title'}},second={...common,event_id:randomUUID(),event_name:'run_end',data:{outcome:'quit',seconds:12}};
 const valid=await post([first,second,first]);assert.equal(valid.status,202);assert.deepEqual(await valid.json(),{accepted:2,duplicates:1});
 assert.equal((await post([{...first,event_id:randomUUID(),event_name:'not_allowed'}])).status,400);
 assert.equal((await fetch(base+'/v1/events',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/v1/events',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:' '.repeat(65537)})).status,413);
 assert.equal((await fetch(base+'/v1/admin/summary')).status,401);
 const result=await fetch(base+'/v1/admin/summary?environment=synthetic',{headers:{Authorization:'Bearer local-synthetic-fixture-only'}});assert.equal(result.status,200);const text=await result.text(),summary=JSON.parse(text);assert.equal(summary.summary.run_count,1);assert.equal(summary.summary.median_run_duration,12);assert(!text.includes(browser));assert(!text.includes(run));assert.equal(summary.games.length,gameCatalog.length);
 const detail=await fetch(base+'/v1/admin/game/game019?environment=synthetic',{headers:{Authorization:'Bearer local-synthetic-fixture-only'}});assert.equal((await detail.json()).game.run_count,1);
 const codex=(path='/v1/codex/summary?environment=synthetic',token=codexToken,method='GET')=>fetch(base+path,{method,headers:token?{Authorization:`Bearer ${token}`}:{}});
 assert.equal((await codex(undefined,null)).status,401);
 assert.equal((await codex(undefined,'wrong-fixture-only')).status,401);
 assert.equal((await codex(undefined,adminToken)).status,401);
 assert.equal((await codex('/v1/admin/summary')).status,401);
 const codexResult=await codex();assert.equal(codexResult.status,200);const codexText=await codexResult.text(),codexSummary=JSON.parse(codexText);
 assert.equal(codexSummary.summary.run_count,summary.summary.run_count);assert.deepEqual(codexSummary.games,summary.games);
 const codexDetail=await codex('/v1/codex/game/game019?environment=synthetic');assert.equal(codexDetail.status,200);const codexDetailText=await codexDetail.text();assert.equal(JSON.parse(codexDetailText).game.run_count,1);
 for(const output of [codexText,codexDetailText]){
  for(const value of [common.event_id,first.event_id,second.event_id,browser,common.visit_id,common.session_id,run,adminToken,codexToken].filter(Boolean))assert(!output.includes(value));
  for(const key of ['browser_id','visit_id','session_id','run_id','event_id','ip','ip_address','user_agent','user-agent'])assert(!output.includes(`"${key}"`));
 }
 assert.equal((await codex('/v1/codex/game/game999')).status,404);
 assert.equal((await codex('/v1/codex/export')).status,404);
 for(const method of ['POST','PUT','PATCH','DELETE','HEAD','OPTIONS'])assert.equal((await codex(undefined,codexToken,method)).status,405);
 for(const query of ['from=not-a-date','environment=invalid','game_version=bad%20version'])assert.equal((await codex('/v1/codex/summary?'+query)).status,400);
 const filtered=await codex('/v1/codex/game/game019?environment=synthetic&game_version=missing');assert.equal((await filtered.json()).game.run_count,0);
 const script=new URL('../../scripts/fetch-analytics-context.mjs',import.meta.url).pathname;
 const scriptEnv={...process.env,ANALYTICS_CODEX_TOKEN:codexToken,ANALYTICS_BASE_URL:base};
 for(const args of [['--days','7','--environment','synthetic'],['--days','30','--game','game019','--environment','synthetic','--include-retired']]){
  const output=execFileSync(process.execPath,[script,...args],{env:scriptEnv,encoding:'utf8'});assert(!output.includes(codexToken));const parsed=JSON.parse(output);assert.equal(parsed.source,'GAME100 Analytics');assert.equal((parsed.data.summary??parsed.data.game).run_count,1);
 }
 const tileCommon={...common,game_id:'game020',page:'game020.html',game_version:'fixture020',rules_version:'1',presentation_version:'1',run_id:randomUUID()};
 const tileEvents=[{...tileCommon,event_id:randomUUID(),event_name:'run_start',data:{source:'title'}},...['tile_pair','hint','undo','reshuffle'].map(event=>({...tileCommon,event_id:randomUUID(),event_name:'specific_game_events',data:{event,remaining:22,steps:1}})),{...tileCommon,event_id:randomUUID(),event_name:'run_end',data:{outcome:'clear',seconds:18,score:12,unit:'pairs'}}];
 const tileIngest=await post(tileEvents);assert.equal(tileIngest.status,202);assert.deepEqual(await tileIngest.json(),{accepted:6,duplicates:0});
 for(const [prefix,token] of [['admin',adminToken],['codex',codexToken]]){
  const response=await fetch(`${base}/v1/${prefix}/game/game020?environment=synthetic`,{headers:{Authorization:`Bearer ${token}`}});assert.equal(response.status,200);const text=await response.text(),detail=JSON.parse(text);assert.equal(detail.game.game_id,'game020');assert.equal(detail.game.run_count,1);assert.equal(detail.game.median_run_duration,18);for(const id of [browser,tileCommon.visit_id,tileCommon.session_id,tileCommon.run_id,...tileEvents.map(row=>row.event_id)])assert(!text.includes(id));
  assert.equal((await fetch(`${base}/v1/${prefix}/game/game033?environment=synthetic`,{headers:{Authorization:`Bearer ${token}`}})).status,404);
 }
 assert.equal((await post([{...tileEvents[0],event_id:randomUUID(),game_id:'game033',page:'game033.html'}])).status,400);
 const tileSummary=await codex(),tileSummaryData=await tileSummary.json();assert.equal(tileSummary.status,200);assert.equal(tileSummaryData.games.length,gameCatalog.length);assert(!tileSummaryData.games.some(game=>game.game_id==='game010'));assert.equal(tileSummaryData.games.find(game=>game.game_id==='game020').run_count,1);
 const tileScriptOutput=execFileSync(process.execPath,[script,'--days','7','--game','game020','--environment','synthetic'],{env:scriptEnv,encoding:'utf8'});assert(!tileScriptOutput.includes(codexToken));const tileScriptData=JSON.parse(tileScriptOutput);assert.equal(tileScriptData.data.game.game_id,'game020');assert.equal(tileScriptData.data.game.run_count,1);assert.equal(tileScriptData.data.game.median_run_duration,18);
 const classicChecks=[];
 const secondBatchActions={
  game026:{event:'dice_roll',dice:4,player:1,players:2,position:14,turns:3},
  game027:{event:'shot',power:70,player:1,break:false},
  game028:{event:'point',player:0,player_score:3,cpu_score:2,rally_count:4},
  game029:{event:'surface_return',depth:100,score:38,items:3,casts:1},
  game030:{event:'level_clear',level:2,path_length:240,resets:1}
 };
 for(const game of gameCatalog.filter(game=>game.releaseOrder>=21&&game.releaseOrder<=30)) {
  const row={...common,game_id:game.id,page:game.id+'.html',game_version:'classic-local-fixture',rules_version:'1',presentation_version:'prototype-1',run_id:randomUUID()};
  const rows=[{...row,event_id:randomUUID(),event_name:'run_start',data:{source:'title'}},{...row,event_id:randomUUID(),event_name:'specific_game_events',data:secondBatchActions[game.id]??{event:'hint',difficulty:'normal',hints:1}},{...row,event_id:randomUUID(),event_name:'run_end',data:{outcome:'clear',seconds:12,completed:true}}];
  assert.equal((await post(rows)).status,202);
  for(const [prefix,token] of [['admin',adminToken],['codex',codexToken]]) {
   const response=await fetch(`${base}/v1/${prefix}/game/${game.id}?environment=synthetic`,{headers:{Authorization:`Bearer ${token}`}});assert.equal(response.status,200);const text=await response.text();assert.equal(JSON.parse(text).game.run_count,1);for(const id of [browser,row.visit_id,row.session_id,row.run_id,...rows.map(r=>r.event_id)])assert(!text.includes(id));
  }
  const output=execFileSync(process.execPath,[script,'--days','7','--game',game.id,'--environment','synthetic'],{env:scriptEnv,encoding:'utf8'});assert(!output.includes(codexToken));assert.equal(JSON.parse(output).data.game.game_id,game.id);
  classicChecks.push(game.id+'_ingest_admin_codex_cli');
 }
 const digCommon={...common,game_id:'game031',page:'game031.html',game_version:'sandbox-local-fixture',rules_version:'1',presentation_version:'prototype-1',run_id:randomUUID()};
 const digSummary={event:'session_summary',active_seconds:60,blocks_mined:14,blocks_placed:5,max_depth:12,material_types_found:3,return_to_surface_count:1,quality_tier:'light',save_error_code:'none'};
 const digRows=[{...digCommon,event_id:randomUUID(),event_name:'run_start',data:{source:'title'}},{...digCommon,event_id:randomUUID(),event_name:'specific_game_events',data:digSummary},{...digCommon,event_id:randomUUID(),event_name:'specific_game_events',data:{...digSummary,active_seconds:61,blocks_mined:6,blocks_placed:2,max_depth:17,return_to_surface_count:0}},{...digCommon,event_id:randomUUID(),event_name:'run_end',data:{outcome:'quit',seconds:121}}];
 const digIngest=await post(digRows);assert.equal(digIngest.status,202);assert.deepEqual(await digIngest.json(),{accepted:4,duplicates:0});
 for(const [prefix,token] of [['admin',adminToken],['codex',codexToken]]){
  const response=await fetch(`${base}/v1/${prefix}/game/game031?environment=synthetic`,{headers:{Authorization:`Bearer ${token}`}});assert.equal(response.status,200);const text=await response.text(),detail=JSON.parse(text);assert.equal(detail.game.run_count,1);assert.deepEqual(detail.game.sandbox_summary,{summary_count:2,active_seconds:121,blocks_mined:20,blocks_placed:7,return_to_surface_count:1,max_depth:17,maximum_material_types_found:3,quality_summary_counts:{light:2},save_error_summary_counts:{},coverage:'observed-interval-deltas-only'});
  for(const value of [browser,digCommon.visit_id,digCommon.session_id,digCommon.run_id,...digRows.map(row=>row.event_id)])assert(!text.includes(value));
  for(const key of ['seed','world_id','browser_id','visit_id','session_id','run_id','event_id','save_file','player_path'])assert(!text.includes('"'+key+'"'));
 }
 const digCLI=JSON.parse(execFileSync(process.execPath,[script,'--days','7','--game','game031','--environment','synthetic'],{env:scriptEnv,encoding:'utf8'}));assert.equal(digCLI.data.game.sandbox_summary.blocks_mined,20);
 assert.equal((await post([{...digRows[1],event_id:randomUUID(),data:{...digSummary,seed:'synthetic-private'}}])).status,400);
 const fishingCommon={...common,game_id:'game032',page:'game032.html',game_version:'prototype-1',rules_version:'1',presentation_version:'prototype-1',run_id:randomUUID()};
 const fishingRows=[{...fishingCommon,event_id:randomUUID(),event_name:'run_start',data:{mode:'standard'}},{...fishingCommon,event_id:randomUUID(),event_name:'specific_game_events',data:{event:'cast_released',mode:'standard',spot_id:'rocks',distance:'medium',charge_ms:700}},{...fishingCommon,event_id:randomUUID(),event_name:'specific_game_events',data:{event:'bite_hook_fail_early',mode:'standard',reason:'early'}},{...fishingCommon,event_id:randomUUID(),event_name:'specific_game_events',data:{event:'fish_hooked',mode:'standard',fish_id:'yamame',size_cm:24.5}},{...fishingCommon,event_id:randomUUID(),event_name:'specific_game_events',data:{event:'fish_landed',mode:'standard',fish_id:'yamame',size_cm:24.5,points:170,rare:false,big:false}},{...fishingCommon,event_id:randomUUID(),event_name:'run_end',data:{mode:'standard',outcome:'complete',seconds:300,score:170,fish_count:1,max_size_cm:24.5,completed:true}}];
 const fishingIngest=await post(fishingRows);assert.equal(fishingIngest.status,202);assert.deepEqual(await fishingIngest.json(),{accepted:6,duplicates:0});
 for(const [prefix,token] of [['admin',adminToken],['codex',codexToken]]){
  const response=await fetch(`${base}/v1/${prefix}/game/game032?environment=synthetic`,{headers:{Authorization:`Bearer ${token}`}});assert.equal(response.status,200);const text=await response.text(),detail=JSON.parse(text);assert.equal(detail.game.run_count,1);assert.equal(detail.game.median_run_duration,300);assert.equal(detail.game.fishing_summary.average_fish_per_completed_outing,1);assert.equal(detail.game.fishing_summary.average_score,170);assert.deepEqual(detail.game.fishing_summary.spot_cast_counts,{rocks:1});assert.deepEqual(detail.game.fishing_summary.cast_distance_counts,{medium:1});assert.deepEqual(detail.game.fishing_summary.hook_fail_reason_counts,{early:1,late:0});assert.deepEqual(detail.game.fishing_summary.fish_hooked_counts,{yamame:1});assert.deepEqual(detail.game.fishing_summary.fish_landed_counts,{yamame:1});assert.equal(detail.game.fishing_summary.sample_size_small,true);
  for(const value of [browser,fishingCommon.visit_id,fishingCommon.session_id,fishingCommon.run_id,...fishingRows.map(row=>row.event_id)])assert(!text.includes(value));for(const key of ['browser_id','visit_id','session_id','run_id','event_id'])assert(!text.includes('"'+key+'"'));
 }
 const fishingCLI=JSON.parse(execFileSync(process.execPath,[script,'--days','7','--game','game032','--environment','synthetic'],{env:scriptEnv,encoding:'utf8'}));assert.equal(fishingCLI.data.game.fishing_summary.average_score,170);
 assert.equal((await post([{...fishingRows[4],event_id:randomUUID(),data:{...fishingRows[4].data,fish_id:'private free text'}}])).status,400);
 const sqlOutput=execFileSync(bin,['d1','execute','DB','--local','--config',config,'--persist-to',state,'--command','SELECT COUNT(*) AS total FROM events','--json'],{cwd,env:{...process.env,WRANGLER_SEND_METRICS:'false'},encoding:'utf8'});const sql=JSON.parse(sqlOutput.slice(sqlOutput.search(/^\s*\[/m)));assert.equal(sql[0].results[0].total,18+3*classicChecks.length);
 const evidence={status:'PASS',environment:'synthetic-local-only',backend:'Wrangler workerd + actual local D1 SQLite',checks:['migration','health','valid_batch_202','duplicate_uuid_dedup','unknown_event_400','bad_origin_403','oversize_413','admin_unauthorized_401','admin_aggregate_200','game_detail_200','no_raw_ids','codex_missing_wrong_token_401','bidirectional_token_isolation_401','codex_summary_detail_200','codex_unknown_game_route_404','codex_non_get_405','codex_safe_query_filters','fetch_script_summary_detail','game020_ingest_six_events','game020_admin_codex_detail_no_raw_ids','game020_summary_registered','game033_ingest_detail_rejected','game020_fetch_script_detail','D1_insert_count','game031_four_events_admin_codex_cli','game031_interval_deltas_not_duplicated','game031_private_world_data_rejected','game032_six_events_admin_codex_cli','game032_fishing_summary_without_double_counting','game032_private_fields_enum_rejected',...classicChecks],d1_event_count:18+3*classicChecks.length,run_count:4+classicChecks.length,game019_median_run_duration:12,game020_median_run_duration:18};
 mkdirSync(cwd+'/.wrangler/local-test',{recursive:true});writeFileSync(cwd+'/.wrangler/local-test/summary.json',JSON.stringify(summary,null,2));writeFileSync(cwd+'/.wrangler/local-test/evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}finally{try{process.kill(-child.pid,'SIGTERM');}catch{}await new Promise(r=>setTimeout(r,300));}
