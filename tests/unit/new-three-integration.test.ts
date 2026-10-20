import { describe, it, expect, vi, afterEach } from 'vitest';
import { gameCatalog, hiddenGameCatalog, retiredGameCatalog, historicalGameCatalog, gameDisplayNumbers } from '../../src/data/gameCatalog';
import { getRecordDefinition, recordBoards } from '../../src/data/recordDefinitions';
import { readLocalRecord } from '../../src/records/localRecords';
import { isRemoteGameRegistered } from '../../src/analytics/remoteRegistration';
import { isPublicRecordRegistered } from '../../src/records/remoteRegistration';
import { readFileSync } from 'node:fs';
afterEach(()=>vi.unstubAllGlobals());
describe('final three independent releases',()=>{
 it('appends 033–035 as trial without changing the author completion list or old routes',()=>{
  expect([gameCatalog.length,hiddenGameCatalog.length,retiredGameCatalog.length,historicalGameCatalog.length]).toEqual([26,0,4,35]);
  for(const [i,id]of ['game033','game034','game035'].entries()){
   expect(gameCatalog.find(g=>g.id===id)).toMatchObject({developmentStatus:'trial',releaseOrder:33+i,route:`./${id}.html`});
   expect(gameDisplayNumbers.get(id)).toBe(String(24+i).padStart(3,'0'));
   expect(getRecordDefinition(id)?.publicEnabled).toBe(true);
   expect(isRemoteGameRegistered(id)).toBe(false);expect(isPublicRecordRegistered(id)).toBe(true);
   expect(readFileSync(id+'.html','utf8')).toContain('/src/games/'+id+'/main.ts');
  }
  expect(new Set(recordBoards.map(d=>d.boardId)).size).toBe(recordBoards.length);
 });
 it('reads only completed new-game bests from their own namespaces',async()=>{
  const values=new Map<string,string>([['web-mini-arcade:v1:game033:best','2400'],['web-mini-arcade:v1:game034:best-rules-v1','1498'],['web-mini-arcade:v1:game035:state',JSON.stringify({game_id:'game035',rules_version:'1',best:4853})]]);
  vi.stubGlobal('window',{localStorage:{getItem:(k:string)=>values.get(k)??null}});
  expect((await readLocalRecord('game033')).value).toBe(2400);expect((await readLocalRecord('game034')).value).toBe(1498);expect((await readLocalRecord('game035')).value).toBe(4853);
  values.set('web-mini-arcade:v1:game035:state',JSON.stringify({game_id:'game035',rules_version:'1',best:15001}));expect((await readLocalRecord('game035')).status).toBe('unavailable');
 });
});
