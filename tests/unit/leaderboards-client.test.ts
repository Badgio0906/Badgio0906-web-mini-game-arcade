import { describe, expect, it, vi } from 'vitest';
import { recordBoards } from '../../src/data/recordDefinitions';
import { Leaderboards, validateLeaderboard } from '../../src/records/Leaderboards';
import { PublicBests } from '../../src/records/PublicBests';
import { formatRecordValue } from '../../src/records/PortalRecords';
const def=recordBoards[0], at='2026-10-09T00:00:00Z';
const fixture=(revision=1, values=[600,500,400,0])=>({schema_version:1,board_id:def.boardId,game_id:def.gameId,metric_label:def.metricLabel,
  mode_label:def.modeLabel,ruleset_id:def.rulesetId,direction:def.direction,unit:def.unit,generated_at:at,revision,cache_ttl_seconds:60,
  entries:values.map((value,i)=>({rank:i+1,public_label:`ガレージ住人 ${String(i).padStart(12,'0')}`,value,received_at:at}))});
describe('leaderboard public client',()=>{
  it('renders large integer decimeters exactly rather than collapsing adjacent decimal scores',()=>{
    const distance=recordBoards.find(d=>d.gameId==='game018')!;
    expect(formatRecordValue(Number.MAX_SAFE_INTEGER,distance)).toBe('900,719,925,474,099.1 m');
    expect(formatRecordValue(Number.MAX_SAFE_INTEGER-4,distance)).toBe('900,719,925,474,098.7 m');
    expect(formatRecordValue(Number.MAX_SAFE_INTEGER-3,distance)).toBe('900,719,925,474,098.8 m');
    expect(formatRecordValue(0,distance)).toBe('0.0 m');
  });
  it('keeps zero and ties, strips server-only metadata, and rejects duplicate participants or misordered values',()=>{
    const f=fixture(1,[600,600,0]);
    expect(validateLeaderboard({...f,credential_hash:'neverkeep',entries:f.entries.map(e=>({...e,participant_id:'neverkeep'}))},def)).toEqual(f);
    expect(()=>validateLeaderboard({...f,entries:[...f.entries,f.entries[0]]},def)).toThrow();
    expect(()=>validateLeaderboard(fixture(1,[0,600]),def)).toThrow();
    expect(()=>validateLeaderboard({...f,board_id:'game010.score.r1.all'},def)).toThrow();
    expect(()=>validateLeaderboard({...f,entries:f.entries.map(e=>({...e,public_label:'任意名'}))},def)).toThrow();
    expect(()=>validateLeaderboard(fixture(1,Array(11).fill(1)),def)).toThrow();
  });
  it('validates lower direction without altering scores or order',()=>{
    const lower={...def,direction:'lower' as const};
    expect(validateLeaderboard({...fixture(1,[0,10,10]),direction:'lower'},lower).entries.map(e=>e.value)).toEqual([0,10,10]);
    expect(()=>validateLeaderboard({...fixture(1,[10,0]),direction:'lower'},lower)).toThrow();
  });
  it('does no network work without endpoint, and refuses non-public/unknown boards',async()=>{
    const fetcher=vi.fn();const api=new Leaderboards(null,fetcher);
    expect(await api.load(def.boardId)).toEqual({status:'preparing'});expect(fetcher).not.toHaveBeenCalled();
    await expect(api.load('game031.mined.r1.current-world')).rejects.toThrow('unknown_board');
  });
  it('uses open-only identifier-free GET, reuses inflight and cached result, then expires at sixty seconds',async()=>{
    let now=0;const fetcher=vi.fn().mockImplementation(()=>Promise.resolve(new Response(JSON.stringify(fixture()))));
    const api=new Leaderboards('https://records-fixture.test',fetcher,()=>now);
    expect(fetcher).not.toHaveBeenCalled();await Promise.all([api.load(def.boardId),api.load(def.boardId)]);await api.load(def.boardId);
    expect(fetcher).toHaveBeenCalledTimes(1);const [url,init]=fetcher.mock.calls[0];
    expect(url).toBe(`https://records-fixture.test/v1/records/public/leaderboard?board_id=${def.boardId}`);
    expect(init).toMatchObject({method:'GET',credentials:'omit',referrerPolicy:'no-referrer'});expect(init.headers).toBeUndefined();
    now=60000;await api.load(def.boardId);expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('keeps stale failure only when revision meets the latest BEST and never regresses cache',async()=>{
    let now=0;const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(fixture(2)))).mockRejectedValueOnce(Error('network')).mockResolvedValueOnce(new Response(JSON.stringify(fixture(1))));
    const api=new Leaderboards('https://records-fixture.test',fetcher,()=>now);
    await api.load(def.boardId);now=60001;expect((await api.load(def.boardId)).status).toBe('stale');
    expect(await api.load(def.boardId,3)).toEqual({status:'failed'});
  });
  it('invalidates old cached TOP10 for newer BEST and rejects an older in-flight snapshot',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(fixture(1)))).mockResolvedValueOnce(new Response(JSON.stringify(fixture(1))));
    const api=new Leaderboards('https://records-fixture.test',fetcher);
    await api.load(def.boardId,1);expect(await api.load(def.boardId,2)).toEqual({status:'failed'});expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('reconciles BEST with TOP1, prevents lower revision overwrite, and rejects same revision disagreement',async()=>{
    const batch=()=>({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:at,boards:recordBoards.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:at,revision:0}))});
    const api=new PublicBests('https://records-fixture.test',vi.fn().mockResolvedValue(new Response(JSON.stringify(batch()))));
    expect(api.acceptLeaderboardSnapshot(def.boardId,2,600,at)).toBe(true);await api.refresh();
    expect(api.getState().boards.get(def.boardId)).toMatchObject({revision:2,value:600});
    expect(api.acceptLeaderboardSnapshot(def.boardId,1,700,at)).toBe(false);
    expect(api.acceptLeaderboardSnapshot(def.boardId,2,700,at)).toBe(false);
    expect(api.acceptLeaderboardSnapshot(def.boardId,3,null,at)).toBe(true);
  });
  it('does not retain 503/failed responses in the success cache',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(new Response('',{status:503})).mockResolvedValueOnce(new Response('',{status:500})).mockResolvedValueOnce(new Response(JSON.stringify(fixture(1,[]))));
    const api=new Leaderboards('https://records-fixture.test',fetcher);
    expect(await api.load(def.boardId)).toEqual({status:'preparing'});expect(await api.load(def.boardId)).toEqual({status:'failed'});
    expect(await api.load(def.boardId)).toMatchObject({status:'ready',board:{entries:[]}});
  });
});
