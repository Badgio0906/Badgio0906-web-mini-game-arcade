import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { gameCatalog, historicalGameCatalog, NEXT_GAME_NUMBER } from '../../src/data/gameCatalog';
import { gameVersions } from '../../src/data/gameVersions';
import { recordBoards, getRecordDefinition } from '../../src/data/recordDefinitions';
import { FishingBestStore, validateFishingBest, FISHING_BEST_KEY, MAX_FISHING_SCORE } from '../../src/games/game032/Save';
import { readLocalRecord } from '../../src/records/localRecords';
import { PublicBests, validatePublicBests } from '../../src/records/PublicBests';
import { publicStateLabel } from '../../src/records/PortalRecords';
import { Leaderboards } from '../../src/records/Leaderboards';
import { safeSubmission } from '../../src/records/submissionValidation';
import { createGameRecordSession } from '../../src/records/RecordSharing';
import { isPublicRecordRegistered, PENDING_RECORD_GAME_IDS } from '../../src/records/remoteRegistration';
import { isRemoteGameRegistered, PENDING_WORKER_GAME_IDS } from '../../src/analytics/remoteRegistration';
import { sanitizeAnalyticsData, isAnalyticsEnvelope, type AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';
import { aggregateExport } from '../../src/analytics-admin/export';
import { parseOptions, fetchAnalyticsContext } from '../../scripts/fetch-analytics-context.mjs';

const best = (score:number) => ({ game_id:'game032', rules_version:'1', save_version:1, mode_id:'standard', score });
const publicFixture = (includeNew=false) => ({schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:'2026-10-10T00:00:00Z',boards:recordBoards.filter(d=>includeNew||d.gameId!=='game032').map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:'2026-10-09T00:00:00Z',revision:0}))});
const envelope:AnalyticsEnvelope = {schema_version:2,event_id:'00000000-0000-4000-8000-000000000001',occurred_at:'2026-10-10T00:00:00.000Z',game_id:'game032',game_version:'prototype-1',rules_version:'1',presentation_version:'prototype-1',browser_id:'00000000-0000-4000-8000-000000000002',visit_id:'synthetic-visit',session_id:'synthetic-page',run_id:'synthetic-run',event_name:'specific_game_events',environment:'synthetic',device_class:'mobile',input_type:'touch',page:'game032.html',data:{event:'fish_landed',mode:'standard',fish_id:'yamame',spot_id:'rocks',size_cm:24.5,points:160,rare:false,big:false}};
afterEach(()=>vi.unstubAllGlobals());

