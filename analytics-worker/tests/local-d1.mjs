import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const cwd=new URL('..',import.meta.url).pathname.replace(/\/$/,''),bin=cwd+'/node_modules/.bin/wrangler';
const state=cwd+'/.wrangler/test-'+randomUUID(),config='tests/wrangler.local.jsonc',base='http://127.0.0.1:8797';
mkdirSync(state,{recursive:true});
execFileSync(bin,['d1','migrations','apply','DB','--local','--config',config,'--persist-to',state],{cwd,env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'},stdio:'pipe'});
const child=spawn(bin,['dev','--local','--config',config,'--persist-to',state,'--port','8797','--var','ANALYTICS_ADMIN_TOKEN:local-synthetic-fixture-only'],{cwd,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe'],detached:true});
let logs='';child.stdout.on('data',b=>logs=(logs+b).slice(-10000));child.stderr.on('data',b=>logs=(logs+b).slice(-10000));
const post=events=>fetch(base+'/v1/events',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:JSON.stringify({schema_version:2,events})});
try{
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(base+'/v1/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert(ready,'local Worker not ready: '+logs.replace(/local-synthetic-fixture-only/g,'[fixture]'));
 const browser=randomUUID(),run=randomUUID();const common={schema_version:2,occurred_at:new Date(Date.now()-1000).toISOString(),game_id:'game019',game_version:'2',rules_version:'2',presentation_version:'2',browser_id:browser,visit_id:randomUUID(),session_id:randomUUID(),run_id:run,environment:'synthetic',device_class:'mobile',input_type:'touch',page:'game019.html'};
 const first={...common,event_id:randomUUID(),event_name:'run_start',data:{source:'title'}},second={...common,event_id:randomUUID(),event_name:'run_end',data:{outcome:'quit',seconds:12}};
 const valid=await post([first,second,first]);assert.equal(valid.status,202);assert.deepEqual(await valid.json(),{accepted:2,duplicates:1});
 assert.equal((await post([{...first,event_id:randomUUID(),event_name:'not_allowed'}])).status,400);
 assert.equal((await fetch(base+'/v1/events',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/v1/events',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:' '.repeat(65537)})).status,413);
 assert.equal((await fetch(base+'/v1/admin/summary')).status,401);
 const result=await fetch(base+'/v1/admin/summary?environment=synthetic',{headers:{Authorization:'Bearer local-synthetic-fixture-only'}});assert.equal(result.status,200);const text=await result.text(),summary=JSON.parse(text);assert.equal(summary.summary.run_count,1);assert.equal(summary.summary.median_run_duration,12);assert(!text.includes(browser));assert(!text.includes(run));assert.equal(summary.games.length,18);
 const detail=await fetch(base+'/v1/admin/game/game019?environment=synthetic',{headers:{Authorization:'Bearer local-synthetic-fixture-only'}});assert.equal((await detail.json()).game.run_count,1);
 const sqlOutput=execFileSync(bin,['d1','execute','DB','--local','--config',config,'--persist-to',state,'--command','SELECT COUNT(*) AS total FROM events','--json'],{cwd,env:{...process.env,WRANGLER_SEND_METRICS:'false'},encoding:'utf8'});const sql=JSON.parse(sqlOutput.slice(sqlOutput.search(/^\s*\[/m)));assert.equal(sql[0].results[0].total,2);
 const evidence={status:'PASS',environment:'synthetic-local-only',backend:'Wrangler workerd + actual local D1 SQLite',checks:['migration','health','valid_batch_202','duplicate_uuid_dedup','unknown_event_400','bad_origin_403','oversize_413','admin_unauthorized_401','admin_aggregate_200','game_detail_200','no_raw_ids','D1_insert_count'],d1_event_count:2,run_count:1,measured_duration_count:1,median_run_duration:12};
 mkdirSync(cwd+'/.wrangler/local-test',{recursive:true});writeFileSync(cwd+'/.wrangler/local-test/summary.json',JSON.stringify(summary,null,2));writeFileSync(cwd+'/.wrangler/local-test/evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}finally{try{process.kill(-child.pid,'SIGTERM');}catch{}await new Promise(r=>setTimeout(r,300));}
