import { afterEach, expect, it, vi } from 'vitest';
import { gameCatalog, historicalGameCatalog, gameDisplayNumbers, NEXT_GAME_NUMBER } from '../../src/data/gameCatalog';
import { recordBoards, getRecordDefinition } from '../../src/data/recordDefinitions';
import { readLocalRecord } from '../../src/records/localRecords';
import { publicStateLabel } from '../../src/records/PortalRecords';
import { readFileSync } from 'node:fs';

afterEach(()=>vi.unstubAllGlobals());
it('adopts037 with stable gap036, while only003 receives new completion declaration',()=>{
 expect(gameCatalog.find(g=>g.id==='game037')).toMatchObject({route:'./game037.html',releaseOrder:37,developmentStatus:'trial',difficulty:'standard'});
 expect(gameDisplayNumbers.get('game037')).toBe('028');expect(historicalGameCatalog.some(g=>g.id==='game036')).toBe(false);expect(NEXT_GAME_NUMBER).toBe(38);
 expect(gameCatalog.find(g=>g.id==='game003')?.developmentStatus).toBe('complete');
 expect(getRecordDefinition('game037')).toMatchObject({publicEnabled:false,maxValue:6000,rulesetId:'1'});
 expect(recordBoards.some(d=>d.gameId==='game037')).toBe(false);
 expect(publicStateLabel({status:'preparing',boards:new Map(),fetchedAt:null},getRecordDefinition('game037')!)).toBe('全体比較なし');
 const portal=readFileSync('src/portal/main.ts','utf8');expect(portal).toContain("if (game.id === 'game037') return;");expect(portal).toContain(':not([data-game-id="game037"])');
});
it('reads only bounded six-bento BEST without writing storage or enabling remote records',async()=>{
 const key='web-mini-arcade:v1:game037:best:rules1';let raw:string|null=null;
 const setItem=vi.fn();vi.stubGlobal('window',{localStorage:{getItem:(k:string)=>k===key?raw:null,setItem}});
 expect((await readLocalRecord('game037')).status).toBe('none');
 for(const best of [0,5558,6000]){raw=JSON.stringify({best});expect(await readLocalRecord('game037')).toMatchObject({status:'record',value:best});}
 for(const bad of [JSON.stringify({best:1234,padding:'x'.repeat(40)}),'not json','[]','null','{}',...[-1,6001,1.5,'5558'].map(best=>JSON.stringify({best}))]){raw=bad;expect((await readLocalRecord('game037')).status).toBe('unavailable');}
 expect(setItem).not.toHaveBeenCalled();
});