describe('Game032 new registration preserves existing discovery and records',()=>{
  it('adds only032 as trial and leaves010 retired and old boards available',()=>{
    expect(gameCatalog).toHaveLength(31);expect(historicalGameCatalog).toHaveLength(32);expect(NEXT_GAME_NUMBER).toBe(33);
    expect(gameCatalog.at(-1)).toMatchObject({id:'game032',titleJa:'川辺で、ひとやすみ。',titleEn:'RIVER SIDE FISHING',route:'./game032.html',releaseOrder:32,developmentStatus:'trial',difficulty:'standard'});
    expect(historicalGameCatalog.find(g=>g.id==='game010')?.status).toBe('retired');
    expect(gameVersions.game032).toEqual({rules_version:'1',presentation_version:'prototype-2'});
    expect(recordBoards).toHaveLength(21);expect(getRecordDefinition('game032')).toMatchObject({boardId:'game032.score.r1.standard',modeId:'standard',rulesetId:'1',assistancePolicy:'none',maxValue:MAX_FISHING_SCORE,publicEnabled:true});
    expect([...PENDING_RECORD_GAME_IDS]).toEqual(['game032']);expect(isPublicRecordRegistered('game018')).toBe(true);expect(isPublicRecordRegistered('game032')).toBe(false);
    for(let n=21;n<=32;n++)expect(PENDING_WORKER_GAME_IDS.has(`game${String(n).padStart(3,'0')}`)).toBe(true);
    expect(isRemoteGameRegistered('game032')).toBe(false);expect(isRemoteGameRegistered('game020')).toBe(true);
  });
  it('accepts currently served20 without breaking any old BEST; missing old board still fails',async()=>{
    const fixture=publicFixture(),validated=validatePublicBests(fixture);expect(validated.size).toBe(20);
    expect(publicStateLabel({status:'ready',boards:validated},getRecordDefinition('game018')!)).toBe('まだ記録なし');
    expect(publicStateLabel({status:'ready',boards:validated},getRecordDefinition('game032')!)).toBe('準備中');
    expect(()=>validatePublicBests({...fixture,boards:fixture.boards.slice(1)})).toThrow('missing_public_board');
    expect(validatePublicBests(publicFixture(true)).size).toBe(21);
    expect(()=>validatePublicBests({...fixture,boards:[...fixture.boards,fixture.boards[0]]})).toThrow('invalid_public_board');
    const fetcher=vi.fn(async()=>Response.json(fixture));const api=new PublicBests('https://fixture.example',fetcher);
    expect((await api.refresh()).status).toBe('ready');expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not contact an unknown production ranking032 and never starts sharing identity',async()=>{
    const fetcher=vi.fn();expect(await new Leaderboards('https://fixture.example',fetcher).load('game032.score.r1.standard')).toEqual({status:'preparing'});expect(fetcher).not.toHaveBeenCalled();
    const storage={getItem:vi.fn(),setItem:vi.fn()};vi.stubGlobal('localStorage',storage);vi.stubGlobal('window',{localStorage:storage});
    const session=createGameRecordSession('game032');session.startRun('synthetic-run');session.complete(100,{modeId:'standard',metadata:{outcome:'complete'}});
    expect(storage.getItem).not.toHaveBeenCalled();expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('keeps032 result eligibility tied to completed standard five-minute outings',()=>{
    const payload={schema_version:1,submission_key:'00000000-0000-4000-8000-000000000001',run_result_id:'00000000-0000-4000-8000-000000000002',game_id:'game032',board_id:'game032.score.r1.standard',ruleset_id:'1',game_build:'prototype-1',environment:'production',value:0,withdrawal_receipt:'a'.repeat(64),allowed_result_metadata:{finalized:true,mode_id:'standard',assistance:'none',duration_ms:300000,outcome:'complete'}};
    expect(safeSubmission(payload)?.value).toBe(0);
    for(const patch of [{duration_ms:299999},{outcome:'quit'},{outcome:'milestone'},{mode_id:'practice'},{assistance:'allowed'}])expect(safeSubmission({...payload,allowed_result_metadata:{...payload.allowed_result_metadata,...patch}})).toBeNull();
    expect(safeSubmission({...payload,allowed_result_metadata:{...payload.allowed_result_metadata,duration_ms:480000}})).not.toBeNull();
  });
  it('matches manifest/profile/export and keeps generated catalog current',()=>{
    const manifest=JSON.parse(readFileSync('src/games/game032/game.manifest.json','utf8')),profile=JSON.parse(readFileSync('jev_export/game_profiles/game032.json','utf8')),catalog=JSON.parse(readFileSync('jev_export/game_profiles/catalog.json','utf8'));
    expect(profile.currentManifest).toEqual(manifest);expect(manifest.recordBoard).toBe('game032.score.r1.standard');expect(manifest.timeLimit).toBe(300);expect(manifest.creditMode).toBe('free');expect(catalog.gameCatalog).toEqual(gameCatalog);expect(catalog.gameCount).toBe(31);
  });
});

describe('validated local completed standard BEST',()=>{
  it('practice and unfinished outing cannot write, then completed zero and maximum survive reload',async()=>{
    const values=new Map<string,string>(),backend={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)};
    const store=new FishingBestStore(backend);expect(store.best()).toBeNull();expect(store.record(5000,'practice',true)).toBe(false);expect(store.record(5000,'standard',false)).toBe(false);expect(values.size).toBe(0);
    expect(store.record(0,'standard',true)).toBe(true);expect(store.record(100,'standard',true)).toBe(true);expect(store.record(99,'standard',true)).toBe(false);expect(new FishingBestStore(backend).best()).toBe(100);
    vi.stubGlobal('window',{localStorage:backend});expect(await readLocalRecord('game032')).toMatchObject({status:'record',value:100});expect(values.size).toBe(1);expect([...values.keys()]).toEqual([FISHING_BEST_KEY]);
  });
  it('rejects malformed, nonstandard, out-of-bounds or additional personal fields',async()=>{
    for(const value of [null,[],{...best(3),mode_id:'practice'},{...best(3),rules_version:'2'},{...best(3),save_version:2},{...best(3),game_id:'game031'},{...best(3),browser_id:'private'},best(-1),best(Infinity),best(1.5),best(MAX_FISHING_SCORE+1)])expect(validateFishingBest(value)).toBeNull();
    for(const raw of ['not-json',JSON.stringify({...best(10),mode_id:'practice'})]){vi.stubGlobal('window',{localStorage:{getItem:()=>raw}});expect((await readLocalRecord('game032')).status).toBe('unavailable');}
    vi.stubGlobal('window',{localStorage:{getItem:()=>null}});expect((await readLocalRecord('game032')).status).toBe('none');
  });
  it('retains page-memory best when persistent storage fails without claiming reload persistence',()=>{
    const store=new FishingBestStore({getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});expect(store.record(220,'standard',true)).toBe(true);expect(store.best()).toBe(220);expect(store.record(NaN,'standard',true)).toBe(false);
    expect(new FishingBestStore({getItem:()=>null,setItem:()=>{}}).best()).toBeNull();
  });
});

describe('anonymous fishing Analytics allowlist and Codex CLI',()=>{
  it('accepts implemented032 coarse fishing primitives; excludes unused033 and private/free text',()=>{
    expect(isAnalyticsEnvelope(envelope)).toBe(true);expect(isAnalyticsEnvelope({...envelope,game_id:'game033',page:'game033.html'})).toBe(false);
    expect(sanitizeAnalyticsData({...envelope.data,player_name:'private',fish_id:'free text',spot_id:'made-up',max_size_cm:-1,fish_count:1.5,window_ms:Infinity})).toEqual({event:'fish_landed',mode:'standard',size_cm:24.5,points:160,rare:false,big:false});
    expect(isAnalyticsEnvelope({...envelope,data:{...envelope.data,spot_id:'free text'}})).toBe(false);
    expect(isAnalyticsEnvelope({...envelope,data:{event:'cast_released',distance:'medium',charge_ms:650,spot_id:'shallows'}})).toBe(true);
    expect(isAnalyticsEnvelope({...envelope,data:{event:'run_end',score:100,fish_count:2,max_size_cm:20.4,completed:true}})).toBe(true);
  });
  it('exports only whitelisted fishing aggregates and preserves unknown averages as null',()=>{
    const source={schema_version:1,environment:'synthetic',games:[{game_id:'game032',fishing_summary:{cast_count:2,spot_cast_counts:{rocks:2,browser_id:99},fish_hooked_counts:{yamame:1,private_name:3},landed_event_count:1,completed_outing_count:1,average_fish_per_completed_outing:1,average_score:null,sample_size_small:true,coverage:'observed-standard-events-only',run_id:'private-run'}}]};
    const exported=aggregateExport(source),text=JSON.stringify(exported);expect(text).not.toContain('private');expect(text).not.toContain('browser_id');expect(text).not.toContain('run_id');
    expect((exported.games as {fishing_summary:unknown}[])[0].fishing_summary).toMatchObject({cast_count:2,spot_cast_counts:{rocks:2},average_score:null,sample_size_small:true});
  });
  it('requests032 through aggregate Codex GET with no raw ID/secret URL fields',async()=>{
    expect(parseOptions(['--game','game032']).game).toBe('game032');expect(()=>parseOptions(['--game','game033'])).toThrow('invalid_game');
    const token='local-synthetic-fixture-only';const result=await fetchAnalyticsContext(['--game','game032','--environment','synthetic'],{ANALYTICS_CODEX_TOKEN:token},async(url:URL,options:RequestInit)=>{
      expect(url.pathname).toBe('/v1/codex/game/game032');expect(url.href).not.toContain(token);expect(options.method).toBe('GET');return Response.json({schema_version:1,environment:'synthetic',period:{from:url.searchParams.get('from'),to:url.searchParams.get('to')},game:{game_id:'game032',run_count:0}});
    },new Date('2026-10-10T00:00:00Z'));expect(result.data.game.game_id).toBe('game032');
  });
});
