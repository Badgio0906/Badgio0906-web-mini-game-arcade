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
  if(url.pathname==='/__records-test/retention'){await applyRetention(env.DB,env);return Response.json({status:'done'});}
  if(url.pathname==='/__records-test/rollback') {
   const data=await request.json() as {board:string};
   try{await env.DB.batch([
    env.DB.prepare("INSERT INTO record_submissions VALUES(?, ?, ?, ?, 777, '2026-01-01T00:00:00Z', 'accepted', '{}', 'fixturehash', 'fixturehash', 1, NULL, NULL)").bind(crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID(),data.board),
    env.DB.prepare("INSERT INTO record_boards VALUES('bad','g','m','r','m','invalid',1,1,'now')")
   ]);}catch{return Response.json({status:'rolled_back'},{status:409});}
   return Response.json({status:'unexpected_success'},{status:500});
  }
  return worker.fetch(request,env);
 }
};
