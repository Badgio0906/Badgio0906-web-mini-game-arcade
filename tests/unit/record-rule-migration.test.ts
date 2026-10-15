import { describe, it, expect, vi, afterEach } from 'vitest';
import { recordBoards, getRecordDefinition } from '../../src/data/recordDefinitions';
import { isPublicBoardRegistered, isPublicRecordRegistered } from '../../src/records/remoteRegistration';
import { safeSubmission } from '../../src/records/submissionValidation';
import { validatePublicBests } from '../../src/records/PublicBests';
import { readLocalRecord } from '../../src/records/localRecords';
const prior=['game005.sorted.r1.all','game006.score.r2.all','game009.score.r2.all','game017.score.r1.all','game002.score.r1.all','game003.floors.r2.all','game015.depth.r03.all','game024.foods.r1.speed-4'];
afterEach(()=>vi.unstubAllGlobals());
describe('separate new rules preserve historical records',()=>{
 it('keeps old board payloads valid and registered without accepting a mixed new rule',()=>{
  for(const id of prior){const d=recordBoards.find(b=>b.boardId===id)!;expect(d).toBeDefined();expect(isPublicBoardRegistered(id)).toBe(true);expect(isPublicRecordRegistered(d.gameId)).toBe(false);
   const p={schema_version:1,submission_key:'00000000-0000-4000-8000-000000000001',run_result_id:'00000000-0000-4000-8000-000000000002',game_id:d.gameId,board_id:d.boardId,ruleset_id:d.rulesetId,game_build:'prior-version',environment:'production',value:1,withdrawal_receipt:'a'.repeat(64),allowed_result_metadata:{finalized:true,mode_id:d.modeId,assistance:d.assistancePolicy,duration_ms:1000,outcome:'complete'}};
   expect(safeSubmission(p)?.board_id).toBe(id);expect(safeSubmission({...p,ruleset_id:getRecordDefinition(d.gameId)!.rulesetId})).toBeNull();
   expect(isPublicBoardRegistered(getRecordDefinition(d.gameId)!.boardId)).toBe(false);
  }
 });
 it('accepts all previously served boards while new boards remain preparing',()=>{
  const at='2026-10-15T00:00:00Z';const defs=recordBoards.filter(b=>isPublicBoardRegistered(b.boardId));
  const fixture={schema_version:1,definition_version:'1',cache_ttl_seconds:60,generated_at:at,boards:defs.map(d=>({game_id:d.gameId,board_id:d.boardId,metric_id:d.metricId,value:null,unit:d.unit,mode_label:d.modeLabel,ruleset_id:d.rulesetId,status:'empty',collected_since:at,revision:0}))};
  expect(validatePublicBests(fixture).size).toBe(20);
 });
 it('never relabels old scalar/snake BEST as new-rule BEST',async()=>{
  const values=new Map([['web-mini-arcade:v1:game002:bestScore','123'],['web-mini-arcade:v1:game003:rules2:best','42'],['web-mini-arcade:v1:game015:best','400'],['web-mini-arcade:v1:game024:state',JSON.stringify({game_id:'game024',rules_version:'1',stats:{best:{4:12,6:23,8:34}}})]]);
  const snapshot=[...values];vi.stubGlobal('window',{localStorage:{getItem:(k:string)=>values.get(k)??null}});
  for(const id of ['game002','game003','game015','game024'])expect((await readLocalRecord(id)).status).toBe('legacy');
  expect([...values]).toEqual(snapshot);
 });
});
