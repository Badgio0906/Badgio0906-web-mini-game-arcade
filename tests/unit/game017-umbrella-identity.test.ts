import {afterEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {gameCatalog,gameDisplayNumbers} from '../../src/data/gameCatalog';
import {getRecordDefinition} from '../../src/data/recordDefinitions';
import {readLocalRecord} from '../../src/records/localRecords';
import {RainStore} from '../../src/games/game017/revision03/save';
afterEach(()=>vi.unstubAllGlobals());
it('binds visible014 to existing017 without changing the finger-heart ID or adding038',()=>{
 expect(gameDisplayNumbers.get('game017')).toBe('014');
 expect(gameCatalog.find(g=>g.id==='game017')?.route).toBe('./game017.html');
 expect(gameCatalog.find(g=>g.id==='game014')?.route).toBe('./games/finger-heart-challenge/index.html');
 expect(gameCatalog.some(g=>g.id==='game038')).toBe(false);
 const manifest=JSON.parse(readFileSync('src/games/game017/revision03/game.manifest.json','utf8'));
 expect(manifest).toMatchObject({id:'game017',displayNumber:'014',rulesVersion:3,canonicalRoute:'./game017.html',candidateRoute:'./game017-revision03.html'});
 expect(getRecordDefinition('game017')).toMatchObject({rulesetId:'2',boardId:'game017.score.r2.all'});
});
it('preserves both older rain BESTs and ignores the mistakenly separate038 save',async()=>{
 const values=new Map([['web-mini-arcade:v1:game017:best','313'],['web-mini-arcade:v1:game017:bestRelayV2','4242'],['web-mini-arcade:v1:game038:best-r1','777']]);
 const writes:string[]=[];const backend={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{writes.push(k);values.set(k,v);}};
 const store=new RainStore(backend);expect(store.best()).toBeNull();expect(store.legacyBests()).toEqual({original:313,relay:4242});expect(writes).toEqual([]);
 expect(store.offer(1910,true,false)).toBe(true);store.learn();store.mute(true);
 expect(writes).toEqual(['web-mini-arcade:v1:game017:umbrella-r3:best','web-mini-arcade:v1:game017:umbrella-r3:learned','web-mini-arcade:v1:game017:umbrella-r3:mute']);
 expect(values.get('web-mini-arcade:v1:game017:best')).toBe('313');expect(values.get('web-mini-arcade:v1:game017:bestRelayV2')).toBe('4242');expect(values.get('web-mini-arcade:v1:game038:best-r1')).toBe('777');
 vi.stubGlobal('window',{localStorage:backend});expect(await readLocalRecord('game017')).toMatchObject({status:'record',value:4242});expect(new RainStore(backend).best()).toBe(1910);
});
