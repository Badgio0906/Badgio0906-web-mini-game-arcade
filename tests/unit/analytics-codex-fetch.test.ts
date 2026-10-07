import { describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { fetchAnalyticsContext, parseOptions } from '../../scripts/fetch-analytics-context.mjs';

const token='codex-fixture-only-not-a-production-secret';
const now=new Date('2026-10-07T00:00:00.000Z');
const env={ANALYTICS_CODEX_TOKEN:token};
function payload(url:URL){return {schema_version:1,environment:url.searchParams.get('environment'),period:{from:url.searchParams.get('from'),to:url.searchParams.get('to')},coverage:{scope:'consented-observed-events'},summary:{run_count:0},games:[]};}
const execute=promisify(execFile),script=fileURLToPath(new URL('../../scripts/fetch-analytics-context.mjs',import.meta.url));

describe('Codex Analytics fetch script',()=>{
 it('defaults to the production summary and seven days, with the token only in the header',async()=>{
  const fetcher=vi.fn(async(url:URL,options:RequestInit)=>{
   expect(url.origin).toBe('https://analytics.game100garage.com');expect(url.pathname).toBe('/v1/codex/summary');
   expect(url.searchParams.get('environment')).toBe('production');expect(url.searchParams.has('include_retired')).toBe(false);
   expect(url.searchParams.get('from')).toBe('2026-09-30T00:00:00.000Z');expect(url.href).not.toContain(token);
   expect(options.method).toBe('GET');expect(options.headers).toEqual({Authorization:`Bearer ${token}`,Accept:'application/json'});
   expect(options.redirect).toBe('error');expect(options.signal).toBeInstanceOf(AbortSignal);
   return Response.json(payload(url));
  });
  const result=await fetchAnalyticsContext([],env,fetcher,now);
  expect(result.source).toBe('GAME100 Analytics');expect(result.period).toEqual(result.data.period);expect(JSON.stringify(result)).not.toContain(token);expect(fetcher).toHaveBeenCalledOnce();
 });
 it('selects only the requested game, period and explicit environment/retired flag',async()=>{
  const fetcher=vi.fn(async(url:URL)=>{
   expect(url.origin).toBe('https://analytics.example.test');expect(url.pathname).toBe('/v1/codex/game/game019');
   expect(url.searchParams.get('from')).toBe('2026-09-07T00:00:00.000Z');expect(url.searchParams.get('include_retired')).toBe('1');
   const data=payload(url);return Response.json({...data,game:{game_id:'game019',run_count:1}});
  });
  const result=await fetchAnalyticsContext(['--days','30','--game','game019','--environment','synthetic','--include-retired'],{...env,ANALYTICS_BASE_URL:'https://analytics.example.test/'},fetcher,now);
  expect(result.data.environment).toBe('synthetic');expect(result.data.game.run_count).toBe(1);
 });
 it('rejects invalid arguments and duplicate flags before sending a request',()=>{
  for(const args of [['--token',token],['--days'],['--days','0'],['--days','91'],['--days','NaN'],['--days','1.5'],['--game','game021'],['--game','game999'],['--environment','other'],['--days','7','--days','30'],['--include-retired','false']])expect(()=>parseOptions(args)).toThrow();
 });
 it('fetches the registered Game020 detail with the production defaults',async()=>{
  const fetcher=vi.fn(async(url:URL)=>{
   expect(url.pathname).toBe('/v1/codex/game/game020');
   expect(url.searchParams.get('environment')).toBe('production');
   return Response.json({...payload(url),game:{game_id:'game020',run_count:0}});
  });
  const result=await fetchAnalyticsContext(['--days','7','--game','game020'],env,fetcher,now);
  expect(result.data.game.game_id).toBe('game020');expect(result.data.game.run_count).toBe(0);expect(fetcher).toHaveBeenCalledOnce();
 });
 it('requires the Codex credential even when an admin credential is present',async()=>{
  const fetcher=vi.fn();
  for(const missing of [undefined,''])await expect(fetchAnalyticsContext([],{ANALYTICS_ADMIN_TOKEN:'admin-fixture-only',ANALYTICS_CODEX_TOKEN:missing},fetcher,now)).rejects.toThrow('missing_codex_token');
  expect(fetcher).not.toHaveBeenCalled();
 });
 it.each(['fixture:network-secret<placeholder>','fixture placeholder with spaces'])('passes a nonempty opaque credential to the fetcher without a character allowlist (%#)',async(placeholder)=>{
  const fetcher=vi.fn(async(url:URL,options:RequestInit)=>{
   expect(url.href).not.toContain(placeholder);
   expect(options.headers).toEqual({Authorization:`Bearer ${placeholder}`,Accept:'application/json'});
   expect(options.redirect).toBe('error');expect(options.signal).toBeInstanceOf(AbortSignal);
   return Response.json(payload(url));
  });
  const result=await fetchAnalyticsContext([],{ANALYTICS_CODEX_TOKEN:placeholder},fetcher,now);
  expect(fetcher).toHaveBeenCalledOnce();expect(JSON.stringify(result)).not.toContain(placeholder);
  await expect(fetchAnalyticsContext([],{ANALYTICS_CODEX_TOKEN:placeholder},async(url:URL)=>Response.json({...payload(url),echo:placeholder}),now)).rejects.toThrow('unsafe_response');
 });
 it('rejects insecure remote URLs and URL credentials/query/path before sending a request',async()=>{
  const fetcher=vi.fn();
  for(const base of ['http://analytics.example.test','https://user:password@analytics.example.test','https://analytics.example.test/?token='+token,'https://analytics.example.test/v1/admin','https://analytics.example.test/#fragment','not-a-url'])await expect(fetchAnalyticsContext([],{...env,ANALYTICS_BASE_URL:base},fetcher,now)).rejects.toThrow('invalid_base_url');
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('sanitizes standard HTTP header validation failures from the fetcher',async()=>{
  const fetcher=vi.fn(async(url:URL,options:RequestInit)=>{new Headers(options.headers);return Response.json(payload(url));});
  await expect(fetchAnalyticsContext([],{ANALYTICS_CODEX_TOKEN:'fixture\nheader'},fetcher,now)).rejects.toThrow('analytics_request_failed');
  expect(fetcher).toHaveBeenCalledOnce();
 });
 it('does not propagate exception messages, echoed HTTP bodies or malformed JSON',async()=>{
  await expect(fetchAnalyticsContext([],env,async()=>{throw new Error(token);},now)).rejects.toThrow('analytics_request_failed');
  for(const status of [401,403,503])await expect(fetchAnalyticsContext([],env,async()=>new Response(token,{status}),now)).rejects.toMatchObject({message:'analytics_http_error',status});
  await expect(fetchAnalyticsContext([],env,async()=>new Response(token),now)).rejects.toThrow('invalid_analytics_response');
 });
 it('refuses raw identity fields and token reflections anywhere in successful JSON',async()=>{
  for(const key of ['browser_id','visit_id','session_id','run_id','event_id','ip','ip_address','User-Agent']){
   await expect(fetchAnalyticsContext([],env,async(url:URL)=>Response.json({...payload(url),history:{daily:[{[key]:'fixture-private-value'}]}}),now)).rejects.toThrow('unsafe_response');
  }
  for(const extra of [{echo:token},{nested:{[token]:0}}])await expect(fetchAnalyticsContext([],env,async(url:URL)=>Response.json({...payload(url),...extra}),now)).rejects.toThrow('unsafe_response');
 });
 it('rejects a successful response for the wrong game, environment or missing aggregate',async()=>{
  for(const change of [{environment:'qa'},{schema_version:2},{summary:null},{period:null}])await expect(fetchAnalyticsContext([],env,async(url:URL)=>Response.json({...payload(url),...change}),now)).rejects.toThrow('invalid_analytics_response');
  await expect(fetchAnalyticsContext(['--game','game019'],env,async(url:URL)=>Response.json({...payload(url),game:{game_id:'game018'}}),now)).rejects.toThrow('invalid_analytics_response');
 });
 it('accepts the existing API end-time clamp for small clock skew',async()=>{
  const result=await fetchAnalyticsContext([],env,async(url:URL)=>{const data=payload(url);data.period.to=new Date(now.getTime()-1000).toISOString();return Response.json(data);},now);
  expect(result.period.to).toBe('2026-10-06T23:59:59.000Z');
 });
 it('CLI sends an opaque placeholder over local HTTP and prints only safe aggregate JSON',async()=>{
  const placeholder='fixture:network-secret<placeholder>';
  let authorization:string|undefined,requestedURL='';
  const server=createServer((request,response)=>{
   authorization=request.headers.authorization;requestedURL=request.url??'';
   response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify(payload(new URL(requestedURL,'http://127.0.0.1'))));
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
   const address=server.address() as {port:number};
   const result=await execute(process.execPath,[script,'--days','7'],{env:{...process.env,ANALYTICS_CODEX_TOKEN:placeholder,ANALYTICS_BASE_URL:`http://127.0.0.1:${address.port}`}});
   expect(authorization).toBe(`Bearer ${placeholder}`);expect(requestedURL).not.toContain(placeholder);
   expect(result.stderr).toBe('');expect(result.stdout).not.toContain(placeholder);
   const data=JSON.parse(result.stdout);expect(data.source).toBe('GAME100 Analytics');expect(data.data.environment).toBe('production');
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
 });
 it('CLI errors have nonzero exit codes and never echo headers, bodies or tokens',async()=>{
  const server=createServer((request,response)=>{response.writeHead(request.url?.includes('environment=qa')?403:401);response.end(request.headers.authorization);});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
   const address=server.address() as {port:number};
   for(const args of [[],['--environment','qa']]){
    try{await execute(process.execPath,[script,...args],{env:{...process.env,...env,ANALYTICS_BASE_URL:`http://127.0.0.1:${address.port}`}});expect.fail('CLI should fail');}
    catch(error){const result=error as {code:number;stdout:string;stderr:string};expect(result.code).toBe(1);expect(result.stdout).toBe('');expect(result.stderr).not.toContain(token);expect(JSON.parse(result.stderr)).toEqual({error:'analytics_http_error',status:args.length?403:401});}
   }
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
 });
 it('CLI refuses redirects without forwarding Authorization to the redirect target',async()=>{
  let requests=0;
  const server=createServer((_request,response)=>{requests++;response.writeHead(302,{Location:'/should-not-follow'});response.end(token);});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
   const address=server.address() as {port:number};
   try{await execute(process.execPath,[script],{env:{...process.env,...env,ANALYTICS_BASE_URL:`http://127.0.0.1:${address.port}`}});expect.fail('CLI should fail');}
   catch(error){const result=error as {code:number;stdout:string;stderr:string};expect(result.code).toBe(1);expect(result.stdout).toBe('');expect(result.stderr).not.toContain(token);expect(JSON.parse(result.stderr)).toEqual({error:'analytics_request_failed'});}
   expect(requests).toBe(1);
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
 });
});
