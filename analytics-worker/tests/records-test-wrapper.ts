// Local-fixture entrypoint only. Production Wrangler still points at src/index.ts.
import worker, { applyRetention } from '../src/index';
import type { Env } from '../src/types';
export default {
 async fetch(request:Request,env:Env):Promise<Response> {
  const url=new URL(request.url);
  if(url.pathname==='/__records-test/disabled')return worker.fetch(new Request(new URL('/v1/records/public/bests',request.url),request),{...env,RECORDS_ENABLED:undefined});
  if(url.pathname==='/__records-test/unconfigured-admin')return worker.fetch(new Request(new URL('/v1/records/admin/submissions',request.url),request),{...env,ANALYTICS_ADMIN_TOKEN:undefined});
  if(url.pathname==='/__records-test/slow-body') {
   const stream=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new TextEncoder().encode('{'));}});
   return worker.fetch(new Request(new URL('/v1/records/submissions',request.url),{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:stream}),env);
  }
  if(url.pathname==='/__leaderboards-test/performance') {
   // Local fixture only; return engine telemetry to verify indexed TOP10 read cost.
   const {board}=await request.json() as {board:string};
   return Response.json(await env.DB.prepare(`SELECT r.revision,t.public_label,t.value,t.received_at FROM record_leaderboard_revisions r LEFT JOIN (
    SELECT pb.board_id,p.public_label,pb.value,pb.received_at,pb.rank_value,pb.submission_id FROM record_participant_bests pb
    JOIN record_participants p ON p.participant_id=pb.participant_id AND p.status='active'
    WHERE pb.board_id=? ORDER BY pb.rank_value,pb.received_at,pb.submission_id LIMIT 10
   ) t ON t.board_id=r.board_id WHERE r.board_id=? ORDER BY t.rank_value,t.received_at,t.submission_id`).bind(board,board).all());
  }
  if(url.pathname==='/__records-test/retention'){await applyRetention(env.DB,env);return Response.json({status:'done'});}
  if(url.pathname==='/__records-test/rollback') {
   const data=await request.json() as {board:string};
   try{await env.DB.batch([
    env.DB.prepare("INSERT INTO record_submissions VALUES(?, ?, ?, ?, 777, '2026-01-01T00:00:00Z', 'accepted', '{}', 'fixturehash', 'fixturehash', 1, NULL, NULL, NULL)").bind(crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID(),data.board),
    env.DB.prepare("INSERT INTO record_boards VALUES('bad','g','m','r','m','invalid',1,1,'now')")
   ]);}catch{return Response.json({status:'rolled_back'},{status:409});}
   return Response.json({status:'unexpected_success'},{status:500});
  }
  return worker.fetch(request,env);
 }
};
