import {describe,it,expect,vi} from 'vitest';
import {recordBoards} from '../../src/data/recordDefinitions';
import {PublicBests} from '../../src/records/PublicBests';
import {isPublicBoardRegistered} from '../../src/records/remoteRegistration';
import {LEGACY_PUBLIC_BEST_BOARD_IDS,selectPublicBestBoards} from '../../analytics-worker/src/records';
const url=(query='')=>new URL('https://records.example/v1/records/public/bests'+query);
const response=(defs=recordBoards.filter(b=>isPublicBoardRegistered(b.boardId)))=>({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:'2026-10-15T00:00:00Z',boards:defs.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:'2026-10-15T00:00:00Z',revision:0}))});
describe('public BEST board vocabulary during staggered rollout',()=>{
 it('keeps the exact production legacy default while returning requested new and old boards',()=>{
  const legacy=selectPublicBestBoards(url())!;expect(legacy.map(b=>b.boardId)).toEqual(LEGACY_PUBLIC_BEST_BOARD_IDS);expect(legacy).toHaveLength(20);
  const ids=recordBoards.map(b=>b.boardId);expect(selectPublicBestBoards(url('?boards='+encodeURIComponent(ids.join(','))))?.map(b=>b.boardId)).toEqual(ids);
  const subset=[ids.at(-1)!,ids[0]];expect(selectPublicBestBoards(url('?boards='+encodeURIComponent(subset.join(','))))?.map(b=>b.boardId)).toEqual(subset);
 });
 it('rejects malformed, unknown, duplicate and over-limit board selections',()=>{
  const id=recordBoards[0].boardId;
  for(const query of ['?boards=','?boards=unknown','?boards='+encodeURIComponent(id+','+id),'?boards='+encodeURIComponent(Array(65).fill(id).join(',')),'?boards='+id+'&boards='+id,'?boards='+id+'&extra=1','?boards='+encodeURIComponent(id+','),'?board='+id,'?boards='+encodeURIComponent(' '+id)])expect(selectPublicBestBoards(url(query))).toBeNull();
 });
 it('updated frontend explicitly requests all known boards from an expanded Worker',async()=>{
  const fetcher=vi.fn(async()=>new Response(JSON.stringify(response(recordBoards)),{status:200}));const service=new PublicBests('https://records.example',fetcher);
  expect((await service.refresh()).status).toBe('ready');expect(fetcher).toHaveBeenCalledTimes(1);const requested=new URL(String(fetcher.mock.calls[0]?.[0]));expect(requested.searchParams.get('boards')?.split(',')).toEqual(recordBoards.map(b=>b.boardId));
 });
 it('falls back once only for the currently deployed invalid_query response',async()=>{
  const calls:string[]=[];const fetcher=vi.fn(async(input:RequestInfo|URL)=>{calls.push(String(input));return calls.length===1?new Response('{"error":"invalid_query"}',{status:400}):new Response(JSON.stringify(response()),{status:200});});const service=new PublicBests('https://records.example',fetcher);
  expect((await service.refresh()).status).toBe('ready');expect(calls).toHaveLength(2);expect(new URL(calls[0]).searchParams.has('boards')).toBe(true);expect(new URL(calls[1]).search).toBe('');
 });
 it('accepts an old Worker that ignores the requested subset without relaxing unknown-board validation',async()=>{
  const service=new PublicBests('https://records.example',async()=>new Response(JSON.stringify(response()),{status:200}));expect((await service.refresh()).status).toBe('ready');
  const invalid=response();invalid.boards.push({...invalid.boards[0],board_id:'unrecognized.board'});const rejected=new PublicBests('https://records.example',async()=>new Response(JSON.stringify(invalid),{status:200}));expect((await rejected.refresh()).status).toBe('failed');
 });
 it('does not fall back on auth, throttling, unavailable or unrelated invalid input responses',async()=>{
  for(const [status,error]of [[400,'invalid_record_conditions'],[401,'unauthorized'],[429,'rate_limited'],[503,'records_preparing']] as const){const fetcher=vi.fn(async()=>new Response(JSON.stringify({error}),{status}));const service=new PublicBests('https://records.example',fetcher);expect((await service.refresh()).status).toBe(status===503?'preparing':'failed');expect(fetcher).toHaveBeenCalledTimes(1);}
 });
});
